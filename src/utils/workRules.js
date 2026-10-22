// ============================================
// RELAY — WORK RULES (Time & Attendance per user type)
// ============================================
// How the app treats a kind of person, set on their user type:
//   clockOn       — clocks on and off: on the attendance board and in Clock History,
//                   and held to their roster (missing hours, late, open sessions)
//   booksJobTime  — books hours to jobs: compared in Clocked vs Job Hours
//   schedulable   — can be scheduled to jobs: a Schedule column and a booking pick
//
// These are not permissions. A permission says what the signed-in user may do, and an
// admin may do everything; a work rule says how the app treats *someone*, whoever is
// looking. They are stored with the user type's permissions (an entry for the
// module below), so no table changes are needed, but always read through here.
//
// A user type saved before these rules existed has no entry. It keeps the behaviour
// the app had then: everyone clocks on, and the person's own `fieldStaff` flag decides
// whether they book job time and appear on the Schedule. A local account is a single
// person running the whole business, so the rules never apply there.

import { store } from '../data/store.js';

export const WORK_RULES_MODULE = 'Time & Attendance';

export const WORK_RULES = [
  { key: 'clockOn', label: 'Clocks on and off', hint: 'Shows on the attendance board and in Clock History, and is checked against their roster.' },
  { key: 'booksJobTime', label: 'Books time to jobs', hint: 'Compared in Clocked vs Job Hours, so unbooked time is flagged.' },
  { key: 'schedulable', label: 'Can be scheduled to jobs', hint: 'Gets a column on the Schedule and can be booked onto work.' },
];

const ALL_ON = { clockOn: true, booksJobTime: true, schedulable: true };

/** Starting rules for a user type template (or a type's name). */
export function defaultWorkRules(template) {
  switch (String(template || '').trim().toLowerCase()) {
    case 'office staff':
    case 'office':
      return { clockOn: false, booksJobTime: false, schedulable: false };
    case 'admin':
      // Usually the owner, who is often on the tools too, so they can be scheduled.
      return { clockOn: false, booksJobTime: false, schedulable: true };
    default:
      return { ...ALL_ON };
  }
}

/** The rules stored on a permissions array, or null when none were saved. */
export function workRulesFromPermissions(permissions) {
  const entry = (Array.isArray(permissions) ? permissions : []).find(p => p && p.module === WORK_RULES_MODULE);
  if (!entry) return null;
  const rules = {};
  WORK_RULES.forEach(({ key }) => { rules[key] = entry[key] !== false; });
  return rules;
}

/** A copy of a permissions array with these rules stored on it. */
export function withWorkRules(permissions, rules) {
  const entry = { module: WORK_RULES_MODULE };
  WORK_RULES.forEach(({ key }) => { entry[key] = !!(rules && rules[key]); });
  return [...(Array.isArray(permissions) ? permissions : []).filter(p => p && p.module !== WORK_RULES_MODULE), entry];
}

function isLocalAccount() {
  if (store.demoMode) return false;
  return !store.companyId || String(store.companyId).startsWith('acct_');
}

/**
 * The rules that apply to a person (a technician record, or the signed-in user).
 * @param {{userTypeId?: string, fieldStaff?: boolean}} person
 * @returns {{clockOn: boolean, booksJobTime: boolean, schedulable: boolean}}
 */
export function getWorkRules(person, userTypes = store.getAll('userTypes') || []) {
  if (isLocalAccount()) return { ...ALL_ON };
  const type = person && person.userTypeId != null
    ? userTypes.find(ut => String(ut.id) === String(person.userTypeId))
    : null;
  const stored = type ? workRulesFromPermissions(type.permissions) : null;
  if (stored) return stored;
  const field = !(person && person.fieldStaff === false);
  return { clockOn: true, booksJobTime: field, schedulable: field };
}

/** The rules a user type will save with: what it stores, or what it behaves as today. */
export function workRulesForType(userType) {
  return workRulesFromPermissions(userType && userType.permissions) || { ...ALL_ON };
}
