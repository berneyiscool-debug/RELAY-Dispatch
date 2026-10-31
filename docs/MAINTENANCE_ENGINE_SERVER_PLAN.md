# Maintenance engine on the server — plan

**Status:** proposal, not built. Needs sign-off for a new edge function deploy and a schedule on the live project.

## The problem

`checkMaintenancePlans()` (`src/utils/maintenanceEngine.js`) runs only in a browser that has Dispatch open: at startup, at noon and midnight while the tab stays open, and after asset or plan changes. A cloud business that doesn't open the app over a weekend gets no "Recurring Job Due" notifications, and plans set to create their job (#147) don't create it, until someone signs in. For a business relying on Dispatch to tell them test & tag is due, that's the failure that matters.

## What the engine does today

`raiseDueMaintenance(todayKey)` reads `maintenancePlans`, `assets`, `quotes`, `notifications` and `stock` from the store, then:

1. Picks active plans on in-service assets that are due: calendar plans within their lead time (`planLeadDays`), meter plans past their milestone. It skips any plan whose due date already has a notification, or whose meter milestone already has a Pending one.
2. Groups collision-merging plans per asset and builds one notification per group (`buildPlanNotification`).
3. Advances each plan (`advancePlan`).
4. Saves the notifications and plans, then converts the auto-create ones into jobs (`convertNotificationToJob`).

Steps 1–3 are pure apart from the store reads. Step 4 and the saves go through the browser store, which owns the cloud row shape: camelCase → snake_case, the `__meta__` blob jobs keep in `notes`, and job numbering via `store.getNextNumber('J-', 'jobs')`.

## Proposed design

### 1. Split the engine into a pure core and a store adapter (no behaviour change) — **done in this PR**
- **Core:** `planDueMaintenance({ plans, assets, quotes, notifications, stock }, todayKey, nowIso)` returns `{ notifications, planPatches: [{ id, patch }], autoConvert: [notificationId] }`. It takes no store and changes nothing passed in. It still mints notification ids and `createdAt` itself.
- **Store adapter:** `raiseDueMaintenance()` in the app is now a thin wrapper that applies the result to the store, exactly as before.
- **Tests:** the existing engine tests pass unchanged, and the core has direct tests (its decisions, untouched inputs, no repeats).

### 2. Share the row mapping with the server
The server must write rows exactly as the store would. Two options:
- **(a, preferred)** Move the denormalize/normalize rules for `notifications`, `maintenancePlans` and `jobs` (including the jobs `__meta__` packing) into a plain module with no imports. `store.js` and the edge function both import it. The KPI function's `rows.js` already does this for reads.
- **(b)** Port only what the engine writes into the function. That's quicker, but it's a second copy that will drift.

### 3. `maintenance-engine` edge function
- **Trigger:** a schedule, not a user. It authenticates with a shared secret (`x-cron-secret`), not a JWT. It reuses the existing `public.acquire_lock` / `release_lock` (migration 009), with `maintenance_engine` as the lock name, so browser runs and server runs never overlap.
- **For each company with active plans:** load that company's rows with the service key, scoped by `company_id`, the way `dashboard-kpis/index.ts` loads its tables. Run the pure core, then insert notifications, patch plans and create jobs.
- **Job numbers:** reserve the next `J-` number atomically. The current client-side `getNextNumber` reads the jobs it has cached, which is safe in one browser but not when a server and a browser can both create jobs. This needs a small `next_job_number(company_id)` SQL function, which is a migration.
- **Today:** work out the date in the company's time zone, via the same `wallClockDate` helper the KPI function uses. No company time zone is stored today: the dashboard sends the browser's own zone with each request. So either store one in company settings, captured from the browser when settings are saved, or default to `Australia/Sydney` as `dashboard-kpis` does. A business outside that zone could then see work raised a few hours early or late, which is harmless because due dates are whole days.

### 4. Schedule
pg_cron (`cron.schedule('maintenance-engine', '0 * * * *', …)`) calling the function hourly via `net.http_post`, or a Supabase scheduled function if available on the plan. Hourly is plenty: due dates are days and notifications are deduplicated.

### 5. Keep the browser run, as a fallback
The lock and the deduplication in step 1 make browser runs and server runs safe together. The browser run also covers local (non-cloud) accounts, which the server can't see.

## Order of work and sign-offs

| Step | Change | Sign-off needed |
| --- | --- | --- |
| 1 | Pure core + adapter | None (code only) — done |
| 2 | Shared row-mapping module | None (code only) |
| 3 | `next_job_number` SQL function | Migration on live |
| 4 | `maintenance-engine` edge function | Deploy + a secret |
| 5 | pg_cron schedule | Change on live |

Step 2 can land as a normal PR. Steps 3–5 are one small PR plus three live changes, best done together in the daytime with someone watching the first few runs.

## Risks
- **Double-raising** if the lock or dedup is wrong. The lock already exists. The engine tests cover dedup (a second run raises nothing) and should be run against the server path too.
- **Bad rows** if the server's mapping differs from the store's. That's the reason for option 2(a), with a parity test like `supabase/tests/dashboard-kpis.test.js`.
- **Job number collisions** without step 3.
