-- =====================================================================
-- LEADS ORIGIN (v1.3.x — split Leads into Internal vs Marketplace)
-- =====================================================================
-- The Leads module is split into two sources: leads raised internally by
-- the business ("Internal") and leads sourced from an external leads
-- marketplace/website ("Marketplace"). Existing leads default to Internal.

ALTER TABLE leads ADD COLUMN origin text DEFAULT 'Internal';
