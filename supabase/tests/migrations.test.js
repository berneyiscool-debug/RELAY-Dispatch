/**
 * Executes the Supabase hardening migrations against a real Postgres engine.
 *
 * PGlite is Postgres compiled to WebAssembly, so the actual .sql files in
 * supabase/migrations are run for real - no server, no Docker, no network - on
 * a synthetic schema that mirrors the shape of the live project: the anon /
 * authenticated / service_role roles, an auth schema with an auth.uid() that
 * reads the request JWT claims, tenant tables keyed by company_id, Supabase's
 * default table grants, and BYPASSRLS on service_role.
 *
 * What this catches: a migration that parses fine but aborts halfway through
 * (silently skipping every statement after the failure), a policy that leaves a
 * table readable by the anon key that ships inside the app bundle, and a tenant
 * policy that lets one company read or write another company's rows.
 *
 * Run with: npm run test:migrations
 */
import { describe, test, before, after } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';

const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations');
const CATCHUP_SQL = readFileSync(join(MIGRATIONS_DIR, '029_schema_catchup.sql'), 'utf8');
const HARDENING_SQL = readFileSync(join(MIGRATIONS_DIR, '030_rls_hardening.sql'), 'utf8');

const TENANT_A = '00000000-0000-0000-0000-00000000000a';
const TENANT_B = '00000000-0000-0000-0000-00000000000b';
const ADMIN_A = '11111111-1111-1111-1111-111111111111';
const ADMIN_B = '22222222-2222-2222-2222-222222222222';
const TECH_A = '33333333-3333-3333-3333-333333333333';

const TENANT_TABLES = [
  'jobs', 'customers', 'invoices', 'timesheets', 'schedule', 'form_templates',
  'user_types', 'contractor_profile', 'quotes', 'materials', 'documents',
];

// Live job_materials.company_id is text, not uuid, so it exercises the
// type-aware branch of the tenant policy loop.
const TEXT_TENANT_TABLES = ['job_materials'];

const TENANT_HELPER = `
CREATE OR REPLACE FUNCTION public.get_user_company_id(uid uuid)
RETURNS uuid LANGUAGE sql SECURITY DEFINER STABLE AS $f$
  SELECT company_id FROM public.profiles WHERE id = uid
$f$;`;

const FIXTURE = `
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE SCHEMA auth;
CREATE TABLE auth.users (id uuid PRIMARY KEY, email text, raw_user_meta_data jsonb, raw_app_meta_data jsonb);
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $fn$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid
$fn$;

CREATE TABLE public.companies (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text, settings jsonb);
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id),
  name text, email text, username text, phone text, role text,
  user_type_id text, pay_rate numeric, deactivated boolean DEFAULT false, deactivated_at timestamptz
);
CREATE TABLE public.system_locks (lock_name text PRIMARY KEY, locked_at timestamptz, locked_by text, expires_at timestamptz);
CREATE TABLE public.relay_reserved_email_slugs (slug text PRIMARY KEY);
CREATE TABLE public.leads (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid REFERENCES public.companies(id), message text);
CREATE TABLE public.notifications (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid REFERENCES public.companies(id), title text, message text);
${TENANT_TABLES.map((t) => `CREATE TABLE public.${t} (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid REFERENCES public.companies(id), label text);`).join('\n')}
CREATE TABLE public.job_materials (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id text, label text);

GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- The unhardened production state: permissive policies, including ones granted
-- to anon, which is the key published in the browser bundle.
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY jobs_everyone ON public.jobs FOR ALL TO anon USING (true) WITH CHECK (true);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_public_read ON public.profiles FOR SELECT TO anon USING (true);
ALTER TABLE public.system_locks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow write access to all authenticated users on system_locks" ON public.system_locks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow read access to all authenticated users on system_locks" ON public.system_locks FOR SELECT TO authenticated USING (true);

INSERT INTO public.companies (id, name, settings) VALUES
  ('${TENANT_A}', 'Tenant A', '{"markupPercent": 20}'),
  ('${TENANT_B}', 'Tenant B', '{"markupPercent": 20}');
INSERT INTO public.profiles (id, company_id, name, email, role) VALUES
  ('${ADMIN_A}', '${TENANT_A}', 'Admin A', 'a@a.test', 'admin'),
  ('${ADMIN_B}', '${TENANT_B}', 'Admin B', 'b@b.test', 'admin'),
  ('${TECH_A}', '${TENANT_A}', 'Tech A', 't@a.test', 'technician');
INSERT INTO public.jobs (company_id, label) VALUES ('${TENANT_A}', 'A job'), ('${TENANT_B}', 'B job');
INSERT INTO public.job_materials (company_id, label) VALUES ('${TENANT_A}', 'A material'), ('${TENANT_B}', 'B material');
INSERT INTO public.leads (company_id, message) VALUES ('${TENANT_B}', 'B lead');
INSERT INTO public.notifications (company_id, title, message) VALUES ('${TENANT_B}', 'B only', 'B secret');
`;

async function createFixtureDb() {
  const db = new PGlite();
  await db.exec(FIXTURE);
  return db;
}

async function value(db, sql) {
  const { rows } = await db.query(sql);
  return Object.values(rows[0])[0];
}

const one = (db, sql) => db.query(sql).then((r) => r.rows[0]);

/** Runs `fn` as a Postgres role with auth.uid() resolving to `uid`. */
async function asRole(db, role, uid, fn) {
  await db.exec(`RESET ROLE; SELECT set_config('request.jwt.claim.sub', '${uid || ''}', false);`);
  await db.exec(`SET ROLE ${role};`);
  try {
    return await fn();
  } finally {
    await db.exec("RESET ROLE; SELECT set_config('request.jwt.claim.sub', '', false);");
  }
}

describe('029 schema catch-up', () => {
  let db;

  before(async () => {
    db = await createFixtureDb();
    await db.exec('DROP FUNCTION IF EXISTS public.get_user_company_id(uuid);');
    await db.exec(CATCHUP_SQL);
  });

  after(async () => {
    await db.close();
  });

  test('adds the table and columns the live project is missing', async () => {
    assert.strictEqual(
      await value(db, "SELECT to_regclass('public.password_reset_requests') IS NOT NULL"),
      true
    );
    assert.strictEqual(
      await value(db, "SELECT count(*)::int FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'dashboard_layout'"),
      1
    );
    assert.strictEqual(
      await value(db, "SELECT count(*)::int FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name IN ('maintenance_plan_id', 'merged_plan_ids', 'task_template_id', 'merged_task_template_ids', 'quote_id', 'target_service_date', 'current_meter_at_trigger', 'merged_materials_list', 'total_labor_hrs', 'total_labor_cost', 'total_material_cost', 'created_by')"),
      12
    );
    assert.strictEqual(
      await value(db, "SELECT count(*)::int FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'leads' AND column_name IN ('budget', 'requirements', 'origin')"),
      3
    );
  });

  test('does not create dead schema (llm_usage stays uncreated)', async () => {
    assert.strictEqual(await value(db, "SELECT to_regclass('public.llm_usage') IS NULL"), true);
  });

  test('makes no column nullable that was not already', async () => {
    assert.strictEqual(
      await value(db, "SELECT is_nullable FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'message'"),
      'YES'
    );
  });

  test('finishes even when the tenant helper it references is missing', async () => {
    // The guarded policy body calls get_user_company_id(). If the guard only
    // checked for an existing policy, this CREATE would fail and take every
    // statement after it with it - a catch-up that silently does nothing.
    assert.strictEqual(await value(db, "SELECT to_regprocedure('public.get_user_company_id(uuid)') IS NULL"), true);
    assert.strictEqual(await value(db, "SELECT count(*)::int FROM pg_policies WHERE schemaname = 'public' AND tablename = 'password_reset_requests'"), 0);
    assert.strictEqual(
      await value(db, "SELECT relrowsecurity FROM pg_class WHERE relname = 'password_reset_requests'"),
      true
    );
  });

  test('reports every expected object present in its verification grid', async () => {
    const results = await db.exec(CATCHUP_SQL);
    const grid = results[results.length - 1].rows;
    assert.strictEqual(grid.length, 17);
    assert.deepStrictEqual(grid.filter((r) => r.is_present !== true).map((r) => r.object_name), []);
  });

  test('creates the tenant policy once the helper exists, and is re-runnable', async () => {
    await db.exec(TENANT_HELPER);
    await db.exec(CATCHUP_SQL);
    assert.strictEqual(await value(db, "SELECT count(*)::int FROM pg_policies WHERE schemaname = 'public' AND tablename = 'password_reset_requests'"), 1);
    await db.exec(CATCHUP_SQL);
    assert.strictEqual(await value(db, "SELECT count(*)::int FROM pg_policies WHERE schemaname = 'public' AND tablename = 'password_reset_requests'"), 1);
  });

  test('never touches existing rows', async () => {
    assert.strictEqual(await value(db, 'SELECT count(*)::int FROM public.jobs'), 2);
    assert.strictEqual(await value(db, 'SELECT count(*)::int FROM public.profiles'), 3);
    assert.strictEqual(await value(db, "SELECT count(*)::int FROM public.companies WHERE settings->>'markupPercent' = '20'"), 2);
  });
});

describe('030 RLS hardening', () => {
  let db;
  let audit;

  before(async () => {
    db = await createFixtureDb();
    await db.exec(TENANT_HELPER);
    await db.exec(CATCHUP_SQL);
    const results = await db.exec(HARDENING_SQL);
    audit = results[results.length - 1].rows;
  });

  after(async () => {
    await db.close();
  });

  test('the audit grid reports no failures', () => {
    assert.ok(audit.length >= 17, `expected an audit row per public table, got ${audit.length}`);
    assert.deepStrictEqual(audit.filter((r) => /FAIL/.test(r.verdict)).map((r) => `${r.table_name}: ${r.verdict}`), []);
  });

  test('row level security is on for every table', () => {
    assert.deepStrictEqual(audit.filter((r) => r.rls_on !== true).map((r) => r.table_name), []);
  });

  test('no policy is open to a signed-out client', () => {
    assert.deepStrictEqual(audit.filter((r) => r.anon_policies !== 0).map((r) => r.table_name), []);
  });

  test('every table keyed by company_id has a tenant policy', async () => {
    const { rows } = await db.query(`
      SELECT col.table_name,
             (SELECT count(*)::int FROM pg_policies p
               WHERE p.schemaname = 'public' AND p.tablename = col.table_name) AS policies
      FROM information_schema.columns col
      JOIN pg_class c ON c.relname = col.table_name
      JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = col.table_schema
      WHERE col.table_schema = 'public' AND col.column_name = 'company_id' AND c.relkind IN ('r', 'p')
      GROUP BY col.table_name
      ORDER BY col.table_name`);
    const names = rows.map((r) => r.table_name);
    for (const table of TENANT_TABLES) {
      assert.ok(names.includes(table), `${table} is not keyed by company_id in the fixture`);
    }
    // profiles and companies are handled by bespoke policies, everything else
    // (including tables added later) comes from the catalog-driven loop.
    assert.ok(rows.length >= TENANT_TABLES.length + 3, `expected tenant-keyed tables, got ${names.join(', ')}`);
    assert.deepStrictEqual(rows.filter((r) => r.policies === 0).map((r) => r.table_name), []);
  });

  test('a text-typed company_id column still gets an enforcing tenant policy', async () => {
    // job_materials.company_id is text live, not uuid. A policy that compares it
    // straight to the uuid helper has no operator to call and aborts the whole
    // hardening script, so this table is the canary for that regression.
    assert.strictEqual(await value(db, "SELECT count(*)::int FROM pg_policies WHERE schemaname = 'public' AND tablename = 'job_materials' AND policyname = 'job_materials_tenant_policy'"), 1);

    await asRole(db, 'authenticated', ADMIN_A, async () => {
      assert.strictEqual(await value(db, 'SELECT count(*)::int FROM public.job_materials'), 1);
      assert.strictEqual(await value(db, `SELECT count(*)::int FROM public.job_materials WHERE company_id = '${TENANT_B}'`), 0);
    });

    await asRole(db, 'authenticated', ADMIN_B, async () => {
      assert.strictEqual(await value(db, 'SELECT count(*)::int FROM public.job_materials'), 1);
      assert.strictEqual(await value(db, `SELECT count(*)::int FROM public.job_materials WHERE company_id = '${TENANT_A}'`), 0);
    });

    await asRole(db, 'anon', null, async () => {
      assert.strictEqual(await value(db, 'SELECT count(*)::int FROM public.job_materials'), 0);
    });
  });

  test('tables only an edge function may touch are locked to the service role', () => {
    assert.strictEqual(audit.find((r) => r.table_name === 'relay_reserved_email_slugs').verdict, 'LOCKED (service role only)');
  });

  test('the legacy permissive policies are gone', async () => {
    assert.strictEqual(await value(db, "SELECT count(*)::int FROM pg_policies WHERE schemaname = 'public' AND tablename = 'jobs'"), 1);
    assert.strictEqual(await value(db, "SELECT count(*)::int FROM pg_policies WHERE policyname LIKE 'Allow write access%'"), 0);
    assert.strictEqual(await value(db, "SELECT count(*)::int FROM pg_policies WHERE policyname LIKE 'Allow read access to all authenticated users on system_locks'"), 1);
  });

  test('is idempotent - a second run produces the same grid', async () => {
    const results = await db.exec(HARDENING_SQL);
    const rerun = results[results.length - 1].rows;
    assert.deepStrictEqual(rerun.map((r) => r.verdict), audit.map((r) => r.verdict));
  });

  test('a signed-out client reads nothing and cannot write or escalate', async () => {
    await asRole(db, 'anon', null, async () => {
      for (const table of ['jobs', 'profiles', 'notifications', 'leads', 'companies', 'system_locks']) {
        assert.strictEqual(await value(db, `SELECT count(*)::int FROM public.${table}`), 0, `anon could read ${table}`);
      }
      await assert.rejects(
        () => db.query(`INSERT INTO public.jobs (company_id, label) VALUES ('${TENANT_A}', 'anon job')`),
        /row-level security/
      );
      await assert.rejects(() => db.query(`SELECT public.get_user_company_id('${ADMIN_A}')`), /permission denied/);
      await assert.rejects(() => db.query(`SELECT public.create_company_and_admin('${ADMIN_A}', 'Anon Co', 'Mallory', '0400000000')`), /permission denied/);
    });
  });

  test('a tenant sees only its own rows', async () => {
    await asRole(db, 'authenticated', ADMIN_A, async () => {
      assert.strictEqual(await value(db, 'SELECT count(*)::int FROM public.jobs'), 1);
      assert.strictEqual(await value(db, 'SELECT count(*)::int FROM public.profiles'), 2);
      assert.strictEqual(await value(db, 'SELECT count(*)::int FROM public.notifications'), 0);
      assert.strictEqual(await value(db, 'SELECT count(*)::int FROM public.leads'), 0);
      assert.strictEqual(await value(db, 'SELECT count(*)::int FROM public.companies'), 1);
      assert.strictEqual(await value(db, 'SELECT public.get_user_company_id(auth.uid())'), TENANT_A);
    });
  });

  test('a tenant cannot insert or re-point rows at another tenant', async () => {
    await asRole(db, 'authenticated', ADMIN_A, async () => {
      await assert.rejects(
        () => db.query(`INSERT INTO public.jobs (company_id, label) VALUES ('${TENANT_B}', 'sneaky')`),
        /row-level security/
      );
      await assert.rejects(
        () => db.query(`UPDATE public.jobs SET company_id = '${TENANT_B}'`),
        /row-level security/
      );
      assert.strictEqual(await value(db, `SELECT count(*)::int FROM public.jobs WHERE company_id = '${TENANT_B}'`), 0);
    });
  });

  test('the profile guard freezes server-managed columns', async () => {
    await asRole(db, 'authenticated', TECH_A, async () => {
      await db.query(`UPDATE public.profiles SET role = 'admin', pay_rate = 999, company_id = '${TENANT_B}' WHERE id = '${TECH_A}'`);
      const after = await one(db, `SELECT role, pay_rate, company_id FROM public.profiles WHERE id = '${TECH_A}'`);
      assert.strictEqual(after.role, 'technician');
      assert.strictEqual(after.pay_rate, null);
      assert.strictEqual(after.company_id, TENANT_A);

      await db.query(`UPDATE public.profiles SET name = 'Tech A Renamed' WHERE id = '${TECH_A}'`);
      assert.strictEqual(await value(db, `SELECT name FROM public.profiles WHERE id = '${TECH_A}'`), 'Tech A Renamed');
    });
  });

  test('a client session cannot create another tenant or delete a profile', async () => {
    await asRole(db, 'authenticated', ADMIN_A, async () => {
      await assert.rejects(
        () => db.query(`INSERT INTO public.profiles (id, company_id, name, role) VALUES ('99999999-9999-9999-9999-999999999999', '${TENANT_A}', 'Mallory', 'admin')`),
        /only be created through signup|row-level security/
      );
      await assert.rejects(
        () => db.query(`SELECT public.create_company_and_admin('${ADMIN_B}', 'Evil Co', 'Mallory', '0400000000')`),
        /only provision your own company/
      );
      // No DELETE policy exists, so the delete is a silent no-op, not an error.
      const deleted = await db.query(`DELETE FROM public.profiles WHERE id = '${TECH_A}'`);
      assert.strictEqual(deleted.affectedRows, 0);
      assert.strictEqual(await value(db, 'SELECT count(*)::int FROM public.profiles'), 2);
    });
  });

  test('the lock RPCs still work for a signed-in user', async () => {
    await asRole(db, 'authenticated', ADMIN_A, async () => {
      assert.strictEqual(await value(db, `SELECT public.acquire_lock('timesheet_sync', '${ADMIN_A}', 60)`), true);
      assert.strictEqual(await value(db, "SELECT count(*)::int FROM public.system_locks"), 1);
      await db.exec(`SELECT public.release_lock('timesheet_sync', '${ADMIN_A}')`);
      assert.strictEqual(await value(db, "SELECT locked_by FROM public.system_locks WHERE lock_name = 'timesheet_sync'"), null);
    });
  });

  test('the service role keeps full access for the edge functions', async () => {
    await asRole(db, 'service_role', null, async () => {
      assert.strictEqual(await value(db, 'SELECT count(*)::int FROM public.profiles'), 3);
      assert.strictEqual(await value(db, 'SELECT count(*)::int FROM public.jobs'), 2);
      assert.strictEqual(await value(db, 'SELECT count(*)::int FROM public.notifications'), 1);
    });
  });
});
