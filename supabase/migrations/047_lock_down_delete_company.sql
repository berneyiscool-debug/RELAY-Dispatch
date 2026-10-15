-- =====================================================================
-- LOCK DOWN delete_company (security)
-- =====================================================================
-- public.delete_company(text) is an operator cleanup tool: SECURITY DEFINER,
-- with no authorization check, deleting a company, every row it owns and
-- its users' auth accounts. It is meant for the SQL editor (see
-- scratch/delete-one-company.sql), but like every new function it was
-- executable by PUBLIC, so anon and signed-in users could call it through
-- /rest/v1/rpc/delete_company with only the public API key.
--
-- Applied to production 2026-10-14 (migration lock_down_delete_company);
-- verified anon / authenticated get "permission denied". The owner (SQL
-- editor) and service_role keep EXECUTE.
--
-- Guarded so it is a no-op where the function doesn't exist (fresh schemas).

DO $$
BEGIN
  IF to_regprocedure('public.delete_company(text)') IS NOT NULL THEN
    REVOKE ALL ON FUNCTION public.delete_company(text) FROM PUBLIC;
    REVOKE ALL ON FUNCTION public.delete_company(text) FROM anon;
    REVOKE ALL ON FUNCTION public.delete_company(text) FROM authenticated;
    GRANT EXECUTE ON FUNCTION public.delete_company(text) TO service_role;
  END IF;
END
$$;
