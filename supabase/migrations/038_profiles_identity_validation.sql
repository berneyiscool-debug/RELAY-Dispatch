-- =====================================================================
-- PROFILE IDENTITY VALIDATION
-- =====================================================================
-- name / avatar_url / color are the only columns a technician can write on
-- their own row: Profile.js calls
--   supabase.from('profiles').update({ name, color, avatar_url })
-- and 030's profiles_security_guard() deliberately leaves all three writable.
-- Nothing stopped a name of `<img src=x onerror=...>` from being stored, and
-- profiles is the tenant-wide shared table: the poisoned row is rendered for
-- every other user - the dashboard staff list, the Settings user tables, the
-- timesheet technician dropdown, the reports tab. index.html ships
-- script-src 'unsafe-inline', so an injected inline handler runs. The render
-- sites escape their interpolated values now; these constraints are the
-- second layer, and they make the value un-storable in the first place.
--
-- Why CHECK constraints and not an extension of profiles_security_guard():
-- the guard returns NEW early when auth.uid() is null or
-- relay.admin_provision is 'true', which is exactly the signup path -
-- create_company_and_admin() inserts admin_name straight out of the signup
-- metadata. A CHECK applies to every writer, on every role, on every path.
--
-- The repairs run before the constraints. Adding a constraint to a table that
-- already holds a poisoned row would abort the migration, and from then on the
-- row could never be updated again - the constraint would reject the UPDATE
-- that was trying to clear it. Repairing strips the markup rather than
-- deleting the account, so pre-existing profiles stay editable; it is the
-- constraint that rejects new writes.
-- =====================================================================

-- schema.sql declares profiles.color, but no incremental migration in this
-- series creates it. Add it here so the migration below is safe on a database
-- built from the migration series alone, and a no-op where it already exists.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS color text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- Strip angle brackets and double quotes from anything already stored. Markup
-- is the whole attack; a name has no legitimate use for either. The quote is
-- in the class because a name is interpolated into attribute positions
-- (title="...", placeholder="...") as well as text, and one stray quote closes
-- the attribute early.
UPDATE public.profiles
   SET name = regexp_replace(name, '[<>"]', '', 'g')
 WHERE name ~ '[<>"]';

UPDATE public.profiles
   SET avatar_url = regexp_replace(avatar_url, '[<>]', '', 'g')
 WHERE avatar_url ~ '[<>]';

-- Put non-hex colours back on the default. The swatch is interpolated into a
-- style attribute, so a stray quote in the value is as dangerous as an angle
-- bracket in a name.
UPDATE public.profiles
   SET color = '#FF5C00'
 WHERE color IS NOT NULL
   AND color !~ '^#[0-9A-Fa-f]{6}$';

-- DROP + ADD rather than a bare ADD so the file is re-runnable, the way the
-- rest of this series is.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_name_no_markup;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_name_no_markup
  CHECK (name IS NULL OR name !~ '[<>"]');

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_avatar_url_no_markup;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_avatar_url_no_markup
  CHECK (avatar_url IS NULL OR avatar_url !~ '[<>]');

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_color_hex;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_color_hex
  CHECK (color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$');
