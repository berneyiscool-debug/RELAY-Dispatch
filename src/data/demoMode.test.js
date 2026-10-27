import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { store, DEMO_COMPANY_ID } from './store.js';
import { supabase } from '../utils/supabase.js';
import { DEMO_GUEST_USER } from '../utils/demoSession.js';
import { buildDemoDataset } from './demoDataset.js';

// Demo mode must stay in memory: any write that reaches IndexedDB, the local
// folder or Supabase would land on the real account the demo was opened from.
describe('demo mode', () => {
  let calls;
  const saved = {};

  beforeEach(async () => {
    calls = [];
    saved.from = supabase.from;
    supabase.from = (table) => { calls.push(table); return { upsert: async () => ({}), insert: async () => ({}), delete: () => ({ eq: async () => ({}), in: async () => ({}) }) }; };
    store.demoMode = true;
    store.companyId = DEMO_COMPANY_ID;
    store.db = { transaction: () => { calls.push('indexeddb'); throw new Error('IndexedDB touched'); } };
    await store.initializeDemo({ id: 'user_1', name: 'Pat Owner', email: 'pat@test.example' });
  });

  afterEach(() => {
    supabase.from = saved.from;
    store.demoMode = false;
    store.db = null;
    store.clearSync();
  });

  test('loads the demo business into memory', () => {
    assert.strictEqual(store.getSettings().name, 'Harbourline Electrical & Air');
    assert.ok(store.getAll('jobs').length > 100);
    assert.ok(store.getAll('technicians').some((t) => t.id === 'user_1' && t.name === 'Pat Owner'), 'the visitor plays the owner');
    assert.ok(store.isDemoCrew());
    const ft = new Set(store.getAll('formTemplates').map((f) => f.id));
    store.getAll('formInstances').forEach((fi) => assert.ok(ft.has(fi.templateId)));
  });

  test('create, update, delete and save stay in memory', async () => {
    const lead = store.create('leads', { title: 'Demo test lead', status: 'New' });
    assert.ok(store.getById('leads', lead.id));
    store.update('leads', lead.id, { status: 'Contacted' });
    assert.strictEqual(store.getById('leads', lead.id).status, 'Contacted');
    store.delete('leads', lead.id);
    assert.strictEqual(store.getById('leads', lead.id), null);
    await store.save('customers', store.getAll('customers').slice(1));
    await store.saveSettings({ ...store.getSettings(), name: 'Renamed' });
    await new Promise((r) => setTimeout(r, 10));
    assert.deepStrictEqual(calls, []);
  });

  test('clearAll never wipes anything from a demo tab', async () => {
    const before = store.getAll('jobs').length;
    await store.clearAll();
    assert.strictEqual(store.getAll('jobs').length, before);
    assert.deepStrictEqual(calls, []);
  });

  test('a guest plays the dataset\'s own owner', async () => {
    await store.initializeDemo(DEMO_GUEST_USER);
    const owner = store.getAll('technicians').find((t) => t.id === DEMO_GUEST_USER.id);
    assert.ok(owner, 'the guest is on the crew');
    assert.strictEqual(owner.name, buildDemoDataset({ scope: 'demo_' }).collections.technicians[0].name);
    assert.ok(store.getAll('userTypes').some((ut) => ut.id === DEMO_GUEST_USER.userTypeId), 'the guest\'s user type exists');
  });

  describe('simulates a Cloud account (not Cloud+)', () => {
    test('the plan checks see Cloud, while the data stays local', async () => {
      const sub = await import('../utils/subscription.js');
      const { hasDeputyMax, getAITier } = await import('../utils/aiTier.js');
      assert.strictEqual(sub.isCloudUser(), true);
      assert.strictEqual(sub.isCloudCompany(), false, 'nothing is read from or written to Supabase');
      assert.strictEqual(sub.getTier(), 'cloud');
      assert.strictEqual(sub.subscriptionActive(), true);
      assert.strictEqual(sub.subscriptionRequired(), false);
      assert.strictEqual(sub.trialActive(), false, 'no trial banner');
      assert.strictEqual(getAITier(), 'cloud');
      assert.strictEqual(hasDeputyMax(), false, 'brny Max is a Cloud+ feature');
      assert.strictEqual(sub.isCloudPlus(), false);
      assert.strictEqual(sub.getSubscription().seats, store.getAll('technicians').filter((t) => !t.deactivated).length);
    });

    test('starting a demo creates no account, company or profile in Supabase', async () => {
      const saved = { rpc: supabase.rpc, auth: supabase.auth };
      const touched = [];
      supabase.rpc = (fn) => { touched.push(`rpc:${fn}`); return Promise.resolve({ data: null, error: null }); };
      supabase.auth = new Proxy(saved.auth, {
        get: (target, key) => (['signUp', 'signInWithPassword', 'signInAnonymously', 'admin'].includes(key)
          ? (...args) => { touched.push(`auth:${String(key)}`); return target[key]?.(...args); }
          : target[key]),
      });
      try {
        await store.initializeDemo(DEMO_GUEST_USER);
        store.create('jobs', { title: 'Demo job' });
        await new Promise((r) => setTimeout(r, 10));
      } finally {
        supabase.rpc = saved.rpc;
        supabase.auth = saved.auth;
      }
      assert.deepStrictEqual(touched, []);
      assert.deepStrictEqual(calls, [], 'no table was written');
    });

    test('refreshing the subscription never asks the server', async () => {
      const { refreshSubscription } = await import('../utils/subscription.js');
      assert.strictEqual(await refreshSubscription(), null);
      assert.deepStrictEqual(calls, []);
    });

    test('email sends are simulated and logged in memory', async () => {
      const { sendEmail, getSenderInfo, emailEnabled } = await import('../utils/email.js');
      const realInvoke = Object.getOwnPropertyDescriptor(supabase, 'functions');
      let invoked = 0;
      Object.defineProperty(supabase, 'functions', { configurable: true, get: () => ({ invoke: async () => { invoked += 1; return { data: null, error: null }; } }) });
      try {
        assert.strictEqual(emailEnabled(), true);
        const sent = await sendEmail({ to: 'customer@example.com', subject: 'Invoice', html: '<p>Hi</p>', template: 'invoice' });
        assert.strictEqual(sent.demo, true);
        assert.match(sent.from, /harbourline@relaydispatch\.com\.au$/);
        assert.ok(store.getAll('emailLog').some((row) => row.subject === 'Invoice' && row.status === 'sent'));
        assert.ok((await getSenderInfo()).addresses.invoice);
        assert.strictEqual(invoked, 0, 'no email function was called');
      } finally {
        Object.defineProperty(supabase, 'functions', realInvoke);
      }
    });

    test('Stripe and Xero show as not connected, and connecting explains the demo', async () => {
      const payments = await import('../utils/payments.js');
      const xero = await import('../utils/xero.js');
      assert.strictEqual(payments.paymentsEnabled(), true, 'the Payments screens show');
      assert.deepStrictEqual(await payments.refreshConnectStatus(), { chargesEnabled: false, detailsSubmitted: false });
      await assert.rejects(payments.startConnectOnboarding(), { message: payments.DEMO_CONNECTIONS_MESSAGE });
      assert.strictEqual((await xero.getXeroStatus()).connected, false);
      assert.strictEqual((await xero.fetchInvoiceSyncJobs({ force: true })).size, 0);
      await assert.rejects(xero.startXeroConnect(), { message: payments.DEMO_CONNECTIONS_MESSAGE });
      assert.deepStrictEqual(calls, [], 'no Supabase table was read');
    });
  });
});
