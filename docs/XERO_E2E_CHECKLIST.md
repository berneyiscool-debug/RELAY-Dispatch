# Xero Phase 1 — Demo Company end-to-end test

Run this once against the **Xero Demo Company (AU)** before Phase 2 builds on it.
Live state on 2026-10-26: all five `relay-xero-*` functions on v9, the
`relay-xero-sync` cron runs every minute, and **no organisation has ever been
connected** (`xero_connections` is empty).

Tick each step, and note anything that looks wrong next to it. Claude can watch
`xero_sync_jobs`, `xero_connections` and the function logs while you go.

## 0. Before you start

- [ ] In Xero (my.xero.com), open the org menu → **Demo Company (AU)**. It resets
      every 28 days, and resetting gives it a new tenant id. If it resets mid-test,
      reconnect.
- [ ] In developer.xero.com → your app: the redirect URI is exactly
      `https://zufsncswsoqlomtqhkks.supabase.co/functions/v1/relay-xero-callback`.
- [ ] Webhooks in the app: delivery URL is `.../functions/v1/relay-xero-webhook`,
      **Invoices** ticked, status **OK** ("intent to receive" passed).
- [ ] `npm run dev` and sign in as an **admin of a cloud company** (the Xero tab
      is cloud-only and dev-only, `FLAGS.xero`).

## 1. Connect

- [ ] Settings → **Accounting & Xero** → **Connect to Xero**. Tick only the Demo
      Company.
- [ ] You land back in Settings with a "connected" message, and the card shows
      the Demo Company name.
- [ ] Pick the sales account (e.g. **200 Sales**), the payment account (e.g.
      **090 Business Bank Account**) and GST **OUTPUT**. Save.
- [ ] **Match with Xero now.** A "Cost Center" tracking category with one option
      per cost center appears in Xero (Accounting → Advanced → Tracking categories).

## 2. Push an invoice

- [ ] Create a new customer with an email address.
- [ ] Create a job for them with a cost center, at least one labour line and one
      material line, and raise an invoice.
- [ ] Mark the invoice **Sent**. Within about a minute the Xero column says
      **In Xero**.
- [ ] **Open in Xero**, then check:
  - [ ] the contact is the new customer (not a duplicate), with contact number `RELAY-…`
  - [ ] the invoice number matches RELAY's
  - [ ] the lines, quantities and prices match, and GST is 10%
  - [ ] the total matches RELAY's to the cent (note any cent difference)
  - [ ] each line has the right Cost Center tracking
  - [ ] the "View source" link opens the invoice in RELAY

## 3. Payments

- [ ] In RELAY, record a **part payment** (e.g. $50). It appears against the
      invoice in Xero within a minute.
- [ ] In **Xero**, pay the remaining balance. Within a minute or two RELAY shows
      the invoice **Paid**, payment method **Xero**.
- [ ] Optional: pay an invoice through the Stripe link. Exactly one payment
      appears in Xero.

## 4. Edits and voids

- [ ] Push a second invoice, then edit a line in RELAY while it's unpaid. Xero updates.
- [ ] Void that invoice in RELAY. It shows **Voided** in Xero.
- [ ] Try to edit the paid invoice from step 3. RELAY asks before saving, and Xero
      stays unchanged.

## 5. Edge cases

- [ ] **Deposit:** an invoice with a negative deposit line (total still ≥ 0) goes
      through with the negative line.
- [ ] **Failure path:** remove the default sales account (or use a cost center with
      a bad account code) and send an invoice. It shows **Sync failed** with a
      readable reason. Fix the setting, click **Retry**, and it goes through.
- [ ] **Backfill:** an invoice sent *before* connecting shows **Not in Xero**.
      **Send to Xero** pushes it.

## 6. Stock as Xero items (Phase 2a)

Needs the `20261027090000_xero_items.sql` migration and the redeployed
`relay-xero-sync` / `relay-xero-status`.

- [ ] Choose a **Purchases account** (e.g. 300 Purchases) on Accounting & Xero. Save.
- [ ] **Import items from Xero.** The confirm shows how many Demo Company items
      will be linked and added. Confirm, and the new stock appears with quantity 0.
- [ ] Add a stock item with a SKU. Within a minute the stock list's Xero column
      says **In Xero**, and the item is in Xero (Products and services) with that
      code, untracked, with sales and purchase prices.
- [ ] Change its SKU and price. The same Xero item updates; no second item.
- [ ] Use that item as a job material, invoice the job and send it. The invoice
      line in Xero shows the item code and RELAY's price.
- [ ] Change only the quantity. Nothing new is queued (the Xero column stays
      **In Xero**).

## 7. Disconnect and reconnect

- [ ] **Disconnect.** The card shows disconnected, and nothing changes in Xero.
- [ ] Reconnect the **same** Demo Company. Existing invoices still show **In Xero**
      (the links are kept).

## Results

| Step | Pass / fail | Notes |
|---|---|---|
| 1 Connect | | |
| 2 Push | | |
| 3 Payments | | |
| 4 Edits / voids | | |
| 5 Edge cases | | |
| 6 Stock items | | |
| 7 Reconnect | | |

When everything passes, `FLAGS.xero` can be turned on for release builds.
