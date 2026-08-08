// ============================================
// RELAY — EMAIL CLIENT (Resend)
// ============================================
// Thin client over the `relay-email` edge function (v1.3 #5). Sends themed
// transactional email and logs every attempt into `email_log` so Deputy/Reports
// can see what went out. Cloud-gated + flag-gated: local/offline accounts never
// see it, and the whole feature stays behind FLAGS.email until 1.3.0 cuts.
//
// Customers do NO email setup. Every tenant sends through RELAY's Resend account
// on RELAY's verified domain as e.g. billing.testcompany@relaydispatch.com.au.
// The From address is built server-side from the caller's JWT — see the security
// note in supabase/functions/relay-email/index.ts. Nothing here can influence it,
// which is deliberate: a client-chosen sender on a shared domain would let any
// tenant send mail as any other.

import { supabase } from './supabase.js';
import { store } from '../data/store.js';
import { FLAGS } from './flags.js';

// Cloud accounts only (paid API). Mirrors the check used across the app: a real
// company id that isn't a local `acct_` namespace.
function isCloudUser() {
  return !!(store.companyId && !String(store.companyId).startsWith('acct_'));
}

// Mailer config lives at settings.mailer:
//   { fromName, replyTo, signature, branding, templates, enabledFor, reminders,
//     mode: 'relay' | 'own-domain', domain, domainId, domainStatus, fromAddress }
//
// It used to live at settings.email — which already held the company's business
// email ADDRESS (a plain string shown on invoices and the customer portal, and
// written to the companies.email text column). Storing an object there made
// saveSettings push an object into a text column, so the whole settings write
// failed and no email config ever persisted. Anything still on the old key is
// read once here and rewritten to settings.mailer by migrateMailerSettings().
export function emailSettings() {
  const s = store.getSettings() || {};
  if (s.mailer && typeof s.mailer === 'object') return s.mailer;
  // Legacy: only treat settings.email as config when it's an object, never
  // when it's the business email string.
  if (s.email && typeof s.email === 'object') return s.email;
  return {};
}

// One-time repair: move a legacy object off settings.email and restore that key
// to the business email string so invoices/portal stop rendering [object Object].
export async function migrateMailerSettings() {
  const s = store.getSettings() || {};
  if (!s.email || typeof s.email !== 'object') return false;

  const legacy = s.email;
  s.mailer = { ...legacy, ...(s.mailer && typeof s.mailer === 'object' ? s.mailer : {}) };
  // Best guess at the real business address that the object displaced.
  s.email = typeof legacy.replyTo === 'string' && legacy.replyTo
    ? legacy.replyTo
    : (typeof legacy.fromAddress === 'string' ? legacy.fromAddress : '');

  try {
    await store.saveSettings(s);
    return true;
  } catch (_) {
    return false;
  }
}

// Feature visible to this user at all?
export function emailEnabled() {
  return !!(FLAGS.email && isCloudUser());
}

// Ready to actually send? Shared RELAY sending needs no setup, so this is true
// for any cloud user once the feature is on. Only the advanced bring-your-own-
// domain mode has to be finished before it can send.
export function emailConfigured() {
  if (!emailEnabled()) return false;
  const cfg = emailSettings();
  if (cfg.mode === 'own-domain') return cfg.domainStatus === 'verified' && !!cfg.fromAddress;
  return true;
}

// Is sending switched on for this template type? (default on)
export function emailEnabledFor(template = 'invoice') {
  if (!emailConfigured()) return false;
  const per = emailSettings().enabledFor;
  return !per || per[template] !== false;
}

/**
 * Why is email off? null when sending is available, else a plain-English reason.
 *
 * Every gate above fails silently by design — a disabled feature just doesn't
 * render its buttons, and callers written as `if (emailEnabledFor(x)) { send }`
 * skip straight past. From the outside that is indistinguishable from "the email
 * was sent but never arrived", which makes it impossible to self-diagnose. Any
 * screen that hides an email action should be able to say why instead.
 *
 * @param {string} [template] also check the per-template toggle
 */
export function emailBlockedReason(template) {
  if (!FLAGS.email) {
    return 'The email feature is switched off in this build.';
  }
  if (!isCloudUser()) {
    return 'This is a local (offline) account. Sending email is a cloud feature — sign in to a cloud account to send.';
  }
  const cfg = emailSettings();
  if (cfg.mode === 'own-domain') {
    if (!cfg.fromAddress) {
      return 'Advanced "use your own domain" is selected, but no From address is set. Set one in Settings → Email → Advanced, or untick it to use RELAY sending.';
    }
    if (cfg.domainStatus !== 'verified') {
      return `Advanced "use your own domain" is selected, but ${cfg.domain || 'that domain'} is not verified (status: ${cfg.domainStatus || 'none'}). Verify it, or untick it to use RELAY sending.`;
    }
  }
  if (template) {
    const per = cfg.enabledFor;
    if (per && per[template] === false) {
      return `Sending is switched off for "${template}" under Settings → Email → Send these.`;
    }
  }
  return null;
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
      fromEmail: entry.fromEmail || null,
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
 * The sender address is chosen by the edge function from `template`.
 * @returns {Promise<{id:string, from:string}>}
 * @throws if not enabled or the send fails (a status:'failed' row is logged too).
 */
export async function sendEmail({
  to, subject, html, text, template = 'custom',
  relatedType, relatedId, replyTo, cc, attachments,
} = {}) {
  if (!emailEnabled()) throw new Error('Email is not enabled for this account.');
  if (!to) throw new Error('A recipient (to) is required.');
  if (!subject) throw new Error('A subject is required.');
  if (!html && !text) throw new Error('An email body is required.');

  const cfg = emailSettings();
  const body = {
    action: 'send',
    to,
    subject,
    html,
    text,
    template,
    replyTo: replyTo || cfg.replyTo || undefined,
    cc: cc || undefined,
    // [{ filename, content }] with content base64 — the full document that
    // accompanies a quote/invoice/receipt summary email.
    attachments: (attachments && attachments.length) ? attachments : undefined,
  };

  try {
    const data = await invokeEmail(body);
    logEmail({ to, subject, template, relatedType, relatedId, status: 'sent', providerId: data?.id, fromEmail: data?.from });
    return data;
  } catch (err) {
    logEmail({ to, subject, template, relatedType, relatedId, status: 'failed', error: String(err?.message || err) });
    throw new Error(`Email failed: ${err?.message || err}`);
  }
}

// What this tenant's addresses actually are, straight from the server (the
// client can't derive them — the slug isn't in client-editable settings).
export async function getSenderInfo() {
  if (!emailEnabled()) throw new Error('Email is not enabled for this account.');
  return invokeEmail({ action: 'sender.get' });
}

// ── Advanced: bring your own domain (Settings → Email, Advanced) ─────────────
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
