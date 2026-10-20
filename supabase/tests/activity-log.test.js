import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { activityFromRow, activityToRow } from '../../src/data/activityRecord.js';

const MIGRATION = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations', '20261020090000_activity_log.sql'),
  'utf8'
);
const COMPANY_A = '00000000-0000-0000-0000-00000000000a';
const COMPANY_B = '00000000-0000-0000-0000-00000000000b';
const ADMIN_A = '11111111-1111-1111-1111-111111111111';
const ADMIN_B = '22222222-2222-2222-2222-222222222222';
const TECH_A = '33333333-3333-3333-3333-333333333333';

let db;

async function asUser(userId, callback) {
  await db.exec(`RESET ROLE; SELECT set_config('request.jwt.claim.sub', '${userId}', false); SET ROLE authenticated;`);
  try {
    return await callback();
  } finally {
    await db.exec("RESET ROLE; SELECT set_config('request.jwt.claim.sub', '', false);");
  }
}

describe('activity log migration', () => {
  before(async () => {
    db = new PGlite();
    await db.exec(`
      CREATE ROLE anon NOLOGIN;
      CREATE ROLE authenticated NOLOGIN;
      CREATE SCHEMA auth;
      CREATE TABLE public.companies (id uuid PRIMARY KEY);
      CREATE TABLE public.profiles (id uuid PRIMARY KEY, company_id uuid NOT NULL REFERENCES public.companies(id));
      CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $fn$
        SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid
      $fn$;
      CREATE OR REPLACE FUNCTION public.get_user_company_id(uid uuid)
        RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
          SELECT company_id FROM public.profiles WHERE id = uid
        $fn$;
      GRANT USAGE ON SCHEMA auth, public TO anon, authenticated;
      -- Supabase's default privileges hand anon every new table; the migration
      -- has to take that back.
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
      INSERT INTO public.companies (id) VALUES ('${COMPANY_A}'), ('${COMPANY_B}');
      INSERT INTO public.profiles (id, company_id)
        VALUES ('${ADMIN_A}', '${COMPANY_A}'), ('${ADMIN_B}', '${COMPANY_B}'), ('${TECH_A}', '${COMPANY_A}');
    `);
    // Twice: a project where it has already landed must not abort.
    await db.exec(MIGRATION);
    await db.exec(MIGRATION);
  });

  after(async () => {
    await db.close();
  });

  test('creates an RLS-protected table with one tenant policy', async () => {
    const { rows } = await db.query(`
      SELECT relrowsecurity FROM pg_class WHERE relname = 'activity_log' AND relkind = 'r'
    `);
    assert.deepEqual(rows, [{ relrowsecurity: true }]);
    const { rows: policies } = await db.query(`
      SELECT count(*)::int AS policies FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'activity_log'
    `);
    assert.deepEqual(policies, [{ policies: 1 }]);
  });

  test('has every column the client whitelists', async () => {
    const { rows } = await db.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'activity_log'
      ORDER BY ordinal_position
    `);
    assert.deepEqual(rows.map(r => r.column_name), [
      'id', 'company_id', 'type', 'text', 'status', 'record_type', 'record_id',
      'actor_name', 'occurred_at', 'created_at', 'updated_at',
    ]);
  });

  test('reads and writes stay company-scoped', async () => {
    await asUser(ADMIN_A, async () => {
      await db.query(`
        INSERT INTO public.activity_log (id, company_id, type, text, record_type, record_id, actor_name)
        VALUES ('act-a', '${COMPANY_A}', 'job_converted_from_quote', 'Live job created.', 'job', 'job-1', 'System Automation')
      `);
      const { rows } = await db.query('SELECT id, occurred_at IS NOT NULL AS stamped FROM public.activity_log');
      assert.deepEqual(rows, [{ id: 'act-a', stamped: true }]);
      await assert.rejects(() => db.query(`
        INSERT INTO public.activity_log (id, company_id, text)
        VALUES ('act-b-forged', '${COMPANY_B}', 'Foreign')
      `), /row-level security/i);
    });

    await asUser(ADMIN_B, async () => {
      const { rows } = await db.query('SELECT id FROM public.activity_log');
      assert.deepEqual(rows, []);
    });
  });

  test('history is append-only for signed-in users', async () => {
    await asUser(ADMIN_A, async () => {
      await assert.rejects(
        () => db.query(`UPDATE public.activity_log SET text = 'rewritten' WHERE id = 'act-a'`),
        /permission denied/i
      );
      await assert.rejects(() => db.query(`DELETE FROM public.activity_log`), /permission denied/i);
      // The local -> Cloud upgrade re-sends rows with ON CONFLICT DO NOTHING,
      // which needs INSERT only and leaves the existing row alone.
      await db.query(`
        INSERT INTO public.activity_log (id, company_id, text)
        VALUES ('act-a', '${COMPANY_A}', 'replayed') ON CONFLICT (id) DO NOTHING
      `);
    });

    const { rows } = await db.query(`SELECT text FROM public.activity_log WHERE id = 'act-a'`);
    assert.deepEqual(rows, [{ text: 'Live job created.' }]);
  });

  test('an entry written by one client reads back the same on another', async () => {
    // Client 1 (the admin's device) writes the row exactly as the store sends it.
    const written = {
      id: 'act_lead_stage_1',
      companyId: COMPANY_A,
      recordType: 'lead',
      recordId: 'lead-7',
      leadId: 'lead-7',
      entityId: 'lead-7',
      type: 'lead_stage_changed',
      text: 'Moved from New to Qualified.',
      status: null,
      user: 'Admin A',
      timestamp: '2026-10-20T02:00:00.000Z',
      createdAt: '2026-10-20T02:00:00.000Z',
      updatedAt: '2026-10-20T02:00:00.000Z',
    };
    const row = activityToRow(written);
    const columns = Object.keys(row);
    await asUser(ADMIN_A, () => db.query(
      `INSERT INTO public.activity_log (${columns.join(', ')}) VALUES (${columns.map((_, i) => `$${i + 1}`).join(', ')})`,
      columns.map(c => row[c])
    ));

    // Client 2 is a different user in the same company loading from scratch.
    const { rows } = await asUser(TECH_A, () => db.query(
      `SELECT * FROM public.activity_log WHERE id = 'act_lead_stage_1'`
    ));
    assert.equal(rows.length, 1);
    const loaded = activityFromRow({
      ...rows[0],
      // PostgREST returns timestamptz as ISO text; PGlite hands back Date objects.
      occurred_at: rows[0].occurred_at.toISOString(),
      created_at: rows[0].created_at.toISOString(),
      updated_at: rows[0].updated_at.toISOString(),
    });
    assert.deepEqual(loaded, written);
  });

  test('anon has no access', async () => {
    await db.exec('SET ROLE anon;');
    try {
      await assert.rejects(() => db.query('SELECT * FROM public.activity_log'), /permission denied/i);
    } finally {
      await db.exec('RESET ROLE;');
    }
  });

  test('rows go with their company', async () => {
    await db.query(`
      INSERT INTO public.activity_log (id, company_id, text) VALUES ('act-b', '${COMPANY_B}', 'B only')
    `);
    await db.query(`DELETE FROM public.profiles WHERE company_id = '${COMPANY_B}'`);
    await db.query(`DELETE FROM public.companies WHERE id = '${COMPANY_B}'`);
    const { rows } = await db.query(`SELECT id FROM public.activity_log WHERE id = 'act-b'`);
    assert.deepEqual(rows, []);
  });
});
