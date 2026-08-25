-- =====================================================================
-- KIT TYPES (v1.3.x — managed list of kit types referenced by kits)
-- =====================================================================
-- Replaces the hardcoded kit "category" strings ("Service Kits",
-- "Vehicle Loadouts", etc.) with a company-scoped registry so kit types
-- can be created, renamed and retired from the Storage Options tab.

CREATE TABLE kit_types (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id uuid REFERENCES companies ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE kit_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY kit_types_tenant_policy ON kit_types
  FOR ALL
  USING (company_id = public.get_user_company_id(auth.uid()));

CREATE INDEX kit_types_company_idx ON kit_types(company_id);

-- Kits reference a managed kit type via their `category` field so the
-- association survives cloud round-trips (previously stripped as unsynced).
ALTER TABLE kits ADD COLUMN IF NOT EXISTS category text;
