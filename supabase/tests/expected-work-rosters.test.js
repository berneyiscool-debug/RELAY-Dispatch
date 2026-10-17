import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';

const MIGRATION = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations', '20261015065311_expected_work_rosters.sql'),
  'utf8'
);
const ALLOW_UNASSIGNED_MIGRATION = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations', '20261017063532_allow_unassigned_expected_work_rosters.sql'),
  'utf8'
);
const COMPANY_A = '00000000-0000-0000-0000-00000000000a';
const COMPANY_B = '00000000-0000-0000-0000-00000000000b';
const ADMIN_A = '11111111-1111-1111-1111-111111111111';
const ADMIN_B = '22222222-2222-2222-2222-222222222222';

let db;

async function asUser(userId, callback) {
  await db.exec(`RESET ROLE; SELECT set_config('request.jwt.claim.sub', '${userId}', false); SET ROLE authenticated;`);
  try {
    return await callback();
  } finally {
    await db.exec("RESET ROLE; SELECT set_config('request.jwt.claim.sub', '', false);");
  }
}

describe('expected work roster migration', () => {
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
      INSERT INTO public.companies (id) VALUES ('${COMPANY_A}'), ('${COMPANY_B}');
      INSERT INTO public.profiles (id, company_id)
        VALUES ('${ADMIN_A}', '${COMPANY_A}'), ('${ADMIN_B}', '${COMPANY_B}');
    `);
    await db.exec(MIGRATION);
    await db.exec(ALLOW_UNASSIGNED_MIGRATION);
  });

  after(async () => {
    await db.close();
  });

  test('creates RLS-protected roster and dismissal tables with their tenant policies', async () => {
    const { rows } = await db.query(`
      SELECT tablename, relrowsecurity
      FROM pg_tables
      JOIN pg_class ON pg_class.relname = pg_tables.tablename
      WHERE schemaname = 'public'
        AND tablename IN ('expected_work_rosters', 'expected_work_roster_dismissals')
      ORDER BY tablename
    `);
    assert.deepEqual(rows, [
      { tablename: 'expected_work_roster_dismissals', relrowsecurity: true },
      { tablename: 'expected_work_rosters', relrowsecurity: true }
    ]);
    const { rows: policies } = await db.query(`
      SELECT tablename, count(*)::int AS policies
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename IN ('expected_work_rosters', 'expected_work_roster_dismissals')
      GROUP BY tablename
    `);
    assert.equal(policies.length, 2);
    assert.ok(policies.every(row => row.policies === 1));
  });

  test('authenticated roster reads and writes remain company-scoped', async () => {
    await asUser(ADMIN_A, async () => {
      await db.query(`
        INSERT INTO public.expected_work_rosters
          (id, company_id, name, start_date, repeat_every_weeks, week_patterns, shift_hours, technician_ids)
        VALUES
          ('roster-a', '${COMPANY_A}', 'Crew A', '2026-10-12', 1,
           '[[true,false,false,false,false,false,false]]', 8, '["tech-a"]')
      `);
      const { rows } = await db.query('SELECT id FROM public.expected_work_rosters');
      assert.deepEqual(rows, [{ id: 'roster-a' }]);
      const { rows: defaults } = await db.query(`
        SELECT default_start_time::text, default_end_time::text
        FROM public.expected_work_rosters WHERE id = 'roster-a'
      `);
      assert.deepEqual(defaults, [{ default_start_time: '08:00:00', default_end_time: '16:00:00' }]);
      await assert.rejects(() => db.query(`
        INSERT INTO public.expected_work_rosters
          (id, company_id, name, start_date, repeat_every_weeks, week_patterns, shift_hours, technician_ids)
        VALUES
          ('roster-b-forged', '${COMPANY_B}', 'Foreign', '2026-10-12', 1,
           '[[true,false,false,false,false,false,false]]', 8, '["tech-b"]')
      `), /row-level security/i);

      await db.query(`
        INSERT INTO public.expected_work_roster_dismissals
          (id, company_id, roster_id, technician_id, date, reason, dismissed_by)
        VALUES ('dismissal-a', '${COMPANY_A}', 'roster-a', 'tech-a', '2026-10-12', 'No work', 'Admin A')
      `);
      const { rows: dismissals } = await db.query('SELECT id FROM public.expected_work_roster_dismissals');
      assert.deepEqual(dismissals, [{ id: 'dismissal-a' }]);
    });

    await asUser(ADMIN_B, async () => {
      const { rows: rosters } = await db.query('SELECT id FROM public.expected_work_rosters');
      const { rows: dismissals } = await db.query('SELECT id FROM public.expected_work_roster_dismissals');
      assert.deepEqual(rosters, []);
      assert.deepEqual(dismissals, []);
    });
  });

  test('anon has no table privileges and recurring roster values are constrained', async () => {
    await db.exec('SET ROLE anon;');
    await assert.rejects(() => db.query('SELECT * FROM public.expected_work_rosters'), /permission denied/i);
    await db.exec('RESET ROLE;');
    await asUser(ADMIN_A, async () => {
      await db.query(`
        INSERT INTO public.expected_work_rosters
          (id, company_id, name, start_date, repeat_every_weeks, week_patterns, shift_hours, technician_ids)
        VALUES
          ('roster-minute-hours', '${COMPANY_A}', 'Minute precision', '2026-10-12', 1,
           '[[true,false,false,false,false,false,false]]', 7.1, '["tech-a"]')
      `);
      await assert.rejects(() => db.query(`
        INSERT INTO public.expected_work_rosters
          (id, company_id, name, start_date, repeat_every_weeks, week_patterns, shift_hours, technician_ids)
        VALUES
          ('roster-invalid-hours', '${COMPANY_A}', 'Invalid', '2026-10-12', 1,
           '[[true,false,false,false,false,false,false]]', 0, '["tech-a"]')
      `), /check constraint/i);
      await assert.rejects(() => db.query(`
        INSERT INTO public.expected_work_rosters
          (id, company_id, name, start_date, repeat_every_weeks, week_patterns, shift_hours, technician_ids)
        VALUES
          ('roster-invalid-cycle', '${COMPANY_A}', 'Invalid cycle', '2026-10-12', 0,
           '[[true,false,false,false,false,false,false]]', 8, '["tech-a"]')
      `), /check constraint/i);
      await assert.rejects(() => db.query(`
        INSERT INTO public.expected_work_rosters
          (id, company_id, name, start_date, repeat_every_weeks, week_patterns, week_shift_times, shift_hours, technician_ids)
        VALUES
          ('roster-invalid-day-times', '${COMPANY_A}', 'Invalid day times', '2026-10-12', 2,
           '[[true,false,false,false,false,false,false],[false,true,false,false,false,false,false]]',
           '[]', 8, '["tech-a"]')
      `), /check constraint/i);
      await assert.rejects(() => db.query(`
        INSERT INTO public.expected_work_rosters
          (id, company_id, name, start_date, repeat_every_weeks, week_patterns, shift_hours, technician_ids)
        VALUES
          ('roster-too-long', '${COMPANY_A}', 'Too long', '2026-10-12', 53,
           '[[true,false,false,false,false,false,false]]', 8, '["tech-a"]')
      `), /check constraint/i);
      await assert.rejects(() => db.query(`
        INSERT INTO public.expected_work_rosters
          (id, company_id, name, start_date, repeat_every_weeks, week_patterns, shift_hours, technician_ids)
        VALUES
          ('roster-non-monday', '${COMPANY_A}', 'Not Monday', '2026-10-13', 1,
           '[[true,false,false,false,false,false,false]]', 8, '["tech-a"]')
      `), /check constraint/i);
      await assert.rejects(() => db.query(`
        INSERT INTO public.expected_work_rosters
          (id, company_id, name, start_date, repeat_every_weeks, week_patterns, shift_hours, technician_ids)
        VALUES
          ('roster-missing-week', '${COMPANY_A}', 'Missing cycle week', '2026-10-12', 2,
           '[[true,false,false,false,false,false,false]]', 8, '["tech-a"]')
      `), /check constraint/i);
    });
  });

  test('rosters can be saved without assigned staff while technician IDs remain an array', async () => {
    await asUser(ADMIN_A, async () => {
      await db.query(`
        INSERT INTO public.expected_work_rosters
          (id, company_id, name, start_date, repeat_every_weeks, week_patterns, shift_hours, technician_ids)
        VALUES
          ('roster-unassigned', '${COMPANY_A}', 'Unassigned template', '2026-10-12', 1,
           '[[true,false,false,false,false,false,false]]', 8, '[]')
      `);
      const { rows } = await db.query(`
        SELECT technician_ids FROM public.expected_work_rosters WHERE id = 'roster-unassigned'
      `);
      assert.deepEqual(rows, [{ technician_ids: [] }]);
      await assert.rejects(() => db.query(`
        INSERT INTO public.expected_work_rosters
          (id, company_id, name, start_date, repeat_every_weeks, week_patterns, shift_hours, technician_ids)
        VALUES
          ('roster-invalid-tech-ids', '${COMPANY_A}', 'Invalid staff list', '2026-10-12', 1,
           '[[true,false,false,false,false,false,false]]', 8, '"tech-a"')
      `), /check constraint/i);
    });
  });
});
