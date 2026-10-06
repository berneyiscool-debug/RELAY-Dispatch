-- =====================================================================
-- PROFILES UPDATE SCOPE
-- =====================================================================
-- 030 grants every member of a company UPDATE on every other member's row
-- (profile_update_tenant, company_id = get_user_company_id(auth.uid())). The
-- policy is scoped to the tenant but not to a role, and nothing in the client
-- narrows it either: Settings -> Users renders for any role that can open
-- Settings, which includes technicians. So any signed-in user can rewrite a
-- colleague's row - including the admin's email. Pointing a tenant admin's
-- email at an address you control and triggering a password reset is an
-- account takeover, and it does not need a single elevated permission.
--
-- profiles_security_guard() cannot close this on its own. It freezes
-- company_id, role, user_type_id, pay_rate and deactivated, then returns NEW:
-- name, email, username, phone, color, avatar_url and the preference columns
-- stay writable on purpose, because the owner has to be able to edit their
-- own. The question that was never asked is *whose* row, and that is what a
-- policy is for.
--
-- profile_update_own is left exactly as 030 wrote it, so a user keeps editing
-- their own profile. The tenant-wide grant is narrowed to company admins,
-- which is the audience the Settings -> Users tab is written for: every other
-- admin-only surface on that page (Data Management, the Danger Zone, the
-- deployment profile, local backup) is already gated on role === 'admin' in
-- the client. Same boundary, now enforced server-side instead of by hiding a
-- button.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ADMIN HELPER
-- ---------------------------------------------------------------------
-- SECURITY DEFINER for the same reason get_user_company_id() needs it: this
-- is called from a policy on profiles, so a plain lookup would re-enter RLS
-- and fail. It takes no arguments and reads auth.uid() itself, so it cannot
-- be used to probe whether some other user is an admin.
--
-- Deactivated admins do not count. Deactivation is the app's substitute for
-- account deletion, and a retired admin's session should not keep
-- tenant-wide write access over live staff.
CREATE OR REPLACE FUNCTION public.is_company_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
      FROM public.profiles
     WHERE id = auth.uid()
       AND role = 'admin'
       AND COALESCE(deactivated, false) = false
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.is_company_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_company_admin() FROM anon;
GRANT  EXECUTE ON FUNCTION public.is_company_admin() TO authenticated;
GRANT  EXECUTE ON FUNCTION public.is_company_admin() TO service_role;

-- ---------------------------------------------------------------------
-- 2. NARROW THE TENANT-WIDE UPDATE
-- ---------------------------------------------------------------------
-- DROP + CREATE rather than ALTER so the file is re-runnable, the way the
-- rest of this series is. The id = auth.uid() arm is redundant next to
-- profile_update_own, and it is kept deliberately: it makes this policy
-- correct on its own, so an admin's own profile stays editable even if the
-- own-row policy were ever dropped. WITH CHECK repeats USING so a permitted
-- update cannot re-point the row at another tenant.
DROP POLICY IF EXISTS profile_update_tenant ON public.profiles;
CREATE POLICY profile_update_tenant ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    company_id = public.get_user_company_id(auth.uid())
    AND (id = auth.uid() OR public.is_company_admin())
  )
  WITH CHECK (
    company_id = public.get_user_company_id(auth.uid())
    AND (id = auth.uid() OR public.is_company_admin())
  );

-- ---------------------------------------------------------------------
-- 3. SIGNUP NAMES THAT 038 WOULD REJECT
-- ---------------------------------------------------------------------
-- 038 added profiles_name_no_markup, and provisioning writes the admin's name
-- into profiles. Three shipped flows reach this RPC with a name the user
-- typed: the launch screen signup, the post-verification finish card and the
-- local -> cloud upgrade. A name holding <, > or " now fails the whole
-- provisioning call - which is atomic, so no half-built company is left - but
-- the user is told an opaque constraint name and cannot get past the screen
-- by correcting the field, because the field is the one that used to be
-- accepted.
--
-- Normalising here rather than rejecting keeps that door shut without a
-- dead end, and it is the only place that covers every caller: the upgrade
-- path replays a name that already exists in the local database, so a legacy
-- value nobody is retyping cannot wedge the migration either.
--
-- Same signature, body and grants as 036_company_name_uniqueness.sql; the
-- only change is the admin_name expression. Only name is normalised: phone is
-- not rendered as markup anywhere and company_name is validated separately by
-- validateCompanyName() and relay_company_name_key().
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
    NULLIF(regexp_replace(trim(COALESCE(admin_name, '')), '[<>"]', '', 'g'), ''),
    (SELECT email FROM auth.users WHERE id = user_id),
    admin_phone,
    'admin'
  );

  PERFORM set_config('relay.admin_provision', 'false', true);
  RETURN new_company_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_company_and_admin(uuid, text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_company_and_admin(uuid, text, text, text) FROM anon;
GRANT  EXECUTE ON FUNCTION public.create_company_and_admin(uuid, text, text, text) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.create_company_and_admin(uuid, text, text, text) TO service_role;
