-- v1.3 #3 Online payments (Stripe)
-- Invoices gain paid-tracking + Stripe linkage so the payment webhook can mark
-- an invoice Paid and the UI can show how/when it was paid.

alter table invoices add column if not exists paid_date date;
alter table invoices add column if not exists payment_method text;
alter table invoices add column if not exists stripe_session_id text;

-- Look up an invoice quickly from a Stripe session id (webhook + reconciliation).
create index if not exists invoices_stripe_session_id_idx
  on invoices (stripe_session_id);
