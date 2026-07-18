-- =====================================================================
-- XERO COST CENTER MAPPINGS MIGRATION
-- =====================================================================

ALTER TABLE cost_centers ADD COLUMN xero_sales_account_code text;
ALTER TABLE cost_centers ADD COLUMN xero_expense_account_code text;
ALTER TABLE cost_centers ADD COLUMN xero_tracking_category_name text;
ALTER TABLE cost_centers ADD COLUMN xero_tracking_option_name text;
