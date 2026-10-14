// ============================================
// RELAY — ONE-CLICK DOCUMENT EMAILS
// ============================================
// Re-send a quote or send a payment reminder for one invoice, exactly as the
// quote page and the automatic reminder sweep do (same template, portal link,
// PDF attachment, and email_log entry). Used by the dashboard's action widgets.

import { store } from '../data/store.js';
import { sendEmail, emailEnabledFor, emailBlockedReason } from './email.js';
import { quoteEmail, reminderEmail } from './emailTemplates.js';
import { portalUrlForDocument } from './portalLinks.js';
import { documentAttachment } from './documentPdf.js';

/** The address a document goes to: its own, else its customer's. */
export function documentRecipient(doc) {
  return doc.customerEmail || (doc.customerId && store.getById('customers', doc.customerId)?.email) || '';
}

/** Why a document can't be emailed right now, or null when it can. */
export function emailUnavailableReason(template, doc) {
  if (!emailEnabledFor(template)) return emailBlockedReason(template) || 'Email is switched off for this document type.';
  if (!documentRecipient(doc)) return 'No customer email on file.';
  return null;
}

/** Email the quote to its customer again. Resolves to the address it went to. */
export async function sendQuoteEmail(quote) {
  const to = documentRecipient(quote);
  if (!to) throw new Error('No customer email on file for this quote');
  const { subject, html } = quoteEmail(quote, { portalUrl: await portalUrlForDocument(quote) });
  const attachments = await documentAttachment('quote', quote);
  await sendEmail({ to, subject, html, attachments, template: 'quote', relatedType: 'quote', relatedId: quote.id });
  return to;
}

/** Send one payment reminder for the invoice. Resolves to the address it went to. */
export async function sendInvoiceReminder(inv) {
  const to = documentRecipient(inv);
  if (!to) throw new Error('No customer email on file for this invoice');
  const { subject, html } = reminderEmail(inv, { portalUrl: await portalUrlForDocument(inv) });
  const attachments = await documentAttachment('invoice', inv);
  // sendEmail logs the attempt to email_log, which the reminder sweep de-dups on.
  await sendEmail({ to, subject, html, attachments, template: 'reminder', relatedType: 'invoice', relatedId: inv.id });
  return to;
}
