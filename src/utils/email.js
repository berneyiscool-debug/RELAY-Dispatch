// ============================================
// RELAY — EMAIL CLIENT (Resend)
// ============================================
// Thin client over the `relay-email` edge function (v1.3 #5). Sends themed
// transactional email via Resend and logs every attempt into `email_log` so
// Deputy/Reports can see what went out. Cloud-gated + flag-gated: local/offline
// accounts never see it, and the whole feature stays behind FLAGS.email until
// 1.3.0 cuts. The Resend API key lives only in the edge function's secrets.

import { supabase } from './supabase.js';
import { store } from '../data/store.js';
import { FLAGS } from './flags.js';

// Cloud accounts only (paid API). Mirrors the check used across the app: a real
// company id that isn't a local `acct_` namespace.
function isCloudUser() {
  return !!(store.companyId && !String(store.companyId).startsWith('acct_'));
}

// Per-company email config lives in settings.email (Settings → Email & Domain):
//   { fromName, fromAddress, replyTo, signature, domain, domainId, domainStatus,
//     connected, enabledFor: { quote, invoice, receipt, reminder, portal_invite } }
export function emailSettings() {
  return (store.getSettings() || {}).email || {};
}

// Feature visible to this user at all?
export function emailEnabled() {
  return !!(FLAGS.email && isCloudUser());
}

// Ready to actually send? Needs a sender the admin has switched on in Settings.
export function emailConfigured() {
  if (!emailEnabled()) return false;
  const cfg = emailSettings();
  return !!(cfg.connected && cfg.fromAddress);
}

// Is sending switched on for this template type? (default on once connected)
export function emailEnabledFor(template = 'invoice') {
  if (!emailConfigured()) return false;
  const per = emailSettings().enabledFor;
  return !per || per[template] !== false;
}

// "Grace Dance <billing@gracedance.com>" from config; falls back to Resend's
// shared onboarding sender so test sends work before a custom domain is verified.
export function resolveFrom() {
  const cfg = emailSettings();
  const addr = cfg.fromAddress || 'onboarding@resend.dev';
  const name = cfg.fromName || (store.getSettings() || {}).name || 'RELAY';
  return `${name} <${addr}>`;
}

async function invokeEmail(body) {
  const { data, error } = await supabase.functions.invoke('relay-email', { body });
  if (error) {
    let detail = error.message || String(error);
    try {
      if (error.context && typeof error.context.text === 'function') {
        const t = await error.context.text();
        if (t) { try { detail = JSON.parse(t).error || t; } catch { detail = t; } }
      }
    } catch (_) { /* keep the generic message */ }
    throw new Error(detail);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

// Write an email_log row. Best-effort — logging must never break a send.
function logEmail(entry) {
  try {
    store.create('emailLog', {
      toEmail: Array.isArray(entry.to) ? entry.to.join(', ') : entry.to,
      subject: entry.subject || '',
      template: entry.template || 'custom',
      status: entry.status,
      providerId: entry.providerId || null,
      relatedType: entry.relatedType || null,
      relatedId: entry.relatedId || null,
      error: entry.error || null,
    });
  } catch (_) { /* non-fatal */ }
}

/**
 * Send one transactional email through Resend and log the attempt.
 * @returns {Promise<{id:string}>}
 * @throws if not enabled or the send fails (a status:'failed' row is logged too).
 */
export async function sendEmail({
  to, subject, html, text, template = 'custom',
  relatedType, relatedId, replyTo, cc, from,
} = {}) {
  if (!emailEnabled()) throw new Error('Email is not enabled for this account.');
  if (!to) throw new Error('A recipient (to) is required.');
  if (!subject) throw new Error('A subject is required.');
  if (!html && !text) throw new Error('An email body is required.');

  const cfg = emailSettings();
  const body = {
    action: 'send',
    from: from || resolveFrom(),
    to,
    subject,
    html,
    text,
    replyTo: replyTo || cfg.replyTo || undefined,
    cc: cc || undefined,
  };

  try {
    const data = await invokeEmail(body);
    logEmail({ to, subject, template, relatedType, relatedId, status: 'sent', providerId: data?.id });
    return data;
  } catch (err) {
    logEmail({ to, subject, template, relatedType, relatedId, status: 'failed', error: String(err?.message || err) });
    throw new Error(`Email failed: ${err?.message || err}`);
  }
}

// ── Domain verification wizard (Settings → Email & Domain) ───────────────────
export async function addEmailDomain(name) {
  if (!emailEnabled()) throw new Error('Email is not enabled for this account.');
  if (!name) throw new Error('A domain name is required.');
  return invokeEmail({ action: 'domain.add', name });
}

export async function getEmailDomain(domainId) {
  if (!emailEnabled()) throw new Error('Email is not enabled for this account.');
  if (!domainId) throw new Error('A domainId is required.');
  return invokeEmail({ action: 'domain.get', domainId });
}

export async function verifyEmailDomain(domainId) {
  if (!emailEnabled()) throw new Error('Email is not enabled for this account.');
  if (!domainId) throw new Error('A domainId is required.');
  return invokeEmail({ action: 'domain.verify', domainId });
}
