/**
 * The no-signup demo's tracking and guest brny allowance.
 *
 * The migration runs for real on PGlite (see migrations.test.js for why), with
 * Supabase's default grants, so a table or view left readable by the anon key
 * fails here. The pure rules in relay-demo/demo.js are exercised directly.
 *
 * Run with: npm run test:migrations
 */
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import {
  DEMO_LIMIT_DEFAULTS,
  GUEST_MAX_TOKENS,
  clientIp,
  guestLimitMessage,
  guestPayload,
  hashVisitor,
  parseClientEvent,
  readDemoLimits,
} from '../functions/relay-demo/demo.js';
import { LIMIT_DEFAULTS } from '../functions/relay-copilot/limits.js';

const here = dirname(fileURLToPath(import.meta.url));
const read = (rel) => readFileSync(join(here, rel), 'utf8');
const MIGRATION = read('../migrations/20261027120000_demo_tracking.sql');
const DEMO_FN = read('../functions/relay-demo/index.ts');
const COPILOT = read('../functions/relay-copilot/index.ts');

const DEMO_A = '0f0f0f0f-0000-4000-8000-00000000000a';
const DEMO_B = '0f0f0f0f-0000-4000-8000-00000000000b';
const COMPANY = '00000000-0000-0000-0000-00000000000c';

describe('demo tracking migration', () => {
  let db;

  before(async () => {
    db = new PGlite();
    await db.exec(`
      CREATE ROLE anon NOLOGIN;
      CREATE ROLE authenticated NOLOGIN;
      CREATE ROLE service_role NOLOGIN BYPASSRLS;
      GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
      -- Supabase's default privileges hand anon every new table and view; the
      -- migration has to take that back.
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
    `);
    // Twice: a project where it has already landed must not abort.
    await db.exec(MIGRATION);
    await db.exec(MIGRATION);
  });

  after(async () => {
    await db.close();
  });

  for (const role of ['anon', 'authenticated']) {
    test(`${role} can neither read nor write the events or the reports`, async () => {
      for (const sql of [
        'SELECT * FROM public.demo_events',
        `INSERT INTO public.demo_events (demo_id, event) VALUES ('${DEMO_A}', 'demo_started')`,
        'SELECT * FROM public.demo_funnel_daily',
        'SELECT * FROM public.demo_conversion',
      ]) {
        await db.exec(`SET ROLE ${role}`);
        await assert.rejects(db.query(sql), /permission denied/, `${role}: ${sql}`);
        await db.exec('RESET ROLE');
      }
    });
  }

  test('only known events and sources are accepted', async () => {
    await assert.rejects(db.query(`INSERT INTO public.demo_events (demo_id, event) VALUES ('${DEMO_A}', 'page_view')`));
    await assert.rejects(db.query(`INSERT INTO public.demo_events (demo_id, event, source) VALUES ('${DEMO_A}', 'demo_started', 'email')`));
  });

  test('a signup names its company, and is counted once per company', async () => {
    await assert.rejects(db.query(`INSERT INTO public.demo_events (demo_id, event) VALUES ('${DEMO_A}', 'signup_completed')`));
    await assert.rejects(db.query(`INSERT INTO public.demo_events (demo_id, event, company_id) VALUES ('${DEMO_A}', 'demo_started', '${COMPANY}')`));
    await db.query(`INSERT INTO public.demo_events (demo_id, event, company_id) VALUES ('${DEMO_A}', 'signup_completed', '${COMPANY}')`);
    await assert.rejects(
      db.query(`INSERT INTO public.demo_events (demo_id, event, company_id) VALUES ('${DEMO_A}', 'signup_completed', '${COMPANY}')`),
      (err) => err.code === '23505'
    );
    await db.query('DELETE FROM public.demo_events');
  });

  test('the reports count the funnel and demo → signup conversion', async () => {
    await db.exec('SET ROLE service_role');
    await db.query(`
      INSERT INTO public.demo_events (demo_id, event, source, company_id, created_at) VALUES
        ('${DEMO_A}', 'demo_started',     'site',   NULL, '2026-11-02 01:00:00+00'),
        ('${DEMO_A}', 'demo_started',     'site',   NULL, '2026-11-02 01:30:00+00'),
        ('${DEMO_A}', 'assistant_call',   NULL,     NULL, '2026-11-02 01:10:00+00'),
        ('${DEMO_A}', 'assistant_call',   NULL,     NULL, '2026-11-02 01:11:00+00'),
        ('${DEMO_A}', 'signup_clicked',   NULL,     NULL, '2026-11-02 01:20:00+00'),
        ('${DEMO_A}', 'signup_completed', NULL, '${COMPANY}', '2026-11-03 02:00:00+00'),
        ('${DEMO_B}', 'demo_started',     'launch', NULL, '2026-11-02 03:00:00+00')
    `);
    const { rows: funnel } = await db.query(`
      SELECT day::text, demos_started::int, started_from_site::int, started_from_launch::int,
             demos_using_brny::int, brny_calls::int, signup_clicks::int, signups::int
      FROM public.demo_funnel_daily ORDER BY day
    `);
    assert.deepEqual(funnel, [
      { day: '2026-11-02', demos_started: 2, started_from_site: 2, started_from_launch: 1, demos_using_brny: 1, brny_calls: 2, signup_clicks: 1, signups: 0 },
      { day: '2026-11-03', demos_started: 0, started_from_site: 0, started_from_launch: 0, demos_using_brny: 0, brny_calls: 0, signup_clicks: 0, signups: 1 },
    ]);
    const { rows: conversion } = await db.query(`
      SELECT first_demo_day::text, source, demos::int, signed_up::int, conversion_pct::float
      FROM public.demo_conversion ORDER BY source
    `);
    assert.deepEqual(conversion, [
      { first_demo_day: '2026-11-02', source: 'launch', demos: 1, signed_up: 0, conversion_pct: 0 },
      { first_demo_day: '2026-11-02', source: 'site', demos: 1, signed_up: 1, conversion_pct: 100 },
    ]);
    await db.exec('RESET ROLE');
  });
});

describe('guest brny allowance', () => {
  test('defaults to a sixth of a cloud user\'s daily ceiling', () => {
    const limits = readDemoLimits(() => undefined);
    assert.equal(limits.cap, Math.floor(LIMIT_DEFAULTS.userCap / 6));
    assert.equal(limits.cap, 25);
    assert.equal(limits.pool, DEMO_LIMIT_DEFAULTS.pool);
  });

  test('follows the cloud ceiling when that is retuned', () => {
    assert.equal(readDemoLimits((name) => ({ RELAY_AI_USER_CAP: '300' })[name]).cap, 50);
  });

  test('every number can be set directly', () => {
    const env = { RELAY_AI_DEMO_CAP: '10', RELAY_AI_DEMO_POOL: '500', RELAY_DEMO_EVENTS_PER_DAY: '20' };
    assert.deepEqual(readDemoLimits((name) => env[name]), { cap: 10, pool: 500, eventsPerDay: 20 });
  });

  test('the limit message points a guest at an account', () => {
    const resetsAt = new Date('2026-11-02T13:00:00Z');
    assert.match(guestLimitMessage({ scope: 'user', cap: 25, resetsAt }), /Create a free account/);
    assert.match(guestLimitMessage({ scope: 'company', cap: 25, resetsAt }), /Create a free account/);
  });
});

describe('guest requests', () => {
  test('the model is pinned and the output ceiling clamped', () => {
    const { payload } = guestPayload(
      { messages: [{ role: 'user', content: 'hi' }], model: 'claude-opus-5-5', max_tokens: 99999, endpoint: 'https://evil.example' },
      { model: 'claude-haiku-5-5' }
    );
    assert.equal(payload.model, 'claude-haiku-5-5');
    assert.equal(payload.max_tokens, GUEST_MAX_TOKENS);
    assert.equal(payload.endpoint, undefined);
  });

  test('tools are forwarded with auto choice', () => {
    const { payload } = guestPayload({ messages: [{ role: 'user', content: 'hi' }], tools: [{ name: 't' }] }, { model: 'm' });
    assert.deepEqual(payload.tool_choice, { type: 'auto' });
  });

  test('empty and oversized requests are refused', () => {
    assert.ok(guestPayload({ messages: [] }, { model: 'm' }).error);
    assert.ok(guestPayload({ messages: [{ role: 'user', content: 'x'.repeat(250_000) }] }, { model: 'm' }).error);
  });

  test('relay-demo talks to the same host, model and API version as relay-copilot', () => {
    for (const name of ['ALLOWED_HOST', 'DEFAULT_MODEL', 'ANTHROPIC_VERSION', 'API_KEY_ENV']) {
      const pick = (src) => (src.match(new RegExp(`const ${name} = '([^']+)'`)) || [])[1];
      assert.ok(pick(COPILOT), `${name} not found in relay-copilot`);
      assert.equal(pick(DEMO_FN), pick(COPILOT), name);
    }
  });

  test('a guest is counted against the allowance before Anthropic is called', () => {
    assert.ok(DEMO_FN.indexOf('evaluateLimits(') < DEMO_FN.indexOf('await fetch('));
  });
});

describe('browser events', () => {
  test('accepts the three browser events with a UUID demo id', () => {
    assert.deepEqual(parseClientEvent({ demoId: DEMO_A, event: 'demo_started', source: 'site' }), { demoId: DEMO_A, event: 'demo_started', source: 'site' });
    assert.deepEqual(parseClientEvent({ demoId: DEMO_A, event: 'signup_clicked', source: 'site' }), { demoId: DEMO_A, event: 'signup_clicked', source: null });
  });

  test('a browser cannot record brny calls or unknown events', () => {
    assert.ok(parseClientEvent({ demoId: DEMO_A, event: 'assistant_call' }).error);
    assert.ok(parseClientEvent({ demoId: 'not-a-uuid', event: 'demo_started' }).error);
  });

  test('an unknown source is recorded as a link', () => {
    assert.equal(parseClientEvent({ demoId: DEMO_A, event: 'demo_started', source: 'email' }).source, 'link');
  });
});

describe('visitor identity', () => {
  const headers = (h) => ({ get: (k) => h[k.toLowerCase()] ?? null });

  test('takes the first forwarded address', () => {
    assert.equal(clientIp(headers({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' })), '203.0.113.7');
    assert.equal(clientIp(headers({ 'cf-connecting-ip': '203.0.113.8' })), '203.0.113.8');
    assert.equal(clientIp(headers({})), '');
  });

  test('stores a keyed hash, never the address', async () => {
    const a = await hashVisitor('203.0.113.7', 'salt');
    assert.match(a, /^[0-9a-f]{64}$/);
    assert.equal(await hashVisitor('203.0.113.7', 'salt'), a);
    assert.notEqual(await hashVisitor('203.0.113.7', 'other'), a);
    assert.equal(await hashVisitor('', 'salt'), null);
  });
});
