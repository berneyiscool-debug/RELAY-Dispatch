-- =====================================================================
-- RELAY - lock down service-only RPCs
-- =====================================================================
-- These SECURITY DEFINER functions are only ever called with the service
-- role key (ops scripts and the lead-claim Edge Function), but Supabase
-- grants EXECUTE to anon and authenticated directly, so revoking PUBLIC
-- alone left them callable by anyone through /rest/v1/rpc:
--   resolve_company    - returns any company's id, name, email slug and
--                        Stripe Connect account id.
--   reserve_lead_slot  - changes marketplace_leads.filled_slots / status.
--   release_lead_slot  - same, in reverse.
--   lead_clock_sweep   - forfeits overdue claims and lapses leads.
-- Guarded so it is a no-op on databases without the lead marketplace.
DO $$
DECLARE fn text;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'public.resolve_company(text)',
    'public.reserve_lead_slot(text)',
    'public.release_lead_slot(text)',
    'public.lead_clock_sweep()'
  ] LOOP
    IF to_regprocedure(fn) IS NOT NULL THEN
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn);
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn);
    END IF;
  END LOOP;
END $$;
