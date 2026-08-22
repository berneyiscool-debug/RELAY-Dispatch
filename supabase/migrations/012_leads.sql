-- =====================================================================
-- LEADS (v1.3 stabilization — table was missing from migrations)
-- =====================================================================
-- The Leads module reads/writes this table but no migration ever created it,
-- so cloud tenants built from migrations only saw 404s on every lead write.
-- Also carries budget/requirements, which the store previously stripped.

CREATE TABLE leads (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id uuid REFERENCES companies ON DELETE CASCADE NOT NULL,
  number text,
  title text,
  customer_id text,
  customer_name text,
  contact_name text,
  status text DEFAULT 'New',
  source text,
  value numeric DEFAULT 0,
  description text,
  priority text DEFAULT 'Medium',
  budget numeric DEFAULT 0,
  requirements text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY leads_tenant_policy ON leads
  FOR ALL
  USING (company_id = public.get_user_company_id(auth.uid()));

CREATE INDEX leads_company_idx ON leads(company_id);
