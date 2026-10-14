-- =====================================================================
-- 042 — PORTAL TOKEN LOOKUP
-- =====================================================================
-- A portal magic link carries customers/contractors.portal_token, but the
-- portal resolved that token only against the visitor's own browser cache:
-- store.getAll() is synchronous and never fetches, and 030_rls_hardening.sql
-- scopes every policy TO authenticated, so a signed-out visitor reads zero rows
-- and every link renders "Invalid Access Link". The link only ever worked in the
-- operator's own already-synced profile, which is why it went unnoticed.
--
-- Fixing that means a server-side lookup, and this migration prepares it for
-- supabase/functions/relay-portal:
--
-- 1. Unique partial indexes on both portal_token columns. The resolver's lookup
--    is an equality probe on exactly this expression, and uniqueness is what
--    makes a token unambiguous — without it two matching rows would let the
--    resolver hand back the wrong customer's records. Partial
--    (WHERE portal_token IS NOT NULL) so the many token-less records are not
--    indexed, and two NULLs never collide.
--
-- 2. portal_access_log — the resolver's audit trail. Every attempt records its
--    outcome, so a tenant can see when a portal was last opened and for which
--    record, and failed PIN attempts can be counted per record to throttle
--    guessing. The token itself is deliberately NOT stored: it is a bearer
--    credential, and the row it resolved to is already recorded.
--
-- 3. portal_sessions — the unlock grant. A successful PIN entry mints 32 random
--    bytes that the caller keeps in sessionStorage; only the SHA-256 digest is
--    stored here, so the unlock state is something the server can verify and
--    revoke, and a leaked copy of this table cannot be replayed. RLS on, no
--    policies: service-role only.
--
-- 4. portal_contractor_job_ids() — which jobs belong to one contractor. That
--    decision is a walk of each job's `tasks` jsonb, which PostgREST cannot
--    express; doing it server-side is what keeps other customers' job details
--    off the wire. SECURITY DEFINER, execute granted to service_role alone.
--
-- 5. portal_last_accessed on both tables, so the "Last Accessed" field the staff
--    UI already renders can be stamped by the resolver instead of by a portal
--    that would have had to rewrite the whole collection to set it.
--
-- The de-duplication is the only destructive statement and runs first, because a
-- unique index cannot be created over existing duplicates. Where two records
-- share a token the lowest id keeps it and the others are set to NULL, which only
-- invalidates a link that was already ambiguous. Blank tokens are treated as
-- absent for the same reason.
--
-- ADD COLUMN IF NOT EXISTS is defensive, not descriptive: customers.portal_token
-- comes from the schema.sql baseline and contractors.portal_token from the tail of
-- 015, and 029 exists precisely because that tail never reached production. The
-- columns are restated here so this file is self-contained and safe on a project
-- that drifted.
--
-- Idempotent and re-runnable.
-- =====================================================================

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS portal_token text;

ALTER TABLE public.contractors
  ADD COLUMN IF NOT EXISTS portal_token text;

-- ---------------------------------------------------------------------
-- De-duplication (only ever clears a token — never a record)
-- ---------------------------------------------------------------------
-- A token that is only whitespace cannot be resolved by a real link and would
-- still occupy a slot in the unique index, so it is normalised to NULL first.
UPDATE public.customers   SET portal_token = NULL WHERE btrim(portal_token) = '';
UPDATE public.contractors SET portal_token = NULL WHERE btrim(portal_token) = '';

-- DISTINCT ON picks one keeper per token; `id` is text and unique, so the choice
-- is deterministic and the statement is safe to re-run.
WITH keep AS (
  SELECT DISTINCT ON (portal_token) id
  FROM public.customers
  WHERE portal_token IS NOT NULL
  ORDER BY portal_token, id
)
UPDATE public.customers c
   SET portal_token = NULL
 WHERE c.portal_token IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM keep k WHERE k.id = c.id);

WITH keep AS (
  SELECT DISTINCT ON (portal_token) id
  FROM public.contractors
  WHERE portal_token IS NOT NULL
  ORDER BY portal_token, id
)
UPDATE public.contractors c
   SET portal_token = NULL
 WHERE c.portal_token IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM keep k WHERE k.id = c.id);

CREATE UNIQUE INDEX IF NOT EXISTS customers_portal_token_key
  ON public.customers(portal_token) WHERE portal_token IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS contractors_portal_token_key
  ON public.contractors(portal_token) WHERE portal_token IS NOT NULL;

-- ---------------------------------------------------------------------
-- portal_access_log
-- ---------------------------------------------------------------------
-- outcome is one of: 'resolve' (token found), 'passcode_setup' (first visitor
-- claimed the PIN), 'passcode_ok', 'passcode_fail', 'action' (a whitelisted write
-- succeeded). It is left unconstrained on purpose so a new resolver outcome does
-- not need a migration; token_kind is constrained because it selects the table.
--
-- company_id is nullable: the row is written by the service role before any
-- tenant is known for an unresolvable token, and a log entry must not be lost
-- just because the token did not resolve.
CREATE TABLE IF NOT EXISTS public.portal_access_log (
  id bigserial PRIMARY KEY,
  token_kind text NOT NULL CHECK (token_kind IN ('customer', 'contractor')),
  record_id text NOT NULL,
  company_id uuid REFERENCES public.companies ON DELETE CASCADE,
  outcome text NOT NULL,
  action text,
  occurred_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Throttling probe: count recent failures for one record. Partial, because only
-- failures are ever counted and they are the minority of rows.
CREATE INDEX IF NOT EXISTS portal_access_log_throttle_idx
  ON public.portal_access_log(token_kind, record_id, occurred_at DESC)
  WHERE outcome = 'passcode_fail';

-- Tenant reads: "when was this portal last opened", newest first.
CREATE INDEX IF NOT EXISTS portal_access_log_company_idx
  ON public.portal_access_log(company_id, occurred_at DESC);

ALTER TABLE public.portal_access_log ENABLE ROW LEVEL SECURITY;

-- SELECT only, and that is the point: the tenant may audit its own log but must
-- not be able to insert or delete rows, because deleting a failure would clear
-- the throttle counter that exists to stop PIN guessing. Writes come from the
-- resolver's service-role client, which bypasses RLS.
--
-- Guarded like 029's policy: CREATE POLICY has no IF NOT EXISTS, and the body
-- calls the tenant helper, so a project where 030 has not run is left with RLS on
-- and no policy — unreachable by clients, which is the safe direction.
DO $$
BEGIN
  IF to_regprocedure('public.get_user_company_id(uuid)') IS NOT NULL
     AND NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'portal_access_log'
      AND policyname = 'portal_access_log_tenant_policy'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY portal_access_log_tenant_policy ON public.portal_access_log
        FOR SELECT TO authenticated
        USING (company_id = public.get_user_company_id(auth.uid()));
    $policy$;
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- portal_sessions — what an unlocked portal holds instead of a passcode
-- ---------------------------------------------------------------------
-- The portal's unlock state used to live in sessionStorage as the literal string
-- 'true', which proves nothing to the server: it made the PIN gate the reads only,
-- so anyone holding the link could POST a quote acceptance without ever entering
-- the PIN the link is supposed to be protected by.
--
-- A successful PIN entry now mints a grant instead: 32 random bytes the caller
-- keeps in sessionStorage, stored here only as a SHA-256 digest, scoped to one
-- record, and expired. Every read and every write re-presents it, so the unlock
-- state is a thing the server can verify and revoke rather than a boolean the
-- browser asserts about itself. Storing the digest and not the grant means a
-- leaked copy of this table cannot be replayed.
--
-- RLS is enabled with no policies at all: grants are minted, read and revoked by
-- the resolver's service-role client, and neither a tenant nor an anonymous caller
-- has any business selecting them.
CREATE TABLE IF NOT EXISTS public.portal_sessions (
  -- The digest is the natural key: a session is looked up by presenting its grant
  -- and nothing else, so a surrogate id would only add a sequence to grant on.
  grant_hash text PRIMARY KEY,
  token_kind text NOT NULL CHECK (token_kind IN ('customer', 'contractor')),
  record_id text NOT NULL,
  company_id uuid REFERENCES public.companies ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  last_used_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL
);

-- Used to retire a record's older sessions when a PIN changes or is reset.
CREATE INDEX IF NOT EXISTS portal_sessions_record_idx
  ON public.portal_sessions(token_kind, record_id);

ALTER TABLE public.portal_sessions ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- portal_contractor_job_ids — which jobs belong to one contractor
-- ---------------------------------------------------------------------
-- The contractor portal decides "my jobs" by walking each job's `tasks` jsonb for
-- an assignedContractorIds entry (ContractorPortal.js:200-235). That walk cannot be
-- expressed as a PostgREST filter, and the alternative — handing the portal every
-- job in the company and letting the browser filter — would ship other customers'
-- job details to an anonymous visitor. So the walk happens here, server-side, and
-- the portal only ever receives the rows it is entitled to.
--
-- SECURITY DEFINER because the caller is anonymous and RLS correctly withholds all
-- job rows from it. That makes the function itself the access boundary: execute is
-- revoked from the client roles and granted only to service_role, so the resolver
-- is the single caller. p_company is passed by the resolver from the token's own
-- record, never from the request, or a token would enumerate other tenants.
--
-- Returns ids only; the resolver then reads those rows and normalises them, so the
-- jsonb shape is understood in exactly one place (the client's normaliseRecord).
CREATE OR REPLACE FUNCTION public.portal_contractor_job_ids(p_company uuid, p_contractor text)
RETURNS SETOF text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT j.id::text
  FROM public.jobs j
  WHERE j.company_id = p_company
    AND p_contractor IS NOT NULL
    AND p_contractor <> ''
    -- Recurring templates are not real work; the client drops them too, but
    -- filtering the cheap real column here keeps them off the wire.
    AND j.status IS DISTINCT FROM 'Recurring Template'
    AND (
      -- Lax mode, so a job whose tasks are missing or shaped differently simply
      -- does not match instead of raising.
      jsonb_path_exists(j.tasks, '$.**.assignedContractorIds[*] ? (@ == $cid)',
                        jsonb_build_object('cid', p_contractor))
      OR jsonb_path_exists(j.tasks, '$.**.assignedContractorId ? (@ == $cid)',
                           jsonb_build_object('cid', p_contractor))
    );
$$;

REVOKE ALL ON FUNCTION public.portal_contractor_job_ids(uuid, text) FROM PUBLIC;
DO $$
BEGIN
  -- Present in Supabase, absent in a bare Postgres fixture; only revoke what exists.
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON FUNCTION public.portal_contractor_job_ids(uuid, text) FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON FUNCTION public.portal_contractor_job_ids(uuid, text) FROM authenticated;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT EXECUTE ON FUNCTION public.portal_contractor_job_ids(uuid, text) TO service_role;
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- portal_last_accessed — the staff-facing "Last Accessed" field
-- ---------------------------------------------------------------------
-- PersonDetail.js:162 already renders `person.portalLastAccessed` and already
-- reports "Never" for everyone, because nothing persisted it: the portal set the
-- field on the in-memory record and then saved the WHOLE customers collection.
-- That is both a no-op and, from an anonymous portal holding one customer's cache,
-- a way to wipe the rest of the book. Persist the column properly and let the
-- resolver stamp it on a successful visit.
ALTER TABLE public.customers   ADD COLUMN IF NOT EXISTS portal_last_accessed timestamp with time zone;
ALTER TABLE public.contractors ADD COLUMN IF NOT EXISTS portal_last_accessed timestamp with time zone;

-- ---------------------------------------------------------------------
-- VERIFY — every row should report is_present = true
-- ---------------------------------------------------------------------
WITH expected(tbl, col) AS (
  VALUES
    ('customers', 'portal_token'),
    ('contractors', 'portal_token'),
    ('customers', 'portal_last_accessed'),
    ('contractors', 'portal_last_accessed')
)
SELECT (e.tbl || '.' || e.col) AS object_name,
       (c.column_name IS NOT NULL) AS is_present
FROM expected e
LEFT JOIN information_schema.columns c
  ON c.table_schema = 'public'
 AND c.table_name = e.tbl
 AND c.column_name = e.col
UNION ALL
SELECT 'portal_access_log (table)',
       (to_regclass('public.portal_access_log') IS NOT NULL)
UNION ALL
SELECT 'portal_sessions (table)',
       (to_regclass('public.portal_sessions') IS NOT NULL)
UNION ALL
SELECT 'portal_contractor_job_ids (function)',
       (to_regprocedure('public.portal_contractor_job_ids(uuid,text)') IS NOT NULL)
UNION ALL
SELECT 'customers_portal_token_key (unique index)',
       (to_regclass('public.customers_portal_token_key') IS NOT NULL)
UNION ALL
SELECT 'contractors_portal_token_key (unique index)',
       (to_regclass('public.contractors_portal_token_key') IS NOT NULL);
