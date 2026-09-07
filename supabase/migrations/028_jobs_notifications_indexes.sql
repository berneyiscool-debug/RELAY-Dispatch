-- ============================================================
-- 028_jobs_notifications_indexes.sql
-- Address recurrent "canceling statement due to statement timeout"
-- on the jobs / notifications write paths.
--
-- jobs and notifications are the highest-frequency tables in the
-- recurring-job engine. Every company-scoped load
--   select(*) ... where company_id = $1
-- and every RLS policy check uses company_id, but neither table had
-- an index on it, so Postgres seq-scanned the whole table. On a busy
-- multi-tenant project that is the classic cause of statement
-- timeouts during bulk/engine writes.
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON jobs (company_id);

CREATE INDEX IF NOT EXISTS idx_notifications_company_id ON notifications (company_id);
