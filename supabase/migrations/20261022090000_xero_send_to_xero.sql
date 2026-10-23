-- =====================================================================
-- XERO — "Send to Xero" (backfill and manual resend)
-- =====================================================================
-- The enqueue trigger only fires when an invoice changes, so invoices sent
-- before a company connected Xero never reach it on their own. This RPC queues
-- them on request (Settings → Accounting → "Send to Xero", or the invoice
-- list's bulk action). Service role only: relay-xero-status checks the caller
-- is a company admin and passes their company id.
--
--   p_invoice_ids NULL  → every sent invoice not yet in Xero (the backfill)
--   p_invoice_ids set   → those invoices, even if already linked (a resend;
--                         the worker still won't touch one Xero holds a payment on)
--
-- Drafts and voids are never queued. Paid invoices also get their payment
-- queued unless one has already been pushed. Returns how many invoices were
-- queued; repeats collapse into the pending job like any other change.

CREATE OR REPLACE FUNCTION public.xero_enqueue_invoices(p_company_id uuid, p_invoice_ids text[] DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  queued integer := 0;
  inv record;
BEGIN
  IF NOT public.xero_company_connected(p_company_id) THEN
    RETURN 0;
  END IF;

  FOR inv IN
    SELECT id, status, xero_payment_ids
      FROM public.invoices
     WHERE company_id = p_company_id
       AND coalesce(status, 'Draft') NOT IN ('Draft', 'Void')
       AND (
         (p_invoice_ids IS NULL AND xero_invoice_id IS NULL)
         OR (p_invoice_ids IS NOT NULL AND id = ANY (p_invoice_ids[1:500]))
       )
     ORDER BY created_at, id
     LIMIT 1000
  LOOP
    PERFORM public.xero_enqueue(p_company_id, 'invoice', inv.id, 'upsert');
    IF inv.status = 'Paid' AND inv.xero_payment_ids = '{}'::jsonb THEN
      PERFORM public.xero_enqueue(p_company_id, 'invoice', inv.id, 'pay');
    END IF;
    queued := queued + 1;
  END LOOP;

  RETURN queued;
END;
$$;
REVOKE ALL ON FUNCTION public.xero_enqueue_invoices(uuid, text[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.xero_enqueue_invoices(uuid, text[]) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.xero_enqueue_invoices(uuid, text[]) TO service_role;
