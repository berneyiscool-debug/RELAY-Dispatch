-- =====================================================================
-- PROFILE DEACTIVATION PERSISTENCE MIGRATION
-- =====================================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deactivated boolean DEFAULT false NOT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deactivated_at timestamp with time zone;
