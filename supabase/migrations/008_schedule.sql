-- =====================================================================
-- SCHEDULE & LEAVE TABLE SCHEMA
-- =====================================================================

CREATE TABLE schedule (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id uuid REFERENCES companies ON DELETE CASCADE NOT NULL,
  job_id text,
  job_number text,
  title text,
  technician_id text,
  technician_name text,
  color text,
  day_offset numeric,
  start_hour numeric,
  end_hour numeric,
  customer_name text,
  site_address text,
  type text,
  date date,
  status text,
  notes text,
  start_time timestamp with time zone,
  finish_time timestamp with time zone,
  hours numeric,
  task_id text,
  task_name text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS and add basic policies
ALTER TABLE schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY schedule_tenant_policy ON schedule
  FOR ALL
  USING (company_id = public.get_user_company_id(auth.uid()));
