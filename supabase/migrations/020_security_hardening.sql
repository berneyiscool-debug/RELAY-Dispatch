-- =====================================================================
-- SECURITY HARDENING (v1.3.x)
-- =====================================================================
-- 1. The auth signup trigger no longer trusts client-editable user_metadata
--    for company membership or role. Invitations now arrive via app_metadata
--    (only the server-side admin API can write it), and self-signups create
--    their OWN company via user_metadata.company_name.
-- 2. Client sessions can no longer INSERT profiles or change privileged
--    profile columns (company_id, role, user_type_id, pay_rate, deactivated)
--    through the public REST API.
-- 3. All tenant policies are restricted to the authenticated role and gain
--    WITH CHECK so rows cannot be reassigned to another company.
-- 4. System locks can no longer be written cross-tenant by clients.
-- 5. SECURITY DEFINER functions are pinned to search_path and their EXECUTE
--    grants narrowed from PUBLIC to authenticated.

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

REVOKE EXECUTE ON FUNCTION public.create_company_and_admin(uuid, text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_company_and_admin(uuid, text, text, text) FROM anon;
GRANT  EXECUTE ON FUNCTION public.create_company_and_admin(uuid, text, text, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_user_company_id(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_company_id(uuid) FROM anon;
GRANT  EXECUTE ON FUNCTION public.get_user_company_id(uuid) TO authenticated;

-- ---------------------------------------------------------------------
-- 3. TENANT POLICIES: authenticated-only + WITH CHECK
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS profile_self_policy ON public.profiles;
DROP POLICY IF EXISTS profile_tenant_policy ON public.profiles;

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

CREATE POLICY profile_delete_tenant ON public.profiles
  FOR DELETE TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()) AND id <> auth.uid());

-- companies historically used the singular name "company_tenant_policy"
DROP POLICY IF EXISTS company_tenant_policy ON public.companies;
DROP POLICY IF EXISTS companies_tenant_policy ON public.companies;
CREATE POLICY companies_tenant_policy ON public.companies
  FOR ALL TO authenticated
  USING (id = public.get_user_company_id(auth.uid()))
  WITH CHECK (id = public.get_user_company_id(auth.uid()));

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'user_types','customers','assets','maintenance_plans',
    'task_templates','quotes','jobs','invoices','stock','timesheets',
    'contractors','suppliers','purchase_orders','notifications',
    'form_templates','form_instances','kits','documents',
    'cost_centers','projects','schedule','email_log','leads',
    'job_materials','password_reset_requests','storage_locations','kit_types'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_tenant_policy ON public.%I;', t, t);
    EXECUTE format(
      'CREATE POLICY %I_tenant_policy ON public.%I
         FOR ALL TO authenticated
         USING (company_id = public.get_user_company_id(auth.uid()))
         WITH CHECK (company_id = public.get_user_company_id(auth.uid()));',
      t, t
    );
  END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- 4. SYSTEM LOCKS: clients can read, only the definer RPCs can write
-- ---------------------------------------------------------------------
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

REVOKE EXECUTE ON FUNCTION public.release_lock(text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.release_lock(text, text) FROM anon;
GRANT  EXECUTE ON FUNCTION public.release_lock(text, text) TO authenticated;
