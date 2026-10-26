-- =====================================================================
-- XERO PHASE 2a — stock ↔ Xero Items (docs/XERO_PHASE2_ITEMS_PLAN.md)
-- =====================================================================
-- Each RELAY stock row becomes an untracked Xero Item, so material lines on
-- pushed invoices carry an ItemCode. RELAY keeps owning quantities; Xero
-- never sees stock levels.
--
-- Same shape as Phase 1: an AFTER trigger queues 'item' jobs into
-- xero_sync_jobs, the relay-xero-sync worker drains them, and the xero_*
-- columns are frozen against client JWT writes. Xero has no Items webhook, so
-- changes made in Xero only come back through the one-off import below.

-- ── 1. Link + sync-state columns (server-managed) ────────────────────
ALTER TABLE public.stock ADD COLUMN IF NOT EXISTS xero_item_id text;
-- The Code RELAY last pushed, so a SKU edit renames the item instead of
-- creating a second one.
ALTER TABLE public.stock ADD COLUMN IF NOT EXISTS xero_item_code text;
ALTER TABLE public.stock ADD COLUMN IF NOT EXISTS xero_synced_at timestamptz;
ALTER TABLE public.stock ADD COLUMN IF NOT EXISTS xero_sync_error text;

CREATE INDEX IF NOT EXISTS stock_xero_item_id_idx
  ON public.stock (xero_item_id) WHERE xero_item_id IS NOT NULL;

-- ── 2. Queue accepts item jobs ───────────────────────────────────────
ALTER TABLE public.xero_sync_jobs DROP CONSTRAINT IF EXISTS xero_sync_jobs_entity_check;
ALTER TABLE public.xero_sync_jobs ADD CONSTRAINT xero_sync_jobs_entity_check
  CHECK (entity IN ('invoice', 'contact', 'xero_invoice', 'item'));

-- ── 3. Freeze the xero_* columns against client writes ───────────────
CREATE OR REPLACE FUNCTION public.stock_xero_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.xero_item_id    := NULL;
    NEW.xero_item_code  := NULL;
    NEW.xero_synced_at  := NULL;
    NEW.xero_sync_error := NULL;
    RETURN NEW;
  END IF;

  NEW.xero_item_id    := OLD.xero_item_id;
  NEW.xero_item_code  := OLD.xero_item_code;
  NEW.xero_synced_at  := OLD.xero_synced_at;
  NEW.xero_sync_error := OLD.xero_sync_error;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS stock_xero_guard ON public.stock;
CREATE TRIGGER stock_xero_guard
  BEFORE INSERT OR UPDATE ON public.stock
  FOR EACH ROW EXECUTE FUNCTION public.stock_xero_guard();

-- ── 4. Enqueue ────────────────────────────────────────────────────────
-- New stock, or a change to what Xero shows (name, SKU, prices, unit,
-- category), queues an upsert. Quantity and location moves are RELAY's own
-- business and queue nothing, so day-to-day stock use costs no Xero calls.
CREATE OR REPLACE FUNCTION public.stock_xero_enqueue()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('relay.xero_sync', true) = 'true' THEN
    RETURN NEW;
  END IF;

  -- Fail open: a Xero problem must never stop stock being saved.
  BEGIN
    IF TG_OP = 'UPDATE'
       AND NEW.name       IS NOT DISTINCT FROM OLD.name
       AND NEW.sku        IS NOT DISTINCT FROM OLD.sku
       AND NEW.unit_price IS NOT DISTINCT FROM OLD.unit_price
       AND NEW.cost_price IS NOT DISTINCT FROM OLD.cost_price
       AND NEW.unit       IS NOT DISTINCT FROM OLD.unit
       AND NEW.category   IS NOT DISTINCT FROM OLD.category THEN
      RETURN NEW;
    END IF;
    IF public.xero_company_connected(NEW.company_id) THEN
      PERFORM public.xero_enqueue(NEW.company_id, 'item', NEW.id, 'upsert');
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'relay xero: could not queue sync for stock % (%): %', NEW.id, SQLSTATE, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS stock_xero_enqueue ON public.stock;
CREATE TRIGGER stock_xero_enqueue
  AFTER INSERT OR UPDATE ON public.stock
  FOR EACH ROW EXECUTE FUNCTION public.stock_xero_enqueue();

REVOKE ALL ON FUNCTION public.stock_xero_enqueue() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.stock_xero_enqueue() FROM anon, authenticated;

-- ── 5. "Send stock to Xero" (backfill and manual resend) ─────────────
--   p_stock_ids NULL → every stock item not yet in Xero
--   p_stock_ids set  → those items, even if already linked
-- Service role only: relay-xero-status checks the caller is an admin.
CREATE OR REPLACE FUNCTION public.xero_enqueue_items(p_company_id uuid, p_stock_ids text[] DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  queued integer := 0;
  item record;
BEGIN
  IF NOT public.xero_company_connected(p_company_id) THEN
    RETURN 0;
  END IF;

  FOR item IN
    SELECT id FROM public.stock
     WHERE company_id = p_company_id
       AND (
         (p_stock_ids IS NULL AND xero_item_id IS NULL)
         OR (p_stock_ids IS NOT NULL AND id = ANY (p_stock_ids[1:500]))
       )
     ORDER BY created_at, id
     LIMIT 2000
  LOOP
    PERFORM public.xero_enqueue(p_company_id, 'item', item.id, 'upsert');
    queued := queued + 1;
  END LOOP;

  RETURN queued;
END;
$$;
REVOKE ALL ON FUNCTION public.xero_enqueue_items(uuid, text[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.xero_enqueue_items(uuid, text[]) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.xero_enqueue_items(uuid, text[]) TO service_role;

-- ── 6. Import items from Xero (one-off) ──────────────────────────────
-- relay-xero-status reads GET /Items and passes the list here as
-- [{ id, code, name, description, salePrice, purchasePrice }]. Each Xero item
-- is matched to stock by an existing link, then SKU = Code, then name (both
-- case-insensitive, unlinked stock only). Matches are linked; the rest become
-- new stock rows with quantity 0. Runs with relay.xero_sync set, so nothing
-- it writes echoes back to Xero.
--
-- p_dry_run true → only counts, for the "Import N items?" confirm.
-- Returns { linked, created, already_linked }.
CREATE OR REPLACE FUNCTION public.xero_import_items(p_company_id uuid, p_items jsonb, p_dry_run boolean DEFAULT false)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  x jsonb;
  v_id text;
  v_code text;
  v_name text;
  v_stock text;
  linked integer := 0;
  created integer := 0;
  already integer := 0;
  claimed text[] := '{}';
BEGIN
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' THEN
    RETURN jsonb_build_object('linked', 0, 'created', 0, 'already_linked', 0);
  END IF;

  IF NOT p_dry_run THEN
    PERFORM set_config('relay.xero_sync', 'true', true);
  END IF;

  FOR x IN SELECT value FROM jsonb_array_elements(p_items) LIMIT 5000 LOOP
    v_id   := nullif(trim(x->>'id'), '');
    v_code := nullif(trim(x->>'code'), '');
    v_name := nullif(trim(x->>'name'), '');
    CONTINUE WHEN v_id IS NULL OR (v_code IS NULL AND v_name IS NULL);

    IF EXISTS (SELECT 1 FROM public.stock WHERE company_id = p_company_id AND xero_item_id = v_id) THEN
      already := already + 1;
      CONTINUE;
    END IF;

    v_stock := NULL;
    IF v_code IS NOT NULL THEN
      SELECT id INTO v_stock FROM public.stock
       WHERE company_id = p_company_id AND xero_item_id IS NULL
         AND lower(trim(sku)) = lower(v_code) AND NOT (id = ANY (claimed))
       ORDER BY created_at, id LIMIT 1;
    END IF;
    IF v_stock IS NULL AND v_name IS NOT NULL THEN
      SELECT id INTO v_stock FROM public.stock
       WHERE company_id = p_company_id AND xero_item_id IS NULL
         AND lower(trim(name)) = lower(v_name) AND NOT (id = ANY (claimed))
       ORDER BY created_at, id LIMIT 1;
    END IF;

    IF v_stock IS NOT NULL THEN
      claimed := claimed || v_stock;
      linked := linked + 1;
      IF NOT p_dry_run THEN
        UPDATE public.stock
           SET xero_item_id = v_id, xero_item_code = v_code,
               xero_synced_at = now(), xero_sync_error = NULL
         WHERE id = v_stock;
      END IF;
    ELSE
      created := created + 1;
      IF NOT p_dry_run THEN
        INSERT INTO public.stock (company_id, name, sku, unit_price, cost_price, quantity,
                                  xero_item_id, xero_item_code, xero_synced_at)
        VALUES (
          p_company_id,
          coalesce(v_name, v_code),
          v_code,
          coalesce(nullif(x->>'salePrice', '')::numeric, 0),
          coalesce(nullif(x->>'purchasePrice', '')::numeric, 0),
          0,
          v_id, v_code, now()
        );
      END IF;
    END IF;
  END LOOP;

  IF NOT p_dry_run THEN
    PERFORM set_config('relay.xero_sync', 'false', true);
  END IF;

  RETURN jsonb_build_object('linked', linked, 'created', created, 'already_linked', already);
END;
$$;
REVOKE ALL ON FUNCTION public.xero_import_items(uuid, jsonb, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.xero_import_items(uuid, jsonb, boolean) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.xero_import_items(uuid, jsonb, boolean) TO service_role;
