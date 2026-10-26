# Xero Phase 2a — Items ↔ stock

**Status (2026-10-27):** built on `feat/xero-items` with the proposed answers to
the open questions. One change from the draft: stock has no cost center, so item
sales details use the material lines account, not a category's cost center
account. How it behaves is written up in `XERO_SETUP.md` → "Stock as Xero Items".

The first piece of Phase 2 (`XERO_INTEGRATION_RESEARCH.md` §4). RELAY `stock`
rows become Xero **Items**, so material lines on pushed invoices carry an
`ItemCode` and Xero's sales-by-item reporting works. Purchase orders → bills
(Phase 2b) will reuse the same item links.

## What changes for the user

- Each stock item gets a Xero status (In Xero / Sync failed / Not in Xero),
  the same way invoices do.
- Material lines on invoices pushed to Xero show the item code in Xero.
- Accounting & Xero gains a **Send stock to Xero** backfill and an optional
  one-off **Import items from Xero**.

## Decisions (proposed)

1. **Untracked items only.** RELAY keeps owning quantities and locations. We push
   items as *untracked* (`IsTrackedAsInventory: false`), so Xero needs no
   inventory-asset account and doesn't fight RELAY over stock levels.
2. **RELAY → Xero is the main direction.** Saving a stock row queues an upsert of
   Code, Name, Description, and the sales and purchase details (price, account,
   tax type). Xero has no Items webhook, so changes made in Xero are only picked
   up by the one-off import.
3. **Item code:** `stock.sku` when it's set and fits (Xero: ≤ 30 chars, unique per
   org). Otherwise `RELAY-<first 8 of id>`. Store the code we used in
   `stock.xero_item_code` so a later SKU edit renames the item, not creates a new one.
4. **Matching, so we never duplicate:** a stored `xero_item_id`, then the code, then
   an exact case-insensitive name match. Create only if none match (same pattern as
   contacts).
5. **Name is clipped to 50 chars** (Xero's limit). The full name goes in Description.
6. **Accounts:** the sales account is the stock category's cost center account if
   it has one, otherwise the default sales account. The purchase account is a new
   **Default purchases account** setting (e.g. 300 Purchases). No purchase account
   means sales details only.
7. **Deletes:** deleting stock in RELAY leaves the Xero item alone, as with invoices.
8. **Scope:** Items use `accounting.settings`, which Phase 1 already asks for. Only
   connections still on `accounting.settings.read` need to reconnect, and the
   Accounting page already prompts for that.

## Gap found: invoice lines don't know their stock row

`src/actions/invoices.js:176` builds material lines from `job.materials` but drops
`stockId`, keeping only the description. So the mapper can't tell which item a line is.

- Fix: carry `stockId` onto material lines in `invoices.js`.
- In `_xero/mapping.js` (around line 260), add `ItemCode` when that stock row has a
  `xero_item_code`. We still send our own Description, UnitAmount and AccountCode,
  so the invoice keeps RELAY's numbers.
- Older invoices without `stockId` just go without an ItemCode.

## Build steps

1. **Migration** `2026110xxxxxxx_xero_items.sql`:
   - Add `xero_item_id`, `xero_item_code`, `xero_synced_at` and `xero_sync_error`
     to `stock`, server-write only like the invoice columns.
   - Add a `default_purchase_account_code` setting.
   - Add a stock trigger that queues `entity='stock', action='upsert'` for
     connected companies.
   - Add an `xero_enqueue_stock()` backfill RPC.
   - Add migration tests in `supabase/tests/`.
2. **Mapping:** add `buildItemPayload(stock, settings)` to `_xero/mapping.js`, and
   unit tests for code choice, clipping and accounts.
3. **Worker:** add a stock-upsert handler in `relay-xero-sync` (match, then
   create/update, then save the id and code). Invoice upserts first make sure the
   items they reference exist, the same way they do for contacts.
4. **Invoice lines:** add `stockId` on material lines, and `ItemCode` in the mapper.
5. **Import (optional):** `relay-xero-status { importItems }` pages `GET /Items`,
   links matches, and creates the missing stock rows (quantity 0) after a preview
   count. It's a one-off, so the call is cheap.
6. **UI:**
   - Add a Xero column and Retry to `StockList` / `StockDetail`.
   - Add the backfill and import buttons, plus the purchases-account picker, on
     Accounting & Xero.
7. **brny:** extend `get_xero_sync` to answer "is this item in Xero?".
8. **Docs:** add an Items section to `XERO_SETUP.md`.

## Open questions for Joshua

- Use SKU as the Xero item code when it's set? (Proposed: yes.)
- Build the import from Xero now or later? (Proposed: include it, since contact
  import will reuse the same pattern.)
- Do kits (`src/pages/kits`) become Xero items too, or only stock? (Proposed: stock
  only for now.)
