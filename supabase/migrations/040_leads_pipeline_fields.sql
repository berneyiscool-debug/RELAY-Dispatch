-- =====================================================================
-- LEADS PIPELINE FIELDS
-- =====================================================================
-- The lead record carries pipeline data the database never learned about:
-- the contact phone/email typed on the lead form, the sales rep the lead is
-- assigned to (assigned_to / sales_rep_name) and the stage_history timeline
-- that LeadDetail.js writes on every stage transition. The client strips any
-- column that is not in the leads whitelist before a cloud write, so these
-- values only ever existed in the local browser store and were lost the
-- moment a second device (or a reinstall) loaded the tenant's leads.
--
-- next_action_date is added at the same time: the pipeline views surface a
-- "next action" due date, and without a column it cannot survive a cloud
-- round trip either.
--
-- Additive only, no backfill: existing rows keep NULL / empty history and the
-- client already treats a missing stageHistory as [].
--
-- Idempotent throughout (ADD COLUMN IF NOT EXISTS) so the file is re-runnable
-- and safe to apply to a project where part of it has already landed.
-- =====================================================================

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS phone            text,
  ADD COLUMN IF NOT EXISTS email            text,
  ADD COLUMN IF NOT EXISTS assigned_to      text,
  ADD COLUMN IF NOT EXISTS sales_rep_name   text,
  ADD COLUMN IF NOT EXISTS stage_history    jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS next_action_date date;
