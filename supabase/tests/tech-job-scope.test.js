/**
 * Runs 20261030090000_tech_job_scope.sql against PGlite on a fixture shaped
 * like the live project: company-wide permissive *_tenant_policy rows on every
 * table, Supabase's default grants, and text technician_id columns holding
 * profile ids.
 *
 * What this pins: office users (admin, manager) keep exactly the access they
 * had; everyone else - technicians, unknown roles, deactivated admins - is
 * limited to their assigned jobs, their own schedule and time, and the
 * customer search function; and the company boundary still holds for all.
 *
 * Run with: npm run test:migrations
 */
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';

const MIGRATION = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations', '20261030090000_tech_job_scope.sql'),
  'utf8'
);

const COMPANY_A = '00000000-0000-0000-0000-00000000000a';
const COMPANY_B = '00000000-0000-0000-0000-00000000000b';
const ADMIN_A = '11111111-1111-1111-1111-111111111111';
const ADMIN_B = '22222222-2222-2222-2222-222222222222';
const TECH_A = '33333333-3333-3333-3333-333333333333';
const TECH_A2 = '44444444-4444-4444-4444-444444444444';
const MANAGER_A = '55555555-5555-5555-5555-555555555555';
const ODD_ROLE_A = '66666666-6666-6666-6666-666666666666';
const RETIRED_ADMIN_A = '77777777-7777-7777-7777-777777777777';

const TENANT_TABLES = [
  'jobs', 'schedule', 'time_clocks', 'timesheets', 'customers', 'invoices',
  'user_types', 'activity_log',
];

let db;

async function asUser(userId, callback) {
  await db.exec(`RESET ROLE; SELECT set_config('request.jwt.claim.sub', '${userId}', false); SET ROLE authenticated;`);
  try {
    return await callback();
  } finally {
    await db.exec("RESET ROLE; SELECT set_config('request.jwt.claim.sub', '', false);");
  }
}

async function ids(sql) {
  const { rows } = await db.query(sql);
  return rows.map(r => r.id).sort();
}

describe('tech job scope migration', () => {
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
        name text, role text NOT NULL DEFAULT 'technician', deactivated boolean DEFAULT false,
        pay_rate numeric DEFAULT 0
      );
      CREATE OR REPLACE FUNCTION public.get_user_company_id(uid uuid)
        RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
          SELECT company_id FROM public.profiles WHERE id = uid
        $fn$;

      CREATE TABLE public.jobs (id text PRIMARY KEY, company_id uuid NOT NULL, technician_id text, status text);
      CREATE TABLE public.schedule (id text PRIMARY KEY, company_id uuid NOT NULL, technician_id text, status text);
      CREATE TABLE public.time_clocks (
        id text PRIMARY KEY, company_id uuid NOT NULL, technician_id text, status text,
        approval_status text DEFAULT 'pending', approved_hours numeric, approved_by text,
        approved_at timestamptz, note text
      );
      CREATE TABLE public.timesheets (
        id text PRIMARY KEY, company_id uuid NOT NULL, technician_id text,
        duration_hours numeric, status text, approved_by text
      );
      CREATE TABLE public.customers (
        id text PRIMARY KEY, company_id uuid NOT NULL, company text, first_name text, last_name text,
        email text, phone text, address text, sites jsonb, portal_token text, portal_passcode text,
        xero_contact_id text
      );
      CREATE TABLE public.invoices (id text PRIMARY KEY, company_id uuid NOT NULL, total numeric);
      CREATE TABLE public.user_types (id text PRIMARY KEY, company_id uuid NOT NULL);
      CREATE TABLE public.activity_log (id text PRIMARY KEY, company_id uuid NOT NULL, text text);
      -- Live job_materials.company_id is text, not uuid.
      CREATE TABLE public.job_materials (id text PRIMARY KEY, company_id text NOT NULL, job_id text, unit_cost numeric);

      -- The live permissive policies, exactly as they read today.
      DO $do$
      DECLARE t text;
      BEGIN
        FOREACH t IN ARRAY ARRAY[${TENANT_TABLES.map(t => `'${t}'`).join(', ')}] LOOP
          EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
          EXECUTE format(
            'CREATE POLICY %I ON public.%I FOR ALL TO authenticated '
            'USING (company_id = public.get_user_company_id(auth.uid())) '
            'WITH CHECK (company_id = public.get_user_company_id(auth.uid()))',
            t || '_tenant_policy', t);
        END LOOP;
      END $do$;
      ALTER TABLE public.job_materials ENABLE ROW LEVEL SECURITY;
      CREATE POLICY job_materials_tenant_policy ON public.job_materials FOR ALL TO authenticated
        USING (company_id = (public.get_user_company_id(auth.uid()))::text)
        WITH CHECK (company_id = (public.get_user_company_id(auth.uid()))::text);
      ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
      CREATE POLICY companies_tenant_policy ON public.companies FOR ALL TO authenticated
        USING (id = public.get_user_company_id(auth.uid()))
        WITH CHECK (id = public.get_user_company_id(auth.uid()));
      ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
      CREATE POLICY profile_select_own ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
      CREATE POLICY profile_select_tenant ON public.profiles FOR SELECT TO authenticated
        USING (company_id = public.get_user_company_id(auth.uid()));
      CREATE POLICY profile_update_own ON public.profiles FOR UPDATE TO authenticated
        USING (id = auth.uid()) WITH CHECK (id = auth.uid());
      REVOKE ALL ON public.activity_log FROM anon, authenticated;
      GRANT SELECT, INSERT ON public.activity_log TO authenticated;

      INSERT INTO public.companies (id, name) VALUES ('${COMPANY_A}', 'Harbourline'), ('${COMPANY_B}', 'Other Co');
      INSERT INTO public.profiles (id, company_id, name, role, deactivated, pay_rate) VALUES
        ('${ADMIN_A}', '${COMPANY_A}', 'Admin A', 'admin', false, 90),
        ('${MANAGER_A}', '${COMPANY_A}', 'Manager A', 'manager', false, 80),
        ('${TECH_A}', '${COMPANY_A}', 'Tech A', 'technician', false, 45),
        ('${TECH_A2}', '${COMPANY_A}', 'Tech A2', 'technician', false, 44),
        ('${ODD_ROLE_A}', '${COMPANY_A}', 'Odd Role', 'Teacher', false, 40),
        ('${RETIRED_ADMIN_A}', '${COMPANY_A}', 'Retired Admin', 'admin', true, 0),
        ('${ADMIN_B}', '${COMPANY_B}', 'Admin B', 'admin', false, 90);
      INSERT INTO public.jobs (id, company_id, technician_id, status) VALUES
        ('job-tech', '${COMPANY_A}', '${TECH_A}', 'Scheduled'),
        ('job-other-tech', '${COMPANY_A}', '${TECH_A2}', 'Scheduled'),
        ('job-unassigned', '${COMPANY_A}', NULL, 'New'),
        ('job-odd', '${COMPANY_A}', '${ODD_ROLE_A}', 'Scheduled'),
        ('job-b', '${COMPANY_B}', NULL, 'New');
      INSERT INTO public.schedule (id, company_id, technician_id) VALUES
        ('sch-tech', '${COMPANY_A}', '${TECH_A}'), ('sch-other', '${COMPANY_A}', '${TECH_A2}');
      INSERT INTO public.time_clocks (id, company_id, technician_id, status) VALUES
        ('tc-tech', '${COMPANY_A}', '${TECH_A}', 'out'), ('tc-other', '${COMPANY_A}', '${TECH_A2}', 'out');
      INSERT INTO public.timesheets (id, company_id, technician_id, duration_hours, status) VALUES
        ('ts-tech', '${COMPANY_A}', '${TECH_A}', 3, 'pending');
      INSERT INTO public.customers (id, company_id, company, first_name, last_name, phone, address, sites, portal_token, portal_passcode) VALUES
        ('cus-1', '${COMPANY_A}', 'Louise Petrakis Pty Ltd', 'Louise', 'Petrakis', '0400 000 001', '12 Bay St, Coogee',
          '[{"name":"Rear unit","address":"12A Bay St","notes":"Gate code 4821"}]', 'secret-token-1', '9999'),
        ('cus-2', '${COMPANY_A}', '', 'Sam', '100% Electrical', '0400 000 002', '3 High St', NULL, 'secret-token-2', '8888'),
        ('cus-b', '${COMPANY_B}', 'Petrakis Other Co', 'Louise', 'Petrakis', NULL, NULL, NULL, 'secret-token-b', '7777');
      INSERT INTO public.invoices (id, company_id, total) VALUES ('inv-1', '${COMPANY_A}', 1260);
      INSERT INTO public.user_types (id, company_id) VALUES ('ut-1', '${COMPANY_A}');
      INSERT INTO public.activity_log (id, company_id, text) VALUES ('act-1', '${COMPANY_A}', 'Invoice INV-1 sent');
      INSERT INTO public.job_materials (id, company_id, job_id, unit_cost) VALUES ('mat-1', '${COMPANY_A}', 'job-tech', 42);
    `);
    // Twice: re-running on a project where it has already landed must not abort.
    await db.exec(MIGRATION);
    await db.exec(MIGRATION);
  });

  after(async () => {
    await db.close();
  });

  test('office users keep company-wide access', async () => {
    for (const office of [ADMIN_A, MANAGER_A]) {
      await asUser(office, async () => {
        assert.deepEqual(await ids('SELECT id FROM public.jobs'),
          ['job-odd', 'job-other-tech', 'job-tech', 'job-unassigned']);
        assert.deepEqual(await ids('SELECT id FROM public.invoices'), ['inv-1']);
        assert.deepEqual(await ids('SELECT id FROM public.customers'), ['cus-1', 'cus-2']);
        assert.deepEqual(await ids('SELECT id FROM public.job_materials'), ['mat-1']);
        assert.equal((await ids('SELECT id FROM public.profiles')).length, 6);
        assert.deepEqual(await ids('SELECT id FROM public.activity_log'), ['act-1']);
      });
    }
    await asUser(MANAGER_A, async () => {
      await db.query(`INSERT INTO public.jobs (id, company_id, technician_id) VALUES ('job-new', '${COMPANY_A}', '${TECH_A2}')`);
      await db.query(`UPDATE public.schedule SET technician_id = '${TECH_A2}' WHERE id = 'sch-tech'`);
      await db.query(`UPDATE public.schedule SET technician_id = '${TECH_A}' WHERE id = 'sch-tech'`);
      await db.query(`DELETE FROM public.jobs WHERE id = 'job-new'`);
    });
  });

  test('a technician sees only their assigned jobs and schedule', async () => {
    await asUser(TECH_A, async () => {
      assert.deepEqual(await ids('SELECT id FROM public.jobs'), ['job-tech']);
      assert.deepEqual(await ids('SELECT id FROM public.schedule'), ['sch-tech']);
      assert.deepEqual(await ids('SELECT id FROM public.time_clocks'), ['tc-tech']);
      assert.deepEqual(await ids('SELECT id FROM public.timesheets'), ['ts-tech']);
    });
  });

  test('money, customers and audit history are hidden from technicians', async () => {
    await asUser(TECH_A, async () => {
      assert.deepEqual(await ids('SELECT id FROM public.invoices'), []);
      assert.deepEqual(await ids('SELECT id FROM public.customers'), []);
      assert.deepEqual(await ids('SELECT id FROM public.job_materials'), []);
      assert.deepEqual(await ids('SELECT id FROM public.activity_log'), []);
      await assert.rejects(
        () => db.query(`INSERT INTO public.invoices (id, company_id, total) VALUES ('inv-forged', '${COMPANY_A}', 1)`),
        /row-level security/i
      );
    });
  });

  test('a technician sees their own profile and no one else’s pay rate', async () => {
    await asUser(TECH_A, async () => {
      const { rows } = await db.query('SELECT id, pay_rate FROM public.profiles');
      assert.deepEqual(rows.map(r => r.id), [TECH_A]);
    });
  });

  test('a technician can update their own job but not reassign or touch others', async () => {
    await asUser(TECH_A, async () => {
      await db.query(`UPDATE public.jobs SET status = 'In Progress' WHERE id = 'job-tech'`);
      const other = await db.query(`UPDATE public.jobs SET status = 'Hijacked' WHERE id = 'job-other-tech'`);
      assert.equal(other.affectedRows, 0);
      await assert.rejects(
        () => db.query(`UPDATE public.jobs SET technician_id = '${TECH_A2}' WHERE id = 'job-tech'`),
        /row-level security/i
      );
      await assert.rejects(
        () => db.query(`INSERT INTO public.jobs (id, company_id, technician_id) VALUES ('job-self', '${COMPANY_A}', '${TECH_A}')`),
        /row-level security/i
      );
      const deleted = await db.query(`DELETE FROM public.jobs WHERE id = 'job-tech'`);
      assert.equal(deleted.affectedRows, 0);
    });
    const { rows } = await db.query(`SELECT id, status FROM public.jobs WHERE id IN ('job-tech', 'job-other-tech') ORDER BY id`);
    assert.deepEqual(rows, [
      { id: 'job-other-tech', status: 'Scheduled' },
      { id: 'job-tech', status: 'In Progress' },
    ]);
  });

  test('a technician can read but not change the schedule', async () => {
    await asUser(TECH_A, async () => {
      const moved = await db.query(`UPDATE public.schedule SET status = 'Approved' WHERE id = 'sch-tech'`);
      assert.equal(moved.affectedRows, 0);
      await assert.rejects(
        () => db.query(`INSERT INTO public.schedule (id, company_id, technician_id) VALUES ('sch-self', '${COMPANY_A}', '${TECH_A}')`),
        /row-level security/i
      );
    });
  });

  test('unknown roles and deactivated admins get the technician scope', async () => {
    await asUser(ODD_ROLE_A, async () => {
      assert.deepEqual(await ids('SELECT id FROM public.jobs'), ['job-odd']);
      assert.deepEqual(await ids('SELECT id FROM public.invoices'), []);
    });
    await asUser(RETIRED_ADMIN_A, async () => {
      assert.deepEqual(await ids('SELECT id FROM public.jobs'), []);
      assert.deepEqual(await ids('SELECT id FROM public.customers'), []);
    });
  });

  test('a technician records their own time but cannot approve it', async () => {
    await asUser(TECH_A, async () => {
      await db.query(`
        INSERT INTO public.time_clocks (id, company_id, technician_id, status, approval_status, approved_hours, approved_by)
        VALUES ('tc-new', '${COMPANY_A}', '${TECH_A}', 'in', 'approved', 12, 'me')
      `);
      await db.query(`UPDATE public.time_clocks SET status = 'out', approval_status = 'approved', approved_hours = 10 WHERE id = 'tc-tech'`);
      await db.query(`INSERT INTO public.timesheets (id, company_id, technician_id, duration_hours, status, approved_by)
        VALUES ('ts-new', '${COMPANY_A}', '${TECH_A}', 2, 'Approved', 'me')`);
      await db.query(`UPDATE public.timesheets SET duration_hours = 4, status = 'approved', approved_by = 'me' WHERE id = 'ts-tech'`);
      await assert.rejects(
        () => db.query(`INSERT INTO public.time_clocks (id, company_id, technician_id) VALUES ('tc-forged', '${COMPANY_A}', '${TECH_A2}')`),
        /row-level security/i
      );
      const deleted = await db.query(`DELETE FROM public.time_clocks WHERE id = 'tc-tech'`);
      assert.equal(deleted.affectedRows, 0);
    });

    const { rows: clocks } = await db.query(`
      SELECT id, status, approval_status, approved_hours, approved_by FROM public.time_clocks
       WHERE id IN ('tc-new', 'tc-tech') ORDER BY id`);
    assert.deepEqual(clocks, [
      { id: 'tc-new', status: 'in', approval_status: 'pending', approved_hours: null, approved_by: null },
      { id: 'tc-tech', status: 'out', approval_status: 'pending', approved_hours: null, approved_by: null },
    ]);
    const { rows: sheets } = await db.query(`
      SELECT id, duration_hours::int AS hours, status, approved_by FROM public.timesheets ORDER BY id`);
    assert.deepEqual(sheets, [
      { id: 'ts-new', hours: 2, status: null, approved_by: null },
      { id: 'ts-tech', hours: 4, status: 'pending', approved_by: null },
    ]);

    await asUser(MANAGER_A, async () => {
      await db.query(`UPDATE public.time_clocks SET approval_status = 'approved', approved_by = 'Manager A' WHERE id = 'tc-tech'`);
    });
    const { rows: approved } = await db.query(`SELECT approval_status, approved_by FROM public.time_clocks WHERE id = 'tc-tech'`);
    assert.deepEqual(approved, [{ approval_status: 'approved', approved_by: 'Manager A' }]);
  });

  test('a technician can add to the activity log and read their company name', async () => {
    await asUser(TECH_A, async () => {
      await db.query(`INSERT INTO public.activity_log (id, company_id, text) VALUES ('act-tech', '${COMPANY_A}', 'Job started')`);
      const { rows } = await db.query('SELECT name FROM public.companies');
      assert.deepEqual(rows, [{ name: 'Harbourline' }]);
      const renamed = await db.query(`UPDATE public.companies SET name = 'Tech Co' WHERE id = '${COMPANY_A}'`);
      assert.equal(renamed.affectedRows, 0);
      assert.equal((await ids('SELECT id FROM public.user_types')).length, 1);
      const changed = await db.query(`UPDATE public.user_types SET id = 'ut-x' WHERE id = 'ut-1'`);
      assert.equal(changed.affectedRows, 0);
    });
  });

  test('customer search returns contact and site details, never portal secrets', async () => {
    await asUser(TECH_A, async () => {
      const { rows } = await db.query(`SELECT * FROM public.search_customers_for_tech('petrakis')`);
      assert.deepEqual(rows.map(r => r.id), ['cus-1']);
      assert.deepEqual(Object.keys(rows[0]).sort(),
        ['address', 'company', 'email', 'first_name', 'id', 'last_name', 'phone', 'sites']);
      assert.equal(rows[0].sites[0].notes, 'Gate code 4821');

      const bySite = await db.query(`SELECT id FROM public.search_customers_for_tech('12A Bay')`);
      assert.deepEqual(bySite.rows.map(r => r.id), ['cus-1']);

      // A bare "%" must not match everything.
      const wildcard = await db.query(`SELECT id FROM public.search_customers_for_tech('%%')`);
      assert.deepEqual(wildcard.rows, []);
      const literal = await db.query(`SELECT id FROM public.search_customers_for_tech('100%')`);
      assert.deepEqual(literal.rows.map(r => r.id), ['cus-2']);

      const short = await db.query(`SELECT id FROM public.search_customers_for_tech('p')`);
      assert.deepEqual(short.rows, []);
    });
    await asUser(RETIRED_ADMIN_A, async () => {
      const { rows } = await db.query(`SELECT id FROM public.search_customers_for_tech('petrakis')`);
      assert.deepEqual(rows, []);
    });
  });

  test('customer search is not callable with the anon key', async () => {
    await db.exec('SET ROLE anon;');
    try {
      await assert.rejects(
        () => db.query(`SELECT * FROM public.search_customers_for_tech('petrakis')`),
        /permission denied/i
      );
    } finally {
      await db.exec('RESET ROLE;');
    }
  });

  test('the company boundary still holds for office users', async () => {
    await asUser(ADMIN_B, async () => {
      assert.deepEqual(await ids('SELECT id FROM public.jobs'), ['job-b']);
      assert.deepEqual(await ids('SELECT id FROM public.customers'), ['cus-b']);
      const { rows } = await db.query(`SELECT id FROM public.search_customers_for_tech('petrakis')`);
      assert.deepEqual(rows.map(r => r.id), ['cus-b']);
    });
  });
});
