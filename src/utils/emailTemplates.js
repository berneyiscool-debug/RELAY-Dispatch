// ============================================
// RELAY — EMAIL TEMPLATES (v1.3 #5)
// ============================================
// Themed, email-client-safe HTML for the transactional emails RELAY sends.
// Table-based layout + inline styles (what Gmail/Outlook/Apple Mail need), tinted
// with the company's documentTheme colours. Each builder returns { subject, html }.
// User data is escaped; `intro`/`note` are pre-composed HTML fragments.

import { store } from '../data/store.js';
import { escapeHTML } from './security.js';

const money = (n) => '$' + Number(n || 0).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return String(d);
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
}

function theme() {
  const dt = (store.getSettings() || {}).documentTheme || {};
  return { accent: dt.accentColor || '#FF5C00', headerBg: dt.headerBg || '#1E2A3A' };
}

function companyName() {
  return (store.getSettings() || {}).name || 'RELAY';
}

function signatureHtml() {
  const sig = ((store.getSettings() || {}).email || {}).signature || '';
  return sig
    ? `<div style="margin-top:22px;padding-top:16px;border-top:1px solid #eaecf0;font-size:13px;color:#667085;white-space:pre-line;">${escapeHTML(sig)}</div>`
    : '';
}

// heading + row label/value are plain text (escaped here); intro + note are raw
// HTML fragments the caller composed (with escapeHTML around any user data).
function shell({ preheader, heading, intro, rows = [], ctaLabel, ctaUrl, note }) {
  const t = theme();
  const name = companyName();
  const rowsHtml = rows.map(r => `
    <tr>
      <td style="padding:6px 0;color:#667085;font-size:13px;">${escapeHTML(r.label)}</td>
      <td style="padding:6px 0;color:#101828;font-size:13px;font-weight:600;text-align:right;">${escapeHTML(r.value)}</td>
    </tr>`).join('');
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f3f5f7;">
  <span style="display:none;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;">${escapeHTML(preheader || '')}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f5f7;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #eaecf0;">
        <tr><td style="background:${t.headerBg};padding:20px 28px;">
          <div style="color:#ffffff;font-size:18px;font-weight:700;">${escapeHTML(name)}</div>
        </td></tr>
        <tr><td style="padding:28px;">
          <h1 style="margin:0 0 12px;font-size:20px;color:#101828;">${escapeHTML(heading)}</h1>
          <p style="margin:0 0 18px;font-size:14px;color:#475467;line-height:1.6;">${intro || ''}</p>
          ${rows.length ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #eaecf0;border-bottom:1px solid #eaecf0;margin:0 0 20px;">${rowsHtml}</table>` : ''}
          ${ctaUrl && ctaLabel ? `<div style="margin:0 0 20px;"><a href="${escapeHTML(ctaUrl)}" style="display:inline-block;background:${t.accent};color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 22px;border-radius:8px;">${escapeHTML(ctaLabel)}</a></div>` : ''}
          ${note ? `<p style="margin:0 0 8px;font-size:13px;color:#667085;line-height:1.6;">${note}</p>` : ''}
          ${signatureHtml()}
        </td></tr>
      </table>
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#98a2b3;margin-top:14px;">Sent by ${escapeHTML(name)}</div>
    </td></tr>
  </table>
</body></html>`;
}

const greet = (entity) => `Hi ${escapeHTML(entity.contactName || entity.customerName || entity.name || 'there')},`;

export function quoteEmail(quote, { acceptUrl } = {}) {
  return {
    subject: `Quote ${quote.number} from ${companyName()}`,
    html: shell({
      preheader: `Your quote ${quote.number} is ready to review.`,
      heading: `Quote ${quote.number}`,
      intro: `${greet(quote)} please find your quote below. Let us know if you'd like to go ahead.`,
      rows: [
        quote.title ? { label: 'For', value: quote.title } : null,
        { label: 'Quote total', value: money(quote.total) },
        quote.validUntil ? { label: 'Valid until', value: fmtDate(quote.validUntil) } : null,
      ].filter(Boolean),
      ctaLabel: acceptUrl ? 'Review & accept quote' : null,
      ctaUrl: acceptUrl || null,
      note: 'Reply to this email with any questions.',
    }),
  };
}

export function invoiceEmail(invoice, { payUrl } = {}) {
  return {
    subject: `Invoice ${invoice.number} from ${companyName()}`,
    html: shell({
      preheader: `Invoice ${invoice.number} — ${money(invoice.total)} due.`,
      heading: `Invoice ${invoice.number}`,
      intro: `${greet(invoice)} your invoice is below.`,
      rows: [
        invoice.title ? { label: 'For', value: invoice.title } : null,
        { label: 'Amount due', value: money(invoice.total) },
        invoice.dueDate ? { label: 'Due date', value: fmtDate(invoice.dueDate) } : null,
      ].filter(Boolean),
      ctaLabel: payUrl ? 'Pay invoice online' : null,
      ctaUrl: payUrl || null,
      note: payUrl ? 'Pay securely by card using the button above.' : 'Please arrange payment by the due date.',
    }),
  };
}

export function receiptEmail(invoice) {
  return {
    subject: `Payment received — Invoice ${invoice.number}`,
    html: shell({
      preheader: `We've received your payment for invoice ${invoice.number}.`,
      heading: 'Payment received',
      intro: `${greet(invoice)} thanks — we've received your payment. Here's your receipt.`,
      rows: [
        { label: 'Invoice', value: invoice.number },
        { label: 'Amount paid', value: money(invoice.total) },
        invoice.paidDate ? { label: 'Paid on', value: fmtDate(invoice.paidDate) } : null,
      ].filter(Boolean),
      note: 'No action needed — this email is for your records.',
    }),
  };
}

export function reminderEmail(invoice, { payUrl } = {}) {
  const overdue = invoice.dueDate && new Date(invoice.dueDate) < new Date();
  return {
    subject: `${overdue ? 'Overdue' : 'Reminder'}: Invoice ${invoice.number} from ${companyName()}`,
    html: shell({
      preheader: `Invoice ${invoice.number} — ${money(invoice.total)} ${overdue ? 'is overdue' : 'is due soon'}.`,
      heading: overdue ? `Invoice ${invoice.number} is overdue` : `Reminder: Invoice ${invoice.number}`,
      intro: `${greet(invoice)} a friendly reminder that the invoice below ${overdue ? 'is now overdue' : 'is due soon'}.`,
      rows: [
        { label: 'Amount due', value: money(invoice.total) },
        invoice.dueDate ? { label: 'Due date', value: fmtDate(invoice.dueDate) } : null,
      ].filter(Boolean),
      ctaLabel: payUrl ? 'Pay now' : null,
      ctaUrl: payUrl || null,
      note: "If you've already paid, please disregard this reminder.",
    }),
  };
}

export function portalInviteEmail(customer, { portalUrl } = {}) {
  return {
    subject: `Your ${companyName()} customer portal`,
    html: shell({
      preheader: 'Access your quotes, invoices and job updates online.',
      heading: `Welcome to the ${companyName()} portal`,
      intro: `${greet(customer)} you can now view your quotes, invoices and job updates online.`,
      ctaLabel: portalUrl ? 'Open my portal' : null,
      ctaUrl: portalUrl || null,
      note: 'Bookmark the link above for easy access.',
    }),
  };
}
