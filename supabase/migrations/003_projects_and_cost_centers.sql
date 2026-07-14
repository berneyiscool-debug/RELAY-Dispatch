-- =====================================================================
-- PROJECTS & COST CENTERS SCHEMA
-- =====================================================================

-- 1. COST CENTERS Table
CREATE TABLE cost_centers (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id uuid REFERENCES companies ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  code text NOT NULL,
  active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS and add basic policies
ALTER TABLE cost_centers ENABLE ROW LEVEL SECURITY;
CREATE POLICY cost_centers_tenant_policy ON cost_centers
  FOR ALL
  USING (company_id = public.get_user_company_id(auth.uid()));

-- 2. PROJECTS Table
CREATE TABLE projects (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id uuid REFERENCES companies ON DELETE CASCADE NOT NULL,
  number text NOT NULL,
  name text NOT NULL,
  customer_id text,
  customer_name text,
  site_address text,
  status text DEFAULT 'In Progress' NOT NULL,
  description text,
  start_date date,
  end_date date,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS and add basic policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY projects_tenant_policy ON projects
  FOR ALL
  USING (company_id = public.get_user_company_id(auth.uid()));

-- 3. Update JOBS Table
ALTER TABLE jobs ADD COLUMN project_id text REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE jobs ADD COLUMN cost_center_id text REFERENCES cost_centers(id) ON DELETE SET NULL;
