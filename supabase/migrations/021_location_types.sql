-- =====================================================================
-- LOCATION TYPES (v1.3.x — managed list of storage location types)
-- =====================================================================
-- Replaces the hardcoded storage location "type" strings ("Warehouse",
-- "Vehicle", "Asset", "On Order") with a company-scoped registry so the
-- location Type dropdown can be created, renamed and retired from the
-- Storage Options tab.

CREATE TABLE location_types (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id uuid REFERENCES companies ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE location_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY location_types_tenant_policy ON location_types
  FOR ALL
  USING (company_id = public.get_user_company_id(auth.uid()));

CREATE INDEX location_types_company_idx ON location_types(company_id);
