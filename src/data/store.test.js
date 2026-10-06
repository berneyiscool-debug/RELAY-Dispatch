import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { store } from './store.js';
import { supabase } from '../utils/supabase.js';

// Mock Supabase client database operations to return success and avoid console logs/errors
supabase.from = () => ({
  select: () => ({
    eq: () => ({
      single: async () => ({ data: {}, error: null })
    })
  }),
  insert: async () => ({ error: null, data: {} }),
  upsert: async () => ({ error: null, data: {} }),
  update: () => ({
    eq: async () => ({ error: null, data: {} })
  }),
  delete: () => ({
    eq: async () => ({ error: null, data: {} })
  })
});

describe('DataStore', () => {
  beforeEach(() => {
    // Reset store cache and status before each test
    store.clearSync();
    store.listeners = {};
  });

  describe('getAll', () => {
    test('returns empty array when no data exists', () => {
      const result = store.getAll('customers');
      assert.deepStrictEqual(result, []);
    });

    test('returns cached data when it exists', () => {
      const customers = [{ id: '1', name: 'Alice' }];
      store.cache.customers = customers;
      const result = store.getAll('customers');
      assert.deepStrictEqual(result, customers);
    });
  });

  describe('create', () => {
    test('saves to cache and generates id in local mode (companyId not set)', async () => {
      const item = { name: 'David' };
      const created = await store.create('customers', item);
      assert.ok(created.id);
      assert.strictEqual(created.name, 'David');
      assert.deepStrictEqual(store.getAll('customers'), [created]);
    });

    test('creates item with generated id and timestamps when companyId is set', async () => {
      store.companyId = 'test-company';
      const item = { name: 'David' };
      const created = await store.create('customers', item);

      assert.ok(created.id);
      assert.ok(created.createdAt);
      assert.ok(created.updatedAt);
      assert.strictEqual(created.name, 'David');
      assert.strictEqual(created.companyId, 'test-company');

      // Check it was saved to cache
      const all = store.getAll('customers');
      assert.strictEqual(all.length, 1);
      assert.deepStrictEqual(all[0], created);
    });

    test('preserves provided id and createdAt when companyId is set', async () => {
      store.companyId = 'test-company';
      const item = {
        id: 'custom_id',
        name: 'Eve',
        createdAt: '2023-01-01T00:00:00.000Z'
      };
      const created = await store.create('customers', item);

      assert.strictEqual(created.id, 'custom_id');
      assert.strictEqual(created.createdAt, '2023-01-01T00:00:00.000Z');
      assert.ok(created.updatedAt);
    });
  });

  describe('update', () => {
    test('updates item in cache in local mode (companyId not set)', async () => {
      const item = { id: 'local_1', name: 'Original' };
      store.cache.customers = [item];
      const updated = await store.update('customers', 'local_1', { name: 'Updated' });
      assert.ok(updated);
      assert.strictEqual(updated.name, 'Updated');
      assert.deepStrictEqual(store.getAll('customers'), [updated]);
    });

    test('updates existing item and its updatedAt timestamp when companyId is set', async () => {
      store.companyId = 'test-company';
      // Seed item in cache
      const item = { id: 'job_1', title: 'Fix roof', companyId: 'test-company', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      store.cache.jobs = [item];

      const oldUpdatedAt = item.updatedAt;

      // Small delay
      await new Promise(resolve => setTimeout(resolve, 5));

      // In cloud mode update() resolves to { ok, record | error }; the mocked
      // Supabase client succeeds, so assert the record is returned.
      const result = await store.update('jobs', 'job_1', { title: 'Fix window', status: 'done' });

      assert.ok(result);
      assert.strictEqual(result.ok, true);
      const updated = result.record;
      assert.ok(updated);
      assert.strictEqual(updated.title, 'Fix window');
      assert.strictEqual(updated.status, 'done');
      assert.strictEqual(updated.id, 'job_1');
      assert.notStrictEqual(updated.updatedAt, oldUpdatedAt);

      // Check cache
      const all = store.getAll('jobs');
      assert.strictEqual(all.length, 1);
      assert.deepStrictEqual(all[0], updated);
    });

    test('returns null when updating non-existent item', async () => {
      store.companyId = 'test-company';
      const result = await store.update('jobs', 'non-existent-id', { title: 'New' });
      assert.strictEqual(result, null);
    });
  });

  describe('delete', () => {
    test('deletes item from cache and emits event', async () => {
      store.companyId = 'test-company';
      const item = { id: 'job_1', title: 'Fix roof' };
      store.cache.jobs = [item];

      let emittedData = null;
      store.on('jobs', (data) => {
        emittedData = data;
      });

      await store.delete('jobs', 'job_1');

      assert.deepStrictEqual(store.getAll('jobs'), []);
      assert.deepStrictEqual(emittedData, []);
    });
  });

  describe('getSettings', () => {
    test('returns default settings when no companySettings exists', () => {
      const settings = store.getSettings();
      assert.strictEqual(settings.name, 'Company Name');
      assert.strictEqual(settings.materialMarkup.defaultPercent, 30);
    });

    test('returns merged settings when companySettings exists', () => {
      store.companySettings = {
        name: 'Custom Company',
        materialMarkup: { defaultPercent: 40 }
      };

      const settings = store.getSettings();
      assert.strictEqual(settings.name, 'Custom Company');
      assert.strictEqual(settings.materialMarkup.defaultPercent, 40);
    });
  });

  describe('saveSettings', () => {
    test('saves settings to memory in local mode (companyId not set)', async () => {
      const settings = { name: 'Offline Change' };
      await store.saveSettings(settings);
      assert.deepStrictEqual(store.companySettings, settings);
    });

    test('saves settings and emits event when companyId is set', async () => {
      store.companyId = 'test-company';
      const settings = { name: 'Online Change' };

      let emittedData = null;
      store.on('settings', (data) => {
        emittedData = data;
      });

      await store.saveSettings(settings);

      assert.deepStrictEqual(store.companySettings, settings);
      assert.deepStrictEqual(emittedData, settings);
    });
  });

  describe('Schema Whitelisting & Normalization', () => {
    test('denormalizeRecord filters out columns not in schema and maps contractor/supplier fields', () => {
      const contractorPayload = {
        id: 'c1',
        companyId: 'comp1',
        businessName: 'Acme Trade',
        active: true,
        hourlyRate: 85,
        notes: 'Operational comments',
        dummyField: 'should be stripped'
      };

      const result = store.denormalizeRecord(contractorPayload, 'contractors');

      // Check whitelisted/mapped fields
      assert.strictEqual(result.id, 'c1');
      assert.strictEqual(result.company_id, 'comp1');
      assert.strictEqual(result.name, 'Acme Trade');
      assert.strictEqual(result.status, 'Active');
      assert.strictEqual(result.notes, 'Operational comments');

      // Check stripped non-schema fields
      assert.strictEqual(result.businessName, undefined);
      assert.strictEqual(result.active, undefined);
      assert.strictEqual(result.hourlyRate, undefined);
      assert.strictEqual(result.dummyField, undefined);
    });

    test('normalizeRecord translates contractor name and active state correctly', () => {
      const dbContractor = {
        id: 'c2',
        company_id: 'comp1',
        name: 'Electric Solutions',
        status: 'Active',
        email: 'electric@example.com'
      };

      const result = store.normalizeRecord(dbContractor, 'contractors');

      assert.strictEqual(result.id, 'c2');
      assert.strictEqual(result.companyId, 'comp1');
      assert.strictEqual(result.businessName, 'Electric Solutions');
      assert.strictEqual(result.active, true);
      assert.strictEqual(result.email, 'electric@example.com');
      assert.strictEqual(result.name, 'Electric Solutions');
    });

    test('portal passcode is whitelisted and round-trips for customers and contractors', () => {
      for (const collection of ['customers', 'contractors']) {
        const denorm = store.denormalizeRecord({ id: 'p1', portalToken: 'tok1', portalPasscode: '4821' }, collection);

        assert.strictEqual(denorm.portal_passcode, '4821', `${collection}: portalPasscode -> portal_passcode`);
        assert.strictEqual(denorm.portalPasscode, undefined, `${collection}: camelCase key is removed`);
        assert.strictEqual(denorm.portal_token, 'tok1', `${collection}: portal_token is retained`);

        const norm = store.normalizeRecord({ id: 'p1', portal_token: 'tok1', portal_passcode: '4821' }, collection);

        assert.strictEqual(norm.portalPasscode, '4821', `${collection}: portal_passcode -> portalPasscode`);
        assert.strictEqual(norm.portal_passcode, undefined, `${collection}: snake_case key is removed`);
      }
    });

    test('an explicit null portal passcode is preserved so an admin reset clears the PIN', () => {
      const denorm = store.denormalizeRecord({ id: 'p1', portalPasscode: null }, 'customers');

      assert.strictEqual(denorm.portal_passcode, null);
    });

    test('schedules tasks metadata serialization and deserialization via color column works', () => {
      const schedulePayload = {
        id: 's1',
        jobId: 'j1',
        jobNumber: 'JOB-1001',
        taskId: 't1',
        taskName: 'First task',
        color: '#ff9900'
      };

      const denorm = store.denormalizeRecord(schedulePayload, 'schedule');

      // The raw task keys should be stripped but serialized into color
      assert.strictEqual(denorm.taskId, undefined);
      assert.strictEqual(denorm.taskName, undefined);
      assert.ok(denorm.color.startsWith('__meta__:'));

      // Re-normalize
      const norm = store.normalizeRecord(denorm, 'schedule');

      assert.strictEqual(norm.id, 's1');
      assert.strictEqual(norm.jobId, 'j1');
      assert.strictEqual(norm.jobNumber, 'JOB-1001');
      assert.strictEqual(norm.taskId, 't1');
      assert.strictEqual(norm.taskName, 'First task');
      assert.strictEqual(norm.color, '#ff9900');
    });

    test('invoices serialization and deserialization via line_items works correctly', () => {
      const invoicePayload = {
        id: 'inv_test_1',
        number: 'INV-99999',
        customerId: 'cust_abc',
        status: 'Draft',
        sections: [
          {
            id: 'sec_1',
            name: 'Phase 1',
            lineItems: [{ description: 'Test Labor', type: 'labor', qty: 2, rate: 85 }]
          }
        ],
        invoiceType: 'Standard',
        laborProfileId: 'rate_1',
        issueDate: '2026-08-23',
        originalQuoteNumber: 'Q-00001',
        approvedVariationsSum: 150
      };

      const denorm = store.denormalizeRecord(invoicePayload, 'invoices');

      // Check whitelisted fields remain on root
      assert.strictEqual(denorm.id, 'inv_test_1');
      assert.strictEqual(denorm.number, 'INV-99999');
      assert.strictEqual(denorm.customer_id, 'cust_abc');
      assert.strictEqual(denorm.status, 'Draft');

      // Rich fields should be stripped from root
      assert.strictEqual(denorm.sections, undefined);
      assert.strictEqual(denorm.invoiceType, undefined);
      assert.strictEqual(denorm.laborProfileId, undefined);

      // And serialized into line_items
      assert.ok(denorm.line_items);
      assert.strictEqual(denorm.line_items.invoiceType, 'Standard');
      assert.strictEqual(denorm.line_items.laborProfileId, 'rate_1');
      assert.strictEqual(denorm.line_items.originalQuoteNumber, 'Q-00001');
      assert.strictEqual(denorm.line_items.approvedVariationsSum, 150);
      assert.strictEqual(denorm.line_items.sections[0].name, 'Phase 1');

      // Re-normalize
      const norm = store.normalizeRecord(denorm, 'invoices');

      assert.strictEqual(norm.id, 'inv_test_1');
      assert.strictEqual(norm.number, 'INV-99999');
      assert.strictEqual(norm.customerId, 'cust_abc');
      assert.strictEqual(norm.invoiceType, 'Standard');
      assert.strictEqual(norm.laborProfileId, 'rate_1');
      assert.strictEqual(norm.issueDate, '2026-08-23');
      assert.strictEqual(norm.originalQuoteNumber, 'Q-00001');
      assert.strictEqual(norm.approvedVariationsSum, 150);
      assert.strictEqual(norm.sections[0].name, 'Phase 1');
      assert.strictEqual(norm.sections[0].lineItems[0].description, 'Test Labor');
    });

    test('quotes serialization and deserialization via line_items works correctly', () => {
      const quotePayload = {
        id: 'q_test_1',
        number: 'Q-99999',
        customerId: 'cust_xyz',
        sections: [
          {
            id: 'sec_2',
            name: 'Phase 2',
            lineItems: [{ description: 'Test Material', type: 'material', qty: 10, rate: 5 }]
          }
        ],
        laborProfileId: 'rate_2',
        isTemplate: true
      };

      const denorm = store.denormalizeRecord(quotePayload, 'quotes');

      assert.strictEqual(denorm.id, 'q_test_1');
      assert.strictEqual(denorm.sections, undefined);
      assert.strictEqual(denorm.laborProfileId, undefined);
      assert.ok(denorm.line_items);
      assert.strictEqual(denorm.line_items.laborProfileId, 'rate_2');
      assert.strictEqual(denorm.line_items.isTemplate, true);
      assert.strictEqual(denorm.line_items.sections[0].name, 'Phase 2');

      const norm = store.normalizeRecord(denorm, 'quotes');

      assert.strictEqual(norm.id, 'q_test_1');
      assert.strictEqual(norm.laborProfileId, 'rate_2');
      assert.strictEqual(norm.isTemplate, true);
      assert.strictEqual(norm.sections[0].name, 'Phase 2');
      assert.strictEqual(norm.sections[0].lineItems[0].description, 'Test Material');
    });

    test('repairInvoiceIssueDates backfills missing issueDate from createdAt/dueDate', () => {
      store.cache.invoices = [
        { id: 'inv_no_date', number: 'INV-1', createdAt: '2026-08-10T10:00:00.000Z' },
        { id: 'inv_with_date', number: 'INV-2', issueDate: '2026-08-01' },
        { id: 'inv_only_due', number: 'INV-3', dueDate: '2026-09-20' },
        { id: 'inv_empty', number: 'INV-4' }
      ];

      const repaired = store.repairInvoiceIssueDates();

      const byId = (id) => store.cache.invoices.find(i => i.id === id);

      assert.strictEqual(repaired, 2);
      assert.strictEqual(byId('inv_no_date').issueDate, '2026-08-10');
      assert.strictEqual(byId('inv_with_date').issueDate, '2026-08-01');
      assert.strictEqual(byId('inv_only_due').issueDate, '2026-08-21');
      assert.strictEqual(byId('inv_empty').issueDate, undefined);
    });
  });

  describe('seedFormTemplates', () => {
    test('namespaces prebuilt ids per company so a second company does not collide on the primary key', async () => {
      const captured = [];
      const originalFrom = supabase.from;
      supabase.from = (table) => ({
        ...originalFrom(table),
        upsert: async (payload) => {
          captured.push({ table, payload });
          return { error: null, data: {} };
        }
      });

      try {
        store.companyId = 'company-a';
        await store.seedFormTemplates();
        const first = captured.pop();

        store.companyId = 'company-b';
        await store.seedFormTemplates();
        const second = captured.pop();

        assert.strictEqual(first.table, 'form_templates');
        assert.ok(first.payload.length > 0);
        assert.strictEqual(first.payload.length, second.payload.length);

        const firstIds = first.payload.map(r => r.id);
        const secondIds = second.payload.map(r => r.id);

        assert.strictEqual(new Set(firstIds).size, firstIds.length);
        assert.ok(firstIds.every(id => id.startsWith('company-a_')));
        assert.ok(secondIds.every(id => id.startsWith('company-b_')));

        // `form_templates.id` is the primary key, so the two companies must not share ids.
        assert.strictEqual(new Set([...firstIds, ...secondIds]).size, firstIds.length + secondIds.length);

        assert.ok(first.payload.every(r => r.company_id === 'company-a'));
        assert.ok(second.payload.every(r => r.company_id === 'company-b'));
      } finally {
        supabase.from = originalFrom;
      }
    });
  });
});

// Local mode is single-user: a fresh local profile starts with no staff records,
// and anything the removed multi-user local mode left behind (per-technician
// logins, deployment-type marker, legacy session flag) is cleaned up on first boot.
describe('local single-user migration', () => {
  const savedLocalStorage = globalThis.localStorage;
  const storage = new Map();

  beforeEach(() => {
    storage.clear();
    globalThis.localStorage = {
      getItem: (key) => (storage.has(key) ? storage.get(key) : null),
      setItem: (key, value) => { storage.set(key, String(value)); },
      removeItem: (key) => { storage.delete(key); }
    };
    store.clearSync();
    store.listeners = {};
    store.companyId = 'acct_1';
    store.companySettings = null;
  });

  afterEach(() => {
    if (savedLocalStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = savedLocalStorage;
    store.clearSync();
  });

  test('a new local profile starts with no demo staff', async () => {
    await store.initializeLocalStore();

    assert.deepStrictEqual(store.getAll('technicians'), []);
    assert.ok(store.getAll('userTypes').length > 0);
  });

  test('strips staff login credentials but keeps the roster', async () => {
    store.cache.technicians = [
      { id: 'acct_1_tech_1', name: 'Jake Morrow', password: '123456', username: 'jake' },
      { id: 'acct_1_tech_2', name: 'Ryan Holt', email: 'ryan@example.com' }
    ];

    await store.migrateLocalSingleUser();

    const [first, second] = store.cache.technicians;
    assert.strictEqual(store.cache.technicians.length, 2);
    assert.strictEqual('password' in first, false);
    assert.strictEqual('username' in first, false);
    assert.strictEqual(first.name, 'Jake Morrow');
    assert.strictEqual(second.email, 'ryan@example.com');
  });

  test('drops the deployment-type marker and rewrites the legacy session flag', async () => {
    storage.set('relay_login_mode', 'local_multiuser');
    store.companySettings = { name: 'Apex Power Services', localDeploymentType: 'multi_user' };

    await store.migrateLocalSingleUser();

    assert.strictEqual(storage.get('relay_login_mode'), 'local');
    assert.strictEqual('localDeploymentType' in store.companySettings, false);
    assert.strictEqual(store.companySettings.name, 'Apex Power Services');
  });

  test('leaves cloud companies untouched', async () => {
    store.companyId = '8f14e45f-ceea-467a-9e3d-4bd0e17f2bfe';
    store.cache.technicians = [{ id: 'p1', name: 'Sam', password: '123456' }];
    storage.set('relay_login_mode', 'local_multiuser');

    await store.migrateLocalSingleUser();

    assert.strictEqual(store.cache.technicians[0].password, '123456');
    assert.strictEqual(storage.get('relay_login_mode'), 'local_multiuser');
  });
});

// Local→cloud upgrade. Local accounts hold records whose ids carry no company
// scope (`ft_jsa_swms`, `ut_admin`, the demo fixtures), and those ids are the
// same on every install, so writing them into a new cloud company collided with
// whichever tenant already owned them: Postgres rejected the row with "new row
// violates row-level security policy (USING expression) for table ..." because
// the conflicting row is invisible to the new tenant. Migration therefore has to
// re-scope every id, and every reference to it, into the new company namespace.
describe('migrateLocalToCloud', () => {
  const CLOUD_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const savedLocalStorage = globalThis.localStorage;
  let originalInit;
  let initCalled;

  const stubWrites = (failWhen) => {
    const writes = [];
    const originalFrom = supabase.from;
    supabase.from = (table) => ({
      ...originalFrom(table),
      upsert: async (payload, options) => {
        writes.push({ table, payload, options });
        const error = failWhen ? failWhen(table, payload) : null;
        return error ? { error, data: null } : { error: null, data: {} };
      }
    });
    return { writes, restore: () => { supabase.from = originalFrom; } };
  };

  beforeEach(() => {
    globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
    store.clearSync();
    store.listeners = {};
    store.db = null;
    initCalled = false;
    originalInit = store.initializeCloudSync;
    store.initializeCloudSync = async () => { initCalled = true; };
  });

  afterEach(() => {
    store.initializeCloudSync = originalInit;
    if (savedLocalStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = savedLocalStorage;
    store.clearSync();
  });

  test('re-scopes legacy ids and the references pointing at them', async () => {
    const { writes, restore } = stubWrites();
    try {
      store.companyId = 'acct_local1';
      store.cache.formTemplates = [{ id: 'ft_jsa_swms', name: 'JSA / SWMS', sections: [{ id: 'sec_1' }] }];
      store.cache.formInstances = [{ id: 'fi_1', templateId: 'ft_jsa_swms', jobId: 'acct_local1_job_1', values: { ref: 'ft_jsa_swms' } }];
      store.cache.customers = [{ id: 'acct_local1_cust_1', name: 'Acme' }];
      store.cache.jobs = [{ id: 'acct_local1_job_1', customerId: 'acct_local1_cust_1', title: 'Switchboard' }];

      await store.migrateLocalToCloud(CLOUD_ID, 'user-1');

      const byTable = (table) => writes.find(w => w.table === table);

      // Unscoped prebuilt id gains the new company's namespace.
      const templates = byTable('form_templates').payload;
      assert.deepStrictEqual(templates.map(r => r.id), [`${CLOUD_ID}_ft_jsa_swms`]);
      assert.strictEqual(templates[0].company_id, CLOUD_ID);
      assert.deepStrictEqual(templates[0].fields, { description: '', sections: [{ id: 'sec_1' }] });

      // Ids already scoped to the old account are re-scoped, not double-prefixed.
      assert.deepStrictEqual(byTable('customers').payload.map(r => r.id), [`${CLOUD_ID}_cust_1`]);

      // References between records follow the ids that were actually written.
      const instance = byTable('form_instances').payload[0];
      assert.strictEqual(instance.id, `${CLOUD_ID}_fi_1`);
      assert.strictEqual(instance.template_id, `${CLOUD_ID}_ft_jsa_swms`);
      assert.strictEqual(instance.job_id, `${CLOUD_ID}_job_1`);
      assert.deepStrictEqual(instance.values, { ref: `${CLOUD_ID}_ft_jsa_swms` });

      const job = byTable('jobs').payload[0];
      assert.strictEqual(job.id, `${CLOUD_ID}_job_1`);
      assert.strictEqual(job.customer_id, `${CLOUD_ID}_cust_1`);

      // Every write targets the primary key so a retry updates instead of duplicating.
      assert.ok(writes.length > 0);
      assert.ok(writes.every(w => w.options && w.options.onConflict === 'id'));

      // Local records must not be rewritten in place: the account is only
      // discarded once the caller sees a successful migration.
      assert.strictEqual(store.cache.formTemplates[0].id, 'ft_jsa_swms');
      assert.strictEqual(store.cache.formInstances[0].templateId, 'ft_jsa_swms');
      assert.strictEqual(store.cache.jobs[0].customerId, 'acct_local1_cust_1');

      assert.strictEqual(initCalled, true);
    } finally {
      restore();
    }
  });

  test('migrates records whose legacy ids are already owned by another tenant', async () => {
    // Reproduces the reported failure: the unscoped ids belong to a tenant this
    // session cannot see, so Postgres rejects them with a USING-expression error.
    const legacyIds = new Set(['ft_jsa_swms', 'ut_admin']);
    const { writes, restore } = stubWrites((table, payload) => (
      payload.some(row => legacyIds.has(row.id))
        ? { message: `new row violates row-level security policy (USING expression) for table "${table}"` }
        : null
    ));
    try {
      store.companyId = 'acct_local1';
      store.cache.formTemplates = [{ id: 'ft_jsa_swms', name: 'JSA / SWMS', sections: [] }];
      store.cache.userTypes = [{ id: 'ut_admin', name: 'Admin' }];

      await store.migrateLocalToCloud(CLOUD_ID, 'user-1');

      assert.deepStrictEqual(writes.map(w => w.table).sort(), ['form_templates', 'user_types']);
      assert.ok(writes.every(w => w.payload.every(row => row.id.startsWith(`${CLOUD_ID}_`))));
      assert.strictEqual(initCalled, true);
    } finally {
      restore();
    }
  });

  test('reports every failing collection in one error and keeps the local data', async () => {
    const { writes, restore } = stubWrites((table) => (
      table === 'user_types' ? { message: 'permission denied for table user_types' } : null
    ));
    try {
      store.companyId = 'acct_local1';
      store.cache.formTemplates = [{ id: 'ft_jsa_swms', name: 'JSA / SWMS', sections: [] }];
      store.cache.userTypes = [{ id: 'ut_admin', name: 'Admin' }];
      store.cache.customers = [{ id: 'acct_local1_cust_1', name: 'Acme' }];

      await assert.rejects(
        () => store.migrateLocalToCloud(CLOUD_ID, 'user-1'),
        (err) => {
          assert.match(err.message, /Failed to migrate local data:/);
          assert.match(err.message, /userTypes \(permission denied for table user_types\)/);
          return true;
        }
      );

      // A failure in one collection does not stop the others.
      assert.deepStrictEqual(writes.map(w => w.table).sort(), ['customers', 'form_templates', 'user_types']);
      assert.strictEqual(store.cache.formTemplates[0].id, 'ft_jsa_swms');
      // The account is still local, so the sync must not be switched over yet.
      assert.strictEqual(initCalled, false);
    } finally {
      restore();
    }
  });

  describe('id re-scoping helpers', () => {
    test('scopes bare and previously scoped ids without double-prefixing', () => {
      assert.strictEqual(store.rescopeMigratedId('ft_jsa_swms', 'acct_1', 'company-a'), 'company-a_ft_jsa_swms');
      assert.strictEqual(store.rescopeMigratedId('acct_1_tech_1', 'acct_1', 'company-a'), 'company-a_tech_1');
      assert.strictEqual(store.rescopeMigratedId('company-a_job_1', 'acct_1', 'company-a'), 'company-a_job_1');
      assert.strictEqual(store.rescopeMigratedId('', 'acct_1', 'company-a'), '');
      assert.strictEqual(store.rescopeMigratedId(null, 'acct_1', 'company-a'), null);
    });

    test('rewrites ids embedded in longer strings', () => {
      const idMap = new Map([['acct_1_job_1', 'company-a_job_1']]);
      assert.strictEqual(store.remapMigratedString('acct_1_job_1', idMap, 'acct_1', 'company-a'), 'company-a_job_1');
      assert.strictEqual(store.remapMigratedString('/jobs/acct_1_job_1/edit', idMap, 'acct_1', 'company-a'), '/jobs/company-a_job_1/edit');
      assert.strictEqual(store.remapMigratedString('rate_1', idMap, 'acct_1', 'company-a'), 'rate_1');
    });

    test('copies nested values and leaves non-plain objects alone', () => {
      const due = new Date('2026-10-05T00:00:00.000Z');
      const source = { id: 'acct_1_job_1', customerId: 'acct_1_cust_1', dueDate: due, tags: ['acct_1_tag_1'] };
      const idMap = new Map([['acct_1_job_1', 'company-a_job_1'], ['acct_1_cust_1', 'company-a_cust_1'], ['acct_1_tag_1', 'company-a_tag_1']]);

      const remapped = store.remapMigratedValue(source, idMap, 'acct_1', 'company-a');

      assert.deepStrictEqual(remapped, {
        id: 'company-a_job_1',
        customerId: 'company-a_cust_1',
        dueDate: due,
        tags: ['company-a_tag_1']
      });
      assert.strictEqual(remapped.dueDate, due);
      assert.deepStrictEqual(source, { id: 'acct_1_job_1', customerId: 'acct_1_cust_1', dueDate: due, tags: ['acct_1_tag_1'] });
    });
  });

  // Local profile creation. A profile is created either straight into browser storage,
  // or into a folder the device hands back when it can.
  describe('local profile creation', () => {
    const savedLocalStorage = globalThis.localStorage;
    const savedSessionStorage = globalThis.sessionStorage;
    const localMem = new Map();
    const sessionMem = new Map();
    const ACCOUNT = 'acct_local_1';
    const CLOUD_ID = '8f14e45f-ceea-467a-9e3d-4bd0e17f2bfe';

    const memoryStore = (map) => ({
      getItem: (key) => (map.has(key) ? map.get(key) : null),
      setItem: (key, value) => { map.set(key, String(value)); },
      removeItem: (key) => { map.delete(key); }
    });

    // Stand-in for a FileSystemDirectoryHandle covering the calls the store makes.
    function fakeDirHandle(name = 'RELAY') {
      const dirs = new Map();
      const files = new Map();
      const handle = {
        name,
        dirs,
        files,
        permission: 'granted',
        queryPermission: async () => handle.permission,
        requestPermission: async () => handle.permission,
        getDirectoryHandle: async (childName, options = {}) => {
          if (!dirs.has(childName)) {
            if (!options.create) throw new Error(`NotFoundError: ${childName}`);
            dirs.set(childName, fakeDirHandle(childName));
          }
          return dirs.get(childName);
        },
        getFileHandle: async (fileName) => {
          if (!files.has(fileName)) files.set(fileName, '');
          return {
            name: fileName,
            createWritable: async () => ({
              write: async (data) => { files.set(fileName, String(data)); },
              close: async () => {}
            })
          };
        }
      };
      return handle;
    }

    // Every collection the store mirrors. `notices` and `deputyAsks` have no Supabase
    // table but are still backed up, so they are named explicitly.
    const BACKED_UP_COLLECTIONS = [
      'companies', 'technicians', 'userTypes', 'passwordResetRequests', 'customers',
      'assets', 'maintenancePlans', 'taskTemplates', 'quotes', 'jobs', 'invoices',
      'stock', 'timesheets', 'contractors', 'suppliers', 'purchaseOrders',
      'notifications', 'notices', 'formTemplates', 'formInstances', 'kits',
      'documents', 'leads', 'schedule', 'projects', 'costCenters', 'emailLog',
      'deputyAsks', 'jobMaterials', 'storageLocations', 'kitTypes', 'locationTypes',
      'deputyThreads', 'deputyRoutines'
    ];

    const owner = { id: `${ACCOUNT}_admin`, companyId: ACCOUNT, name: 'Dana Whitfield' };

    const dataDirOf = (root) => root.dirs.get('Apex Power Services').dirs.get('data');

    const missingBackups = (dataDir) =>
      BACKED_UP_COLLECTIONS.filter((col) => !dataDir.files.has(`${col}.json`));

    beforeEach(() => {
      localMem.clear();
      sessionMem.clear();
      globalThis.localStorage = memoryStore(localMem);
      globalThis.sessionStorage = memoryStore(sessionMem);
      store.clearSync();
      store.listeners = {};
      // clearSync() deliberately leaves the storage handles alone, so reset them here.
      store.db = null;
      store.dirHandle = null;
      store.backupDirHandle = null;
      store.folderSyncPermissionGranted = false;
      store.backupDirPermissionGranted = false;
    });

    afterEach(() => {
      if (savedLocalStorage === undefined) delete globalThis.localStorage;
      else globalThis.localStorage = savedLocalStorage;
      if (savedSessionStorage === undefined) delete globalThis.sessionStorage;
      else globalThis.sessionStorage = savedSessionStorage;
      store.clearSync();
      store.db = null;
      store.dirHandle = null;
      store.backupDirHandle = null;
    });

    test('creates a profile in browser storage when no folder is chosen', async () => {
      await store.initializeUser(owner);

      assert.strictEqual(store.companyId, ACCOUNT);
      assert.strictEqual(store.userId, `${ACCOUNT}_admin`);
      assert.strictEqual(sessionMem.get('relay_active_account'), ACCOUNT);
      assert.strictEqual(store.dirHandle, null);
      assert.strictEqual(store.folderSyncEnabled, false);
      // A fresh profile gets the seeded picklists but no demo roster.
      assert.deepStrictEqual(store.getAll('technicians'), []);
      assert.ok(store.getAll('userTypes').length > 0);
    });

    test('namespaces storage per profile so two profiles cannot collide', async () => {
      await store.initializeUser(owner);

      assert.strictEqual(store.getStorageKey('jobs'), `relay_${ACCOUNT}_jobs`);
      assert.strictEqual(store.getDBName(), `RelayDispatchDB_${ACCOUNT}`);
    });

    test('keeps the legacy key prefix when no profile is active', () => {
      assert.strictEqual(store.getStorageKey('jobs'), 'simpro_jobs');
      assert.strictEqual(store.getDBName(), 'RelayDispatchDB');
    });

    test('reuses the folder-sync flag recorded for this profile', async () => {
      localMem.set(`relay_${ACCOUNT}_folder_sync_enabled`, 'true');

      await store.initializeUser(owner);

      assert.strictEqual(store.folderSyncEnabled, true);
    });

    test('sends a cloud company down the sync path instead', async () => {
      sessionMem.set('relay_active_account', 'acct_stale');
      const originalCloudSync = store.initializeCloudSync;
      store.initializeCloudSync = async () => {};
      try {
        await store.initializeUser({ id: 'user-1', companyId: CLOUD_ID });

        assert.strictEqual(store.companyId, CLOUD_ID);
        assert.strictEqual(sessionMem.has('relay_active_account'), false);
        assert.strictEqual(store.getStorageKey('jobs'), 'simpro_jobs');
      } finally {
        store.initializeCloudSync = originalCloudSync;
      }
    });

    describe('folder storage', () => {
      test('turns folder sync on and mirrors every collection into the folder', async () => {
        await store.initializeUser(owner);
        store.companySettings = { name: 'Apex Power Services' };
        store.cache.jobs = [{ id: `${ACCOUNT}_job_1`, status: 'scheduled' }];
        const root = fakeDirHandle();

        await store.setLocalDirectory(root);

        assert.strictEqual(store.dirHandle, root);
        assert.strictEqual(store.folderSyncEnabled, true);
        assert.strictEqual(store.folderSyncPermissionGranted, true);
        assert.strictEqual(localMem.get(`relay_${ACCOUNT}_folder_sync_enabled`), 'true');

        const dataDir = dataDirOf(root);
        assert.deepStrictEqual(missingBackups(dataDir), []);
        assert.deepStrictEqual(
          JSON.parse(dataDir.files.get('jobs.json')),
          [{ id: `${ACCOUNT}_job_1`, status: 'scheduled' }]
        );
      });

      test('sanitises the company folder name', async () => {
        await store.initializeUser(owner);
        store.companySettings = { name: 'Apex / Power: QLD?' };

        const root = fakeDirHandle();
        await store.setLocalDirectory(root);

        assert.deepStrictEqual([...root.dirs.keys()], ['Apex _ Power_ QLD_']);
      });

      test('falls back to a generic company folder name', async () => {
        await store.initializeUser(owner);
        store.companySettings = null;

        const root = fakeDirHandle();
        await store.setLocalDirectory(root);

        assert.deepStrictEqual([...root.dirs.keys()], ['Company']);
      });

      test('turns folder sync off again when the handle is cleared', async () => {
        await store.initializeUser(owner);
        store.companySettings = { name: 'Apex Power Services' };
        await store.setLocalDirectory(fakeDirHandle());

        await store.setLocalDirectory(null);

        assert.strictEqual(store.folderSyncEnabled, false);
        assert.strictEqual(store.folderSyncPermissionGranted, false);
        assert.strictEqual(localMem.has(`relay_${ACCOUNT}_folder_sync_enabled`), false);
      });
    });

    describe('backup to a folder', () => {
      test('writes one JSON file per collection and stamps the time', async () => {
        await store.initializeUser(owner);
        store.companySettings = { name: 'Apex Power Services' };
        store.cache.jobs = [{ id: `${ACCOUNT}_job_1` }];
        const root = fakeDirHandle();

        await store.backupToFolder(root);

        const dataDir = dataDirOf(root);
        assert.deepStrictEqual(missingBackups(dataDir), []);
        assert.deepStrictEqual(JSON.parse(dataDir.files.get('jobs.json')), [{ id: `${ACCOUNT}_job_1` }]);
        assert.deepStrictEqual(JSON.parse(dataDir.files.get('technicians.json')), []);
        assert.strictEqual(Number.isNaN(Date.parse(localMem.get('relay_last_backup_time'))), false);
        assert.strictEqual(store.backupDirPermissionGranted, true);
      });

      test('refuses to back up with no directory configured', async () => {
        await assert.rejects(() => store.backupToFolder(), /No backup directory configured/);
      });

      test('refuses to back up when write permission is denied', async () => {
        const denied = fakeDirHandle();
        denied.permission = 'denied';

        await assert.rejects(() => store.backupToFolder(denied), /Write permission denied/);
      });
    });

    describe('the owner row', () => {
      test('synthesises the profile owner as the only technician', async () => {
        await store.initializeUser(owner);
        localMem.set('relay_login_mode', 'local');
        localMem.set('currentUser', JSON.stringify({ id: `${ACCOUNT}_admin`, name: 'Dana Whitfield' }));

        const technicians = store.getAll('technicians');

        assert.strictEqual(technicians.length, 1);
        assert.strictEqual(technicians[0].id, `${ACCOUNT}_admin`);
        assert.strictEqual(technicians[0].name, 'Dana Whitfield');
        assert.strictEqual(technicians[0].role, 'Administrator');
        assert.strictEqual(technicians[0].color, '#FF5C00');
        assert.strictEqual(technicians[0].startLocation, null);
      });

      test('falls back to a generic name when the profile has none', async () => {
        await store.initializeUser(owner);
        localMem.set('relay_login_mode', 'local');
        localMem.set('currentUser', JSON.stringify({ id: `${ACCOUNT}_admin` }));

        assert.strictEqual(store.getAll('technicians')[0].name, 'Local Admin');
      });

      test('returns the stored roster when the device is not in local mode', async () => {
        await store.initializeUser(owner);
        store.cache.technicians = [{ id: `${ACCOUNT}_tech_1`, name: 'Jake Morrow' }];

        assert.deepStrictEqual(store.getAll('technicians'), [{ id: `${ACCOUNT}_tech_1`, name: 'Jake Morrow' }]);
      });
    });
  });
});
