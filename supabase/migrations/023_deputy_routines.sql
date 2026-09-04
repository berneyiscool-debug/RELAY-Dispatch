-- =====================================================================
-- DEPUTY ROUTINES (Deputy Max — automated recurring Deputy actions)
-- =====================================================================
-- A Routine pairs a human-readable trigger (every X hours/days, once per
-- morning, on new chat) with a natural-language instruction the Deputy runs
-- whenever the trigger fires. The `trigger` jsonb shape is:
--   { type: 'interval' | 'morning' | 'new_chat', interval?: number, unit?: 'minutes'|'hours'|'days' }

CREATE TABLE deputy_routines (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id uuid REFERENCES companies ON DELETE CASCADE NOT NULL,
  title text NOT NULL DEFAULT 'New routine',
  trigger jsonb NOT NULL DEFAULT '{"type":"interval","interval":1,"unit":"days"}'::jsonb,
  prompt text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT true,
  last_run_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE deputy_routines ENABLE ROW LEVEL SECURITY;
CREATE POLICY deputy_routines_tenant_policy ON deputy_routines
  FOR ALL
  USING (company_id = public.get_user_company_id(auth.uid()));

CREATE INDEX deputy_routines_company_idx ON deputy_routines(company_id);
CREATE INDEX deputy_routines_company_updated_idx ON deputy_routines(company_id, updated_at DESC);
