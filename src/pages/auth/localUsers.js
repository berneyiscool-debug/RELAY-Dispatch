// ============================================
// RELAY — LOCAL USER LOOKUP AND IDENTITY
// ============================================
// Local (offline) accounts keep their users in the `technicians` collection, so
// "who is signing in" and "what may they do" are both derived from a technician
// record. This module is the only place that logic lives.

const USER_TYPE_ROLES = [
  { suffix: 'ut_admin', role: 'admin', label: 'Admin' },
  { suffix: 'ut_manager', role: 'manager', label: 'Manager' },
  { suffix: 'ut_office', role: 'office', label: 'Office Staff' },
  { suffix: 'ut_tech', role: 'technician', label: 'Technician' },
];

const ROLE_LABELS = {
  admin: 'Admin',
  manager: 'Manager',
  office: 'Office Staff',
  technician: 'Technician',
};

/** Role suffixes used by the default user types (`ut_tech`, not `ut_technician`). */
const ROLE_TYPE_SUFFIXES = {
  admin: 'admin',
  manager: 'manager',
  office: 'office',
  technician: 'tech',
};

function normalise(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

/**
 * Map a `userTypeId` (`ut_admin`, `acct_xyz_ut_manager`, …) to the app-level
 * role. Returns null for ids this build doesn't recognise.
 */
export function resolveLocalRole(userTypeId) {
  const id = typeof userTypeId === 'string' ? userTypeId : '';
  if (!id) return null;
  const match = USER_TYPE_ROLES.find(t => id === t.suffix || id.endsWith(`_${t.suffix}`));
  return match ? { role: match.role, userTypeName: match.label } : null;
}

/** The user type id a local account would use for a role, namespaced by company. */
export function defaultUserTypeId(role, companyId = null) {
  const suffix = ROLE_TYPE_SUFFIXES[role] || 'tech';
  const id = `ut_${suffix}`;
  return companyId && String(companyId).startsWith('acct_') ? `${companyId}_${id}` : id;
}

/**
 * Find the local user whose email, username or name matches what was typed.
 * Names and usernames are compared case-insensitively, and the local part of an
 * email also matches a matching username (`jake@apexpowerservices.local` →
 * username `jake`).
 */
export function findLocalUser(technicians, identity) {
  const needle = normalise(identity);
  if (!needle) return null;
  const localPart = needle.includes('@') ? needle.split('@')[0] : needle;

  return (technicians || []).find(t => (
    normalise(t.email) === needle
    || normalise(t.username) === needle
    || normalise(t.username) === localPart
    || normalise(t.name) === needle
  )) || null;
}

/** Company id encoded in a local record id (`acct_abc123_tech_1` → `acct_abc123`). */
export function companyIdFromLocalId(id, fallback = null) {
  const match = typeof id === 'string' ? id.match(/^(acct_[^_]+)/) : null;
  return match ? match[1] : fallback;
}

/**
 * Build the `currentUser` object the rest of the app reads for a local user.
 * The user-type mapping wins over the record's `role`, which doubles as a job
 * title in some records ("Senior Electrician").
 */
export function buildLocalUser(tech, { companyId = null, storeCompanyId = null } = {}) {
  const resolvedCompanyId = companyId || tech.companyId || storeCompanyId || 'local_company';
  const mapped = resolveLocalRole(tech.userTypeId);
  const storedRole = normalise(tech.role);
  const role = mapped ? mapped.role : (ROLE_LABELS[storedRole] ? storedRole : 'technician');

  const user = {
    id: tech.id,
    companyId: resolvedCompanyId,
    name: tech.name,
    role,
    userTypeName: mapped ? mapped.userTypeName : ROLE_LABELS[role],
    userTypeId: tech.userTypeId || defaultUserTypeId(role, resolvedCompanyId),
    color: tech.color || '#1B6DE0',
  };

  if (tech.email) user.email = tech.email;
  if (tech.payRate !== undefined) user.payRate = tech.payRate || 0;
  return user;
}
