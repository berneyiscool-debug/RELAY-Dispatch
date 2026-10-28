// ============================================
// RELAY — AUTH EMAIL LINK DETECTION
// ============================================
// A password reset email lands on the app base with the recovery token in the
// fragment (`#access_token=…&type=recovery`), or — when the link has expired or
// was already used — with Supabase's error in it instead
// (`#error=access_denied&error_code=otp_expired&error_description=…`).
//
// Boot has to recognise both *synchronously*: Supabase only reads the fragment
// after acquiring its navigator lock, and boot rewrites any unknown hash to
// `#/login` before that, which would throw the token away.

/**
 * Classify a `location.hash`.
 *
 * Returns `null` for an ordinary route, `{ ok: true }` for a recovery link the
 * Supabase client will turn into a session, or `{ ok: false, message }` for an
 * auth link Supabase rejected.
 */
export function readAuthLinkHash(hash) {
  if (typeof hash !== 'string') return null;
  const fragment = hash.startsWith('#') ? hash.slice(1) : hash;
  // Every app route starts with `/`; an auth fragment never does.
  if (!fragment || fragment.startsWith('/')) return null;

  const params = new URLSearchParams(fragment);
  if (params.get('error_description') || params.get('error_code')) {
    return {
      ok: false,
      message: params.get('error_description') || 'This email link is invalid or has expired.',
    };
  }
  if (params.get('access_token') && params.get('type') === 'recovery') {
    return { ok: true };
  }
  return null;
}
