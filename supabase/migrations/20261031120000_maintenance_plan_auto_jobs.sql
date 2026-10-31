-- =====================================================================
-- MAINTENANCE PLANS: CREATE THE JOB, AND LEAD TIME (20261031120000)
-- =====================================================================
-- Two per-plan settings for when a maintenance plan comes due
-- (src/utils/maintenanceEngine.js raiseDueMaintenance):
--
--   auto_create_job  true: the engine converts the "Recurring Job Due"
--                    notification into a job straight away, as "Dispatch Job"
--                    would. false (default, and every existing plan): the
--                    notification waits for the office, as before.
--   lead_days        Calendar plans: how many days before the due date the
--                    work is raised (0-365). NULL means the default of 7,
--                    the window the engine always used.
--
-- Both default to today's behaviour, so existing rows need no backfill. The
-- maintenance_plans RLS policies already scope every row by company_id.
--
-- MUST be applied with the client change (TABLE_COLUMNS.maintenance_plans and
-- the store mappings in src/data/store.js). A client running ahead of this
-- migration degrades instead of failing: writes retry once without the
-- column PostgREST rejects as unknown.
--
-- Idempotent (IF NOT EXISTS) so the file is re-runnable.
-- =====================================================================

ALTER TABLE public.maintenance_plans
  ADD COLUMN IF NOT EXISTS auto_create_job boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS lead_days       integer;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'maintenance_plans_lead_days_check'
  ) THEN
    ALTER TABLE public.maintenance_plans
      ADD CONSTRAINT maintenance_plans_lead_days_check
      CHECK (lead_days IS NULL OR (lead_days >= 0 AND lead_days <= 365)) NOT VALID;
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- VERIFY — every row should report is_present = true
-- ---------------------------------------------------------------------
WITH expected(tbl, col) AS (
  VALUES ('maintenance_plans', 'auto_create_job'),
         ('maintenance_plans', 'lead_days')
)
SELECT (e.tbl || '.' || e.col) AS object_name,
       (c.column_name IS NOT NULL) AS is_present
FROM expected e
LEFT JOIN information_schema.columns c
  ON c.table_schema = 'public'
 AND c.table_name = e.tbl
 AND c.column_name = e.col;
