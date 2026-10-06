// ============================================
// RELAY — FINISH SETUP CARD
// ============================================
// The card is the last gate between a verified-but-unprovisioned user and the
// app, so these tests pin the two things the signup spec calls out: it always
// renders something usable, and the company is only ever created through
// create_company_and_admin from a real session.
import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';

const localMem = new Map();
const sessionMem = new Map();

function memoryStore(map) {
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => { map.set(key, String(value)); },
    removeItem: (key) => { map.delete(key); },
  };
}

globalThis.localStorage = memoryStore(localMem);
globalThis.sessionStorage = memoryStore(sessionMem);

// The card only reaches for window.location.reload().
const windowStub = { reloads: 0 };
windowStub.location = { reload: () => { windowStub.reloads += 1; } };
globalThis.window = windowStub;

const { supabase } = await import('../utils/supabase.js');
const { renderFinishSetupCard } = await import('./FinishSetupCard.js');
const { readPendingMigration, readPendingSignup, savePendingMigration, savePendingSignup } = await import('../utils/cloudOnboarding.js');

function fakeNode() {
  const node = {
    value: '',
    textContent: '',
    disabled: false,
    style: {},
    dataset: {},
    listeners: {},
    addEventListener(type, handler) {
      node.listeners[type] = node.listeners[type] || [];
      node.listeners[type].push(handler);
    },
    removeEventListener(type, handler) {
      node.listeners[type] = (node.listeners[type] || []).filter((fn) => fn !== handler);
    },
    // Returns the last handler's value so an async click handler can be awaited.
    fire(type, event) {
      let result;
      (node.listeners[type] || []).forEach((handler) => { result = handler(event); });
      return result;
    },
  };
  return node;
}

function decodeEntities(value) {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function fakeHost() {
  const nodes = new Map();
  const host = {
    _html: '',
    get innerHTML() {
      return host._html;
    },
    // A browser turns value="..." into the field's value property, and the card
    // prefills that way, so the fake has to hydrate from the markup as well.
    set innerHTML(markup) {
      host._html = markup;
      nodes.clear();
      (markup.match(/<input\b[^>]*>/g) || []).forEach((tag) => {
        const id = /\bid="([^"]+)"/.exec(tag);
        if (!id) return;
        const node = host.querySelector(`#${id[1]}`);
        const value = /\bvalue="([^"]*)"/.exec(tag);
        if (value) node.value = decodeEntities(value[1]);
      });
      // Buttons carry their label as text content rather than a property.
      (markup.match(/<button\b[^>]*>[\s\S]*?<\/button>/g) || []).forEach((tag) => {
        const id = /\bid="([^"]+)"/.exec(tag);
        if (!id) return;
        const label = tag.slice(tag.indexOf('>') + 1, tag.lastIndexOf('</button>'));
        host.querySelector(`#${id[1]}`).textContent = decodeEntities(label);
      });
    },
    querySelector(selector) {
      if (!nodes.has(selector)) nodes.set(selector, fakeNode());
      return nodes.get(selector);
    },
    querySelectorAll(selector) {
      if (selector !== 'input') return [];
      return ['#finish-company', '#finish-name', '#finish-phone'].map((id) => host.querySelector(id));
    },
  };
  return host;
}

function sessionFixture(metadata = {}, email = 'dana@acme.com.au') {
  return { user: { id: 'user-1', email, user_metadata: metadata } };
}

let rpcCalls = [];
const realRpc = supabase.rpc;
const hadRealRpc = typeof supabase.rpc === 'function';

function callsFor(name) {
  return rpcCalls.filter((call) => call.name === name);
}

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

async function waitFor(predicate, label) {
  for (let i = 0; i < 200; i++) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  throw new Error(`Timed out waiting for ${label}`);
}

async function quiet(fn) {
  const realError = console.error;
  console.error = () => {};
  try {
    return await fn();
  } finally {
    console.error = realError;
  }
}

beforeEach(() => {
  localMem.clear();
  sessionMem.clear();
  windowStub.reloads = 0;
  rpcCalls = [];
  supabase.rpc = async (name, args) => {
    rpcCalls.push({ name, args });
    if (name === 'company_name_available') return { data: true, error: null };
    if (name === 'create_company_and_admin') return { data: 'company-1', error: null };
    return { data: null, error: null };
  };
});

afterEach(() => {
  if (hadRealRpc) supabase.rpc = realRpc;
  else delete supabase.rpc;
});

describe('finish setup card — rendering', () => {
  test('renders the form even when nothing was carried over from signup', () => {
    const host = fakeHost();
    renderFinishSetupCard(host, { session: sessionFixture() });

    assert.match(host.innerHTML, /Finish setting up your company/);
    assert.match(host.innerHTML, /id="finish-company"/);
    assert.match(host.innerHTML, /id="finish-name"/);
    assert.match(host.innerHTML, /id="finish-phone"/);
    assert.match(host.innerHTML, /id="finish-submit"/);
    assert.strictEqual(host.querySelector('#finish-company').value, '');
  });

  test('names the account being provisioned', () => {
    const host = fakeHost();
    renderFinishSetupCard(host, { session: sessionFixture() });

    assert.match(host.innerHTML, /dana@acme\.com\.au/);
  });

  test('prefills from the signup marker', () => {
    const host = fakeHost();
    renderFinishSetupCard(host, {
      session: sessionFixture(),
      pending: { companyName: 'Acme Electrical', adminName: 'Dana Reed', adminPhone: '0400111222' },
    });

    assert.strictEqual(host.querySelector('#finish-company').value, 'Acme Electrical');
    assert.strictEqual(host.querySelector('#finish-name').value, 'Dana Reed');
    assert.strictEqual(host.querySelector('#finish-phone').value, '0400111222');
    assert.match(host.innerHTML, /value="Acme Electrical"/);
  });

  test('reads the signup marker out of session storage', () => {
    savePendingSignup({
      companyName: 'Stored Co',
      adminName: 'Stored Name',
      adminPhone: '0400999888',
      termsAccepted: true,
    });

    const host = fakeHost();
    renderFinishSetupCard(host, { session: sessionFixture() });

    assert.strictEqual(readPendingSignup().companyName, 'Stored Co');

    assert.strictEqual(host.querySelector('#finish-company').value, 'Stored Co');
    assert.strictEqual(host.querySelector('#finish-name').value, 'Stored Name');
    assert.strictEqual(host.querySelector('#finish-phone').value, '0400999888');
  });

  test('falls back to the auth record for the name and mobile', () => {
    const host = fakeHost();
    renderFinishSetupCard(host, {
      session: sessionFixture({ name: 'Dana', phone: '0400000000' }),
      pending: {},
    });

    assert.strictEqual(host.querySelector('#finish-name').value, 'Dana');
    assert.strictEqual(host.querySelector('#finish-phone').value, '0400000000');
  });

  test('lets the signup marker win over the auth record', () => {
    const host = fakeHost();
    renderFinishSetupCard(host, {
      session: sessionFixture({ name: 'Auth Name', phone: '111' }),
      pending: { adminName: 'Marker Name', adminPhone: '222' },
    });

    assert.strictEqual(host.querySelector('#finish-name').value, 'Marker Name');
    assert.strictEqual(host.querySelector('#finish-phone').value, '222');
  });

  test('escapes prefilled values instead of injecting them', () => {
    const host = fakeHost();
    renderFinishSetupCard(host, {
      session: sessionFixture({}, '"><img src=x onerror=alert(1)>'),
      pending: { companyName: '"><script>alert(1)</script>' },
    });

    assert.ok(!host.innerHTML.includes('<script>'), 'company name must not break out of the attribute');
    assert.ok(!host.innerHTML.includes('<img'), 'email must not break out of the markup');
    assert.match(host.innerHTML, /&lt;script&gt;/);
    assert.match(host.innerHTML, /&lt;img/);
  });

  test('honours a custom submit label', () => {
    const host = fakeHost();
    renderFinishSetupCard(host, { session: sessionFixture(), pending: {}, submitLabel: 'Create company' });

    assert.strictEqual(host.querySelector('#finish-submit').textContent, 'Create company');
  });

  test('falls back to the default submit label', () => {
    const host = fakeHost();
    renderFinishSetupCard(host, { session: sessionFixture(), pending: {} });

    assert.strictEqual(host.querySelector('#finish-submit').textContent, 'Save & continue');
  });

  test('the reload button asks the browser to reload', () => {
    const host = fakeHost();
    renderFinishSetupCard(host, { session: sessionFixture(), pending: {} });
    host.querySelector('#finish-reload').fire('click');

    assert.strictEqual(windowStub.reloads, 1);
  });

  test('returns something the caller can dispose', () => {
    const host = fakeHost();
    const handle = renderFinishSetupCard(host, { session: sessionFixture(), pending: {} });

    assert.strictEqual(typeof handle.checker.checkNow, 'function');
    assert.strictEqual(typeof handle.checker.dispose, 'function');
    assert.strictEqual(typeof handle.dispose, 'function');
  });
});

describe('finish setup card — submit guards', () => {
  test('refuses to provision without a company name and says why', async () => {
    const host = fakeHost();
    renderFinishSetupCard(host, { session: sessionFixture(), pending: {} });

    await host.querySelector('#finish-submit').fire('click');

    assert.strictEqual(host.querySelector('#finish-error').textContent, 'Enter your company name to continue.');
    assert.strictEqual(host.querySelector('#finish-error').style.display, 'block');
    assert.strictEqual(rpcCalls.length, 0, 'nothing should reach the server');
    assert.strictEqual(host.querySelector('#finish-submit').disabled, false);
  });

  test('never provisions when the company name belongs to someone else', async () => {
    supabase.rpc = async (name, args) => {
      rpcCalls.push({ name, args });
      if (name === 'company_name_available') return { data: false, error: null };
      if (name === 'create_company_and_admin') return { data: 'company-1', error: null };
      return { data: null, error: null };
    };

    const host = fakeHost();
    renderFinishSetupCard(host, { session: sessionFixture(), pending: {} });
    host.querySelector('#finish-company').value = 'Acme Electrical';

    await host.querySelector('#finish-submit').fire('click');

    assert.strictEqual(callsFor('company_name_available').length, 1);
    assert.strictEqual(callsFor('create_company_and_admin').length, 0);
    assert.match(host.querySelector('#finish-error').textContent, /already taken/);
    assert.strictEqual(host.querySelector('#finish-error').style.display, 'block');
    assert.strictEqual(host.querySelector('#finish-submit').disabled, false);
    assert.strictEqual(host.querySelector('#finish-submit').textContent, 'Save & continue');
  });

  test('ignores a second click while a submit is still in flight', async () => {
    const gate = deferred();
    supabase.rpc = async (name, args) => {
      rpcCalls.push({ name, args });
      if (name === 'company_name_available') return { data: true, error: null };
      if (name === 'create_company_and_admin') return gate.promise;
      return { data: null, error: null };
    };

    const host = fakeHost();
    renderFinishSetupCard(host, { session: sessionFixture(), pending: {} });
    host.querySelector('#finish-company').value = 'Acme Electrical';
    const button = host.querySelector('#finish-submit');

    const first = button.fire('click');
    button.fire('click');

    assert.strictEqual(button.disabled, true);
    await waitFor(() => callsFor('create_company_and_admin').length === 1, 'the create call to start');

    button.fire('click');
    assert.strictEqual(callsFor('create_company_and_admin').length, 1);

    gate.resolve({ data: 'company-1', error: null });
    await first;
  });

  test('submits when Enter is pressed in a field', async () => {
    const host = fakeHost();
    renderFinishSetupCard(host, { session: sessionFixture(), pending: {} });
    host.querySelector('#finish-company').value = 'Acme Electrical';

    host.querySelector('#finish-company').fire('keydown', { key: 'Enter', preventDefault: () => {} });

    await waitFor(() => callsFor('create_company_and_admin').length === 1, 'the Enter key to submit');
    assert.strictEqual(callsFor('company_name_available').length, 1);
  });
});

describe('finish setup card — provisioning', () => {
  test('provisions through the RPC with the reviewed values and the terms flag', async () => {
    const host = fakeHost();
    renderFinishSetupCard(host, {
      session: sessionFixture(),
      pending: { termsAccepted: true },
    });
    host.querySelector('#finish-company').value = '  Acme Electrical  ';
    host.querySelector('#finish-name').value = '  Dana Reed  ';
    host.querySelector('#finish-phone').value = '  0400111222  ';

    await host.querySelector('#finish-submit').fire('click');

    assert.deepStrictEqual(rpcCalls.map((call) => call.name), [
      'company_name_available',
      'create_company_and_admin',
      'record_terms_acceptance',
      'start_cloud_trial',
    ]);
    assert.deepStrictEqual(callsFor('create_company_and_admin')[0].args, {
      user_id: 'user-1',
      company_name: 'Acme Electrical',
      admin_name: 'Dana Reed',
      admin_phone: '0400111222',
    });
    assert.strictEqual(callsFor('record_terms_acceptance')[0].args, undefined);
    assert.deepStrictEqual(callsFor('start_cloud_trial')[0].args, { p_days: 14 });
  });

  test('sends null for an empty name and mobile', async () => {
    const host = fakeHost();
    renderFinishSetupCard(host, { session: sessionFixture(), pending: {} });
    host.querySelector('#finish-company').value = 'Acme Electrical';

    await host.querySelector('#finish-submit').fire('click');

    assert.deepStrictEqual(callsFor('create_company_and_admin')[0].args, {
      user_id: 'user-1',
      company_name: 'Acme Electrical',
      admin_name: null,
      admin_phone: null,
    });
  });

  test('skips the terms stamp when signup never accepted', async () => {
    const host = fakeHost();
    renderFinishSetupCard(host, { session: sessionFixture(), pending: {} });
    host.querySelector('#finish-company').value = 'Acme Electrical';

    await host.querySelector('#finish-submit').fire('click');

    assert.deepStrictEqual(rpcCalls.map((call) => call.name), [
      'company_name_available',
      'create_company_and_admin',
      'start_cloud_trial',
    ]);
  });

  test('re-stamps the resume markers with the new company id', async () => {
    savePendingMigration({ localAccountId: 'acct_1', localAccountName: 'Old Local' });

    const host = fakeHost();
    renderFinishSetupCard(host, {
      session: sessionFixture(),
      pending: { adminName: 'Dana Reed', termsAccepted: true },
    });
    host.querySelector('#finish-company').value = 'Acme Electrical';

    await host.querySelector('#finish-submit').fire('click');

    const signup = readPendingSignup();
    assert.strictEqual(signup.companyId, 'company-1');
    assert.strictEqual(signup.companyName, 'Acme Electrical');
    assert.strictEqual(signup.adminName, 'Dana Reed');
    assert.strictEqual(signup.termsAccepted, true);

    const migration = readPendingMigration();
    assert.strictEqual(migration.companyId, 'company-1');
    assert.strictEqual(migration.localAccountId, 'acct_1');
  });

  test('hands the company id and trial end back to the caller', async () => {
    supabase.rpc = async (name, args) => {
      rpcCalls.push({ name, args });
      if (name === 'company_name_available') return { data: true, error: null };
      if (name === 'create_company_and_admin') return { data: 'company-9', error: null };
      if (name === 'start_cloud_trial') return { data: '2026-01-01T00:00:00.000Z', error: null };
      return { data: null, error: null };
    };

    const seen = [];
    const host = fakeHost();
    renderFinishSetupCard(host, {
      session: sessionFixture(),
      pending: { companyName: 'Acme' },
      onProvisioned: async (result) => { seen.push(result); },
    });

    await host.querySelector('#finish-submit').fire('click');

    assert.deepStrictEqual(seen, [{ companyId: 'company-9', trialEndsAt: '2026-01-01T00:00:00.000Z' }]);
  });

  test('survives a failed trial start and still reports the company', async () => {
    supabase.rpc = async (name, args) => {
      rpcCalls.push({ name, args });
      if (name === 'company_name_available') return { data: true, error: null };
      if (name === 'create_company_and_admin') return { data: 'company-9', error: null };
      if (name === 'start_cloud_trial') throw new Error('network down');
      return { data: null, error: null };
    };

    const seen = [];
    const host = fakeHost();
    renderFinishSetupCard(host, {
      session: sessionFixture(),
      pending: { companyName: 'Acme' },
      onProvisioned: async (result) => { seen.push(result); },
    });

    await quiet(() => host.querySelector('#finish-submit').fire('click'));

    assert.deepStrictEqual(seen, [{ companyId: 'company-9', trialEndsAt: null }]);
  });

  test('reports a provisioning failure and leaves the form usable', async () => {
    supabase.rpc = async (name, args) => {
      rpcCalls.push({ name, args });
      if (name === 'company_name_available') return { data: true, error: null };
      if (name === 'create_company_and_admin') {
        return { data: null, error: { message: 'permission denied for table companies' } };
      }
      return { data: null, error: null };
    };

    const host = fakeHost();
    renderFinishSetupCard(host, { session: sessionFixture(), pending: { companyName: 'Acme' } });
    const button = host.querySelector('#finish-submit');

    await quiet(() => button.fire('click'));

    assert.strictEqual(host.querySelector('#finish-error').textContent, 'permission denied for table companies');
    assert.strictEqual(host.querySelector('#finish-error').style.display, 'block');
    assert.strictEqual(button.disabled, false);
    assert.strictEqual(button.textContent, 'Save & continue');
    assert.strictEqual(callsFor('start_cloud_trial').length, 0);
  });

  test('does not provision when the session carries no user', async () => {
    const orphan = fakeHost();
    renderFinishSetupCard(orphan, { session: { user: null }, pending: {} });
    orphan.querySelector('#finish-company').value = 'Acme';

    await quiet(() => orphan.querySelector('#finish-submit').fire('click'));

    assert.deepStrictEqual(rpcCalls.map((call) => call.name), ['company_name_available']);
    assert.match(orphan.querySelector('#finish-error').textContent, /Sign in again/);
    assert.strictEqual(orphan.querySelector('#finish-submit').disabled, false);
  });
});

describe('finish setup card — company name check', () => {
  test('debounces the availability check and cancels it on dispose', async () => {
    const host = fakeHost();
    const { checker } = renderFinishSetupCard(host, { session: sessionFixture(), pending: {} });
    const input = host.querySelector('#finish-company');
    input.value = 'Acme Electrical';

    input.fire('input');
    assert.strictEqual(rpcCalls.length, 0, 'nothing is asked until the debounce elapses');

    await new Promise((resolve) => setTimeout(resolve, 420));
    assert.strictEqual(rpcCalls.length, 1);

    input.value = 'Acme Electrical Two';
    input.fire('input');
    checker.dispose();
    await new Promise((resolve) => setTimeout(resolve, 420));
    assert.strictEqual(rpcCalls.length, 1, 'dispose cancels the pending check');
  });

  test('shows the availability verdict next to the field', async () => {
    const host = fakeHost();
    renderFinishSetupCard(host, { session: sessionFixture(), pending: {} });
    const input = host.querySelector('#finish-company');
    input.value = 'Acme Electrical';
    input.fire('input');

    await new Promise((resolve) => setTimeout(resolve, 420));

    const status = host.querySelector('#finish-company-status');
    assert.strictEqual(status.textContent, 'That name is available.');
    assert.strictEqual(status.dataset.state, 'ok');
  });

  test('checks a prefilled name straight away', () => {
    const host = fakeHost();
    renderFinishSetupCard(host, {
      session: sessionFixture(),
      pending: { companyName: 'Acme Electrical' },
    });

    assert.strictEqual(callsFor('company_name_available').length, 1);
    assert.strictEqual(host.querySelector('#finish-company-status').textContent, 'Checking\u2026');
  });
});
