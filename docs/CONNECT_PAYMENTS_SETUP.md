# Customer Invoice Payments — Stripe Connect

Tenants connect **their own** Stripe (Express) account; their customers pay
invoices directly into it. This is separate from RELAY's subscription billing
(`SUBSCRIPTION_BILLING_SETUP.md`), though it shares the one webhook function.

## How it works

```
Settings → Payments → "Connect Stripe"
  → relay-connect-onboard  → Stripe Express onboarding (hosted)
       ↑ returns to app; relay-connect-status refreshes readiness
  account.updated (Connect webhook) → companies.stripe_connect_charges_enabled

Invoice "Pay" (emailed link OR customer portal)
  → relay-create-payment  → Checkout Session ON the tenant's connected account
       (Stripe-Account header = direct charge → money goes to the tenant)
  checkout.session.completed (Connect webhook) → invoice marked Paid
```

Feature gate: the "Pay" actions only appear once the tenant's account can take
charges (`connectReady()` / `stripe_connect_charges_enabled`).

## Setup

Connect is already enabled on the platform account. Steps:

1. **Apply migration** `023_connect_payments.sql` (done on the sandbox).
2. **Deploy functions** (done): `relay-connect-onboard`, `relay-connect-status`,
   `relay-create-payment` (verify_jwt=false), `relay-stripe-webhook`.
3. **Add a Connect webhook endpoint** in Stripe (Developers → Webhooks → "Add
   endpoint" → *listen to Connected accounts*) → `…/functions/v1/relay-stripe-webhook`,
   events `checkout.session.completed` + `account.updated`. (Created on the
   sandbox.)
4. **Supabase secret:** set `STRIPE_CONNECT_WEBHOOK_SECRET` to that endpoint's
   signing secret. (`STRIPE_SECRET_KEY` is already set from subscriptions.)
5. *(optional)* `RELAY_CONNECT_FEE_BPS` — platform fee in basis points taken from
   each payment (e.g. `100` = 1%). Unset = no fee.

## Notes

- **Express, direct charges.** The tenant is the merchant of record; RELAY is the
  platform. Payouts/refunds are managed from the tenant's Express dashboard
  ("Manage payouts on Stripe" in Settings → Payments).
- `stripe_connect_*` columns are server-managed (write-guarded); clients read
  them to gate the Pay buttons.
- `relay-create-payment` is public and authorised by the invoice id alone, so the
  emailed link and the unauthenticated portal can both create a checkout. It only
  ever produces a checkout that pays the invoice to the tenant.
- Test onboarding uses Stripe's test data; test payments use card
  `4242 4242 4242 4242`.
