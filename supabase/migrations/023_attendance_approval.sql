-- =====================================================================
-- ATTENDANCE APPROVAL (v1.4.x — approval / adjustment workflow)
-- =====================================================================
-- Adds an approval layer on top of each time-clock session. A manager
-- reviews clocked attendance and approves, corrects (adjusts) or rejects
-- a session before those hours flow into payroll.
--
-- Approval fields live on time_clocks so each session tracks its own
-- decision. approval_status is separate from the operational `status`
-- column (which remains 'in'/'out' for the Who's-In board).
--
--   approval_status : pending | approved | adjusted | rejected
--   approved_hours  : the hours that count toward payroll (null = use the
--                     actual clocked duration; set when adjusted)
--   approved_by     : user id of the approver
--   approved_at     : when the decision was made
--   note            : free-text reason for an adjustment / rejection

ALTER TABLE time_clocks
  ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approved_hours numeric,
  ADD COLUMN IF NOT EXISTS approved_by text,
  ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS note text;
