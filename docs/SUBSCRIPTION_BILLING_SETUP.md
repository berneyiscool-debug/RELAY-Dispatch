# Subscription Billing Setup (Free / Cloud / Cloud+)

RELAY billing its own tenants, per active user, per month. This is separate from
the customer-facing invoice payments in `007_invoice_payments.sql` /
`relay-create-payment` (a tenant billing *their* customers).

| Tier        | Price (AUD/user/mo) | What it unlocks                                   |
|-------------|---------------------|---------------------------------------------------|
| Free        | $0                  | Offline/local account only. No cloud row.         |
| Cloud       | $18                 | Cloud sync, online payments, portals, email domain|
| Cloud+      | $21                 | Everything in Cloud **+ Deputy Max** (expandable Deputy)|

- **Free is offline-only** — it never creates a `companies` row, so it never
  touches Stripe. "Upgrading" from Free = the existing *Migrate to Cloud* flow.
- **Seats are per active (non-deactivated) user.** Adding/deactivating a user
  reconciles the Stripe subscription quantity, prorated.
- **Managed (keyless) AI is the Cloud+ differentiator.** Cloud and local users
  can still use AI by supplying their own API key (Settings → API Keys).

## 1. Stripe dashboard — create the two Prices

Create one Product per paid tier, each with a **recurring, per-unit (licensed)
monthly** Price in **AUD**:

- **RELAY Cloud** — $18.00 / unit / month
- **RELAY Cloud+** — $21.00 / unit / month

(There is no existing Product/Price catalogue — the invoice-payment flow uses
ad-hoc `price_data`, so nothing to migrate.)

**Recommended: give each Price a `lookup_key`** (edit the Price → Advanced →
Lookup key), so no secret has to hold a `price_...` id and you can re-price later
without touching config:

- Cloud  → lookup key `relay_cloud`
- Cloud+ → lookup key `relay_cloud_plus`

Enable the **Customer Portal** (Stripe → Settings → Billing → Customer portal)
and allow plan switching + cancellation so "Manage billing" works.

## 2. Supabase — Edge Function secrets

Add these under Supabase → Edge Functions → Secrets:

```
STRIPE_SECRET_KEY=sk_live_...        # or sk_test_... while testing
STRIPE_WEBHOOK_SECRET=whsec_...      # from the webhook endpoint you add in step 5
```

**Price resolution — pick ONE:**

- **Lookup keys (recommended):** nothing to add. The functions look Prices up by
  `relay_cloud` / `relay_cloud_plus` (set in step 1).
- **Explicit Price ids:** if you'd rather not use lookup keys, set these instead
  and they take precedence:
  ```
  STRIPE_PRICE_CLOUD=price_xxxxxxxxxxxx          # RELAY Cloud  ($18)
  STRIPE_PRICE_CLOUD_PLUS=price_yyyyyyyyyyyy      # RELAY Cloud+ ($21)
  ```

## 3. Apply the migration

`supabase/migrations/022_subscription_billing.sql` adds the server-managed
billing columns to `companies`, a client write-guard (so a tenant can never
self-upgrade), and `company_active_seat_count()`.

```bash
supabase db push       # or apply 022 via your migration process
```

## 4. Deploy the edge functions

```bash
supabase functions deploy relay-billing-checkout
supabase functions deploy relay-billing-portal
supabase functions deploy relay-billing-sync-seats
supabase functions deploy relay-stripe-webhook     # redeploy — now handles subscriptions
```

## 5. Stripe webhook — subscribe the events

The existing `relay-stripe-webhook` endpoint must now also receive:

- `checkout.session.completed`  *(already subscribed — now branches on mode)*
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

## How it fits together

```
Settings → Plan & Billing
  ├─ Choose Cloud / Cloud+  → relay-billing-checkout → Stripe Checkout (subscription)
  │                                     ↓ completed
  │                            relay-stripe-webhook  → companies.subscription_* set
  ├─ Manage billing         → relay-billing-portal   → Stripe Customer Portal
  └─ Add / deactivate user  → relay-billing-sync-seats → subscription quantity (prorated)

Gating (src/utils/subscription.js):
  getTier() → 'free' | 'cloud' | 'cloud_plus'
  hasCloudFeatures()  → any cloud account          (Cloud incl. full Deputy)
  isCloudPlus()       → tier==cloud_plus & live sub (Deputy Max: expandable window)
```

## Security notes

- `subscription_*` and `stripe_*` columns on `companies` are frozen against
  client writes by `companies_billing_guard` (mirrors `profiles_security_guard`
  in `020_security_hardening.sql`). Only the service-role webhook/functions write
  them. Clients read them (to render this tab and gate features) but cannot forge
  a tier or an "active" status.
- All billing edge functions verify the caller's JWT and require the `admin`
  role (seat-sync also allows `manager`, who can add/deactivate users).
- No Stripe SDK — every call is a direct REST request, matching the existing
  functions, so nothing new is bundled.
