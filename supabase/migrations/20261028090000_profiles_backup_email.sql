-- =====================================================================
-- PROFILES BACKUP EMAIL
-- =====================================================================
-- A team member an administrator adds signs in with
-- `<username>@<company slug>.relay.internal`, an address no mailbox receives.
-- backup_email is the real inbox recorded for them at that point. invite-user
-- requires it for every new user; accounts created before this migration have
-- none, so the column stays nullable.
--
-- The check mirrors normalizeBackupEmail() in
-- supabase/functions/invite-user/provision.js: a plausible address, within
-- email's length limit, never a relay.internal sign-in address, and stored
-- lowercase. The column is writable under the existing profiles policies
-- (the owner, and the company admin since 039), like email.
-- =====================================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS backup_email text;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_backup_email_valid;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_backup_email_valid
  CHECK (
    backup_email IS NULL
    OR (
      length(backup_email) <= 254
      AND backup_email = lower(btrim(backup_email))
      AND backup_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
      AND backup_email NOT LIKE '%.relay.internal'
    )
  );
