-- =====================================================================
-- 030 - RLS HARDENING  (launch blocker)
-- =====================================================================
-- WHY THIS EXISTS
--   The live project enforces no row level security for the public key that
--   ships inside the app bundle. Probed against the live database: that key
--   could read every row of every tenant table (customers, jobs, invoices,
--   timesheets, staff email addresses, pay rates) and could INSERT into them.
--   Signups auto-confirm, so a stranger can register, write their own profile
--   row, and attach themselves to any company.
--
-- WHAT IT DOES  (six steps, all idempotent)
--   1. Ensures the public.get_user_company_id(uuid) tenant helper exists.
--   2. Turns row level security ON for every table in the public schema.
--   3. Drops EVERY existing policy in the public schema. The live policies
--      cannot be listed from outside the database, and Postgres OR-s policies
--      together - a single leftover permissive policy would silently undo the
--      whole fix. So they are all removed and the canonical set rebuilt.
--   4. Recreates the canonical tenant policies (authenticated only, WITH CHECK
--      so a row can never be re-pointed at another company).
--   5. Applies the signup-trigger and profile-guard hardening from migration
--      020, which was never applied to the live project.
--   6. Closes the system_locks write path (also from 020).
--
-- ORDER
--   Run 029_schema_catchup.sql first, then this file. Both are idempotent and
--   safe to re-run. The order is not critical: 029 also enables RLS on the one
--   table it adds and creates that table's policy.
--
-- AFTER RUNNING
--   The last SELECT prints a per-table audit. Every row should say "ok", or
--   "LOCKED (service role only)" for tables only an edge function touches.
--   Anything saying FAIL must be looked at before launch.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. TENANT HELPER
-- ---------------------------------------------------------------------
-- SECURITY DEFINER so the lookup itself bypasses RLS: without that, every
-- policy would recurse back into profiles and fail.
CREATE OR REPLACE FUNCTION public.get_user_company_id(uid uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT company_id FROM public.profiles WHERE id = uid);
END;
$$;

-- ---------------------------------------------------------------------
-- 2. TURN RLS ON EVERYWHERE
-- ---------------------------------------------------------------------
DO $$
DECLARE
  r record;
  v_count integer := 0;
BEGIN
  FOR r IN
    SELECT c.relname AS name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r', 'p')
      AND c.relrowsecurity = false
      AND NOT EXISTS (
        SELECT 1 FROM pg_depend d WHERE d.objid = c.oid AND d.deptype = 'e'
      )
    ORDER BY c.relname
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', r.name);
    v_count := v_count + 1;
  END LOOP;
  RAISE NOTICE 'RLS enabled on % table(s).', v_count;
END $$;

-- ---------------------------------------------------------------------
-- 3. DROP EVERY EXISTING POLICY IN public
-- ---------------------------------------------------------------------
DO $$
DECLARE
  r record;
  v_count integer := 0;
BEGIN
  FOR r IN
    SELECT p.tablename, p.policyname
    FROM pg_policies p
    JOIN pg_class c ON c.relname = p.tablename
    JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = p.schemaname
    WHERE p.schemaname = 'public'
      AND NOT EXISTS (
        SELECT 1 FROM pg_depend d WHERE d.objid = c.oid AND d.deptype = 'e'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', r.policyname, r.tablename);
    v_count := v_count + 1;
  END LOOP;
  RAISE NOTICE 'Removed % legacy policy/policies.', v_count;
END $$;

-- ---------------------------------------------------------------------
-- 4. CANONICAL TENANT POLICIES
-- ---------------------------------------------------------------------

-- profiles ------------------------------------------------------------
-- Read your own row plus your colleagues'. Client INSERTs are refused (rows
-- are created by the auth trigger or by definer functions), and step 5
-- freezes company_id / role / user_type_id / pay_rate on update.
CREATE POLICY profile_select_own ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY profile_select_tenant ON public.profiles
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY profile_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY profile_update_tenant ON public.profiles
  FOR UPDATE TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

-- No DELETE policy on purpose. Removing a staff member is a deactivation
-- (`profiles.deactivated`), not a row delete, and nothing in the app or the
-- edge functions deletes a profile. Leaving DELETE ungranted means a rogue
-- client session cannot erase a colleague's profile or anyone's history.
-- The service role (edge functions, dashboard) is unaffected.

-- companies -----------------------------------------------------------
CREATE POLICY companies_tenant_policy ON public.companies
  FOR ALL TO authenticated
  USING (id = public.get_user_company_id(auth.uid()))
  WITH CHECK (id = public.get_user_company_id(auth.uid()));

-- every other table keyed by company_id --------------------------------
-- Derived from the catalog instead of a fixed list, so a table added later
-- cannot be forgotten. Tables without company_id are handled by step 6.
DO $$
DECLARE
  r record;
  v_count integer := 0;
  v_pred text;
BEGIN
  FOR r IN
    SELECT c.relname AS name,
           format_type(a.atttypid, a.atttypmod) AS company_id_type
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_attribute a
      ON a.attrelid = c.oid
     AND a.attname = 'company_id'
     AND a.attnum > 0
     AND NOT a.attisdropped
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r', 'p')
      AND c.relname NOT IN ('profiles', 'companies')
      AND NOT EXISTS (
        SELECT 1 FROM pg_depend d WHERE d.objid = c.oid AND d.deptype = 'e'
      )
    ORDER BY c.relname
  LOOP
    -- company_id is not always uuid: job_materials uses text. Comparing the two
    -- directly raises "operator does not exist: text = uuid" and rolls back this
    -- whole script, so the predicate has to match the column's real type.
    IF r.company_id_type = 'uuid' THEN
      v_pred := 'company_id = public.get_user_company_id(auth.uid())';
    ELSE
      v_pred := 'company_id::text = public.get_user_company_id(auth.uid())::text';
    END IF;

    EXECUTE format(
      'CREATE POLICY %I_tenant_policy ON public.%I
         FOR ALL TO authenticated
         USING (%s)
         WITH CHECK (%s);',
      r.name, r.name, v_pred, v_pred);
    v_count := v_count + 1;
  END LOOP;
  RAISE NOTICE 'Tenant policies created for % table(s).', v_count;
END $$;

-- ---------------------------------------------------------------------
-- 5. SIGNUP + PROFILE HARDENING (verbatim from 020_security_hardening.sql)
-- ---------------------------------------------------------------------
-- The live project still builds profiles from client-editable user_metadata,
-- which is the other half of the takeover path. Nothing here duplicates
-- step 4.

-- ---------------------------------------------------------------------
-- 1. SIGNUP / INVITE TRIGGER (replace)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  company_uuid uuid;
  user_name text;
  user_username text;
  user_phone text;
  user_role text;
  company_name text;
BEGIN
  -- Invitations: only raw_app_meta_data is trusted (set by the server-side
  -- admin API in the invite-user edge function). Clients can never write it.
  IF new.raw_app_meta_data IS NOT NULL THEN
    IF new.raw_app_meta_data ? 'company_id' THEN
      company_uuid := NULLIF(new.raw_app_meta_data->>'company_id', '')::uuid;
    END IF;
    user_name := new.raw_app_meta_data->>'name';
    user_username := new.raw_app_meta_data->>'username';
    user_phone := new.raw_app_meta_data->>'phone';
    user_role := COALESCE(new.raw_app_meta_data->>'role', 'technician');
  END IF;

  -- Never let an invitation payload mint an administrator.
  IF user_role IS DISTINCT FROM 'manager' AND user_role IS DISTINCT FROM 'technician' THEN
    user_role := 'technician';
  END IF;

  -- Self-signup: create a brand-new company for this user (their own tenant).
  IF company_uuid IS NULL AND new.raw_user_meta_data IS NOT NULL THEN
    company_name := new.raw_user_meta_data->>'company_name';
    IF company_name IS NOT NULL AND length(trim(company_name)) > 0 THEN
      INSERT INTO public.companies (name, settings)
      VALUES (company_name, '{"markupPercent": 20}'::jsonb)
      RETURNING id INTO company_uuid;
      user_role := 'admin';
      user_name := new.raw_user_meta_data->>'name';
      user_phone := new.raw_user_meta_data->>'phone';
    END IF;
  END IF;

  IF company_uuid IS NOT NULL THEN
    INSERT INTO public.profiles (id, company_id, name, email, username, phone, role)
    VALUES (new.id, company_uuid, user_name, new.email, user_username, user_phone, user_role);
  END IF;

  RETURN new;
END;
$$;

-- ---------------------------------------------------------------------
-- 2. PROFILES WRITE GUARD (block client-side abuse via REST API)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.profiles_security_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Service-role calls (edge functions) carry no user JWT and bypass the guard.
  -- The signup RPC opts in via the relay.admin_provision flag.
  IF auth.uid() IS NULL
     OR current_setting('relay.admin_provision', true) = 'true' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    RAISE EXCEPTION 'Profiles can only be created through signup or an administrator invitation.';
  END IF;

  -- UPDATE: server-managed columns cannot be changed by client sessions.
  NEW.company_id    := OLD.company_id;
  NEW.role          := OLD.role;
  NEW.user_type_id  := OLD.user_type_id;
  NEW.pay_rate      := OLD.pay_rate;
  NEW.deactivated   := OLD.deactivated;
  NEW.deactivated_at := OLD.deactivated_at;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_security_guard_biu ON public.profiles;
CREATE TRIGGER profiles_security_guard_biu
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_security_guard();

-- ---------------------------------------------------------------------
-- 2b. SIGNUP RPC (kept for legacy callers, now caller-checked)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_company_and_admin(
  user_id uuid,
  company_name text,
  admin_name text,
  admin_phone text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_company_id uuid;
BEGIN
  IF auth.uid() IS DISTINCT FROM user_id THEN
    RAISE EXCEPTION 'You can only provision your own company.';
  END IF;

  INSERT INTO companies (name, settings)
  VALUES (company_name, '{"markupPercent": 20}'::jsonb)
  RETURNING id INTO new_company_id;

  PERFORM set_config('relay.admin_provision', 'true', true);

  INSERT INTO profiles (id, company_id, name, email, phone, role)
  VALUES (
    user_id,
    new_company_id,
    admin_name,
    (SELECT email FROM auth.users WHERE id = user_id),
    admin_phone,
    'admin'
  );

  PERFORM set_config('relay.admin_provision', 'false', true);
  RETURN new_company_id;
END;
$$;

-- Grants are stated explicitly for every role that needs them (rather than
-- relying on the project's default privileges) so the functions keep working
-- for the app and for the edge functions after the PUBLIC grant is removed.
REVOKE EXECUTE ON FUNCTION public.create_company_and_admin(uuid, text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_company_and_admin(uuid, text, text, text) FROM anon;
GRANT  EXECUTE ON FUNCTION public.create_company_and_admin(uuid, text, text, text) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.create_company_and_admin(uuid, text, text, text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.get_user_company_id(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_company_id(uuid) FROM anon;
GRANT  EXECUTE ON FUNCTION public.get_user_company_id(uuid) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.get_user_company_id(uuid) TO service_role;

-- ---------------------------------------------------------------------
-- 6. SYSTEM LOCKS (verbatim from 020_security_hardening.sql)
-- ---------------------------------------------------------------------
-- Re-creates the authenticated read policy that step 3 removed, and takes
-- away the blanket write policy so only the definer RPCs can lock.

DROP POLICY IF EXISTS "Allow write access to all authenticated users on system_locks" ON public.system_locks;

DROP POLICY IF EXISTS "Allow read access to all authenticated users on system_locks" ON public.system_locks;
CREATE POLICY "Allow read access to all authenticated users on system_locks"
  ON public.system_locks FOR SELECT
  TO authenticated
  USING (true);

CREATE OR REPLACE FUNCTION public.acquire_lock(
    p_lock_name TEXT,
    p_user_id TEXT,
    p_timeout_seconds INTEGER
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_locked BOOLEAN;
    v_timeout INTEGER := LEAST(GREATEST(COALESCE(p_timeout_seconds, 60), 1), 300);
BEGIN
    INSERT INTO public.system_locks (lock_name, locked_at, locked_by, expires_at)
    VALUES (
        p_lock_name,
        NOW(),
        p_user_id,
        NOW() + (v_timeout || ' seconds')::INTERVAL
    )
    ON CONFLICT (lock_name) DO UPDATE
    SET
        locked_at = NOW(),
        locked_by = p_user_id,
        expires_at = NOW() + (v_timeout || ' seconds')::INTERVAL
    WHERE
        public.system_locks.locked_by IS NULL
        OR public.system_locks.expires_at < NOW();

    SELECT (locked_by = p_user_id) INTO v_locked
    FROM public.system_locks
    WHERE lock_name = p_lock_name;

    RETURN COALESCE(v_locked, FALSE);
END;
$$;

CREATE OR REPLACE FUNCTION public.release_lock(
    p_lock_name TEXT,
    p_user_id TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.system_locks
    SET locked_at = NULL,
        locked_by = NULL,
        expires_at = NULL
    WHERE lock_name = p_lock_name
      AND locked_by = p_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.acquire_lock(text, text, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.acquire_lock(text, text, integer) FROM anon;
GRANT  EXECUTE ON FUNCTION public.acquire_lock(text, text, integer) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.acquire_lock(text, text, integer) TO service_role;

REVOKE EXECUTE ON FUNCTION public.release_lock(text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.release_lock(text, text) FROM anon;
GRANT  EXECUTE ON FUNCTION public.release_lock(text, text) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.release_lock(text, text) TO service_role;

-- ---------------------------------------------------------------------
-- 7. AUDIT - read this result grid
-- ---------------------------------------------------------------------
WITH t AS (
  SELECT c.relname AS table_name,
         c.relrowsecurity AS rls_on,
         (SELECT count(*) FROM pg_policies p
           WHERE p.schemaname = 'public' AND p.tablename = c.relname) AS policies,
         (SELECT count(*) FROM pg_policies p
           WHERE p.schemaname = 'public' AND p.tablename = c.relname
             AND (p.roles::text LIKE '%anon%' OR p.roles::text LIKE '%public%')) AS anon_policies,
         EXISTS (
           SELECT 1 FROM information_schema.columns col
           WHERE col.table_schema = 'public'
             AND col.table_name = c.relname
             AND col.column_name = 'company_id'
         ) AS tenant_keyed
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind IN ('r', 'p')
    AND NOT EXISTS (
      SELECT 1 FROM pg_depend d WHERE d.objid = c.oid AND d.deptype = 'e'
    )
)
SELECT table_name,
       rls_on,
       policies,
       anon_policies,
       tenant_keyed,
       CASE
         WHEN NOT rls_on THEN 'FAIL - RLS is off'
         WHEN anon_policies > 0 THEN 'FAIL - policy open to anon'
         WHEN policies = 0 AND tenant_keyed THEN 'FAIL - tenant table has no policy'
         WHEN policies = 0 THEN 'LOCKED (service role only)'
         ELSE 'ok'
       END AS verdict
FROM t
ORDER BY verdict ASC, table_name;
