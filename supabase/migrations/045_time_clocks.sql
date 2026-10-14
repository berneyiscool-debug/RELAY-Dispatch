-- =====================================================================
-- TIME CLOCKS (v1.3.x — clock in / clock out attendance tracker)
-- =====================================================================
-- Company-scoped attendance records so anyone can see exactly who is
-- clocked in today. A record represents one clock-in/clock-out cycle
-- (lunch breaks create multiple records per day). Location is captured
-- via the browser's geolocation at clock-in/clock-out and stored as
-- {lat, lng, accuracy, timestamp}.
--
-- Numbered 045: first written as 040, which main has since used for leads.
-- Already applied to production under the old number, so every statement is
-- safe to re-run.

CREATE TABLE IF NOT EXISTS time_clocks (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id uuid REFERENCES companies ON DELETE CASCADE NOT NULL,
  technician_id text,
  technician_name text,
  clock_in_at timestamp with time zone,
  clock_out_at timestamp with time zone,
  clock_in_location jsonb,
  clock_out_location jsonb,
  status text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS and isolate rows by company (same pattern as schedule / storage_locations)
ALTER TABLE time_clocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS time_clocks_tenant_policy ON time_clocks;
CREATE POLICY time_clocks_tenant_policy ON time_clocks
  FOR ALL
  USING (company_id = public.get_user_company_id(auth.uid()));

CREATE INDEX IF NOT EXISTS time_clocks_company_idx ON time_clocks(company_id);
