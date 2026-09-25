// ============================================
// RELAY — LOCAL PASSWORD SCHEME
// ============================================
// One implementation for every local (offline) password in the app. Cloud
// accounts never touch this file — they authenticate through Supabase Auth.
//
// Launch caveat, recorded rather than redesigned: local passwords are hashed
// with unsalted SHA-256 in the browser, so the hash is a speed bump, not a
// guarantee. Revisit after launch; cloud accounts are unaffected.

const HASH_PATTERN = /^[0-9a-f]{64}$/;

/** SHA-256 of a password, as 64 lowercase hex characters. */
export async function hashPassword(password) {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/** True when a stored value is already a hash rather than a legacy plaintext password. */
export function isPasswordHash(value) {
  return typeof value === 'string' && HASH_PATTERN.test(value);
}

/** True when a local record has a password stored (hashed, or legacy plaintext). */
export function hasLocalPassword(record) {
  return !!(record && typeof record.password === 'string' && record.password);
}

/**
 * Check a typed password against the value stored on a local record.
 *
 * Returns `{ ok, needsUpgrade }`. `needsUpgrade` is true when the record still
 * holds a legacy plaintext password, so the caller can replace it with its hash
 * on the way through and nobody is locked out by the switch to hashing.
 *
 * A record with no password at all is never a match: those users go through the
 * first-run "set your password" step instead of a shared default.
 */
export async function verifyPassword(stored, input) {
  if (typeof input !== 'string' || !input) return { ok: false, needsUpgrade: false };
  if (typeof stored !== 'string' || !stored) return { ok: false, needsUpgrade: false };

  if (await hashPassword(input) === stored) return { ok: true, needsUpgrade: false };
  // Legacy plaintext is only accepted while it is not itself hash-shaped, so a
  // stored hash can never be replayed as the password.
  if (!isPasswordHash(stored) && stored === input) return { ok: true, needsUpgrade: true };
  return { ok: false, needsUpgrade: false };
}

/**
 * Verify and, when the record still holds legacy plaintext, rewrite it as a
 * hash before returning. `write(hashedPassword)` persists the upgrade.
 */
export async function verifyAndUpgrade(write, stored, input) {
  const { ok, needsUpgrade } = await verifyPassword(stored, input);
  if (ok && needsUpgrade) await write(await hashPassword(input));
  return ok;
}
