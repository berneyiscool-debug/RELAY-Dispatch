-- =====================================================================
-- SUBSCRIPTION BILLING (v1.3 — Free / Cloud / Cloud+)
-- =====================================================================
-- RELAY's own billing of its tenants (NOT the customer-facing `invoices`
-- table, which is a tenant billing THEIR customers — see 007_invoice_payments).
--
-- Tiers:
--   free       — offline/local account only, never has a cloud `companies` row
--   cloud      — $18 / active user / month  (core cloud features)
--   cloud_plus — $21 / active user / month  (adds managed AI + integrations)
--
-- Every cloud company is Cloud or Cloud+. There is no "free" row: free means
-- the app runs entirely offline (IndexedDB, `acct_`-prefixed id) and never
-- reaches this table. Seats are billed per ACTIVE (non-deactivated) profile,
-- reconciled to Stripe's subscription quantity with proration.
--
-- SECURITY: these columns are RELAY-owned money state. A client session must
-- never write them (or a tenant could self-upgrade to Cloud+ for free, or fake
-- an "active" status). They are written ONLY by:
--   • the Stripe webhook / billing edge functions (service-role, no user JWT), or
--   • the relay.admin_provision flag used by our SECURITY DEFINER provisioners.
-- Enforced by companies_billing_guard below, mirroring profiles_security_guard
-- in 020_security_hardening.sql. Clients still READ these columns (they own the
-- row via companies_tenant_policy) to render the Billing tab and gate features.

-- ── Columns ──────────────────────────────────────────────────────────
ALTER TABLE companies ADD COLUMN IF NOT EXISTS subscription_tier text;                 -- 'cloud' | 'cloud_plus' | NULL (not yet subscribed)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS subscription_status text;               -- Stripe status: trialing|active|past_due|canceled|incomplete|unpaid|NULL
ALTER TABLE companies ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS stripe_subscription_id text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS subscription_seats integer;             -- last seat quantity synced to Stripe
ALTER TABLE companies ADD COLUMN IF NOT EXISTS subscription_current_period_end timestamptz;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS subscription_updated_at timestamptz;

-- Tier must be one of the known values (or NULL). Guards against typos in code.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'companies_subscription_tier_check'
  ) THEN
    ALTER TABLE companies
      ADD CONSTRAINT companies_subscription_tier_check
      CHECK (subscription_tier IS NULL OR subscription_tier IN ('cloud', 'cloud_plus'));
  END IF;
END $$;

-- Webhook and billing functions look companies up by these ids — index them.
CREATE INDEX IF NOT EXISTS companies_stripe_customer_id_idx
  ON companies (stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS companies_stripe_subscription_id_idx
  ON companies (stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;

-- ── Client write guard (server-managed billing columns) ──────────────
-- Same shape as profiles_security_guard (020): service-role calls (no JWT) and
-- our admin_provision SECURITY DEFINER functions pass through; ordinary client
-- sessions have these columns frozen to their previous values, and forced NULL
-- on INSERT so a freshly self-signed-up company starts unsubscribed.
CREATE OR REPLACE FUNCTION public.companies_billing_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL
     OR current_setting('relay.admin_provision', true) = 'true' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.subscription_tier               := NULL;
    NEW.subscription_status             := NULL;
    NEW.stripe_customer_id              := NULL;
    NEW.stripe_subscription_id          := NULL;
    NEW.subscription_seats              := NULL;
    NEW.subscription_current_period_end := NULL;
    NEW.subscription_updated_at         := NULL;
    RETURN NEW;
  END IF;

  -- UPDATE: freeze every billing column to its stored value.
  NEW.subscription_tier               := OLD.subscription_tier;
  NEW.subscription_status             := OLD.subscription_status;
  NEW.stripe_customer_id              := OLD.stripe_customer_id;
  NEW.stripe_subscription_id          := OLD.stripe_subscription_id;
  NEW.subscription_seats              := OLD.subscription_seats;
  NEW.subscription_current_period_end := OLD.subscription_current_period_end;
  NEW.subscription_updated_at         := OLD.subscription_updated_at;
  RETURN NEW;
END;
$$;

-- Runs AFTER the existing company_email_slug_biu trigger fires alphabetically
-- ("companies_billing_guard" > "company_email_slug"): both are BEFORE row
-- triggers and independent, so ordering is immaterial here.
DROP TRIGGER IF EXISTS companies_billing_guard_biu ON public.companies;
CREATE TRIGGER companies_billing_guard_biu
  BEFORE INSERT OR UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.companies_billing_guard();

-- ── Active seat count helper ─────────────────────────────────────────
-- Single source of truth for "how many seats does this company owe for":
-- every non-deactivated profile. Used by the billing edge functions (via the
-- service role) to reconcile Stripe's subscription quantity.
CREATE OR REPLACE FUNCTION public.company_active_seat_count(p_company_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int
  FROM public.profiles
  WHERE company_id = p_company_id
    AND COALESCE(deactivated, false) = false;
$$;

REVOKE EXECUTE ON FUNCTION public.company_active_seat_count(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.company_active_seat_count(uuid) FROM anon;
GRANT  EXECUTE ON FUNCTION public.company_active_seat_count(uuid) TO authenticated;
