-- =====================================================================
-- COMPANY EMAIL IDENTITY (v1.3 #5 — shared RELAY sending domain)
-- =====================================================================
-- Customers no longer bring their own Resend account or verify their own
-- domain. Every tenant sends through RELAY's Resend account on RELAY's
-- verified domain, identified by a per-company slug:
--
--     quotes.testcompany@relaydispatch.com.au   (quotes)
--     billing.testcompany@relaydispatch.com.au  (invoices, receipts, reminders)
--     hello.testcompany@relaydispatch.com.au    (portal invites, anything else)
--
-- The slug lives here — NOT in client-editable settings — because the
-- relay-email edge function builds the From address from it server-side.
-- If the client could choose it, any tenant could send mail as any other
-- tenant (or as RELAY itself). The unique index is the guarantee that two
-- companies can never share a sending identity.

-- ── Slugs RELAY keeps for itself ─────────────────────────────────────
-- A company slugged "support" would send as billing.support@relaydispatch.com.au,
-- which reads like an official RELAY address. Block that whole class.
CREATE TABLE IF NOT EXISTS relay_reserved_email_slugs (slug text PRIMARY KEY);

INSERT INTO relay_reserved_email_slugs (slug) VALUES
  ('relay'), ('relaydispatch'), ('dispatch'), ('admin'), ('administrator'),
  ('support'), ('help'), ('helpdesk'), ('billing'), ('accounts'), ('accounting'),
  ('invoice'), ('invoices'), ('quote'), ('quotes'), ('receipt'), ('receipts'),
  ('noreply'), ('no-reply'), ('donotreply'), ('postmaster'), ('hostmaster'),
  ('webmaster'), ('abuse'), ('security'), ('info'), ('contact'), ('sales'),
  ('mail'), ('email'), ('system'), ('root'), ('hello'), ('team'), ('office'),
  ('notifications'), ('alerts'), ('service'), ('api'), ('test'), ('demo')
ON CONFLICT DO NOTHING;

-- ── Company columns ──────────────────────────────────────────────────
ALTER TABLE companies ADD COLUMN IF NOT EXISTS email_slug text;
-- Where customer replies land. Defaults to the company's own email address;
-- without it a reply goes to a RELAY mailbox nobody reads.
ALTER TABLE companies ADD COLUMN IF NOT EXISTS email_reply_to text;

-- ── Slug generation ──────────────────────────────────────────────────
-- "Test Company Pty Ltd" -> "testcompanyptyltd". Letters and digits only:
-- anything else is either invalid in a local part or ambiguous next to the
-- "role." prefix we prepend.
CREATE OR REPLACE FUNCTION public.relay_email_slugify(txt text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT substr(regexp_replace(lower(coalesce(txt, '')), '[^a-z0-9]', '', 'g'), 1, 40);
$$;

-- Picks the first free slug: base, then base2, base3, ... Skips reserved
-- words and anything another company already holds.
CREATE OR REPLACE FUNCTION public.relay_assign_email_slug(p_name text, p_company_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  base      text;
  candidate text;
  n         int := 1;
BEGIN
  base := public.relay_email_slugify(p_name);

  -- Too short to be meaningful (blank name, or a name that was all symbols).
  -- Fall back to a stable id-derived slug rather than something guessable.
  IF length(base) < 3 THEN
    base := 'co' || substr(replace(p_company_id::text, '-', ''), 1, 10);
  END IF;

  candidate := base;
  WHILE EXISTS (SELECT 1 FROM companies
                 WHERE lower(email_slug) = candidate AND id <> p_company_id)
     OR EXISTS (SELECT 1 FROM relay_reserved_email_slugs WHERE slug = candidate)
  LOOP
    n := n + 1;
    candidate := base || n::text;
  END LOOP;

  RETURN candidate;
END;
$$;

-- ── Backfill existing tenants ────────────────────────────────────────
DO $$
DECLARE c RECORD;
BEGIN
  FOR c IN SELECT id, name FROM companies WHERE email_slug IS NULL ORDER BY created_at LOOP
    UPDATE companies
       SET email_slug = public.relay_assign_email_slug(c.name, c.id)
     WHERE id = c.id;
  END LOOP;
END $$;

-- Default reply-to to the company's own address where we have one.
UPDATE companies
   SET email_reply_to = email
 WHERE email_reply_to IS NULL
   AND email IS NOT NULL
   AND email <> ''
   AND email LIKE '%@%';

-- ── Keep new tenants covered ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.relay_company_email_slug_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.email_slug IS NULL OR NEW.email_slug = '' THEN
    NEW.email_slug := public.relay_assign_email_slug(NEW.name, NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS company_email_slug_biu ON companies;
CREATE TRIGGER company_email_slug_biu
  BEFORE INSERT OR UPDATE OF name ON companies
  FOR EACH ROW EXECUTE FUNCTION public.relay_company_email_slug_trigger();

-- The actual guarantee that sending identities can't collide.
CREATE UNIQUE INDEX IF NOT EXISTS companies_email_slug_key
  ON companies (lower(email_slug))
  WHERE email_slug IS NOT NULL;

-- ── Log the resolved sender ──────────────────────────────────────────
-- Needed for support ("what address did this actually go out as?") and to
-- audit the server-side From derivation.
ALTER TABLE email_log ADD COLUMN IF NOT EXISTS from_email text;
