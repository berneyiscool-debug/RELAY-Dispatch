/**
 * Boots the real app in Node, against the deterministic demo dataset.
 *
 * The eval is only worth running if it exercises the same code the browser does,
 * so this file imports `src/data/store.js` and `src/actions/index.js` unmodified
 * and swaps in exactly two things: the browser's storage APIs, which Node does
 * not have, and the AI transport, which normally lives behind the `relay-copilot`
 * edge function. Nothing in `src/` knows it is being tested.
 *
 * Four details are load-bearing:
 *
 * - `sessionStorage.relay_demo_mode` must be set *before* the store module is
 *   imported. The store's constructor runs at import time and decides from that
 *   flag whether to load the demo dataset or reach for Supabase and IndexedDB.
 * - `supabase.functions` is an own, configurable *getter* installed by
 *   `guardFunctionsInDemo`, and in a demo session that getter always returns an
 *   invoke that refuses to work. A plain assignment is silently ignored; only
 *   `Object.defineProperty` replaces it.
 * - Demo mode makes `hasPermission()` return true for everything
 *   (`permissions.js`), but it also pins `store.companyId` to the demo account
 *   (`acct_demo`), and `isCloudUser()` reads that to decide whether brny has a
 *   managed AI backend at all. The company id is therefore moved to a normal one
 *   after the store is up, which is what a paying workspace looks like.
 * - That last step is not free: the store's write path branches on the same
 *   `companyId` prefix, so a paying workspace writes to Supabase first and only
 *   settles its optimistic cache entry afterwards. `supabase.from` is therefore
 *   replaced with a no-op that *resolves*, modelling a healthy cloud, rather than
 *   one that throws - a throwing stub makes every action report failure while the
 *   cache quietly keeps the row, which is a bug in the harness and not a finding
 *   about the app.
 */

import { createAnthropicTransport } from './transport.js';

/** The visitor in demo mode: the business owner, so they can see every record. */
export const EVAL_USER = {
  id: 'user_1',
  name: 'Pat Owner',
  email: 'pat.owner@example.com',
  role: 'technician',
};

/** A company id that is not the demo account, so `isCloudUser()` is true. */
export const EVAL_COMPANY = 'comp_eval';

const DEMO_FLAG = 'relay_demo_mode';

/** The smallest thing that satisfies `localStorage`. */
export class MemoryStorage {
  #map = new Map();

  get length() {
    return this.#map.size;
  }

  getItem(key) {
    const value = this.#map.get(String(key));
    return value === undefined ? null : value;
  }

  setItem(key, value) {
    this.#map.set(String(key), String(value));
  }

  removeItem(key) {
    this.#map.delete(String(key));
  }

  clear() {
    this.#map.clear();
  }

  key(index) {
    return [...this.#map.keys()][index] ?? null;
  }
}

/** Install `localStorage` and `sessionStorage` as real globals. */
export function installStorage() {
  const local = new MemoryStorage();
  const session = new MemoryStorage();
  for (const [name, value] of [['localStorage', local], ['sessionStorage', session]]) {
    Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
  }
  return { local, session };
}

let booted = null;

/**
 * A chainable, awaitable no-op standing in for a Supabase table builder.
 *
 * Every method returns the same stub, so chains of any length work, and the stub
 * is itself thenable so both `await supabase.from(…).select()` and the store's
 * detached `supabase.from(…).insert(…).then(…)` land. Both resolve to an empty
 * successful result.
 */
function noopClient(onCall, label) {
  const result = { data: [], error: null };
  let stub;
  stub = new Proxy(function () {}, {
    get(_target, prop) {
      if (prop === 'then') return (onFulfilled) => Promise.resolve(result).then(onFulfilled);
      if (prop === 'catch' || prop === 'finally') return () => stub;
      return (...args) => {
        onCall(prop, args);
        return stub;
      };
    },
    apply() {
      return stub;
    },
  });
  if (label) Object.defineProperty(stub, 'toString', { value: () => label });
  return stub;
}

/**
 * Boot the app once per process.
 *
 * @param {object} [options]
 * @param {object} [options.transport]  Override for the AI transport (a mock, in tests).
 * @param {object} [options.user]       The signed-in visitor. Defaults to `EVAL_USER`.
 * @returns {Promise<object>} `{ store, supabase, actions, runTurn, playbook, user, transport,
 *   reset, snapshot, cloudTouches, cloudCalls, dbTouches, requestLog }`
 */
export async function boot(options = {}) {
  if (booted) return booted;

  const user = { ...EVAL_USER, companyId: EVAL_COMPANY, ...(options.user || {}) };
  const { local, session } = installStorage();
  local.setItem('currentUser', JSON.stringify(user));
  session.setItem(DEMO_FLAG, '1');

  const { store } = await import('../../src/data/store.js');
  const { supabase } = await import('../../src/utils/supabase.js');
  const actions = await import('../../src/actions/index.js');
  const { runTurn } = await import('../../src/utils/brnyAgent.js');
  const { buildBrnyPlaybook } = await import('../../src/utils/brnyPlaybook.js');

  // Anything that reaches for the cloud is a bug in the harness, not a finding
  // about the app, so both escape routes are counted rather than just stubbed.
  // `from` has to succeed (see the note at the top of this file); `store.db` is
  // unreachable in Node because every call site is guarded by `if (this.db)`.
  let cloudTouches = 0;
  let dbTouches = 0;
  const cloudCalls = [];

  const requestLog = [];
  const transport = options.transport
    || createAnthropicTransport({ onCall: (info) => requestLog.push(info) });

  Object.defineProperty(supabase, 'functions', {
    value: { invoke: (name, request) => transport.invoke(name, request) },
    configurable: true,
    writable: true,
  });
  const tables = new Map();
  supabase.from = (table) => {
    cloudTouches += 1;
    if (!tables.has(table)) {
      tables.set(table, noopClient((method, args) => cloudCalls.push({ table, method, args }), table));
    }
    return tables.get(table);
  };

  if (store.initPromise) {
    try {
      await store.initPromise;
    } catch (_) { /* a failed demo boot is reported by the first task, not here */ }
  }

  const harness = {
    store,
    supabase,
    actions,
    runTurn,
    playbook: buildBrnyPlaybook(),
    user,
    transport,
    requestLog,
    get cloudTouches() {
      return cloudTouches;
    },
    cloudCalls,
    get dbTouches() {
      return dbTouches;
    },
    reset,
    snapshot,
  };

  async function reset() {
    localStorage.setItem('currentUser', JSON.stringify(user));
    sessionStorage.setItem(DEMO_FLAG, '1');
    store.demoMode = true;
    await store.initializeDemo(user);
    store.companyId = user.companyId;
    cloudTouches = 0;
    dbTouches = 0;
    cloudCalls.length = 0;
    store.db = {
      transaction() {
        dbTouches += 1;
        return noopClient(() => {});
      },
    };
    return store;
  }

  function snapshot() {
    const out = {};
    for (const [collection, rows] of Object.entries(store.cache || {})) {
      if (!Array.isArray(rows)) continue;
      out[collection] = rows.map((row) => JSON.parse(JSON.stringify(row)));
    }
    return out;
  }

  booted = harness;
  await reset();
  return harness;
}
