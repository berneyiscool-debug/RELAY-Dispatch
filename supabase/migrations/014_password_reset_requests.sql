-- =====================================================================
-- PASSWORD RESET REQUESTS (v1.3 stabilization — table was missing)
-- =====================================================================
-- Local-mode password resets are stored in this collection. The table never
-- existed in migrations, which aborted migrateLocalToCloud() mid-way for any
-- tenant that had reset requests. It stays local-only in practice, but must
-- exist (with tenant RLS) so local→cloud migration can upsert it.

CREATE TABLE password_reset_requests (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id uuid REFERENCES companies ON DELETE CASCADE NOT NULL,
  technician_id text,
  employee_id text,
  requested_at timestamp with time zone DEFAULT now(),
  status text DEFAULT 'Pending',
  token text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE password_reset_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY password_reset_requests_tenant_policy ON password_reset_requests
  FOR ALL
  USING (company_id = public.get_user_company_id(auth.uid()));

CREATE INDEX password_reset_requests_company_idx ON password_reset_requests(company_id);
