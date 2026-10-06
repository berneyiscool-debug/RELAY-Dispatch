-- =====================================================================
-- SIGNUP: terms acceptance + the 14-day free trial
-- =====================================================================
-- Two things a self-serve cloud signup now has to produce that the schema
-- could not express:
--
--   1. A record that the admin accepted the Terms and the Privacy Policy, and
--      when. The tick box lives on the signup form, but the acceptance must be
--      attributed to a real account, so the timestamp is written by the server
--      next to the row it describes — the client never supplies it.
--
--   2. A 14-day free trial with no card on file. There is nothing in Stripe to
--      model this: no customer, no subscription, so no `trialing` subscription
--      for the webhook to report. The window therefore has to live on the
--      company row and the client derives the state from it.
--
-- Both are deliberately separate, single-purpose SECURITY DEFINER functions
-- rather than additions to create_company_and_admin(). That RPC is already
-- live and is the only path permitted to mint a company row; keeping its
-- signature and body untouched means this migration cannot change how
-- provisioning behaves.
--
-- Idempotent throughout (ADD COLUMN IF NOT EXISTS / CREATE OR REPLACE), because
-- the same file is replayed against the PGlite fixture in
-- supabase/tests/migrations.test.js, whose `companies` table has none of the
-- subscription_* columns added by 025_subscription_billing.sql.
--
-- Note that the fixture runs without 025's companies_billing_guard_biu trigger,
-- while live Postgres has it, so start_cloud_trial() opts into the
-- relay.admin_provision flag explicitly (set_config below) instead of relying on
-- the fixture being more permissive than production.

-- ---------------------------------------------------------------------
-- 1. Columns
-- ---------------------------------------------------------------------
-- When the admin accepted the terms. NULL means "never accepted", which is a
-- meaningful state: accounts provisioned before this migration, and any row
-- created by a path that did not record acceptance.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;

-- When the free trial runs out. NULL means "no trial has been started", which
-- is distinct from "trial expired" — subscription_status decides which of the
-- two a row is in, so a NULL here on a 'trialing' row is treated as running.
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS subscription_tier text;

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS subscription_status text;

-- Stamped so the trial banner can show a countdown without recomputing one.
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS trial_started_at timestamptz;

-- Partial index: the trial-expiry screens and any future scheduled downgrade
-- only ever scan companies that are actually in a trial.
CREATE INDEX IF NOT EXISTS companies_trial_ends_idx
  ON public.companies (trial_ends_at)
  WHERE subscription_status = 'trialing';

-- ---------------------------------------------------------------------
-- 2. Record terms acceptance
-- ---------------------------------------------------------------------
-- Writes the acceptance for the CALLING user only, and only the first time —
-- re-accepting after a version bump is a later problem than this migration,
-- and silently overwriting the original date would destroy the only evidence
-- of when the current terms were agreed to.
CREATE OR REPLACE FUNCTION public.record_terms_acceptance()
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  accepted_at timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to accept the terms.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  UPDATE public.profiles
     SET terms_accepted_at = now()
   WHERE id = auth.uid()
     AND terms_accepted_at IS NULL
  RETURNING terms_accepted_at INTO accepted_at;

  -- Already accepted: return the original timestamp rather than NULL, so a
  -- retry after a dropped response does not look like a failure.
  IF accepted_at IS NULL THEN
    SELECT p.terms_accepted_at INTO accepted_at
      FROM public.profiles p
     WHERE p.id = auth.uid();
  END IF;

  RETURN accepted_at;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.record_terms_acceptance() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.record_terms_acceptance() FROM anon;
GRANT  EXECUTE ON FUNCTION public.record_terms_acceptance() TO authenticated;
GRANT  EXECUTE ON FUNCTION public.record_terms_acceptance() TO service_role;

-- ---------------------------------------------------------------------
-- 3. Start the free trial
-- ---------------------------------------------------------------------
-- Only ever touches the calling admin's own company, and only when that
-- company has never had a trial and is not already a paying customer — so a
-- second call is a no-op returning the existing end date, and a returning
-- customer can never reset the clock.
CREATE OR REPLACE FUNCTION public.start_cloud_trial(p_days integer DEFAULT 14)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_company uuid;
  ends_at timestamptz;
  days integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to start a trial.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Length is chosen by the server, not the client; the argument exists so the
  -- window is configurable in one place, not so a caller can extend it.
  days := LEAST(GREATEST(coalesce(p_days, 14), 1), 90);

  SELECT company_id INTO caller_company
    FROM public.profiles
   WHERE id = auth.uid();

  IF caller_company IS NULL THEN
    RAISE EXCEPTION 'No company is linked to your account yet.'
      USING ERRCODE = 'check_violation';
  END IF;

  -- Claim the trial under a row lock, so two tabs racing on first sign-in
  -- cannot both see "no trial yet" and start two.
  SELECT trial_ends_at INTO ends_at
    FROM public.companies
   WHERE id = caller_company
   FOR UPDATE;

  IF ends_at IS NOT NULL THEN
    RETURN ends_at; -- trial already started; never extend it
  END IF;

  -- On the live project the caller is a signed-in browser session, so
  -- companies_billing_guard_biu (025) would freeze subscription_status and
  -- subscription_tier back to their stored values and the trial would be a
  -- half-write: trial_ends_at set, status still NULL, and the app would send a
  -- brand new account to the paywall anyway. Opting into the same
  -- relay.admin_provision escape hatch create_company_and_admin() uses is what
  -- lets this one function move exactly those columns, and nothing else.
  PERFORM set_config('relay.admin_provision', 'true', true);

  UPDATE public.companies
     SET trial_started_at      = now(),
         trial_ends_at         = now() + make_interval(days => days),
         subscription_status   = 'trialing',
         -- The tier the trial unlocks. getTier() treats a null tier as 'cloud'
         -- anyway, but writing it means the company reads correctly in SQL and
         -- in support tooling, and Cloud+ stays locked.
         subscription_tier     = coalesce(subscription_tier, 'cloud')
   WHERE id = caller_company
     -- A company that already has a Stripe customer is a paying (or formerly
     -- paying) account and must not be handed a fresh free trial.
     AND stripe_customer_id IS NULL
  RETURNING trial_ends_at INTO ends_at;

  PERFORM set_config('relay.admin_provision', 'false', true);

  IF ends_at IS NULL THEN
    RAISE EXCEPTION 'This account already has a billing history, so it is not eligible for a free trial.'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN ends_at;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.start_cloud_trial(integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.start_cloud_trial(integer) FROM anon;
GRANT  EXECUTE ON FUNCTION public.start_cloud_trial(integer) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.start_cloud_trial(integer) TO service_role;
