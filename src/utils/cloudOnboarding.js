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
//   • the signup form's rules (password strength, friendly auth errors)
//   • the profile → session-user mapping the app reads on boot
//
// Payment is deliberately NOT here: see utils/subscription.js.

import { supabase } from './supabase.js';
import { store } from '../data/store.js';
import { setSessionUser } from '../pages/auth/session.js';
import { TRIAL_DAYS } from './subscription.js';

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

// The shortest password a new cloud account may be created with. The form and
// the submit handler both read this, so they can never disagree.
export const MIN_PASSWORD_LENGTH = 8;

// How long "Resend verification email" stays disabled after a successful send.
// Supabase rate-limits the send itself; this only has to stop the obvious
// double-click, so a minute is plenty and is short enough not to be a nuisance.
export const RESEND_COOLDOWN_MS = 60 * 1000;
const RESEND_COOLDOWN_KEY = 'relay_resend_cooldown';

// Where the in-app Terms and Privacy documents live until the published pages
// are ready to link to. Kept here so every entry point points at the same place.
export const TERMS_ROUTE = '#/terms';
export const PRIVACY_ROUTE = '#/privacy';

// The free trial every new cloud company starts with. No card is taken, so this
// is the only length that matters to the client — the server clamps it again in
// start_cloud_trial() and owns the dates. Owned by the billing module and
// re-exported here so the trial banner and the signup flow can never disagree.
export { TRIAL_DAYS };

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

/**
 * Score a password for the signup form's strength hint.
 *
 * Deliberately cheap and local: this nudges someone away from "password1", it is
 * not an entropy model. Length is weighted highest because it is the one change
 * that reliably helps.
 *
 * @param {string} password
 * @returns {{ score: number, label: string, hint: string, ok: boolean }}
 */
export function passwordStrength(password) {
  const value = String(password == null ? '' : password);
  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/]
    .filter(re => re.test(value)).length;

  // Repetitive or sequential input passes a character-class count but is weak in
  // practice, so it is capped below the score its length would otherwise earn.
  const lower = value.toLowerCase();
  const isRepetitive = value.length > 0 && /^(.)\1+$/.test(value);
  const isSequential = /(?:012|123|234|345|456|567|678|789|abc|bcd|cde|def|qwerty)/.test(lower);

  let score = 0;
  if (value.length >= MIN_PASSWORD_LENGTH) score = 1;
  if (value.length >= 12) score = 2;
  if (value.length >= MIN_PASSWORD_LENGTH && classes >= 3) score = Math.max(score, 3);
  if (value.length >= 12 && classes >= 3) score = 4;

  // The cap replaces the score, so it has to replace the hint too — otherwise a
  // long alphabet run is told to "add a number" when it already has one.
  let capped = false;
  if (score > 0 && (isRepetitive || isSequential)) {
    score = 1;
    capped = true;
  }

  const labels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];
  const hints = [
    `Use at least ${MIN_PASSWORD_LENGTH} characters.`,
    `Add a number or symbol, or use more characters.`,
    `Add a capital and a number to make this stronger.`,
    `Good — a few more characters would be stronger still.`,
    `Strong password.`,
  ];
  if (capped) {
    hints[1] = isRepetitive
      ? 'That is the same character repeated. Mix in other characters.'
      : 'Avoid runs like "abcdef" or "123456" — mix the order up.';
  }

  return {
    score,
    label: labels[score],
    hint: hints[score],
    ok: value.length >= MIN_PASSWORD_LENGTH,
  };
}

/**
 * Turn an auth failure into something a customer can act on.
 *
 * Supabase hands back developer-facing copy ("Email not confirmed", raw Postgres
 * codes, "Failed to fetch") that means nothing on a signup form. Anything not
 * recognised is passed through unchanged rather than swallowed, so an
 * unanticipated failure is still reportable from a screenshot.
 *
 * @param {any} error
 * @returns {string}
 */
export function friendlyAuthError(error) {
  if (!error) return 'Something went wrong. Please try again.';

  const code = String(error.code || error.name || '');
  const message = String(error.message || error || '');
  const lower = message.toLowerCase();
  const status = Number(error.status || 0);

  if (error instanceof TypeError || lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('load failed')) {
    return "We couldn't reach RELAY. Check your internet connection and try again.";
  }
  if (status === 429 || code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit' || lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Too many attempts. Wait about a minute, then try again.';
  }
  if (lower.includes('already registered') || lower.includes('already exists') || code === 'user_already_exists') {
    return 'An account already exists for that email address. Sign in instead, or use "Forgot password".';
  }
  if (code === 'weak_password' || lower.includes('password should be at least') || lower.includes('weak password')) {
    return `Choose a stronger password. Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (lower.includes('email not confirmed') || lower.includes('email_not_confirmed')) {
    return 'Your email address is not confirmed yet. Open the link we emailed you, then sign in.';
  }
  if (code === 'email_address_invalid' || lower.includes('invalid email') || lower.includes('unable to validate email')) {
    return 'That email address does not look valid. Check it and try again.';
  }
  if (lower.includes('signups not allowed') || lower.includes('signup is disabled')) {
    return 'New signups are paused right now. Please contact support.';
  }
  if (code === 'invalid_credentials' || lower.includes('invalid login credentials')) {
    return 'That email and password do not match. Check them, or use "Forgot password".';
  }
  return message || 'Something went wrong. Please try again.';
}

function readResendCooldowns() {
  try {
    const raw = localStorage.getItem(RESEND_COOLDOWN_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (_) {
    return {};
  }
}

/**
 * Milliseconds left before this address may be resent to. Cooldowns are kept per
 * email so two people sharing a device do not block each other.
 * @param {string} rawEmail
 * @returns {number} 0 when a send is allowed
 */
export function resendCooldownRemaining(rawEmail) {
  const key = canonicalAuthEmail(rawEmail);
  if (!key) return 0;
  const sentAt = Number(readResendCooldowns()[key] || 0);
  if (!sentAt) return 0;
  const remaining = RESEND_COOLDOWN_MS - (Date.now() - sentAt);
  return remaining > 0 ? remaining : 0;
}

/** Start the cooldown for an address. Call only after a send actually succeeded. */
export function markResendSent(rawEmail) {
  const key = canonicalAuthEmail(rawEmail);
  if (!key) return;
  try {
    const all = readResendCooldowns();
    all[key] = Date.now();
    localStorage.setItem(RESEND_COOLDOWN_KEY, JSON.stringify(all));
  } catch (_) { /* private mode — the button stays enabled, Supabase still rate-limits */ }
}

/**
 * Re-send the confirmation link for an unverified account.
 * @param {string} rawEmail
 * @throws when Supabase refuses, with a customer-facing message
 */
export async function resendVerificationEmail(rawEmail) {
  const email = canonicalAuthEmail(rawEmail);
  if (!email) throw new Error('Enter the email address you signed up with.');
  const { data, error } = await supabase.auth.resend({ type: 'signup', email });
  if (error) throw new Error(friendlyAuthError(error));
  markResendSent(email);
  return data;
}

/**
 * Turn a signed-in-but-unprovisioned account into a working cloud account.
 *
 * This is the one place the app provisions a company, so the launch screen, the
 * first sign-in after verification and the local→cloud upgrade all take the
 * same path: the RPC runs with the caller's real session (create_company_and_admin
 * refuses to provision for anyone but auth.uid()), the terms acceptance is
 * stamped server-side against that same session, and the free trial starts on
 * the company that RPC just created.
 *
 * Nothing here trusts anything typed before verification. The arguments are the
 * prefill the user just reviewed; the server still decides what a company is
 * and who may claim the name (036_company_name_uniqueness.sql).
 *
 * @param {{ userId: string, companyName: string, adminName?: string, adminPhone?: string, termsAccepted?: boolean }} params
 * @returns {Promise<{ companyId: string, trialEndsAt: string|null }>}
 */
export async function provisionCloudAccount({ userId, companyName, adminName, adminPhone, termsAccepted } = {}) {
  if (!userId) throw new Error('Sign in again to finish setting up your account.');

  const { data, error } = await supabase.rpc('create_company_and_admin', {
    user_id: userId,
    company_name: String(companyName == null ? '' : companyName).trim(),
    admin_name: adminName || null,
    admin_phone: adminPhone || null,
  });
  if (error) throw new Error(friendlyAuthError(error));

  // Terms and the trial are recorded AFTER the company exists, and both are
  // best-effort: the account is usable either way, and bouncing the user back to
  // a form that would try to create the company a second time is far worse than
  // a missing timestamp they can re-accept from Settings.
  if (termsAccepted) {
    try {
      const { error: termsError } = await supabase.rpc('record_terms_acceptance');
      if (termsError) console.error('Failed to record terms acceptance:', termsError);
    } catch (err) {
      console.error('Failed to record terms acceptance:', err);
    }
  }

  let trialEndsAt = null;
  try {
    const { data: endsAt, error: trialError } = await supabase.rpc('start_cloud_trial', { p_days: TRIAL_DAYS });
    if (trialError) console.error('Failed to start cloud trial:', trialError);
    else trialEndsAt = endsAt || null;
  } catch (err) {
    console.error('Failed to start cloud trial:', err);
  }

  return { companyId: data, trialEndsAt };
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
 * The company an invited team member was added to, read from the session token.
 *
 * `app_metadata` is written by the service role in `invite-user`, so it is the
 * only company link the client can trust: `user_metadata` is editable by the
 * signed-in user (and by self-signup), and `profiles` is exactly the row this is
 * used to detect the absence of. Legacy accounts still carry a company id in
 * `user_metadata` only, which is deliberately not consulted here — granting a
 * tenant from a forgeable field would let anyone join a company.
 *
 * @param {object} authUser Supabase auth user (e.g. from getSession/getUser)
 * @returns {string} Company id, or '' when this account was not invited
 */
export function invitedCompanyId(authUser) {
  const appMetadata = authUser ? authUser.app_metadata : null;
  if (!appMetadata) return '';
  const companyId = appMetadata.company_id;
  return companyId == null ? '' : String(companyId);
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
