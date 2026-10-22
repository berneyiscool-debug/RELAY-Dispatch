-- =====================================================================
-- XERO — cost centers as tracking options
-- =====================================================================
-- Each cost center is a tracking option in the company's Xero tracking
-- category (supabase/functions/_xero/tracking.js). The sync worker records
-- which option it matched or created, so renaming the cost center in RELAY
-- renames that option in Xero instead of starting a new one.
--
-- Written by the service role only; the app's store doesn't list the column,
-- so cost center saves from the browser never touch it.

ALTER TABLE public.cost_centers ADD COLUMN IF NOT EXISTS xero_tracking_option_id text;
