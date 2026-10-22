# Xero Integration — Setup

Tenants connect **their own** Xero organisation (AUD only) from
**Settings → Accounting & Xero**. The UI only appears when `FLAGS.xero` is on,
which is dev builds only until it has been tested against a live org. It's a
cloud-only tab. **Settings → Cost Centers** is a separate, plain tab for every
account type (local too); each cost center can carry an optional Xero account.

**Cost centers are Xero tracking options.** Every cost center becomes an option
with the same name in one tracking category ("Cost Center" unless the company
picks another on the Accounting page). The worker creates the category and any
missing option before the invoice that needs it, matches existing ones whatever
the case (using Xero's spelling), renames the option when the cost center is
renamed (it remembers `cost_centers.xero_tracking_option_id`), and restores an
archived option. A cost center can point at another existing option instead.
Xero's limits (two active categories, 100 options) are reported, never forced;
an invoice whose tracking can't be set still goes, untagged, with a note.
"Match with Xero now" (relay-xero-status `{ syncTracking }`) does it all up front.
Logic: `supabase/functions/_xero/tracking.js`.
Background: `XERO_INTEGRATION_RESEARCH.md`; build plan: `XERO_PHASE1_PLAN.md`.

## How it works (connect flow, built)

```
Settings → "Connect to Xero"
  → relay-xero-connect   (admin JWT) signs state {company, admin, return URL} → Xero consent URL
  → Xero login/consent   (admin ticks an organisation)
  → relay-xero-callback  (public redirect URI) verifies state, swaps code for tokens,
                          picks the org from this consent, checks AUD, stores
                          encrypted tokens → 302 back to Settings ?xero=<outcome>
Settings card
  → relay-xero-status    {} status · {selectTenant} · {accounts} · {disconnect} · {retry}
```

Several organisations ticked in one consent → `?xero=choose`, and the admin picks
one in Settings. The rest are disconnected so they don't count towards the app's
connection limit.

## Setup

1. **Register the app** at developer.xero.com → My Apps → New app:
   - Integration type: **Web app**.
   - Redirect URI: `https://<project-ref>.supabase.co/functions/v1/relay-xero-callback`.
   - Copy the client id and generate a client secret.
   - Stay on the **Starter** tier (free, 5 connections) for building and pilot.
   - Connect the **Demo Company (AU)** for testing.
2. **Apply the migrations** `supabase/migrations/20261020090000_xero_integration.sql`
   `20261022090000_xero_send_to_xero.sql` (the "Send to Xero" backfill RPC) and
   `20261023090000_xero_tracking_options.sql` (cost center → Xero option link).
   Scopes now include `accounting.settings` (write) so RELAY can create tracking.
   Connections made with the old `accounting.settings.read` keep working but can
   only match existing tracking; the Accounting page asks an admin to reconnect.
3. **Set the edge-function secrets:**

   | Secret | Value |
   |---|---|
   | `XERO_CLIENT_ID` / `XERO_CLIENT_SECRET` | from the Xero app |
   | `XERO_REDIRECT_URI` | exactly the redirect URI above |
   | `XERO_STATE_SECRET` | any long random string |
   | `XERO_TOKEN_KEY` | 32 random bytes, base64 (`openssl rand -base64 32`). **Changing it makes every stored connection undecryptable**, so tenants must reconnect. |
   | `RELAY_RETURN_ORIGINS` | optional, already used by payments: extra origins (preview deploys) allowed as return targets |

4. **Deploy the functions:**
   - `relay-xero-connect` and `relay-xero-status`, with verify_jwt **true**.
   - `relay-xero-callback`, with verify_jwt **false**. It's a browser redirect from
     Xero; trust comes from the signed state.

   There's no `supabase/config.toml`, so set verify_jwt per deploy, the same as
   `relay-create-payment`. The functions import `_xero/` and `_shared/`, which
   the CLI bundles.

## Sync worker (built, step 5)

`relay-xero-sync` drains `xero_sync_jobs`, which the invoice and customer
triggers fill. It handles five jobs:

- **Contact upsert:** finds the contact by `RELAY-<id>` number, then email, then
  name, and creates it only if none match.
- **Invoice upsert:** an AUTHORISED ACCREC with a "View source" link back to RELAY.
  The link is how a retry recognises RELAY's own invoice, so it never adopts
  someone else's invoice with the same number.
- **Invoice void.**
- **Invoice pay (step 6):** each payment recorded in RELAY becomes one Xero
  payment. That covers part-payments, the balance when an invoice is marked Paid,
  and Stripe payments, which go into the Stripe account if one is set. Each is
  saved to `xero_payment_ids` as soon as Xero accepts it, so it is never sent
  twice. If the invoice hasn't reached Xero yet, the payment waits with backoff.
- **Pull (step 6):** after a webhook, reads the invoice from Xero. Paid there means
  Paid in RELAY (`payment_method = 'Xero'`, the date from `FullyPaidOnDate`).
  Voided there is only flagged on the invoice, never auto-voided.

1. **Deploy** `relay-xero-sync` with verify_jwt **false**. It checks either the
   cron secret or a signed-in user's token itself. A user call syncs only that
   user's company (`nudgeXeroSync()` in `src/utils/xero.js`).
2. **Secret:** `XERO_CRON_SECRET`, any long random string.
3. **Schedule it every minute** with `pg_cron` + `pg_net`:
   - Enable both under Database → Extensions.
   - Store the secret in Vault rather than in SQL.
   - Run this once in the SQL editor:

   ```sql
   select vault.create_secret('<same value as XERO_CRON_SECRET>', 'xero_cron_secret');

   select cron.schedule('relay-xero-sync', '* * * * *', $$
     select net.http_post(
       url     := 'https://<project-ref>.supabase.co/functions/v1/relay-xero-sync',
       headers := jsonb_build_object(
         'Content-Type', 'application/json',
         'x-relay-cron', (select decrypted_secret from vault.decrypted_secrets where name = 'xero_cron_secret')
       ),
       body    := '{}'::jsonb,
       timeout_milliseconds := 55000
     );
   $$);
   ```

   This isn't in a migration because the schedule embeds the project URL and
   needs the Vault secret. To pause syncing everywhere, run
   `select cron.unschedule('relay-xero-sync');`.

**Throughput.** Each run spends up to 45 seconds claiming batches of up to 100
due jobs.

- Up to `XERO_SYNC_CONCURRENCY` companies (default 8, max 25) sync side by side.
- Each company's jobs run one at a time and in order. An organisation never sees
  more than one call in flight from a run, against Xero's limit of 5.
- **Pacing:** after each call the worker reads Xero's "calls remaining" headers.
  A company with 3 or fewer calls left this minute pauses for a minute. One with
  25 or fewer left today pauses for an hour. Either way its jobs go back to the
  queue without using up an attempt, and other companies carry on.

At roughly 0.3–0.7 s per Xero call, 8 lanes give about 700–1,600 calls a minute
app-wide. That's about 140–320 invoices a minute end to end, still well under
Xero's 10,000/min app limit. Raise `XERO_SYNC_CONCURRENCY` if the queue backs up.

A company with a large burst (a bulk "mark paid") keeps its lane busy for that
run. Other companies' newer jobs wait at most until the next batch or minute.

Scheduled runs also refresh up to 5 connections idle for 30+ days, because
refresh tokens die after 60 days unused.

Failures:

| What happened | What the worker does |
|---|---|
| Setup gap (no account) or a Xero validation error | Job **failed**. The message is saved to `invoices.xero_sync_error`, and Settings → "Retry failed" requeues it. |
| Rate limit, or nearly at it (pacing) | The company's remaining jobs go back to pending after `Retry-After`, or after 1 min / 1 h when pacing. No attempt is used up. |
| Revoked access | Connection goes to `needs_reauth`. Its jobs wait until an admin reconnects. |
| Anything else | Backoff of 1 min → 5 min → 30 min → 2 h → 12 h, then failed after 6 attempts. |

Invoice dates are worked out in `Australia/Sydney`. A company in another
time zone (e.g. Perth) can be a day out for invoices issued around midnight.
There's no company time-zone setting yet.

## Webhook (built, step 6)

Xero's webhooks only say *which* invoice changed. There's no payment event, so
a payment made in Xero arrives as an INVOICE update.

1. **Deploy** `relay-xero-webhook` with verify_jwt **false**. The signature is
   the authentication.
2. **In the Xero app:**
   - Go to Webhooks and set the delivery URL to
     `https://<project-ref>.supabase.co/functions/v1/relay-xero-webhook`.
   - Tick **Invoices**. Contacts can stay off, since Phase 1 ignores them.
   - Copy the **Webhooks key**.
3. **Secret:** set `XERO_WEBHOOK_KEY` to that key.
4. **Save** the webhook in Xero. That runs Xero's "intent to receive" check: the
   function must answer a correctly signed request with 200 and a wrongly signed
   one with 401, both with empty bodies and within 5 seconds. The status shows
   **OK** once it passes.

Each event queues a pull only for invoices RELAY pushed (`xero_enqueue_pulls`),
and nothing for the tenant's other Xero invoices. The next worker run, within a
minute, does the read. A database error answers 500, so Xero redelivers later.

## Notes

- **Tokens:** stored AES-GCM-encrypted and bound to the company id. Only the
  service role can read `xero_connections`. The browser sees the
  `relay-xero-status` payload only.
- **Desktop app:** the consent flow returns to the hosted web app, not the Electron
  window. Stripe Connect has the same limitation.
- **Switching organisations:** reconnecting to a different org clears the old org's
  invoice/contact links and skips queued work. Reconnecting the same org keeps them.
- **Disconnect:** removes the Xero connection, revokes the refresh token and skips
  queued work. Nothing already in Xero is changed.
- **Every push echoes:** Xero sends an INVOICE event for invoices and payments
  RELAY itself pushes. Each echo costs one small read, and the pull is a no-op.
- **In the app (step 7):**
  - The invoice list gets a **Xero** column once the company is connected:
    Syncing, In Xero, Paid in Xero, Sync failed (the reason is in the tooltip) or
    Not in Xero.
  - Each invoice shows a Xero row with "Open in Xero" and **Retry**.
  - Saving an invoice that Xero already holds a payment on asks first, because
    those edits stay in RELAY.
  - Every invoice or customer save asks the worker to sync now. That only
    happens for connected companies, with a 1.5-second debounce for bulk
    actions.
  - brny's `get_xero_sync` read answers "did INV-1042 go to Xero?" and "what's
    stuck?".
- **Known gaps:**
  - Invoices sent before Xero was connected show *Not in Xero* until someone
    clicks **Send to Xero** (Accounting & Xero → Needs attention, or the invoice
    list's bulk action). That queues them through `xero_enqueue_invoices`.
  - The invoice list's **Export for accounting** downloads a Xero import file
    (coded like the sync) or a plain spreadsheet. Xero imports can't record
    payments, so paid invoices still need their payment entered in Xero.
  - Deleting an invoice in RELAY doesn't touch Xero.
  - Credit notes (negative totals) are refused with a message to raise them in
    Xero.
