-- v1.3 #6b SMS credits (metered, prepaid)
-- SMS moves from flat-fee-included to a separately metered, prepaid credit
-- balance. The balance is a real `companies` column (not settings jsonb) so a
-- concurrent admin Settings save can never read-modify-write over a balance
-- change that happened via service-role in between.

alter table companies add column if not exists sms_credit_cents integer not null default 0
  check (sms_credit_cents >= 0);
alter table companies add column if not exists stripe_customer_id text;

-- Seed existing companies so this migration can't silently stop SMS for
-- anyone already relying on it being free. Tune the amount before running.
update companies set sms_credit_cents = 500 where sms_credit_cents = 0;

-- companies' only RLS policy is FOR ALL with no WITH CHECK, and there are no
-- column-level grants anywhere in this schema -- without this trigger, any
-- authenticated company user can self-credit (or, once auto-renew exists,
-- repoint stripe_customer_id at a card that isn't theirs) via a direct
-- supabase.from('companies').update(...) call, the same call store.js's
-- saveSettings() already proves works today.
create or replace function public.guard_companies_billing_columns()
returns trigger language plpgsql as $$
begin
  if auth.role() is distinct from 'service_role' then
    if new.sms_credit_cents is distinct from old.sms_credit_cents then
      raise exception 'sms_credit_cents can only be modified by the service role';
    end if;
    if new.stripe_customer_id is distinct from old.stripe_customer_id then
      raise exception 'stripe_customer_id can only be modified by the service role';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_companies_billing_columns_trg on companies;
create trigger guard_companies_billing_columns_trg
  before update on companies for each row
  execute function public.guard_companies_billing_columns();

-- Purchase-side audit trail (sms_log already covers consumption -- no
-- separate per-message ledger needed). unique(stripe_session_id) doubles as
-- the idempotency key against Stripe's at-least-once webhook delivery.
create table if not exists sms_credit_purchases (
  id text primary key default gen_random_uuid()::text,
  company_id uuid references companies on delete cascade not null,
  amount_cents integer not null check (amount_cents > 0),
  kind text not null default 'manual' check (kind in ('manual', 'auto_renew')),
  stripe_session_id text not null unique,
  status text not null default 'pending' check (status in ('pending', 'completed')),
  created_at timestamp with time zone default now() not null,
  completed_at timestamp with time zone
);
create index if not exists sms_credit_purchases_company_id_idx on sms_credit_purchases (company_id);

alter table sms_credit_purchases enable row level security;
-- Read-only for tenants -- only relay-sms-buy-credits (insert) and
-- relay-stripe-webhook (complete) ever write this, both via service-role.
-- (Deferred to the subscription-billing project -- table ships now so the
-- schema doesn't need a second migration later.)
drop policy if exists sms_credit_purchases_tenant_read on sms_credit_purchases;
create policy sms_credit_purchases_tenant_read on sms_credit_purchases
  for select using (company_id = public.get_user_company_id(auth.uid()));

-- Atomic, race-safe balance mutations. TABLE(...) return shape makes "zero
-- rows" an unambiguous "rejected" signal (insufficient balance / bad id).
-- SECURITY INVOKER (default) is correct here, not SECURITY DEFINER like
-- create_company_and_admin -- these only ever run as service_role, which
-- already bypasses RLS by Postgres role membership.
create or replace function public.decrement_sms_credit(p_company_id uuid, p_amount_cents integer)
returns table(new_balance integer) language sql as $$
  update companies set sms_credit_cents = sms_credit_cents - p_amount_cents
  where id = p_company_id and sms_credit_cents >= p_amount_cents
  returning sms_credit_cents as new_balance;
$$;

create or replace function public.increment_sms_credit(p_company_id uuid, p_amount_cents integer)
returns table(new_balance integer) language sql as $$
  update companies set sms_credit_cents = sms_credit_cents + p_amount_cents
  where id = p_company_id
  returning sms_credit_cents as new_balance;
$$;

-- One transaction: flip the purchase row to completed AND credit the
-- balance, guarded by status <> 'completed'. Makes Stripe's at-least-once
-- webhook redelivery a safe no-op instead of a double-credit. (Not called by
-- anything until the deferred purchase flow ships, but lives here so the
-- function signature/idempotency design doesn't need revisiting later.)
create or replace function public.complete_sms_credit_purchase(p_session_id text)
returns table(company_id uuid, amount_cents integer) language plpgsql as $$
declare v_row sms_credit_purchases%rowtype;
begin
  update sms_credit_purchases set status = 'completed', completed_at = now()
  where stripe_session_id = p_session_id and status <> 'completed'
  returning * into v_row;
  if not found then return; end if; -- redelivery or unknown session -- no-op
  perform public.increment_sms_credit(v_row.company_id, v_row.amount_cents);
  return query select v_row.company_id, v_row.amount_cents;
end;
$$;

revoke all on function public.decrement_sms_credit(uuid, integer) from public, anon, authenticated;
grant execute on function public.decrement_sms_credit(uuid, integer) to service_role;
revoke all on function public.increment_sms_credit(uuid, integer) from public, anon, authenticated;
grant execute on function public.increment_sms_credit(uuid, integer) to service_role;
revoke all on function public.complete_sms_credit_purchase(text) from public, anon, authenticated;
grant execute on function public.complete_sms_credit_purchase(text) to service_role;
