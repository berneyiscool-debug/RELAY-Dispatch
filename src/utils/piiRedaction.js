// ============================================
// RELAY — PII redaction for the AI pipeline
// ============================================
// Privacy-by-design: customer information is redacted to placeholders before
// any AI call, then rehydrated into the response before it reaches the user.
// Only the operator (and their local store) ever sees raw values; the LLM sees
// [[PII_1]], [[PII_2]], etc.
//
// Pure functions so the same logic can later run server-side (edge function)
// for inbound workflows.

import { store } from '../data/store.js';

const STOPLIST = new Set([
  'new', 'active', 'pending', 'the', 'and', 'for', 'with', 'from', 'general',
  'none', 'office', 'main', 'service', 'services', 'pty', 'ltd', 'company',
]);

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Word-boundary match for values that start/end on a word character (names,
// addresses, companies). Literal (escaped) match for anything else.
function buildMatcher(value) {
  const esc = escapeRegExp(value);
  const first = value[0];
  const last = value[value.length - 1];
  const wordy = /\w/.test(first) && /\w/.test(last);
  return new RegExp(wordy ? `\\b${esc}\\b` : esc, 'g');
}

function addValue(set, v) {
  if (typeof v !== 'string') return;
  const t = v.trim();
  if (t.length < 3) return;
  if (STOPLIST.has(t.toLowerCase())) return;
  set.add(t);
}

function collectIdentityValues() {
  const values = new Set();

  const customers = store.getAll('customers') || [];
  customers.forEach((c) => {
    addValue(values, c.first_name);
    addValue(values, c.last_name);
    if (c.first_name && c.last_name) addValue(values, `${c.first_name} ${c.last_name}`);
    addValue(values, c.company);
    addValue(values, c.email);
    addValue(values, c.phone);
    addValue(values, c.mobile);
    addValue(values, c.address);
    addValue(values, c.abn);
    (c.contacts || []).forEach((ct) => {
      addValue(values, ct.name);
      addValue(values, ct.email);
      addValue(values, ct.phone);
    });
    (c.sites || []).forEach((site) => {
      addValue(values, site.name);
      addValue(values, site.address);
    });
  });

  (store.getAll('technicians') || []).forEach((t) => {
    addValue(values, t.name);
    addValue(values, t.email);
    addValue(values, t.phone);
  });

  (store.getAll('contractors') || []).forEach((c) => {
    addValue(values, c.name);
    addValue(values, c.email);
    addValue(values, c.phone);
  });

  (store.getAll('suppliers') || []).forEach((s) => {
    addValue(values, s.name);
    addValue(values, s.email);
    addValue(values, s.phone);
  });

  const settings = store.getSettings() || {};
  addValue(values, settings.name);
  addValue(values, settings.abn);
  addValue(values, settings.phone);
  addValue(values, settings.email);
  addValue(values, settings.address);

  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    addValue(values, currentUser && currentUser.name);
  } catch (_) { /* ignore */ }

  return values;
}

export function createRedactionContext() {
  const ctx = {
    map: {},           // placeholder -> original
    reverse: new Map(), // original -> placeholder
    entries: [],       // [value, placeholder], sorted longest-first
    counter: 1,
  };

  const values = collectIdentityValues();
  [...values].sort((a, b) => b.length - a.length).forEach((v) => {
    const ph = `[[PII_${ctx.counter++}]]`;
    ctx.map[ph] = v;
    ctx.reverse.set(v, ph);
    ctx.entries.push([v, ph]);
  });

  return ctx;
}

function nextPlaceholder(ctx) {
  return `[[PII_${ctx.counter++}]]`;
}

export function redactText(text, ctx) {
  if (typeof text !== 'string' || !text) return text;
  let out = text;

  // Generic catch-all patterns for structured PII the store scan might miss.
  const emailRe = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
  const phoneRe = /(?:\+?\d{1,3}[\s-]?)?(?:\(\d{1,4}\)[\s-]?)?\d{3,4}[\s-]?\d{3,4}/g;
  const abnRe = /\b\d{2}\s?\d{3}\s?\d{3}\s?\d{3}\b/g;

  const replacePattern = (re) => {
    out = out.replace(re, (m) => {
      const existing = ctx.reverse.get(m);
      if (existing) return existing;
      const ph = nextPlaceholder(ctx);
      ctx.map[ph] = m;
      ctx.reverse.set(m, ph);
      return ph;
    });
  };

  replacePattern(emailRe);
  replacePattern(phoneRe);
  replacePattern(abnRe);

  // Explicit identity values, longest-first so "John Smith" wins over "John".
  for (const [value, ph] of ctx.entries) {
    out = out.replace(buildMatcher(value), ph);
  }

  return out;
}

export function rehydrateText(text, ctx) {
  if (typeof text !== 'string' || !text) return text;
  let out = text;
  for (const [ph, value] of Object.entries(ctx.map)) {
    out = out.split(ph).join(value);
  }
  return out;
}
