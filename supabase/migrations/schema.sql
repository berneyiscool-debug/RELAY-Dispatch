-- =====================================================================
-- FIELDFORGE DATABASE SCHEMA
-- =====================================================================
-- Enabling uuid-ossp if not already loaded
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. COMPANIES (Tenants)
CREATE TABLE companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  abn text,
  phone text,
  domain text,
  email text,
  address text,
  settings jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 2. PROFILES (Users linked to companies)
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  company_id uuid REFERENCES companies ON DELETE CASCADE NOT NULL,
  name text,
  email text,
  phone text,
  role text DEFAULT 'technician' NOT NULL CHECK (role IN ('admin', 'manager', 'technician', 'office', 'customer')),
  user_type_id text,
  color text,
  pay_rate numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 3. USER TYPES (Custom permissions definition)
CREATE TABLE user_types (
  id text PRIMARY KEY,
  company_id uuid REFERENCES companies ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  permissions jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 4. CUSTOMERS (CRM People)
CREATE TABLE customers (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id uuid REFERENCES companies ON DELETE CASCADE NOT NULL,
  company text,
  first_name text,
  last_name text,
  email text,
  phone text,
  address text,
  status text DEFAULT 'Active',
  type text DEFAULT 'Commercial',
  portal_token text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 5. ASSETS (Site equipment registry)
CREATE TABLE assets (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id uuid REFERENCES companies ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text,
  serial text,
  owner_type text DEFAULT 'Customer',
  customer_id text,
  customer_name text,
  current_meter numeric DEFAULT 0,
  recovery_rate numeric DEFAULT 0,
  status text DEFAULT 'Active',
  logs jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 6. MAINTENANCE PLANS
CREATE TABLE maintenance_plans (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id uuid REFERENCES companies ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  asset_id text,
  trigger_type text CHECK (trigger_type IN ('Meter', 'Calendar')),
  meter_interval numeric,
  last_triggered_meter numeric,
  next_service_date date,
  status text DEFAULT 'Active',
  priority text DEFAULT 'Standard',
  frequency text,
  collision_merging boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 7. TASK TEMPLATES
CREATE TABLE task_templates (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id uuid REFERENCES companies ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  tags jsonb DEFAULT '[]'::jsonb,
  tasks jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 8. QUOTES
CREATE TABLE quotes (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id uuid REFERENCES companies ON DELETE CASCADE NOT NULL,
  number text NOT NULL,
  customer_id text,
  customer_name text,
  contact_name text,
  title text NOT NULL,
  status text DEFAULT 'Draft',
  line_items jsonb DEFAULT '[]'::jsonb,
  subtotal numeric DEFAULT 0,
  tax numeric DEFAULT 0,
  total numeric DEFAULT 0,
  valid_until date,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 9. JOBS
CREATE TABLE jobs (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id uuid REFERENCES companies ON DELETE CASCADE NOT NULL,
  number text NOT NULL,
  customer_id text,
  customer_name text,
  contact_name text,
  site_address text,
  title text NOT NULL,
  type text,
  status text DEFAULT 'Scheduled',
  priority text DEFAULT 'Standard',
  technician_id text,
  technician_name text,
  quote_id text,
  asset_id text,
  scheduled_date date,
  estimated_hours numeric DEFAULT 0,
  labor_cost numeric DEFAULT 0,
  material_cost numeric DEFAULT 0,
  tasks jsonb DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 10. INVOICES
CREATE TABLE invoices (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id uuid REFERENCES companies ON DELETE CASCADE NOT NULL,
  number text NOT NULL,
  job_id text,
  customer_id text,
  customer_name text,
  contact_name text,
  title text NOT NULL,
  status text DEFAULT 'Sent',
  line_items jsonb DEFAULT '[]'::jsonb,
  subtotal numeric DEFAULT 0,
  tax numeric DEFAULT 0,
  total numeric DEFAULT 0,
  due_date date,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 11. STOCK (Materials inventory)
CREATE TABLE stock (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id uuid REFERENCES companies ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  category text,
  unit text DEFAULT 'Each',
  cost_price numeric DEFAULT 0,
  unit_price numeric DEFAULT 0,
  reorder_level numeric DEFAULT 0,
  quantity numeric DEFAULT 0,
  locations jsonb DEFAULT '[]'::jsonb,
  supplier text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 12. TIMESHEETS
CREATE TABLE timesheets (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id uuid REFERENCES companies ON DELETE CASCADE NOT NULL,
  technician_id text NOT NULL,
  technician_name text NOT NULL,
  date date NOT NULL,
  duration_hours numeric DEFAULT 0,
  job_id text,
  status text DEFAULT 'Pending',
  approved_by text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 13. CONTRACTORS
CREATE TABLE contractors (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id uuid REFERENCES companies ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  status text DEFAULT 'Active',
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 14. SUPPLIERS
CREATE TABLE suppliers (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id uuid REFERENCES companies ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  status text DEFAULT 'Active',
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 15. PURCHASE ORDERS
CREATE TABLE purchase_orders (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id uuid REFERENCES companies ON DELETE CASCADE NOT NULL,
  number text NOT NULL,
  supplier_id text,
  supplier_name text,
  status text DEFAULT 'Draft',
  line_items jsonb DEFAULT '[]'::jsonb,
  total numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 16. NOTIFICATIONS
CREATE TABLE notifications (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id uuid REFERENCES companies ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  link text,
  status text DEFAULT 'Unread',
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 17. FORM TEMPLATES
CREATE TABLE form_templates (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id uuid REFERENCES companies ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  fields jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 18. FORM INSTANCES
CREATE TABLE form_instances (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id uuid REFERENCES companies ON DELETE CASCADE NOT NULL,
  template_id text NOT NULL,
  job_id text,
  values jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 19. KITS
CREATE TABLE kits (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id uuid REFERENCES companies ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  items jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 20. DOCUMENTS (Files linked to quotes/jobs)
CREATE TABLE documents (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id uuid REFERENCES companies ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  file_path text NOT NULL,
  job_id text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);


-- =====================================================================
-- ROW-LEVEL SECURITY (RLS) SETUP
-- =====================================================================

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- RLS POLICIES (Isolated by company_id)
-- ---------------------------------------------------------------------

-- Profiles policy: profiles can be viewed and modified by users in the same company
CREATE POLICY profile_tenant_policy ON profiles
  FOR ALL
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- RLS policies for all other tables referencing company_id
CREATE POLICY company_tenant_policy ON companies
  FOR ALL
  USING (id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY user_types_tenant_policy ON user_types
  FOR ALL
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY customers_tenant_policy ON customers
  FOR ALL
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY assets_tenant_policy ON assets
  FOR ALL
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY maintenance_plans_tenant_policy ON maintenance_plans
  FOR ALL
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY task_templates_tenant_policy ON task_templates
  FOR ALL
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY quotes_tenant_policy ON quotes
  FOR ALL
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY jobs_tenant_policy ON jobs
  FOR ALL
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY invoices_tenant_policy ON invoices
  FOR ALL
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY stock_tenant_policy ON stock
  FOR ALL
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY timesheets_tenant_policy ON timesheets
  FOR ALL
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY contractors_tenant_policy ON contractors
  FOR ALL
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY suppliers_tenant_policy ON suppliers
  FOR ALL
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY purchase_orders_tenant_policy ON purchase_orders
  FOR ALL
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY notifications_tenant_policy ON notifications
  FOR ALL
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY form_templates_tenant_policy ON form_templates
  FOR ALL
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY form_instances_tenant_policy ON form_instances
  FOR ALL
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY kits_tenant_policy ON kits
  FOR ALL
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY documents_tenant_policy ON documents
  FOR ALL
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));


-- =====================================================================
-- SAAS TENANT & USER SIGNUP PROCEDURES (RPC)
-- =====================================================================

-- RPC to register a new company and assign the signup user as the primary administrator.
-- Runs with SECURITY DEFINER to write profiles and companies safely without RLS deadlock.
CREATE OR REPLACE FUNCTION create_company_and_admin(
  company_name text,
  admin_name text,
  admin_phone text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_company_id uuid;
BEGIN
  -- 1. Create company record
  INSERT INTO companies (name, settings)
  VALUES (
    company_name,
    '{"markupPercent": 20}'::jsonb
  )
  RETURNING id INTO new_company_id;

  -- 2. Link the current authenticated user's profile to this company as an administrator
  INSERT INTO profiles (id, company_id, name, email, phone, role)
  VALUES (
    auth.uid(),
    new_company_id,
    admin_name,
    (SELECT email FROM auth.users WHERE id = auth.uid()),
    admin_phone,
    'admin'
  );

  RETURN new_company_id;
END;
$$;


-- =====================================================================
-- AUTH SIGNUP TRIGGERS
-- =====================================================================

-- Trigger to automatically create a profile for newly registered users if company_id is provided in user_metadata.
-- This handles company staff invitation signups.
CREATE OR REPLACE FUNCTION handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  company_uuid uuid;
  user_name text;
  user_phone text;
  user_role text;
BEGIN
  -- Extract values from user_metadata (if supplied during signup)
  IF new.raw_user_meta_data IS NOT NULL THEN
    IF new.raw_user_meta_data ? 'company_id' THEN
      company_uuid := (new.raw_user_meta_data->>'company_id')::uuid;
    END IF;
    user_name := new.raw_user_meta_data->>'name';
    user_phone := new.raw_user_meta_data->>'phone';
    user_role := COALESCE(new.raw_user_meta_data->>'role', 'technician');
  END IF;

  -- Only create profile if company_uuid could be resolved
  IF company_uuid IS NOT NULL THEN
    INSERT INTO public.profiles (id, company_id, name, email, phone, role)
    VALUES (new.id, company_uuid, user_name, new.email, user_phone, user_role);
  END IF;

  RETURN new;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_profile();

