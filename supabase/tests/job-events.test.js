/**
 * Runs 20261030100000_job_events.sql against PGlite, after the tech scoping
 * migration it builds on, on a fixture shaped like the live project.
 *
 * What this pins: the table is append-only for signed-in users, the author
 * can't be forged, an event can't point at another company's job, and a
 * technician only sees and adds history on jobs assigned to them.
 *
 * Run with: npm run test:migrations
 */
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';

const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations');
const TECH_SCOPE = readFileSync(join(MIGRATIONS_DIR, '20261030090000_tech_job_scope.sql'), 'utf8');
const MIGRATION = readFileSync(join(MIGRATIONS_DIR, '20261030100000_job_events.sql'), 'utf8');

const COMPANY_A = '00000000-0000-0000-0000-00000000000a';
const COMPANY_B = '00000000-0000-0000-0000-00000000000b';
const ADMIN_A = '11111111-1111-1111-1111-111111111111';
const ADMIN_B = '22222222-2222-2222-2222-222222222222';
const TECH_A = '33333333-3333-3333-3333-333333333333';
const TECH_A2 = '44444444-4444-4444-4444-444444444444';

let db;

async function asUser(userId, callback) {
  await db.exec(`RESET ROLE; SELECT set_config('request.jwt.claim.sub', '${userId}', false); SET ROLE authenticated;`);
  try {
    return await callback();
  } finally {
    await db.exec("RESET ROLE; SELECT set_config('request.jwt.claim.sub', '', false);");
  }
}

function insertEvent(id, { company = COMPANY_A, job = 'job-tech', actorId = null, occurredAt = null } = {}) {
  return db.query(`
    INSERT INTO public.job_events (id, company_id, job_id, action, content, actor_id, actor_name, occurred_at)
    VALUES ($1, $2, $3, 'status_changed', 'Job status changed from "Scheduled" to "In Progress"', $4, 'Someone', COALESCE($5::timestamptz, now()))
  `, [id, company, job, actorId, occurredAt]);
}

describe('job events migration', () => {
  before(async () => {
    db = new PGlite();
    await db.exec(`
      CREATE ROLE anon NOLOGIN;
      CREATE ROLE authenticated NOLOGIN;
      CREATE ROLE service_role NOLOGIN BYPASSRLS;
      CREATE SCHEMA auth;
      CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $fn$
        SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid
      $fn$;
      GRANT USAGE ON SCHEMA auth, public TO anon, authenticated;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;

      CREATE TABLE public.companies (id uuid PRIMARY KEY, name text);
      CREATE TABLE public.profiles (
        id uuid PRIMARY KEY, company_id uuid NOT NULL REFERENCES public.companies(id),
        role text NOT NULL DEFAULT 'technician', deactivated boolean DEFAULT false
      );
      CREATE OR REPLACE FUNCTION public.get_user_company_id(uid uuid)
        RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
          SELECT company_id FROM public.profiles WHERE id = uid
        $fn$;
      CREATE TABLE public.jobs (id text PRIMARY KEY, company_id uuid NOT NULL, technician_id text, status text);
      ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
      CREATE POLICY jobs_tenant_policy ON public.jobs FOR ALL TO authenticated
        USING (company_id = public.get_user_company_id(auth.uid()))
        WITH CHECK (company_id = public.get_user_company_id(auth.uid()));
      -- The tech scoping migration addresses these two directly.
      CREATE TABLE public.schedule (id text PRIMARY KEY, company_id uuid NOT NULL, technician_id text);
      CREATE TABLE public.activity_log (id text PRIMARY KEY, company_id uuid NOT NULL);
      ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

      INSERT INTO public.companies (id, name) VALUES ('${COMPANY_A}', 'A'), ('${COMPANY_B}', 'B');
      INSERT INTO public.profiles (id, company_id, role) VALUES
        ('${ADMIN_A}', '${COMPANY_A}', 'admin'),
        ('${ADMIN_B}', '${COMPANY_B}', 'admin'),
        ('${TECH_A}', '${COMPANY_A}', 'technician'),
        ('${TECH_A2}', '${COMPANY_A}', 'technician');
      INSERT INTO public.jobs (id, company_id, technician_id) VALUES
        ('job-tech', '${COMPANY_A}', '${TECH_A}'),
        ('job-other', '${COMPANY_A}', '${TECH_A2}'),
        ('job-doomed', '${COMPANY_A}', NULL),
        ('job-b', '${COMPANY_B}', NULL);
    `);
    await db.exec(TECH_SCOPE);
    // Twice: re-running on a project where it has already landed must not abort.
    await db.exec(MIGRATION);
    await db.exec(MIGRATION);
  });

  after(async () => {
    await db.close();
  });

  test('history is append-only for signed-in users', async () => {
    await asUser(ADMIN_A, async () => {
      await insertEvent('ev-1');
      await assert.rejects(
        () => db.query(`UPDATE public.job_events SET content = 'rewritten' WHERE id = 'ev-1'`),
        /permission denied/i
      );
      await assert.rejects(() => db.query(`DELETE FROM public.job_events`), /permission denied/i);
    });
    const { rows } = await db.query(`SELECT content FROM public.job_events WHERE id = 'ev-1'`);
    assert.match(rows[0].content, /In Progress/);
  });

  test('the author is always the caller', async () => {
    await asUser(TECH_A, async () => {
      await insertEvent('ev-forged-actor', { actorId: ADMIN_A });
    });
    const { rows } = await db.query(`SELECT actor_id FROM public.job_events WHERE id = 'ev-forged-actor'`);
    assert.deepEqual(rows, [{ actor_id: TECH_A }]);
  });

  test('an event cannot point at another company’s job', async () => {
    await asUser(ADMIN_A, async () => {
      await assert.rejects(() => insertEvent('ev-cross', { job: 'job-b' }), /different company/i);
      await assert.rejects(() => insertEvent('ev-wrong-co', { company: COMPANY_B, job: 'job-b' }), /row-level security/i);
    });
    await asUser(ADMIN_B, async () => {
      const { rows } = await db.query('SELECT id FROM public.job_events');
      assert.deepEqual(rows, []);
    });
  });

  test('a technician only sees and adds history on their assigned jobs', async () => {
    await asUser(ADMIN_A, async () => {
      await insertEvent('ev-other', { job: 'job-other' });
    });
    await asUser(TECH_A, async () => {
      await insertEvent('ev-tech');
      await assert.rejects(() => insertEvent('ev-not-mine', { job: 'job-other' }), /row-level security/i);
      const { rows } = await db.query('SELECT id FROM public.job_events ORDER BY id');
      assert.deepEqual(rows.map(r => r.id), ['ev-1', 'ev-forged-actor', 'ev-tech']);
    });
  });

  test('queued writes keep their time, but nothing lands in the future', async () => {
    await asUser(TECH_A, async () => {
      await insertEvent('ev-queued', { occurredAt: '2026-10-30T01:00:00Z' });
      await insertEvent('ev-future', { occurredAt: '2099-01-01T00:00:00Z' });
    });
    const { rows } = await db.query(`
      SELECT id, occurred_at < now() + interval '1 minute' AS not_future, occurred_at = '2026-10-30T01:00:00Z' AS kept
        FROM public.job_events WHERE id IN ('ev-queued', 'ev-future') ORDER BY id`);
    assert.deepEqual(rows, [
      { id: 'ev-future', not_future: true, kept: false },
      { id: 'ev-queued', not_future: true, kept: true },
    ]);
  });

  test('only known kinds and object payloads are accepted', async () => {
    await asUser(ADMIN_A, async () => {
      await assert.rejects(() => db.query(`
        INSERT INTO public.job_events (id, company_id, job_id, kind) VALUES ('ev-kind', '${COMPANY_A}', 'job-tech', 'gossip')
      `), /job_events_kind_check/);
      await assert.rejects(() => db.query(`
        INSERT INTO public.job_events (id, company_id, job_id, payload) VALUES ('ev-arr', '${COMPANY_A}', 'job-tech', '[1]')
      `), /job_events_payload_object/);
    });
  });

  test('deleting a job takes its history with it', async () => {
    await asUser(ADMIN_A, async () => {
      await insertEvent('ev-doomed', { job: 'job-doomed' });
      await db.query(`DELETE FROM public.jobs WHERE id = 'job-doomed'`);
    });
    const { rows } = await db.query(`SELECT id FROM public.job_events WHERE id = 'ev-doomed'`);
    assert.deepEqual(rows, []);
  });

  test('the anon key gets nothing', async () => {
    await db.exec('SET ROLE anon;');
    try {
      await assert.rejects(() => db.query('SELECT id FROM public.job_events'), /permission denied/i);
    } finally {
      await db.exec('RESET ROLE;');
    }
  });
});
