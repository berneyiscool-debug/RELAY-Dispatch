-- v1.3 #6 SMS
-- Confirmation/reminder/nudge SMS sent from a small shared Telnyx number pool
-- (not one dedicated number per company), with a no-reply design: messages carry
-- a portal link instead of expecting a YES/NO reply, since replies to a shared
-- number can't be reliably attributed to the right company.

-- Per-customer opt-out flag. Checked before every send; set via either the
-- one-tap portal link or a STOP-family SMS reply (relay-sms-inbound).
alter table customers add column if not exists sms_opt_out boolean not null default false;
alter table customers add column if not exists sms_opt_out_at timestamp with time zone;

-- Confirmation tracking lives as separate nullable timestamps rather than a new
-- job status value, since status drives board views/filters used throughout the
-- app and doesn't need a "Confirmed" state to support this feature.
alter table jobs add column if not exists confirmation_sms_sent_at timestamp with time zone;
alter table jobs add column if not exists confirmed_at timestamp with time zone;
alter table jobs add column if not exists reminder_sms_sent_at timestamp with time zone;

-- Per-message audit log, so Deputy/Reports can answer "did we text this customer"
-- and relay-sms-inbound can resolve which company an inbound STOP reply belongs to
-- (shared numbers mean a bare inbound phone number is otherwise ambiguous).
create table if not exists sms_log (
  id text primary key default gen_random_uuid()::text,
  company_id uuid references companies on delete cascade not null,
  customer_id text,
  job_id text,
  direction text not null default 'outbound',
  template text,
  body text not null,
  status text not null default 'sent',
  telnyx_message_id text,
  from_number text,
  to_number text,
  created_at timestamp with time zone default now() not null
);
create index if not exists sms_log_company_id_idx on sms_log (company_id);
create index if not exists sms_log_from_number_idx on sms_log (from_number);
-- Resolves an inbound reply (from_number = the pool number it hit, to_number =
-- the customer who replied) back to the company/customer that sent the
-- original outbound message -- a shared pool means the bare inbound phone
-- number alone is otherwise ambiguous across tenants.
create index if not exists sms_log_reply_lookup_idx on sms_log (from_number, to_number, created_at desc);

alter table sms_log enable row level security;
create policy sms_log_tenant_policy on sms_log
  for all
  using (company_id = public.get_user_company_id(auth.uid()));

-- The shared number pool itself. Platform-level, not tenant data — no RLS policy;
-- only ever touched by Edge Functions via the service-role key.
create table if not exists sms_numbers (
  id text primary key default gen_random_uuid()::text,
  phone_number text not null unique,
  telnyx_number_id text not null,
  active boolean not null default true,
  last_used_at timestamp with time zone
);
