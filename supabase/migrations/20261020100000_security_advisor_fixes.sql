-- =====================================================================
-- RELAY - security advisor fixes (2026-10-20)
-- =====================================================================
-- Clears the security advisor findings that can be fixed without changing
-- what the app does. Every statement is guarded, so the migration is a no-op
-- for objects a database does not have, and it is safe to run twice.
--
-- Callers were checked in src/ and supabase/functions before revoking:
--   trusted_directory              - no reader anywhere in the repo.
--   notify_stripe_cleanup()        - trigger on companies (trg_cleanup_stripe).
--   rls_auto_enable()              - event trigger (ensure_rls).
--   relay_company_email_slug_trigger() - trigger on companies.
--   create_company_and_admin(text,text,text) - legacy overload; the client
--                                    calls the (user_id, ...) overload.
--   delete_company_and_auth(uuid)  - no caller; the delete-company Edge
--                                    Function does this with the service role.
-- Trigger and event-trigger functions are fired without an EXECUTE check
-- on the role that caused them, so revoking EXECUTE does not stop them.
--
-- Left as is on purpose: company_name_available (anon) is the live
-- name check on the sign-up form, before the user has a session.

-- 1. trusted_directory ran as its owner (postgres), so it bypassed RLS on
--    trusted_contractors and companies, and anon held every privilege on it.
--    Run it as the caller instead, and take it away from anon entirely.
DO $$
BEGIN
  IF to_regclass('public.trusted_directory') IS NOT NULL THEN
    ALTER VIEW public.trusted_directory SET (security_invoker = true);
    REVOKE ALL ON public.trusted_directory FROM PUBLIC, anon, authenticated;
    GRANT SELECT ON public.trusted_directory TO authenticated;
    GRANT ALL ON public.trusted_directory TO service_role;
  END IF;
END $$;

-- 2. Functions nothing should call through /rest/v1/rpc.
DO $$
DECLARE fn text;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'public.notify_stripe_cleanup()',
    'public.rls_auto_enable()',
    'public.relay_company_email_slug_trigger()',
    'public.create_company_and_admin(text,text,text)',
    'public.delete_company_and_auth(uuid)'
  ] LOOP
    IF to_regprocedure(fn) IS NOT NULL THEN
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn);
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn);
    END IF;
  END LOOP;
END $$;

-- 3. Pin search_path on the functions that did not set one. The two pure
--    text helpers only use built-ins; the others read public tables.
DO $$
DECLARE
  fn text;
  path text;
BEGIN
  FOR fn, path IN VALUES
    ('public.relay_email_slugify(text)',             'pg_catalog'),
    ('public.relay_company_name_key(text)',          'pg_catalog'),
    ('public.relay_assign_email_slug(text,uuid)',    'public'),
    ('public.relay_company_email_slug_trigger()',    'public'),
    ('public.create_company_and_admin(text,text,text)', 'public')
  LOOP
    IF to_regprocedure(fn) IS NOT NULL THEN
      EXECUTE format('ALTER FUNCTION %s SET search_path = %s', fn, path);
    END IF;
  END LOOP;
END $$;
