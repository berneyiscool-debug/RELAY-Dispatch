import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  RESEND_COOLDOWN_MS,
  TOKEN_TTL_MS,
  confirmBackupEmail,
  confirmationLink,
  confirmationEmail,
  isTokenShaped,
  sha256Hex,
  startBackupEmailConfirmation,
} from '../functions/_shared/backupEmailConfirmation.js';

// A user an admin adds must confirm their backup email before signing in.
// These tests pin the link lifecycle: one live token per user, stored only as
// a hash, single-use, expiring, rate-limited, and void once the address changes.

const NOW = Date.parse('2026-10-28T02:00:00Z');

// In-memory stand-in for the service-role client: just the query shapes the
// module uses (eq filters, order/limit, maybeSingle, insert, update, delete).
function makeAdmin(tables) {
  const db = { profiles: [], companies: [], backup_email_confirmations: [], ...tables };
  function query(table) {
    let op = 'select';
    let payload = null;
    const filters = [];
    let orderDesc = null;
    let limitN = null;
    const rows = () => db[table].filter((r) => filters.every(([k, v]) => r[k] === v));
    const run = () => {
      if (op === 'insert') { db[table].push({ ...payload }); return { data: null, error: null }; }
      if (op === 'update') { rows().forEach((r) => Object.assign(r, payload)); return { data: null, error: null }; }
      if (op === 'delete') { const keep = db[table].filter((r) => !rows().includes(r)); db[table] = keep; return { data: null, error: null }; }
      let out = rows().map((r) => ({ ...r }));
      if (orderDesc) out.sort((a, b) => String(b[orderDesc]).localeCompare(String(a[orderDesc])));
      if (limitN != null) out = out.slice(0, limitN);
      return { data: out, error: null };
    };
    const builder = {
      select() { return builder; },
      insert(v) { op = 'insert'; payload = v; return Promise.resolve(run()); },
      update(v) { op = 'update'; payload = v; return builder; },
      delete() { op = 'delete'; return builder; },
      eq(k, v) { filters.push([k, v]); return builder; },
      order(k, { ascending }) { orderDesc = ascending ? null : k; return builder; },
      limit(n) { limitN = n; return builder; },
      maybeSingle() { const { data } = run(); return Promise.resolve({ data: data[0] || null, error: null }); },
      then(resolve, reject) { return Promise.resolve(run()).then(resolve, reject); },
    };
    return builder;
  }
  return { db, admin: { from: query } };
}

function makeFetch() {
  const sent = [];
  const fetchImpl = async (url, init) => { sent.push({ url, body: JSON.parse(init.body) }); return { ok: true, json: async () => ({}) }; };
  return { sent, fetchImpl };
}

const profile = () => ({ id: 'u1', name: 'Ada', company_id: 'c1', backup_email: 'ada@example.com', backup_email_confirmed_at: null });
const company = { id: 'c1', name: 'Acme Electrical' };

function tokenFrom(sent) {
  return sent.at(-1).body.text.match(/token=([0-9a-f]{64})/)[1];
}

describe('starting a confirmation', () => {
  test('emails a link to the backup email and stores only its hash', async () => {
    const { db, admin } = makeAdmin({ profiles: [profile()], companies: [company] });
    const { sent, fetchImpl } = makeFetch();
    const result = await startBackupEmailConfirmation({ admin, userId: 'u1', resendKey: 'k', now: NOW, fetchImpl });

    assert.deepStrictEqual(result, { sent: true, email: 'ada@example.com' });
    assert.deepStrictEqual(sent[0].body.to, ['ada@example.com']);
    assert.match(sent[0].body.subject, /Acme Electrical/);
    const token = tokenFrom(sent);
    assert.strictEqual(db.backup_email_confirmations.length, 1);
    assert.strictEqual(db.backup_email_confirmations[0].token_hash, await sha256Hex(token));
    assert.ok(!JSON.stringify(db.backup_email_confirmations).includes(token));
  });

  test('a resend within a minute is refused, a forced one replaces the old link', async () => {
    const { db, admin } = makeAdmin({ profiles: [profile()], companies: [company] });
    const { fetchImpl } = makeFetch();
    await startBackupEmailConfirmation({ admin, userId: 'u1', resendKey: 'k', now: NOW, fetchImpl });

    const again = await startBackupEmailConfirmation({ admin, userId: 'u1', resendKey: 'k', now: NOW + 1000, fetchImpl });
    assert.strictEqual(again.status, 429);
    assert.ok(again.retryAfterMs > 0);

    const forced = await startBackupEmailConfirmation({ admin, userId: 'u1', resendKey: 'k', now: NOW + 1000, force: true, fetchImpl });
    assert.strictEqual(forced.sent, true);
    assert.strictEqual(db.backup_email_confirmations.length, 1);

    const later = await startBackupEmailConfirmation({ admin, userId: 'u1', resendKey: 'k', now: NOW + 1000 + RESEND_COOLDOWN_MS, fetchImpl });
    assert.strictEqual(later.sent, true);
  });

  test('nothing is sent without an address, or once it is confirmed', async () => {
    const { admin } = makeAdmin({ profiles: [{ ...profile(), backup_email: null }], companies: [company] });
    assert.strictEqual((await startBackupEmailConfirmation({ admin, userId: 'u1', resendKey: 'k', now: NOW })).status, 400);

    const { admin: admin2 } = makeAdmin({ profiles: [{ ...profile(), backup_email_confirmed_at: '2026-10-27T00:00:00Z' }], companies: [company] });
    assert.strictEqual((await startBackupEmailConfirmation({ admin: admin2, userId: 'u1', resendKey: 'k', now: NOW })).status, 409);
  });

  test('a missing Resend key is reported rather than silently skipped', async () => {
    const { admin } = makeAdmin({ profiles: [profile()], companies: [company] });
    assert.strictEqual((await startBackupEmailConfirmation({ admin, userId: 'u1', resendKey: '', now: NOW })).status, 500);
  });
});

describe('redeeming a link', () => {
  async function issued() {
    const env = makeAdmin({ profiles: [profile()], companies: [company] });
    const { sent, fetchImpl } = makeFetch();
    await startBackupEmailConfirmation({ admin: env.admin, userId: 'u1', resendKey: 'k', now: NOW, fetchImpl });
    return { ...env, token: tokenFrom(sent) };
  }

  test('confirms the address once, then the link is spent', async () => {
    const { db, admin, token } = await issued();
    assert.deepStrictEqual(await confirmBackupEmail({ admin, token, now: NOW + 5000 }), { confirmed: true });
    assert.strictEqual(db.profiles[0].backup_email_confirmed_at, new Date(NOW + 5000).toISOString());
    assert.strictEqual(db.backup_email_confirmations.length, 0);
    assert.strictEqual((await confirmBackupEmail({ admin, token, now: NOW + 6000 })).status, 404);
  });

  test('an expired link confirms nothing', async () => {
    const { db, admin, token } = await issued();
    assert.strictEqual((await confirmBackupEmail({ admin, token, now: NOW + TOKEN_TTL_MS })).status, 410);
    assert.strictEqual(db.profiles[0].backup_email_confirmed_at, null);
  });

  test('a link for an address that has since changed confirms nothing', async () => {
    const { db, admin, token } = await issued();
    db.profiles[0].backup_email = 'someone-else@example.com';
    assert.strictEqual((await confirmBackupEmail({ admin, token, now: NOW + 5000 })).status, 409);
    assert.strictEqual(db.profiles[0].backup_email_confirmed_at, null);
  });

  test('malformed or unknown tokens are refused', async () => {
    const { admin } = await issued();
    assert.strictEqual((await confirmBackupEmail({ admin, token: 'abc', now: NOW })).status, 400);
    assert.strictEqual((await confirmBackupEmail({ admin, token: 'f'.repeat(64), now: NOW })).status, 404);
  });
});

describe('the email itself', () => {
  test('links into the app\'s confirm route', () => {
    assert.strictEqual(confirmationLink('ab'.repeat(32)), `https://relaydispatch.com.au/app/#/confirm-email?token=${'ab'.repeat(32)}`);
    assert.ok(isTokenShaped('ab'.repeat(32)));
    assert.ok(!isTokenShaped('AB'.repeat(32)));
  });

  test('names and company are escaped in the HTML body', () => {
    const { html } = confirmationEmail({ name: '<b>Ada</b>', companyName: 'A&B', link: 'https://x/#/confirm-email?token=1' });
    assert.ok(html.includes('&lt;b&gt;Ada&lt;/b&gt;'));
    assert.ok(html.includes('A&amp;B'));
  });
});
