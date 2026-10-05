-- =====================================================================
-- COMPANY NAME: availability check at signup
-- =====================================================================
-- Self-serve cloud signup only asked for a company name and never checked
-- whether somebody else already owned it, so two businesses could end up with
-- the same trading name — confusing on invoices, portals and email, and
-- indistinguishable in support ("the Acme one").
--
-- The name must stay RENAMABLE (the launcher signup and the local→cloud
-- upgrade both let the admin edit it, and Settings rewrites companies.name),
-- so a plain UNIQUE INDEX on the normalized name is deliberately NOT used
-- here: Settings.saveSettings() writes the name and only console.errors on
-- failure, so a 23505 there would silently lose the rename (and any legacy
-- duplicate would block unrelated writes until cleaned up). Names are instead
-- claimed once, at provisioning time, by create_company_and_admin() — see
-- below — with a cheap availability RPC for live UI feedback.
--
-- The matching key is normalized (case + surrounding/duplicate whitespace
-- collapsed) so "Acme Electrical" and "ACME  electrical " are the same claim.

-- ---------------------------------------------------------------------
-- 1. Normalized name key
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.relay_company_name_key(p_name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT btrim(regexp_replace(lower(coalesce(p_name, '')), '\s+', ' ', 'g'))
$$;

-- Non-unique: backs the EXISTS lookup in company_name_available() and in
-- create_company_and_admin(). See the note above for why not UNIQUE.
CREATE INDEX IF NOT EXISTS companies_name_key_idx
  ON public.companies (public.relay_company_name_key(name));

-- ---------------------------------------------------------------------
-- 2. Availability RPC (used by the signup + upgrade forms, pre-signup)
-- ---------------------------------------------------------------------
-- SECURITY DEFINER because companies is RLS-scoped per tenant: an anon visitor
-- mid-signup cannot select other companies' rows, and the whole point of this
-- check is that somebody else's company already owns the name. It only ever
-- answers a boolean, so it leaks nothing beyond "that name is taken".
CREATE OR REPLACE FUNCTION public.company_name_available(p_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.relay_company_name_key(p_name) <> ''
     AND NOT EXISTS (
           SELECT 1
             FROM public.companies c
            WHERE public.relay_company_name_key(c.name) = public.relay_company_name_key(p_name)
         )
$$;

REVOKE EXECUTE ON FUNCTION public.company_name_available(text) FROM PUBLIC;
-- anon: the check runs from the launcher before an account exists.
GRANT  EXECUTE ON FUNCTION public.company_name_available(text) TO anon;
GRANT  EXECUTE ON FUNCTION public.company_name_available(text) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.company_name_available(text) TO service_role;

-- ---------------------------------------------------------------------
-- 3. Claim the name inside the provisioning RPC
-- ---------------------------------------------------------------------
-- Same signature, body and grants as 030_rls_hardening.sql; the only additions
-- are the blank-name guard and the ownership claim. The claim is authoritative
-- rather than advisory: the client-side availability check is a UX nicety, and
-- two signups could pass it simultaneously, so the name is claimed under an
-- advisory transaction lock — re-checking after the lock is held means the
-- second provisioning run of the same name always sees the first and fails
-- instead of creating a duplicate.
CREATE OR REPLACE FUNCTION public.create_company_and_admin(
  user_id uuid,
  company_name text,
  admin_name text,
  admin_phone text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_company_id uuid;
BEGIN
  IF auth.uid() IS DISTINCT FROM user_id THEN
    RAISE EXCEPTION 'You can only provision your own company.';
  END IF;

  IF public.relay_company_name_key(company_name) = '' THEN
    RAISE EXCEPTION 'Enter your company name to continue.'
      USING ERRCODE = 'check_violation';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(public.relay_company_name_key(company_name))::bigint);

  IF EXISTS (
    SELECT 1 FROM companies
     WHERE public.relay_company_name_key(name) = public.relay_company_name_key(company_name)
  ) THEN
    RAISE EXCEPTION 'That company name is already taken. Please choose another.'
      USING ERRCODE = 'unique_violation';
  END IF;

  INSERT INTO companies (name, settings)
  VALUES (company_name, '{"markupPercent": 20}'::jsonb)
  RETURNING id INTO new_company_id;

  PERFORM set_config('relay.admin_provision', 'true', true);

  INSERT INTO profiles (id, company_id, name, email, phone, role)
  VALUES (
    user_id,
    new_company_id,
    admin_name,
    (SELECT email FROM auth.users WHERE id = user_id),
    admin_phone,
    'admin'
  );

  PERFORM set_config('relay.admin_provision', 'false', true);
  RETURN new_company_id;
END;
$$;

-- CREATE OR REPLACE keeps the ACL from 030_rls_hardening.sql (PUBLIC/anon
-- revoked, authenticated + service_role granted); restated so the grants hold
-- even if this file is ever applied against a database where 030 was skipped.
REVOKE EXECUTE ON FUNCTION public.create_company_and_admin(uuid, text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_company_and_admin(uuid, text, text, text) FROM anon;
GRANT  EXECUTE ON FUNCTION public.create_company_and_admin(uuid, text, text, text) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.create_company_and_admin(uuid, text, text, text) TO service_role;
