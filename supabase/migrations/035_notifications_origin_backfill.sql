-- =====================================================================
-- NOTIFICATIONS: re-backfill origin from the machine shapes
-- =====================================================================
-- Migration 033 classified the rows that already existed when the "hide system
-- notifications" toggle shipped, but its backfill led with `created_by =
-- 'System Engine'` - and created_by is NULL on every row in a real database.
-- The app is the only writer (no edge function touches notifications) and
-- denormalizeRecord() only sends columns allowlisted in TABLE_COLUMNS, where
-- created_by had no camelCase counterpart, so the field was dropped before
-- every insert. Only the title-based predicates of 033 ever matched, so the
-- notifications the maintenance engine, the recurring-job merge and stock
-- auto-reorder actually produce - "Maintenance Due: ...", "Usage Maintenance
-- Due: ...", the merged "... (includes ... tasks)" plans, "Recurring Job
-- Created", "Duplicate recurring occurrences removed" - were all stamped
-- origin = 'user' by the NOT NULL DEFAULT and the toggle could not hide them.
--
-- This migration re-classifies from the shapes the machine producers emit,
-- never from created_by, and is safe to re-run. A row a person raised carries
-- none of these shapes: the "Raise Notification" form offers "Recurring Job
-- Due" as a type too, so that type only counts as machine noise when the body
-- is the engine's own "Service Plan:" summary.
--
-- Run manually in the Supabase SQL editor, like the other migrations
-- (docs/SUPABASE_MIGRATION.md). The app also re-classifies client-side on
-- sign-in, so a database that misses this file still hides these rows.

-- The predicates below read type/description/created_by, so this file carries the
-- same guarded, additive column adds the project's catch-up migrations do - it must
-- not depend on 015 or 029 having been applied first.
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS origin      text NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS type        text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS created_by  text;

UPDATE notifications
   SET origin = 'system'
 WHERE origin <> 'system'
   AND (
     created_by = 'System Engine'
     OR type IN ('Recurring Job Created', 'Recurring Job Cleanup')
     OR title IN ('Stock Auto-Reorder', 'Recurring Job Created', 'Duplicate recurring occurrences removed')
     OR title LIKE 'System Alert - Service Due%'
     OR title LIKE 'Maintenance Due: %'
     OR title LIKE 'Usage Maintenance Due: %'
     OR (type = 'Recurring Job Due' AND (message LIKE 'Service Plan:%' OR description LIKE 'Service Plan:%'))
   );
