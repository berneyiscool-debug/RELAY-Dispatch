-- =====================================================================
-- 044 — CUSTOMER SITES
-- =====================================================================
-- Customers have always been modelled with a `sites` array on the customer
-- row — one entry per premises, { name, address, notes, geo } — and four
-- places read or write it:
--
--   * src/pages/people/PersonDetail.js (the Sites tab and its drawer)
--   * src/pages/assets/AssetForm.js    (the site picker on an asset)
--   * src/data/demoDataset.js          (seeded demo sites)
--   * src/actions/customers.js         (the brny agent's list_sites /
--     add_site / update_site, and the `site` argument on create_job)
--
-- The column itself was never created. 002_add_geocoding.sql even documents
-- "nested customer sites store their own coordinates inside the existing sites
-- JSON", so the belief that it existed predates this migration; only the `geo`
-- column it also adds was ever applied.
--
-- Why that went unnoticed: store.update() writes the cache and IndexedDB
-- first and only then reaches Supabase, and denormalizeRecord() deletes every
-- key that is not in TABLE_COLUMNS before the cloud write, so the write went
-- out without `sites`, succeeded, and reported { ok: true }. The save looked
-- perfect until the next cloud load replaced the record wholesale from a row
-- that has no `sites`, or a realtime UPDATE on that customer did the same.
--
-- Additive and nullable, so existing rows stay valid and nothing is rewritten.
-- No backfill: sites whose only copy was a browser's IndexedDB were already
-- lost, and each client pushes its current array on its next customer write.
-- jsonb (not a customer_sites table) because `sites` is read as a nested array
-- straight off the customer record everywhere above; `geo` in 002 is the
-- precedent. The alternative refactor is a schema change to every one of those
-- four call sites and is not required to make saving durable.
--
-- MUST be applied with the client change (the `sites` entry in
-- TABLE_COLUMNS.customers in src/data/store.js). The client also retries a
-- rejected write once without the offending column, so a project running the
-- new client against an un-migrated database degrades to the old
-- drop-the-field behaviour with a console warning instead of failing every
-- customer write.
--
-- Idempotent (IF NOT EXISTS) so the file is re-runnable and safe to apply to a
-- project where it has already landed.
-- =====================================================================

ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS sites jsonb;

-- ---------------------------------------------------------------------
-- VERIFY — every row should report is_present = true
-- ---------------------------------------------------------------------
WITH expected(tbl, col, typ) AS (
  VALUES ('customers', 'sites', 'jsonb')
)
SELECT (e.tbl || '.' || e.col) AS object_name,
       (c.column_name IS NOT NULL) AS is_present,
       (c.data_type = e.typ) AS has_expected_type
FROM expected e
LEFT JOIN information_schema.columns c
  ON c.table_schema = 'public'
 AND c.table_name = e.tbl
 AND c.column_name = e.col;
