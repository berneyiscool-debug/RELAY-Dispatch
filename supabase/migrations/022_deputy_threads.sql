-- =====================================================================
-- DEPUTY THREADS (Deputy Max multichat — one row per conversation thread)
-- =====================================================================
-- Deputy's chat history is now stored as multiple named threads so it can
-- follow the user across devices. A thread owns a jsonb `messages` array
-- (each entry is { role, content }) rather than a separate messages table.

CREATE TABLE deputy_threads (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id uuid REFERENCES companies ON DELETE CASCADE NOT NULL,
  title text NOT NULL DEFAULT 'New chat',
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE deputy_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY deputy_threads_tenant_policy ON deputy_threads
  FOR ALL
  USING (company_id = public.get_user_company_id(auth.uid()));

CREATE INDEX deputy_threads_company_idx ON deputy_threads(company_id);
CREATE INDEX deputy_threads_company_updated_idx ON deputy_threads(company_id, updated_at DESC);
