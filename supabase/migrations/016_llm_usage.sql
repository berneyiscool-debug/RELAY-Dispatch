-- 016_llm_usage.sql
-- Internal AI usage metering for the relay-copilot edge function.
-- Write-only from the app (insert policy, no select policy) so RELAY can watch
-- aggregate DeepSeek/Gemini spend per org without exposing it to end users.

CREATE TABLE IF NOT EXISTS public.llm_usage (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  company_id uuid REFERENCES companies ON DELETE CASCADE NOT NULL,
  user_id uuid,
  model text,
  provider text,
  tier text,
  prompt_tokens integer DEFAULT 0 NOT NULL,
  completion_tokens integer DEFAULT 0 NOT NULL,
  total_tokens integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.llm_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY llm_usage_insert_policy ON public.llm_usage
  FOR INSERT
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

CREATE INDEX IF NOT EXISTS llm_usage_company_created_idx
  ON public.llm_usage (company_id, created_at DESC);
