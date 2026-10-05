import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';

const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
  clear: () => mem.clear(),
};

const { supabase } = await import('./supabase.js');
const {
  normalizeCompanyName,
  validateCompanyName,
  isCompanyNameAvailable,
  bindCompanyNameCheck,
} = await import('./companyName.js');

// Stand-ins for the two DOM nodes the binder touches. No jsdom in this repo, so
// the binder only ever uses this small surface — keep it that way.
function fakeInput(value = '') {
  return {
    value,
    listeners: {},
    addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); },
    removeEventListener(type, fn) { this.listeners[type] = (this.listeners[type] || []).filter((f) => f !== fn); },
    fire(type) { (this.listeners[type] || []).forEach((fn) => fn()); },
  };
}

function fakeStatus() {
  return { textContent: '', style: {}, dataset: {} };
}

const realRpc = supabase.rpc;
const realRpcType = typeof supabase.rpc;

describe('company name normalisation', () => {
  test('matches the SQL key: lowercased, collapsed whitespace, trimmed', () => {
    assert.strictEqual(normalizeCompanyName('  Acme   Electrical '), 'acme electrical');
    assert.strictEqual(normalizeCompanyName('ACME\tELECTRICAL'), 'acme electrical');
    assert.strictEqual(normalizeCompanyName('Acme\n Electrical'), 'acme electrical');
  });

  test('treats missing and blank names as the empty key', () => {
    assert.strictEqual(normalizeCompanyName(null), '');
    assert.strictEqual(normalizeCompanyName(undefined), '');
    assert.strictEqual(normalizeCompanyName('   '), '');
    assert.strictEqual(normalizeCompanyName('\t\n '), '');
  });

  test('keeps punctuation and digits that distinguish real company names', () => {
    assert.strictEqual(normalizeCompanyName("O'Brien & Sons Pty Ltd"), "o'brien & sons pty ltd");
    assert.strictEqual(normalizeCompanyName('24/7 Electrical'), '24/7 electrical');
  });
});

describe('company name validation', () => {
  test('requires a name', () => {
    assert.deepStrictEqual(validateCompanyName(''), {
      valid: false,
      message: 'Enter your company name to continue.',
    });
    assert.strictEqual(validateCompanyName('   ').valid, false);
  });

  test('rejects one-character names', () => {
    assert.strictEqual(validateCompanyName('A').valid, false);
    assert.match(validateCompanyName('A').message, /at least 2/);
  });

  test('caps the length', () => {
    assert.strictEqual(validateCompanyName('x'.repeat(80)).valid, true);
    assert.strictEqual(validateCompanyName('x'.repeat(81)).valid, false);
    assert.match(validateCompanyName('x'.repeat(81)).message, /up to 80/);
  });

  test('accepts an ordinary name with no message', () => {
    assert.deepStrictEqual(validateCompanyName('Acme Electrical'), { valid: true, message: '' });
  });
});

describe('company name availability', () => {
  beforeEach(() => {
    mem.clear();
    supabase.rpc = realRpc;
  });

  test('asks the RPC with the raw name and a p_name argument', async () => {
    const calls = [];
    supabase.rpc = async (fn, args) => { calls.push([fn, args]); return { data: true, error: null }; };

    const result = await isCompanyNameAvailable('  Acme   Electrical ');
    assert.deepStrictEqual(result.available, true);
    assert.match(result.message, /available/i);
    assert.deepStrictEqual(calls, [['company_name_available', { p_name: '  Acme   Electrical ' }]]);
  });

  test('reports a taken name with the message the RPC raises', async () => {
    supabase.rpc = async () => ({ data: false, error: null });
    const result = await isCompanyNameAvailable('Tenant A');
    assert.strictEqual(result.available, false);
    assert.match(result.message, /already taken/i);
  });

  test('never calls the server for a name that fails local validation', async () => {
    let called = false;
    supabase.rpc = async () => { called = true; return { data: true, error: null }; };

    const result = await isCompanyNameAvailable('   ');
    assert.strictEqual(result.available, false);
    assert.strictEqual(called, false);
    assert.match(result.message, /Enter your company name/);
  });

  test('answers "unknown" instead of blocking when the check fails', async () => {
    supabase.rpc = async () => { throw new Error('network down'); };
    assert.strictEqual((await isCompanyNameAvailable('Acme')).available, 'unknown');

    supabase.rpc = async () => ({ data: null, error: new Error('permission denied') });
    assert.strictEqual((await isCompanyNameAvailable('Acme')).available, 'unknown');
  });

  test('answers "unknown" in an offline build with no rpc client', async () => {
    // The Supabase stub used when VITE_SUPABASE_* is missing has no rpc().
    supabase.rpc = undefined;
    try {
      const result = await isCompanyNameAvailable('Acme Electrical');
      assert.strictEqual(result.available, 'unknown');
    } finally {
      if (realRpcType !== 'undefined') supabase.rpc = realRpc;
    }
  });
});

describe('company name live check binding', () => {
  beforeEach(() => {
    mem.clear();
    supabase.rpc = realRpc;
  });

  test('shows the verdict for the typed name', async () => {
    supabase.rpc = async (_fn, { p_name }) => ({ data: p_name !== 'Taken Co', error: null });

    const input = fakeInput('Free Co');
    const status = fakeStatus();
    const binder = bindCompanyNameCheck(input, status, { delay: 0 });

    await binder.checkNow();
    assert.strictEqual(binder.state(), 'ok');
    assert.strictEqual(status.dataset.state, 'ok');
    assert.match(status.textContent, /available/i);

    input.value = 'Taken Co';
    await binder.checkNow();
    assert.strictEqual(binder.state(), 'taken');
    assert.strictEqual(status.dataset.state, 'taken');
    assert.match(status.textContent, /already taken/i);

    binder.dispose();
  });

  test('clears the message while the box is empty instead of nagging', async () => {
    supabase.rpc = async () => ({ data: true, error: null });
    const input = fakeInput('');
    const status = fakeStatus();
    const binder = bindCompanyNameCheck(input, status, { delay: 0 });

    await binder.checkNow();
    assert.strictEqual(binder.state(), 'idle');
    assert.strictEqual(status.textContent, '');

    binder.dispose();
  });

  test('debounces typing into one check and stops after dispose', async () => {
    let calls = 0;
    supabase.rpc = async () => { calls += 1; return { data: true, error: null }; };

    const input = fakeInput('Acme');
    const binder = bindCompanyNameCheck(input, fakeStatus(), { delay: 15 });

    input.fire('input');
    input.fire('input');
    input.fire('input');
    assert.strictEqual(calls, 0); // nothing fires synchronously

    await new Promise((r) => setTimeout(r, 60));
    assert.strictEqual(calls, 1);

    binder.dispose();
    input.fire('input');
    await new Promise((r) => setTimeout(r, 40));
    assert.strictEqual(calls, 1);
  });

  test('a stale answer cannot overwrite the current verdict', async () => {
    const gate = {};
    supabase.rpc = async (_fn, { p_name }) => {
      if (p_name === 'Slow Co') await new Promise((r) => { gate.release = r; });
      return { data: p_name !== 'Taken Co', error: null };
    };

    const input = fakeInput('Slow Co');
    const status = fakeStatus();
    const binder = bindCompanyNameCheck(input, status, { delay: 0 });

    const first = binder.checkNow(); // hangs on the gate
    input.value = 'Free Co';
    await binder.checkNow();
    assert.strictEqual(binder.state(), 'ok');

    gate.release();
    await first;
    assert.strictEqual(binder.state(), 'ok'); // still the newer answer
    assert.match(status.textContent, /available/i);

    binder.dispose();
  });
});
