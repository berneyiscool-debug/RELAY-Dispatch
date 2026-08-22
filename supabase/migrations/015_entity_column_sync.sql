-- =====================================================================
-- ENTITY COLUMN SYNC (v1.3 stabilization)
-- =====================================================================
-- TABLE_COLUMNS in store.js has carried more columns than the DB for months;
-- every cloud write of these records failed with 42703 (undefined_column).
-- This brings the DB in line with the store for contractors, suppliers,
-- purchase_orders, notifications (incl. maintenance-engine metadata) and stock.
-- Promotes the manual docs/supabase-schema-fixes.sql + docs/supabase-
-- notifications-fix.sql edits into a numbered migration.

-- CONTRACTORS: rich fields (docs/supabase-schema-fixes.sql section 4)
ALTER TABLE contractors
  ADD COLUMN IF NOT EXISTS contact_name     text,
  ADD COLUMN IF NOT EXISTS license_number   text,
  ADD COLUMN IF NOT EXISTS hourly_rate      numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS after_hours_rate numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS callout_fee      numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS specialties      jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS notes            text,
  ADD COLUMN IF NOT EXISTS portal_token     text,
  ADD COLUMN IF NOT EXISTS compliance_docs  jsonb DEFAULT '[]'::jsonb;

-- SUPPLIERS: rich fields (docs/supabase-schema-fixes.sql section 5)
ALTER TABLE suppliers
  ADD COLUMN IF NOT EXISTS contact_name   text,
  ADD COLUMN IF NOT EXISTS address        text,
  ADD COLUMN IF NOT EXISTS category       text,
  ADD COLUMN IF NOT EXISTS account_number text,
  ADD COLUMN IF NOT EXISTS payment_terms  text,
  ADD COLUMN IF NOT EXISTS notes          text,
  ADD COLUMN IF NOT EXISTS attachments    jsonb DEFAULT '[]'::jsonb;

-- PURCHASE ORDERS: job linkage + item payload used by quickModals/PODetail
ALTER TABLE purchase_orders
  ADD COLUMN IF NOT EXISTS job_id        text,
  ADD COLUMN IF NOT EXISTS job_number    text,
  ADD COLUMN IF NOT EXISTS issue_date    date,
  ADD COLUMN IF NOT EXISTS expected_date date,
  ADD COLUMN IF NOT EXISTS items         jsonb DEFAULT '[]'::jsonb;

-- NOTIFICATIONS: app-level fields (docs/supabase-notifications-fix.sql)
ALTER TABLE notifications ALTER COLUMN message DROP NOT NULL;

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS type        text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS priority    text,
  ADD COLUMN IF NOT EXISTS read        boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS number      text,
  ADD COLUMN IF NOT EXISTS asset_id    text,
  ADD COLUMN IF NOT EXISTS job_id      text,
  ADD COLUMN IF NOT EXISTS due_date    date;

-- NOTIFICATIONS: maintenance-engine payload (kept top-level so NotificationsList
-- can convert a maintenance notification into a full job in cloud mode)
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

-- STOCK: SKU field used by StockForm/StockList
ALTER TABLE stock
  ADD COLUMN IF NOT EXISTS sku text;

-- LEAD COMPANION COLUMNS for tenants whose leads table predates 012_leads.sql
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS budget      numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS requirements text;
