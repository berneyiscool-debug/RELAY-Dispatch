// ============================================
// RELAY — XERO CRYPTO HELPERS
// ============================================
// Shared by the relay-xero-* edge functions. Plain ESM on Web Crypto only (no
// Deno APIs), so supabase/tests can exercise it directly under Node.
//
//   * Webhook signatures: Xero signs the RAW request body with HMAC-SHA256
//     keyed on the app's webhook key and sends the base64 digest in
//     x-xero-signature.
//   * OAuth state: a short-lived signed token carrying who started the connect
//     flow, so the public callback can't be pointed at another company.
//   * Token encryption: refresh/access tokens are stored as AES-GCM ciphertext,
//     bound to the company id (additional data) so a ciphertext copied onto a
//     different company's row fails to decrypt.

const enc = new TextEncoder();
const dec = new TextDecoder();

function bytesToBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBytes(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

const toBase64Url = (b64) => b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromBase64Url = (s) => {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  return b64 + '='.repeat((4 - (b64.length % 4)) % 4);
};

/** Constant-time string compare (length leaks, content doesn't). */
export function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

async function hmacSha256(secret, data) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(data)));
}

// ── Webhook signature ────────────────────────────────────────────────

/**
 * Verify Xero's x-xero-signature against the raw body. Pass the body exactly as
 * received (await req.text()); parsing and re-serialising changes the bytes.
 */
export async function verifyWebhookSignature(rawBody, signatureHeader, webhookKey) {
  if (!webhookKey || typeof rawBody !== 'string' || !signatureHeader) return false;
  const expected = bytesToBase64(await hmacSha256(webhookKey, rawBody));
  return timingSafeEqual(String(signatureHeader).trim(), expected);
}

// ── OAuth state ──────────────────────────────────────────────────────

/**
 * Sign the connect-flow state: `<base64url(json)>.<base64url(hmac)>`.
 * @param {{companyId:string, userId:string, returnPath?:string}} payload
 */
export async function signState(payload, secret, { ttlSec = 600, now = Date.now() } = {}) {
  if (!secret) throw new Error('XERO_STATE_SECRET is not configured');
  const body = { ...payload, exp: Math.floor(now / 1000) + ttlSec, n: bytesToBase64(crypto.getRandomValues(new Uint8Array(9))) };
  const encoded = toBase64Url(bytesToBase64(enc.encode(JSON.stringify(body))));
  const sig = toBase64Url(bytesToBase64(await hmacSha256(secret, encoded)));
  return `${encoded}.${sig}`;
}

/** Returns the state payload, or null when it is forged, malformed or expired. */
export async function verifyState(token, secret, { now = Date.now() } = {}) {
  if (!secret || typeof token !== 'string' || token.length > 2048) return null;
  const parts = token.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  const expected = toBase64Url(bytesToBase64(await hmacSha256(secret, parts[0])));
  if (!timingSafeEqual(parts[1], expected)) return null;
  let payload;
  try {
    payload = JSON.parse(dec.decode(base64ToBytes(fromBase64Url(parts[0]))));
  } catch {
    return null;
  }
  if (!payload || typeof payload !== 'object') return null;
  if (!Number.isFinite(payload.exp) || payload.exp < Math.floor(now / 1000)) return null;
  if (!payload.companyId || !payload.userId) return null;
  return payload;
}

// ── Token encryption ─────────────────────────────────────────────────

async function importTokenKey(keyB64) {
  if (!keyB64) throw new Error('XERO_TOKEN_KEY is not configured');
  const raw = base64ToBytes(keyB64);
  if (raw.length !== 32) throw new Error('XERO_TOKEN_KEY must be 32 bytes, base64-encoded');
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

/** Encrypt a token for storage: `v1.<iv>.<ciphertext>` (base64), bound to companyId. */
export async function encryptToken(plaintext, keyB64, companyId) {
  if (plaintext == null || plaintext === '') return null;
  if (!companyId) throw new Error('encryptToken needs the company id');
  const key = await importTokenKey(keyB64);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: enc.encode(String(companyId)) },
    key,
    enc.encode(String(plaintext))
  );
  return `v1.${bytesToBase64(iv)}.${bytesToBase64(new Uint8Array(ct))}`;
}

/** Decrypt a stored token. Throws when the key, company or ciphertext don't match. */
export async function decryptToken(stored, keyB64, companyId) {
  if (stored == null || stored === '') return null;
  const parts = String(stored).split('.');
  if (parts.length !== 3 || parts[0] !== 'v1') throw new Error('Unrecognised token format');
  const key = await importTokenKey(keyB64);
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBytes(parts[1]), additionalData: enc.encode(String(companyId)) },
    key,
    base64ToBytes(parts[2])
  );
  return dec.decode(pt);
}
