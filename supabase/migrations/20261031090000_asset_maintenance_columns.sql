-- =====================================================================
-- ASSET AND MAINTENANCE PLAN COLUMNS (20261031090000)
-- =====================================================================
-- The asset form (src/pages/assets/AssetForm.js), the create_asset /
-- update_asset actions and the plan drawer on the asset page have always
-- written fields the assets and maintenance_plans tables never had. In cloud
-- mode the store strips any key missing from TABLE_COLUMNS before a write, so
-- these were dropped silently: an asset lost its site, assignee, install date
-- and meter unit on every other device, and a maintenance plan lost its
-- blueprint quote — after which the maintenance engine skipped the plan
-- (`if (!quote) return;`) and it never raised work again.
--
-- assets
--   description, identifier, site     free text the form already collects
--   install_date                      date it was installed or bought
--   service_interval_months           calendar fallback when no plan is set
--   meter_unit                        'hrs' or 'kmls'
--   assigned_to_id                    technician the asset is assigned to
--
-- maintenance_plans
--   quote_id                          blueprint quote copied into the work
--   task_template_id                  task list attached to raised jobs
--   merge_tasks                       merge task lists on a collision
--   default_technician_id             tech assigned when the job is raised
--   last_notification_date            when the engine last raised this plan
--
-- All nullable (merge_tasks defaults false, as the app does) so existing rows
-- stay valid with no backfill. No new access path: the assets and
-- maintenance_plans RLS policies already scope every row by company_id.
--
-- MUST be applied with the client change (the new TABLE_COLUMNS entries and
-- their normalizeRecord/denormalizeRecord mappings in src/data/store.js). A
-- project running the new client against an un-migrated database degrades
-- instead of failing: create()/update() retry once without whichever column
-- PostgREST rejects as unknown and warn in the console.
--
-- Idempotent (IF NOT EXISTS) so the file is re-runnable.
-- =====================================================================

ALTER TABLE public.assets
  ADD COLUMN IF NOT EXISTS description             text,
  ADD COLUMN IF NOT EXISTS identifier              text,
  ADD COLUMN IF NOT EXISTS site                    text,
  ADD COLUMN IF NOT EXISTS install_date            date,
  ADD COLUMN IF NOT EXISTS service_interval_months integer,
  ADD COLUMN IF NOT EXISTS meter_unit              text,
  ADD COLUMN IF NOT EXISTS assigned_to_id          text;

ALTER TABLE public.maintenance_plans
  ADD COLUMN IF NOT EXISTS quote_id               text,
  ADD COLUMN IF NOT EXISTS task_template_id       text,
  ADD COLUMN IF NOT EXISTS merge_tasks            boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS default_technician_id  text,
  ADD COLUMN IF NOT EXISTS last_notification_date timestamp with time zone;

-- ---------------------------------------------------------------------
-- VERIFY — every row should report is_present = true
-- ---------------------------------------------------------------------
WITH expected(tbl, col) AS (
  VALUES ('assets', 'description'),
         ('assets', 'identifier'),
         ('assets', 'site'),
         ('assets', 'install_date'),
         ('assets', 'service_interval_months'),
         ('assets', 'meter_unit'),
         ('assets', 'assigned_to_id'),
         ('maintenance_plans', 'quote_id'),
         ('maintenance_plans', 'task_template_id'),
         ('maintenance_plans', 'merge_tasks'),
         ('maintenance_plans', 'default_technician_id'),
         ('maintenance_plans', 'last_notification_date')
)
SELECT (e.tbl || '.' || e.col) AS object_name,
       (c.column_name IS NOT NULL) AS is_present
FROM expected e
LEFT JOIN information_schema.columns c
  ON c.table_schema = 'public'
 AND c.table_name = e.tbl
 AND c.column_name = e.col;
