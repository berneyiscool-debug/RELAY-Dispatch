-- =====================================================================
-- ASSET WARRANTY AND COMPLIANCE (20261101090000)
-- =====================================================================
-- Dated obligations on an asset that aren't servicing
-- (src/utils/assetCompliance.js):
--
--   warranty_expiry  the date the asset's warranty runs out
--   compliance       recurring checks such as test & tag, emergency lighting
--                    or fire equipment inspections, as a list of
--                    { id, name, intervalMonths, lastDone, dueDate, reference }
--
-- Both nullable / empty by default, so existing rows need no backfill. The
-- assets RLS policies already scope every row by company_id.
--
-- MUST be applied with the client change (TABLE_COLUMNS.assets and the
-- store mappings in src/data/store.js). A client running ahead of this
-- migration degrades instead of failing: writes retry once without the
-- column PostgREST rejects as unknown (the fields then save locally only).
--
-- Idempotent (IF NOT EXISTS) so the file is re-runnable.
-- =====================================================================

ALTER TABLE public.assets
  ADD COLUMN IF NOT EXISTS warranty_expiry date,
  ADD COLUMN IF NOT EXISTS compliance      jsonb DEFAULT '[]'::jsonb;

-- ---------------------------------------------------------------------
-- VERIFY — every row should report is_present = true
-- ---------------------------------------------------------------------
WITH expected(tbl, col) AS (
  VALUES ('assets', 'warranty_expiry'),
         ('assets', 'compliance')
)
SELECT (e.tbl || '.' || e.col) AS object_name,
       (c.column_name IS NOT NULL) AS is_present
FROM expected e
LEFT JOIN information_schema.columns c
  ON c.table_schema = 'public'
 AND c.table_name = e.tbl
 AND c.column_name = e.col;
