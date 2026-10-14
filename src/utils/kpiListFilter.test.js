import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { store } from '../data/store.js';
import { readKpiListFilter, hashWithoutKpiFilter } from './kpiListFilter.js';

describe('readKpiListFilter', () => {
  const now = new Date(2026, 9, 8, 10);

  beforeEach(() => {
    store.clearSync();
    store.cache.invoices = [
      { id: 'late', status: 'Sent', subtotal: 100, total: 110, issueDate: '2026-09-01', dueDate: '2026-09-30' },
      { id: 'due', status: 'Sent', subtotal: 100, total: 110, issueDate: '2026-10-02', dueDate: '2026-10-30' },
      { id: 'paid', status: 'Paid', subtotal: 100, total: 110, issueDate: '2026-10-03', paidDate: '2026-10-05' },
    ];
  });

  const ids = (f) => store.getAll('invoices').filter(f.test).map(i => i.id);

  test('applies the named filter for the list collection', () => {
    const f = readKpiListFilter('invoices', '#/invoices?filter=overdue', now);
    assert.equal(f.label, 'Overdue');
    assert.equal(f.periodLabel, '');
    assert.deepEqual(ids(f), ['late']);
  });

  test('period filters follow the period passed from the dashboard', () => {
    const month = readKpiListFilter('invoices', '#/invoices?filter=issued&period=month', now);
    assert.equal(month.periodLabel, 'This month');
    assert.deepEqual(ids(month), ['due', 'paid']);
    const fy = readKpiListFilter('invoices', '#/invoices?filter=issued&period=fy', now);
    assert.deepEqual(ids(fy), ['late', 'due', 'paid']);
  });

  test('unknown filters, other collections and bad periods are ignored safely', () => {
    assert.equal(readKpiListFilter('invoices', '#/invoices', now), null);
    assert.equal(readKpiListFilter('invoices', '#/invoices?filter=nope', now), null);
    assert.equal(readKpiListFilter('invoices', '#/invoices?filter=toString', now), null);
    assert.equal(readKpiListFilter('jobs', '#/jobs?filter=overdue', now), null);
    assert.equal(readKpiListFilter('invoices', '#/invoices?filter=issued&period=bogus', now).periodLabel, 'This month');
  });
});

test('clearing keeps unrelated params', () => {
  assert.equal(hashWithoutKpiFilter('#/invoices?filter=overdue'), '#/invoices');
  assert.equal(hashWithoutKpiFilter('#/jobs?customerId=c1&filter=active&period=week'), '#/jobs?customerId=c1');
});
