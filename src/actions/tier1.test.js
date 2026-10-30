/**
 * The everyday tools brny was missing: sending a quote, timesheet sign-off,
 * suppliers, contractors and projects, payment links and Xero.
 *
 * Run against the demo business, as in `jobs.test.js`, so nothing reaches
 * Supabase, IndexedDB or a mail server — which is also why the email, Stripe and
 * Xero paths are checked for refusing cleanly rather than for sending.
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { store, DEMO_COMPANY_ID } from '../data/store.js';
import { supabase } from '../utils/supabase.js';
import { executeAction } from './registry.js';
import { ERROR_CODES } from './errors.js';
import './index.js';

const CTX = { source: 'eval', actor: { id: 'user_test', name: 'Test Admin', role: 'admin' } };
const CUSTOMER = 'Brny Tier One Probe Pty Ltd';

describe('assistant tier 1 tools', () => {
  const saved = {};

  beforeEach(async () => {
    saved.from = supabase.from;
    supabase.from = () => ({ upsert: async () => ({}), insert: async () => ({}), delete: () => ({ eq: async () => ({}), in: async () => ({}) }) });
    store.demoMode = true;
    store.companyId = DEMO_COMPANY_ID;
    store.db = { transaction: () => { throw new Error('IndexedDB touched'); } };
    await store.initializeDemo({ id: 'user_test', name: 'Test Admin', email: 'test@example.com' });
    store.create('customers', { company: CUSTOMER, status: 'Active', type: 'Company', email: 'probe@example.com' });
  });

  afterEach(() => {
    supabase.from = saved.from;
    store.demoMode = false;
    store.db = null;
    store.clearSync();
  });

  describe('send_quote', () => {
    async function draftQuote() {
      const { result } = await executeAction('create_quote', { customer: CUSTOMER, title: 'Switchboard upgrade', items: [{ description: 'Labour', rate: 500 }] }, CTX);
      return result.quote;
    }

    test('needs approval when brny calls it', async () => {
      const quote = await draftQuote();
      await assert.rejects(
        executeAction('send_quote', { quote: quote.number }, { ...CTX, source: 'brny' }),
        (error) => error.code === ERROR_CODES.APPROVAL_REQUIRED,
      );
    });

    test('emails the quote to the customer and marks it sent', async () => {
      const quote = await draftQuote();
      const { result } = await executeAction('send_quote', { quote: quote.number }, CTX);
      assert.strictEqual(result.emailed, true);
      assert.strictEqual(result.to, 'probe@example.com');
      assert.strictEqual(store.getById('quotes', quote.id).status, 'Sent');
    });

    test('says plainly that no email went out when there is no address on file', async () => {
      store.create('customers', { company: 'No Email Probe Pty Ltd', status: 'Active', type: 'Company' });
      const { result: created } = await executeAction('create_quote', { customer: 'No Email Probe Pty Ltd', title: 'Fan', items: [{ description: 'Labour', rate: 100 }] }, CTX);
      const quote = created.quote;
      const { result } = await executeAction('send_quote', { quote: quote.number }, CTX);
      assert.strictEqual(result.emailed, false);
      assert.ok(result.emailBlockedReason);
      assert.match(result.summary, /NO email/);
      assert.strictEqual(store.getById('quotes', quote.id).status, 'Sent');
    });

    test('will not resend without being asked', async () => {
      const quote = await draftQuote();
      await executeAction('send_quote', { quote: quote.number }, CTX);
      const { result } = await executeAction('send_quote', { quote: quote.number }, CTX);
      assert.match(result.summary, /already been sent/);
    });
  });

  describe('timesheets', () => {
    const DAY = '2026-10-20';
    let tech;
    let closed;
    let open;

    beforeEach(() => {
      tech = store.create('technicians', { name: 'Tess Timesheet', role: 'Technician' });
      closed = store.create('timeClocks', { technicianId: tech.id, technicianName: tech.name, clockInAt: `${DAY}T07:00:00`, clockOutAt: `${DAY}T15:30:00`, approvalStatus: 'pending' });
      open = store.create('timeClocks', { technicianId: tech.id, technicianName: tech.name, clockInAt: `${DAY}T16:00:00`, approvalStatus: 'pending' });
    });

    test('review_timesheets lists the period with totals', async () => {
      const { result } = await executeAction('review_timesheets', { technician: tech.name, from: DAY }, CTX);
      assert.strictEqual(result.sessions.length, 2);
      assert.strictEqual(result.pending, 2);
      assert.strictEqual(result.stillClockedIn, 1);
    });

    test('approve_timesheets stamps closed sessions and skips open ones', async () => {
      const { result } = await executeAction('approve_timesheets', { technician: tech.name, from: DAY }, CTX);
      assert.strictEqual(result.approved.length, 1);
      assert.strictEqual(result.hours, 8.5);
      assert.strictEqual(result.stillClockedIn, 1);
      const saved = store.getById('timeClocks', closed.id);
      assert.strictEqual(saved.approvalStatus, 'approved');
      assert.strictEqual(saved.approvedHours, 8.5);
      assert.ok(saved.approvedBy);
      assert.strictEqual(store.getById('timeClocks', open.id).approvalStatus, 'pending');
    });

    test('a technician\'s own correction becomes the approved figure', async () => {
      store.update('timeClocks', closed.id, { approvedHours: 8 });
      await executeAction('approve_timesheets', { technician: tech.name, from: DAY }, CTX);
      const saved = store.getById('timeClocks', closed.id);
      assert.strictEqual(saved.approvalStatus, 'adjusted');
      assert.strictEqual(saved.approvedHours, 8);
    });

    test('reject_timesheets needs approval and a reason, and zeroes the hours', async () => {
      await assert.rejects(
        executeAction('reject_timesheets', { session: closed.id, reason: 'Not on site' }, { ...CTX, source: 'brny' }),
        (error) => error.code === ERROR_CODES.APPROVAL_REQUIRED,
      );
      const { result } = await executeAction('reject_timesheets', { session: closed.id, reason: 'Not on site' }, CTX);
      assert.strictEqual(result.hoursRemoved, 8.5);
      const saved = store.getById('timeClocks', closed.id);
      assert.strictEqual(saved.approvalStatus, 'rejected');
      assert.strictEqual(saved.approvedHours, 0);
      assert.strictEqual(saved.note, 'Not on site');
    });
  });

  describe('suppliers, contractors and projects', () => {
    test('create_supplier writes the form\'s fields and refuses a duplicate', async () => {
      const { result } = await executeAction('create_supplier', { name: 'Probe Wholesale', email: 'orders@probe.example', paymentTerms: '14 Days' }, CTX);
      assert.strictEqual(result.supplier.active, true);
      assert.strictEqual(result.supplier.paymentTerms, '14 Days');
      await assert.rejects(
        executeAction('create_supplier', { name: 'probe wholesale' }, CTX),
        (error) => error.code === ERROR_CODES.CONFLICT,
      );
      const updated = await executeAction('update_supplier', { supplier: 'Probe Wholesale', active: false }, CTX);
      assert.strictEqual(updated.result.supplier.active, false);
    });

    test('a new supplier can take a purchase order straight away', async () => {
      await executeAction('create_supplier', { name: 'Probe Electrical Supplies' }, CTX);
      const { result } = await executeAction('create_purchase_order', { supplier: 'Probe Electrical Supplies', items: [{ description: 'Cable', quantity: 1, unitCost: 100 }] }, CTX);
      assert.strictEqual(result.purchaseOrder.supplierName, 'Probe Electrical Supplies');
    });

    test('create_contractor syncs the insurance compliance entry', async () => {
      const { result } = await executeAction('create_contractor', {
        businessName: 'Probe Data Co', contactName: 'Dana', insuranceExpiry: '2027-06-30', licenseNumber: 'EC123', hourlyRate: 95, specialties: ['Data cabling'],
      }, CTX);
      assert.strictEqual(result.contractor.complianceDocs.length, 1);
      assert.strictEqual(result.contractor.complianceDocs[0].expiryDate, '2027-06-30');
      assert.strictEqual(result.contractor.complianceDocs[0].number, 'PL-EC123');

      const updated = await executeAction('update_contractor', { contractor: 'Probe Data Co', insuranceExpiry: '2028-06-30' }, CTX);
      assert.strictEqual(updated.result.contractor.complianceDocs.length, 1);
      assert.strictEqual(updated.result.contractor.complianceDocs[0].expiryDate, '2028-06-30');
    });

    test('create_project numbers the project and a job can be filed under it', async () => {
      const { result } = await executeAction('create_project', { customer: CUSTOMER, name: 'Warehouse fit-out' }, CTX);
      assert.match(result.project.number, /^PRJ-/);
      assert.strictEqual(result.project.status, 'In Progress');

      const job = (await executeAction('create_job', { customer: CUSTOMER, title: 'Lighting' }, CTX)).result.job;
      await executeAction('update_job', { job: job.number, project: result.project.number }, CTX);
      assert.strictEqual(store.getById('jobs', job.id).projectId, result.project.id);

      const done = await executeAction('update_project', { project: result.project.number, status: 'Completed' }, CTX);
      assert.strictEqual(done.result.project.status, 'Completed');
    });
  });

  describe('payments and Xero', () => {
    test('payment links and Xero are refused in the demo workspace', async () => {
      await assert.rejects(executeAction('create_payment_link', { invoice: 'INV-1' }, CTX), (error) => error.code === ERROR_CODES.UNSUPPORTED);
      await assert.rejects(executeAction('push_to_xero', {}, CTX), (error) => error.code === ERROR_CODES.UNSUPPORTED);
    });
  });
});
