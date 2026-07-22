# RELAY Dispatch — Data Platform Strategy

How RELAY turns the operational data flowing through the app into (1) a product that makes
every user's business more successful, and (2) a sellable industry-intelligence asset —
without breaking privacy law or giving away our own competitive edge.

> **Status:** strategy / design. Not yet built. This is the planning artifact that the
> schema migrations, edge functions, and UI work will be cut from.
>
> **Not legal advice.** Sections 6–7 describe an architecture built to *support* compliance.
> The actual consent wording, privacy policy, and jurisdiction list must be signed off by a
> qualified privacy lawyer before launch in any region.

---

## Guiding principles

1. **Aggregates travel, PII stays home.** Nothing identifying a business's *customers*
   (names, addresses, contacts, notes) ever leaves the tenant. We compute statistics locally
   and move only the statistics.
2. **Users benefit before we do.** The data first makes the user's own business more
   successful (Section 3). Selling (Section 4) is downstream of that and never at the user's
   expense.
3. **Consent + disclosure are non-negotiable.** A visible toggle and plain-language
   disclosure keep this in "normal free-app telemetry" territory, not "scandal" territory.
4. **Keep the moat, sell the commodity.** User data is, by proxy, *our* strategic asset.
   We keep in-house whatever makes RELAY uniquely valuable and only sell what's commoditizable
   (Section 5).
5. **Geo-fenced by design.** We only operate where we've cleared the privacy regime
   (Section 6). Everywhere else is blocked, not risked.

---

## 1. Unified data collection — cloud AND local

Both tenant types contribute to **one** anonymized dataset. The only difference is *where the
aggregation runs*.

### 1a. Cloud tenants (data already on our infrastructure)
- Their operational records already live in Supabase.
- A scheduled **Edge Function** (`contrib-aggregate-cloud`, cron weekly/monthly) reads each
  consenting cloud tenant's records, computes the standard metric set (Section 2), strips PII,
  and writes rows into `contributed_metrics`.
- No client involvement; runs server-side on our schedule.

### 1b. Local / offline tenants (data only on their device)
Local data lives in on-device IndexedDB and never syncs to Supabase — so **we aggregate it on
the client and push only the aggregates up.** The app is Electron, so the client can reach the
internet even though its data store is local.

**Local contribution job:**
1. Runs in the Electron app on a schedule (on launch if the cadence has elapsed, e.g. weekly/monthly).
2. Reads local IndexedDB, computes the **same** metric set as the cloud path.
3. Strips all PII at the source — region is bucketed to postcode/town, no names/addresses/contacts/notes.
4. POSTs a small aggregate blob to a public **ingest Edge Function** (`contrib-ingest`), which
   validates shape + version and appends to `contributed_metrics`.
5. Gated by the consent toggle. Off → the job never runs.
6. Best-effort: offline → retry next launch. Cadence tolerates gaps.

**Why include local users:** it multiplies dataset size and regional density — the exact thing
that gates whether benchmark cells clear the k-anonymity threshold and become sellable. Excluding
free users would leave most of the market (and most regions) too thin to use.

### 1c. Anti-abuse (public ingest endpoint)
A public endpoint can be poisoned with fake aggregates. Mitigations:
- Per-install **pseudonymous key** (a random `installId`, not tied to identity) for dedupe + rate-limiting.
- Server-side **shape + range validation** (reject impossible rates, negative counts, outliers).
- Payload **`schemaVersion`** so old clients keep contributing cleanly as metrics evolve.
- Optional later: app attestation / signed builds.

---

## 2. The databases (detailed)

A layered warehouse. Each layer is a separate concern; raw PII never climbs past Layer 0.

### Layer 0 — Tenant operational data (exists today)
Cloud: Supabase per-tenant tables. Local: on-device IndexedDB (`RelayDispatchDB_acct_*`).
**Source of truth. Contains PII. Never leaves the tenant except as Layer-1 aggregates.**

### Layer 1 — `contributed_metrics` (raw contributions)
Append-only landing table. One row per (tenant/install, metric, region-bucket, period).

```
contributed_metrics
------------------------------------------------------------
  id                uuid pk
  install_id        text          -- pseudonymous; NOT tenant identity
  source            text          -- 'cloud' | 'local'
  schema_version    int
  metric_key        text          -- e.g. 'labor_rate.standard', 'job.duration_delta'
  trade             text          -- Electrical | Solar | HVAC | ...
  region_bucket     text          -- postcode or town; coarsened, never street
  period            text          -- 'YYYY-MM'
  value_count       int           -- how many underlying records fed this metric
  value_median      numeric
  value_p25         numeric
  value_p75         numeric
  value_sum         numeric        -- only where sums are non-identifying
  country           text          -- ISO; for jurisdiction routing
  submitted_at      timestamptz
------------------------------------------------------------
  NO customer names, addresses, contacts, tech names, or free-text. Ever.
```

### Layer 2 — `normalized_metrics` (cleaned)
Scheduled job dedupes (same install re-submitting a period), rejects outliers/poisoned rows,
normalizes trade/region taxonomies. Still per-contributor, still no PII.

### Layer 3 — `benchmark_cells` (aggregated + k-anonymity enforced)
The **only** layer any product or buyer ever reads. A cell is published *only if it was
computed from ≥ N distinct contributors* (start N=5, tune later).

```
benchmark_cells
------------------------------------------------------------
  id                uuid pk
  metric_key        text
  trade             text
  region_bucket     text
  period            text
  contributor_count int           -- MUST be >= k_threshold to be exposed
  median            numeric
  p25 / p75 / p90   numeric
  yoy_change        numeric
  computed_at       timestamptz
------------------------------------------------------------
  Thin cells (contributor_count < k) are computed but flagged hidden.
```

### Layer 4 — `data_products` (published)
Snapshots/exports cut from Layer 3 for a specific purpose: the in-app benchmarking feed,
a quarterly report export, or a licensed API partner's slice. Versioned and access-controlled.

---

## 3. In-house value first — making the ecosystem successful

Before a cent is sold externally, the accumulated data pays for itself by making users more
successful. This is also the flywheel: better insights → users stay/contribute → dataset grows
→ insights improve. Concrete features, all reading Layer 3:

- **Pricing intelligence** — "Your standard rate ($145/hr) sits in the 25th percentile for
  electrical in your region; peers median $168. You may be undercharging by ~14%." Directly
  grows the user's revenue → strongest possible retention hook.
- **Estimate accuracy coaching** — "Your solar jobs run 22% over estimate; regional median is
  8%. The gap is concentrated in inverter swaps." Fewer blown quotes.
- **Win-rate benchmarking** — "Your quote acceptance is 31% vs 44% top-quartile." Pair with
  pricing to diagnose why.
- **Demand & seasonality forecasting** — "HVAC callouts in your region spike 3 weeks out
  (heatwave pattern). Staff up." Helps them capture demand competitors miss.
- **Parts sourcing signals** — "Battery 12V 100Ah is 18% cheaper via peer suppliers in your
  area." Margin help.
- **Maintenance-due / installed-base intelligence** — anonymized asset population + service
  intervals → smarter recurring-revenue prompts.

Positioning: this is a **cloud-tier feature**. That makes the data value itself a reason for
free/local users to upgrade — turning "we collect from everyone" into "everyone has a reason to
pay." (This complements, not replaces, keeping local mode free and functional.)

---

## 4. Selling the data (external)

Only Layer 3/4, only above k-threshold, only what Section 5 classifies as sellable.

- **Quarterly Trades Pricing & Demand Index** — report sold to suppliers, manufacturers,
  insurers, franchises, market researchers. Cheapest to produce; tests buyer appetite first.
- **Licensed data API / feed** — anonymized regional demand + pricing for parts suppliers
  (forecasting), insurers (repair-cost benchmarks — big budgets), PE/roll-ups (market sizing).
- **Lead marketplace** — later; higher consent bar (consumer PII would actually move), needs
  regional density first.

Sequencing: **Section 3 ships first** (builds the dataset + proves value), then the report,
then the API, then any marketplace.

---

## 5. Keep-in-house vs sellable — classification framework

Core insight (user's point 7): **user data is by proxy our own strategic asset.** Selling the
wrong slice arms competitors or commoditizes RELAY's edge. So every metric is classified:

| Test | → KEEP IN HOUSE | → SELLABLE |
|---|---|---|
| Does exposing it make RELAY *less* uniquely valuable? | Yes → keep | No |
| Would a competitor gain from buying it? | Yes → keep | No |
| Is it a commodity stat outsiders already estimate crudely? | — | Yes → sell |
| Does an external buyer (supplier/insurer) value it more than our users do? | — | Yes → sell |

**Provisional split (revisit as the strategy matures):**
- **Keep (moat):** granular pricing-percentile + estimate-accuracy + win-rate intelligence.
  This is what makes the in-app product sticky and is our differentiator — do **not** sell it raw.
- **Sell (commodity):** coarse regional demand volumes, seasonality curves, parts-price indices,
  installed-base counts by equipment type — valuable to outside buyers, low erosion of our edge.

Rule of thumb: **sell derived, coarse, outward-facing stats; keep the fine-grained,
decision-driving intelligence as product.**

---

## 6. Privacy law, jurisdiction & geo-gating

We operate **only** in regions whose privacy regime we've cleared; everywhere else is blocked to
cap liability (user's point 4).

- **Launch allowlist.** Maintain an explicit list of approved countries/regions (e.g. AU first,
  then others as cleared). Regimes to design for: **GDPR** (EU/UK), **CCPA/CPRA** (California),
  **Australian Privacy Act / APPs**, plus per-country specifics.
- **Location check.** Determine a tenant's jurisdiction (billing country for cloud; a coarse
  region signal for local) and:
  - route contribution + consent rules to that jurisdiction's requirements;
  - **block onboarding** from outside the allowlist (soft-block with a "not yet available in your
    region" message rather than a hard fail).
- **Data residency.** Some regimes require in-region storage — factor into where `contributed_*`
  tables live as we expand.
- **Deletion / access rights.** GDPR/CCPA grant users deletion + access rights. Because Layer 1
  keys on `install_id`, we can honor "delete my contributions" without ever having stored PII.
- **k-anonymity threshold** (Section 2, Layer 3) is itself a compliance control: it prevents
  re-identification via thin cells.

> Legal counsel signs off the allowlist, the per-region consent text, and the residency plan
> before any launch.

---

## 7. Disclosure & consent

The single step that keeps this legitimate.

- **Consent toggle** in Settings: "Contribute anonymized, aggregated industry statistics." Clear
  copy on exactly what is/isn't sent ("statistics only — never your customers' names, addresses,
  or job details"). Default state (on vs off) is an open decision below — opt-out is the free-app
  norm and maximizes dataset size; opt-in is safest and a trust selling point.
- **Privacy policy section** describing the contribution, the categories of aggregate data, the
  purposes (product improvement + industry benchmarks), and how to opt out.
- **First-run disclosure** surfacing the toggle so it's never "hidden."
- **Transparency page** (optional, strong trust play): "here's the anonymized benchmark data your
  contribution helps build" — users see they get value back.

---

## Phasing

1. **Foundation** — consent toggle + disclosure, `contributed_metrics` schema, the cloud
   aggregate cron and local contribution job, jurisdiction/geo-gate. (Start banking data.)
2. **In-house value** — Layer 3 benchmark cells + the Section 3 features as a cloud tier.
   (Prove value, drive upgrades.)
3. **Sell** — quarterly report from Layer 4, then licensed API. (Once density clears k-threshold.)
4. **Marketplace** — later, once regional density + consumer-consent design are ready.

## Open decisions

- Consent **default**: opt-out (bigger dataset) vs opt-in (safer/trust).
- **k-threshold** starting value (proposed 5) and how it varies by region density.
- First **launch region(s)** and the initial allowlist.
- Benchmarking as a **new top tier** vs an **add-on** to existing cloud tier.
- Which exact metrics land in **keep** vs **sell** (Section 5) at launch.
- Contribution **cadence** (weekly vs monthly) for local clients.
