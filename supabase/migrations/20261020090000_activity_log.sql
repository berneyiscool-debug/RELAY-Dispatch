-- Free-text activity trail (quote -> job conversions, job form saves, lead
-- stage changes, and the action layer's audit log via logActivity). The client
-- collection is `activity`; until now it had no table, so in Cloud every entry
-- lived only in the in-memory cache and was gone on reload or on another device.
--
-- It is permanent history, so it is append-only: the app inserts one row per
-- entry, and signed-in users get SELECT and INSERT but no UPDATE or DELETE.
-- Rows only go when their company is deleted (ON DELETE CASCADE).
-- Records are linked generically by record_type / record_id because the trail
-- spans leads, jobs, quotes, invoices, todos, purchase orders and more.
CREATE TABLE IF NOT EXISTS public.activity_log (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  type text,
  text text,
  status text,
  record_type text,
  record_id text,
  actor_name text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS activity_log_company_occurred_idx
  ON public.activity_log (company_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS activity_log_record_idx
  ON public.activity_log (company_id, record_type, record_id);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS activity_log_tenant_policy ON public.activity_log;
CREATE POLICY activity_log_tenant_policy
  ON public.activity_log
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));
REVOKE ALL ON public.activity_log FROM anon, authenticated;
GRANT SELECT, INSERT ON public.activity_log TO authenticated;
