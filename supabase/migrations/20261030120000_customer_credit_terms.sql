-- =====================================================================
-- CUSTOMER CREDIT LIMIT AND PAYMENT TERMS (20261030120000)
-- =====================================================================
-- The customer Financials tab has always shown "Payment Terms" and
-- "Credit Limit" (src/pages/people/PersonDetail.js), and src/data/demoDataset.js
-- seeds `paymentTermsDays` on every commercial customer — but neither value
-- could be edited, neither column existed, and nothing downstream read them:
-- every invoice-creation path hard-coded a 30-day due date and nothing ever
-- compared an outstanding balance to a limit.
--
-- Both are nullable by design. `payment_terms_days IS NULL` means "use the
-- company default" (30 days, the value the invoice paths already hard-coded),
-- and `credit_limit IS NULL` (or 0) means "no limit". That keeps every existing
-- customer row valid with no backfill and no behaviour change on migration.
--
-- No new access path: the customers RLS policies already scope every row by
-- company_id, so adding columns to the same table inherits them.
--
-- MUST be applied with the client change (the two new TABLE_COLUMNS.customers
-- entries and their normalizeRecord/denormalizeRecord mappings in
-- src/data/store.js). A project running the new client against an un-migrated
-- database degrades instead of failing: create()/update() retry once without
-- whichever column PostgREST rejects as unknown and warn in the console.
--
-- Idempotent (IF NOT EXISTS) so the file is re-runnable and safe to apply to a
-- project where it has already landed.
-- =====================================================================

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS payment_terms_days integer,
  ADD COLUMN IF NOT EXISTS credit_limit       numeric;

-- Negative terms or limits are meaningless and would make the due-date and
-- over-limit maths nonsense, so refuse them at the database as well as in the
-- app. NOT VALID keeps the constraint from scanning historical rows; rows this
-- app writes are checked from now on.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'customers_payment_terms_days_check'
  ) THEN
    ALTER TABLE public.customers
      ADD CONSTRAINT customers_payment_terms_days_check
      CHECK (payment_terms_days IS NULL OR payment_terms_days >= 0) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'customers_credit_limit_check'
  ) THEN
    ALTER TABLE public.customers
      ADD CONSTRAINT customers_credit_limit_check
      CHECK (credit_limit IS NULL OR credit_limit >= 0) NOT VALID;
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- VERIFY — every row should report is_present = true
-- ---------------------------------------------------------------------
WITH expected(tbl, col, typ) AS (
  VALUES ('customers', 'payment_terms_days', 'integer'),
         ('customers', 'credit_limit', 'numeric')
)
SELECT (e.tbl || '.' || e.col) AS object_name,
       (c.column_name IS NOT NULL) AS is_present,
       (c.data_type = e.typ) AS has_expected_type
FROM expected e
LEFT JOIN information_schema.columns c
  ON c.table_schema = 'public'
 AND c.table_name = e.tbl
 AND c.column_name = e.col;
