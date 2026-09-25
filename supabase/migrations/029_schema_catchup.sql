-- =====================================================================
-- 029 — SCHEMA CATCH-UP (repair production drift)
-- =====================================================================
-- The live project was built incrementally and its objects drifted: 025-028
-- are present, but 014, 019 and the tail of 015 never landed, and neither did
-- the `dashboard_layout` column from the schema.sql baseline. The app only
-- finds out at runtime (404 on password_reset_requests, 400 on
-- profiles.dashboard_layout / leads.* / notifications.*).
--
-- Everything below is idempotent and purely additive: it creates missing
-- tables and columns only, and never reads, rewrites or deletes existing rows.
-- It is safe to paste into the Supabase SQL editor and safe to run twice.
--
-- Deliberately NOT included: migration 016's `llm_usage` table. It is
-- referenced nowhere in src/ or supabase/functions/ (per-request usage logging
-- was dropped when every AI call was consolidated behind the relay-copilot
-- edge function), and it is not part of the store's collection contract, so
-- the app would never touch it. Better to leave dead schema uncreated.

-- ---------------------------------------------------------------------
-- 014 — password_reset_requests (upserted by migrateLocalToCloud)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.password_reset_requests (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id uuid REFERENCES companies ON DELETE CASCADE NOT NULL,
  technician_id text,
  employee_id text,
  requested_at timestamp with time zone DEFAULT now(),
  status text DEFAULT 'Pending',
  token text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY has no IF NOT EXISTS, so drop-then-create keeps this re-runnable.
-- Scoped to `authenticated` with WITH CHECK, matching 020_security_hardening.sql
-- (which replaces this exact policy name when it is applied).
DROP POLICY IF EXISTS password_reset_requests_tenant_policy ON public.password_reset_requests;
CREATE POLICY password_reset_requests_tenant_policy ON public.password_reset_requests
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

CREATE INDEX IF NOT EXISTS password_reset_requests_company_idx
  ON public.password_reset_requests(company_id);

-- ---------------------------------------------------------------------
-- schema.sql baseline — dashboard layout persistence
-- ---------------------------------------------------------------------
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dashboard_layout jsonb;

-- ---------------------------------------------------------------------
-- 015 tail — leads companion columns (tenants whose leads table predates 012)
-- ---------------------------------------------------------------------
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS budget       numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS requirements text;

-- ---------------------------------------------------------------------
-- 019 — leads origin (Internal vs Marketplace)
-- ---------------------------------------------------------------------
ALTER TABLE leads ADD COLUMN IF NOT EXISTS origin text DEFAULT 'Internal';

-- ---------------------------------------------------------------------
-- 015 tail — notifications maintenance-engine payload
-- ---------------------------------------------------------------------
-- message became optional in 015 so a notification can carry a rich payload.
ALTER TABLE notifications ALTER COLUMN message DROP NOT NULL;

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS maintenance_plan_id      text,
  ADD COLUMN IF NOT EXISTS merged_plan_ids          jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS task_template_id         text,
  ADD COLUMN IF NOT EXISTS merged_task_template_ids jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS quote_id                 text,
  ADD COLUMN IF NOT EXISTS target_service_date      date,
  ADD COLUMN IF NOT EXISTS current_meter_at_trigger numeric,
  ADD COLUMN IF NOT EXISTS merged_materials_list    jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS total_labor_hrs          numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_labor_cost         numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_material_cost      numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_by               text;

-- ---------------------------------------------------------------------
-- VERIFY — every row should report is_present = true
-- ---------------------------------------------------------------------
WITH expected(tbl, col) AS (
  VALUES
    ('profiles', 'dashboard_layout'),
    ('leads', 'budget'),
    ('leads', 'requirements'),
    ('leads', 'origin'),
    ('notifications', 'maintenance_plan_id'),
    ('notifications', 'merged_plan_ids'),
    ('notifications', 'task_template_id'),
    ('notifications', 'merged_task_template_ids'),
    ('notifications', 'quote_id'),
    ('notifications', 'target_service_date'),
    ('notifications', 'current_meter_at_trigger'),
    ('notifications', 'merged_materials_list'),
    ('notifications', 'total_labor_hrs'),
    ('notifications', 'total_labor_cost'),
    ('notifications', 'total_material_cost'),
    ('notifications', 'created_by')
)
SELECT (e.tbl || '.' || e.col) AS object_name,
       (c.column_name IS NOT NULL) AS is_present
FROM expected e
LEFT JOIN information_schema.columns c
  ON c.table_schema = 'public'
 AND c.table_name = e.tbl
 AND c.column_name = e.col
UNION ALL
SELECT 'password_reset_requests (table)',
       (to_regclass('public.password_reset_requests') IS NOT NULL);
