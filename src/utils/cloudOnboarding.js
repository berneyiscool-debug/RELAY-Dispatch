// ============================================
// RELAY — CLOUD ONBOARDING
// ============================================
// Signing up for RELAY Cloud has three steps that can be interrupted between
// any two of them: create the Supabase user, claim the company name, then pay.
// This module holds the shared pieces so every entry point (the launch screen,
// the local→cloud upgrade modal and the paywall page) behaves the same way:
//
//   • how an email is turned into the address Supabase actually stores
//   • what a signUp() result really means (duplicate emails fake-succeed)
//   • the tab-scoped markers that let a flow resume after the Stripe redirect
//   • the profile → session-user mapping the app reads on boot
//
// Payment is deliberately NOT here: see utils/subscription.js.

import { supabase } from './supabase.js';
import { store } from '../data/store.js';
import { setSessionUser } from '../pages/auth/session.js';

export const PENDING_SIGNUP_KEY = 'relay_pending_cloud_signup';
export const PENDING_MIGRATION_KEY = 'relay_pending_cloud_migration';

const LOCAL_ACCOUNTS_KEY = 'relay_accounts';
const ACTIVE_ACCOUNT_KEY = 'relay_active_account';

// A marker older than this belongs to an abandoned attempt (the browser sat on
// Stripe overnight) and must not hijack a later sign-in.
const MARKER_MAX_AGE_MS = 24 * 60 * 60 * 1000;

// The legacy namespace some early accounts were created under; sign-in still has
// to accept it, so it stays pinned here rather than being derived.
const LEGACY_RELAY_DOMAIN = '.RELAY.internal';

// sessionStorage keeps onboarding markers scoped to the tab that started the
// flow — Stripe returns to that same tab, but a second tab must not inherit a
// half-finished signup. Falls back to memory when storage is unavailable.
const memoryTab = new Map();
const hasSessionStorage = (() => {
  try {
    return typeof sessionStorage !== 'undefined' && !!sessionStorage;
  } catch (_) {
    return false;
  }
})();

function tabRead(key) {
  if (!hasSessionStorage) return memoryTab.has(key) ? memoryTab.get(key) : null;
  try {
    return sessionStorage.getItem(key);
  } catch (_) {
    return memoryTab.has(key) ? memoryTab.get(key) : null;
  }
}

function tabWrite(key, value) {
  memoryTab.set(key, value);
  if (!hasSessionStorage) return;
  try {
    sessionStorage.setItem(key, value);
  } catch (_) { /* private mode — memory copy still works for this tab */ }
}

function tabRemove(key) {
  memoryTab.delete(key);
  if (!hasSessionStorage) return;
  try {
    sessionStorage.removeItem(key);
  } catch (_) { /* non-fatal */ }
}

function writeMarker(key, payload) {
  tabWrite(key, JSON.stringify({ ...payload, createdAt: Date.now() }));
}

function readMarker(key) {
  const raw = tabRead(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (!parsed.createdAt || Date.now() - parsed.createdAt > MARKER_MAX_AGE_MS) {
      tabRemove(key);
      return null;
    }
    return parsed;
  } catch (_) {
    tabRemove(key);
    return null;
  }
}

/** Remember a signup that hasn't been paid for yet. */
export function savePendingSignup(payload) {
  writeMarker(PENDING_SIGNUP_KEY, payload);
}

export function readPendingSignup() {
  return readMarker(PENDING_SIGNUP_KEY);
}

export function clearPendingSignup() {
  tabRemove(PENDING_SIGNUP_KEY);
}

/** Remember a local→cloud conversion that is waiting on payment. */
export function savePendingMigration(payload) {
  writeMarker(PENDING_MIGRATION_KEY, payload);
}

export function readPendingMigration() {
  return readMarker(PENDING_MIGRATION_KEY);
}

export function clearPendingMigration() {
  tabRemove(PENDING_MIGRATION_KEY);
}

/**
 * Every email alias a sign-in attempt should try, most likely first.
 *
 * The launch screen has always rewritten a dotless domain to the internal
 * `@<domain>.relay.internal` form, but signup stored whatever was typed — so
 * someone who registered as `admin@acme` could never sign in as `admin@acme`.
 * Trying candidates is backward compatible with both spellings instead of
 * forcing a migration.
 * @param {string} rawInput
 * @returns {string[]}
 */
export function authEmailCandidates(rawInput) {
  const raw = String(rawInput == null ? '' : rawInput).trim();
  if (!raw) return [];

  const candidates = [raw];
  const at = raw.lastIndexOf('@');
  if (at > 0) {
    const local = raw.slice(0, at).toLowerCase();
    const domain = raw.slice(at + 1).toLowerCase();
    if (domain && !domain.includes('.')) {
      candidates.push(`${local}@${domain}.relay.internal`);
      candidates.push(`${local}@${domain}${LEGACY_RELAY_DOMAIN}`);
    } else if (domain.endsWith('.relay.internal')) {
      const base = domain.slice(0, -'.relay.internal'.length);
      // Accounts created by the original launch screen used an upper-case
      // suffix, so both spellings have to be attempted here too.
      candidates.push(`${local}@${base}.relay.internal`);
      candidates.push(`${local}@${base}${LEGACY_RELAY_DOMAIN}`);
    }
  }
  return [...new Set(candidates)];
}

// The email to store for a NEW account, i.e. the same normalisation sign-in
// applies first (see authEmailCandidates). Keeping the two in step is what stops
// signup/sign-in drift: registering as `admin@acme` must produce an account that
// `admin@acme` can sign back into.
export function canonicalAuthEmail(rawInput) {
  const raw = String(rawInput == null ? '' : rawInput).trim();
  const at = raw.lastIndexOf('@');
  if (at <= 0) return raw;
  const local = raw.slice(0, at).toLowerCase();
  const domain = raw.slice(at + 1);
  if (!domain) return raw;
  if (!domain.includes('.')) return `${local}@${domain.toLowerCase()}.relay.internal`;
  if (domain.toLowerCase().endsWith('.relay.internal')) return `${local}@${domain.toLowerCase()}`;
  return raw;
}

function isInvalidCredentials(error) {
  if (!error) return false;
  const code = String(error.code || '');
  const message = String(error.message || '').toLowerCase();
  return code === 'invalid_credentials' || message.includes('invalid login credentials');
}

/**
 * Sign in, retrying the internal-domain aliases. Only "invalid credentials" is
 * retried — a rate limit or network failure would fail identically for every
 * candidate and must be surfaced as-is.
 * @returns {Promise<{ data: any, error: any }>}
 */
export async function signInWithEmailCandidates(rawInput, password) {
  const candidates = authEmailCandidates(rawInput);
  if (!candidates.length) {
    return { data: null, error: new Error('Enter your email address and password.') };
  }

  let last = null;
  for (const email of candidates) {
    const result = await supabase.auth.signInWithPassword({ email, password });
    if (!result.error) return result;
    last = result;
    if (!isInvalidCredentials(result.error)) break;
  }
  return last;
}

/**
 * Interpret a signUp() response.
 *
 * Supabase hides duplicate registration behind a fake success (no error, empty
 * `identities`) so it can't be used to enumerate accounts. Without this check
 * that fake success looks exactly like "check your inbox", which is how a user
 * who already had an account ends up stuck at the paywall holding no session.
 *
 * @returns {{ userId: string, needsConfirmation: boolean }}
 * @throws when the signup did not produce a usable user
 */
export function describeSignUpResult({ data, error } = {}) {
  if (error) throw error;
  const user = data?.user;
  if (!user) {
    throw new Error('Verification required or signup was blocked. Check your email inbox.');
  }
  if (Array.isArray(user.identities) && user.identities.length === 0) {
    throw new Error('An account already exists for that email address. Sign in instead, or reset your password.');
  }
  return { userId: user.id, needsConfirmation: !data.session };
}

/** Load the profile row the app's session user is built from. */
export async function fetchProfile(userId) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) {
    console.error('Failed to fetch user profile:', error);
    throw new Error(`Your user profile could not be found: ${error.message} (${error.code})`);
  }
  return profile;
}

/**
 * Build the session user from a profile row. The shape (and the legacy company
 * id special case) is what the rest of the app reads on boot, so it lives here
 * once instead of being re-derived per entry point.
 * @param {object} profile
 * @param {string} [fallbackColor]
 */
export function sessionUserFromProfile(profile, fallbackColor = '#3B82F6') {
  const companyId = profile.company_id;
  const isLegacyCompany = companyId === '8dc14565-23c2-4f7d-aeb3-1da615df7644';
  const roleSuffix = profile.role === 'admin' ? 'ut_admin' : 'ut_tech';

  return {
    id: profile.id,
    companyId,
    name: profile.name,
    role: profile.role,
    userTypeName: profile.role === 'admin' ? 'Admin' : (profile.role === 'manager' ? 'Manager' : 'Technician'),
    userTypeId: profile.user_type_id
      || (isLegacyCompany ? roleSuffix : `${companyId}_${roleSuffix}`),
    color: profile.color || fallbackColor,
    avatarUrl: profile.avatar_url || null,
  };
}

/**
 * Drop the local account that has just been copied into the cloud, so the
 * launch screen stops offering it. Only ever call this AFTER a successful
 * migrateLocalToCloud() — the local data is the backup until the copy lands.
 */
export function forgetLocalAccount(localAccountId) {
  const accountId = localAccountId;
  if (!accountId) return;
  try {
    const stored = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
    const accounts = stored ? JSON.parse(stored) : [];
    localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts.filter(a => a.id !== accountId)));
  } catch (e) {
    console.error('Error reading local accounts:', e);
  }
  try {
    store.deleteLocalAccountData(accountId);
  } catch (e) {
    console.error('Failed to clear migrated local data:', e);
  }
}

/**
 * Finish a paid local→cloud conversion: copy the local data up, retire the local
 * account, and start the cloud session.
 *
 * Order matters and is the whole point of this being one function — the local
 * workspace is only deleted once the migration has actually succeeded, so a
 * failure here leaves the user with their data intact.
 */
export async function completeCloudMigration({ userId, companyId, localAccountId, profile, color } = {}) {
  const activeLocalId = localAccountId || tabRead(ACTIVE_ACCOUNT_KEY) || null;

  await store.migrateLocalToCloud(companyId, userId);
  forgetLocalAccount(activeLocalId);
  tabRemove(ACTIVE_ACCOUNT_KEY);
  clearPendingMigration();

  const row = profile || await fetchProfile(userId);
  const user = sessionUserFromProfile(row, color || '#FF5C00');
  setSessionUser(user);
  return user;
}
