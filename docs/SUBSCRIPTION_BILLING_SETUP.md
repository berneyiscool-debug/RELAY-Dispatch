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
- **Every cloud account starts on a 14-day free trial with no card on file.**
  The trial only sets `companies.subscription_status = 'trialing'`; when it runs
  out with no subscription the account goes read-only rather than locked, and the
  app prompts for Checkout. See Section 6.
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

`supabase/migrations/037_terms_and_trial.sql` is what makes the trial and the
terms record real: `profiles.terms_accepted_at` for the acceptance timestamp, the
`companies.trial_started_at` / `trial_ends_at` / `subscription_tier` /
`subscription_status` columns, the partial index `companies_trial_ends_idx`, and
two `SECURITY DEFINER` functions — `record_terms_acceptance()` and
`start_cloud_trial(p_days integer default 14)`. It deliberately does **not** touch
`create_company_and_admin()`; see Section 14 of
[`SUPABASE_MIGRATION.md`](./SUPABASE_MIGRATION.md) for why. **It is written but
not applied to live Supabase: it is waiting on review.**

```bash
supabase db push       # or apply 025 / 036 / 037 via your migration process
```

## 4. Deploy the edge functions

```bash
supabase functions deploy relay-billing-checkout
supabase functions deploy relay-billing-portal
supabase functions deploy relay-billing-sync-seats
supabase functions deploy relay-billing-reconcile
supabase functions deploy relay-stripe-webhook --no-verify-jwt   # redeploy — now handles subscriptions
```

`--no-verify-jwt` is not optional. Stripe signs its deliveries with `Stripe-Signature`;
it has no Supabase JWT, so the gateway must let the request through and the function
authenticates it with `STRIPE_WEBHOOK_SECRET` instead. Redeploying the webhook without
the flag turns every delivery into a `401` and silently stops all webhook writes.

### Stale `stripe_customer_id` self-heals

A `cus_...` id is only meaningful inside the Stripe account *and* mode that minted
it: a customer created with `sk_test_...` does not exist for `sk_live_...`, and a
customer deleted in the dashboard is gone in every mode. `companies.stripe_customer_id`
is frozen against client writes, but Stripe can still stop recognising the id — and
both functions used to trust it unconditionally, so `relay-billing-checkout` passed
`customer=cus_...` to `checkout/sessions` and Stripe answered
`400 No such customer: 'cus_...'`. That raw text surfaced on `#/subscribe`, and
because the stored id was never re-checked, the dead end was permanent.

Both functions now recognise that specific failure (`No such customer` /
`resource_missing`):

- **`relay-billing-checkout`** mints a new customer, overwrites the stale id on the
  company row, and retries the Checkout Session **once**. A customer is created only
  when the session call is rejected, so a healthy id is never churned. If the retry
  fails too, the caller gets a `502` with `code: "stripe_customer_invalid"` instead of
  the raw Stripe message.
- **`relay-billing-portal`** cannot self-heal — a portal session needs billing history
  that a brand-new customer does not have — so it clears the stale id
  (`stripe_customer_id = null`, which lets the next checkout mint a fresh one) and
  returns a `409` telling the admin to pick a plan.

Clearing the id is what re-opens the normal path, because `relay-billing-checkout`
creates a customer whenever the column is empty. Neither branch grants access: it only
replaces a Stripe reference Stripe has already rejected.

To unblock one company without redeploying, clear the column directly:

```sql
update companies set stripe_customer_id = null where stripe_customer_id = 'cus_...';
```

## 5. Stripe webhook — subscribe the events

The existing `relay-stripe-webhook` endpoint must now also receive:

- `checkout.session.completed`  *(already subscribed — now branches on mode)*
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

`checkout.session.completed` flips `subscription_status` to `active` when
`payment_status` is `paid` (no-trial checkout), so a completed subscription is
recognised immediately and the `#/subscribe` poll clears "payment not confirmed"
even if `customer.subscription.created` is delayed or missing. Keep
`customer.subscription.*` subscribed regardless — it carries the full detail
(seats, period end, tier) and reports later status changes (`past_due`,
`canceled`).

### If a delivery is missed: reconcile from Stripe

The webhook is the only thing that writes `companies.subscription_status`, so a missed
or misconfigured delivery used to strand a paying customer on "Payment not confirmed
yet" forever — the page could only re-read the company row, and the row was the thing
that never changed. `relay-billing-reconcile` closes that hole by asking Stripe
directly.

```
#/subscribe  (or Settings → Plan & Billing after a billing=success return)
  └─ relay-billing-reconcile (JWT; admin or manager of the company)
        ├─ GET /v1/subscriptions?customer=<companies.stripe_customer_id>&status=all
        ├─ pick the subscription that owns the company
        └─ write subscription_* only when status or subscription id actually changed
```

- **It cannot downgrade.** Nothing live at Stripe (`no_subscription` / `not_live`) leaves
  the row untouched and reports why; only a live `active` / `trialing` / `past_due`
  subscription is written. The column rules are duplicated from
  `relay-stripe-webhook`'s `applySubscription()` in the sibling
  `reconcile.js`, because edge functions are deployed independently and cannot share
  a module — keep the two in step.
- **The response doubles as a diagnostic.** `reason` is one of `no_customer`,
  `no_subscription`, `not_live`, and the paywall prints a plain-English line for each
  when the check still comes back inactive.
- **A checkout that never reached Stripe is still `no_customer`** even after a successful
  session, because the customer id is only written by the webhook. That is the signal
  to look at the Stripe dashboard, not at the app.

## 6. Onboarding: a 14-day trial, then payment

A cloud account now opens on a **14-day free trial with no card on file**. The company is only ever created *after* the address is verified, so signup is a four-step sequence:

1. **Create account** (`#/launch`) — business name, your name, mobile, email and a password of at least 8 characters, plus a required tick for the Terms and Privacy Policy. Name availability is checked live (036), but nothing is stored server-side yet.
2. **Verify email** — `supabase.auth.signUp()` returns a user and no session, so the launcher switches to a **Check your inbox** screen showing the address, with a rate-limited resend and a *wrong email?* way back. What they typed is saved as prefill only (`relay_pending_cloud_signup`); none of it is trusted.
3. **Finish setting up** — the first verified sign-in has a session but no profile row, so the app routes to `#/setup` (`src/components/FinishSetupCard.js`) for the same prefilled form. This is the step that provisions.
4. **In the app** — provisioning returns, the trial is already running, and the user lands in the app with a dismissible first-run checklist.

```
Create account (#/launch)
  ├─ company name availability (036 → company_name_available)   ← blocks only on 'taken'
  ├─ terms + privacy tick (required)       → prefill only
  └─ supabase.auth.signUp()               → user, no session  → "Check your inbox"

First sign-in after verifying (#/login → #/setup)
  ├─ create_company_and_admin()           → company + admin profile
  ├─ record_terms_acceptance()            → profiles.terms_accepted_at (best effort)
  └─ start_cloud_trial()                  → subscription_status = 'trialing', 14 days
        → the app, with the trial banner and the first-run checklist

Trial ends with no subscription
  └─ TrialBanner → startSubscribeCheckout('cloud')
        → relay-billing-checkout (JWT, admin role) → Stripe Checkout
              success_url = {origin}/#/subscribe?billing=success&tier=cloud
              cancel_url  = {origin}/#/subscribe?billing=cancelled&tier=cloud

Still no subscription
  └─ read-only: data kept, export or subscribe later
```

**The one entry point that still goes straight to Checkout is the explicit purchase.** The Settings **Upgrade to Cloud** modal (`src/components/CloudUpgrade.js`) provisions through the same `provisionCloudAccount()` and then calls `startSubscribeCheckout('cloud')` immediately, because there the user has just asked to buy a subscription. Signup does not do that: nothing is charged until the trial ends and the banner asks.

`#/subscribe` (`src/pages/billing/Subscribe.js`) is the return target from Checkout and the recovery page. It reads `billing` and `tier` from the hash query, then:

- reconciles against Stripe on load (`relay-billing-reconcile`) and then polls the
  company row for a live `subscription_status` (10 attempts, 1.5 s apart) because the
  Stripe webhook lands asynchronously, and
- on `billing=success` without a live status yet, offers **Check again** — which
  reconciles again — and **Enter payment details again** rather than a dead end, plus a
  diagnostic line saying why Stripe has nothing live for the account.

Once the subscription is live it finishes setup — copying local data across for an upgrade (`store.migrateLocalToCloud()`), retiring the local account, setting the session user — and routes into the app.

**The paywall is enforced on navigation, not by withholding a session.** A cloud signup ends with a real session and a running trial, so the gate has to be able to tell "trial" from "lapsed": `subscriptionRequired()` in `src/utils/subscription.js` is evaluated on every navigation, and `trialing` is one of its live statuses:

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

**Running out of trial is read-only, not a paywall.** The no-card trial has no Stripe subscription and no customer record, so Stripe reports nothing and expiry cannot come from a webhook: `trialState()` in `src/utils/subscription.js` decides it from `trial_ends_at` and returns `'none' | 'running' | 'expired'`, and every trial question — `trialActive()`, `trialDaysLeft()`, `trialExpired()`, `isReadOnly()` — reads that one predicate so the banner, the helpers and the gate can never disagree. `isReadOnly()` is true only for an *expired* trial, and `src/data/store.js` calls `_readOnlyBlocked()` before each write, so `create`, `update`, `delete`, `saveSettings` and `save` return early with a `console.warn` and a throttled toast instead of mutating anything. Reads, exports (`downloadDataSnapshot`) and the subscribe flow all keep working, so no data is stranded and the user can subscribe whenever they like. Nothing is ever charged automatically, because Stripe has no card to charge until the user enters one.

Abandoning onboarding is always possible: **Use a different account** on `#/subscribe` (and the equivalent controls in the upgrade modal) clears the pending markers and signs the Supabase user out. The Supabase user and the provisioned company row survive — only the local session ends — so a signup abandoned before payment can be resumed by signing in again, which lands back on `#/setup` if the company was never provisioned and on `#/subscribe` if it was.

Two `sessionStorage` markers carry state across the Stripe detour, both same-tab by design: `relay_pending_cloud_signup` (a signup finished but onboarding did not) and `relay_pending_cloud_migration` (a local→cloud upgrade awaiting payment, carrying the local account id). They expire after 24 h, and their absence is tolerated everywhere — which is why the sign-in path also redirects to `#/setup` when a profile lookup comes back `PGRST116` (no profile row yet), the case where email confirmation sent the user out of the tab and the markers are gone.

## How it fits together

```
Signup (create account) → verify email → sign in → create_company_and_admin → start_cloud_trial
                                                            ↓ 14 days, no card
                          the app, trial banner running    ← #/setup
                                                            ↓ trial ends
                            read-only  ←  startSubscribeCheckout → Stripe Checkout
                                                 ↓ success
                        #/subscribe  ← polls the row, reconciles from Stripe, then finishes setup
                             ↓ live
                      relay-stripe-webhook → companies.subscription_* set
                      (missed delivery? → relay-billing-reconcile re-reads Stripe and patches the row)

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
  trialState()        → 'none' | 'running' | 'expired'  (from trial_ends_at, not a webhook)
  isReadOnly()        → trialState()==='expired' → writes blocked in src/data/store.js
```

## Security notes

- `subscription_*` and `stripe_*` columns on `companies` are frozen against
  client writes by `companies_billing_guard` (mirrors `profiles_security_guard`
  in `020_security_hardening.sql`). Only the service-role webhook/functions write
  them. Clients read them (to render this tab and gate features) but cannot forge
  a tier or an "active" status.
- All billing edge functions verify the caller's JWT and require the `admin`
  role (seat-sync and reconcile also allow `manager`, who can add/deactivate users).
- `company_name_available()` is `SECURITY DEFINER` and granted to `anon` on
  purpose — the signup form checks the name before an account exists. It returns
  a single boolean, so the only thing it discloses is whether a name is taken,
  and the authoritative decision is still made server-side inside
  `create_company_and_admin()`.
- `record_terms_acceptance()` and `start_cloud_trial()` (migration 037) are both
  `SECURITY DEFINER` with `SET search_path = public`, revoked from `PUBLIC` and
  `anon`, and granted to `authenticated` / `service_role` only. Neither takes a
  user or company id: each resolves the caller from `auth.uid()`, so a client can
  only ever stamp its own profile and start its own trial.
  `record_terms_acceptance()` writes only when `terms_accepted_at IS NULL` and
  otherwise returns the timestamp already stored, so a retry cannot move the
  acceptance date. `start_cloud_trial()` clamps the length server-side
  (`LEAST(GREATEST(p_days, 1), 90)`), locks the company row `FOR UPDATE`, never
  extends a trial that has already started, and refuses a free trial outright to
  any company that already has a `stripe_customer_id`. It also sets
  `relay.admin_provision` around its single `UPDATE`, because
  `companies_billing_guard_biu` would otherwise freeze `subscription_status` and
  `subscription_tier` back to their stored values and leave a half-written trial
  behind.
- Terms acceptance and the trial are written *after* the company exists and are
  best-effort (`console.error` only). A failure there must not cost a user the
  account they just created, and neither failure can hand out access on its own —
  the trial only sets `subscription_status = 'trialing'`, which is a status the
  webhook can overwrite once a real subscription exists.
- The stale-customer self-heal grants nothing and deletes nothing: it replaces a
  `stripe_customer_id` that Stripe has already rejected with one Stripe just minted.
  It operates on the caller's own company row, resolved from the JWT and never from
  the request body, and the retry is a single extra attempt rather than a loop, so a
  persistently failing Stripe call cannot be turned into a request flood.
- No Stripe SDK — every call is a direct REST request, matching the existing
  functions, so nothing new is bundled.
