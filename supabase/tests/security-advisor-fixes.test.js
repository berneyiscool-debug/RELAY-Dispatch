import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';

const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations');
const ADVISOR_SQL = readFileSync(join(MIGRATIONS_DIR, '20261020100000_security_advisor_fixes.sql'), 'utf8');
const LOCKS_SQL = readFileSync(join(MIGRATIONS_DIR, '20261020100100_scope_system_locks.sql'), 'utf8');

const COMPANY_A = '00000000-0000-0000-0000-00000000000a';
const COMPANY_B = '00000000-0000-0000-0000-00000000000b';
const ADMIN_A = '11111111-1111-1111-1111-111111111111';
const ADMIN_B = '22222222-2222-2222-2222-222222222222';
const TECH_A = '33333333-3333-3333-3333-333333333333';

// The live project's objects as they stood on 2026-10-20, trimmed to what the
// migrations touch. Several of them were never committed to the repo, so they
// are reproduced here from the live definitions (the Stripe call is stubbed).
const FIXTURE = `
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE SCHEMA auth;
CREATE TABLE auth.users (id uuid PRIMARY KEY, email text);
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $fn$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid
$fn$;
GRANT USAGE ON SCHEMA auth, public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;

CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text, settings jsonb,
  phone text, email text, address text, email_slug text,
  stripe_customer_id text, stripe_subscription_id text, stripe_connect_account_id text
);
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY, company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  name text, email text, phone text, role text
);
CREATE TABLE public.trusted_contractors (company_id uuid REFERENCES public.companies(id), status text, trades text[]);
CREATE TABLE public.relay_reserved_email_slugs (slug text PRIMARY KEY);
CREATE TABLE public.system_locks (lock_name text PRIMARY KEY, locked_at timestamptz, locked_by text, expires_at timestamptz);
CREATE TABLE public.stripe_cleanup_calls (company_id uuid);

CREATE OR REPLACE FUNCTION public.get_user_company_id(uid uuid)
  RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
    SELECT company_id FROM public.profiles WHERE id = uid
  $fn$;

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY companies_tenant_policy ON public.companies FOR ALL TO authenticated
  USING (id = public.get_user_company_id(auth.uid()));
ALTER TABLE public.trusted_contractors ENABLE ROW LEVEL SECURITY;
CREATE POLICY trusted_contractors_tenant_policy ON public.trusted_contractors FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));
ALTER TABLE public.relay_reserved_email_slugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_locks ENABLE ROW LEVEL SECURITY;
CREATE POLICY system_locks_read ON public.system_locks FOR SELECT TO authenticated USING (true);

CREATE VIEW public.trusted_directory AS
  SELECT tc.company_id, c.name AS business_name, c.phone, c.email, c.address, tc.trades
    FROM public.trusted_contractors tc JOIN public.companies c ON c.id = tc.company_id
   WHERE tc.status = 'approved';

CREATE OR REPLACE FUNCTION public.relay_email_slugify(txt text) RETURNS text LANGUAGE sql IMMUTABLE AS $fn$
  SELECT substr(regexp_replace(lower(coalesce(txt, '')), '[^a-z0-9]', '', 'g'), 1, 40);
$fn$;
CREATE OR REPLACE FUNCTION public.relay_company_name_key(p_name text) RETURNS text LANGUAGE sql IMMUTABLE AS $fn$
  SELECT btrim(regexp_replace(lower(coalesce(p_name, '')), '\\s+', ' ', 'g'))
$fn$;
CREATE INDEX companies_name_key_idx ON public.companies (public.relay_company_name_key(name));
CREATE OR REPLACE FUNCTION public.relay_assign_email_slug(p_name text, p_company_id uuid)
  RETURNS text LANGUAGE plpgsql AS $fn$
DECLARE base text; candidate text; n int := 1;
BEGIN
  base := public.relay_email_slugify(p_name);
  IF length(base) < 3 THEN base := 'co' || substr(replace(p_company_id::text, '-', ''), 1, 10); END IF;
  candidate := base;
  WHILE EXISTS (SELECT 1 FROM companies WHERE lower(email_slug) = candidate AND id <> p_company_id)
     OR EXISTS (SELECT 1 FROM relay_reserved_email_slugs WHERE slug = candidate)
  LOOP n := n + 1; candidate := base || n::text; END LOOP;
  RETURN candidate;
END $fn$;
CREATE OR REPLACE FUNCTION public.relay_company_email_slug_trigger() RETURNS trigger LANGUAGE plpgsql AS $fn$
BEGIN
  IF NEW.email_slug IS NULL OR NEW.email_slug = '' THEN
    NEW.email_slug := public.relay_assign_email_slug(NEW.name, NEW.id);
  END IF;
  RETURN NEW;
END $fn$;
CREATE TRIGGER company_email_slug_biu BEFORE INSERT OR UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.relay_company_email_slug_trigger();

CREATE OR REPLACE FUNCTION public.notify_stripe_cleanup() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN
  IF coalesce(btrim(old.stripe_customer_id), '') <> '' THEN
    INSERT INTO public.stripe_cleanup_calls (company_id) VALUES (old.id);
  END IF;
  RETURN old;
END $fn$;
CREATE TRIGGER trg_cleanup_stripe AFTER DELETE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.notify_stripe_cleanup();

CREATE OR REPLACE FUNCTION public.rls_auto_enable() RETURNS event_trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $fn$ BEGIN END $fn$;

CREATE OR REPLACE FUNCTION public.create_company_and_admin(company_name text, admin_name text, admin_phone text)
  RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $fn$
DECLARE new_company_id uuid;
BEGIN
  INSERT INTO companies (name, settings) VALUES (company_name, '{}'::jsonb) RETURNING id INTO new_company_id;
  INSERT INTO profiles (id, company_id, name, phone, role) VALUES (auth.uid(), new_company_id, admin_name, admin_phone, 'admin');
  RETURN new_company_id;
END $fn$;

CREATE OR REPLACE FUNCTION public.delete_company_and_auth(p_company_id uuid)
  RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN
  IF (SELECT role FROM profiles WHERE id = auth.uid() AND company_id = p_company_id) IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Only the administrator of this company can delete it.';
  END IF;
  DELETE FROM companies WHERE id = p_company_id;
END $fn$;

CREATE OR REPLACE FUNCTION public.company_name_available(p_name text)
  RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT public.relay_company_name_key(p_name) <> ''
     AND NOT EXISTS (SELECT 1 FROM public.companies c
                      WHERE public.relay_company_name_key(c.name) = public.relay_company_name_key(p_name))
$fn$;

-- The pre-fix lock RPCs (030_rls_hardening.sql).
CREATE OR REPLACE FUNCTION public.acquire_lock(p_lock_name text, p_user_id text, p_timeout_seconds integer)
  RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE v_locked boolean; v_timeout integer := LEAST(GREATEST(COALESCE(p_timeout_seconds, 60), 1), 300);
BEGIN
  INSERT INTO public.system_locks (lock_name, locked_at, locked_by, expires_at)
  VALUES (p_lock_name, NOW(), p_user_id, NOW() + (v_timeout || ' seconds')::INTERVAL)
  ON CONFLICT (lock_name) DO UPDATE SET locked_at = NOW(), locked_by = p_user_id,
    expires_at = NOW() + (v_timeout || ' seconds')::INTERVAL
  WHERE public.system_locks.locked_by IS NULL OR public.system_locks.expires_at < NOW();
  SELECT (locked_by = p_user_id) INTO v_locked FROM public.system_locks WHERE lock_name = p_lock_name;
  RETURN COALESCE(v_locked, FALSE);
END $fn$;
CREATE OR REPLACE FUNCTION public.release_lock(p_lock_name text, p_user_id text)
  RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN
  UPDATE public.system_locks SET locked_at = NULL, locked_by = NULL, expires_at = NULL
   WHERE lock_name = p_lock_name AND locked_by = p_user_id;
END $fn$;

INSERT INTO public.companies (id, name, email_slug, stripe_customer_id) VALUES
  ('${COMPANY_A}', 'Alpha Electrical', 'alpha', 'cus_alpha'),
  ('${COMPANY_B}', 'Bravo Plumbing', 'bravo', NULL);
INSERT INTO public.profiles (id, company_id, role) VALUES
  ('${ADMIN_A}', '${COMPANY_A}', 'admin'),
  ('${ADMIN_B}', '${COMPANY_B}', 'admin'),
  ('${TECH_A}', '${COMPANY_A}', 'technician');
INSERT INTO public.trusted_contractors (company_id, status, trades) VALUES
  ('${COMPANY_A}', 'approved', ARRAY['electrical']),
  ('${COMPANY_B}', 'approved', ARRAY['plumbing']);
`;

let db;

async function asRole(role, userId, callback) {
  await db.exec(`RESET ROLE; SELECT set_config('request.jwt.claim.sub', '${userId || ''}', false); SET ROLE ${role};`);
  try {
    return await callback();
  } finally {
    await db.exec("RESET ROLE; SELECT set_config('request.jwt.claim.sub', '', false);");
  }
}

async function value(sql) {
  const { rows } = await db.query(sql);
  return Object.values(rows[0])[0];
}

const REVOKED = [
  'public.notify_stripe_cleanup()',
  'public.rls_auto_enable()',
  'public.relay_company_email_slug_trigger()',
  'public.create_company_and_admin(text,text,text)',
  'public.delete_company_and_auth(uuid)',
];

describe('security advisor fixes', () => {
  before(async () => {
    db = new PGlite();
    await db.exec(FIXTURE);
    // Twice: re-running on a project where it already landed must not abort.
    await db.exec(ADVISOR_SQL);
    await db.exec(ADVISOR_SQL);
    await db.exec(LOCKS_SQL);
    await db.exec(LOCKS_SQL);
  });

  after(async () => {
    await db.close();
  });

  test('is a no-op on a database without the objects', async () => {
    const bare = new PGlite();
    try {
      await bare.exec(`
        CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN;
      `);
      await bare.exec(ADVISOR_SQL);
    } finally {
      await bare.close();
    }
  });

  describe('trusted_directory', () => {
    test('runs as the caller', async () => {
      const options = await value(
        "SELECT reloptions::text FROM pg_class WHERE oid = 'public.trusted_directory'::regclass"
      );
      assert.match(options, /security_invoker=true/);
    });

    test('anon has no access and signed-in users can only read', async () => {
      assert.equal(await value("SELECT has_table_privilege('anon', 'public.trusted_directory', 'SELECT')"), false);
      for (const priv of ['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE']) {
        assert.equal(
          await value(`SELECT has_table_privilege('authenticated', 'public.trusted_directory', '${priv}')`),
          false,
          priv
        );
      }
      await asRole('anon', null, async () => {
        await assert.rejects(db.query('SELECT * FROM public.trusted_directory'), /permission denied/);
      });
    });

    test("a signed-in user no longer sees other companies' contact details", async () => {
      await asRole('authenticated', ADMIN_A, async () => {
        const { rows } = await db.query('SELECT company_id FROM public.trusted_directory');
        assert.deepEqual(rows, [{ company_id: COMPANY_A }]);
      });
    });
  });

  describe('function grants', () => {
    for (const fn of REVOKED) {
      test(`${fn} is not callable by anon or signed-in users`, async () => {
        for (const role of ['anon', 'authenticated']) {
          assert.equal(await value(`SELECT has_function_privilege('${role}', '${fn}', 'EXECUTE')`), false, role);
        }
        assert.equal(await value(`SELECT has_function_privilege('service_role', '${fn}', 'EXECUTE')`), true);
      });
    }

    test('signed-in users get permission denied on the legacy RPCs', async () => {
      await asRole('authenticated', ADMIN_A, async () => {
        await assert.rejects(
          db.query(`SELECT public.delete_company_and_auth('${COMPANY_A}')`),
          /permission denied/
        );
        await assert.rejects(
          db.query("SELECT public.create_company_and_admin('Sneaky Co', 'x', 'y')"),
          /permission denied/
        );
      });
    });

    test('company_name_available stays open to the sign-up form', async () => {
      assert.equal(await value("SELECT has_function_privilege('anon', 'public.company_name_available(text)', 'EXECUTE')"), true);
      await asRole('anon', null, async () => {
        assert.equal(await value("SELECT public.company_name_available('alpha  ELECTRICAL')"), false);
        assert.equal(await value("SELECT public.company_name_available('Charlie Roofing')"), true);
      });
    });
  });

  describe('triggers still fire without EXECUTE', () => {
    test('the email slug trigger assigns a slug on a signed-in update', async () => {
      await asRole('authenticated', ADMIN_B, async () => {
        await db.exec(`UPDATE public.companies SET name = 'Bravo Plumbing & Gas', email_slug = NULL WHERE id = '${COMPANY_B}'`);
      });
      assert.equal(await value(`SELECT email_slug FROM public.companies WHERE id = '${COMPANY_B}'`), 'bravoplumbinggas');
    });

    test('the Stripe cleanup trigger fires when a company is deleted', async () => {
      await db.exec(`INSERT INTO public.companies (id, name, email_slug, stripe_customer_id)
        VALUES ('00000000-0000-0000-0000-0000000000cc', 'Gone Co', 'gone', 'cus_gone')`);
      await db.exec(`INSERT INTO public.profiles (id, company_id, role)
        VALUES ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-0000000000cc', 'admin')`);
      await asRole('authenticated', '44444444-4444-4444-4444-444444444444', async () => {
        await db.exec("DELETE FROM public.companies WHERE id = '00000000-0000-0000-0000-0000000000cc'");
      });
      assert.equal(
        await value("SELECT count(*)::int FROM public.stripe_cleanup_calls WHERE company_id = '00000000-0000-0000-0000-0000000000cc'"),
        1
      );
    });
  });

  test('pins search_path on every flagged function', async () => {
    const { rows } = await db.query(`
      SELECT p.oid::regprocedure::text AS fn, array_to_string(p.proconfig, ',') AS config
        FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
       WHERE n.nspname = 'public'
         AND p.proname IN ('relay_email_slugify', 'relay_assign_email_slug',
                           'relay_company_email_slug_trigger', 'create_company_and_admin',
                           'relay_company_name_key')
       ORDER BY 1
    `);
    assert.equal(rows.length, 5);
    for (const row of rows) assert.match(row.config || '', /^search_path=/, row.fn);
  });

  test('the name-key index is still used after pinning search_path', async () => {
    await db.exec('SET enable_seqscan = off');
    try {
      const { rows } = await db.query(
        "EXPLAIN SELECT 1 FROM public.companies WHERE public.relay_company_name_key(name) = 'alpha electrical'"
      );
      assert.match(rows.map((r) => r['QUERY PLAN']).join('\n'), /companies_name_key_idx/);
    } finally {
      await db.exec('RESET enable_seqscan');
    }
  });

  describe('company-scoped locks', () => {
    test('two companies can each hold the maintenance lock', async () => {
      await asRole('authenticated', ADMIN_A, async () => {
        assert.equal(await value(`SELECT public.acquire_lock('maintenance_engine', '${ADMIN_A}', 30)`), true);
      });
      await asRole('authenticated', ADMIN_B, async () => {
        assert.equal(await value(`SELECT public.acquire_lock('maintenance_engine', '${ADMIN_B}', 30)`), true);
      });
      const { rows } = await db.query("SELECT lock_name FROM public.system_locks WHERE locked_by IS NOT NULL ORDER BY 1");
      assert.deepEqual(rows.map((r) => r.lock_name), [
        `${COMPANY_A}:maintenance_engine`,
        `${COMPANY_B}:maintenance_engine`,
      ]);
    });

    test('a second user in the same company is still locked out', async () => {
      await asRole('authenticated', TECH_A, async () => {
        assert.equal(await value(`SELECT public.acquire_lock('maintenance_engine', '${TECH_A}', 30)`), false);
      });
    });

    test("a caller cannot act as another user", async () => {
      await asRole('authenticated', ADMIN_B, async () => {
        await assert.rejects(
          db.query(`SELECT public.acquire_lock('maintenance_engine', '${ADMIN_A}', 30)`),
          /only take a lock for yourself/
        );
        await assert.rejects(
          db.query(`SELECT public.release_lock('maintenance_engine', '${ADMIN_A}')`),
          /only release your own lock/
        );
      });
    });

    test('the holder can release its own lock', async () => {
      await asRole('authenticated', ADMIN_A, async () => {
        await db.exec(`SELECT public.release_lock('maintenance_engine', '${ADMIN_A}')`);
      });
      assert.equal(
        await value(`SELECT locked_by FROM public.system_locks WHERE lock_name = '${COMPANY_A}:maintenance_engine'`),
        null
      );
    });

    test('service-role callers keep the raw lock name', async () => {
      await asRole('service_role', null, async () => {
        assert.equal(await value("SELECT public.acquire_lock('nightly_job', 'ops', 30)"), true);
      });
      assert.equal(await value("SELECT locked_by FROM public.system_locks WHERE lock_name = 'nightly_job'"), 'ops');
    });

    test('anon cannot call the lock RPCs', async () => {
      assert.equal(await value("SELECT has_function_privilege('anon', 'public.acquire_lock(text,text,integer)', 'EXECUTE')"), false);
      assert.equal(await value("SELECT has_function_privilege('anon', 'public.release_lock(text,text)', 'EXECUTE')"), false);
    });
  });
});
