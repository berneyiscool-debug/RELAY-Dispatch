// ============================================
// RELAY — invite-user provisioning rules
// ============================================
// The testable half of "an invited team member can actually sign in": which
// profile row an invite must end up with, how an interrupted invite is matched
// back to its Auth account, and how the details the administrator typed are
// mapped onto the `profiles` columns.
//
// This lives in its own module (rather than inline in index.ts) so node:test can
// exercise the real rules — see supabase/tests/invited-user-provisioning.test.js.
//
// Plain ESM, no Deno APIs, no types: importable from both the edge function and
// the node test runner.
//
// Why any of this exists: `handle_new_user_profile()` creates the profile row
// from the NEW user's app_metadata (migration 020/030/031), and app_metadata is
// only writable by the service role. A deployed build of this function that
// predates that trigger writes the company into client-editable user_metadata
// instead, so the Auth user is created and the profile row never is. That account
// then has no company, is sent to "Create your company" on sign-in, and is
// invisible to `delete-company`. Every path here therefore writes the row itself
// and refuses to report success unless the row really exists.

// Company that predates per-company user_type ids: its staff type ids have no
// company prefix.
export const LEGACY_COMPANY_ID = '8dc14565-23c2-4f7d-aeb3-1da615df7644';

// Domain the launch screen and the technician form use for staff addresses.
export const RELAY_STAFF_DOMAIN = 'relay.internal';

// Default technician type for a company, e.g. `<company>_ut_tech`.
export function companyTechTypeId(companyId) {
  return companyId === LEGACY_COMPANY_ID ? 'ut_tech' : `${companyId}_ut_tech`;
}

// Is this address one of a company's own staff addresses, i.e.
// `<username>@<company email_slug>.relay.internal`? This is the only link back to
// a company for an Auth user whose profile row was never created, because
// user_metadata cannot be trusted (the client can write it) and companies RLS
// hides every company row from a user who has no profile.
export function isCompanyStaffEmail(email, emailSlug) {
  const slug = String(emailSlug == null ? '' : emailSlug).trim().toLowerCase();
  const address = String(email == null ? '' : email).trim().toLowerCase();
  if (!slug || !address) return false;
  return address.endsWith(`@${slug}.${RELAY_STAFF_DOMAIN}`);
}

// Mirrors the role coercion in handle_new_user_profile(): a profile written by
// hand here must not be able to hold a role the trigger would have rejected.
// Only an administrator (the company's single `admin` profile) may exist, so
// anything that is not an explicit manager is a technician.
export function normalizeStaffRole(role) {
  return role === 'manager' ? 'manager' : 'technician';
}

// GoTrue's admin API has no lookup-by-email, so page the user list until the
// address is found. A short page means the end of the list.
export async function findAuthUserByEmail(admin, email, options = {}) {
  const target = String(email == null ? '' : email).trim().toLowerCase();
  if (!target) return null;

  const perPage = options.perPage || 200;
  const maxPages = options.maxPages || 50;

  for (let page = 1; page <= maxPages; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`Failed to look up that email address: ${error.message}`);

    const users = (data && data.users) || [];
    const match = users.find((user) => String(user && user.email || '').toLowerCase() === target);
    if (match) return match;
    if (users.length < perPage) return null;
  }

  return null;
}

// Supabase reports a taken email in a few different shapes depending on the
// version of GoTrue in front of it.
export function isDuplicateAuthUserError(error) {
  if (!error) return false;
  const code = String(error.code || '');
  const message = String(error.message || '').toLowerCase();
  return (
    code === 'email_exists' ||
    code === 'user_already_exists' ||
    message.includes('already been registered') ||
    message.includes('already registered')
  );
}

// Where the profile row for an invite stands, in one place so the guard that
// decides "is this an interrupted invite or another tenant's account?" and the
// write that follows agree on what they read.
export async function readProfileForUser(admin, userId) {
  const { data, error } = await admin
    .from('profiles')
    .select('id, company_id, role')
    .eq('id', userId)
    .maybeSingle();

  if (error) return { profile: null, error: `Failed to read the profile: ${error.message}` };
  return { profile: data || null, error: null };
}

// The details the invite collected, in the shape the `profiles` columns take.
//
// `create` is the row the trigger would have inserted (only id, company_id and
// role are actually required); `updates` is what the invite adds on top of a row
// that already exists, matching the previous implementation's fields exactly.
export function staffProfileValues(input) {
  const {
    userId,
    companyId,
    email,
    name,
    username,
    role,
    userTypeId,
    color,
    payRate,
    forcePasswordChange,
  } = input;

  const techTypeId = userTypeId || companyTechTypeId(companyId);
  const forceChange = forcePasswordChange === true;

  return {
    create: {
      id: userId,
      company_id: companyId,
      name: name || null,
      email: email || null,
      username: username || null,
      role: normalizeStaffRole(role),
      user_type_id: techTypeId,
      color: color || '#1B6DE0',
      pay_rate: payRate || 0,
      force_password_change: forceChange,
    },
    updates: {
      color: color || '#1B6DE0',
      pay_rate: payRate || 0,
      user_type_id: techTypeId,
      username,
      force_password_change: forceChange,
    },
  };
}

// Write the profile row for `userId`, creating it when the Auth trigger did not
// and updating it when it did, then read it back.
//
// Returns `{ profile, created }` on success and `{ error }` on any failure,
// including a write that reported no error but left no row: the caller must never
// answer `success: true` for a user who cannot sign in.
export async function ensureProfileForUser({ admin, userId, create, updates }) {
  const { profile: existing, error: readError } = await readProfileForUser(admin, userId);
  if (readError) return { error: readError };

  if (existing) {
    const { error: updateError } = await admin
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (updateError) {
      return { error: `Failed to finish setting up the new user's profile: ${updateError.message}` };
    }
    return { profile: existing, created: false };
  }

  const { error: insertError } = await admin.from('profiles').insert(create);
  if (insertError) {
    return { error: `Failed to create the new user's profile: ${insertError.message}` };
  }

  const { profile: written, error: verifyError } = await readProfileForUser(admin, userId);
  if (verifyError || !written) {
    return {
      error: "The new user's profile could not be confirmed after it was written. Check the profiles table, then re-send the invite.",
    };
  }

  return { profile: written, created: true };
}
