-- =====================================================================
-- EMAIL LOG (v1.3 #5 — Resend email sending)
-- =====================================================================
-- One row per outbound email attempt (sent or failed) so Deputy/Reports and the
-- Settings activity view can see what went out. Written client-side after a
-- relay-email send; the Resend API key itself never leaves the edge function.

CREATE TABLE email_log (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id uuid REFERENCES companies ON DELETE CASCADE NOT NULL,
  to_email text,
  subject text,
  template text,        -- quote | invoice | receipt | reminder | portal_invite | custom
  status text,          -- sent | failed
  provider_id text,     -- Resend message id
  related_type text,    -- invoice | quote | customer | job
  related_id text,
  error text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS and add basic tenant policy (same pattern as the other tables)
ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY email_log_tenant_policy ON email_log
  FOR ALL
  USING (company_id = public.get_user_company_id(auth.uid()));

CREATE INDEX email_log_company_idx ON email_log(company_id);
CREATE INDEX email_log_related_idx ON email_log(related_type, related_id);
