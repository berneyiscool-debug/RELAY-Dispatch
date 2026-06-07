-- ============================================================================
-- Relay Dispatch — Supabase schema fixes (run in the Supabase SQL editor)
-- Addresses gaps found during QA: missing tables (leads, schedule), missing
-- columns (contractors, suppliers), and the invoices.title NOT NULL trap.
-- ============================================================================

-- 1) INVOICES: title is NOT NULL but invoices have no title. The app now sets a
--    default title, but make it nullable so older/other write paths don't fail.
alter table invoices alter column title drop not null;

-- 2) LEADS: table is missing entirely → leads feature can't read or write.
create table if not exists leads (
  id text primary key default gen_random_uuid()::text,
  company_id uuid references companies on delete cascade not null,
  number text,
  title text,
  customer_id text,
  customer_name text,
  contact_name text,
  status text default 'New',
  source text,
  value numeric default 0,
  description text,
  priority text default 'Medium',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 3) SCHEDULE: table is missing → calendar events / "assign tech" don't persist.
create table if not exists schedule (
  id text primary key default gen_random_uuid()::text,
  company_id uuid references companies on delete cascade not null,
  job_id text,
  job_number text,
  title text,
  technician_id text,
  technician_name text,
  color text,
  day_offset integer default 0,
  start_hour numeric default 9,
  end_hour numeric default 17,
  customer_name text,
  site_address text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 4) CONTRACTORS: table only had name/email/phone/status. Add the rest of the
--    app's contractor model. (The store already maps businessName<->name and
--    active<->status, so we only add the remaining "rich" fields.)
alter table contractors
  add column if not exists contact_name    text,
  add column if not exists license_number  text,
  add column if not exists hourly_rate     numeric default 0,
  add column if not exists after_hours_rate numeric default 0,
  add column if not exists callout_fee     numeric default 0,
  add column if not exists specialties     jsonb default '[]'::jsonb,
  add column if not exists notes           text,
  add column if not exists portal_token    text,
  add column if not exists compliance_docs jsonb default '[]'::jsonb;

-- 5) SUPPLIERS: add the rest of the app's supplier model.
--    (active<->status is already mapped in the store, so no `active` column.)
alter table suppliers
  add column if not exists contact_name   text,
  add column if not exists address        text,
  add column if not exists category       text,
  add column if not exists account_number text,
  add column if not exists payment_terms  text,
  add column if not exists notes          text,
  add column if not exists attachments    jsonb default '[]'::jsonb;

-- 6) RLS for the two new tables (mirror the existing tenant policies).
alter table leads    enable row level security;
alter table schedule enable row level security;

create policy leads_tenant_policy on leads
  for all using (company_id = public.get_user_company_id(auth.uid()));
create policy schedule_tenant_policy on schedule
  for all using (company_id = public.get_user_company_id(auth.uid()));

-- NOTE: while still testing with the permissive qa_temp_all policy, re-run your
-- loosen-RLS snippet AFTER this so leads/schedule get the temp anon policy too:
--   create policy qa_temp_all on leads     for all to anon, authenticated using (true) with check (true);
--   create policy qa_temp_all on schedule  for all to anon, authenticated using (true) with check (true);
