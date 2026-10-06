// ============================================
// RELAY — delete-company Auth cleanup rules
// ============================================
// The testable half of "deleting a company deletes its people": which Auth
// accounts belong to the company being deleted.
//
// This lives in its own module (rather than inline in index.ts) so node:test can
// exercise the real rules — see supabase/tests/invited-user-provisioning.test.js.
//
// Plain ESM, no Deno APIs, no types: importable from both the edge function and
// the node test runner.

// Kept in step with provision.js / migration 020: the domain every staff
// address the app mints is under.
export const RELAY_STAFF_DOMAIN = 'relay.internal';

// Same rule as provision.js isCompanyStaffEmail(). Duplicated deliberately: an
// edge function may only import from its own folder on deploy.
export function isCompanyStaffEmail(email, emailSlug) {
  const slug = String(emailSlug == null ? '' : emailSlug).trim().toLowerCase();
  const address = String(email == null ? '' : email).trim().toLowerCase();
  if (!slug || !address) return false;
  return address.endsWith(`@${slug}.${RELAY_STAFF_DOMAIN}`);
}

// Paginated Auth user walk. GoTrue has no "users of this company" query, so the
// company link has to be resolved client-side from profiles and metadata.
//
// Returns `{ users, complete }`. `complete: false` means the list was longer than
// `maxPages` pages and the caller must NOT act on a partial list: deleting a
// company while some of its accounts are still unknown would leave live logins
// pointing at a tenant that no longer exists.
export async function listAllAuthUsers(admin, options = {}) {
  const perPage = options.perPage || 200;
  const maxPages = options.maxPages || 50;
  const users = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`Failed to list Auth users: ${error.message}`);

    const batch = (data && data.users) || [];
    users.push(...batch);

    if (batch.length < perPage) return { users, complete: true };
    if (data && data.nextPage === null) return { users, complete: true };
  }

  return { users, complete: false };
}

// Every Auth account that belongs to `companyId`, from all three links we have:
//
//   - a profile row pointing at the company (the only link that exists for
//     accounts created by signup or by a working invite);
//   - `app_metadata.company_id` (service-role written, so trustworthy — but it
//     also holds values left behind by older builds, which is why it is not the
//     only source);
//   - the company's own `<username>@<email_slug>.relay.internal` addresses, which
//     is the only link an invite interrupted before its profile row was written
//     still has.
//
// The caller's own id is returned last so that a failure part-way through the
// deletes leaves their session alive to retry with.
export function companyAuthUserIds(authUsers, input) {
  const { companyId, profileIds, emailSlug, callerId } = input;
  const ids = [];

  for (const id of profileIds || []) {
    if (id && !ids.includes(id)) ids.push(id);
  }

  for (const user of authUsers || []) {
    if (!user || !user.id || ids.includes(user.id)) continue;
    const appCompanyId = user.app_metadata ? user.app_metadata.company_id : null;
    if (appCompanyId === companyId || isCompanyStaffEmail(user.email, emailSlug)) {
      ids.push(user.id);
    }
  }

  if (callerId && ids.includes(callerId)) {
    ids.splice(ids.indexOf(callerId), 1);
    ids.push(callerId);
  }

  return ids;
}

// A user id that is already gone is a stale reference, not a failure: refusing to
// delete the company forever because one account was removed by hand would be
// worse than skipping it. Real errors (rate limits, network, permissions) must
// still surface.
export function isMissingAuthUserError(error) {
  if (!error) return false;
  if (String(error.code || '') === 'user_not_found') return true;
  if (Number(error.status) === 404) return true;
  return String(error.message || '').toLowerCase().includes('user not found');
}
