// ============================================
// RELAY — BACKUP EMAIL CONFIRMATION (client)
// ============================================
// A user an admin adds confirms their backup email before they can sign in.
// The link, the gate and the server side are described in
// supabase/functions/_shared/backupEmailConfirmation.js.
import { supabase } from './supabase.js';

/** True when this profile row (snake_case, as read at sign-in) is still waiting on confirmation. */
export function needsBackupEmailConfirmation(profile) {
  return !!(profile && profile.backup_email_confirmation_required && !profile.backup_email_confirmed_at);
}

/**
 * Where a team member (camelCase store record) stands, for the Users table:
 * 'confirmed', 'pending' (an address waiting on its link), or 'none' (no
 * backup email on file — accounts added before it was required).
 */
export function backupEmailStatus(user) {
  if (!user || !user.backupEmail) return 'none';
  return user.backupEmailConfirmedAt ? 'confirmed' : 'pending';
}

async function call(body) {
  const { data, error } = await supabase.functions.invoke('relay-confirm-email', { body });
  if (error) {
    // Same unwrapping as utils/payments.js: the function's own message is on
    // error.context (a Response).
    let detail = error.message || String(error);
    try {
      if (error.context && typeof error.context.text === 'function') {
        const text = await error.context.text();
        if (text) { try { detail = JSON.parse(text).error || text; } catch { detail = text; } }
      }
    } catch (_) { /* keep generic */ }
    throw new Error(detail);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

/** Redeem the token from a confirmation link. */
export function confirmBackupEmailToken(token) {
  return call({ action: 'confirm', token });
}

/** Email a fresh link: to the signed-in user, or (admin/manager) to `userId`. */
export function resendBackupEmailConfirmation(userId) {
  return call(userId ? { action: 'resend', userId } : { action: 'resend' });
}
