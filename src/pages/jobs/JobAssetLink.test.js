import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { store } from '../../data/store.js';

describe('Job & Asset Integration', () => {
  beforeEach(() => {
    store.memoryCache = {};
    store.initialized = true;
    store.companyId = 'comp_test';
  });

  test('Creates a job linked to a customer asset', () => {
    const customer = store.create('customers', {
      id: 'cust_101',
      company: 'Acme Logistics'
    });

    const asset = store.create('assets', {
      id: 'asset_202',
      name: 'Generator 5000X',
      serial: 'SN-998877',
      customerId: customer.id,
      customerName: customer.company,
      type: 'Heavy Equipment'
    });

    const job = store.create('jobs', {
      title: 'Annual Generator Service',
      customerId: customer.id,
      customerName: customer.company,
      assetId: asset.id,
      assetName: asset.name
    });

    const fetchedJob = store.getById('jobs', job.id);
    assert.strictEqual(fetchedJob.assetId, 'asset_202');
    assert.strictEqual(fetchedJob.assetName, 'Generator 5000X');
  });

  test('Filters jobs by asset name and serial number', () => {
    const asset1 = store.create('assets', { id: 'ast_1', name: 'Carrier Air Conditioner', serial: 'AC-100' });
    const asset2 = store.create('assets', { id: 'ast_2', name: 'Caterpillar Generator', serial: 'CAT-500' });

    store.create('jobs', { id: 'job_1', number: 'J-001', title: 'AC Maintenance', assetId: asset1.id, assetName: asset1.name });
    store.create('jobs', { id: 'job_2', number: 'J-002', title: 'Generator Repair', assetId: asset2.id, assetName: asset2.name });

    const allJobs = store.getAll('jobs');

    function searchJobs(query) {
      const q = query.toLowerCase();
      return allJobs.filter(j => {
        const num = j.number || '';
        const title = j.title || '';
        const assetObj = j.assetId ? store.getById('assets', j.assetId) : null;
        const assetName = j.assetName || (assetObj ? assetObj.name : '');
        const assetSerial = assetObj ? (assetObj.serial || '') : '';

        return num.toLowerCase().includes(q) ||
               title.toLowerCase().includes(q) ||
               assetName.toLowerCase().includes(q) ||
               assetSerial.toLowerCase().includes(q);
      });
    }

    const carrierResults = searchJobs('Carrier');
    assert.strictEqual(carrierResults.length, 1);
    assert.strictEqual(carrierResults[0].id, 'job_1');

    const serialResults = searchJobs('CAT-500');
    assert.strictEqual(serialResults.length, 1);
    assert.strictEqual(serialResults[0].id, 'job_2');
  });
});
