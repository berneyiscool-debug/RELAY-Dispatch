-- =====================================================================
-- RELAY - append-only job history (job_events)
-- =====================================================================
-- A job's history (status changes, task ticks, contractor assignments) has
-- lived in an array inside the jobs row: notes holds '__meta__:' + JSON with
-- historyLog, activityLog and customerActivityLog. Every save rewrites the
-- whole blob, so when two devices touch the same job the later save wipes
-- the other's entries. With Groundwork, the office and a tech's phone will
-- both be writing to the same jobs all day.
--
-- job_events gives each entry its own row. Nothing is moved: old entries
-- stay in the notes blob and the client merges both when it reads, so this
-- file has no backfill to get wrong.
--
--   kind     'history' now. 'comms' is reserved for staff notes and
--            attachments, which move here in Groundwork G1.
--   action   what happened ('status_changed', 'task_completed', ...).
--   content  the sentence the timeline shows.
--   payload  structured detail (from/to status, task id, ...).
--
-- Rules:
--   * Append-only. Signed-in users get SELECT and INSERT, never UPDATE or
--     DELETE. Rows go when their job is deleted (ON DELETE CASCADE).
--   * Who wrote it can't be forged: actor_id is set to the caller.
--     actor_name stays client-supplied because the timeline shows a display
--     name, but actor_id is the record of who it really was.
--   * The job has to belong to the event's company, and occurred_at can't
--     be in the future (queued phone writes keep their original time, so
--     the past is allowed).
--   * Technicians only see and add events on jobs assigned to them, via the
--     same is_office_user() check as 20261030090000_tech_job_scope.sql,
--     which must be applied first.
--
-- Safe to run twice.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.job_events (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  job_id text NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'history',
  action text,
  content text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor_id uuid,
  actor_name text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT job_events_kind_check CHECK (kind IN ('history', 'comms')),
  CONSTRAINT job_events_payload_object CHECK (jsonb_typeof(payload) = 'object'),
  CONSTRAINT job_events_content_length CHECK (content IS NULL OR length(content) <= 4000)
);

CREATE INDEX IF NOT EXISTS job_events_job_occurred_idx
  ON public.job_events (job_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS job_events_company_occurred_idx
  ON public.job_events (company_id, occurred_at DESC);

-- ---------------------------------------------------------------------
-- Stamp and check each row as it's written
-- ---------------------------------------------------------------------
-- SECURITY DEFINER so the job lookup sees the job whatever the caller's
-- policies allow; the caller's own visibility is enforced by the policies
-- below, not here.
CREATE OR REPLACE FUNCTION public.job_events_stamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job_company uuid;
BEGIN
  SELECT company_id INTO v_job_company FROM public.jobs WHERE id = NEW.job_id;
  IF v_job_company IS DISTINCT FROM NEW.company_id THEN
    RAISE EXCEPTION 'That job belongs to a different company.'
      USING ERRCODE = 'check_violation';
  END IF;

  IF auth.uid() IS NOT NULL THEN
    NEW.actor_id := auth.uid();
  END IF;
  NEW.created_at := now();
  IF NEW.occurred_at IS NULL OR NEW.occurred_at > now() + interval '5 minutes' THEN
    NEW.occurred_at := now();
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.job_events_stamp() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS job_events_stamp_bi ON public.job_events;
CREATE TRIGGER job_events_stamp_bi
  BEFORE INSERT ON public.job_events
  FOR EACH ROW EXECUTE FUNCTION public.job_events_stamp();

-- ---------------------------------------------------------------------
-- Access
-- ---------------------------------------------------------------------
ALTER TABLE public.job_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS job_events_tenant_policy ON public.job_events;
CREATE POLICY job_events_tenant_policy
  ON public.job_events
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

-- The jobs lookup runs under the caller's own policies, so for a tech it
-- only finds jobs assigned to them (jobs_tech_assigned).
DROP POLICY IF EXISTS job_events_tech_assigned ON public.job_events;
CREATE POLICY job_events_tech_assigned
  ON public.job_events
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (
    public.is_office_user()
    OR EXISTS (SELECT 1 FROM public.jobs j
                WHERE j.id = job_events.job_id
                  AND j.technician_id = auth.uid()::text)
  )
  WITH CHECK (
    public.is_office_user()
    OR EXISTS (SELECT 1 FROM public.jobs j
                WHERE j.id = job_events.job_id
                  AND j.technician_id = auth.uid()::text)
  );

REVOKE ALL ON public.job_events FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.job_events TO authenticated;
GRANT ALL ON public.job_events TO service_role;
