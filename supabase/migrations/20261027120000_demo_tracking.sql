-- =====================================================================
-- DEMO TRACKING — the no-signup demo's usage and the signups it brings
-- =====================================================================
-- A visitor can open the Harbourline demo with no account (#/demo, or "Try the
-- demo" on the web launch screen). The browser keeps an anonymous demo id and
-- the relay-demo edge function records what happens against it:
--
--   demo_started      a demo was opened ('launch', 'site', 'link', 'in_app')
--   assistant_call    one billable brny call from a guest demo. These rows are
--                     also the guest AI ledger: relay-demo counts them per
--                     hashed IP and in total to enforce the guest allowance.
--   signup_clicked    a guest chose "Create an account" from the demo
--   signup_completed  a company was provisioned on a browser that had opened
--                     the demo. company_id is resolved server-side from the
--                     caller's JWT, never taken from the client.
--
-- Service-role only, like api_usage: no client reads or writes these rows. The
-- IP is stored only as a keyed hash, used for the per-visitor allowance.

-- ---------------------------------------------------------------------
-- 1. EVENT LOG (service role only)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.demo_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  demo_id uuid NOT NULL,
  event text NOT NULL,
  source text,
  company_id uuid,
  ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT demo_events_event_check
    CHECK (event IN ('demo_started', 'assistant_call', 'signup_clicked', 'signup_completed')),
  CONSTRAINT demo_events_source_check
    CHECK (source IS NULL OR source IN ('launch', 'site', 'link', 'in_app')),
  -- A signup always names the company it created, and nothing else does.
  CONSTRAINT demo_events_company_check
    CHECK ((event = 'signup_completed') = (company_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS demo_events_event_time_idx
  ON public.demo_events (event, created_at DESC);

-- The guest allowance and the event throttle count one visitor's day.
CREATE INDEX IF NOT EXISTS demo_events_visitor_day_idx
  ON public.demo_events (ip_hash, event, created_at DESC) WHERE ip_hash IS NOT NULL;

-- A company is counted as a demo signup once, however many times setup retries.
CREATE UNIQUE INDEX IF NOT EXISTS demo_events_one_signup_per_company
  ON public.demo_events (company_id) WHERE event = 'signup_completed';

ALTER TABLE public.demo_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.demo_events FROM PUBLIC;
REVOKE ALL ON public.demo_events FROM anon;
REVOKE ALL ON public.demo_events FROM authenticated;
GRANT ALL ON public.demo_events TO service_role;

-- ---------------------------------------------------------------------
-- 2. REPORTING VIEWS (read in the Supabase dashboard)
-- ---------------------------------------------------------------------
-- Days are Sydney days, the same window the AI allowance resets on.

-- What happened each day. Signups land on the day they were made, which is not
-- always the day of the demo: see demo_conversion for demo → signup.
CREATE OR REPLACE VIEW public.demo_funnel_daily WITH (security_invoker = true) AS
SELECT
  (created_at AT TIME ZONE 'Australia/Sydney')::date AS day,
  count(DISTINCT demo_id) FILTER (WHERE event = 'demo_started') AS demos_started,
  count(*) FILTER (WHERE event = 'demo_started' AND source = 'launch') AS started_from_launch,
  count(*) FILTER (WHERE event = 'demo_started' AND source = 'site') AS started_from_site,
  count(*) FILTER (WHERE event = 'demo_started' AND source = 'link') AS started_from_link,
  count(*) FILTER (WHERE event = 'demo_started' AND source = 'in_app') AS started_in_app,
  count(DISTINCT demo_id) FILTER (WHERE event = 'assistant_call') AS demos_using_brny,
  count(*) FILTER (WHERE event = 'assistant_call') AS brny_calls,
  count(DISTINCT demo_id) FILTER (WHERE event = 'signup_clicked') AS signup_clicks,
  count(*) FILTER (WHERE event = 'signup_completed') AS signups
FROM public.demo_events
GROUP BY 1;

-- Demo → signup, grouped by the day and source of each demo id's first demo.
CREATE OR REPLACE VIEW public.demo_conversion WITH (security_invoker = true) AS
WITH starts AS (
  SELECT demo_id,
         min(created_at) AS first_started,
         (array_agg(source ORDER BY created_at))[1] AS source
  FROM public.demo_events
  WHERE event = 'demo_started'
  GROUP BY demo_id
),
signups AS (
  SELECT DISTINCT demo_id FROM public.demo_events WHERE event = 'signup_completed'
)
SELECT
  (s.first_started AT TIME ZONE 'Australia/Sydney')::date AS first_demo_day,
  s.source,
  count(*) AS demos,
  count(g.demo_id) AS signed_up,
  round(100.0 * count(g.demo_id) / count(*), 1) AS conversion_pct
FROM starts s
LEFT JOIN signups g USING (demo_id)
GROUP BY 1, 2;

REVOKE ALL ON public.demo_funnel_daily FROM PUBLIC;
REVOKE ALL ON public.demo_funnel_daily FROM anon;
REVOKE ALL ON public.demo_funnel_daily FROM authenticated;
GRANT SELECT ON public.demo_funnel_daily TO service_role;

REVOKE ALL ON public.demo_conversion FROM PUBLIC;
REVOKE ALL ON public.demo_conversion FROM anon;
REVOKE ALL ON public.demo_conversion FROM authenticated;
GRANT SELECT ON public.demo_conversion TO service_role;
