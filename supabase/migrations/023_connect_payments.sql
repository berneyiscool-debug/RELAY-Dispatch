-- =====================================================================
-- STRIPE CONNECT — customer invoice payments to the tenant's own account
-- =====================================================================
-- Separate from RELAY's own subscription billing (022). Here each tenant
-- connects THEIR OWN Stripe (Express) account, and their customers pay
-- invoices directly into it (direct charges via the Stripe-Account header).
--
-- These columns are server-managed like the subscription ones: only the
-- Connect edge functions / webhook (service role) write them. Clients read
-- them to render Settings → Payments and gate the Pay buttons.

ALTER TABLE companies ADD COLUMN IF NOT EXISTS stripe_connect_account_id text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS stripe_connect_charges_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS stripe_connect_details_submitted boolean NOT NULL DEFAULT false;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS stripe_connect_updated_at timestamptz;

-- Webhook (account.updated) looks the company up by connected-account id.
CREATE INDEX IF NOT EXISTS companies_stripe_connect_account_id_idx
  ON companies (stripe_connect_account_id) WHERE stripe_connect_account_id IS NOT NULL;

-- Extend the billing write-guard to also freeze the Connect columns against
-- client writes (a tenant must not fake "charges enabled" or point at another
-- account). Same shape as 022 — service role (no JWT) and admin_provision pass.
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
    NEW.stripe_connect_account_id       := NULL;
    NEW.stripe_connect_charges_enabled  := false;
    NEW.stripe_connect_details_submitted := false;
    NEW.stripe_connect_updated_at       := NULL;
    RETURN NEW;
  END IF;

  -- UPDATE: freeze every billing/connect column to its stored value.
  NEW.subscription_tier               := OLD.subscription_tier;
  NEW.subscription_status             := OLD.subscription_status;
  NEW.stripe_customer_id              := OLD.stripe_customer_id;
  NEW.stripe_subscription_id          := OLD.stripe_subscription_id;
  NEW.subscription_seats              := OLD.subscription_seats;
  NEW.subscription_current_period_end := OLD.subscription_current_period_end;
  NEW.subscription_updated_at         := OLD.subscription_updated_at;
  NEW.stripe_connect_account_id       := OLD.stripe_connect_account_id;
  NEW.stripe_connect_charges_enabled  := OLD.stripe_connect_charges_enabled;
  NEW.stripe_connect_details_submitted := OLD.stripe_connect_details_submitted;
  NEW.stripe_connect_updated_at       := OLD.stripe_connect_updated_at;
  RETURN NEW;
END;
$$;
