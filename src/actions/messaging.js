/**
 * Subcontractors and staff — handing out work and getting word to people.
 *
 * A contractor is put on a job the way `JobDetail.js` does it, by adding them to
 * a task's `assignedContractorIds` with a `contractor_assigned` history entry;
 * that is what their portal reads. The portal link is minted and stored by
 * `utils/portalLinks.js` before anything is sent, and the invite is the same
 * `contractor_invite` email the contractor page sends.
 *
 * Email goes to staff and contractors only. Customers hear from the business
 * through the documents sent to them (`send_quote`), never a message brny writes.
 */

import { store } from '../data/store.js';
import { defineAction } from './registry.js';
import { resolveOne } from './resolve.js';
import { objectSchema, str, bool } from './schema.js';
import { invalidInput } from './errors.js';
import { actorStamp, logActivity } from './context.js';
import { resolveJob, resolveJobTask } from './jobs.js';
import { contractorPortalUrl } from '../utils/portalLinks.js';
import { contractorInviteEmail } from '../utils/emailTemplates.js';
import { emailEnabledFor, emailBlockedReason, sendEmail } from '../utils/email.js';
import { escapeHTML } from '../utils/security.js';

const contractorSearch = {
  label: (record) => record.businessName || record.contactName || record.id,
  searchFields: ['businessName', 'contactName', 'email'],
  what: 'contractor',
};

const staffSearch = {
  label: (person) => person.name || person.username || person.id,
  searchFields: ['name', 'username', 'role'],
  what: 'staff member',
};

export function resolveContractor(query) {
  return resolveOne('contractors', query, contractorSearch).record;
}

const contractorName = (contractor) => contractor.businessName || contractor.contactName || contractor.id;

/** Why an email of this kind cannot go out, or null when it can. */
function blockedReason(template, to) {
  if (!emailEnabledFor(template)) return emailBlockedReason(template) || 'Email is switched off for this kind of message.';
  if (!to) return 'There is no email address on file for them.';
  return null;
}

defineAction({
  name: 'assign_contractor',
  title: 'Assign contractor',
  description:
    'Put a subcontractor on a job task so it shows in their contractor portal. Pass `task` for one task, or leave it out to put them on every top-level task of the job. Pass `remove` to take them off. Send them the portal link with send_contractor_portal_link if they have not had it.',
  permission: { module: 'Jobs', key: 'manage_tasks' },
  inputSchema: objectSchema(
    {
      job: str('Job number, title, customer or id.'),
      contractor: str('Contractor business name, contact or id.'),
      task: str('The task to assign. Leave out for every top-level task.'),
      remove: bool('Take the contractor off instead.'),
    },
    ['job', 'contractor']
  ),
  summarize: (input, result) => `${result.contractorName} ${input.remove ? 'taken off' : 'assigned to'} ${result.tasks.map((t) => `"${t}"`).join(', ')} on job ${result.job.number}.`,
  artifacts: (result) => [{ label: `Open job ${result.job.number}`, path: `/jobs/${result.job.id}` }],
  async run(input) {
    const job = resolveJob(input.job);
    const contractor = resolveContractor(input.contractor);
    if (contractor.active === false) throw invalidInput(`${contractorName(contractor)} is marked inactive. Reactivate them with update_contractor first.`);

    const tasks = JSON.parse(JSON.stringify(job.tasks || []));
    if (!tasks.length) throw invalidInput(`Job ${job.number} has no tasks to assign.`);
    const targets = input.task ? [resolveJobTask({ tasks }, input.task).node] : tasks;

    const changed = [];
    targets.forEach((node) => {
      const ids = [...(node.assignedContractorIds || (node.assignedContractorId ? [node.assignedContractorId] : []))];
      const has = ids.includes(contractor.id);
      if (input.remove ? !has : has) return;
      node.assignedContractorIds = input.remove ? ids.filter((id) => id !== contractor.id) : [...ids, contractor.id];
      delete node.assignedContractorId;
      changed.push(node.name);
    });
    if (!changed.length) {
      return { job, contractorName: contractorName(contractor), tasks: targets.map((t) => t.name), changed: false };
    }

    const entry = {
      id: store.generateId(),
      type: 'system',
      action: 'contractor_assigned',
      date: new Date().toISOString(),
      author: actorStamp().createdBy || 'brny',
      content: input.remove
        ? `Removed contractor [${contractorName(contractor)}] from ${changed.map((n) => `"${n}"`).join(', ')}`
        : `Assigned task ${changed.map((n) => `"${n}"`).join(', ')} to contractor(s) [${contractorName(contractor)}]`,
    };
    await store.update('jobs', job.id, { tasks, historyLog: [entry, ...(job.historyLog || [])] });
    logActivity({ type: 'contractor_assigned', text: entry.content, recordType: 'job', recordId: job.id });
    return { job: store.getById('jobs', job.id), contractorName: contractorName(contractor), tasks: changed, changed: true };
  },
});

defineAction({
  name: 'send_contractor_portal_link',
  title: 'Send contractor portal link',
  description:
    'Email a subcontractor their portal link — where they see the tasks assigned to them, the job details and documents, and log their time. Pass `emailIt: false` to just get the link back to hand on yourself. When email cannot go out, the link is still returned and the reply says why it was not emailed.',
  permission: { module: 'Contractors', key: 'edit' },
  risky: true,
  inputSchema: objectSchema(
    {
      contractor: str('Contractor business name, contact or id.'),
      emailIt: bool('Email it to them. Defaults to true.'),
    },
    ['contractor']
  ),
  summarize: (input, result) => result.summary,
  artifacts: (result) => [{ label: result.contractorName, path: `/contractors/${result.contractorId}` }],
  async run(input) {
    const contractor = resolveContractor(input.contractor);
    const url = await contractorPortalUrl(contractor);
    if (!url) throw invalidInput(`Could not save a portal link for ${contractorName(contractor)}, so nothing was sent. Try again.`);

    const base = { contractorId: contractor.id, contractorName: contractorName(contractor), url };
    if (input.emailIt === false) return { ...base, emailed: false, summary: `Portal link for ${base.contractorName}: ${url}` };

    const blocked = blockedReason('contractor_invite', contractor.email);
    if (blocked) {
      return { ...base, emailed: false, emailBlockedReason: blocked, summary: `NO email went to ${base.contractorName}: ${blocked} Their portal link is ${url}` };
    }

    const { subject, html } = contractorInviteEmail(contractor, { portalUrl: url });
    await sendEmail({ to: contractor.email, subject, html, template: 'contractor_invite', relatedType: 'contractor', relatedId: contractor.id });
    store.create('notifications', {
      title: 'Contractor Portal Invite Sent',
      message: `Portal access link emailed to ${base.contractorName} (${contractor.email})`,
      link: `/contractors/${contractor.id}`,
      read: true,
      createdAt: new Date().toISOString(),
      status: 'Converted',
      origin: 'system',
    });
    logActivity({ type: 'contractor_portal', text: `Portal link emailed to ${base.contractorName} (${contractor.email}).`, recordType: 'contractor', recordId: contractor.id });
    return { ...base, emailed: true, to: contractor.email, summary: `Portal link emailed to ${base.contractorName} at ${contractor.email}.` };
  },
});

defineAction({
  name: 'send_email',
  title: 'Email a staff member or contractor',
  description:
    'Email one of your own staff or a subcontractor — job details, a reminder, a heads-up. Not for customers: they are sent quotes with send_quote, and anything else for a customer becomes a to-do for a person. Write the message in plain text; it is sent from the business\'s email.',
  permission: { module: 'Contractors', key: 'view' },
  risky: true,
  inputSchema: objectSchema(
    {
      to: str('A staff member\'s name or username, or a contractor\'s business or contact name.'),
      subject: str('Subject line.'),
      message: str('The message, in plain text.'),
    },
    ['to', 'subject', 'message']
  ),
  summarize: (input, result) => result.summary,
  async run(input) {
    if (!String(input.message || '').trim() || !String(input.subject || '').trim()) throw invalidInput('An email needs a subject and a message.');
    const recipient = findRecipient(input.to);
    const blocked = blockedReason('custom', recipient.email);
    if (blocked) {
      return { emailed: false, recipient: recipient.name, emailBlockedReason: blocked, summary: `NO email went to ${recipient.name}: ${blocked}` };
    }
    const html = `<p>${escapeHTML(input.message.trim()).replace(/\n/g, '<br>')}</p>`;
    await sendEmail({
      to: recipient.email,
      subject: input.subject.trim(),
      html,
      text: input.message.trim(),
      template: 'custom',
      relatedType: recipient.kind,
      relatedId: recipient.id,
    });
    logActivity({ type: 'email_sent', text: `Emailed ${recipient.name} (${recipient.email}): ${input.subject.trim()}` });
    return { emailed: true, recipient: recipient.name, to: recipient.email, summary: `Emailed ${recipient.name} at ${recipient.email}.` };
  },
});

/**
 * A staff member or contractor, with the address mail actually reaches. A Cloud
 * sign-in email is an internal `@….relay.internal` address, so staff are written
 * to at their backup email.
 */
function findRecipient(query) {
  const tryResolve = (collection, options) => {
    try {
      return resolveOne(collection, query, options).record;
    } catch (error) {
      if (error.code === 'not_found') return null;
      throw error;
    }
  };
  const person = tryResolve('technicians', { ...staffSearch, filter: (p) => !p.deactivated });
  if (person) {
    const real = [person.backupEmail, person.email].find((address) => address && !/\.relay\.internal$/i.test(address));
    return { kind: 'staff', id: person.id, name: person.name || person.username, email: real || '' };
  }
  const contractor = tryResolve('contractors', contractorSearch);
  if (contractor) return { kind: 'contractor', id: contractor.id, name: contractorName(contractor), email: contractor.email || '' };
  throw invalidInput(`No staff member or contractor matches "${query}". brny only emails your own staff and contractors.`);
}

