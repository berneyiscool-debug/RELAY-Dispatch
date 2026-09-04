-- =====================================================================
-- COMPLIMENTARY ACCESS ("power user" grant)
-- =====================================================================
-- Lets RELAY grant a company a paid tier for free — no Stripe subscription.
-- Set/cleared ONLY from Supabase (SQL / service role); it's frozen against
-- client writes by companies_billing_guard, so a tenant can't grant it to
-- themselves. Turn on:   update companies set comp_tier='cloud_plus' where id=…;
-- Turn off:              update companies set comp_tier=null        where id=…;
--
-- Gating (src/utils/subscription.js) treats a non-null comp_tier as an always-
-- active subscription at that tier, overriding the Stripe subscription state.

ALTER TABLE companies ADD COLUMN IF NOT EXISTS comp_tier text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'companies_comp_tier_check') THEN
    ALTER TABLE companies
      ADD CONSTRAINT companies_comp_tier_check
      CHECK (comp_tier IS NULL OR comp_tier IN ('cloud', 'cloud_plus'));
  END IF;
END $$;

-- Recreate the billing guard to also freeze comp_tier (server-managed).
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
    NEW.comp_tier                       := NULL;
    RETURN NEW;
  END IF;

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
  NEW.comp_tier                       := OLD.comp_tier;
  RETURN NEW;
END;
$$;
