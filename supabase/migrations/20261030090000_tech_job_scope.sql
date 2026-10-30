-- =====================================================================
-- RELAY - lock technicians to their assigned jobs (Groundwork Decision 1)
-- =====================================================================
-- Every tenant policy checks company_id only, so any signed-in member of a
-- company can read and write all of its data: invoices, quotes, price lists,
-- customer portal tokens, password-reset tokens, everyone's timesheets.
-- Groundwork puts technician logins on phones, so that boundary has to move
-- into the database before the first tech signs in.
--
-- Agreed 2026-10-30 (docs/GROUNDWORK_PLAN.md in the Groundwork repo):
-- a technician sees their assigned jobs, plus a read-only search of
-- customers and sites. Prices, invoices and other techs' jobs stay hidden.
--
-- How:
--   * "Office user" = role 'admin' or 'manager' and not deactivated. Every
--     other signed-in user, including any role the app doesn't know, gets
--     the technician scope. Failing closed is deliberate: role is free text
--     today (invite-user writes whatever it is sent).
--   * The existing permissive *_tenant_policy rows are left exactly as they
--     are. This file only ADDS restrictive policies, which Postgres ANDs on
--     top, so the company check still applies everywhere and nothing an
--     office user can do changes.
--   * Customer search goes through search_customers_for_tech(), which
--     returns contact and site columns only. Direct table access would hand
--     a tech portal_token and portal_passcode for every customer.
--   * Techs can't approve their own hours: a trigger keeps the approval
--     columns on time_clocks and timesheets out of a tech's reach.
--
-- profiles.role cannot be raised by its owner: profiles_security_guard()
-- (031) freezes role, company_id, user_type_id, pay_rate and deactivated on
-- every client-session update, so the office check can trust it.
--
-- Safe to run twice: every policy is dropped before it is created, and the
-- table loops skip tables a database doesn't have.
--
-- After applying, this must return no rows (a tenant table with no
-- restrictive policy is one this file doesn't know about yet):
--   SELECT c.relname FROM pg_class c
--     JOIN pg_namespace n ON n.oid = c.relnamespace
--    WHERE n.nspname = 'public' AND c.relkind = 'r'
--      AND EXISTS (SELECT 1 FROM information_schema.columns col
--                   WHERE col.table_schema = 'public' AND col.table_name = c.relname
--                     AND col.column_name = 'company_id')
--      AND EXISTS (SELECT 1 FROM pg_policies p
--                   WHERE p.schemaname = 'public' AND p.tablename = c.relname
--                     AND p.permissive = 'PERMISSIVE')
--      AND NOT EXISTS (SELECT 1 FROM pg_policies p
--                   WHERE p.schemaname = 'public' AND p.tablename = c.relname
--                     AND p.permissive = 'RESTRICTIVE');
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. OFFICE HELPER
-- ---------------------------------------------------------------------
-- SECURITY DEFINER for the same reason as is_company_admin() (039): it is
-- called from policies, including the one on profiles, so a plain lookup
-- would re-enter RLS. It reads auth.uid() itself and takes no arguments, so
-- it can't be used to probe another user's role.
CREATE OR REPLACE FUNCTION public.is_office_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
      FROM public.profiles
     WHERE id = auth.uid()
       AND role IN ('admin', 'manager')
       AND COALESCE(deactivated, false) = false
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.is_office_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_office_user() FROM anon;
GRANT  EXECUTE ON FUNCTION public.is_office_user() TO authenticated;
GRANT  EXECUTE ON FUNCTION public.is_office_user() TO service_role;

-- ---------------------------------------------------------------------
-- 2. OFFICE-ONLY TABLES
-- ---------------------------------------------------------------------
-- Nothing in G1 needs these from a phone. Money (invoices, quotes, purchase
-- orders, stock and job_materials carry prices), tokens (customers,
-- password_reset_requests), other people's work, and office tooling.
-- Groundwork features that need part of one (materials, forms, todos) get a
-- narrow path of their own when they're built.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'assets', 'contractor_metrics', 'contractor_profile', 'contractors',
    'cost_centers', 'customers', 'deputy_routines', 'deputy_threads',
    'documents', 'email_log', 'expected_work_roster_dismissals',
    'expected_work_rosters', 'form_instances', 'form_templates', 'invoices',
    'job_materials', 'kit_types', 'kits', 'lead_claims', 'leads',
    'location_types', 'maintenance_plans', 'notifications',
    'password_reset_requests', 'portal_access_log', 'projects',
    'purchase_orders', 'quotes', 'stock', 'storage_locations', 'suppliers',
    'task_templates', 'todos', 'trusted_contractors', 'xero_sync_jobs'
  ] LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_office_only', t);
      EXECUTE format(
        'CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR ALL TO authenticated '
        'USING (public.is_office_user()) WITH CHECK (public.is_office_user())',
        t || '_office_only', t);
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- 3. READ-ONLY FOR TECHS
-- ---------------------------------------------------------------------
-- companies: Groundwork shows the company name. user_types: Dispatch reads
-- the signed-in user's permission set at boot.
DO $$
DECLARE
  t text;
  cmd text;
BEGIN
  FOREACH t IN ARRAY ARRAY['companies', 'user_types'] LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      FOREACH cmd IN ARRAY ARRAY['insert', 'update', 'delete'] LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_office_' || cmd, t);
        EXECUTE format(
          'CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR %s TO authenticated %s',
          t || '_office_' || cmd, t, upper(cmd),
          CASE cmd
            WHEN 'insert' THEN 'WITH CHECK (public.is_office_user())'
            WHEN 'update' THEN 'USING (public.is_office_user()) WITH CHECK (public.is_office_user())'
            ELSE 'USING (public.is_office_user())'
          END);
      END LOOP;
    END IF;
  END LOOP;
END $$;

-- activity_log is company-wide audit text, so techs may add to it (the
-- action layer logs what they do) but not read it.
DROP POLICY IF EXISTS activity_log_office_select ON public.activity_log;
CREATE POLICY activity_log_office_select ON public.activity_log
  AS RESTRICTIVE FOR SELECT TO authenticated
  USING (public.is_office_user());

-- profiles: a tech sees their own row only (the table holds everyone's
-- pay_rate). Updates are already limited to the own row or an admin (039).
DROP POLICY IF EXISTS profiles_tech_select_own ON public.profiles;
CREATE POLICY profiles_tech_select_own ON public.profiles
  AS RESTRICTIVE FOR SELECT TO authenticated
  USING (public.is_office_user() OR id = auth.uid());

-- ---------------------------------------------------------------------
-- 4. ASSIGNED ROWS
-- ---------------------------------------------------------------------
-- technician_id is text holding the profile id (every assigned live row
-- matches a profile).
--
-- jobs: read and update the jobs assigned to you. WITH CHECK keeps the job
-- assigned to you, so a tech can't hand a job to someone else. Creating and
-- deleting jobs stays with the office.
DROP POLICY IF EXISTS jobs_tech_assigned ON public.jobs;
CREATE POLICY jobs_tech_assigned ON public.jobs
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.is_office_user() OR technician_id = auth.uid()::text)
  WITH CHECK (public.is_office_user() OR technician_id = auth.uid()::text);

DROP POLICY IF EXISTS jobs_office_insert ON public.jobs;
CREATE POLICY jobs_office_insert ON public.jobs
  AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (public.is_office_user());

DROP POLICY IF EXISTS jobs_office_delete ON public.jobs;
CREATE POLICY jobs_office_delete ON public.jobs
  AS RESTRICTIVE FOR DELETE TO authenticated
  USING (public.is_office_user());

-- schedule: read your own bookings; the office does the scheduling.
DROP POLICY IF EXISTS schedule_tech_assigned ON public.schedule;
CREATE POLICY schedule_tech_assigned ON public.schedule
  AS RESTRICTIVE FOR SELECT TO authenticated
  USING (public.is_office_user() OR technician_id = auth.uid()::text);

DO $$
DECLARE cmd text;
BEGIN
  FOREACH cmd IN ARRAY ARRAY['insert', 'update', 'delete'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.schedule', 'schedule_office_' || cmd);
    EXECUTE format(
      'CREATE POLICY %I ON public.schedule AS RESTRICTIVE FOR %s TO authenticated %s',
      'schedule_office_' || cmd, upper(cmd),
      CASE cmd
        WHEN 'insert' THEN 'WITH CHECK (public.is_office_user())'
        WHEN 'update' THEN 'USING (public.is_office_user()) WITH CHECK (public.is_office_user())'
        ELSE 'USING (public.is_office_user())'
      END);
  END LOOP;
END $$;

-- time_clocks and timesheets: your own time, which you record yourself.
-- Deleting a record stays with the office.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['time_clocks', 'timesheets'] LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_tech_own', t);
      EXECUTE format(
        'CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR ALL TO authenticated '
        'USING (public.is_office_user() OR technician_id = auth.uid()::text) '
        'WITH CHECK (public.is_office_user() OR technician_id = auth.uid()::text)',
        t || '_tech_own', t);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_office_delete', t);
      EXECUTE format(
        'CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR DELETE TO authenticated '
        'USING (public.is_office_user())',
        t || '_office_delete', t);
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- 5. TECHS CAN'T APPROVE THEIR OWN HOURS
-- ---------------------------------------------------------------------
-- Row policies can't protect single columns, so a trigger does: for a
-- signed-in non-office user, approval fields are reset on insert and kept
-- as they were on update. Service-role callers (auth.uid() IS NULL) and
-- office users are untouched.
CREATE OR REPLACE FUNCTION public.time_approval_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_office_user() THEN
    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'time_clocks' THEN
    IF TG_OP = 'INSERT' THEN
      NEW.approval_status := 'pending';
      NEW.approved_hours  := NULL;
      NEW.approved_by     := NULL;
      NEW.approved_at     := NULL;
      NEW.note            := NULL;
    ELSE
      NEW.approval_status := OLD.approval_status;
      NEW.approved_hours  := OLD.approved_hours;
      NEW.approved_by     := OLD.approved_by;
      NEW.approved_at     := OLD.approved_at;
      NEW.note            := OLD.note;
    END IF;
  ELSIF TG_TABLE_NAME = 'timesheets' THEN
    IF TG_OP = 'INSERT' THEN
      NEW.approved_by := NULL;
      IF lower(COALESCE(NEW.status, '')) IN ('approved', 'adjusted', 'rejected') THEN
        NEW.status := NULL;
      END IF;
    ELSE
      NEW.status      := OLD.status;
      NEW.approved_by := OLD.approved_by;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['time_clocks', 'timesheets'] LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', t || '_approval_guard_biu', t);
      EXECUTE format(
        'CREATE TRIGGER %I BEFORE INSERT OR UPDATE ON public.%I '
        'FOR EACH ROW EXECUTE FUNCTION public.time_approval_guard()',
        t || '_approval_guard_biu', t);
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- 6. CUSTOMER AND SITE SEARCH
-- ---------------------------------------------------------------------
-- The read-only search from Decision 1, for any active user of the company.
-- Returns contact and site details only: never portal_token,
-- portal_passcode or the Xero link. LIKE wildcards in the query are escaped,
-- and short queries return nothing so the whole list can't be paged out.
CREATE OR REPLACE FUNCTION public.search_customers_for_tech(p_query text)
RETURNS TABLE (
  id text,
  company text,
  first_name text,
  last_name text,
  email text,
  phone text,
  address text,
  sites jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_company uuid := public.get_user_company_id(auth.uid());
  v_query text := btrim(COALESCE(p_query, ''));
  v_pattern text;
BEGIN
  IF v_company IS NULL OR length(v_query) < 2 THEN
    RETURN;
  END IF;
  IF EXISTS (SELECT 1 FROM public.profiles pr
              WHERE pr.id = auth.uid() AND COALESCE(pr.deactivated, false)) THEN
    RETURN;
  END IF;

  v_pattern := '%' || replace(replace(replace(v_query, '\', '\\'), '%', '\%'), '_', '\_') || '%';

  RETURN QUERY
    SELECT c.id, c.company, c.first_name, c.last_name, c.email, c.phone, c.address, c.sites
      FROM public.customers c
     WHERE c.company_id = v_company
       AND (   c.company ILIKE v_pattern
            OR c.first_name ILIKE v_pattern
            OR c.last_name ILIKE v_pattern
            OR (COALESCE(c.first_name, '') || ' ' || COALESCE(c.last_name, '')) ILIKE v_pattern
            OR c.phone ILIKE v_pattern
            OR c.address ILIKE v_pattern
            OR c.sites::text ILIKE v_pattern)
     ORDER BY COALESCE(NULLIF(c.company, ''), c.last_name, c.first_name)
     LIMIT 25;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.search_customers_for_tech(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.search_customers_for_tech(text) FROM anon;
GRANT  EXECUTE ON FUNCTION public.search_customers_for_tech(text) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.search_customers_for_tech(text) TO service_role;
