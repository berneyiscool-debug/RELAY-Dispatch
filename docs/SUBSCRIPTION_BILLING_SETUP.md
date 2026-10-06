# Subscription Billing Setup (Free / Cloud / Cloud+)

RELAY billing its own tenants, per active user, per month. This is separate from
the customer-facing invoice payments in `007_invoice_payments.sql` /
`relay-create-payment` (a tenant billing *their* customers).

| Tier        | Price (AUD/user/mo) | What it unlocks                                   |
|-------------|---------------------|---------------------------------------------------|
| Free        | $0                  | Offline/local account only. No cloud row.         |
| Cloud       | $18                 | Cloud sync, online payments, portals, email domain|
| Cloud+      | $21                 | Everything in Cloud **+ brny Max** (expandable brny)|

- **Free is offline-only** — it never creates a `companies` row, so it never
  touches Stripe. "Upgrading" from Free = the existing *Migrate to Cloud* flow.
- **Seats are per active (non-deactivated) user.** Adding/deactivating a user
  reconciles the Stripe subscription quantity, prorated.
- **Managed (keyless) AI comes with the paid plans.** brny runs against the
  server-side key for any Cloud workspace, so there is no longer a Settings
  screen for supplying your own API key. A Free (local) account gets the
  rule-based assistant only.

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

`supabase/migrations/025_subscription_billing.sql` adds the server-managed
billing columns to `companies`, a client write-guard (so a tenant can never
self-upgrade), and `company_active_seat_count()`.

`supabase/migrations/036_company_name_uniqueness.sql` is the other half of
self-serve signup: it makes a company name claimable only once
(`company_name_available()` for the live form check, plus the ownership claim
inside `create_company_and_admin()`). Apply it after `029`–`031`.

```bash
supabase db push       # or apply 025 / 036 via your migration process
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

## 6. Onboarding: payment before access

A cloud account is unusable until Stripe says it is paid. Both entry points — the launcher's **Create account** form and the Settings **Upgrade to Cloud** modal — now run the same sequence: create the Supabase user, provision the company with `create_company_and_admin()`, then immediately hand off to Stripe Checkout. Neither of them copies local data or starts a session first.

```
Signup / Upgrade form
  ├─ company name availability (036 → company_name_available)   ← blocks only on 'taken'
  ├─ supabase.auth.signUp()
  ├─ create_company_and_admin()            → company + admin profile
  └─ startSubscribeCheckout('cloud')
        → relay-billing-checkout (JWT, admin role) → Stripe Checkout
              success_url = {origin}/#/subscribe?billing=success&tier=cloud
              cancel_url  = {origin}/#/subscribe?billing=cancelled&tier=cloud
```

`#/subscribe` (`src/pages/billing/Subscribe.js`) is the return target and the recovery page. It reads `billing` and `tier` from the hash query, then:

- polls the company row for a live `subscription_status` (10 attempts, 1.5 s apart) because the Stripe webhook lands asynchronously, and
- on `billing=success` without a live status yet, offers **Check again** and **Enter payment details again** rather than a dead end.

Once the subscription is live it finishes setup — copying local data across for an upgrade (`store.migrateLocalToCloud()`), retiring the local account, setting the session user — and routes into the app.

**The paywall is enforced by two mechanisms, not one.** For a fresh signup the app session is deliberately *not* started before payment, so `main.js` has nothing to boot and every route except `/login` and `/subscribe` resolves to `#/login`; the `/subscribe` hash is exempted from the boot rewrite, which is what makes the Stripe round trip survivable. For a returning unpaid user — one who closed the tab mid-signup, or whose payment later lapsed — the gate is `subscriptionRequired()` in `src/utils/subscription.js`, evaluated on every navigation:

```js
export function subscriptionRequired() {
  if (!isCloudUser()) return false;
  const sub = getSubscription();
  if (sub.compTier) return false;               // complimentary accounts never pay
  if (sub.status === undefined) return false;   // not loaded — don't guess
  return !LIVE_STATUSES.has(String(sub.status || ''));   // active | trialing | past_due
}
```

Two deliberate holes in that gate. **`comp_tier`** (`027_comp_access.sql`) is grandfathered access — a comp-titled account is never asked to pay, which is also the escape hatch if a real customer is wrongly locked out. **An unloaded subscription fails open**: `status === undefined` means the company row never arrived, and refusing to render the app on a transient read failure is worse than letting someone in for one paint. A fetched-but-unpaid cloud row has `status: null`, which is *not* `undefined`, so it is correctly blocked.

Abandoning onboarding is always possible: **Use a different account** on `#/subscribe` (and the equivalent controls in the upgrade modal) clears the pending markers and signs the Supabase user out. The Supabase user and the provisioned company row survive — only the local session ends — so a lapsed signup can be resumed by signing in again, which lands straight back on `#/subscribe`.

Two `sessionStorage` markers carry state across the Stripe detour, both same-tab by design: `relay_pending_cloud_signup` (a signup finished but onboarding did not) and `relay_pending_cloud_migration` (a local→cloud upgrade awaiting payment, carrying the local account id). They expire after 24 h, and their absence is tolerated everywhere — which is why the sign-in path also redirects to `#/subscribe` when a profile lookup comes back `PGRST116` (no profile row yet), the case where email confirmation sent the user out of the tab and the markers are gone.

## How it fits together

```
Signup / Upgrade → create_company_and_admin → relay-billing-checkout → Stripe Checkout
                                                       ↓ success
                              #/subscribe  ← polls for the webhook, then finishes setup
                                   ↓ live
                            relay-stripe-webhook → companies.subscription_* set

Settings → Plan & Billing
  ├─ Choose Cloud / Cloud+  → relay-billing-checkout → Stripe Checkout (subscription)
  │                                     ↓ completed
  │                            relay-stripe-webhook  → companies.subscription_* set
  ├─ Manage billing         → relay-billing-portal   → Stripe Customer Portal
  └─ Add / deactivate user  → relay-billing-sync-seats → subscription quantity (prorated)

Gating (src/utils/subscription.js):
  getTier() → 'free' | 'cloud' | 'cloud_plus'
  hasCloudFeatures()  → any cloud account          (Cloud incl. full brny)
  isCloudPlus()       → tier==cloud_plus & live sub (brny Max: expandable window)
  subscriptionRequired() → cloud account with no live status → forced to #/subscribe
```

## Security notes

- `subscription_*` and `stripe_*` columns on `companies` are frozen against
  client writes by `companies_billing_guard` (mirrors `profiles_security_guard`
  in `020_security_hardening.sql`). Only the service-role webhook/functions write
  them. Clients read them (to render this tab and gate features) but cannot forge
  a tier or an "active" status.
- All billing edge functions verify the caller's JWT and require the `admin`
  role (seat-sync also allows `manager`, who can add/deactivate users).
- `company_name_available()` is `SECURITY DEFINER` and granted to `anon` on
  purpose — the signup form checks the name before an account exists. It returns
  a single boolean, so the only thing it discloses is whether a name is taken,
  and the authoritative decision is still made server-side inside
  `create_company_and_admin()`.
- No Stripe SDK — every call is a direct REST request, matching the existing
  functions, so nothing new is bundled.
