# Xero Integration — Research (Oct 2026)

Status: research only, nothing built. Cost Centers & Xero is still gated as
*Coming soon* (`src/components/Sidebar.js`, `DOCS.md`), and the plan is for it to
become cloud-only when it ships.

## 1. What already exists in RELAY

- `cost_centers` already has `xero_sales_account_code`, `xero_expense_account_code`,
  `xero_tracking_category_name`, `xero_tracking_option_name`
  (migration `004_xero_cost_center_mappings.sql`, mapped in `src/data/store.js`,
  seeded in `src/data/demoDataset.js`).
- **Stripe Connect is a good template** (`026_connect_payments.sql`,
  `docs/CONNECT_PAYMENTS_SETUP.md`): per-tenant external account, server-managed
  columns on `companies` frozen by `companies_billing_guard()`, edge functions plus
  one webhook. Xero needs the same shape: OAuth connect, token storage, a sync
  worker and a webhook.
- Invoices: `line_items` jsonb (sections → lineItems), `subtotal/tax/total`,
  AU GST at a flat `store.getTaxRate()` (10%), statuses Draft/Sent/Overdue/Paid/Void,
  `invoiceType` Deposit with credit lines on the final invoice.
- Payments: `record_invoice_payment` only handles **full** payment (`paidDate`,
  `paymentMethod`). Stripe Connect payments mark invoices Paid via webhook.
- Purchase orders (`purchase_orders`, supplier + line_items) could become Xero
  bills later.
- Timesheets / clock history (`time_clocks`, attendance approval) could feed
  Xero Payroll AU timesheets later.

## 2. Xero platform facts that shape the design

### Pricing (new model, live since 2 Mar 2026; AUD, ex-tax)

| Tier | Connections | Fee / month | Egress incl. | Rate limit |
|---|---|---|---|---|
| Starter | 5 | Free | n/a | 1,000 calls/day/org |
| Core | 50 | $35 | 10 GB | 5,000/day/org |
| Plus | 1,000 | $245 | 50 GB | 5,000/day/org |
| Advanced | 10,000 | $1,445 | 250 GB | 5,000/day/org |
| Enterprise | unlimited | POA | POA | 5,000/day/org |

- A **connection** is one connected Xero organisation (one RELAY company).
- **Egress** (reading data out of Xero) is metered; overage is $2.40/GB.
  **Ingress (writing into Xero) is unlimited.** So a push-first design (RELAY → Xero)
  is close to free. Bulk pulls (e.g. importing every contact/invoice) are what
  costs money.
- Paid tiers need app certification and an initial + annual security assessment.
  App Store listing is optional from Plus. The Journals endpoint is Advanced only,
  and we don't need it.
- Starter (5 orgs, free) is enough to build and pilot.

### Auth

- OAuth 2.0 authorization-code flow (a confidential server app, so it runs in a
  Supabase edge function, never the client). Access tokens last **30 min**.
  Refresh tokens need `offline_access` and expire after **60 days unused**; each
  refresh rotates the token.
  → Store tokens server-side only and refresh on a schedule so dormant tenants
  don't silently disconnect.
- One OAuth grant can cover several Xero orgs. Call `GET /connections` and save
  the chosen `tenantId`, which goes on every request as the `xero-tenant-id` header.
- **Granular scopes** are mandatory for apps created after 2 Mar 2026. Likely set:
  `openid profile email offline_access accounting.contacts accounting.invoices
  accounting.payments accounting.settings.read` (+ `accounting.attachments` if we
  push invoice PDFs). Payroll would add `payroll.employees payroll.timesheets
  payroll.settings`.

### Limits

- Per org: 60 calls/min, 5 concurrent, 5,000/day. App-wide: 10,000/min. HTTP 429
  with `Retry-After`; `X-DayLimit-Remaining` / `X-MinLimit-Remaining` headers.
- Invoices/contacts accept batches (one call can create many). Use
  `summarizeErrors=false` and an `Idempotency-Key` header so retries don't
  create duplicates.

### Webhooks

- Only covers **CONTACT, INVOICE, CREDITNOTE** (+ SUBSCRIPTION) CREATE/UPDATE.
  **There's no Payment event**. A payment shows up as an INVOICE UPDATE, so
  fetch the invoice and check `AmountDue` / `Status`.
- Payloads carry resource IDs only, so a follow-up GET is needed (small egress).
- Signed with `x-xero-signature` = base64 HMAC-SHA256 of the **raw** body with the
  webhook key. An "intent to receive" handshake requires 200 for valid / 401 for
  invalid, answered within a few seconds. Fits the `relay-stripe-webhook` pattern
  (verify the raw body first, then queue the work).

## 3. What competitors sync (FSM apps on Xero)

- **Fergus:** two-way invoices, contacts and payments; pushes supplier bills and
  credits; asks for account codes for materials/labour sales and wages.
- **ServiceM8:** approved invoices raised in Xero; clients and items sync both
  ways; payments sync.
- Neither syncs payroll timesheets. **Table stakes = contacts + invoices + payments
  back.**

## 4. Proposed scope, phased

**Phase 1: invoice push + paid-status pull (the MVP)**
1. Settings → Cost Centers & Xero: Connect / Disconnect, choose org, default
   sales account, GST tax type (`OUTPUT` / `EXEMPTOUTPUT`), invoice-number mode.
2. Contact sync on demand: when an invoice is pushed, upsert its customer as a
   Xero Contact. Store `xero_contact_id` on customers. Match existing contacts by
   name/email first to avoid duplicates.
3. Invoice push when status leaves Draft (Sent): create an `ACCREC` invoice as
   `AUTHORISED`, `LineAmountTypes` Exclusive. Each line gets an `AccountCode` and a
   Tracking option from the job's cost center (already modelled). Store
   `xero_invoice_id`, `xero_synced_at`, `xero_sync_error`.
4. Void → `VOIDED` in Xero (only allowed while there are no payments).
5. Payments:
   - RELAY → Xero: when a payment is recorded (manual or Stripe), `PUT /Payments`
     against a configured bank/clearing account.
   - Xero → RELAY: INVOICE UPDATE webhook. If `Status = PAID`, mark Paid and set
     `paymentMethod: 'Xero'`.
6. Sync log / retry queue table, plus a "Not synced" badge on invoices.

**Phase 2:** items (`stock` ↔ Xero Items), purchase orders → `ACCPAY` bills or
Xero Purchase Orders, contact import from Xero (one-off, mind the egress), partial
payments (needs a RELAY data-model change).

**Phase 3:** approved clock history → Xero Payroll AU timesheets (needs employee
+ earnings-rate mapping per person and a payroll calendar; separate scopes).

## 5. Design decisions and open questions

- **Invoice numbering:** does RELAY own numbers (push `InvoiceNumber`) or does
  Xero (read it back)? Recommend RELAY owns them, which needs "Xero auto-numbering"
  off or a distinct prefix.
- **Source of truth after push:** recommend RELAY owns invoice content and Xero owns
  payment status. Edits in RELAY after push update the Xero invoice only while it
  has no payments, and are blocked once Xero has a payment.
- **Deposits / credit lines:** RELAY puts deposit credits on the final invoice as
  negative lines. Xero accepts negative lines as long as the invoice total is ≥ 0,
  but the cleaner Xero way is a prepayment or credit note allocation. Decide which
  approach before building.
- **Tax:** RELAY uses a flat 10% computed client-side. Xero recalculates GST per line,
  so rounding can differ by cents. Send `TaxAmount` per line or accept Xero's
  numbers and write them back.
- **Local-mode users:** cloud-only, as `DOCS.md` already says. OAuth tokens can't
  live in IndexedDB safely.
- **Multi-currency / non-AU orgs:** out of scope for v1. Read `Organisation.BaseCurrency`
  and block if it isn't AUD.
- **Stripe overlap:** a Stripe-paid invoice must create exactly one Xero Payment.
  Key it on the Stripe session id so it's idempotent.
- **Tier economics:** free to 5 tenants, then $35/mo to 50 and $245/mo to 1,000.
  Certification is required before leaving Starter, and the process reportedly
  takes months, so start it early.

## 6. Suggested build shape (Supabase)

- Migration: `xero_connections` (company_id, tenant_id, tenant_name, encrypted
  refresh token, access token + expiry, scopes, connected_by, status), server-write
  only like the Connect columns. Add `xero_*_id` + sync-status columns on customers,
  invoices and payments. Add a `xero_sync_jobs` queue/log table.
- Edge functions: `relay-xero-connect` (start OAuth), `relay-xero-callback`
  (exchange code, pick tenant), `relay-xero-sync` (drain queue, rate-limit aware),
  `relay-xero-webhook` (verify HMAC, enqueue), plus a scheduled token refresh.
- Secrets: `XERO_CLIENT_ID`, `XERO_CLIENT_SECRET`, `XERO_WEBHOOK_KEY`,
  `XERO_REDIRECT_URI`. The public repo has no build-time secrets, which works here
  because everything Xero-related stays server-side.
- Use raw `fetch` in Deno rather than `xero-node` (a Node SDK, heavy for edge functions).

## Sources

- [Xero Developer — Pricing](https://developer.xero.com/pricing)
- [Xero — Pricing & policy FAQ](https://developer.xero.com/faq/pricing-and-policy-updates)
- [Xero — API limits FAQ](https://developer.xero.com/faq/limits)
- [Xero — Auth code flow](https://developer.xero.com/documentation/guides/oauth2/auth-flow/)
- [Xero — Scopes](https://developer.xero.com/documentation/guides/oauth2/scopes/) / [Granular scopes FAQ](https://developer.xero.com/faq/granular-scopes)
- [Xero — Developer Platform commercial terms](https://developer.xero.com/xero-developer-platform-commercial-terms)
- [Apideck — Xero scopes changes](https://www.apideck.com/blog/xero-scopes)
- [Hookdeck — Guide to Xero webhooks](https://hookdeck.com/webhooks/platforms/guide-to-xero-webhooks-features-and-best-practices)
- [Truto — Xero API pricing changes 2026](https://truto.one/blog/xero-api-pricing-changes-2026-costs-tiers-and-how-to-minimize-egress/)
- [Fergus — Xero integration](https://help.fergus.com/en/articles/10593481-xero-integration)
- [ServiceM8 on the Xero App Store](https://apps.xero.com/ph/collection/field-service-management-integrations/app/servicem8)

Caveat: Xero's docs pages render client-side and couldn't all be read directly.
Scope names, webhook timing and the certification timeline come partly from
third-party guides. Confirm them in the Xero developer portal when the app is
registered.
