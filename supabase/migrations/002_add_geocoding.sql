-- ============================================
-- RELAY — GEOCODING FOUNDATION
-- ============================================
-- Adds a `geo` jsonb column to address-bearing tables. Populated once at save
-- time (or via backfill) with { lat, lng, formattedAddress, placeId, geocodedAt }
-- so maps, routing and distance features never re-geocode the same address.
--
-- Nested customer sites store their own coordinates inside the existing sites
-- JSON (each site gains a `geo` key), so they need no dedicated column here.

ALTER TABLE customers ADD COLUMN IF NOT EXISTS geo jsonb;
ALTER TABLE jobs      ADD COLUMN IF NOT EXISTS geo jsonb;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS geo jsonb;

-- Optional: index for future "jobs within bounds" / nearest-technician queries.
-- Expression indexes on the lat/lng keep bounding-box filters fast without PostGIS.
CREATE INDEX IF NOT EXISTS idx_jobs_geo_lat ON jobs (((geo->>'lat')::double precision));
CREATE INDEX IF NOT EXISTS idx_jobs_geo_lng ON jobs (((geo->>'lng')::double precision));
