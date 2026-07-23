# Data Platform — Phase 1 build spec

Foundation only: **start banking anonymized aggregates from every tenant (cloud + local),
with consent, disclosure, and a jurisdiction gate.** No products, no selling, no benchmark
surfacing yet — that's Phase 2. The goal of Phase 1 is: *stop losing data we can never get back,
legally and cheaply.*

Parent strategy: [DATA_PLATFORM_STRATEGY.md](DATA_PLATFORM_STRATEGY.md).

### Build status (2026-07-22)
| Ticket | Status | Files |
|---|---|---|
| 0 Flag | ✅ | `src/utils/flags.js` |
| 1 Consent | ✅ | `src/data/store.js` + Settings "Data & Privacy" tab in `src/pages/Settings.js` |
| 2 Table | ✅ | `supabase/migrations/007_contributed_metrics.sql` |
| 3 Metric module + PII test | ✅ | `src/utils/contribMetrics.js` (+ `.test.js`, 8/8) |
| 4 Local sync job | ✅ | `src/utils/contribSync.js`, wired in `src/main.js` |
| 5 Ingest function | ✅ | `supabase/functions/contrib-ingest/index.ts` |
| 6 Cloud cron | ✅ | `supabase/functions/contrib-aggregate-cloud/index.ts` |
| 7 Geo-gate | ✅ | `src/utils/jurisdiction.js` (+ `.test.js`) — onboarding soft-block UI still to wire |

**Phase 1 core complete and browser-verified** (flag dark by default; tab renders heading +
toggle + disclosure + region banner; toggle persists `enabled`/`consentedAt`/`consentVersion` via
store.saveSettings; metric engine runs with zero PII leaks at runtime). Remaining niceties:
first-run disclosure modal and the non-AU onboarding soft-block (Ticket 7 UI).

**Deploy notes (both functions need this):**
- `contrib-ingest`: deploy with `verify_jwt = false` (local clients are unauthenticated). Set
  `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (standard function env).
- `contrib-aggregate-cloud`: `verify_jwt = false`; set `CONTRIB_CRON_SECRET` and pass it as the
  `x-cron-secret` header; schedule weekly via Supabase cron / pg_cron.
- No `supabase/config.toml` exists in the repo, so set `verify_jwt` per-function via the
  dashboard or add a full config.toml when one is introduced.

**Why this is worth it:** data revenue is what subsidizes keeping RELAY free/cheap. Including
local users (not just paying cloud tenants) is the whole point — it's what makes the eventual
dataset big and dense enough to matter.

### Conventions this follows
- Built **dark** behind a `flags.js` flag; no visible entry points until flipped.
- Migrations numbered `NNN_*.sql` + matching `store.js` mapping **in the same commit**.
- Secrets only in **Supabase Edge Function secrets** (`Deno.env`), never client.
- Cloud gate = inline `companyId && !companyId.startsWith('acct_')`.
- One shared metric module so cloud and local compute **identical** aggregates.

---

## Ticket 0 — Feature flag
**File:** `src/utils/flags.js`
Add `contrib: on('relay_beta_contrib')` to `FLAGS`. Everything below is gated on it so 1.2.x
releases never leak this.

**Done when:** flag exists, defaults off, flippable via `localStorage`.

---

## Ticket 1 — Consent state + Settings toggle + disclosure
**Files:** `src/data/store.js` (settings shape), `src/pages/Settings.js`, migration (Ticket 2).

- Extend company settings with:
  ```js
  dataContribution: {
    enabled: true,           // AU opt-out default (resolved 2026-07-22); EU would flip to opt-in
    consentedAt: null,       // ISO timestamp when toggled on
    consentVersion: null,    // e.g. 'v1' — bump when disclosure text changes
  }
  ```
- Settings UI: a toggle in a new "Data & Privacy" section with plain-language copy —
  *"Contribute anonymized, aggregated industry statistics to help improve pricing and demand
  insights for all RELAY users. We send statistics only — never your customers' names,
  addresses, or job details. Turn off any time."* Link to the privacy policy section.
- **First-run disclosure**: surface the toggle + copy on first launch (or first launch after
  this ships) so it's never hidden.
- Writing the toggle stamps `consentedAt` + `consentVersion`.

**Done when:** toggle persists (cloud → Supabase settings, local → IndexedDB), disclosure shows
once, consent metadata recorded.

---

## Ticket 2 — `contributed_metrics` table + migration
**File:** `supabase/migrations/007_contributed_metrics.sql` (+ store.js mapping in same commit).

- Create the Layer-1 landing table (schema per strategy §2, Layer 1).
- **RLS:** tenants can **never** `select`/`update`/`delete` here; **insert only via the service
  role** (the ingest + cron functions). This table is write-only from the app's perspective.
- Index on `(metric_key, trade, region_bucket, period)` for Phase-2 aggregation.

**Done when:** migration applies cleanly, RLS blocks direct client access, service role can insert.

---

## Ticket 3 — Shared metric computation module  ⭐ centerpiece
**File:** `src/utils/contribMetrics.js`

A **pure function** `computeContributions(collections, { installId, source, country }) → rows[]`
used by **both** the local job and the cloud cron, guaranteeing identical output.

- Input: the tenant's `jobs, quotes, invoices, stock, settings, timesheets, leads, customers`
  (customers used **only** to resolve a coarse `region_bucket` from address → postcode/town, then
  discarded).
- Output: `contributed_metrics` rows for the Phase-1 metric set:
  - `labor_rate.standard|afterhours|emergency` (from `settings.laborRates`)
  - `job.value` (median/p25/p75 of invoice/quote totals) by trade+region+period
  - `job.count` by trade + priority
  - `material.margin` (sell vs cost from job materials / stock)
  - `job.duration_delta` (estimated vs actual hours, where linkable)
  - `quote.win_rate` (accepted / total)
- **PII firewall (unit-tested):** assert output rows contain **no** names, emails, phones, street
  addresses, tech names, or free-text. Region is bucketed to postcode/town only. Include a test
  that feeds seed data and fails if any PII string appears in the payload.
- Skip any cell with `value_count < 1`; carry `value_count` so Phase 2 can enforce k-anonymity.

**Done when:** module is pure, covered by tests (including the PII-leak test), and produces
identical rows given identical input regardless of `source`.

---

## Ticket 4 — Local contribution job (Electron client)
**Files:** `src/utils/contribSync.js`, wired into app launch (`src/main.js`).

- On launch: if `FLAGS.contrib` **and** consent enabled **and** jurisdiction allowed **and**
  cadence elapsed (last-run stored in `localStorage`, weekly/monthly — OPEN DECISION):
  1. read local IndexedDB collections,
  2. `computeContributions(..., { source: 'local' })`,
  3. POST the blob to the `contrib-ingest` function.
- **`installId`:** generate once, store in `localStorage` (`relay_install_id`), pseudonymous —
  never tied to identity. Used for dedupe + rate-limit only.
- Best-effort: on failure, don't advance last-run; retry next launch. Never block startup.

**Done when:** a consenting local install sends one valid blob per cadence, silently no-ops when
off/ineligible, and never crashes launch.

---

## Ticket 5 — `contrib-ingest` Edge Function (public endpoint)
**File:** `supabase/functions/contrib-ingest/index.ts`

- Accepts the local blob; validates `schemaVersion`, row shape, value ranges (reject impossible
  rates/negative counts/outliers), and `country` against the allowlist.
- **Rate-limit + dedupe by `installId`** (one submission per period per install).
- Inserts via **service role** into `contributed_metrics`. CORS + error handling per the
  `relay-geocode` pattern.

**Done when:** valid blobs land, malformed/poisoned/duplicate/out-of-region blobs are rejected
with clear status codes.

---

## Ticket 6 — `contrib-aggregate-cloud` Edge Function (scheduled)
**File:** `supabase/functions/contrib-aggregate-cloud/index.ts` + Supabase cron (weekly/monthly).

- For each **consenting** cloud tenant (`companyId && !startsWith('acct_')` and
  `dataContribution.enabled`), read their Supabase records, run the **same**
  `computeContributions(..., { source: 'cloud' })` logic, and insert into `contributed_metrics`.
- Idempotent per (tenant, period): re-running a period replaces, not duplicates.

**Done when:** the cron populates `contributed_metrics` for cloud tenants using the shared module,
skipping non-consenting ones.

---

## Ticket 7 — Jurisdiction / geo-gate
**Files:** `src/utils/jurisdiction.js`, onboarding (`src/pages/launch/LaunchScreen.js` / login),
`contrib-ingest` (Ticket 5).

- **Allowlist** of approved countries (start: `['AU']`; expand as cleared). Central constant.
- **Determine jurisdiction:** cloud → billing/settings country; local → coarse region signal
  (locale/timezone as a soft signal; refine later).
- **Two gates:**
  1. *Contribution gate:* only contribute if country ∈ allowlist (enforced client-side **and**
     server-side in `contrib-ingest`).
  2. *Onboarding gate (soft):* if outside allowlist, show "not yet available in your region"
     rather than a hard failure. **Flag-gated + behind legal sign-off** before enabling.

**Done when:** contribution only happens from allowlisted regions (belt-and-suspenders
client+server), and the onboarding gate exists behind the flag.

---

## Explicitly NOT in Phase 1
- `benchmark_cells` / k-anonymity publishing (Phase 2).
- Any in-app benchmarking UI or insights (Phase 2).
- Any external report/API/selling (Phase 3).
- Lead marketplace (later).

## Suggested build order
0 → 1 → 2 → 3 (with tests) → 5 → 4 → 6 → 7.
Ship 3 + its PII test before anything sends data anywhere.

## Resolved decisions (2026-07-22)
- **Launch region: AU first** — allowlist starts `['AU']`. Coherent with the existing AU-only
  geocoding filter, and AU's regime is permissive enough for de-identified aggregates that the
  opt-out default below is defensible.
- **Consent default: opt-out + prominent disclosure** — maximizes dataset to subsidize keeping
  the app cheap/free. Defensible *because* we geo-gate the EU out; EU (if ever added) flips to
  opt-in per-jurisdiction.
- **Cadence: weekly** — affects Ticket 4 last-run check.
- **k-threshold: deferred to Phase 2** (start at 5 when benchmark publishing lands).
