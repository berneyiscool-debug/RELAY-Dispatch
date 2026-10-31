-- =====================================================================
-- ASSET HIERARCHY (20261101100000)
-- =====================================================================
-- An asset can sit inside another (breakers in a switchboard, a pump in a
-- fire system): assets.parent_asset_id points at the containing asset
-- (src/utils/assetHierarchy.js). NULL means a top-level asset, which is
-- every existing row, so no backfill.
--
-- Kept as plain text with no foreign key, like assets' other links
-- (customer_id, assigned_to_id) and the ids the app mints; deleting a
-- parent lifts its components to the top level in the store
-- (store._cascadeDelete) rather than in the database.
--
-- MUST be applied with the client change (TABLE_COLUMNS.assets and the
-- store mapping). A client running ahead of this migration degrades
-- instead of failing: writes retry once without the unknown column.
--
-- Idempotent (IF NOT EXISTS) so the file is re-runnable.
-- =====================================================================

ALTER TABLE public.assets
  ADD COLUMN IF NOT EXISTS parent_asset_id text;

CREATE INDEX IF NOT EXISTS assets_parent_asset_id_idx
  ON public.assets (parent_asset_id)
  WHERE parent_asset_id IS NOT NULL;

-- ---------------------------------------------------------------------
-- VERIFY — should report is_present = true
-- ---------------------------------------------------------------------
SELECT 'assets.parent_asset_id' AS object_name,
       EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'assets' AND column_name = 'parent_asset_id'
       ) AS is_present;
