// ============================================
// RELAY — SIGNED-IN USER SESSION AND REMEMBERED SIGN-IN IDENTITY
// ============================================
// One place that writes the signed-in user and the "remember me" hints. Reads
// stay where they are: `localStorage.getItem('currentUser')` is how the rest of
// the app discovers who is signed in, and that contract does not change.

import { clearDemoFlag } from '../../utils/demoSession.js';

const CURRENT_USER_KEY = 'currentUser';

// Each sign-in form remembers its own identity so a username typed on the
// launch screen doesn't leak into the cloud sign-in field and vice versa. The
// key names are unchanged from the previous per-screen implementations.
const REMEMBER_ME_FORMS = {
  login: { flag: 'relay_remember_me', identity: 'relay_remembered_email' },
  local: { flag: 'relay_local_remember_me', identity: 'relay_local_remembered_email' },
  cloud: { flag: 'relay_cloud_remember_me', identity: 'relay_cloud_remembered_email' },
};

function rememberMeKeys(form) {
  return REMEMBER_ME_FORMS[form] || REMEMBER_ME_FORMS.login;
}

/** Persist the signed-in user. Every sign-in path goes through this. */
export function setSessionUser(user) {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  return user;
}

/** Forget the signed-in user (sign out). */
export function clearSessionUser() {
  localStorage.removeItem(CURRENT_USER_KEY);
  // Signing out ends a demo session too, so the next sign-in lands on real data.
  clearDemoFlag();
}

/** The signed-in user, or null when nobody is signed in. */
export function getSessionUser() {
  try {
    return JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || 'null');
  } catch {
    return null;
  }
}

/** Store or clear a sign-in form's remembered identity. */
export function rememberIdentity(form, identity, remembered = true) {
  const { flag, identity: identityKey } = rememberMeKeys(form);
  // Only a non-empty string is worth remembering — a stray `true` or an object
  // would otherwise be stored and prefilled back into the field.
  if (remembered && typeof identity === 'string' && identity) {
    localStorage.setItem(flag, 'true');
    localStorage.setItem(identityKey, identity);
  } else {
    localStorage.removeItem(flag);
    localStorage.removeItem(identityKey);
  }
}

/** The remembered identity for a form, or '' when nothing is remembered. */
export function getRememberedIdentity(form = 'login') {
  const { flag, identity: identityKey } = rememberMeKeys(form);
  if (localStorage.getItem(flag) !== 'true') return '';
  return localStorage.getItem(identityKey) || '';
}

/** True when a form's "remember me" box should start checked. */
export function isRememberMeEnabled(form = 'login') {
  const { flag } = rememberMeKeys(form);
  return localStorage.getItem(flag) === 'true';
}
