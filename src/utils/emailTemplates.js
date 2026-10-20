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
      // Emails get a white header by default. The document theme's headerBg is
      // the PDF table-header fill and is deliberately not inherited here.
      headerBg: pick(ob.headerBg, b.headerBg, '#FFFFFF'),
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

// ── Design tokens ────────────────────────────────
// The app's light flat system (src/styles/variables.css) restated as literals,
// because email clients ignore CSS variables and most of <style>. Flat opaque
// surfaces, hairline borders, small radii, graphite ink, and the brand accent
// as the one colour that marks what to click. Tertiary ink is the settings
// panel's darkened #6b6b68 so small print clears the 4.5:1 contrast floor.
const T = {
  canvas: '#f2f2f0',
  card: '#ffffff',
  inset: '#fbfbfa',
  border: '#e8e8e6',
  ink: '#1a1a1a',
  ink2: '#5c5c5a',
  ink3: '#6b6b68',
  font: "'IBM Plex Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif",
  mono: "'IBM Plex Mono',ui-monospace,'SF Mono',Menlo,Consolas,monospace",
};
// The app self-hosts IBM Plex, but an email can't reach the app bundle, so the
// same faces come from Google Fonts. Apple Mail, iOS Mail and Outlook for Mac
// load it; Gmail and Outlook for Windows ignore web fonts and use the fallbacks.
const FONTS_URL = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap';
// Status pills say their state in words; the tint only backs that up.
const TONES = {
  success: { fg: '#15803D', bg: '#e7f5ec' },
  warning: { fg: '#B45309', bg: '#fbf0e1' },
  danger: { fg: '#B91C1C', bg: '#fbe9e9' },
  neutral: { fg: T.ink2, bg: T.canvas },
};
// The old navy band was the shipped default, so a saved '#1E2A3A' is treated as
// "never chosen" and gets the white header rather than locking the old look in.
const LEGACY_HEADER = '#1e2a3a';

// ── Colour helpers ───────────────────────────────
const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
function hex(c, fallback) {
  const v = String(c || '').trim();
  if (!HEX.test(v)) return fallback;
  return (v.length === 4 ? '#' + [...v.slice(1)].map(x => x + x).join('') : v).toLowerCase();
}
const rgbOf = (c) => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
function luminance(c) {
  const [r, g, b] = rgbOf(c).map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}
// Darken toward black until the colour reads at 4.5:1 against white. Keeps the
// hue, so a brand orange stays orange (#FF5C00 lands beside the app's #C2410C ink).
function readableOnWhite(c) {
  let rgb = rgbOf(c);
  let out = c;
  for (let i = 0; i < 40 && contrast(out, '#ffffff') < 4.5; i++) {
    rgb = rgb.map(v => Math.round(v * 0.95));
    out = '#' + rgb.map(v => v.toString(16).padStart(2, '0')).join('');
  }
  return out;
}
// Button fill + label: white on the accent when that passes, graphite ink on a
// genuinely light accent (yellow, lime), else white on the darkened accent.
function buttonColours(accent) {
  if (contrast(accent, '#ffffff') >= 4.5) return { bg: accent, fg: '#ffffff' };
  if (luminance(accent) > 0.4 && contrast(accent, T.ink) >= 4.5) return { bg: accent, fg: T.ink };
  return { bg: readableOnWhite(accent), fg: '#ffffff' };
}

// ── Building blocks ──────────────────────────────
const rowTable = (inner, style = '') =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="${style}">${inner}</table>`;

function signatureHtml(branding) {
  return branding.signature
    ? `<tr><td style="padding:24px 0 0;font-family:${T.font};font-size:14px;line-height:1.6;color:${T.ink2};white-space:pre-line;">${escapeHTML(branding.signature)}</td></tr>`
    : '';
}

function statusPill(status) {
  if (!status || !status.label) return '';
  const tone = TONES[status.tone] || TONES.neutral;
  return `<tr><td style="padding:0 0 12px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
    <td style="background:${tone.bg};color:${tone.fg};font-family:${T.font};font-size:12px;font-weight:600;line-height:1;padding:6px 10px;border-radius:999px;">${escapeHTML(status.label)}</td>
  </tr></table></td></tr>`;
}

// Bulletproof button: a padded, filled table cell, so Outlook keeps the fill.
function buttonHtml(label, url, colours) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
    <td bgcolor="${colours.bg}" style="background:${colours.bg};border-radius:6px;">
      <a href="${escapeHTML(url)}" target="_blank" style="display:inline-block;padding:12px 22px;font-family:${T.font};font-size:15px;font-weight:600;line-height:1.2;color:${colours.fg};text-decoration:none;border-radius:6px;">${escapeHTML(label)}</a>
    </td>
  </tr></table>`;
}

// The boxed summary: one headline figure, then label/value rows on hairlines,
// the same reading order as a boxed detail panel in the app. `mono` rows set
// machine-readable values (document numbers) in IBM Plex Mono.
function summaryHtml(amount, rows) {
  if (!amount && !rows.length) return '';
  const head = amount ? `<tr><td colspan="2" style="padding:18px 20px;">
      <div style="font-family:${T.font};font-size:12px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:${T.ink3};">${escapeHTML(amount.label)}</div>
      <div style="font-family:${T.font};font-size:28px;font-weight:600;line-height:1.25;letter-spacing:-0.01em;color:${T.ink};padding-top:4px;font-variant-numeric:tabular-nums;">${escapeHTML(amount.value)}</div>
    </td></tr>` : '';
  const body = rows.map((r, i) => {
    const line = (amount || i > 0) ? `border-top:1px solid ${T.border};` : '';
    return `<tr>
      <td style="${line}padding:11px 0 11px 20px;font-family:${T.font};font-size:14px;color:${T.ink2};">${escapeHTML(r.label)}</td>
      <td align="right" style="${line}padding:11px 20px 11px 12px;font-family:${r.mono ? T.mono : T.font};font-size:14px;font-weight:500;color:${T.ink};text-align:right;font-variant-numeric:tabular-nums;">${escapeHTML(r.value)}</td>
    </tr>`;
  }).join('');
  return `<tr><td style="padding:0 0 24px;">${rowTable(head + body, `background:${T.inset};border:1px solid ${T.border};border-radius:8px;border-collapse:separate;`)}</td></tr>`;
}

// heading + row label/value are plain text (escaped here); intro + note are raw
// HTML fragments already run through fillHtml by the caller.
// `amount` is the headline figure ({ label, value }), `status` an optional pill
// ({ label, tone }). `portalUrl` adds the customer's magic link under the note
// so they can review, accept and pay in their portal rather than replying.
function shell(branding, { preheader, heading, intro, status, amount, rows = [], ctaLabel, ctaUrl, note, portalUrl, portalLabel }) {
  const name = branding.companyName;
  const accent = hex(branding.accent, '#ff5c00');
  const btn = buttonColours(accent);
  const linkInk = readableOnWhite(accent);
  let headerBg = hex(branding.headerBg, '#ffffff');
  if (headerBg === LEGACY_HEADER) headerBg = '#ffffff';
  const headerInk = contrast(headerBg, T.ink) >= 4.5 ? T.ink : '#ffffff';
  const headerRule = headerBg === '#ffffff' ? `border-bottom:1px solid ${T.border};` : '';
  const brandHead = (branding.useLogo && branding.logo)
    ? `<img src="${escapeHTML(branding.logo)}" alt="${escapeHTML(name)}" height="32" style="max-height:32px;max-width:200px;height:auto;display:block;border:0;" />`
    : `<span style="font-family:${T.font};font-size:16px;font-weight:600;color:${headerInk};">${escapeHTML(name)}</span>`;
  const footerLine = branding.footer ? escapeHTML(branding.footer) : `Sent by ${escapeHTML(name)}`;
  // Invisible padding stops clients pulling body copy into the inbox preview.
  const preheaderPad = '&#8199;&#847; '.repeat(40);
  const p = (style, html) => `<tr><td style="${style}">${html}</td></tr>`;
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light" />
<meta name="supported-color-schemes" content="light" />
<title>${escapeHTML(heading)}</title>
<!--[if !mso]><!-->
<link href="${FONTS_URL}" rel="stylesheet" />
<!--<![endif]-->
<style>
  @media (max-width: 620px) {
    .r-pad { padding-left: 20px !important; padding-right: 20px !important; }
    .r-outer { padding: 16px 12px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${T.canvas};-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHTML(preheader || '')}${preheaderPad}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${T.canvas};">
    <tr><td align="center" class="r-outer" style="padding:32px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:${T.card};border:1px solid ${T.border};border-radius:8px;border-collapse:separate;">
        <tr><td class="r-pad" bgcolor="${headerBg}" style="background:${headerBg};padding:20px 32px;${headerRule}">${brandHead}</td></tr>
        <tr><td class="r-pad" style="padding:32px;">
          ${rowTable([
            statusPill(status),
            p(`padding:0 0 12px;font-family:${T.font};font-size:22px;font-weight:600;line-height:1.3;letter-spacing:-0.01em;color:${T.ink};`, escapeHTML(heading)),
            p(`padding:0 0 24px;font-family:${T.font};font-size:15px;line-height:1.6;color:${T.ink2};`, intro || ''),
            summaryHtml(amount, rows),
            ctaUrl && ctaLabel ? p('padding:0 0 24px;', buttonHtml(ctaLabel, ctaUrl, btn)) : '',
            note ? p(`padding:0;font-family:${T.font};font-size:14px;line-height:1.6;color:${T.ink3};`, note) : '',
            portalUrl ? p(`padding:16px 0 0;font-family:${T.font};font-size:14px;line-height:1.6;color:${T.ink2};`,
              `${escapeHTML(portalLabel || 'View this and everything else in your portal:')} <a href="${escapeHTML(portalUrl)}" target="_blank" style="color:${linkInk};font-weight:600;text-decoration:underline;">Open my portal</a>`) : '',
            signatureHtml(branding),
          ].join(''))}
        </td></tr>
      </table>
      ${rowTable(p(`padding:16px 32px 0;font-family:${T.font};font-size:12px;line-height:1.5;color:${T.ink3};text-align:center;`, footerLine), 'max-width:600px;')}
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
      amount: { label: 'Quote total', value: money(quote.total) },
      rows: [
        { label: 'Quote', value: quote.number, mono: true },
        quote.title ? { label: 'For', value: quote.title } : null,
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
      amount: { label: 'Amount due', value: money(invoice.total) },
      rows: [
        { label: 'Invoice', value: invoice.number, mono: true },
        invoice.title ? { label: 'For', value: invoice.title } : null,
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
      status: { label: 'Paid', tone: 'success' },
      amount: { label: 'Amount paid', value: money(invoice.total) },
      rows: [
        { label: 'Invoice', value: invoice.number, mono: true },
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
      status: overdue ? { label: 'Overdue', tone: 'danger' } : { label: 'Due soon', tone: 'warning' },
      amount: { label: 'Amount due', value: money(invoice.total) },
      rows: [
        { label: 'Invoice', value: invoice.number, mono: true },
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
