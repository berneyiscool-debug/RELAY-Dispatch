-- =====================================================================
-- STORAGE LOCATIONS (v1.3.x — central registry for stock locations)
-- =====================================================================
-- Replaces the ad-hoc/hardcoded location strings ("Main Warehouse",
-- "Warehouse A/B", "Vehicle - <tech>") used across Stock, Transfer,
-- Purchase Orders and Job material allocation with a first-class,
-- company-scoped entity so locations can be created, edited and retired.

CREATE TABLE storage_locations (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id uuid REFERENCES companies ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text DEFAULT 'Warehouse',
  technician_id text,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE storage_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY storage_locations_tenant_policy ON storage_locations
  FOR ALL
  USING (company_id = public.get_user_company_id(auth.uid()));

CREATE INDEX storage_locations_company_idx ON storage_locations(company_id);

-- Job materials now record which storage location the stock was taken from.
ALTER TABLE job_materials ADD COLUMN location text;
