// ============================================
// RELAY — AUTOMATIC PAYMENT REMINDERS (v1.3 #5)
// ============================================
// One sweep that emails reminders for unpaid invoices: a single nudge N days
// before the due date, then a repeat every M days while overdue. Cloud + email
// configured + reminders-enabled only. De-dups via email_log so re-runs (or a
// second tab) never spam a customer. Runs inside the maintenance engine's locked
// periodic check, so only one tab/machine sweeps at a time.

import { store } from '../data/store.js';
import { emailConfigured, emailEnabledFor, sendEmail } from './email.js';
import { reminderEmail } from './emailTemplates.js';

const DAY = 86400000;

function reminderSettings() {
  return (((store.getSettings() || {}).email || {}).reminders) || {};
}

export async function checkPaymentReminders() {
  if (!emailConfigured() || !emailEnabledFor('reminder')) return;
  const cfg = reminderSettings();
  if (!cfg.enabled) return;

  const beforeDays = Number(cfg.beforeDays) || 0;
  const afterDays = Number(cfg.afterDays) > 0 ? Number(cfg.afterDays) : 7;

  const invoices = store.getAll('invoices') || [];
  const logs = store.getAll('emailLog') || [];
  const now = Date.now();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  for (const inv of invoices) {
    if (inv.status !== 'Sent' && inv.status !== 'Overdue') continue;
    if (!inv.dueDate) continue;
    const due = new Date(inv.dueDate);
    if (isNaN(due.getTime())) continue;
    due.setHours(0, 0, 0, 0);
    const daysUntilDue = Math.round((due.getTime() - startOfToday.getTime()) / DAY);

    // Reminders already sent for this invoice.
    const sent = logs.filter(l => l.template === 'reminder' && l.relatedId === inv.id && l.status === 'sent');
    let lastAt = 0;
    sent.forEach(l => { const t = new Date(l.createdAt).getTime(); if (!isNaN(t) && t > lastAt) lastAt = t; });
    const daysSinceLast = lastAt ? (now - lastAt) / DAY : Infinity;

    let shouldRemind = false;
    if (daysUntilDue > 0) {
      // Single pre-due nudge once we're within `beforeDays` of the due date.
      if (beforeDays > 0 && daysUntilDue <= beforeDays && sent.length === 0) shouldRemind = true;
    } else {
      // Overdue: repeat every `afterDays`.
      if (daysSinceLast >= afterDays) shouldRemind = true;
    }
    if (!shouldRemind) continue;

    const to = inv.customerEmail || (inv.customerId && store.getById('customers', inv.customerId)?.email);
    if (!to) continue;

    try {
      const { subject, html } = reminderEmail(inv, {});
      // sendEmail logs the attempt (sent/failed) to email_log, which is also our
      // de-dup source on the next sweep.
      await sendEmail({ to, subject, html, template: 'reminder', relatedType: 'invoice', relatedId: inv.id });
    } catch (_) {
      // Failure is already logged by sendEmail; keep going with the rest.
    }
  }
}
