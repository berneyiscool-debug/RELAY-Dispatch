-- =====================================================================
-- XERO INTEGRATION — Phase 1 schema (docs/XERO_PHASE1_PLAN.md §1)
-- =====================================================================
-- One Xero organisation per cloud company. RELAY pushes contacts, invoices and
-- RELAY-recorded payments; Xero's paid status is pulled back via webhook.
--
-- Sync is driven from the database, not the UI: invoice status changes in many
-- client paths (actions, InvoiceDetail, bulk list actions) and server-side in
-- relay-stripe-webhook, so an AFTER trigger on invoices enqueues work into
-- xero_sync_jobs and the relay-xero-sync worker drains it.
--
-- Everything Xero-related is server-managed: OAuth tokens are readable only by
-- the service role, and the xero_* link columns are frozen against client JWT
-- writes the same way companies_billing_guard freezes the Stripe columns.
-- Nothing is enqueued until a company has a connection, so applying this
-- migration changes no behaviour on its own.

-- ── 1. Connection (one per company) ──────────────────────────────────
-- Tokens are encrypted by the edge functions (AES-GCM, XERO_TOKEN_KEY) before
-- they are stored here; the database only ever holds ciphertext.
CREATE TABLE IF NOT EXISTS public.xero_connections (
  company_id         uuid PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
  tenant_id          text,
  tenant_name        text,
  connection_id      text,
  base_currency      text,
  access_token_enc   text,
  refresh_token_enc  text,
  access_expires_at  timestamptz,
  refreshed_at       timestamptz,
  scopes             text,
  status             text NOT NULL DEFAULT 'active' CHECK (status IN (
                       'active', 'needs_reauth', 'choose_tenant', 'unsupported_currency', 'disconnected'
                     )),
  last_error         text,
  connected_by       uuid,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  -- A usable (or recoverable) connection always names its Xero organisation.
  CHECK (status NOT IN ('active', 'needs_reauth') OR tenant_id IS NOT NULL)
);

-- The webhook resolves a company from the tenantId on each event. One Xero org
-- can only feed one live RELAY company.
CREATE UNIQUE INDEX IF NOT EXISTS xero_connections_tenant_idx
  ON public.xero_connections (tenant_id)
  WHERE tenant_id IS NOT NULL AND status <> 'disconnected';

-- RLS on with no policies: only the service role (BYPASSRLS) can touch it.
ALTER TABLE public.xero_connections ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.xero_connections FROM PUBLIC;
REVOKE ALL ON public.xero_connections FROM anon, authenticated;

-- ── 2. Link + sync-state columns (server-managed) ────────────────────
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS xero_contact_id text;

ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS xero_invoice_id text;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS xero_status text;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS xero_amount_due numeric;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS xero_synced_at timestamptz;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS xero_sync_error text;
-- RELAY payment reference (payment id or Stripe session id) → Xero PaymentID,
-- so a payment is pushed to Xero exactly once.
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS xero_payment_ids jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS invoices_xero_invoice_id_idx
  ON public.invoices (xero_invoice_id) WHERE xero_invoice_id IS NOT NULL;

-- ── 3. Sync queue ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.xero_sync_jobs (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  company_id  uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  entity      text NOT NULL CHECK (entity IN ('invoice', 'contact', 'xero_invoice')),
  entity_id   text NOT NULL,
  action      text NOT NULL CHECK (action IN ('upsert', 'void', 'pay', 'refresh')),
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'done', 'failed', 'skipped')),
  attempts    integer NOT NULL DEFAULT 0,
  run_after   timestamptz NOT NULL DEFAULT now(),
  last_error  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Repeated edits collapse into the one pending job for that record + action.
CREATE UNIQUE INDEX IF NOT EXISTS xero_sync_jobs_pending_uniq
  ON public.xero_sync_jobs (company_id, entity, entity_id, action)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS xero_sync_jobs_due_idx
  ON public.xero_sync_jobs (status, run_after);

-- Company users may read their own sync log (Settings, invoice badges); only
-- the triggers below and the service-role worker write it.
ALTER TABLE public.xero_sync_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS xero_sync_jobs_tenant_read ON public.xero_sync_jobs;
CREATE POLICY xero_sync_jobs_tenant_read ON public.xero_sync_jobs
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));
REVOKE ALL ON public.xero_sync_jobs FROM PUBLIC;
REVOKE ALL ON public.xero_sync_jobs FROM anon, authenticated;
GRANT SELECT ON public.xero_sync_jobs TO authenticated;

-- ── 4. Client-safe connection status (no tokens) ─────────────────────
CREATE OR REPLACE FUNCTION public.xero_connection_status()
RETURNS TABLE (
  tenant_name   text,
  base_currency text,
  status        text,
  last_error    text,
  updated_at    timestamptz,
  pending_jobs  integer,
  failed_jobs   integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.tenant_name, c.base_currency, c.status, c.last_error, c.updated_at,
         (SELECT count(*)::int FROM public.xero_sync_jobs j
           WHERE j.company_id = c.company_id AND j.status IN ('pending', 'running')),
         (SELECT count(*)::int FROM public.xero_sync_jobs j
           WHERE j.company_id = c.company_id AND j.status = 'failed')
  FROM public.xero_connections c
  WHERE c.company_id = public.get_user_company_id(auth.uid())
$$;
REVOKE ALL ON FUNCTION public.xero_connection_status() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.xero_connection_status() FROM anon;
GRANT EXECUTE ON FUNCTION public.xero_connection_status() TO authenticated;

-- ── 5. Freeze the xero_* columns against client writes ───────────────
-- Same rule as companies_billing_guard: a client JWT (auth.uid() set) cannot
-- create or change them; the service role (no JWT) passes untouched.
CREATE OR REPLACE FUNCTION public.invoices_xero_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.xero_invoice_id  := NULL;
    NEW.xero_status      := NULL;
    NEW.xero_amount_due  := NULL;
    NEW.xero_synced_at   := NULL;
    NEW.xero_sync_error  := NULL;
    NEW.xero_payment_ids := '{}'::jsonb;
    RETURN NEW;
  END IF;

  NEW.xero_invoice_id  := OLD.xero_invoice_id;
  NEW.xero_status      := OLD.xero_status;
  NEW.xero_amount_due  := OLD.xero_amount_due;
  NEW.xero_synced_at   := OLD.xero_synced_at;
  NEW.xero_sync_error  := OLD.xero_sync_error;
  NEW.xero_payment_ids := OLD.xero_payment_ids;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS invoices_xero_guard ON public.invoices;
CREATE TRIGGER invoices_xero_guard
  BEFORE INSERT OR UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.invoices_xero_guard();

CREATE OR REPLACE FUNCTION public.customers_xero_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.xero_contact_id := NULL;
  ELSE
    NEW.xero_contact_id := OLD.xero_contact_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS customers_xero_guard ON public.customers;
CREATE TRIGGER customers_xero_guard
  BEFORE INSERT OR UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.customers_xero_guard();

-- ── 6. Enqueue ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.xero_enqueue(
  p_company_id uuid,
  p_entity     text,
  p_entity_id  text,
  p_action     text
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.xero_sync_jobs (company_id, entity, entity_id, action)
  VALUES (p_company_id, p_entity, p_entity_id, p_action)
  ON CONFLICT (company_id, entity, entity_id, action) WHERE status = 'pending'
  DO NOTHING
$$;
REVOKE ALL ON FUNCTION public.xero_enqueue(uuid, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.xero_enqueue(uuid, text, text, text) FROM anon, authenticated;

-- Has this company connected Xero? needs_reauth still queues, so work made
-- while the connection is broken goes out once the admin reconnects.
CREATE OR REPLACE FUNCTION public.xero_company_connected(p_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.xero_connections
    WHERE company_id = p_company_id AND status IN ('active', 'needs_reauth')
  )
$$;
REVOKE ALL ON FUNCTION public.xero_company_connected(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.xero_company_connected(uuid) FROM anon, authenticated;

-- Invoice changes → jobs. Rules (plan §1f):
--   * Draft invoices are never pushed.
--   * Not yet in Xero + any relevant change on a non-Draft, non-Void invoice → upsert.
--   * In Xero + content change → upsert, unless Xero already holds a payment
--     (Xero then owns the invoice and RELAY edits are not pushed).
--   * → Paid → pay (the worker upserts first when the invoice is not in Xero yet).
--   * → Void while in Xero → void.
-- Writes made while applying Xero's own state (relay.xero_sync = 'true', set by
-- xero_apply_invoice_pull) never enqueue, so a pull can't echo back as a push.
CREATE OR REPLACE FUNCTION public.invoices_xero_enqueue()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  content_changed boolean;
  became_paid     boolean;
  became_void     boolean;
  xero_has_payment boolean;
BEGIN
  IF current_setting('relay.xero_sync', true) = 'true' THEN
    RETURN NEW;
  END IF;

  -- Fail open: a Xero problem must never stop an invoice or customer being
  -- saved. The change is logged and can be re-sent with Retry in Settings.
  BEGIN
    IF NOT public.xero_company_connected(NEW.company_id) THEN
      RETURN NEW;
    END IF;

    IF TG_OP = 'INSERT' THEN
      content_changed := true;
      became_paid := NEW.status = 'Paid';
      became_void := false;
    ELSE
      content_changed :=
           NEW.status        IS DISTINCT FROM OLD.status
        OR NEW.number        IS DISTINCT FROM OLD.number
        OR NEW.title         IS DISTINCT FROM OLD.title
        OR NEW.customer_id   IS DISTINCT FROM OLD.customer_id
        OR NEW.customer_name IS DISTINCT FROM OLD.customer_name
        OR NEW.job_id        IS DISTINCT FROM OLD.job_id
        OR NEW.line_items    IS DISTINCT FROM OLD.line_items
        OR NEW.subtotal      IS DISTINCT FROM OLD.subtotal
        OR NEW.tax           IS DISTINCT FROM OLD.tax
        OR NEW.total         IS DISTINCT FROM OLD.total
        OR NEW.due_date      IS DISTINCT FROM OLD.due_date;
      became_paid := NEW.status = 'Paid' AND OLD.status IS DISTINCT FROM 'Paid';
      became_void := NEW.status = 'Void' AND OLD.status IS DISTINCT FROM 'Void';
    END IF;

    -- Updates that only touched xero_* (worker results) or unrelated columns.
    IF NOT content_changed THEN
      RETURN NEW;
    END IF;

    IF NEW.status = 'Draft' THEN
      RETURN NEW;
    END IF;

    IF NEW.status = 'Void' THEN
      IF became_void AND NEW.xero_invoice_id IS NOT NULL THEN
        PERFORM public.xero_enqueue(NEW.company_id, 'invoice', NEW.id, 'void');
      END IF;
      RETURN NEW;
    END IF;

    xero_has_payment :=
         NEW.xero_status = 'PAID'
      OR NEW.xero_payment_ids <> '{}'::jsonb
      OR (TG_OP = 'UPDATE' AND NEW.xero_amount_due IS NOT NULL AND NEW.xero_amount_due < OLD.total);

    IF NEW.xero_invoice_id IS NULL OR NOT xero_has_payment THEN
      PERFORM public.xero_enqueue(NEW.company_id, 'invoice', NEW.id, 'upsert');
    END IF;

    IF became_paid THEN
      PERFORM public.xero_enqueue(NEW.company_id, 'invoice', NEW.id, 'pay');
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'relay xero: could not queue sync for invoice % (%): %', NEW.id, SQLSTATE, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS invoices_xero_enqueue ON public.invoices;
CREATE TRIGGER invoices_xero_enqueue
  AFTER INSERT OR UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.invoices_xero_enqueue();

-- A customer already linked to a Xero contact pushes its detail changes.
-- Unlinked customers are created in Xero on demand when an invoice goes out.
CREATE OR REPLACE FUNCTION public.customers_xero_enqueue()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('relay.xero_sync', true) = 'true' THEN
    RETURN NEW;
  END IF;
  IF NEW.xero_contact_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Fail open: a Xero problem must never stop an invoice or customer being
  -- saved. The change is logged and can be re-sent with Retry in Settings.
  BEGIN
    IF NEW.company       IS NOT DISTINCT FROM OLD.company
       AND NEW.first_name IS NOT DISTINCT FROM OLD.first_name
       AND NEW.last_name  IS NOT DISTINCT FROM OLD.last_name
       AND NEW.email      IS NOT DISTINCT FROM OLD.email
       AND NEW.phone      IS NOT DISTINCT FROM OLD.phone
       AND NEW.address    IS NOT DISTINCT FROM OLD.address THEN
      RETURN NEW;
    END IF;
    IF public.xero_company_connected(NEW.company_id) THEN
      PERFORM public.xero_enqueue(NEW.company_id, 'contact', NEW.id, 'upsert');
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'relay xero: could not queue sync for customer % (%): %', NEW.id, SQLSTATE, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS customers_xero_enqueue ON public.customers;
CREATE TRIGGER customers_xero_enqueue
  AFTER UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.customers_xero_enqueue();

-- ── 7. Worker RPCs (service role only) ───────────────────────────────
-- Claim due jobs for relay-xero-sync. SKIP LOCKED lets overlapping worker runs
-- share the queue; a job stuck in 'running' for 10 minutes (a worker that died
-- mid-run) is reclaimed. Oldest first, so a Draft→Paid invoice upserts before
-- its pay job runs.
--   * Only companies with an ACTIVE connection: a needs_reauth company's work
--     waits in the queue until an admin reconnects, instead of failing.
--   * p_company_id narrows a run to one company (the in-app "sync now" nudge).
--   * p_actions narrows to the job kinds the deployed worker handles.
DROP FUNCTION IF EXISTS public.xero_claim_sync_jobs(integer);
CREATE OR REPLACE FUNCTION public.xero_claim_sync_jobs(
  p_limit      integer DEFAULT 25,
  p_company_id uuid    DEFAULT NULL,
  p_actions    text[]  DEFAULT NULL
)
RETURNS SETOF public.xero_sync_jobs
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.xero_sync_jobs j
     SET status = 'running', attempts = j.attempts + 1, updated_at = now()
   WHERE j.id IN (
     SELECT q.id FROM public.xero_sync_jobs q
       JOIN public.xero_connections c ON c.company_id = q.company_id AND c.status = 'active'
      WHERE ((q.status = 'pending' AND q.run_after <= now())
          OR (q.status = 'running' AND q.updated_at < now() - interval '10 minutes'))
        AND (p_company_id IS NULL OR q.company_id = p_company_id)
        AND (p_actions IS NULL OR q.action = ANY (p_actions))
      ORDER BY q.id
      LIMIT greatest(1, least(coalesce(p_limit, 25), 200))
      FOR UPDATE OF q SKIP LOCKED
   )
  RETURNING j.*
$$;
REVOKE ALL ON FUNCTION public.xero_claim_sync_jobs(integer, uuid, text[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.xero_claim_sync_jobs(integer, uuid, text[]) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.xero_claim_sync_jobs(integer, uuid, text[]) TO service_role;

-- Apply Xero's state to a RELAY invoice (webhook pull). Runs with
-- relay.xero_sync set so the enqueue trigger stays quiet. Xero PAID flips a
-- RELAY invoice to Paid; Xero VOIDED is only flagged, never auto-voided.
CREATE OR REPLACE FUNCTION public.xero_apply_invoice_pull(
  p_company_id      uuid,
  p_xero_invoice_id text,
  p_xero_status     text,
  p_amount_due      numeric,
  p_paid_date       date
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv public.invoices%ROWTYPE;
BEGIN
  SELECT * INTO inv FROM public.invoices
   WHERE company_id = p_company_id AND xero_invoice_id = p_xero_invoice_id
   LIMIT 1;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  PERFORM set_config('relay.xero_sync', 'true', true);

  UPDATE public.invoices SET
    xero_status     = p_xero_status,
    xero_amount_due = p_amount_due,
    xero_synced_at  = now(),
    xero_sync_error = CASE
      WHEN p_xero_status = 'VOIDED' AND inv.status <> 'Void'
        THEN 'Voided in Xero but not in RELAY. Void it here or restore it in Xero.'
      ELSE NULL
    END,
    status         = CASE WHEN p_xero_status = 'PAID' AND inv.status NOT IN ('Paid', 'Void') THEN 'Paid' ELSE status END,
    paid_date      = CASE WHEN p_xero_status = 'PAID' AND inv.status NOT IN ('Paid', 'Void') THEN coalesce(p_paid_date, current_date) ELSE paid_date END,
    payment_method = CASE WHEN p_xero_status = 'PAID' AND inv.status NOT IN ('Paid', 'Void') THEN 'Xero' ELSE payment_method END,
    updated_at     = now()
  WHERE id = inv.id;

  PERFORM set_config('relay.xero_sync', 'false', true);
  RETURN inv.id;
END;
$$;
REVOKE ALL ON FUNCTION public.xero_apply_invoice_pull(uuid, text, text, numeric, date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.xero_apply_invoice_pull(uuid, text, text, numeric, date) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.xero_apply_invoice_pull(uuid, text, text, numeric, date) TO service_role;

-- Put failed jobs back in the queue (Settings → "Retry failed"). A failed job
-- whose record already has a newer pending job is dropped instead, since the
-- pending one will push the latest state anyway. Returns how many were requeued.
CREATE OR REPLACE FUNCTION public.xero_retry_failed_jobs(p_company_id uuid, p_job_id bigint DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requeued integer;
BEGIN
  DELETE FROM public.xero_sync_jobs f
   WHERE f.company_id = p_company_id AND f.status = 'failed'
     AND (p_job_id IS NULL OR f.id = p_job_id)
     AND EXISTS (
       SELECT 1 FROM public.xero_sync_jobs p
        WHERE p.company_id = f.company_id AND p.entity = f.entity AND p.entity_id = f.entity_id
          AND p.action = f.action AND p.status = 'pending'
     );

  -- Retrying everything: several failed attempts at the same record + action
  -- collapse to the newest.
  DELETE FROM public.xero_sync_jobs f
   WHERE f.company_id = p_company_id AND f.status = 'failed'
     AND p_job_id IS NULL
     AND EXISTS (
       SELECT 1 FROM public.xero_sync_jobs n
        WHERE n.company_id = f.company_id AND n.entity = f.entity AND n.entity_id = f.entity_id
          AND n.action = f.action AND n.status = 'failed' AND n.id > f.id
     );

  UPDATE public.xero_sync_jobs
     SET status = 'pending', attempts = 0, run_after = now(), last_error = NULL, updated_at = now()
   WHERE company_id = p_company_id AND status = 'failed'
     AND (p_job_id IS NULL OR id = p_job_id);
  GET DIAGNOSTICS requeued = ROW_COUNT;
  RETURN requeued;
END;
$$;
REVOKE ALL ON FUNCTION public.xero_retry_failed_jobs(uuid, bigint) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.xero_retry_failed_jobs(uuid, bigint) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.xero_retry_failed_jobs(uuid, bigint) TO service_role;

-- Webhook → queue. Resolves the company from Xero's tenantId and queues a pull
-- only for invoices RELAY actually pushed, so events about the tenant's other
-- Xero invoices cost nothing. Returns how many pulls were queued (repeats of a
-- pending pull collapse).
CREATE OR REPLACE FUNCTION public.xero_enqueue_pulls(p_tenant_id text, p_xero_invoice_ids text[])
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company uuid;
  queued integer;
BEGIN
  SELECT company_id INTO v_company FROM public.xero_connections
   WHERE tenant_id = p_tenant_id AND status IN ('active', 'needs_reauth')
   LIMIT 1;
  IF v_company IS NULL OR p_xero_invoice_ids IS NULL THEN
    RETURN 0;
  END IF;

  INSERT INTO public.xero_sync_jobs (company_id, entity, entity_id, action)
  SELECT DISTINCT v_company, 'xero_invoice', i.xero_invoice_id, 'refresh'
    FROM public.invoices i
   WHERE i.company_id = v_company
     AND i.xero_invoice_id = ANY (p_xero_invoice_ids[1:500])
  ON CONFLICT (company_id, entity, entity_id, action) WHERE status = 'pending'
  DO NOTHING;
  GET DIAGNOSTICS queued = ROW_COUNT;
  RETURN queued;
END;
$$;
REVOKE ALL ON FUNCTION public.xero_enqueue_pulls(text, text[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.xero_enqueue_pulls(text, text[]) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.xero_enqueue_pulls(text, text[]) TO service_role;
