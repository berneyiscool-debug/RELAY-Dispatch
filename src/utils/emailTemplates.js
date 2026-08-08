// ============================================
// RELAY — EMAIL TEMPLATES (v1.3 #5)
// ============================================
// Themed, email-client-safe HTML for RELAY's transactional emails. Table-based
// layout + inline styles (what Gmail/Outlook/Apple Mail need). Content layers:
//   built-in defaults  <  settings.email (branding + per-template text)  <  live override
// so Settings → Email Templates can preview unsaved edits, and real sends pick up
// saved customizations. Per-template text supports merge variables:
//   {customer} {number} {total} {dueDate} {company}
// Each builder returns { subject, html } and accepts an optional `override`
// ({ branding, template }) used by the live preview.

import { store } from '../data/store.js';
import { escapeHTML } from './security.js';
import { emailSettings } from './email.js';

const money = (n) => '$' + Number(n || 0).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return String(d);
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
}

// The five customizable email types, with the merge variables each supports and
// whether it carries a call-to-action button. Drives the Settings editor.
export const EMAIL_TEMPLATES = [
  { key: 'quote', label: 'Quote', vars: ['customer', 'number', 'total', 'dueDate', 'company'], cta: true },
  { key: 'invoice', label: 'Invoice', vars: ['customer', 'number', 'total', 'dueDate', 'company'], cta: true },
  { key: 'receipt', label: 'Payment receipt', vars: ['customer', 'number', 'total', 'company'], cta: false },
  { key: 'reminder', label: 'Payment reminder', vars: ['customer', 'number', 'total', 'dueDate', 'company'], cta: true },
  { key: 'portal_invite', label: 'Portal invite', vars: ['customer', 'company'], cta: true },
  { key: 'contractor_invite', label: 'Contractor portal invite', vars: ['customer', 'company'], cta: true },
];

// Merge the effective config for a template: defaults < saved settings < override.
function resolveConfig(type, override = {}) {
  const s = store.getSettings() || {};
  const dt = s.documentTheme || {};
  // settings.mailer, not settings.email — that key holds the business email
  // address string (see the note in email.js).
  const mailer = emailSettings();
  const b = mailer.branding || {};
  const savedTpl = (mailer.templates || {})[type] || {};
  const ob = override.branding || {};
  const ot = override.template || {};
  const pick = (...vals) => vals.find(v => v !== undefined && v !== null);
  return {
    branding: {
      useLogo: pick(ob.useLogo, b.useLogo, false),
      logo: pick(ob.logo, b.logo, s.logo, ''),
      accent: pick(ob.accent, b.accent, dt.accentColor, '#FF5C00'),
      headerBg: pick(ob.headerBg, b.headerBg, dt.headerBg, '#1E2A3A'),
      footer: pick(ob.footer, b.footer, ''),
      companyName: s.name || 'RELAY',
      signature: pick(ob.signature, mailer.signature, ''),
    },
    text: {
      subject: pick(ot.subject, savedTpl.subject, ''),
      intro: pick(ot.intro, savedTpl.intro, ''),
      note: pick(ot.note, savedTpl.note, ''),
      ctaLabel: pick(ot.ctaLabel, savedTpl.ctaLabel, ''),
    },
  };
}

// Plain-text variable fill (subjects).
function fillText(text, vars) {
  return String(text || '').replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? String(vars[k]) : m));
}
// HTML-safe variable fill (body fragments): escape the copy, then drop in escaped
// values. Braces survive escaping, so the replace still matches.
function fillHtml(text, vars) {
  return escapeHTML(String(text || '')).replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? escapeHTML(String(vars[k])) : m));
}

function signatureHtml(branding) {
  return branding.signature
    ? `<div style="margin-top:22px;padding-top:16px;border-top:1px solid #eaecf0;font-size:13px;color:#667085;white-space:pre-line;">${escapeHTML(branding.signature)}</div>`
    : '';
}

// heading + row label/value are plain text (escaped here); intro + note are raw
// HTML fragments already run through fillHtml by the caller.
// `portalUrl` adds the customer's magic link under the note so they can review,
// accept and pay in their portal rather than replying to the email.
function shell(branding, { preheader, heading, intro, rows = [], ctaLabel, ctaUrl, note, portalUrl, portalLabel }) {
  const name = branding.companyName;
  const brandHead = (branding.useLogo && branding.logo)
    ? `<img src="${escapeHTML(branding.logo)}" alt="${escapeHTML(name)}" style="max-height:34px;max-width:200px;display:block;" />`
    : `<div style="color:#ffffff;font-size:18px;font-weight:700;">${escapeHTML(name)}</div>`;
  const rowsHtml = rows.map(r => `
    <tr>
      <td style="padding:6px 0;color:#667085;font-size:13px;">${escapeHTML(r.label)}</td>
      <td style="padding:6px 0;color:#101828;font-size:13px;font-weight:600;text-align:right;">${escapeHTML(r.value)}</td>
    </tr>`).join('');
  const footerLine = branding.footer
    ? escapeHTML(branding.footer)
    : `Sent by ${escapeHTML(name)}`;
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f3f5f7;">
  <span style="display:none;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;">${escapeHTML(preheader || '')}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f5f7;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #eaecf0;">
        <tr><td style="background:${branding.headerBg};padding:20px 28px;">${brandHead}</td></tr>
        <tr><td style="padding:28px;">
          <h1 style="margin:0 0 12px;font-size:20px;color:#101828;">${escapeHTML(heading)}</h1>
          <p style="margin:0 0 18px;font-size:14px;color:#475467;line-height:1.6;">${intro || ''}</p>
          ${rows.length ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #eaecf0;border-bottom:1px solid #eaecf0;margin:0 0 20px;">${rowsHtml}</table>` : ''}
          ${ctaUrl && ctaLabel ? `<div style="margin:0 0 20px;"><a href="${escapeHTML(ctaUrl)}" style="display:inline-block;background:${branding.accent};color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 22px;border-radius:8px;">${escapeHTML(ctaLabel)}</a></div>` : ''}
          ${note ? `<p style="margin:0 0 8px;font-size:13px;color:#667085;line-height:1.6;">${note}</p>` : ''}
          ${portalUrl ? `<p style="margin:14px 0 0;padding-top:14px;border-top:1px solid #eaecf0;font-size:13px;color:#667085;line-height:1.6;">${escapeHTML(portalLabel || 'View this and everything else in your portal:')} <a href="${escapeHTML(portalUrl)}" style="color:${branding.accent};font-weight:600;text-decoration:none;">Open my portal</a></p>` : ''}
          ${signatureHtml(branding)}
        </td></tr>
      </table>
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#98a2b3;margin-top:14px;">${footerLine}</div>
    </td></tr>
  </table>
</body></html>`;
}

const greetName = (e) => e.contactName || e.customerName || e.name || 'there';

function baseVars(entity, branding) {
  return {
    customer: greetName(entity),
    number: entity.number || '',
    total: money(entity.total),
    dueDate: fmtDate(entity.dueDate || entity.validUntil),
    company: branding.companyName,
  };
}

export function quoteEmail(quote, { acceptUrl, portalUrl, override } = {}) {
  const cfg = resolveConfig('quote', override);
  const vars = baseVars(quote, cfg.branding);
  const defaultIntro = `Hi ${escapeHTML(vars.customer)}, please find your quote below. Let us know if you'd like to go ahead.`;
  return {
    subject: fillText(cfg.text.subject, vars) || `Quote ${quote.number} from ${cfg.branding.companyName}`,
    html: shell(cfg.branding, {
      preheader: `Your quote ${quote.number} is ready to review.`,
      heading: `Quote ${quote.number}`,
      intro: cfg.text.intro ? fillHtml(cfg.text.intro, vars) : defaultIntro,
      rows: [
        quote.title ? { label: 'For', value: quote.title } : null,
        { label: 'Quote total', value: money(quote.total) },
        quote.validUntil ? { label: 'Valid until', value: fmtDate(quote.validUntil) } : null,
      ].filter(Boolean),
      // The portal is where a quote is actually accepted or declined, so it
      // becomes the call to action when no other accept link was supplied.
      ctaLabel: (acceptUrl || portalUrl) ? (cfg.text.ctaLabel || 'Review & accept quote') : null,
      ctaUrl: acceptUrl || portalUrl || null,
      note: cfg.text.note ? fillHtml(cfg.text.note, vars)
        : (portalUrl ? 'You can accept or decline this quote in your portal — no need to reply.' : 'Reply to this email with any questions.'),
      portalUrl: (acceptUrl && portalUrl) ? portalUrl : null,
    }),
  };
}

export function invoiceEmail(invoice, { payUrl, portalUrl, override } = {}) {
  const cfg = resolveConfig('invoice', override);
  const vars = baseVars(invoice, cfg.branding);
  const defaultIntro = `Hi ${escapeHTML(vars.customer)}, your invoice is below.`;
  return {
    subject: fillText(cfg.text.subject, vars) || `Invoice ${invoice.number} from ${cfg.branding.companyName}`,
    html: shell(cfg.branding, {
      preheader: `Invoice ${invoice.number} — ${money(invoice.total)} due.`,
      heading: `Invoice ${invoice.number}`,
      intro: cfg.text.intro ? fillHtml(cfg.text.intro, vars) : defaultIntro,
      rows: [
        invoice.title ? { label: 'For', value: invoice.title } : null,
        { label: 'Amount due', value: money(invoice.total) },
        invoice.dueDate ? { label: 'Due date', value: fmtDate(invoice.dueDate) } : null,
      ].filter(Boolean),
      ctaLabel: (payUrl || portalUrl) ? (cfg.text.ctaLabel || (payUrl ? 'Pay invoice online' : 'View invoice in my portal')) : null,
      ctaUrl: payUrl || portalUrl || null,
      note: cfg.text.note ? fillHtml(cfg.text.note, vars)
        : (payUrl ? 'Pay securely by card using the button above.' : 'Please arrange payment by the due date.'),
      portalUrl: (payUrl && portalUrl) ? portalUrl : null,
    }),
  };
}

export function receiptEmail(invoice, { portalUrl, override } = {}) {
  const cfg = resolveConfig('receipt', override);
  const vars = baseVars(invoice, cfg.branding);
  const defaultIntro = `Hi ${escapeHTML(vars.customer)}, thanks — we've received your payment. Here's your receipt.`;
  return {
    subject: fillText(cfg.text.subject, vars) || `Payment received — Invoice ${invoice.number}`,
    html: shell(cfg.branding, {
      preheader: `We've received your payment for invoice ${invoice.number}.`,
      heading: 'Payment received',
      intro: cfg.text.intro ? fillHtml(cfg.text.intro, vars) : defaultIntro,
      rows: [
        { label: 'Invoice', value: invoice.number },
        { label: 'Amount paid', value: money(invoice.total) },
        invoice.paidDate ? { label: 'Paid on', value: fmtDate(invoice.paidDate) } : null,
      ].filter(Boolean),
      note: cfg.text.note ? fillHtml(cfg.text.note, vars) : 'No action needed — this email is for your records.',
      portalUrl: portalUrl || null,
      portalLabel: 'Every receipt and invoice is kept in your portal:',
    }),
  };
}

export function reminderEmail(invoice, { payUrl, portalUrl, override } = {}) {
  const cfg = resolveConfig('reminder', override);
  const vars = baseVars(invoice, cfg.branding);
  const overdue = invoice.dueDate && new Date(invoice.dueDate) < new Date();
  const defaultIntro = `Hi ${escapeHTML(vars.customer)}, a friendly reminder that the invoice below ${overdue ? 'is now overdue' : 'is due soon'}.`;
  return {
    subject: fillText(cfg.text.subject, vars) || `${overdue ? 'Overdue' : 'Reminder'}: Invoice ${invoice.number} from ${cfg.branding.companyName}`,
    html: shell(cfg.branding, {
      preheader: `Invoice ${invoice.number} — ${money(invoice.total)} ${overdue ? 'is overdue' : 'is due soon'}.`,
      heading: overdue ? `Invoice ${invoice.number} is overdue` : `Reminder: Invoice ${invoice.number}`,
      intro: cfg.text.intro ? fillHtml(cfg.text.intro, vars) : defaultIntro,
      rows: [
        { label: 'Amount due', value: money(invoice.total) },
        invoice.dueDate ? { label: 'Due date', value: fmtDate(invoice.dueDate) } : null,
      ].filter(Boolean),
      ctaLabel: (payUrl || portalUrl) ? (cfg.text.ctaLabel || (payUrl ? 'Pay now' : 'View invoice in my portal')) : null,
      ctaUrl: payUrl || portalUrl || null,
      note: cfg.text.note ? fillHtml(cfg.text.note, vars) : "If you've already paid, please disregard this reminder.",
      portalUrl: (payUrl && portalUrl) ? portalUrl : null,
    }),
  };
}

export function portalInviteEmail(customer, { portalUrl, override } = {}) {
  const cfg = resolveConfig('portal_invite', override);
  const vars = { ...baseVars(customer, cfg.branding), number: '', total: '', dueDate: '' };
  const defaultIntro = `Hi ${escapeHTML(vars.customer)}, you can now view your quotes, invoices and job updates online.`;
  return {
    subject: fillText(cfg.text.subject, vars) || `Your ${cfg.branding.companyName} customer portal`,
    html: shell(cfg.branding, {
      preheader: 'Access your quotes, invoices and job updates online.',
      heading: `Welcome to the ${cfg.branding.companyName} portal`,
      intro: cfg.text.intro ? fillHtml(cfg.text.intro, vars) : defaultIntro,
      ctaLabel: portalUrl ? (cfg.text.ctaLabel || 'Open my portal') : null,
      ctaUrl: portalUrl || null,
      note: cfg.text.note ? fillHtml(cfg.text.note, vars) : 'Bookmark the link above for easy access.',
    }),
  };
}

export function contractorInviteEmail(contractor, { portalUrl, override } = {}) {
  const cfg = resolveConfig('contractor_invite', override);
  const vars = { ...baseVars(contractor, cfg.branding), number: '', total: '', dueDate: '' };
  vars.customer = contractor.name || contractor.contactName || contractor.businessName || 'there';
  const defaultIntro = `Hi ${escapeHTML(vars.customer)}, you can now view your assigned jobs, schedule and compliance documents online.`;
  return {
    subject: fillText(cfg.text.subject, vars) || `Your ${cfg.branding.companyName} contractor portal`,
    html: shell(cfg.branding, {
      preheader: 'Access your assigned tasks and submit timesheets online.',
      heading: `Welcome to the ${cfg.branding.companyName} portal`,
      intro: cfg.text.intro ? fillHtml(cfg.text.intro, vars) : defaultIntro,
      ctaLabel: portalUrl ? (cfg.text.ctaLabel || 'Open my portal') : null,
      ctaUrl: portalUrl || null,
      note: cfg.text.note ? fillHtml(cfg.text.note, vars) : 'Bookmark the link above for easy access.',
    }),
  };
}

// Representative sample data so the Settings editor can render a live preview.
function sampleData() {
  const in7 = new Date(Date.now() + 7 * 864e5).toISOString();
  const in30 = new Date(Date.now() + 30 * 864e5).toISOString();
  return {
    quote: { number: 'Q-00412', customerName: 'Acme Developments', contactName: 'Jane Smith', title: 'Switchboard upgrade', total: 2450, validUntil: in30 },
    invoice: { number: 'INV-00023', customerName: 'Acme Developments', contactName: 'Jane Smith', title: 'Emergency electrical works', total: 1375, dueDate: in7 },
    receipt: { number: 'INV-00023', customerName: 'Acme Developments', contactName: 'Jane Smith', total: 1375, paidDate: new Date().toISOString() },
    reminder: { number: 'INV-00019', customerName: 'Acme Developments', contactName: 'Jane Smith', total: 890, dueDate: in7 },
    portal_invite: { name: 'Acme Developments', contactName: 'Jane Smith' },
  };
}

// Build a preview email for a given type with the current (or overridden) config.
export function previewEmail(type, override) {
  const s = sampleData();
  // A stand-in portal link so the editor shows the magic-link line real sends carry.
  const portalUrl = 'https://portal.example/#/portal/customer?token=sample';
  switch (type) {
    case 'quote': return quoteEmail(s.quote, { portalUrl, override });
    case 'invoice': return invoiceEmail(s.invoice, { payUrl: 'https://pay.example/checkout', portalUrl, override });
    case 'receipt': return receiptEmail(s.receipt, { portalUrl, override });
    case 'reminder': return reminderEmail(s.reminder, { payUrl: 'https://pay.example/checkout', portalUrl, override });
    case 'portal_invite': return portalInviteEmail(s.portal_invite, { portalUrl, override });
    case 'contractor_invite': return contractorInviteEmail(s.portal_invite, { portalUrl, override });
    default: return { subject: '', html: '' };
  }
}
