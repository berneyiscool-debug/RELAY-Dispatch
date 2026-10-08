import { test, describe } from 'node:test';
import assert from 'node:assert';
import { buildDemoDataset, DEMO_COMPANY_NAME } from './demoDataset.js';

// A Thursday, a Saturday and a Monday — the anchor logic has to hold for all three.
const MOMENTS = [new Date(2026, 9, 8, 9, 30), new Date(2026, 9, 10, 11, 0), new Date(2026, 9, 12, 7, 15)];
const build = (now) => buildDemoDataset({ now, scope: 'acct_test_', owner: { id: 'acct_test_owner', name: 'Test Owner', email: 'owner@test.example' } });
const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const r2 = (n) => Math.round(n * 100) / 100;

describe('demo dataset', () => {
  test('is deterministic for a given moment', () => {
    assert.deepStrictEqual(build(MOMENTS[0]).collections, build(MOMENTS[0]).collections);
  });

  for (const now of MOMENTS) {
    describe(`loaded ${now.toDateString()}`, () => {
      const { collections: C, settings } = build(now);
      const today = key(now);
      const ids = (list) => new Set(list.map((x) => x.id));
      const customers = ids(C.customers);
      const jobs = Object.fromEntries(C.jobs.map((j) => [j.id, j]));
      const quotes = Object.fromEntries(C.quotes.map((q) => [q.id, q]));
      const techs = ids(C.technicians);

      test('company profile is the demo company and flags the dataset', () => {
        assert.strictEqual(settings.name, DEMO_COMPANY_NAME);
        assert.ok(settings.demoDataset);
      });

      test('every id is unique and scoped to the account', () => {
        const all = Object.values(C).flat().map((x) => x.id);
        assert.strictEqual(new Set(all).size, all.length);
        C.technicians.filter((t) => t.id !== 'acct_test_owner').concat(C.jobs, C.invoices).forEach((x) => assert.ok(x.id.startsWith('acct_test_'), x.id));
      });

      test('document numbers are unique and filled', () => {
        for (const col of ['jobs', 'quotes', 'invoices', 'leads', 'purchaseOrders', 'projects']) {
          const nums = C[col].map((x) => x.number);
          assert.ok(nums.every(Boolean), `${col} missing numbers`);
          assert.strictEqual(new Set(nums).size, nums.length, `${col} duplicate numbers`);
        }
      });

      test('no unresolved cross-reference tokens', () => {
        assert.ok(!JSON.stringify(C).includes('{{'));
      });

      test('every reference points at a real record', () => {
        [...C.leads, ...C.quotes, ...C.jobs, ...C.invoices].forEach((x) => assert.ok(customers.has(x.customerId), `${x.number} customer`));
        C.jobs.forEach((j) => {
          if (j.quoteId) assert.ok(quotes[j.quoteId], `${j.number} quote`);
          if (j.parentJobId) assert.ok(jobs[j.parentJobId], `${j.number} parent`);
          if (j.technicianId) assert.ok(techs.has(j.technicianId), `${j.number} tech`);
        });
        [...C.timesheets, ...C.schedule].forEach((x) => {
          assert.ok(techs.has(x.technicianId), 'technician');
          if (x.jobId) assert.ok(jobs[x.jobId] && x.jobNumber === jobs[x.jobId].number, 'job link');
        });
        C.invoices.forEach((i) => { if (i.jobId) assert.strictEqual(i.jobNumber, jobs[i.jobId].number); });
        C.jobMaterials.forEach((m) => assert.ok(jobs[m.jobId]));
        C.purchaseOrders.forEach((p) => { if (p.jobId) assert.ok(jobs[p.jobId]); });
        C.formInstances.forEach((f) => assert.ok(jobs[f.jobId]));
        C.maintenancePlans.forEach((p) => { assert.ok(ids(C.assets).has(p.assetId)); if (p.quoteId) assert.ok(quotes[p.quoteId]); });
        C.notifications.forEach((n) => { if (n.jobId) assert.ok(jobs[n.jobId]); if (n.quoteId) assert.ok(quotes[n.quoteId]); });
      });

      test('quote and invoice totals add up (10% GST)', () => {
        [...C.quotes, ...C.invoices].forEach((doc) => {
          const lines = doc.sections.flatMap((s) => s.lineItems);
          lines.forEach((l) => assert.strictEqual(l.total, r2(l.qty * l.rate)));
          assert.strictEqual(doc.subtotal, r2(lines.reduce((s, l) => s + l.total, 0)), doc.number);
          assert.strictEqual(doc.tax, r2(doc.subtotal * 0.1));
          assert.strictEqual(doc.total, r2(doc.subtotal + doc.tax));
        });
      });

      test('crew is never double-booked', () => {
        const slots = {};
        C.schedule.forEach((s) => {
          const k = `${s.technicianId}|${s.date}`;
          (slots[k] = slots[k] || []).forEach(([a, b]) => assert.ok(s.startHour >= b || s.endHour <= a, `overlap ${k} ${s.startHour}-${s.endHour} vs ${a}-${b}`));
          slots[k].push([s.startHour, s.endHour]);
        });
      });

      test('weekend work is only emergency call-outs', () => {
        C.schedule.filter((s) => s.jobId).forEach((s) => {
          const day = new Date(`${s.date}T12:00:00`).getDay();
          if (day === 0 || day === 6) assert.ok(jobs[s.jobId].isEmergency, `${s.jobNumber} on weekend`);
        });
      });

      test('nothing that has happened is dated in the future', () => {
        const nowMs = now.getTime();
        [...C.leads, ...C.quotes, ...C.jobs, ...C.invoices, ...C.customers, ...C.notifications].forEach((x) => assert.ok(new Date(x.createdAt).getTime() <= nowMs, `${x.number || x.id} created in future`));
        C.timesheets.forEach((t) => assert.ok(t.date <= today));
        C.invoices.forEach((i) => { assert.ok(key(new Date(i.issueDate)) <= today); if (i.paidDate) assert.ok(i.paidDate < today); });
      });

      test('statuses agree with the rest of the record', () => {
        const invoicedJobs = new Set(C.invoices.flatMap((i) => [i.jobId, ...(i.jobIds || [])]));
        C.jobs.forEach((j) => {
          if (j.status === 'Invoiced') assert.ok(invoicedJobs.has(j.id), `${j.number} invoiced without invoice`);
          if (j.status === 'Completed') assert.ok(!invoicedJobs.has(j.id), `${j.number} completed but invoiced`);
          if (j.status === 'Scheduled') assert.ok(j.scheduledDate >= key(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3)), `${j.number} scheduled in the past`);
        });
        C.quotes.filter((q) => q.status === 'Converted').forEach((q) => assert.ok(C.jobs.some((j) => j.quoteId === q.id), `${q.number} converted without job`));
        C.invoices.forEach((i) => {
          const due = key(new Date(i.dueDate));
          if (i.status === 'Overdue') assert.ok(due < today, `${i.number} overdue but not due`);
          if (i.status === 'Paid') assert.strictEqual(i.payments.reduce((s, p) => s + p.amount, 0), i.total);
        });
      });

      test('there is a live story to walk through', () => {
        assert.ok(C.jobs.some((j) => j.status === 'In Progress'));
        assert.ok(C.jobs.some((j) => j.status === 'Completed'), 'uninvoiced completed job');
        assert.ok(C.quotes.some((q) => q.status === 'Accepted'), 'accepted quote ready to convert');
        assert.ok(C.quotes.some((q) => q.status === 'Sent'));
        assert.ok(C.quotes.some((q) => q.status === 'Draft'));
        assert.ok(C.invoices.some((i) => i.status === 'Overdue'));
        assert.ok(C.notifications.some((n) => n.status === 'Pending' && n.type === 'Client Request'));
        assert.ok(C.notifications.some((n) => n.status === 'Pending' && n.type === 'Field Fault'));
        ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'].forEach((s) => assert.ok(C.leads.some((l) => l.status === s), `lead stage ${s}`));
        assert.ok(C.jobs.some((j) => j.isRecurring));
        assert.ok(C.stock.some((s) => s.quantity < s.reorderLevel), 'low stock');
      });
    });
  }
});
