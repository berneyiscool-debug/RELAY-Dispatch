-- =====================================================================
-- 031_spend_and_signup_hardening.sql
--
-- Apply AFTER 029_schema_catchup.sql and 030_rls_hardening.sql. Safe to
-- re-run: every statement is idempotent.
--
-- Closes the two remaining items from the live-project audit. Both are
-- "no UX change" fixes - nothing a user can see or do differently.
--
--   1. api_usage - a per-tenant daily ledger so the AI and Maps proxies can
--      enforce a daily cap exactly the way relay-email already does. Without
--      it, one signed-up tenant can drain the shared DeepSeek budget and the
--      shared Google Maps quota for every other tenant. Service-role only:
--      no client ever reads or writes this table.
--
--   2. handle_new_user_profile() - the self-signup branch read
--      raw_user_meta_data->>'company_name' to mint a company plus an admin
--      profile. Client-editable metadata must never be trusted for that:
--      provisioning belongs in create_company_and_admin(), which is the only
--      path that checks auth.uid() = user_id. No shipped app flow sends that
--      metadata key (the launch screen and the Settings cloud upgrade both
--      call the RPC), so the branch was dead weight with a sharp edge. The
--      invitation path stays: raw_app_meta_data can only be written by the
--      server-side admin API.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. PER-TENANT SPEND LEDGER (service role only)
-- ---------------------------------------------------------------------
-- One row per billable proxy call. `units` is what the call spent: 1 for a
-- chat completion or a route, one per address for a geocode batch. Caps are
-- enforced by counting the day's units for the calling tenant's company.
CREATE TABLE IF NOT EXISTS public.api_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  kind text NOT NULL,
  units integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT api_usage_kind_check CHECK (kind IN ('copilot', 'geocode', 'route')),
  CONSTRAINT api_usage_units_check CHECK (units > 0)
);

CREATE INDEX IF NOT EXISTS api_usage_daily_cap_idx
  ON public.api_usage (company_id, kind, created_at DESC);

-- Deliberately no policies: only the edge functions (which hold the service
-- role key) may touch spend accounting. The same treatment as
-- relay_reserved_email_slugs.
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.api_usage FROM PUBLIC;
REVOKE ALL ON public.api_usage FROM anon;
REVOKE ALL ON public.api_usage FROM authenticated;
GRANT ALL ON public.api_usage TO service_role;

-- ---------------------------------------------------------------------
-- 2. SIGNUP TRIGGER (replace)
-- ---------------------------------------------------------------------
-- Same function as 030, minus the self-provision branch. Only server-written
-- metadata is considered, so a public signup can never pick its own tenant or
-- its own role - the RPC does that under an auth.uid() check.
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
BEGIN
  -- Invitations only: raw_app_meta_data is written by the server-side admin
  -- API and can never be set by a client. Anything a client can write is
  -- ignored here.
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

  IF company_uuid IS NOT NULL THEN
    INSERT INTO public.profiles (id, company_id, name, email, username, phone, role)
    VALUES (new.id, company_uuid, user_name, new.email, user_username, user_phone, user_role);
  END IF;

  RETURN new;
END;
$$;

-- The trigger fires as the table owner, so no client role needs EXECUTE.
REVOKE EXECUTE ON FUNCTION public.handle_new_user_profile() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_profile() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_profile() FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.handle_new_user_profile() TO service_role;

-- ---------------------------------------------------------------------
-- 3. VERIFICATION - every row must read "ok"
-- ---------------------------------------------------------------------
WITH checks AS (
  SELECT 'api_usage exists' AS check_name,
         to_regclass('public.api_usage') IS NOT NULL AS ok
  UNION ALL
  SELECT 'api_usage has RLS enabled',
         (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.api_usage'::regclass)
  UNION ALL
  SELECT 'api_usage has no client policy',
         (SELECT count(*) = 0 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'api_usage')
  UNION ALL
  SELECT 'clients cannot read or write api_usage',
         NOT has_table_privilege('anon', 'public.api_usage', 'SELECT')
         AND NOT has_table_privilege('authenticated', 'public.api_usage', 'SELECT')
         AND NOT has_table_privilege('anon', 'public.api_usage', 'INSERT')
         AND NOT has_table_privilege('authenticated', 'public.api_usage', 'INSERT')
  UNION ALL
  SELECT 'the service role can read and write api_usage',
         has_table_privilege('service_role', 'public.api_usage', 'SELECT')
         AND has_table_privilege('service_role', 'public.api_usage', 'INSERT')
  UNION ALL
  SELECT 'the signup trigger no longer reads client metadata',
         (SELECT prosrc NOT LIKE '%company_name%' FROM pg_proc WHERE proname = 'handle_new_user_profile')
  UNION ALL
  SELECT 'the signup trigger still trusts invitation metadata',
         (SELECT prosrc LIKE '%raw_app_meta_data%' FROM pg_proc WHERE proname = 'handle_new_user_profile')
  UNION ALL
  SELECT 'the signup trigger is not client-callable',
         NOT has_function_privilege('anon', 'public.handle_new_user_profile()', 'EXECUTE')
         AND NOT has_function_privilege('authenticated', 'public.handle_new_user_profile()', 'EXECUTE')
)
SELECT check_name,
       CASE WHEN ok THEN 'ok' ELSE 'FAIL' END AS verdict
FROM checks
ORDER BY verdict ASC, check_name;
