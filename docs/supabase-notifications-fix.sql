-- ============================================================================
-- Relay Dispatch — Notifications table fix
-- The notifications table only had title/message/link/status, but the app uses
-- type, description, priority, read, number, assetId, jobId, dueDate too.
-- Run this in the Supabase SQL editor. The store code is already aligned.
-- ============================================================================

-- message was NOT NULL but some notifications only set description.
alter table notifications alter column message drop not null;

alter table notifications
  add column if not exists type        text,
  add column if not exists description text,
  add column if not exists priority    text,
  add column if not exists read        boolean default false,
  add column if not exists number      text,
  add column if not exists asset_id    text,
  add column if not exists job_id      text,
  add column if not exists due_date    date;

-- (notifications already has RLS + your qa_temp_all test policy, so nothing else needed.)
