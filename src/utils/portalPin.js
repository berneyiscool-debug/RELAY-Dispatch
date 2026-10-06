// Portal PINs used to sit in the `portal_passcode` column as plain text, so
// anyone who could read the row (a shared magic link, a leaked export, a
// stolen session) read the PIN itself. Store a salted digest instead and keep
// the check in one place so every portal follows the same rule.
//
// Honest limit: these PINs are 4-6 digits, so a salted SHA-256 only removes the
// disclosure of the secret — it does not survive an offline attacker who gets
// the hash and can try all 10^4-10^6 candidates. The digest also has to be
// computed in the browser because the portals authenticate anonymously.
const PIN_PREFIX = 'sha256$';
const SALT_BYTES = 16;

function toHex(bytes) {
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

function randomSaltHex() {
  const bytes = new Uint8Array(SALT_BYTES);
  globalThis.crypto.getRandomValues(bytes);
  return toHex(bytes);
}

async function digestHex(saltHex, pin) {
  const data = new TextEncoder().encode(`${saltHex}:${pin}`);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', data);
  return toHex(new Uint8Array(digest));
}

// Digest comparison is over a hash, so length-independent equality is enough;
// this just avoids an early-exit that leaks how much of the hash matched.
function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function isHashedPortalPin(stored) {
  return typeof stored === 'string' && stored.startsWith(PIN_PREFIX);
}

// True when the stored value predates hashing and should be re-saved on the
// next successful verify so the cleartext copy disappears.
export function needsPortalPinUpgrade(stored) {
  return typeof stored === 'string' && stored !== '' && !isHashedPortalPin(stored);
}

export async function hashPortalPin(pin) {
  const value = String(pin ?? '');
  if (!globalThis.crypto?.subtle) {
    console.error('Portal PIN stored without a digest: SubtleCrypto is unavailable.');
    return value;
  }
  const saltHex = randomSaltHex();
  return `${PIN_PREFIX}${saltHex}$${await digestHex(saltHex, value)}`;
}

export async function verifyPortalPin(enteredPin, stored) {
  const entered = String(enteredPin ?? '');
  if (typeof stored !== 'string' || stored === '') return false;
  if (!isHashedPortalPin(stored)) {
    // Legacy cleartext row: compare directly, the callers upgrade it.
    return entered === stored;
  }
  const [, saltHex, expected] = stored.split('$');
  if (!saltHex || !expected || !globalThis.crypto?.subtle) return false;
  return constantTimeEqual(await digestHex(saltHex, entered), expected);
}
