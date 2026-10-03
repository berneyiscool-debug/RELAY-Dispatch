-- =====================================================================
-- 034_ai_pooled_caps.sql
--
-- Apply AFTER 031_spend_and_signup_hardening.sql (and 032). Safe to re-run:
-- every statement is idempotent.
--
-- The AI budget was capped per *company* only (a flat 500 requests/day), so a
-- single seat could spend the whole day's allowance and the cap could not tell
-- who spent it. relay-copilot now enforces a pooled per-company allowance PLUS
-- a per-user ceiling, which needs the caller on the ledger row.
--
-- This migration only adds that column and its lookup index. RLS is unchanged:
-- api_usage is still service-role only (see 031), written exclusively by the
-- edge functions that hold the service key. Deliberately no client policy.
-- =====================================================================

-- Nullable: every pre-existing row has no user, and a future non-user-scoped
-- proxy call is still a valid ledger row.
ALTER TABLE public.api_usage
  ADD COLUMN IF NOT EXISTS user_id uuid;

-- The per-user ceiling counts one user's day; the pool counts the whole
-- company's. 031's (company_id, kind, created_at DESC) index still serves the
-- pool, this one serves the ceiling.
CREATE INDEX IF NOT EXISTS api_usage_user_daily_idx
  ON public.api_usage (user_id, kind, created_at DESC);

-- ---------------------------------------------------------------------
-- VERIFICATION - every row must read "ok"
-- ---------------------------------------------------------------------
WITH checks AS (
  SELECT 'api_usage exists' AS check_name,
         to_regclass('public.api_usage') IS NOT NULL AS ok
  UNION ALL
  SELECT 'api_usage.user_id exists and is a nullable uuid',
         EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_schema = 'public'
             AND table_name = 'api_usage'
             AND column_name = 'user_id'
             AND data_type = 'uuid'
             AND is_nullable = 'YES'
         )
  UNION ALL
  SELECT 'the per-user daily index exists',
         EXISTS (
           SELECT 1 FROM pg_indexes
           WHERE schemaname = 'public'
             AND tablename = 'api_usage'
             AND indexname = 'api_usage_user_daily_idx'
         )
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
)
SELECT check_name,
       CASE WHEN ok THEN 'ok' ELSE 'FAIL' END AS verdict
FROM checks
ORDER BY verdict ASC, check_name;
