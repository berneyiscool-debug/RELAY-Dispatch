-- =====================================================================
-- NOTIFICATIONS: origin (system vs user)
-- =====================================================================
-- Machine-generated notifications (maintenance / recurring engine, stock
-- auto-reorder, seeded demo data) arrive far more often than the ones people
-- raise, so the human ones get drowned out. The notifications page and the
-- dashboard widget now have a per-user "hide system notifications" toggle,
-- which needs the two kinds to be told apart as data - matching on title or
-- created_by text breaks the moment somebody edits a title.
--
-- TABLE_COLUMNS.notifications in store.js allowlists this column (without it
-- denormalizeRecord() strips the field before every cloud write). The machine
-- producers set origin = 'system' explicitly; anything a person raises keeps
-- the default and stays visible.
--
-- Existing rows are classified once, from the shapes only the machine
-- producers have ever emitted. Idempotent.

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS origin text NOT NULL DEFAULT 'user';

-- One-time backfill. Re-running is harmless (rows already promoted to 'system'
-- still match) and 'user' rows can never match any of these predicates, so a
-- notification a person raised is never reclassified.
UPDATE notifications
   SET origin = 'system'
 WHERE origin <> 'system'
   AND (
     created_by = 'System Engine'
     OR title = 'Stock Auto-Reorder'
     OR title LIKE 'System Alert - Service Due%'
   );
