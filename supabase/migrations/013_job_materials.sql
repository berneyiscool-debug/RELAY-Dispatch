-- =====================================================================
-- JOB MATERIALS (v1.3 stabilization — table was missing from migrations)
-- =====================================================================
-- JobDetail's Materials tab writes this collection, but no migration ever
-- created it, so cloud tenants could never persist job materials.

CREATE TABLE job_materials (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id uuid REFERENCES companies ON DELETE CASCADE NOT NULL,
  job_id text,
  job_number text,
  part_id text,
  part_name text,
  quantity numeric DEFAULT 1,
  unit_cost numeric DEFAULT 0,
  total_cost numeric DEFAULT 0,
  date date,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE job_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY job_materials_tenant_policy ON job_materials
  FOR ALL
  USING (company_id = public.get_user_company_id(auth.uid()));

CREATE INDEX job_materials_company_idx ON job_materials(company_id);
CREATE INDEX job_materials_job_idx ON job_materials(job_id);
