# Xero Phase 1: Implementation Plan

Scope: connect a cloud company to one Xero org, push customers and invoices,
push RELAY-recorded payments, and pull "paid in Xero" back. Background and
sources are in `XERO_INTEGRATION_RESEARCH.md`.

Out of scope: items/stock, purchase orders and bills, contact import, partial
payment UI, payroll, non-AUD orgs, and local (IndexedDB) accounts.

---

## 0. Key design decisions

1. **Sync is triggered by the database, not the UI.** Invoice status changes in
   at least six places: `src/actions/invoices.js` (send/pay/void),
   `InvoiceDetail.js:1063` and `:1312`, `InvoicesList.js:123/153/271` (bulk), and
   server-side in `relay-stripe-webhook` `markInvoicePaid`. Hooking each one would
   leak, so an `AFTER UPDATE` trigger on `invoices` enqueues a sync job whenever a
   relevant column changes. Every path is covered, Stripe included.
2. **Queue + worker, never inline.** Requests to Xero are rate-limited (60/min,
   5 concurrent per org) and can fail. Jobs go in `xero_sync_jobs` and a worker
   function drains them per tenant, with retry and backoff.
3. **RELAY owns invoice content; Xero owns payment state once it has a payment.**
   After Xero records any payment, RELAY edits to that invoice are no longer pushed.
   The UI shows "Locked by Xero payment" instead.
4. **RELAY owns invoice numbers.** We push `InvoiceNumber = invoice.number`. Setup
   text tells the user to use a distinct prefix or turn off Xero auto-numbering.
5. **Tokens never reach the client.** They live in a table with RLS that blocks
   every role except `service_role`. The client sees only a status view.
6. **Pure logic in plain ESM next to `index.ts`** (same as
   `relay-create-payment/returnUrls.js`), so `supabase/tests` can unit-test the
   mapping without Deno.

---

## 1. Database: `supabase/migrations/<ts>_xero_integration.sql`

> **Built (step 2):** `20261020090000_xero_integration.sql`, tested by
> `supabase/tests/xero-integration.test.js`. Differences from the sketch below:
> - Client status is the `xero_connection_status()` SECURITY DEFINER function, not
>   a view, which avoids the Supabase "security definer view" advisor warning.
> - Token columns are `access_token_enc` / `refresh_token_enc`, encrypted with
>   AES-GCM in the edge functions.
> - `tenant_id` is nullable so the `choose_tenant` / `unsupported_currency` states
>   can be stored.
> - `xero_payment_ids` is a jsonb **object** (RELAY payment ref → Xero PaymentID).
> - The pull job is `entity='xero_invoice', action='refresh'`.
> - The worker writes through two service-role RPCs:
>   - `xero_claim_sync_jobs(limit)` (SKIP LOCKED, reclaims runs stuck >10 min)
>   - `xero_apply_invoice_pull(...)`, which sets `relay.xero_sync` so pulls never
>     echo back as pushes
> - Plain service-role writes that only touch `xero_*` columns don't enqueue either.

```sql
-- 1a. Connection (one per company). Server-write only; no client policies.
create table xero_connections (
  company_id      uuid primary key references companies on delete cascade,
  tenant_id       text not null,           -- xero-tenant-id
  tenant_name     text,
  connection_id   text,                    -- from GET /connections (for DELETE on disconnect)
  base_currency   text,
  access_token    text,                    -- encrypted (see §1e)
  refresh_token   text,                    -- encrypted
  access_expires_at  timestamptz,
  refresh_rotated_at timestamptz,
  scopes          text,
  status          text not null default 'active', -- active | needs_reauth | disconnected
  last_error      text,
  connected_by    uuid references auth.users,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create unique index xero_connections_tenant_idx on xero_connections (tenant_id)
  where status <> 'disconnected';
alter table xero_connections enable row level security;  -- no policies = service role only
revoke all on xero_connections from anon, authenticated;

-- 1b. Safe client-readable status (no tokens).
create view xero_connection_status with (security_invoker = false) as
  select company_id, tenant_name, base_currency, status, last_error, updated_at
  from xero_connections
  where company_id = public.get_user_company_id(auth.uid());
grant select on xero_connection_status to authenticated;

-- 1c. Link + sync-state columns (server-managed).
alter table customers add column if not exists xero_contact_id text;
alter table invoices  add column if not exists xero_invoice_id text;
alter table invoices  add column if not exists xero_status text;      -- AUTHORISED | PAID | VOIDED ...
alter table invoices  add column if not exists xero_amount_due numeric;
alter table invoices  add column if not exists xero_synced_at timestamptz;
alter table invoices  add column if not exists xero_sync_error text;
alter table invoices  add column if not exists xero_payment_ids jsonb default '[]'::jsonb; -- pushed RELAY payment refs → Xero PaymentID

-- 1d. Queue.
create table xero_sync_jobs (
  id            bigint generated always as identity primary key,
  company_id    uuid not null references companies on delete cascade,
  entity        text not null,     -- 'invoice' | 'contact' | 'payment' | 'pull_invoice'
  entity_id     text not null,     -- RELAY id, or Xero InvoiceID for pull_invoice
  action        text not null,     -- 'upsert' | 'void' | 'pay' | 'refresh'
  status        text not null default 'pending', -- pending | running | done | failed | skipped
  attempts      int  not null default 0,
  run_after     timestamptz not null default now(),
  last_error    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
-- Collapse duplicates: only one pending job per (entity, id, action).
create unique index xero_sync_jobs_pending_uniq
  on xero_sync_jobs (company_id, entity, entity_id, action) where status = 'pending';
create index xero_sync_jobs_due_idx on xero_sync_jobs (status, run_after);
alter table xero_sync_jobs enable row level security;
create policy xero_sync_jobs_read on xero_sync_jobs for select
  using (company_id = public.get_user_company_id(auth.uid()));  -- read-only for the sync log UI
```

**1e. Token encryption.** Use Supabase Vault (`vault.create_secret` /
`vault.decrypted_secrets`) if it's enabled on the project. Otherwise encrypt in
the edge function with AES-GCM using a `XERO_TOKEN_KEY` secret (Web Crypto). Pick
one when we start; the AES-GCM route has no extension dependency.

**1f. Enqueue trigger on `invoices`** (`security definer`, `search_path = public`).
It only fires when the company has an `active` connection.

| Change | Job |
|---|---|
| `status` leaves `Draft` (→ Sent/Overdue/Paid) and `xero_invoice_id is null` | `invoice/upsert` |
| `line_items`, `total`, `due_date`, `customer_id` change while not Draft/Void and `xero_status` is not PAID / has no Xero payment | `invoice/upsert` |
| `status` → `Paid` and change is **not** from the Xero worker | `invoice/pay` |
| `status` → `Void` and `xero_invoice_id` set | `invoice/void` |

To tell worker writes apart, the worker sets `set_config('relay.xero_sync', 'true', true)`
(the same trick as `relay.admin_provision` in `companies_billing_guard`). Do this
through an RPC, or skip the trigger when only `xero_*` columns changed. The
second option is simpler and doesn't need an RPC, so use it.

**1g. Guard trigger.** Extend the column-freeze approach of
`companies_billing_guard` to `invoices.xero_*` and `customers.xero_contact_id`, so
a client JWT can't overwrite them. Service role passes.

**1h. Store mapping.** Add the new columns to the `invoices` / `customers`
whitelists in `src/data/store.js` (~L218–270) as **read-only** inbound mappings
(`xeroInvoiceId`, `xeroStatus`, `xeroSyncError`, `xeroSyncedAt`). Strip them in the
outbound mapper so client updates never send them. The guard enforces this anyway.

**Tests (`supabase/tests/xero-integration.test.js`, PGlite, same harness as
`migrations.test.js`):**
- `authenticated` can't select `xero_connections` (own company or another).
- The status view only returns the caller's company.
- A client update to `xero_invoice_id` is frozen.
- Draft→Sent enqueues exactly one `invoice/upsert`. A second update collapses into it.
- No connection → no job. Updates that only touch `xero_*` columns → no job.
- Void with `xero_invoice_id` → `invoice/void`. Paid → `invoice/pay`.

---

## 2. Edge functions (`supabase/functions/`)

Every function follows the existing shape: `serve`, CORS block, `json()` helper,
service-role client, and a header comment listing secrets.

Shared ESM helpers in `supabase/functions/_xero/` (plain JS, unit-tested):
- `oauth.js`: build the authorize URL, sign/verify the `state` JWT (HMAC with
  `XERO_STATE_SECRET`, holding `company_id`, `user_id`, `returnPath`, `exp`), and
  form-encode token exchange/refresh.
- `client.js`: `xeroFetch(conn, path, init)` attaches the bearer and
  `xero-tenant-id`, refreshes the token when <2 min of life remains, reads
  `X-MinLimit-Remaining` / `Retry-After`, and throws a typed `RateLimited` /
  `AuthRevoked` / `ValidationError`.
- `mapping.js`: RELAY → Xero payloads (see §3).
- `signature.js`: webhook HMAC verify (base64 SHA-256 of the raw body, constant-time compare).

> **Built (step 4):** `relay-xero-connect`, `relay-xero-callback` and
> `relay-xero-status`. Shared Deno plumbing is in `_xero/edge.ts`, and the pure
> flow rules in `_xero/connect.js` (tested by `xero-connect.test.js`).
> `returnUrls.js` moved to `_shared/`. Additions to the sketch:
> - Only the organisations from **this** consent count (matched on the token's
>   `authentication_event_id`). Unchosen orgs are disconnected so they don't use up
>   connections.
> - A non-AUD org is disconnected and recorded as `unsupported_currency`.
> - One org can't feed two companies (`tenant_in_use`).
> - Switching to a different org clears the old org's link ids and skips queued work.
> - Retry runs through a new `xero_retry_failed_jobs` RPC (in the same migration).
> - Accounts aren't cached server-side. The client caches them per page visit.
> - The "push automatically" toggle was dropped, since the trigger always queues.
> - The Settings card is in `renderCostCentersTab`, and the cost center modal
>   suggests Xero codes through datalists. `src/utils/xero.js` (tested) is the
>   client.
> - Deploy steps are in `docs/XERO_SETUP.md`.

### 2a. `relay-xero-connect` (POST, admin JWT)
Same checks as `relay-connect-onboard` (profile → `role === 'admin'`, cloud company).
Returns `{ url }`:
`https://login.xero.com/identity/connect/authorize?response_type=code&client_id=…&redirect_uri=<XERO_REDIRECT_URI>&scope=<scopes>&state=<signed>`.
Validate `returnPath` with the `isAllowedReturnUrl` allow-list. Move
`returnUrls.js` into `_shared/` so both functions import it.

Scopes: `openid profile email offline_access accounting.contacts accounting.invoices accounting.payments accounting.settings.read`.

### 2b. `relay-xero-callback` (GET, `verify_jwt=false`, it's the redirect URI)
1. Verify `state`, then exchange `code` at `https://identity.xero.com/connect/token`.
2. `GET https://api.xero.com/connections`. With one org, take it. With several,
   store the tokens with `status='choose_tenant'` and redirect with
   `&xero=choose`. The client then calls `relay-xero-status { selectTenant }`.
3. `GET /api.xro/2.0/Organisation`. If `BaseCurrency !== 'AUD'`, store
   `status='unsupported_currency'` and redirect with an error.
4. Upsert `xero_connections` and 302 to
   `<appBase>/#/settings?tab=cost_centers&xero=connected`.
   Desktop (`file://`) falls back to the hosted app, the same limitation Stripe
   Connect has today.

### 2c. `relay-xero-status` (POST, any company user; admin for mutations)
- `{}` → status, tenant name, counts of pending/failed jobs.
- `{ selectTenant }` → finish multi-org selection (admin).
- `{ accounts: true }` → `GET /Accounts?where=Status=="ACTIVE"` plus
  `GET /TrackingCategories` and `GET /TaxRates`, cached ~10 min. These feed the
  Settings dropdowns, so admins don't type account codes by hand.
- `{ disconnect: true }` → `DELETE /connections/{connection_id}`, revoke the
  refresh token (`/connect/revocation`), mark `disconnected`, clear tokens (admin).
- `{ retry: jobId | 'all' }` → reset failed jobs to pending (admin).

> **Built (step 5):** `relay-xero-sync` plus `_xero/worker.js`. The job logic
> takes injected DB/Xero adapters and is tested in `xero-worker.test.js`. It
> handles contact upsert, invoice upsert and invoice void. `pay` and `refresh`
> stay queued until step 6 (the worker claims only `WORKER_ACTIONS`).
> Additions to the sketch:
> - The claim RPC only takes jobs for **active** connections, and can narrow by
>   company and action.
> - The invoice carries `Url` = its RELAY link. Before a first push the worker
>   looks the number up in Xero and adopts only an invoice with that link.
> - Rate limits and revoked access release jobs without using up an attempt.
> - Transient errors show on the job only. Permanent ones also go on
>   `invoices.xero_sync_error`.
> - The idle-token refresh runs inside the scheduled worker. There's no
>   separate cron.
> - Cron SQL is in `XERO_SETUP.md`, not a migration, since it needs the project
>   URL and a Vault secret.

### 2d. `relay-xero-sync` (worker; service-role or cron-only)
Called by (i) a scheduled run every minute and (ii) a fire-and-forget nudge from
the client after an invoice save, so the sync feels instant.
- Claim up to N due jobs with `update … set status='running' … where id in (select … for update skip locked) returning *`, wrapped in an RPC.
- Group by company and handle each tenant one at a time (≤5 concurrent, well under 60/min).
- Handlers:
  - `invoice/upsert`: ensure the contact exists (inline sub-step), build the
    payload, `POST /Invoices?summarizeErrors=false` with
    `Idempotency-Key: relay-inv-<id>-<updated_at>`. Save `InvoiceID`, `Status`,
    `AmountDue`, `xero_synced_at` and clear the error.
  - `invoice/pay`: if Xero already shows PAID (paid in Xero), mark done. Otherwise
    for each RELAY payment (from `line_items.payments`, or a synthesised single
    payment `{amount: total, date: paid_date}`) not already in `xero_payment_ids`,
    `PUT /Payments` with `Account.Code = settings.xero.paymentAccountCode`. Use
    `Idempotency-Key` = `relay-pay-<invoiceId>-<paymentId or stripe_session_id>`.
  - `invoice/void`: `POST /Invoices/{id}` with `Status: VOIDED`. If Xero returns
    "has payments", set an error saying it has to be voided in Xero.
  - `pull_invoice/refresh`: `GET /Invoices/{xeroId}`. If `Status=PAID` and RELAY
    isn't Paid, set `status='Paid'`, `paid_date = FullyPaidOnDate`,
    `payment_method='Xero'`. If `VOIDED` and RELAY isn't Void, flag it with
    `xero_sync_error` rather than auto-voiding (safer). Always update
    `xero_status` / `xero_amount_due`.
- Errors: `RateLimited` → `run_after = now() + Retry-After`, attempts stay as they are.
  `AuthRevoked` (invalid_grant) → connection `needs_reauth`, park the company's jobs,
  notify admins. `ValidationError` → `failed` plus the message on
  `invoices.xero_sync_error`. Anything else → exponential backoff
  (1m, 5m, 30m, 2h, 12h), `failed` after 6 attempts.

> **Built (step 6):** the worker handles `invoice/pay` and `xero_invoice/refresh`.
> `relay-xero-webhook` verifies the signature and calls the new
> `xero_enqueue_pulls(tenant, ids)` RPC, which resolves the company and queues
> only invoices RELAY pushed. Payments use `PUT /Payments`, one per ref, and each
> PaymentID is saved as soon as Xero accepts it. A pay job for an invoice not yet
> in Xero retries with backoff instead of failing. Deleted-in-Xero (404) pulls
> are skipped.

### 2e. `relay-xero-webhook` (POST, `verify_jwt=false`)
- Read the raw body and verify `x-xero-signature` against `XERO_WEBHOOK_KEY`.
  Bad signature → **401 with an empty body**. Good → **200** fast. This passes the
  intent-to-receive handshake, where `events` is empty.
- For each event with `eventCategory='INVOICE'`, look up the company by
  `tenantId` and enqueue `pull_invoice/refresh` with `entity_id = resourceId`. Ignore
  invoices not in RELAY. The worker matches on `xero_invoice_id`; unknown IDs are
  skipped with no egress.
- CONTACT events are ignored in Phase 1.

### 2f. Token keep-alive
Run a daily scheduled call to `relay-xero-sync { refreshIdle: true }` that refreshes
any connection not refreshed in 30+ days, so the 60-day idle expiry never hits.

**Scheduling:** the repo doesn't use `pg_cron` yet. Enable `pg_cron` + `pg_net` in
the migration and `cron.schedule` an `net.http_post` to the worker with a
`XERO_CRON_SECRET` header. If the project can't enable those extensions, use a
Supabase Scheduled Function instead.

### Secrets
`XERO_CLIENT_ID`, `XERO_CLIENT_SECRET`, `XERO_REDIRECT_URI`
(`…/functions/v1/relay-xero-callback`), `XERO_WEBHOOK_KEY`, `XERO_STATE_SECRET`,
`XERO_TOKEN_KEY`, `XERO_CRON_SECRET`. Document them in
`docs/XERO_SETUP.md`, styled like `CONNECT_PAYMENTS_SETUP.md`.

---

## 3. Mapping (`_xero/mapping.js`) and the rules it encodes

> **Built (step 3):** `supabase/functions/_xero/` holds `crypto.js` (webhook HMAC,
> signed state, AES-GCM tokens), `oauth.js`, `client.js` and `mapping.js`. Tests are
> in `supabase/tests/xero-mapping.test.js` and `xero-client.test.js`. Differences
> from the sketch:
> - Contacts are stamped `ContactNumber = RELAY-<customer id>` and matched on that
>   first, then email, then name.
> - Invoices are posted with `unitdp=4`, so marked-up unit rates aren't rounded to
>   cents. `summarizeErrors` stays at its default, one invoice per request, so a
>   validation failure is a plain 400.
> - Token ciphertext is bound to the company id (AES-GCM additional data).
> - Payments: each recorded part-payment uses `p:<id>`. The unrecorded balance on
>   a Paid invoice uses `balance`, or `stripe:<session>` when Stripe paid it.

**Contact** (from `customers`):
`Name` = `company` or `first_name last_name` (must be unique in Xero), `FirstName`,
`LastName`, `EmailAddress`, `Phones[DEFAULT]`, `Addresses[STREET]` (from the
single `address` string, put in `AddressLine1`). Matching order:
`xero_contact_id`, then `GET /Contacts?where=EmailAddress=="…"`, then a Name
match, then create. A name collision with a different email gets
`Name + " (RELAY)"` suffix and logs a warning.

**Invoice** (from `invoices` and their parsed `line_items` object):
```
Type: ACCREC, Contact: {ContactID}, InvoiceNumber: number, Reference: jobNumber(s)
Date: issueDate || created_at::date, DueDate: due_date
Status: AUTHORISED, LineAmountTypes: Exclusive, CurrencyCode: AUD
LineItems: sections.flatMap(lineItems).map(l => ({
  Description: l.description, Quantity: l.qty, UnitAmount: l.rate,
  AccountCode: accountFor(l, invoice), TaxType: taxTypeFor(l),
  Tracking: trackingFor(invoice)   // from job.cost_center_id
}))
```
- `accountFor`: cost center `xero_sales_account_code` for the invoice's job, then
  the per-type default (`settings.xero.labourAccountCode` for `type:'labor'`,
  `materialsAccountCode` for `'material'`), then `settings.xero.defaultSalesAccountCode`.
  If none resolves, the job fails with a clear validation error. Don't guess.
- Multi-job invoices (`jobIds`): use the tracking/account of the job each line
  came from if the line records it. Otherwise use the first job's cost center and
  note it in the sync log.
- `taxTypeFor`: `OUTPUT` (GST on income) when the invoice has tax > 0, otherwise
  `EXEMPTOUTPUT`. Line-level overrides come later.
- **Rounding check:** after the POST, compare Xero's `Total` with RELAY's `total`.
  A difference of ≤ $0.05 gets a warning on `xero_sync_error` but counts as synced.
  More than that fails the job so an admin can look. Unit-test with RELAY's
  `roundCurrency` cases.
- **Deposit credits** (negative lines from `invoices.js:302`): pushed as-is, since
  Xero allows negative lines when the total ≥ 0. Total < 0 → validation error. The
  prepayment/credit-note model is Phase 2.
- **Draft invoices are never pushed.**

**Payment:** `{ Invoice:{InvoiceID}, Account:{Code: paymentAccountCode}, Date, Amount, Reference: method + (stripe_session_id||'') }`.
Stripe payments should go to a "Stripe clearing" account the admin picks, so
Stripe payouts reconcile in Xero.

**Unit tests (`supabase/tests/xero-mapping.test.js`):** plain array line_items vs
the sections object, labour/material account resolution, missing account →
error, cost-center tracking, GST/exempt, deposit negative lines, multi-job,
contact naming/collision, payment idempotency keys, webhook signature
(known vector), state JWT tamper/expiry.

---

## 4. Client changes

**Settings → Cost Centers & Xero** (`src/pages/Settings.js` `renderCostCentersTab`, ~L4386):
- Remove `cost_centers` from `COMING_SOON_SETTINGS_TABS`
  (`src/components/CloudUpgrade.js:55`) and add it to `CLOUD_ONLY_SETTINGS_TABS`.
  Gate it behind a new `FLAGS.xero` in `src/utils/flags.js` until launch, the same
  way `FLAGS.payments` works.
- Add a **Xero connection card** above the cost center list:
  - Disconnected: "Connect to Xero" button (admin) → `startXeroConnect()`.
  - Connected: org name, status pill (text + icon, not colour alone),
    pending/failed counts, "Retry failed", "Disconnect".
  - `needs_reauth` / `unsupported_currency`: an explanation and a Reconnect button.
  - Handles `?xero=connected|choose|error` on return. `choose` shows an org picker.
- Add a **Defaults** section (admin, saved to `companies.settings.xero`):
  default sales account, labour account, materials account, payment account
  (bank/clearing), and "Push invoices automatically when sent" (default on). All
  are dropdowns populated from `relay-xero-status { accounts:true }`.
- In the cost center edit modal, replace the free-text Xero account/tracking
  inputs with the same dropdowns when connected, and keep free text when not.

**New `src/utils/xero.js`**, mirroring `src/utils/payments.js`:
`xeroEnabled()`, `xeroStatus()`, `startXeroConnect()`, `selectXeroTenant()`,
`disconnectXero()`, `listXeroAccounts()`, `retryXeroSync()`,
`nudgeXeroSync()` (fire-and-forget, errors swallowed). Unit-test the gating
in `src/utils/xero.test.js`.

**Invoice UI:**
- `InvoicesList.js`: small Xero column/badge, shown only when connected: Synced ✓,
  Pending, Error (tooltip shows `xeroSyncError`, via the new `src/utils/tooltip.js`).
- `InvoiceDetail.js`: a status row with "Open in Xero"
  (`https://go.xero.com/AccountsReceivable/View.aspx?InvoiceID=…`), the last sync
  time and error text, plus a "Retry" button. Disable content editing when
  `xeroStatus === 'PAID'` or Xero has payments, with the reason shown.
- After a status change in the send/pay/void paths, call `nudgeXeroSync()`.
  It's optional, since the trigger and cron already cover it.

**brny:** add a read in `src/actions/reads.js` (`xero_sync_status`) so the
assistant can answer "did INV-1042 go to Xero?". No new write actions in Phase 1.

**Docs:** update `DOCS.md` (remove "not shipped yet" and describe the feature) and
add `docs/XERO_SETUP.md`.

---

## 5. Build order (each step is a reviewable PR)

> **Status:** steps 2–7 are built on `feat/xero-integration` and dark behind
> `FLAGS.xero`. Step 7's sync state comes from `xero_sync_jobs` (readable by the
> company) plus the invoice's `xero_*` fields, worked out in
> `xeroInvoiceSyncState()`. The nudge hooks into the store's successful-update
> path rather than each send/pay/void call site. The bulk "Mark Paid" now sets
> `paidDate` (it used to write a `datePaid` field with no column), and payment
> mapping falls back to the invoice's last change for older rows. Remaining work:
> step 1 (register the Xero app), deploy, and step 8 (pilot).

1. **Xero app registration (manual, you):** create the app at developer.xero.com
   (Web app, Starter tier), set the redirect URI, enable webhooks, and note the
   client id/secret and webhook key. Connect a **Xero Demo Company (AU)** for testing.
2. **Migration + PGlite tests** (§1). No behaviour change, since nothing enqueues
   without a connection.
3. **`_xero` helpers + mapping tests** (§2 shared, §3). Pure code, fully unit-tested.
4. **Connect / callback / status functions** plus the Settings connection card and
   defaults, behind `FLAGS.xero`. Exit check: connect and disconnect the demo
   company, and see the accounts dropdowns fill.
5. **Worker: contact + invoice upsert + void**, plus cron. Exit check: sending an
   invoice in RELAY shows up AUTHORISED in the Xero demo org with correct GST,
   accounts and tracking.
6. **Payments both ways + webhook.** Exit check: a manual payment in RELAY → Xero
   payment, a Stripe test payment → exactly one Xero payment, and marking paid in
   Xero → RELAY flips to Paid within a minute.
7. **Invoice UI badges / detail row / lock, brny read, docs.**
8. **Pilot:** turn on `FLAGS.xero` for up to 5 real tenants (Starter limit). Apply
   for certification in parallel, since that's needed before tenant 6.

## 6. Risks to watch

- **Duplicate invoices in Xero** from retries. Mitigated by `Idempotency-Key`,
  checking `xero_invoice_id` before POST, and a lookup by `InvoiceNumber` before
  creating.
- **Invoice-number clashes** with the tenant's existing Xero numbering. Surface
  Xero's validation error clearly and recommend a prefix in setup.
- **Silent disconnects** (refresh token expiry or user revoked in Xero). Covered by
  the keep-alive and `needs_reauth` plus an admin notification.
- **Desktop (Electron) OAuth return** lands on the hosted web app, not the desktop
  window. This matches Stripe today. A custom protocol handler would fix it later.
- **Certification lead time** may stop rollout past 5 orgs. Start early.
