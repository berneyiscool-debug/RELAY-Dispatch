// ============================================
// RELAY — COMPANY NAME AVAILABILITY
// ============================================
// Cloud signup claims a company name. The claim is enforced server-side by
// create_company_and_admin() (036_company_name_uniqueness.sql) because that is
// the only path allowed to mint a company row — this module just lets the form
// tell the user *before* they submit whether the name is already owned, and
// normalises the name the same way the database key does so the two agree.
//
// Availability is a hint, never a permission: a name reported free here can be
// claimed by someone else a second later, so the RPC still rejects the loser.

import { supabase } from './supabase.js';

const MAX_NAME_LENGTH = 80;

/**
 * Canonicalise a company name for comparison. MUST stay in step with
 * relay_company_name_key() in 036_company_name_uniqueness.sql: lowercase,
 * collapse runs of whitespace to one space, trim the ends.
 * @param {string} raw
 * @returns {string}
 */
export function normalizeCompanyName(raw) {
  return String(raw == null ? '' : raw)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Client-side checks that don't need the network.
 * @param {string} raw
 * @returns {{ valid: boolean, message: string }}
 */
export function validateCompanyName(raw) {
  const key = normalizeCompanyName(raw);
  if (!key) return { valid: false, message: 'Enter your company name to continue.' };
  if (key.length < 2) return { valid: false, message: 'Company names must be at least 2 characters.' };
  if (key.length > MAX_NAME_LENGTH) {
    return { valid: false, message: `Company names can be up to ${MAX_NAME_LENGTH} characters.` };
  }
  return { valid: true, message: '' };
}

/**
 * Ask the server whether another company already owns this name.
 * @param {string} raw
 * @returns {Promise<{ available: true|false|'unknown', message: string }>}
 *   `'unknown'` means we couldn't reach the check — the caller should let the
 *   user continue rather than block a signup on a network hiccup.
 */
export async function isCompanyNameAvailable(raw) {
  const check = validateCompanyName(raw);
  if (!check.valid) return { available: false, message: check.message };

  if (typeof supabase.rpc !== 'function') {
    return { available: 'unknown', message: '' }; // offline/stub build
  }

  try {
    const { data, error } = await supabase.rpc('company_name_available', { p_name: String(raw) });
    if (error) throw error;
    return data === false
      ? { available: false, message: 'That company name is already taken. Please choose another.' }
      : { available: true, message: 'That name is available.' };
  } catch (_) {
    return { available: 'unknown', message: '' };
  }
}

const CHECK_STYLES = {
  ok: { text: 'That name is available.', color: '#16A34A' },
  taken: { text: 'That company name is already taken.', color: '#DC2626' },
  invalid: { text: '', color: '#DC2626' },
  checking: { text: 'Checking…', color: '#6B7280' },
  unknown: { text: '', color: '#6B7280' },
};

/**
 * Live availability feedback for a text input + status element.
 *
 * Deliberately thin DOM glue: no rendering framework, no listeners beyond the
 * input, so it can be reused by both onboarding entry points and reasoned about
 * without a DOM test environment.
 *
 * @param {HTMLInputElement} input
 * @param {HTMLElement} statusEl
 * @param {{ delay?: number, onChange?: (state: string) => void }} [opts]
 * @returns {{ state: () => string, key: () => string, checkNow: () => Promise<string>, dispose: () => void }}
 */
export function bindCompanyNameCheck(input, statusEl, opts = {}) {
  const delay = Number.isFinite(opts.delay) ? opts.delay : 350;
  let timer = null;
  let token = 0;
  let state = 'idle'; // idle | checking | ok | taken | unknown | invalid
  // The key the last answer belongs to — a slow reply for an older keystroke
  // must not overwrite the verdict for what's in the box now.
  let answeredKey = null;

  function render(next, message) {
    state = next;
    if (!statusEl) return;
    const style = CHECK_STYLES[next] || CHECK_STYLES.unknown;
    statusEl.textContent = message || style.text;
    statusEl.style.color = style.color;
    statusEl.dataset.state = next;
    try { if (opts.onChange) opts.onChange(next); } catch (_) { /* non-fatal */ }
  }

  async function checkNow() {
    const raw = input ? input.value : '';
    const empty = !String(raw).trim();
    const check = validateCompanyName(raw);
    if (!check.valid) {
      answeredKey = null;
      render(empty ? 'idle' : 'invalid', empty ? '' : check.message);
      return state;
    }
    const key = normalizeCompanyName(raw);
    if (key === answeredKey) return state;
    const mine = ++token;
    render('checking');
    const result = await isCompanyNameAvailable(raw);
    if (mine !== token) return state; // a newer check landed first
    if (result.available === 'unknown') {
      render('unknown');
    } else {
      answeredKey = key;
      render(result.available ? 'ok' : 'taken', result.message);
    }
    return state;
  }

  function schedule() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => { timer = null; checkNow(); }, delay);
  }

  if (input) input.addEventListener('input', schedule);

  return {
    state: () => state,
    key: () => normalizeCompanyName(input ? input.value : ''),
    checkNow,
    dispose() {
      if (timer) clearTimeout(timer);
      if (input) input.removeEventListener('input', schedule);
    },
  };
}
