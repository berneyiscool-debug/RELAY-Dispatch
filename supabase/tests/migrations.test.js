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
const SPEND_SQL = readFileSync(join(MIGRATIONS_DIR, '031_spend_and_signup_hardening.sql'), 'utf8');
const PASSCODE_SQL = readFileSync(join(MIGRATIONS_DIR, '032_portal_passcode.sql'), 'utf8');
const ORIGIN_SQL = readFileSync(join(MIGRATIONS_DIR, '033_notifications_origin.sql'), 'utf8');
const BACKFILL_ORIGIN_SQL = readFileSync(
  join(MIGRATIONS_DIR, '035_notifications_origin_backfill.sql'),
  'utf8'
);
const POOLED_SQL = readFileSync(join(MIGRATIONS_DIR, '034_ai_pooled_caps.sql'), 'utf8');
const NAME_SQL = readFileSync(join(MIGRATIONS_DIR, '036_company_name_uniqueness.sql'), 'utf8');
const IDENTITY_SQL = readFileSync(join(MIGRATIONS_DIR, '038_profiles_identity_validation.sql'), 'utf8');
const UPDATE_SCOPE_SQL = readFileSync(join(MIGRATIONS_DIR, '039_tighten_profiles_update.sql'), 'utf8');
const TRIAL_SQL = readFileSync(join(MIGRATIONS_DIR, '037_terms_and_trial.sql'), 'utf8');
const LEADS_PIPELINE_SQL = readFileSync(join(MIGRATIONS_DIR, '040_leads_pipeline_fields.sql'), 'utf8');
const LEADS_ACTIVITY_SQL = readFileSync(join(MIGRATIONS_DIR, '041_leads_activity_log.sql'), 'utf8');

const TENANT_A = '00000000-0000-0000-0000-00000000000a';
const TENANT_B = '00000000-0000-0000-0000-00000000000b';
const ADMIN_A = '11111111-1111-1111-1111-111111111111';
const ADMIN_B = '22222222-2222-2222-2222-222222222222';
const TECH_A = '33333333-3333-3333-3333-333333333333';

const TENANT_TABLES = [
  'jobs', 'customers', 'invoices', 'timesheets', 'schedule', 'form_templates',
  'user_types', 'contractor_profile', 'quotes', 'materials', 'documents',
];

// Live job_materials.company_id is text, not uuid, so the tenant policy loop has
// to read the real column type instead of assuming uuid.
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

-- 037's start_cloud_trial() reads stripe_customer_id, which normally arrives with
-- 025_subscription_billing.sql - a migration this harness deliberately does not run.
CREATE TABLE public.companies (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text, settings jsonb, stripe_customer_id text);
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id),
  name text, email text, username text, phone text, role text,
  user_type_id text, pay_rate numeric, deactivated boolean DEFAULT false, deactivated_at timestamptz,
  color text, avatar_url text
);
CREATE TABLE public.system_locks (lock_name text PRIMARY KEY, locked_at timestamptz, locked_by text, expires_at timestamptz);
CREATE TABLE public.relay_reserved_email_slugs (slug text PRIMARY KEY);
CREATE TABLE public.leads (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid REFERENCES public.companies(id), message text);
CREATE TABLE public.notifications (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid REFERENCES public.companies(id), title text, message text);
${TENANT_TABLES.map((t) => `CREATE TABLE public.${t} (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid REFERENCES public.companies(id), label text);`).join('\n')}
${TEXT_TENANT_TABLES.map((t) => `CREATE TABLE public.${t} (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id text, label text);`).join('\n')}

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

describe('031 spend ledger and signup hardening', () => {
  let db;
  let grid;

  const SPENDER = '44444444-4444-4444-4444-444444444444';
  const INVITED = '55555555-5555-5555-5555-555555555555';
  const SNEAKY = '66666666-6666-6666-6666-666666666666';

  /** Signs a user up the way GoTrue does, then reads the side effects. */
  const signup = (id, email, userMeta, appMeta) =>
    db.query(
      `INSERT INTO auth.users (id, email, raw_user_meta_data, raw_app_meta_data)
       VALUES ('${id}', '${email}', '${JSON.stringify(userMeta)}'::jsonb, ${appMeta ? `'${JSON.stringify(appMeta)}'::jsonb` : 'NULL'})`
    );

  before(async () => {
    db = await createFixtureDb();
    await db.exec(TENANT_HELPER);
    await db.exec(CATCHUP_SQL);
    await db.exec(HARDENING_SQL);
    // 030 replaces the function but the trigger on auth.users predates every
    // migration, so the fixture recreates it to mirror the live project.
    await db.exec(`CREATE OR REPLACE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user_profile();`);
    const results = await db.exec(SPEND_SQL);
    grid = results[results.length - 1].rows;
  });

  after(async () => {
    await db.close();
  });

  test('the verification grid reports no failures', () => {
    assert.strictEqual(grid.length, 8);
    assert.deepStrictEqual(grid.filter((r) => r.verdict !== 'ok').map((r) => `${r.check_name}: ${r.verdict}`), []);
  });

  test('a public signup can no longer provision its own company or admin profile', async () => {
    // raw_user_meta_data is client-writable, so this payload is exactly what an
    // attacker controls. Before 031 it minted a company plus an admin profile.
    await signup(SPENDER, 'mallory@evil.test', {
      company_name: 'Mallory Co',
      name: 'Mallory',
      phone: '0400000000',
      role: 'admin',
    });

    assert.strictEqual(await value(db, 'SELECT count(*)::int FROM public.companies'), 2);
    assert.strictEqual(await value(db, 'SELECT count(*)::int FROM public.profiles'), 3);
    assert.strictEqual(await value(db, `SELECT count(*)::int FROM public.profiles WHERE id = '${SPENDER}'`), 0);
    assert.strictEqual(await value(db, `SELECT count(*)::int FROM public.companies WHERE name = 'Mallory Co'`), 0);
  });

  test('the invitation path still provisions the invited user', async () => {
    await signup(INVITED, 'invited@a.test', { company_name: 'Ignored Co' }, {
      company_id: TENANT_A,
      name: 'Invited Tech',
      username: 'invited',
      phone: '0411111111',
      role: 'technician',
    });

    const row = await one(db, `SELECT company_id, role, name, username FROM public.profiles WHERE id = '${INVITED}'`);
    assert.strictEqual(row.company_id, TENANT_A);
    assert.strictEqual(row.role, 'technician');
    assert.strictEqual(row.name, 'Invited Tech');
    assert.strictEqual(row.username, 'invited');
  });

  test('an invitation payload still cannot mint an administrator', async () => {
    await signup(SNEAKY, 'sneaky@a.test', null, { company_id: TENANT_A, name: 'Sneaky', role: 'admin' });
    assert.strictEqual(await value(db, `SELECT role FROM public.profiles WHERE id = '${SNEAKY}'`), 'technician');
  });

  test('a client session cannot call the signup trigger directly', async () => {
    await asRole(db, 'authenticated', ADMIN_A, async () => {
      await assert.rejects(
        () => db.query('SELECT public.handle_new_user_profile()'),
        /permission denied|trigger functions/i
      );
    });
  });

  test('the spend ledger is invisible and unwritable to clients', async () => {
    // Supabase grants new public tables to anon/authenticated by default, so
    // reproduce that grant and prove RLS (no policies) is what protects it.
    await db.exec('GRANT ALL ON public.api_usage TO anon, authenticated;');
    await db.query(`INSERT INTO public.api_usage (company_id, kind, units) VALUES ('${TENANT_A}', 'copilot', 3)`);

    await asRole(db, 'anon', null, async () => {
      assert.strictEqual(await value(db, 'SELECT count(*)::int FROM public.api_usage'), 0);
      await assert.rejects(
        () => db.query(`INSERT INTO public.api_usage (company_id, kind) VALUES ('${TENANT_A}', 'copilot')`),
        /row-level security/
      );
    });

    await asRole(db, 'authenticated', ADMIN_A, async () => {
      assert.strictEqual(await value(db, 'SELECT count(*)::int FROM public.api_usage'), 0);
      await assert.rejects(
        () => db.query(`INSERT INTO public.api_usage (company_id, kind) VALUES ('${TENANT_A}', 'copilot')`),
        /row-level security/
      );
    });

    await asRole(db, 'service_role', null, async () => {
      assert.strictEqual(await value(db, 'SELECT count(*)::int FROM public.api_usage'), 1);
      assert.strictEqual(await value(db, 'SELECT sum(units)::int FROM public.api_usage'), 3);
    });
  });

  test('spend is counted per tenant, per kind, for the current UTC day', async () => {
    // The exact predicate the three proxies use before calling a paid API.
    await db.query(`INSERT INTO public.api_usage (company_id, kind, units, created_at) VALUES
      ('${TENANT_A}', 'copilot', 5, now() - interval '2 days'),
      ('${TENANT_B}', 'copilot', 7, now()),
      ('${TENANT_A}', 'geocode', 9, now())`);

    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    assert.strictEqual(
      await value(db, `SELECT COALESCE(sum(units), 0)::int FROM public.api_usage
                        WHERE company_id = '${TENANT_A}' AND kind = 'copilot'
                          AND created_at >= '${since.toISOString()}'`),
      3
    );
    assert.strictEqual(
      await value(db, `SELECT COALESCE(sum(units), 0)::int FROM public.api_usage
                        WHERE company_id = '${TENANT_B}' AND kind = 'copilot'
                          AND created_at >= '${since.toISOString()}'`),
      7
    );
  });

  test('is idempotent - a second run produces the same grid', async () => {
    const results = await db.exec(SPEND_SQL);
    assert.deepStrictEqual(
      results[results.length - 1].rows.map((r) => r.verdict),
      grid.map((r) => r.verdict)
    );
  });
});

describe('034 pooled AI caps', () => {
  let db;
  let grid;

  const HEAVY = '77777777-7777-7777-7777-777777777777';
  const LIGHT = '88888888-8888-8888-8888-888888888888';

  before(async () => {
    db = await createFixtureDb();
    await db.exec(TENANT_HELPER);
    await db.exec(CATCHUP_SQL);
    await db.exec(HARDENING_SQL);
    await db.exec(SPEND_SQL);
    const results = await db.exec(POOLED_SQL);
    grid = results[results.length - 1].rows;
  });

  after(async () => {
    await db.close();
  });

  test('the verification grid reports no failures', () => {
    assert.strictEqual(grid.length, 7);
    assert.deepStrictEqual(grid.filter((r) => r.verdict !== 'ok').map((r) => `${r.check_name}: ${r.verdict}`), []);
  });

  test('attaches the spending seat to the ledger row', async () => {
    const column = await one(
      db,
      `SELECT data_type, is_nullable FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'api_usage' AND column_name = 'user_id'`
    );
    assert.ok(column, 'api_usage.user_id should exist');
    assert.strictEqual(column.data_type, 'uuid');
    // Rows written before this migration, and any future non-user-scoped call,
    // have no seat to attribute.
    assert.strictEqual(column.is_nullable, 'YES');

    const index = await one(
      db,
      `SELECT indexdef FROM pg_indexes
        WHERE schemaname = 'public' AND tablename = 'api_usage' AND indexname = 'api_usage_user_daily_idx'`
    );
    assert.ok(index, 'the per-user daily index should exist');
    assert.match(index.indexdef, /\(user_id, kind, created_at DESC\)/);
    // The company pool is still served by 031's index.
    assert.ok(await one(db, `SELECT 1 FROM pg_indexes WHERE indexname = 'api_usage_daily_cap_idx'`));
  });

  test('the pool counts the company and the ceiling counts one seat', async () => {
    // The exact predicate relay-copilot runs: one read of the local day, split
    // into a company total and the caller's own total.
    await db.query(`INSERT INTO public.api_usage (company_id, kind, units, user_id) VALUES
      ('${TENANT_A}', 'copilot', 10, '${HEAVY}'),
      ('${TENANT_A}', 'copilot', 4, '${LIGHT}'),
      ('${TENANT_A}', 'copilot', 7, NULL),
      ('${TENANT_B}', 'copilot', 30, '${HEAVY}'),
      ('${TENANT_A}', 'geocode', 50, '${HEAVY}')`);

    const pool = `company_id = '${TENANT_A}' AND kind = 'copilot' AND created_at >= now() - interval '1 minute'`;
    assert.strictEqual(await value(db, `SELECT COALESCE(sum(units), 0)::int FROM public.api_usage WHERE ${pool}`), 21);
    assert.strictEqual(
      await value(db, `SELECT COALESCE(sum(units), 0)::int FROM public.api_usage WHERE ${pool} AND user_id = '${HEAVY}'`),
      10
    );
    assert.strictEqual(
      await value(db, `SELECT COALESCE(sum(units), 0)::int FROM public.api_usage WHERE ${pool} AND user_id = '${LIGHT}'`),
      4
    );
  });

  test('an unattributed row only ever counts against the pool', async () => {
    // Otherwise a row written before 034 would silently consume somebody's day.
    assert.strictEqual(
      await value(db, `SELECT COALESCE(sum(units), 0)::int FROM public.api_usage
                        WHERE company_id = '${TENANT_A}' AND user_id IS NULL`),
      7
    );
  });

  test('the column arrives without disturbing existing rows', async () => {
    assert.strictEqual(
      await value(db, `SELECT COALESCE(sum(units), 0)::int FROM public.api_usage WHERE company_id = '${TENANT_B}'`),
      30
    );
  });

  test('a seat from another company is never counted against this one', async () => {
    // HEAVY chats in both tenants; only its own company's copilot rows may
    // count. The geocode row it also owns is a different ledger.
    assert.strictEqual(
      await value(db, `SELECT COALESCE(sum(units), 0)::int FROM public.api_usage
                        WHERE user_id = '${HEAVY}' AND kind = 'copilot'`),
      40
    );
    assert.strictEqual(
      await value(db, `SELECT COALESCE(sum(units), 0)::int FROM public.api_usage
                        WHERE user_id = '${HEAVY}' AND company_id = '${TENANT_A}' AND kind = 'copilot'`),
      10
    );
  });

  test('the ledger stays service-role only', async () => {
    // Supabase grants new public tables to anon/authenticated by default, so
    // reproduce that grant and prove RLS (no policies) is what protects a row
    // that now names the user who spent the money.
    await db.exec('GRANT ALL ON public.api_usage TO anon, authenticated;');

    await asRole(db, 'anon', null, async () => {
      assert.strictEqual(await value(db, 'SELECT count(*)::int FROM public.api_usage'), 0);
      await assert.rejects(
        () => db.query(`INSERT INTO public.api_usage (company_id, kind) VALUES ('${TENANT_A}', 'copilot')`),
        /row-level security/
      );
    });

    await asRole(db, 'authenticated', ADMIN_A, async () => {
      assert.strictEqual(await value(db, 'SELECT count(*)::int FROM public.api_usage'), 0);
      await assert.rejects(
        () => db.query(`INSERT INTO public.api_usage (company_id, kind) VALUES ('${TENANT_A}', 'copilot')`),
        /row-level security/
      );
    });

    await asRole(db, 'service_role', null, async () => {
      await db.query(`INSERT INTO public.api_usage (company_id, kind, units, user_id)
                      VALUES ('${TENANT_A}', 'copilot', 1, '${HEAVY}')`);
      assert.strictEqual(
        await value(db, `SELECT COALESCE(sum(units), 0)::int FROM public.api_usage
                          WHERE user_id = '${HEAVY}' AND company_id = '${TENANT_A}' AND kind = 'copilot'`),
        11
      );
    });

    await db.exec('REVOKE ALL ON public.api_usage FROM anon, authenticated;');
  });

  test('is idempotent - a second run keeps the rows and the same grid', async () => {
    const results = await db.exec(POOLED_SQL);
    assert.deepStrictEqual(
      results[results.length - 1].rows.map((r) => r.verdict),
      grid.map((r) => r.verdict)
    );
    assert.strictEqual(
      await value(db, `SELECT COALESCE(sum(units), 0)::int FROM public.api_usage
                        WHERE user_id = '${HEAVY}' AND company_id = '${TENANT_A}' AND kind = 'copilot'`),
      11
    );
  });
});

describe('032 portal passcode persistence', () => {
  let db;

  const CUSTOMER_A = 'aaaaaaaa-0000-0000-0000-000000000001';
  const CUSTOMER_B = 'bbbbbbbb-0000-0000-0000-000000000002';

  before(async () => {
    db = await createFixtureDb();
    await db.exec(TENANT_HELPER);
    await db.exec(CATCHUP_SQL);
    await db.exec(HARDENING_SQL);
    await db.exec(SPEND_SQL);
    // The shared fixture only carries the tables the earlier migrations touch,
    // so create the live shape of the contractor portal table for this one.
    await db.exec(`CREATE TABLE public.contractors (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id uuid REFERENCES public.companies(id),
      label text
    );`);
    await db.exec(PASSCODE_SQL);
    await db.query(`INSERT INTO public.customers (id, company_id, label) VALUES
      ('${CUSTOMER_A}', '${TENANT_A}', 'A customer'),
      ('${CUSTOMER_B}', '${TENANT_B}', 'B customer')`);
  });

  after(async () => {
    await db.close();
  });

  test('adds a nullable text passcode column to both portal tables', async () => {
    for (const table of ['customers', 'contractors']) {
      const column = await one(
        db,
        `SELECT data_type, is_nullable FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = '${table}' AND column_name = 'portal_passcode'`
      );
      assert.ok(column, `${table}.portal_passcode should exist`);
      assert.strictEqual(column.data_type, 'text');
      assert.strictEqual(column.is_nullable, 'YES');
    }
  });

  test('is re-runnable without disturbing stored pins', async () => {
    await db.query(`UPDATE public.customers SET portal_passcode = '4821' WHERE id = '${CUSTOMER_A}'`);
    await db.exec(PASSCODE_SQL);
    assert.strictEqual(await value(db, `SELECT portal_passcode FROM public.customers WHERE id = '${CUSTOMER_A}'`), '4821');
  });

  test('a company can set and clear the pin on its own portal record', async () => {
    await asRole(db, 'authenticated', ADMIN_A, async () => {
      await db.query(`UPDATE public.customers SET portal_passcode = '1357' WHERE id = '${CUSTOMER_A}'`);
      assert.strictEqual(await value(db, `SELECT portal_passcode FROM public.customers WHERE id = '${CUSTOMER_A}'`), '1357');

      // The admin Reset PIN button writes an explicit NULL, which has to reach the row.
      await db.query(`UPDATE public.customers SET portal_passcode = NULL WHERE id = '${CUSTOMER_A}'`);
      assert.strictEqual(await value(db, `SELECT portal_passcode FROM public.customers WHERE id = '${CUSTOMER_A}'`), null);
    });
  });

  test('the new column adds no cross-tenant write path', async () => {
    await asRole(db, 'authenticated', ADMIN_A, async () => {
      await db.query(`UPDATE public.customers SET portal_passcode = '9999' WHERE id = '${CUSTOMER_B}'`);
    });
    assert.strictEqual(await value(db, `SELECT portal_passcode FROM public.customers WHERE id = '${CUSTOMER_B}'`), null);
  });

  test('the anon key cannot read pins', async () => {
    await db.query(`UPDATE public.customers SET portal_passcode = '2468' WHERE id = '${CUSTOMER_A}'`);
    await asRole(db, 'anon', null, async () => {
      assert.strictEqual(await value(db, 'SELECT count(*)::int FROM public.customers'), 0);
    });
  });
});

// 033 shipped the origin column but its backfill leaned on `created_by =
// 'System Engine'`, and created_by is NULL in a real database (the app never
// wrote it). These rows supply that value by hand, which is why the migration
// passed review: the shapes a live database actually holds are covered by the
// 035 block below.
describe('033 notifications origin', () => {
  let db;

  // Notifications that already existed when the column was added, using the exact
  // shapes the machine producers have emitted.
  const SEEDED_ALERT = '44444444-0000-0000-0000-000000000001';
  const STOCK_REORDER = '44444444-0000-0000-0000-000000000002';
  const ENGINE_PLAN = '44444444-0000-0000-0000-000000000003';
  const HUMAN_QUOTE = '44444444-0000-0000-0000-000000000004';
  const OTHER_TENANT = '44444444-0000-0000-0000-000000000005';

  before(async () => {
    db = await createFixtureDb();
    await db.exec(TENANT_HELPER);
    await db.exec(CATCHUP_SQL);
    await db.exec(HARDENING_SQL);
    // Legacy rows: no origin column yet, so the migration has to classify them.
    await db.query(`INSERT INTO public.notifications (id, company_id, title, message, created_by) VALUES
      ('${SEEDED_ALERT}', '${TENANT_A}', 'System Alert - Service Due 1', 'Asset service due', NULL),
      ('${STOCK_REORDER}', '${TENANT_A}', 'Stock Auto-Reorder', 'Below reorder level', 'Unknown'),
      ('${ENGINE_PLAN}', '${TENANT_A}', 'Maintenance Due: Generator - Annual Service', 'Plan due', 'System Engine'),
      ('${HUMAN_QUOTE}', '${TENANT_A}', 'Quote Accepted', 'Client signed', 'Dana Tech'),
      ('${OTHER_TENANT}', '${TENANT_B}', 'B only', 'B secret', NULL)`);
    await db.exec(ORIGIN_SQL);
  });

  after(async () => {
    await db.close();
  });

  test('adds a non-null origin column defaulting to user', async () => {
    const column = await one(
      db,
      `SELECT data_type, is_nullable, column_default FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'origin'`
    );
    assert.ok(column, 'notifications.origin should exist');
    assert.strictEqual(column.data_type, 'text');
    assert.strictEqual(column.is_nullable, 'NO');
    assert.match(column.column_default, /'user'/);
  });

  test('classifies the existing machine rows as system', async () => {
    const rows = await db.query(
      `SELECT id, origin FROM public.notifications WHERE company_id = '${TENANT_A}' ORDER BY id`
    );
    const byId = Object.fromEntries(rows.rows.map((r) => [r.id, r.origin]));
    assert.strictEqual(byId[SEEDED_ALERT], 'system');
    assert.strictEqual(byId[STOCK_REORDER], 'system');
    assert.strictEqual(byId[ENGINE_PLAN], 'system');
  });

  test('never reclassifies a notification a person raised', async () => {
    assert.strictEqual(
      await value(db, `SELECT origin FROM public.notifications WHERE id = '${HUMAN_QUOTE}'`),
      'user'
    );
    // A row whose title merely mentions a quote must not be swept up either.
    assert.strictEqual(
      await value(db, `SELECT origin FROM public.notifications WHERE id = '${OTHER_TENANT}'`),
      'user'
    );
  });

  test('new notifications default to user without the column being supplied', async () => {
    await db.query(
      `INSERT INTO public.notifications (company_id, title, message)
       VALUES ('${TENANT_A}', 'Site visit requested', 'Customer called')`
    );
    assert.strictEqual(
      await value(db, `SELECT origin FROM public.notifications WHERE title = 'Site visit requested'`),
      'user'
    );
  });

  test('is re-runnable without changing any stored origin', async () => {
    const before = await db.query('SELECT id, origin FROM public.notifications ORDER BY id');
    await db.exec(ORIGIN_SQL);
    const after = await db.query('SELECT id, origin FROM public.notifications ORDER BY id');
    assert.deepStrictEqual(after.rows, before.rows);
  });
});

describe('035 notifications origin re-backfill', () => {
  let db;
  let originsBeforeBackfill;

  // A live database's rows: created_by is NULL everywhere (the app never wrote it),
  // so 033's backfill matched nothing and the NOT NULL DEFAULT left every machine
  // row stamped 'user' - which is why the "hide system notifications" toggle had
  // nothing to hide. Rows are inserted without an origin for the same reason.
  const MAINTENANCE = '55555555-0000-0000-0000-000000000001';
  const USAGE_MAINTENANCE = '55555555-0000-0000-0000-000000000002';
  const MERGED_PLAN = '55555555-0000-0000-0000-000000000003';
  const JOB_CREATED = '55555555-0000-0000-0000-000000000004';
  const JOB_CLEANUP = '55555555-0000-0000-0000-000000000005';
  const STOCK_REORDER = '55555555-0000-0000-0000-000000000006';
  const SEEDED_ALERT = '55555555-0000-0000-0000-000000000007';
  const HUMAN_MENTION = '55555555-0000-0000-0000-000000000008';
  const HUMAN_TITLE = '55555555-0000-0000-0000-000000000009';
  const HUMAN_QUOTE = '55555555-0000-0000-0000-00000000000a';
  const ENGINE_TYPE = '55555555-0000-0000-0000-00000000000b';
  const HUMAN_TYPE = '55555555-0000-0000-0000-00000000000c';

  const MACHINE_IDS = [
    MAINTENANCE, USAGE_MAINTENANCE, MERGED_PLAN, JOB_CREATED,
    JOB_CLEANUP, STOCK_REORDER, SEEDED_ALERT, ENGINE_TYPE,
  ];
  const HUMAN_IDS = [HUMAN_MENTION, HUMAN_TITLE, HUMAN_QUOTE, HUMAN_TYPE];

  const origins = async () => Object.fromEntries(
    (await db.query('SELECT id, origin FROM public.notifications')).rows.map((r) => [r.id, r.origin])
  );

  before(async () => {
    db = await createFixtureDb();
    await db.exec(TENANT_HELPER);
    // 029 catch-up is what a drifted project ran: it adds created_by but neither
    // type nor description, so 035 has to bring what its predicates read.
    await db.exec(CATCHUP_SQL);
    await db.exec(HARDENING_SQL);
    await db.exec(ORIGIN_SQL);
    await db.exec(BACKFILL_ORIGIN_SQL);

    await db.query(`INSERT INTO public.notifications (id, company_id, title, message, type) VALUES
      ('${MAINTENANCE}', '${TENANT_A}', 'Maintenance Due: Generator - Annual Service', 'Plan due', 'Recurring Job Due'),
      ('${USAGE_MAINTENANCE}', '${TENANT_A}', 'Usage Maintenance Due: Generator - 500hr Service', NULL, 'Recurring Job Due'),
      ('${MERGED_PLAN}', '${TENANT_A}', 'Annual Service (includes Oil Change tasks)', 'Service Plan: Annual Service (includes Oil Change tasks)', 'Recurring Job Due'),
      ('${ENGINE_TYPE}', '${TENANT_A}', 'Annual Service (includes Oil Change tasks)', 'Service Plan: Annual Service', 'Recurring Job Due'),
      ('${JOB_CREATED}', '${TENANT_A}', 'Recurring Job Created', NULL, 'Recurring Job Created'),
      ('${JOB_CLEANUP}', '${TENANT_A}', 'Duplicate recurring occurrences removed', NULL, 'Recurring Job Cleanup'),
      ('${STOCK_REORDER}', '${TENANT_A}', 'Stock Auto-Reorder', 'Below reorder level', NULL),
      ('${SEEDED_ALERT}', '${TENANT_A}', 'System Alert - Service Due 1', 'Asset service due', NULL),
      ('${HUMAN_MENTION}', '${TENANT_A}', 'Check the plan', 'Please check the Service Plan: it looks stale', 'Recurring Job Due'),
      ('${HUMAN_TITLE}', '${TENANT_A}', 'Maintenance Due', 'Chat about the plan', NULL),
      ('${HUMAN_QUOTE}', '${TENANT_A}', 'Quote Accepted', 'Client signed', NULL),
      ('${HUMAN_TYPE}', '${TENANT_A}', 'Generator making a noise', 'Customer called it in', 'Recurring Job Due')`);

    originsBeforeBackfill = await origins();

    await db.exec(BACKFILL_ORIGIN_SQL);
  });

  after(async () => {
    await db.close();
  });

  test('the machine rows all start out stamped user', () => {
    MACHINE_IDS.forEach((id) =>
      assert.strictEqual(originsBeforeBackfill[id], 'user', `${id} should start as user`)
    );
  });

  test('brings the columns its predicates read when the project never had them', async () => {
    assert.strictEqual(
      await value(db, "SELECT count(*)::int FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name IN ('type', 'description')"),
      2
    );
  });

  test('classifies every machine shape as system', async () => {
    const current = await origins();
    MACHINE_IDS.forEach((id) => assert.strictEqual(current[id], 'system', `${id} should be system`));
  });

  test('never reclassifies a notification a person raised', async () => {
    const current = await origins();
    HUMAN_IDS.forEach((id) => assert.strictEqual(current[id], 'user', `${id} should stay user`));
  });

  test('is re-runnable without changing any stored origin', async () => {
    const before = await origins();
    await db.exec(BACKFILL_ORIGIN_SQL);
    assert.deepStrictEqual(await origins(), before);
  });

  test('leaves a notification raised after the migration to the column default', async () => {
    await db.query(
      `INSERT INTO public.notifications (company_id, title, message, type)
       VALUES ('${TENANT_A}', 'Site visit requested', 'Customer called', 'Client Request')`
    );
    assert.strictEqual(
      await value(db, `SELECT origin FROM public.notifications WHERE title = 'Site visit requested'`),
      'user'
    );
  });
});

describe('036 company name availability', () => {
  let db;

  const NEW_ADMIN = '55555555-5555-5555-5555-555555555555';
  const OTHER_ADMIN = '66666666-6666-6666-6666-666666666666';

  before(async () => {
    db = await createFixtureDb();
    await db.exec(TENANT_HELPER);
    await db.exec(CATCHUP_SQL);
    await db.exec(HARDENING_SQL);
    await db.query(`INSERT INTO auth.users (id, email) VALUES ('${NEW_ADMIN}', 'new@acme.test')`);
    await db.exec(NAME_SQL);
  });

  after(async () => {
    await db.close();
  });

  test('normalizes the name the way the signup form does', async () => {
    assert.strictEqual(await value(db, "SELECT public.relay_company_name_key('  Acme   Electrical ')"), 'acme electrical');
    assert.strictEqual(await value(db, "SELECT public.relay_company_name_key('ACME ELECTRICAL')"), 'acme electrical');
    assert.strictEqual(await value(db, "SELECT public.relay_company_name_key('')"), '');
    assert.strictEqual(await value(db, 'SELECT public.relay_company_name_key(NULL)'), '');
  });

  test('indexes the normalized name without making it unique', async () => {
    // Uniqueness would break renames: Settings.saveSettings() rewrites
    // companies.name and only console.errors on a 23505.
    assert.strictEqual(
      await value(db, "SELECT indisunique FROM pg_index WHERE indexrelid = 'public.companies_name_key_idx'::regclass"),
      false
    );
    assert.strictEqual(
      await value(db, "SELECT count(*)::int FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'companies_name_key_idx'"),
      1
    );
  });

  test('an anonymous visitor can ask whether a name is free', async () => {
    await asRole(db, 'anon', null, async () => {
      // RLS hides every company from this role, which is exactly why the check
      // has to run as the definer.
      assert.strictEqual(await value(db, 'SELECT count(*)::int FROM public.companies'), 0);
      assert.strictEqual(await value(db, "SELECT public.company_name_available('Tenant A')"), false);
      assert.strictEqual(await value(db, "SELECT public.company_name_available('  tenant   a ')"), false);
      assert.strictEqual(await value(db, "SELECT public.company_name_available('Acme Electrical')"), true);
      // Blank is not "available" - the form has its own required-field message.
      assert.strictEqual(await value(db, "SELECT public.company_name_available('   ')"), false);
    });
  });

  test('provisioning claims the name for the new company', async () => {
    const companyId = await asRole(db, 'authenticated', NEW_ADMIN, async () => {
      const { rows } = await db.query(`SELECT public.create_company_and_admin('${NEW_ADMIN}', 'Acme Electrical', 'New Admin', '0400000000') AS id`);
      return rows[0].id;
    });

    assert.match(companyId, /^[0-9a-f-]{36}$/);
    assert.strictEqual(await value(db, `SELECT name FROM public.companies WHERE id = '${companyId}'`), 'Acme Electrical');
    assert.strictEqual(
      await value(db, `SELECT name || '|' || role || '|' || email FROM public.profiles WHERE id = '${NEW_ADMIN}'`),
      'New Admin|admin|new@acme.test'
    );
    assert.strictEqual(await value(db, "SELECT public.company_name_available('acme  electrical')"), false);
  });

  test('refuses a name another company already owns', async () => {
    await asRole(db, 'authenticated', OTHER_ADMIN, async () => {
      await assert.rejects(
        () => db.query(`SELECT public.create_company_and_admin('${OTHER_ADMIN}', '  ACME   electrical ', 'Mallory', '0400000000')`),
        /already taken/
      );
    });
    // The failed attempt must not have left a company or a profile behind.
    assert.strictEqual(
      await value(db, "SELECT count(*)::int FROM public.companies WHERE public.relay_company_name_key(name) = 'acme electrical'"),
      1
    );
    assert.strictEqual(await value(db, `SELECT count(*)::int FROM public.profiles WHERE id = '${OTHER_ADMIN}'`), 0);
  });

  test('refuses a blank company name', async () => {
    await asRole(db, 'authenticated', OTHER_ADMIN, async () => {
      await assert.rejects(
        () => db.query(`SELECT public.create_company_and_admin('${OTHER_ADMIN}', '   ', 'Mallory', '0400000000')`),
        /Enter your company name/
      );
    });
    assert.strictEqual(await value(db, `SELECT count(*)::int FROM public.profiles WHERE id = '${OTHER_ADMIN}'`), 0);
  });

  test('keeps the caller check and the anon lockout', async () => {
    await asRole(db, 'authenticated', OTHER_ADMIN, async () => {
      await assert.rejects(
        () => db.query(`SELECT public.create_company_and_admin('${NEW_ADMIN}', 'Fresh Co', 'Mallory', '0400000000')`),
        /only provision your own company/
      );
    });
    await asRole(db, 'anon', null, async () => {
      await assert.rejects(
        () => db.query(`SELECT public.create_company_and_admin('${OTHER_ADMIN}', 'Fresh Co', 'Mallory', '0400000000')`),
        /permission denied/
      );
    });
  });

  test('is re-runnable and still enforces the claim afterwards', async () => {
    await db.exec(NAME_SQL);
    assert.strictEqual(
      await value(db, "SELECT count(*)::int FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'companies_name_key_idx'"),
      1
    );
    assert.strictEqual(
      await value(db, "SELECT to_regprocedure('public.create_company_and_admin(uuid, text, text, text)') IS NOT NULL"),
      true
    );

    await asRole(db, 'authenticated', OTHER_ADMIN, async () => {
      await assert.rejects(
        () => db.query(`SELECT public.create_company_and_admin('${OTHER_ADMIN}', 'Tenant B', 'Mallory', '0400000000')`),
        /already taken/
      );
    });

    // CREATE OR REPLACE must not have widened or dropped the grants.
    await asRole(db, 'anon', null, async () => {
      await assert.rejects(
        () => db.query(`SELECT public.create_company_and_admin('${OTHER_ADMIN}', 'Fresh Co', 'Mallory', '0400000000')`),
        /permission denied/
      );
      assert.strictEqual(await value(db, "SELECT public.company_name_available('Tenant B')"), false);
    });
  });
});

describe('038 profile identity validation', () => {
  let db;

  // What a technician can store today: Profile.js writes name, color and
  // avatar_url on the caller's own row, and 030's guard leaves all three open.
  // profiles is read tenant-wide, so the payload is rendered for every
  // colleague before it ever reaches the owner's own screen.
  const POISONED_NAME = '<img src=x onerror=alert(1)>Tech "A"';
  const POISONED_AVATAR = 'data:image/png;base64,<script>alert(1)</script>';
  const DATA_URL_AVATAR = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==';
  const NEW_ADMIN = '77777777-7777-7777-7777-777777777777';

  before(async () => {
    db = await createFixtureDb();
    // Poison the row the way the app would, then migrate - this is the order a
    // live database is in, and the constraint cannot be added on top of it.
    await db.query(
      `UPDATE public.profiles SET name = '${POISONED_NAME}', avatar_url = '${POISONED_AVATAR}', color = 'red' WHERE id = '${TECH_A}'`
    );
    await db.exec(TENANT_HELPER);
    await db.exec(CATCHUP_SQL);
    await db.exec(HARDENING_SQL);
    await db.exec(`INSERT INTO auth.users (id, email) VALUES ('${NEW_ADMIN}', 'constraint@acme.test')`);
    await db.exec(IDENTITY_SQL);
  });

  after(async () => {
    await db.close();
  });

  test('ensures the columns it constrains exist', async () => {
    // schema.sql declares profiles.color but no incremental migration creates
    // it, so a database built from this series alone would fail the ALTERs
    // below without the catch-up columns.
    assert.strictEqual(
      await value(db, "SELECT count(*)::int FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name IN ('color', 'avatar_url')"),
      2
    );
  });

  test('repairs the rows that already hold markup', async () => {
    const row = await one(db, `SELECT name, avatar_url, color FROM public.profiles WHERE id = '${TECH_A}'`);
    assert.strictEqual(row.name, 'img src=x onerror=alert(1)Tech A');
    assert.strictEqual(row.avatar_url, 'data:image/png;base64,scriptalert(1)/script');
    assert.strictEqual(row.color, '#FF5C00');
  });

  test('holds the repaired rows open for editing', async () => {
    // Stripping rather than deleting is the difference between a repaired
    // account and a locked one: the constraint would reject the very UPDATE
    // that clears the offending value.
    await asRole(db, 'authenticated', TECH_A, async () => {
      await db.query(`UPDATE public.profiles SET name = 'Tech A' WHERE id = '${TECH_A}'`);
    });
    assert.strictEqual(await value(db, `SELECT name FROM public.profiles WHERE id = '${TECH_A}'`), 'Tech A');
  });

  test('rejects a name carrying markup, on any role', async () => {
    await asRole(db, 'authenticated', TECH_A, async () => {
      await assert.rejects(
        () => db.query(`UPDATE public.profiles SET name = '<b>Tech A</b>' WHERE id = '${TECH_A}'`),
        /profiles_name_no_markup/
      );
      // A quote is not markup on its own, but the name is interpolated into
      // attribute positions as well as text, and one quote closes the
      // attribute early - so it is rejected alongside the brackets.
      await assert.rejects(
        () => db.query(`UPDATE public.profiles SET name = 'Tech "Ace" A' WHERE id = '${TECH_A}'`),
        /profiles_name_no_markup/
      );
    });
    // A CHECK constraint applies to the service role too. That is the whole
    // reason it is not an extension of profiles_security_guard(), which stands
    // down for the signup path that writes the admin's name.
    await asRole(db, 'service_role', null, async () => {
      await assert.rejects(
        () => db.query(`UPDATE public.profiles SET name = '<b>Tech A</b>' WHERE id = '${TECH_A}'`),
        /profiles_name_no_markup/
      );
    });
    assert.strictEqual(await value(db, `SELECT name FROM public.profiles WHERE id = '${TECH_A}'`), 'Tech A');
  });

  test('rejects a markup avatar and a non-hex colour', async () => {
    await asRole(db, 'authenticated', TECH_A, async () => {
      await assert.rejects(
        () => db.query(`UPDATE public.profiles SET avatar_url = '<svg onload=alert(1)>' WHERE id = '${TECH_A}'`),
        /profiles_avatar_url_no_markup/
      );
      await assert.rejects(
        () => db.query(`UPDATE public.profiles SET color = 'red' WHERE id = '${TECH_A}'`),
        /profiles_color_hex/
      );
    });
  });

  test('accepts everything the profile form actually sends', async () => {
    const PRESETS = ['#FF5C00', '#2563EB', '#059669', '#7C3AED', '#DB2777', '#DC2626', '#0891B2', '#65A30D'];
    await asRole(db, 'authenticated', TECH_A, async () => {
      for (const hex of PRESETS) {
        await db.query(`UPDATE public.profiles SET color = '${hex}', avatar_url = '${DATA_URL_AVATAR}' WHERE id = '${TECH_A}'`);
      }
      // An apostrophe is markup to nobody; rejecting it would lock out a
      // sizeable share of real names.
      await db.query(`UPDATE public.profiles SET name = 'O''Brien Tech' WHERE id = '${TECH_A}'`);
    });
    assert.strictEqual(
      await value(db, `SELECT name || '|' || color || '|' || avatar_url FROM public.profiles WHERE id = '${TECH_A}'`),
      `O'Brien Tech|#65A30D|${DATA_URL_AVATAR}`
    );
  });

  test('covers the admin the signup RPC creates', async () => {
    // 038 on its own: the signup RPC writes profiles.name, so provisioning
    // fails closed on a markup name. 039 then normalises the name inside the
    // RPC so no shipped flow can reach this failure - see the 039 suite.
    await asRole(db, 'authenticated', NEW_ADMIN, async () => {
      await assert.rejects(
        () => db.query(`SELECT public.create_company_and_admin('${NEW_ADMIN}', 'Constraint Co', 'Mallory <b>', '0400000000')`),
        /profiles_name_no_markup/
      );
      // The rejected company must not be left behind half-provisioned.
      assert.strictEqual(await value(db, "SELECT count(*)::int FROM public.companies WHERE name = 'Constraint Co'"), 0);
      assert.strictEqual(await value(db, `SELECT count(*)::int FROM public.profiles WHERE id = '${NEW_ADMIN}'`), 0);
    });
  });

  test('is re-runnable', async () => {
    await db.exec(IDENTITY_SQL);
    assert.strictEqual(
      await value(db, "SELECT count(*)::int FROM pg_constraint WHERE conname IN ('profiles_name_no_markup', 'profiles_avatar_url_no_markup', 'profiles_color_hex')"),
      3
    );
    await asRole(db, 'authenticated', TECH_A, async () => {
      await assert.rejects(
        () => db.query(`UPDATE public.profiles SET name = '<b>x</b>' WHERE id = '${TECH_A}'`),
        /profiles_name_no_markup/
      );
    });
  });
});

describe('039 profiles update scope', () => {
  let db;

  // Two signups that do not exist yet: one with a name the CHECK rejects as
  // typed, one with a name it accepts untouched.
  const MARKUP_ADMIN = '88888888-8888-8888-8888-888888888888';
  const CLEAN_ADMIN = '99999999-9999-9999-9999-999999999999';

  before(async () => {
    db = await createFixtureDb();
    await db.exec(TENANT_HELPER);
    await db.exec(CATCHUP_SQL);
    await db.exec(HARDENING_SQL);
    // The live series, in order: 036 owns the provisioning RPC this suite
    // redefines, 038 owns the CHECK it has to satisfy.
    await db.exec(NAME_SQL);
    await db.exec(IDENTITY_SQL);
    await db.exec(UPDATE_SCOPE_SQL);
    await db.exec(
      `INSERT INTO auth.users (id, email) VALUES ('${MARKUP_ADMIN}', 'markup@acme.test'), ('${CLEAN_ADMIN}', 'clean@acme.test')`
    );
  });

  after(async () => {
    await db.close();
  });

  test('an admin keeps the tenant-wide edit the Settings user table needs', async () => {
    await asRole(db, 'authenticated', ADMIN_A, async () => {
      const updated = await db.query(
        `UPDATE public.profiles SET name = 'Tech A Edited', phone = '0400111222' WHERE id = '${TECH_A}'`
      );
      assert.strictEqual(updated.affectedRows, 1);
    });
    const row = await one(db, `SELECT name, phone FROM public.profiles WHERE id = '${TECH_A}'`);
    assert.strictEqual(row.name, 'Tech A Edited');
    assert.strictEqual(row.phone, '0400111222');
  });

  test('a technician cannot rewrite a colleague - or the admin - at all', async () => {
    // The reported attack: read the admin's address out of the tenant-wide
    // read policy, change it, then use the password-reset flow.
    await asRole(db, 'authenticated', TECH_A, async () => {
      const hijack = await db.query(
        `UPDATE public.profiles SET email = 'attacker@evil.test' WHERE id = '${ADMIN_A}'`
      );
      assert.strictEqual(hijack.affectedRows, 0);

      const rename = await db.query(
        `UPDATE public.profiles SET name = 'Mallory' WHERE id = '${ADMIN_A}'`
      );
      assert.strictEqual(rename.affectedRows, 0);
    });

    const admin = await one(db, `SELECT name, email FROM public.profiles WHERE id = '${ADMIN_A}'`);
    assert.strictEqual(admin.name, 'Admin A');
    assert.strictEqual(admin.email, 'a@a.test');
  });

  test('a technician still edits their own profile', async () => {
    await asRole(db, 'authenticated', TECH_A, async () => {
      const updated = await db.query(
        `UPDATE public.profiles SET name = 'Tech A Self', color = '#2563EB' WHERE id = '${TECH_A}'`
      );
      assert.strictEqual(updated.affectedRows, 1);
    });
    assert.strictEqual(await value(db, `SELECT name FROM public.profiles WHERE id = '${TECH_A}'`), 'Tech A Self');
  });

  test('a self-declared admin gets no tenant-wide write', async () => {
    // profiles_security_guard() reverts role, so the promotion is a no-op -
    // and the helper reads the stored row, not the statement, so even a guard
    // regression would not hand out the tenant here.
    await asRole(db, 'authenticated', TECH_A, async () => {
      await db.query(`UPDATE public.profiles SET role = 'admin' WHERE id = '${TECH_A}'`);
      assert.strictEqual(
        await value(db, `SELECT role FROM public.profiles WHERE id = '${TECH_A}'`),
        'technician'
      );

      const attempt = await db.query(
        `UPDATE public.profiles SET email = 'still-evil@evil.test' WHERE id = '${ADMIN_A}'`
      );
      assert.strictEqual(attempt.affectedRows, 0);
    });
    assert.strictEqual(await value(db, `SELECT email FROM public.profiles WHERE id = '${ADMIN_A}'`), 'a@a.test');
  });

  test('a deactivated admin loses the tenant-wide write', async () => {
    const RETIRED = '55555555-5555-5555-5555-555555555555';
    await db.exec(
      `INSERT INTO public.profiles (id, company_id, name, email, role, deactivated) VALUES ('${RETIRED}', '${TENANT_A}', 'Retired Admin', 'r@a.test', 'admin', true)`
    );
    await asRole(db, 'authenticated', RETIRED, async () => {
      const attempt = await db.query(
        `UPDATE public.profiles SET email = 'retired@evil.test' WHERE id = '${ADMIN_A}'`
      );
      assert.strictEqual(attempt.affectedRows, 0);
    });
    assert.strictEqual(await value(db, `SELECT email FROM public.profiles WHERE id = '${ADMIN_A}'`), 'a@a.test');
    // The retired account can still maintain its own row.
    await asRole(db, 'authenticated', RETIRED, async () => {
      const own = await db.query(`UPDATE public.profiles SET name = 'Retired Admin' WHERE id = '${RETIRED}'`);
      assert.strictEqual(own.affectedRows, 1);
    });
  });

  test('cross-tenant writes stay out, even for an admin', async () => {
    await asRole(db, 'authenticated', ADMIN_A, async () => {
      const attempt = await db.query(
        `UPDATE public.profiles SET name = 'Cross Tenant' WHERE id = '${ADMIN_B}'`
      );
      assert.strictEqual(attempt.affectedRows, 0);
    });
    assert.strictEqual(await value(db, `SELECT name FROM public.profiles WHERE id = '${ADMIN_B}'`), 'Admin B');
  });

  test('the helper answers for the caller only, and anon cannot call it', async () => {
    await asRole(db, 'authenticated', ADMIN_A, async () => {
      assert.strictEqual(await value(db, 'SELECT public.is_company_admin()'), true);
    });
    await asRole(db, 'authenticated', TECH_A, async () => {
      // Same call, same arguments - the answer is about the caller, so a
      // technician cannot borrow an admin's verdict.
      assert.strictEqual(await value(db, 'SELECT public.is_company_admin()'), false);
    });
    await asRole(db, 'anon', null, async () => {
      await assert.rejects(() => db.query('SELECT public.is_company_admin()'), /permission denied/);
    });
  });

  test('leaves the own-row policy untouched', async () => {
    assert.strictEqual(
      await value(db, "SELECT count(*)::int FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profile_update_own'"),
      1
    );
  });

  test('provisions a signup whose name carries markup, instead of dead-ending it', async () => {
    // The launch screen, the finish card and the local -> cloud upgrade all
    // hand a typed name straight to this RPC. 038 alone fails the whole call,
    // which is safe but leaves the user stuck on the field that used to be
    // accepted; 039 normalises inside the RPC so the signup completes.
    await asRole(db, 'authenticated', MARKUP_ADMIN, async () => {
      await db.query(
        `SELECT public.create_company_and_admin('${MARKUP_ADMIN}', 'Markup Co', '  Mallory <b> "Bo"  ', '0400000000')`
      );
    });
    const row = await one(db, `SELECT name, role, email FROM public.profiles WHERE id = '${MARKUP_ADMIN}'`);
    assert.strictEqual(row.name, 'Mallory b Bo');
    assert.strictEqual(row.role, 'admin');
    assert.strictEqual(row.email, 'markup@acme.test');
    assert.strictEqual(await value(db, "SELECT count(*)::int FROM public.companies WHERE name = 'Markup Co'"), 1);
  });

  test('leaves an ordinary signup name exactly as typed', async () => {
    await asRole(db, 'authenticated', CLEAN_ADMIN, async () => {
      await db.query(
        `SELECT public.create_company_and_admin('${CLEAN_ADMIN}', 'Clean Co', 'O''Brien Mallory', '0400000000')`
      );
    });
    assert.strictEqual(
      await value(db, `SELECT name FROM public.profiles WHERE id = '${CLEAN_ADMIN}'`),
      "O'Brien Mallory"
    );
  });

  test('a name that is nothing but markup lands as NULL, not as a blank shell', async () => {
    const BLANK_ADMIN = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    await db.exec(`INSERT INTO auth.users (id, email) VALUES ('${BLANK_ADMIN}', 'blank@acme.test')`);
    await asRole(db, 'authenticated', BLANK_ADMIN, async () => {
      await db.query(`SELECT public.create_company_and_admin('${BLANK_ADMIN}', 'Blank Co', '<>', '0400000000')`);
    });
    assert.strictEqual(await value(db, `SELECT name IS NULL FROM public.profiles WHERE id = '${BLANK_ADMIN}'`), true);
  });

  test('the CHECK still refuses markup written past the RPC', async () => {
    // Normalising at the one entry point that needs it must not read as a
    // weakening of 038: a direct write is still rejected, for every role.
    await asRole(db, 'service_role', null, async () => {
      await assert.rejects(
        () => db.query(`UPDATE public.profiles SET name = '<b>Mallory</b>' WHERE id = '${MARKUP_ADMIN}'`),
        /profiles_name_no_markup/
      );
    });
    assert.strictEqual(await value(db, `SELECT name FROM public.profiles WHERE id = '${MARKUP_ADMIN}'`), 'Mallory b Bo');
  });

  test('is re-runnable', async () => {
    await db.exec(UPDATE_SCOPE_SQL);
    assert.strictEqual(
      await value(db, "SELECT count(*)::int FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profile_update_tenant'"),
      1
    );
    assert.strictEqual(
      await value(db, "SELECT to_regprocedure('public.is_company_admin()') IS NOT NULL"),
      true
    );
    assert.strictEqual(
      await value(db, "SELECT to_regprocedure('public.create_company_and_admin(uuid, text, text, text)') IS NOT NULL"),
      true
    );
    await asRole(db, 'authenticated', ADMIN_A, async () => {
      assert.strictEqual(
        (await db.query(`UPDATE public.profiles SET name = 'Tech A Edited' WHERE id = '${TECH_A}'`)).affectedRows,
        1
      );
    });
    await asRole(db, 'authenticated', TECH_A, async () => {
      assert.strictEqual(
        (await db.query(`UPDATE public.profiles SET name = 'Re-run' WHERE id = '${ADMIN_A}'`)).affectedRows,
        0
      );
    });
  });
});

describe('037 terms acceptance and free trial', () => {
  let db;
  let companyId;

  const TERMS_ADMIN = '44444444-4444-4444-4444-444444444441';
  const EXTEND_ADMIN = '44444444-4444-4444-4444-444444444442';
  const CLAMP_HIGH_ADMIN = '44444444-4444-4444-4444-444444444443';
  const CLAMP_LOW_ADMIN = '44444444-4444-4444-4444-444444444444';
  const BILLING_ADMIN = '44444444-4444-4444-4444-444444444445';
  const ORPHAN_ADMIN = '44444444-4444-4444-4444-444444444446';

  // 036 enforces company-name uniqueness inside the RPC, so every company
  // provisioned here needs its own distinct name.
  const provision = (uid, companyName) =>
    asRole(db, 'authenticated', uid, () =>
      value(db, `SELECT public.create_company_and_admin('${uid}', '${companyName}', 'Trial Admin', '0400111222')`)
    );

  const trialDays = (id) =>
    value(db, `SELECT round(extract(epoch FROM (trial_ends_at - trial_started_at)) / 86400)::int FROM public.companies WHERE id = '${id}'`);

  before(async () => {
    db = await createFixtureDb();
    await db.exec(TENANT_HELPER);
    await db.exec(CATCHUP_SQL);
    await db.exec(HARDENING_SQL);
    await db.query(`INSERT INTO auth.users (id, email) VALUES
      ('${TERMS_ADMIN}', 'trial-terms@example.com'),
      ('${EXTEND_ADMIN}', 'trial-extend@example.com'),
      ('${CLAMP_HIGH_ADMIN}', 'trial-high@example.com'),
      ('${CLAMP_LOW_ADMIN}', 'trial-low@example.com'),
      ('${BILLING_ADMIN}', 'trial-billing@example.com'),
      ('${ORPHAN_ADMIN}', 'trial-orphan@example.com')`);
    await db.exec(NAME_SQL);
    await db.exec(TRIAL_SQL);
  });

  after(async () => {
    await db.close();
  });

  test('adds the terms column and the four trial columns', async () => {
    assert.strictEqual(
      await value(db, "SELECT count(*)::int FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'terms_accepted_at'"),
      1
    );
    for (const column of ['trial_started_at', 'trial_ends_at', 'subscription_status', 'subscription_tier']) {
      assert.strictEqual(
        await value(db, `SELECT count(*)::int FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = '${column}'`),
        1,
        `companies.${column} is missing`
      );
    }
  });

  test('indexes the trial clock only for trialing rows', async () => {
    assert.strictEqual(
      await value(db, "SELECT count(*)::int FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'companies_trial_ends_idx'"),
      1
    );
    assert.match(
      await value(db, "SELECT indexdef FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'companies_trial_ends_idx'"),
      /trialing/i
    );
  });

  test('both functions refuse a session with no user', async () => {
    await assert.rejects(() => db.query('SELECT public.record_terms_acceptance()'), /must be signed in/i);
    await assert.rejects(() => db.query('SELECT public.start_cloud_trial()'), /must be signed in/i);
  });

  test('anon cannot execute either function', async () => {
    await asRole(db, 'anon', null, async () => {
      await assert.rejects(() => db.query('SELECT public.record_terms_acceptance()'), /permission denied/);
      await assert.rejects(() => db.query('SELECT public.start_cloud_trial()'), /permission denied/);
    });
  });

  test('records acceptance against the caller profile only', async () => {
    companyId = await provision(TERMS_ADMIN, 'Trial Terms Co');
    assert.match(companyId, /^[0-9a-f-]{36}$/);
    assert.strictEqual(
      await value(db, `SELECT terms_accepted_at IS NULL FROM public.profiles WHERE id = '${TERMS_ADMIN}'`),
      true
    );

    const stamp = await asRole(db, 'authenticated', TERMS_ADMIN, () => value(db, 'SELECT public.record_terms_acceptance()'));
    assert.ok(stamp, 'record_terms_acceptance() should return the acceptance timestamp');

    assert.strictEqual(
      await value(db, `SELECT terms_accepted_at IS NOT NULL FROM public.profiles WHERE id = '${TERMS_ADMIN}'`),
      true
    );
    assert.strictEqual(
      await value(db, `SELECT terms_accepted_at IS NULL FROM public.profiles WHERE id = '${ADMIN_A}'`),
      true
    );
  });

  test('a retry returns the original date instead of overwriting it', async () => {
    // Comparing the second call against the first would pass even if both
    // rewrote now(), so the sentinel date is what actually proves the no-op.
    await db.query(`UPDATE public.profiles SET terms_accepted_at = timestamptz '2020-01-02 03:04:05+00' WHERE id = '${TERMS_ADMIN}'`);

    assert.strictEqual(
      await asRole(db, 'authenticated', TERMS_ADMIN, () =>
        value(db, `SELECT public.record_terms_acceptance() = timestamptz '2020-01-02 03:04:05+00'`)
      ),
      true
    );
    assert.strictEqual(
      await value(db, `SELECT terms_accepted_at = timestamptz '2020-01-02 03:04:05+00' FROM public.profiles WHERE id = '${TERMS_ADMIN}'`),
      true
    );
  });

  test('a signed-in user with no profile row gets nothing back, not an error', async () => {
    assert.strictEqual(
      await asRole(db, 'authenticated', ORPHAN_ADMIN, () => value(db, 'SELECT public.record_terms_acceptance()')),
      null
    );
  });

  test('starts a 14 day trial on the caller company', async () => {
    const ends = await asRole(db, 'authenticated', TERMS_ADMIN, () => value(db, 'SELECT public.start_cloud_trial()'));
    assert.ok(ends, 'start_cloud_trial() should return the trial end');

    assert.strictEqual(await value(db, `SELECT subscription_status FROM public.companies WHERE id = '${companyId}'`), 'trialing');
    assert.strictEqual(await value(db, `SELECT subscription_tier FROM public.companies WHERE id = '${companyId}'`), 'cloud');
    assert.strictEqual(await value(db, `SELECT trial_started_at IS NOT NULL FROM public.companies WHERE id = '${companyId}'`), true);
    assert.strictEqual(await trialDays(companyId), 14);

    // A second call is a no-op that hands back the same end date.
    assert.strictEqual(
      await asRole(db, 'authenticated', TERMS_ADMIN, () =>
        value(db, `SELECT public.start_cloud_trial() = trial_ends_at FROM public.companies WHERE id = '${companyId}'`)
      ),
      true
    );
  });

  test('never restarts or extends a trial that has already begun', async () => {
    const startedCompany = await provision(EXTEND_ADMIN, 'Trial Extend Co');
    await db.query(`UPDATE public.companies
                       SET trial_started_at = timestamptz '2020-01-01 00:00:00+00',
                           trial_ends_at = timestamptz '2020-01-15 00:00:00+00',
                           subscription_status = 'trialing'
                     WHERE id = '${startedCompany}'`);

    assert.strictEqual(
      await asRole(db, 'authenticated', EXTEND_ADMIN, () =>
        value(db, `SELECT public.start_cloud_trial(90) = timestamptz '2020-01-15 00:00:00+00'`)
      ),
      true
    );
    assert.strictEqual(
      await value(db, `SELECT (trial_ends_at = timestamptz '2020-01-15 00:00:00+00') AND (trial_started_at = timestamptz '2020-01-01 00:00:00+00') FROM public.companies WHERE id = '${startedCompany}'`),
      true
    );
  });

  test('clamps the requested length between 1 and 90 days', async () => {
    const highCompany = await provision(CLAMP_HIGH_ADMIN, 'Trial Clamp High Co');
    const lowCompany = await provision(CLAMP_LOW_ADMIN, 'Trial Clamp Low Co');

    await asRole(db, 'authenticated', CLAMP_HIGH_ADMIN, () => db.query('SELECT public.start_cloud_trial(500)'));
    await asRole(db, 'authenticated', CLAMP_LOW_ADMIN, () => db.query('SELECT public.start_cloud_trial(0)'));

    assert.strictEqual(await trialDays(highCompany), 90);
    assert.strictEqual(await trialDays(lowCompany), 1);
  });

  test('refuses a trial when the account has no company', async () => {
    await asRole(db, 'authenticated', ORPHAN_ADMIN, async () => {
      await assert.rejects(() => db.query('SELECT public.start_cloud_trial()'), /No company is linked/i);
    });
  });

  test('refuses a free trial once billing history exists', async () => {
    const payingCompany = await provision(BILLING_ADMIN, 'Trial Billing Co');
    await db.query(`UPDATE public.companies SET stripe_customer_id = 'cus_test_123' WHERE id = '${payingCompany}'`);

    await asRole(db, 'authenticated', BILLING_ADMIN, async () => {
      await assert.rejects(() => db.query('SELECT public.start_cloud_trial()'), /billing history/i);
    });
    assert.strictEqual(
      await value(db, `SELECT trial_ends_at IS NULL FROM public.companies WHERE id = '${payingCompany}'`),
      true
    );
  });

  test('is re-runnable and leaves a started trial untouched', async () => {
    const before = await value(db, `SELECT trial_ends_at::text FROM public.companies WHERE id = '${companyId}'`);

    await db.exec(TRIAL_SQL);

    assert.strictEqual(await value(db, "SELECT to_regprocedure('public.record_terms_acceptance()') IS NOT NULL"), true);
    assert.strictEqual(await value(db, "SELECT to_regprocedure('public.start_cloud_trial(integer)') IS NOT NULL"), true);
    assert.strictEqual(
      await value(db, "SELECT count(*)::int FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'companies_trial_ends_idx'"),
      1
    );
    assert.strictEqual(await value(db, `SELECT trial_ends_at::text FROM public.companies WHERE id = '${companyId}'`), before);
  });

  // This harness deliberately does not run 025_subscription_billing.sql, so on its
  // own it proves nothing about the live trigger that freezes the billing columns
  // for a caller holding a real JWT. Install that guard verbatim - plus the four
  // columns its body reads - and check the trial still lands. Without the
  // relay.admin_provision opt-in inside start_cloud_trial() the second test below
  // fails with trial_ends_at written and subscription_status left NULL, which is a
  // brand new account being sent to the paywall with its trial already burned.
  describe('037 under the 025 billing guard', () => {
    const GUARD_ADMIN = '44444444-4444-4444-4444-444444444447';
    let guardedCompanyId;

    const BILLING_GUARD_SQL = `
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS stripe_subscription_id text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS subscription_seats integer;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS subscription_current_period_end timestamptz;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS subscription_updated_at timestamptz;

CREATE OR REPLACE FUNCTION public.companies_billing_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL
     OR current_setting('relay.admin_provision', true) = 'true' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.subscription_tier               := NULL;
    NEW.subscription_status             := NULL;
    NEW.stripe_customer_id              := NULL;
    NEW.stripe_subscription_id          := NULL;
    NEW.subscription_seats              := NULL;
    NEW.subscription_current_period_end := NULL;
    NEW.subscription_updated_at         := NULL;
    RETURN NEW;
  END IF;

  NEW.subscription_tier               := OLD.subscription_tier;
  NEW.subscription_status             := OLD.subscription_status;
  NEW.stripe_customer_id              := OLD.stripe_customer_id;
  NEW.stripe_subscription_id          := OLD.stripe_subscription_id;
  NEW.subscription_seats              := OLD.subscription_seats;
  NEW.subscription_current_period_end := OLD.subscription_current_period_end;
  NEW.subscription_updated_at         := OLD.subscription_updated_at;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS companies_billing_guard_biu ON public.companies;
CREATE TRIGGER companies_billing_guard_biu
  BEFORE INSERT OR UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.companies_billing_guard();
`;

    before(async () => {
      await db.exec(BILLING_GUARD_SQL);
      await db.query(`INSERT INTO auth.users (id, email) VALUES ('${GUARD_ADMIN}', 'trial-guard@example.com')`);
      guardedCompanyId = await provision(GUARD_ADMIN, 'Trial Guard Co');
    });

    test('the guard really is installed and freezes a signed-in billing write', async () => {
      await db.exec(`SELECT set_config('request.jwt.claim.sub', '${GUARD_ADMIN}', false);`);
      try {
        assert.strictEqual(
          await value(db, `UPDATE public.companies SET subscription_status = 'active' WHERE id = '${guardedCompanyId}' RETURNING subscription_status`),
          null
        );
      } finally {
        await db.exec("SELECT set_config('request.jwt.claim.sub', '', false);");
      }
    });

    test('start_cloud_trial still writes trialing through the guard', async () => {
      const ends = await asRole(db, 'authenticated', GUARD_ADMIN, () =>
        value(db, 'SELECT public.start_cloud_trial()')
      );
      assert.ok(ends, 'start_cloud_trial() should return the trial end');
      assert.strictEqual(await value(db, `SELECT subscription_status FROM public.companies WHERE id = '${guardedCompanyId}'`), 'trialing');
      assert.strictEqual(await value(db, `SELECT subscription_tier FROM public.companies WHERE id = '${guardedCompanyId}'`), 'cloud');
      assert.strictEqual(await value(db, `SELECT trial_started_at IS NOT NULL FROM public.companies WHERE id = '${guardedCompanyId}'`), true);
      assert.strictEqual(await trialDays(guardedCompanyId), 14);
    });
  });
});

describe('040 leads pipeline fields', () => {
  const PIPELINE_COLUMNS = [
    'phone',
    'email',
    'assigned_to',
    'sales_rep_name',
    'stage_history',
    'next_action_date',
  ];

  let db;

  before(async () => {
    db = await createFixtureDb();
    // Run twice: the migration ships as ADD COLUMN IF NOT EXISTS so a project
    // that already picked up some of these columns by hand must not abort.
    await db.exec(LEADS_PIPELINE_SQL);
    await db.exec(LEADS_PIPELINE_SQL);
  });

  after(async () => {
    await db.close();
  });

  test('adds exactly the six pipeline columns, idempotently', async () => {
    assert.strictEqual(
      await value(
        db,
        `SELECT count(*)::int FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'leads'
            AND column_name IN (${PIPELINE_COLUMNS.map((c) => `'${c}'`).join(', ')})`
      ),
      PIPELINE_COLUMNS.length
    );
  });

  test('every added column is nullable so existing rows survive', async () => {
    assert.strictEqual(
      await value(
        db,
        `SELECT count(*)::int FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'leads'
            AND column_name IN (${PIPELINE_COLUMNS.map((c) => `'${c}'`).join(', ')})
            AND is_nullable = 'YES'`
      ),
      PIPELINE_COLUMNS.length
    );
  });

  test('column types match what the client sends', async () => {
    assert.strictEqual(
      await value(db, "SELECT data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'phone'"),
      'text'
    );
    assert.strictEqual(
      await value(db, "SELECT data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'assigned_to'"),
      'text'
    );
    assert.strictEqual(
      await value(db, "SELECT data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'sales_rep_name'"),
      'text'
    );
    assert.strictEqual(
      await value(db, "SELECT data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'stage_history'"),
      'jsonb'
    );
    assert.strictEqual(
      await value(db, "SELECT data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'next_action_date'"),
      'date'
    );
  });

  test('stage_history defaults to an empty json array', async () => {
    const defaultValue = await value(
      db,
      "SELECT column_default FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'stage_history'"
    );
    assert.ok(
      typeof defaultValue === 'string' && defaultValue.includes("'[]'"),
      `stage_history default should be '[]'::jsonb, got ${defaultValue}`
    );
    assert.strictEqual(
      await value(db, "SELECT (stage_history = '[]'::jsonb) FROM public.leads WHERE message = 'B lead'"),
      true
    );
  });

  test('no backfill is attempted and existing rows keep their data', async () => {
    assert.strictEqual(
      await value(db, "SELECT count(*)::int FROM public.leads WHERE message = 'B lead'"),
      1
    );
    assert.strictEqual(
      await value(db, "SELECT next_action_date IS NULL FROM public.leads WHERE message = 'B lead'"),
      true
    );
    assert.strictEqual(
      await value(db, "SELECT phone IS NULL AND email IS NULL AND assigned_to IS NULL AND sales_rep_name IS NULL FROM public.leads WHERE message = 'B lead'"),
      true
    );
  });
});

describe('041 leads activity log', () => {
  let db;

  before(async () => {
    db = await createFixtureDb();
    // Run twice: the migration ships as ADD COLUMN IF NOT EXISTS so a project
    // that already added the column by hand must not abort.
    await db.exec(LEADS_ACTIVITY_SQL);
    await db.exec(LEADS_ACTIVITY_SQL);
  });

  after(async () => {
    await db.close();
  });

  test('adds the activity_log column, idempotently', async () => {
    assert.strictEqual(
      await value(
        db,
        `SELECT count(*)::int FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'leads'
            AND column_name = 'activity_log'`
      ),
      1
    );
  });

  test('the column is nullable so existing rows survive', async () => {
    assert.strictEqual(
      await value(
        db,
        `SELECT is_nullable FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'leads'
            AND column_name = 'activity_log'`
      ),
      'YES'
    );
  });

  test('the column type is jsonb because the client sends an array', async () => {
    assert.strictEqual(
      await value(db, "SELECT data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'activity_log'"),
      'jsonb'
    );
  });

  test('activity_log defaults to an empty json array', async () => {
    const defaultValue = await value(
      db,
      "SELECT column_default FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'activity_log'"
    );
    assert.ok(
      typeof defaultValue === 'string' && defaultValue.includes("'[]'"),
      `activity_log default should be '[]'::jsonb, got ${defaultValue}`
    );
    assert.strictEqual(
      await value(db, "SELECT (activity_log = '[]'::jsonb) FROM public.leads WHERE message = 'B lead'"),
      true
    );
  });

  test('no backfill is attempted and existing rows keep their data', async () => {
    assert.strictEqual(
      await value(db, "SELECT count(*)::int FROM public.leads WHERE message = 'B lead'"),
      1
    );
    assert.strictEqual(
      await value(db, "SELECT message FROM public.leads WHERE message = 'B lead'"),
      'B lead'
    );
    assert.strictEqual(
      await value(db, "SELECT jsonb_array_length(activity_log) FROM public.leads WHERE message = 'B lead'"),
      0
    );
  });

  test('the column round trips the entry array the lead detail page writes', async () => {
    const entry = JSON.stringify([{
      id: 'lead_activity_probe',
      content: 'Site visit booked',
      files: [{ name: 'photo.png', size: 2048, type: 'image/png', data: 'data:image/png;base64,AAAA' }],
      date: '2026-10-02T00:00:00.000Z',
      author: 'Josh Preview',
    }]);
    await db.exec(`UPDATE public.leads SET activity_log = '${entry}'::jsonb WHERE message = 'B lead'`);

    assert.strictEqual(
      await value(db, "SELECT jsonb_array_length(activity_log) FROM public.leads WHERE message = 'B lead'"),
      1
    );
    assert.strictEqual(
      await value(db, "SELECT activity_log -> 0 ->> 'author' FROM public.leads WHERE message = 'B lead'"),
      'Josh Preview'
    );
    assert.strictEqual(
      await value(db, "SELECT activity_log -> 0 ->> 'content' FROM public.leads WHERE message = 'B lead'"),
      'Site visit booked'
    );
    assert.strictEqual(
      await value(db, "SELECT activity_log -> 0 -> 'files' -> 0 ->> 'name' FROM public.leads WHERE message = 'B lead'"),
      'photo.png'
    );

    await db.exec("UPDATE public.leads SET activity_log = '[]'::jsonb WHERE message = 'B lead'");
  });
});
