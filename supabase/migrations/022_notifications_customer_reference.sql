-- =====================================================================
-- NOTIFICATIONS: customer reference columns
-- =====================================================================
-- The customer portal's "Request Service Callout" form has always sent
-- customer_id/customer_name/contact_name/site_name on the notification it
-- creates (see src/pages/portal/Portal.js), but TABLE_COLUMNS.notifications
-- in store.js never allowlisted those columns, so denormalizeRecord()
-- silently stripped them before the cloud insert and the DB never had the
-- columns to receive them anyway. Result: notifications synced to Supabase
-- (and re-read by other staff/devices) lost the link back to the customer
-- who submitted the request, and "Create Job" from that notification had
-- nothing to prefill the job's customer/contact/site from.
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS customer_id   text,
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS contact_name  text,
  ADD COLUMN IF NOT EXISTS site_name     text;
