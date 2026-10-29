-- =====================================================================
-- BACKUP EMAIL CONFIRMATION
-- =====================================================================
-- A user an administrator adds must confirm their backup email (see
-- 20261028090000_profiles_backup_email.sql) before they can use RELAY.
-- invite-user emails a one-time link; relay-confirm-email redeems it.
--
-- backup_email_confirmation_required is set by invite-user for users created
-- from now on. Accounts that predate it stay usable without confirming, and
-- show their status in Settings -> Users like everyone else.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. STATUS COLUMNS
-- ---------------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS backup_email_confirmed_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS backup_email_confirmation_required boolean NOT NULL DEFAULT false;

-- ---------------------------------------------------------------------
-- 2. SERVER-MANAGED, AND RESET BY A NEW ADDRESS
-- ---------------------------------------------------------------------
-- profile_update_own lets a user write their own row, so without this a user
-- could mark themselves confirmed or drop the requirement. Client sessions
-- keep the stored values; service-role calls (auth.uid() IS NULL, as in
-- profiles_security_guard) may set them. Whoever changes the address, the old
-- confirmation no longer vouches for it.
CREATE OR REPLACE FUNCTION public.profiles_backup_email_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    NEW.backup_email_confirmed_at := OLD.backup_email_confirmed_at;
    NEW.backup_email_confirmation_required := OLD.backup_email_confirmation_required;
  END IF;

  IF NEW.backup_email IS DISTINCT FROM OLD.backup_email THEN
    NEW.backup_email_confirmed_at := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_backup_email_guard_bu ON public.profiles;
CREATE TRIGGER profiles_backup_email_guard_bu
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_backup_email_guard();

-- ---------------------------------------------------------------------
-- 3. PENDING LINKS
-- ---------------------------------------------------------------------
-- Only a SHA-256 of each token is stored, so a leaked row cannot be replayed.
-- The address the link was sent to is kept so a link for an address that has
-- since been replaced confirms nothing. Server-only: RLS on with no policies.
CREATE TABLE IF NOT EXISTS public.backup_email_confirmations (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS backup_email_confirmations_user_idx
  ON public.backup_email_confirmations (user_id, created_at DESC);

ALTER TABLE public.backup_email_confirmations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.backup_email_confirmations FROM anon, authenticated;
