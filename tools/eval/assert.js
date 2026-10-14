/**
 * Assertions for the eval suite.
 *
 * The suite grades the *store*, not the model's prose. Every task takes a
 * snapshot of the collections before its turn, and its check decides pass/fail
 * by diffing that snapshot against the store afterwards. A model that talks a
 * good game while writing nothing scores zero, which is the point.
 *
 * Assertions have to be relative rather than absolute: the demo dataset is built
 * from `new Date()` at boot, so its anchor moves with the clock and a task that
 * hardcodes "Tue 4 Nov" would rot overnight. Anything date-shaped is derived
 * from the live clock here.
 */

/** Today as the app would key it: the machine's local calendar day. */
export function todayKey(now = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** A shallow-per-collection copy of the store, safe to hold across a turn. */
export function snapshot(store) {
  const out = {};
  for (const [collection, rows] of Object.entries(store.cache || {})) {
    if (!Array.isArray(rows)) continue;
    out[collection] = rows.map((row) => JSON.parse(JSON.stringify(row)));
  }
  return out;
}

function index(before) {
  const map = new Map();
  for (const [collection, rows] of Object.entries(before)) {
    for (const row of rows) map.set(`${collection}\u0000${row.id}`, JSON.stringify(row));
  }
  return map;
}

/**
 * What changed between two snapshots.
 *
 * @returns {{ created: Array, updated: Array, removed: Array }} entries are
 *   `{ collection, record }`, with `previous` on updates.
 */
export function diff(before, after) {
  const beforeIndex = index(before);
  const afterIndex = index(after);
  const created = [];
  const updated = [];
  const removed = [];

  for (const [key, json] of afterIndex) {
    const [collection, id] = key.split('\u0000');
    const record = JSON.parse(json);
    if (!beforeIndex.has(key)) created.push({ collection, id, record });
    else if (beforeIndex.get(key) !== json) updated.push({ collection, id, record, previous: JSON.parse(beforeIndex.get(key)) });
  }
  for (const [key] of beforeIndex) {
    if (afterIndex.has(key)) continue;
    const [collection, id] = key.split('\u0000');
    removed.push({ collection, id });
  }
  return { created, updated, removed };
}

/** Find records in a snapshot by id, or by a partial field match. */
export function find(rows, query) {
  if (!Array.isArray(rows)) return [];
  if (typeof query === 'string') return rows.filter((row) => String(row.id) === query);
  return rows.filter((row) => Object.entries(query).every(([key, value]) => {
    const actual = row[key];
    if (typeof value === 'function') return value(actual, row);
    if (value instanceof RegExp) return value.test(String(actual ?? ''));
    return String(actual ?? '').toLowerCase() === String(value ?? '').toLowerCase();
  }));
}

/**
 * A tiny assertion recorder. `check` functions receive one of these and push
 * failures onto it; the runner reports them verbatim.
 */
export function createChecker() {
  const failures = [];
  const t = {
    failures,
    ok(condition, message) {
      if (!condition) failures.push(message);
      return Boolean(condition);
    },
    eq(actual, expected, message) {
      const pass = JSON.stringify(actual) === JSON.stringify(expected);
      if (!pass) failures.push(`${message} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`);
      return pass;
    },
    match(actual, pattern, message) {
      const pass = typeof actual === 'string' && pattern.test(actual);
      if (!pass) failures.push(`${message} (no match for ${pattern} in ${JSON.stringify(actual)?.slice(0, 200)})`);
      return pass;
    },
    atLeast(actual, minimum, message) {
      const pass = Number(actual) >= minimum;
      if (!pass) failures.push(`${message} (expected at least ${minimum}, got ${actual})`);
      return pass;
    },
    exactly(actual, expected, message) {
      return t.eq(actual, expected, message);
    },
    fail(message) {
      failures.push(message);
      return false;
    },
  };
  return t;
}

/** Render a diff compactly for the console. */
export function summariseDiff({ created, updated, removed }) {
  const bits = [];
  if (created.length) bits.push(`+${created.length} ${created.map((c) => c.collection).join('/')}`);
  if (updated.length) bits.push(`~${updated.length} ${updated.map((c) => c.collection).join('/')}`);
  if (removed.length) bits.push(`-${removed.length}`);
  return bits.join(' ') || 'no store changes';
}
