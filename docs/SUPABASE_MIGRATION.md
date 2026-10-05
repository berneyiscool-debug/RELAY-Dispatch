# Relay — Supabase Migration Plan

Status: **planning** · Approach: **data-first (auth added later)** · Backend: **Supabase** · Host: **Netlify**

---

## 1. Strategy in one paragraph

Every piece of app data already flows through a single module — `src/data/store.js` — which today reads/writes `localStorage`. We migrate by **rewriting only that module** to talk to Supabase. The rest of the app (all pages, the dashboard, portals) keeps calling `store.getAll('jobs')`, `store.create(...)`, etc., unchanged. We do **data first**: move the data + turn RLS on with permissive test policies, keep the current "pick a user" login, and add real Supabase Auth afterward.

---

## 2. The one hard problem: sync → async

`store.js` is **synchronous** today — pages call `store.getAll('jobs')` and render immediately. Supabase is **async** (network). We do **NOT** want to rewrite every page to `await`.

**Solution — in-memory cache, hydrated once on boot:**

1. On app start, `await store.hydrate()` loads every collection from Supabase into an in-memory map (one query per table, or a few).
2. `getAll()` / `getById()` read from that in-memory cache → **stay synchronous**, pages don't change.
3. `create()` / `update()` / `delete()` update the cache **immediately** (optimistic) **and** fire the Supabase write in the background; on error, roll back + toast.
4. The existing `emit()` pub/sub still fires, so reactive UI keeps working.
5. (Optional, later) subscribe to Supabase **Realtime** so other users' changes update the cache live.

Boot sequence change in `main.js`: show a tiny splash/loader, `await store.hydrate()`, then render the app.

> The cascade logic inside `store.update()` (asset service logs, maintenance-plan timer sync on job completion) stays in `store.js` for now. **Later** it can become Postgres triggers/functions, but keep it in JS during the migration to avoid changing behaviour.

---

## 3. Connection setup (first code step)

1. Supabase dashboard → **Settings → API** → copy **Project URL** + **anon public** key.
2. `npm install @supabase/supabase-js`
3. Add to `.env` (Vite exposes `VITE_`-prefixed vars to the client; the anon key is *meant* to be public — RLS protects the data):
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
4. `src/data/supabaseClient.js`:
   ```js
   import { createClient } from '@supabase/supabase-js';
   export const supabase = createClient(
     import.meta.env.VITE_SUPABASE_URL,
     import.meta.env.VITE_SUPABASE_ANON_KEY
   );
   ```
5. On **Netlify**, set the same two env vars in Site settings → Environment.
6. **Never** put the `service_role` key in the frontend — it bypasses RLS. It lives only in a Netlify Function (used later for the Relay assistant / admin tasks).

---

## 4. Schema

### Conventions
- **Column names stay camelCase** (quoted in SQL) so Supabase rows map **1:1** to the app's existing objects — no key-translation layer, minimal app change. (snake_case is the "cleaner long-term" option but costs a mapping layer; not worth it for the migration.)
- **`id` is `text`** (not uuid) so existing string ids like `cust_1`, `job_001` migrate without rewiring every foreign reference. New rows can default to a uuid string.
- JSON-ish fields (line items, tasks, logs, permissions, etc.) → **`jsonb`**.
- Money → `numeric(12,2)`. Timestamps → `timestamptz`. Plain dates → `date`.
- **Multi-tenancy:** the app is single-company today (Apex Power Services). For real multi-company sign-ups later, we add `"orgId" text` to every table + RLS by org. **Decision needed before real auth** — for now everything is one shared dataset.

### Tables (20)

| Table | Key columns (→ FK) | jsonb fields |
|---|---|---|
| **customers** | id, company, firstName, lastName, email, phone, address, status, type, portalToken | — |
| **contractors** | id, businessName, contactName, email, phone, licenseNumber, active(bool), hourlyRate, afterHoursRate, calloutFee, notes, portalToken | specialties, complianceDocs |
| **suppliers** | id, name, contactName, email, phone, address, category, accountNumber, paymentTerms, active(bool), notes | attachments |
| **technicians** | id, name, role, color, payRate, email, phone, userTypeId → userTypes | — |
| **userTypes** | id, name, description | permissions |
| **leads** | id, number, title, customerId → customers, customerName, contactName, status, source, value, description, priority | — |
| **quotes** | id, number, customerId → customers, customerName, contactName, title, status, subtotal, tax, total, validUntil(date), notes | lineItems |
| **jobs** | id, number, customerId → customers, customerName, contactName, siteAddress, title, type, status, priority, technicianId → technicians, technicianName, quoteId → quotes, assetId → assets, scheduledDate(date), estimatedHours, laborCost, materialCost, notes | tasks |
| **invoices** | id, number, jobId → jobs, jobNumber, customerId → customers, customerName, contactName, status, subtotal, tax, total, invoiceType, issueDate(date), dueDate(date), paidDate(date), notes | lineItems |
| **assets** | id, name, type, serial, ownerType, customerId → customers, customerName, currentMeter, recoveryRate, status | logs |
| **maintenancePlans** | id, name, assetId → assets, triggerType, frequency, meterInterval, lastTriggeredMeter, nextServiceDate(date), status, priority, collisionMerging(bool) | — |
| **stock** | id, name, category, unit, costPrice, unitPrice, reorderLevel, quantity, supplier | locations |
| **kits** | id, name, description, category, totalCost, totalPrice, itemCount, active(bool) | items |
| **purchaseOrders** | id, number, supplierId → suppliers, supplierName, issueDate(date), status, total | lineItems |
| **timesheets** | id, technicianId → technicians, jobId → jobs, date(date), description, hours, status | — |
| **schedule** | id, jobId → jobs, jobNumber, title, technicianId → technicians, technicianName, color, dayOffset, startHour, endHour, customerName, siteAddress | — |
| **notifications** | id, number, type, title, description, priority, status, assetId → assets, jobId → jobs, link, read(bool) | — |
| **formTemplates** | id, name, description | sections |
| **formInstances** | id, templateId → formTemplates, jobId → jobs, status | data |
| **taskTemplates** | id, name, description | tags, tasks |
| **settings** | single row (id='default'): name, abn, phone, email, domain, address, website, logo | materialMarkup, materialCategories, laborRates, documentTheme |

> Denormalised fields (`customerName`, `technicianName`, `jobNumber`, …) are **kept** — the app reads them everywhere, so keeping them avoids client-side joins. They're snapshots; acceptable for this app.

### Runnable DDL (Supabase SQL editor)

```sql
-- Helper: updatedAt auto-touch
create or replace function touch_updated_at() returns trigger as $$
begin new."updatedAt" = now(); return new; end; $$ language plpgsql;

-- ---------- core parties ----------
create table customers (
  id text primary key default gen_random_uuid()::text,
  company text, "firstName" text, "lastName" text,
  email text, phone text, address text,
  status text, type text, "portalToken" text,
  "createdAt" timestamptz default now(), "updatedAt" timestamptz default now()
);
create table contractors (
  id text primary key default gen_random_uuid()::text,
  "businessName" text, "contactName" text, email text, phone text,
  "licenseNumber" text, active boolean default true,
  "hourlyRate" numeric(12,2), "afterHoursRate" numeric(12,2), "calloutFee" numeric(12,2),
  specialties jsonb default '[]', notes text, "portalToken" text,
  "complianceDocs" jsonb default '[]',
  "createdAt" timestamptz default now(), "updatedAt" timestamptz default now()
);
create table suppliers (
  id text primary key default gen_random_uuid()::text,
  name text, "contactName" text, email text, phone text, address text,
  category text, "accountNumber" text, "paymentTerms" text,
  active boolean default true, notes text, attachments jsonb default '[]',
  "createdAt" timestamptz default now(), "updatedAt" timestamptz default now()
);

-- ---------- users & permissions ----------
create table "userTypes" (
  id text primary key default gen_random_uuid()::text,
  name text, description text, permissions jsonb default '[]'
);
create table technicians (
  id text primary key default gen_random_uuid()::text,
  name text, role text, color text, "payRate" numeric(12,2),
  email text, phone text,
  "userTypeId" text references "userTypes"(id) on delete set null,
  deactivated boolean default false
);

-- ---------- assets & maintenance ----------
create table assets (
  id text primary key default gen_random_uuid()::text,
  name text, type text, serial text, "ownerType" text,
  "customerId" text references customers(id) on delete set null,
  "customerName" text, "currentMeter" numeric, "recoveryRate" numeric,
  status text, logs jsonb default '[]',
  "createdAt" timestamptz default now(), "updatedAt" timestamptz default now()
);
create table "maintenancePlans" (
  id text primary key default gen_random_uuid()::text,
  name text, "assetId" text references assets(id) on delete cascade,
  "triggerType" text, frequency text, "meterInterval" numeric,
  "lastTriggeredMeter" numeric, "nextServiceDate" date,
  status text, priority text, "collisionMerging" boolean default true
);

-- ---------- workflow ----------
create table leads (
  id text primary key default gen_random_uuid()::text,
  number text, title text,
  "customerId" text references customers(id) on delete set null,
  "customerName" text, "contactName" text, status text, source text,
  value numeric(12,2), description text, priority text,
  "createdAt" timestamptz default now(), "updatedAt" timestamptz default now()
);
create table quotes (
  id text primary key default gen_random_uuid()::text,
  number text, "customerId" text references customers(id) on delete set null,
  "customerName" text, "contactName" text, title text, status text,
  "lineItems" jsonb default '[]', subtotal numeric(12,2), tax numeric(12,2), total numeric(12,2),
  "validUntil" date, notes text,
  "createdAt" timestamptz default now(), "updatedAt" timestamptz default now()
);
create table jobs (
  id text primary key default gen_random_uuid()::text,
  number text, "customerId" text references customers(id) on delete set null,
  "customerName" text, "contactName" text, "siteAddress" text,
  title text, type text, status text, priority text,
  "technicianId" text references technicians(id) on delete set null, "technicianName" text,
  "quoteId" text references quotes(id) on delete set null,
  "assetId" text references assets(id) on delete set null,
  "contractorId" text references contractors(id) on delete set null,
  "scheduledDate" date, "estimatedHours" numeric, "laborCost" numeric(12,2), "materialCost" numeric(12,2),
  tasks jsonb default '[]', notes text,
  "maintenancePlanId" text, "mergedPlanIds" jsonb default '[]',
  "createdAt" timestamptz default now(), "updatedAt" timestamptz default now()
);
create table invoices (
  id text primary key default gen_random_uuid()::text,
  number text, "jobId" text references jobs(id) on delete set null, "jobNumber" text,
  "customerId" text references customers(id) on delete set null,
  "customerName" text, "contactName" text, status text,
  "lineItems" jsonb default '[]', subtotal numeric(12,2), tax numeric(12,2), total numeric(12,2),
  "invoiceType" text, "issueDate" date, "dueDate" date, "paidDate" date, notes text,
  "createdAt" timestamptz default now(), "updatedAt" timestamptz default now()
);

-- ---------- resources ----------
create table stock (
  id text primary key default gen_random_uuid()::text,
  name text, category text, unit text,
  "costPrice" numeric(12,2), "unitPrice" numeric(12,2),
  "reorderLevel" numeric, quantity numeric, locations jsonb default '[]', supplier text
);
create table kits (
  id text primary key default gen_random_uuid()::text,
  name text, description text, category text, items jsonb default '[]',
  "totalCost" numeric(12,2), "totalPrice" numeric(12,2), "itemCount" int, active boolean default true,
  "createdAt" timestamptz default now(), "updatedAt" timestamptz default now()
);
create table "purchaseOrders" (
  id text primary key default gen_random_uuid()::text,
  number text, "supplierId" text references suppliers(id) on delete set null, "supplierName" text,
  "issueDate" date, status text, total numeric(12,2), "lineItems" jsonb default '[]',
  "createdAt" timestamptz default now()
);
create table timesheets (
  id text primary key default gen_random_uuid()::text,
  "technicianId" text references technicians(id) on delete set null, "technicianName" text,
  "jobId" text references jobs(id) on delete set null, "jobNumber" text,
  date date, description text, hours numeric, status text,
  "createdAt" timestamptz default now()
);

-- ---------- scheduling / comms / forms ----------
create table schedule (
  id text primary key default gen_random_uuid()::text,
  "jobId" text references jobs(id) on delete cascade, "jobNumber" text, title text,
  "technicianId" text references technicians(id) on delete set null, "technicianName" text,
  color text, "dayOffset" int, "startHour" numeric, "endHour" numeric,
  "customerName" text, "siteAddress" text
);
create table notifications (
  id text primary key default gen_random_uuid()::text,
  number text, type text, title text, description text, priority text, status text,
  "assetId" text references assets(id) on delete set null,
  "jobId" text references jobs(id) on delete set null, link text, read boolean default false,
  "createdAt" timestamptz default now()
);
create table "formTemplates" (
  id text primary key default gen_random_uuid()::text,
  name text, description text, sections jsonb default '[]'
);
create table "formInstances" (
  id text primary key default gen_random_uuid()::text,
  "templateId" text references "formTemplates"(id) on delete set null,
  "jobId" text references jobs(id) on delete set null, status text, data jsonb default '{}',
  "createdAt" timestamptz default now()
);
create table "taskTemplates" (
  id text primary key default gen_random_uuid()::text,
  name text, description text, tags jsonb default '[]', tasks jsonb default '[]'
);
create table settings (
  id text primary key default 'default',
  name text, abn text, phone text, email text, domain text, address text, website text, logo text,
  "materialMarkup" jsonb, "materialCategories" jsonb, "laborRates" jsonb, "documentTheme" jsonb
);

-- updatedAt triggers (on the tables that have it)
do $$ declare t text;
begin
  foreach t in array array['customers','contractors','suppliers','assets','leads','quotes','jobs','invoices','kits'] loop
    execute format('create trigger trg_%1$s_touch before update on %1$I for each row execute function touch_updated_at();', t);
  end loop;
end $$;

-- helpful indexes
create index on jobs ("customerId"); create index on jobs (status);
create index on invoices ("customerId"); create index on invoices (status);
create index on quotes ("customerId"); create index on assets ("customerId");
create index on schedule ("technicianId"); create index on "maintenancePlans" ("assetId");
```

---

## 5. RLS (data-first / testing phase)

Turn RLS **on** for every table, then add **permissive policies** so the app works during testing. Tighten to real per-user/per-org policies when we add Supabase Auth.

```sql
-- enable RLS on all tables, then allow authenticated users full access (testing only)
do $$ declare t record;
begin
  for t in select tablename from pg_tables where schemaname='public' loop
    execute format('alter table %I enable row level security;', t.tablename);
    execute format($f$create policy "auth all" on %I for all to authenticated using (true) with check (true);$f$, t.tablename);
  end loop;
end $$;
```

> ⚠️ `to authenticated` means a user must be signed in (even anonymously) to read/write. For the very first wiring test you *can* use `to anon` instead, but switch to `authenticated` before any public demo. **Never** ship `to anon` with write access publicly.
>
> **Real policies (later, with auth + `orgId`):** e.g. `using (auth.uid() = "ownerId")` for staff data, and a separate path for the **portal tokens** (customer/contractor portals authenticate by `portalToken`, not Supabase Auth — likely served through a Netlify Function using the service_role key, scoped to that token's rows).

---

## 6. `store.js` rewrite (keep the public API)

Keep every method signature identical so pages don't change: `getAll`, `getById`, `save`, `create`, `update`, `delete`, `getSettings`, `saveSettings`, `on/off/emit`, `isSeeded`, `clearAll`. Add one new method: `hydrate()`.

```js
// pseudocode
class DataStore {
  cache = {};                 // { jobs: [...], customers: [...], ... }
  async hydrate() {
    const tables = ['customers','contractors',/* ...all... */];
    await Promise.all(tables.map(async t => {
      const { data } = await supabase.from(t).select('*');
      this.cache[t] = data || [];
    }));
    const { data: s } = await supabase.from('settings').select('*').eq('id','default').single();
    this.cache.settings = s;
  }
  getAll(c){ return this.cache[c] || []; }          // sync, from cache
  getById(c,id){ return (this.cache[c]||[]).find(x=>x.id===id) || null; }
  create(c,item){
    item.id ||= crypto.randomUUID();
    item.createdAt ||= new Date().toISOString(); item.updatedAt = item.createdAt;
    this.cache[c] = [...(this.cache[c]||[]), item];   // optimistic
    this.emit(c, this.cache[c]);
    supabase.from(c).insert(item).then(({error})=>{ if(error) this._rollback(c, item, 'insert'); });
    return item;
  }
  update(c,id,updates){ /* update cache + emit + supabase.update().eq('id',id); keep the asset/plan cascade logic */ }
  delete(c,id){ /* filter cache + emit + supabase.delete().eq('id',id) */ }
}
```

- `main.js`: `await store.hydrate()` before first render (small loader meanwhile).
- Keep the cascade logic in `update()` exactly as-is (it just writes to more tables via the same `update`/`save`).
- Errors → roll back the optimistic cache change + `showToast(... 'error')`.

---

## 7. Seeding Supabase

Two options:
- **A. One-time export:** run a snippet in the app to dump current `localStorage` collections to JSON, then bulk-insert via the SQL editor or a small Node script using the service_role key. *Good to preserve the curated Apex Power Services demo data.*
- **B. Re-seed from `seed.js`:** point the existing seeder at `store.create()` after the store is Supabase-backed (it'll write to Supabase). Simplest, but regenerates ids.

Recommend **A** to keep the polished demo dataset intact.

---

## 8. Migration order (checklist)

1. [ ] Create Supabase tables (Section 4 DDL).
2. [ ] Enable RLS + testing policies (Section 5).
3. [ ] `npm i @supabase/supabase-js`; add env vars + `supabaseClient.js` (Section 3).
4. [ ] Seed data into Supabase (Section 7, option A).
5. [ ] Rewrite `store.js` with cache + `hydrate()` (Section 6) — **the big step**.
6. [ ] `await store.hydrate()` in `main.js` boot.
7. [ ] Smoke-test every page (reads) + create/edit/delete (writes) across one of each record.
8. [ ] Deploy to Netlify with env vars; verify against the live Supabase project.
9. [ ] **Later:** Supabase Auth (email/pw sign-up) → real RLS policies + `orgId` → portal-token path via Netlify Function → Realtime subscriptions → move cascade logic to DB triggers.

**Already-live project?** Steps 1–8 describe the original one-time cutover. Since then, incremental migrations `002`–`028` were applied ad-hoc and some never landed (`014`, `019`, and the tail of `015`), leaving the live schema behind the repo. `supabase/migrations/029_schema_catchup.sql` repairs that drift: it is idempotent and purely additive, so paste it into the Supabase SQL editor and confirm its final verification query reports `is_present = true` for every row.

**Is the live project closed to the internet?** Not until `supabase/migrations/030_rls_hardening.sql` is applied. Probing the live project with a throwaway account showed that the published anon key could read *and* write every tenant table, and that `mailer_autoconfirm: true` let anyone self-register — so a stranger could sign up, write a `profiles` row with `role = 'admin'` and a victim's `company_id`, and take over that tenant. `030` is also idempotent: it enables RLS on every `public` table, drops **every** pre-existing policy (Postgres ORs policies together, so a single survivor would undo the fix), rebuilds the canonical tenant policies, and applies the signup-trigger / profile-guard hardening first written in `020` that never landed. Apply `029` first, then `030`, and read the audit grid it prints last — every row must read `ok` or `LOCKED (service role only)`.

**Is one tenant able to burn the shared AI/Maps budget?** Not once `supabase/migrations/031_spend_and_signup_hardening.sql` is applied (after `029` and `030`). It adds `public.api_usage` — a service-role-only ledger of what each tenant spent on the paid proxies — which `relay-copilot`, `relay-geocode` and `relay-route` now read before every paid call and write after every successful one, the same pattern `relay-email` has used since launch. It also replaces `handle_new_user_profile()` without the self-signup branch that trusted `raw_user_meta_data->>'company_name'`: client-writable metadata could mint a company plus an admin profile without passing through `create_company_and_admin()`, the only path that checks `auth.uid() = user_id`. No shipped flow sends that key (the launch screen and the Settings cloud upgrade both call the RPC), so the branch was deleted rather than guarded. Its verification grid must report `ok` on every row; see Section 11 for the caps themselves.

**Did the portal PINs survive a reload?** They did not, and the fix is `supabase/migrations/032_portal_passcode.sql`. Customers and contractors unlock their portals with a 4–6 digit PIN set on first visit, but no `portal_passcode` column existed, so `store.denormalizeRecord()` — which drops every key not listed in `TABLE_COLUMNS` — silently stripped `portalPasscode` from each cloud payload. The write reported success while the PIN vanished, so every visit re-prompted for setup. `032` adds a nullable `portal_passcode text` column to `public.customers` and `public.contractors` (idempotent, purely additive); the matching whitelist and `portal_passcode` ↔ `portalPasscode` mappings now live in `src/data/store.js`. Clearing the column (the admin **Reset PIN** button) is what makes the *next* visit show the first-visit setup form again.

**Can one seat spend the whole team's AI allowance?** Not once `supabase/migrations/034_ai_pooled_caps.sql` is applied (after `031`). The AI budget was a flat 500 requests/day per company, so a single runaway chat could use up the team's entire day and the ledger could not say who spent it. `034` adds a nullable `api_usage.user_id` plus the `(user_id, kind, created_at DESC)` index that reads it, and `relay-copilot` now enforces a pooled per-company allowance **and** a ceiling for the seat that is calling. Nothing else moves: the ledger stays service-role only, still with RLS enabled and no client policy, and the Maps/email proxies keep their flat per-tenant caps.

**Run the migrations locally before pasting them.** These files are treated as one implicit transaction by the SQL editor, so a single failing statement silently rolls back the whole script. `npm run test:migrations` executes `029`, `030`, `031`, `032`, `033` and `034` against an in-memory Postgres (`@electric-sql/pglite`) with a two-tenant Supabase-shaped fixture and asserts the security outcome — signed-out clients read nothing, tenants cannot see or re-point another tenant's rows, a public signup cannot provision itself a company, and the audit grid reports no failures. The same command runs `supabase/tests/proxy-caps.test.js`, which statically asserts that each paid proxy counts a tenant's spend *before* calling the provider, and `supabase/tests/ai-limits.test.js`, which exercises the pooled allowance maths (pool sizes, the per-user ceiling, and the Sydney reset across a daylight-saving change) against the real module the function imports. Run it after any change to a migration or to an edge function that spends money.

---

## 9. Risks & gotchas

- **Sync→async** is the only real architectural change — handled by the cache (Section 2). Don't skip the boot `await hydrate()`.
- **camelCase columns must be quoted** in all SQL. supabase-js returns them correctly without quoting.
- **Denormalised name fields** can drift (rename a customer → old jobs keep the old name). Acceptable now; a DB trigger can sync later.
- **Portals** authenticate by `portalToken`, not Supabase Auth — needs the Netlify-Function path, don't expose all rows to anon. The `portal_passcode` column added in `032` is read/written on the same connection, so portals still only work under a staff session (or local mode) until that function exists.
- **`store.js` silently drops unmapped columns**: `denormalizeRecord()` deletes every key that is not listed in `TABLE_COLUMNS[collection]`, while local (IndexedDB) mode stores the whole record — so a missing whitelist entry looks like a cloud-only write failure that reports success. `portalPasscode` was lost this way; adding a DB column now means updating the migration, `TABLE_COLUMNS`, and the `normalizeRecord`/`denormalizeRecord` mappings.
- **`service_role` key**: server-side only, never in the frontend bundle.
- **RLS policies are additive (`OR`)**: adding a policy never revokes another one. To tighten access you must `DROP` the old policy — this is why `030` sweeps `pg_policies` before creating anything.
- **Client-side writes to `profiles` are not possible once `030` is applied** (RLS has no INSERT policy, and `profiles_security_guard` rejects self-provisioned rows). Staff profiles must be created by signup or by the `invite-user` edge function, which uses the service-role key.
- **Client-side deletes of `profiles` do nothing once `030` is applied** (there is deliberately no DELETE policy). RLS makes the statement a silent 0-row no-op rather than an error, so a client `delete()` would report success without removing anything. Removing a staff member is `profiles.deactivated` (what the Settings page already does); a genuine row delete stays a service-role/dashboard operation.
- **`company_id` is not always `uuid`**: the live `job_materials.company_id` is `text` (the table predates migration `013`, which declares `uuid`). Any policy that compares it directly to `get_user_company_id()` fails with `operator does not exist: text = uuid` and rolls the entire script back, so `030`'s catalog loop reads each column's real type with `format_type()` and casts to `text` when it is not `uuid`. Keep that branch when editing the loop.
- **`raw_user_meta_data` provisions nothing once `031` is applied.** Signup metadata is client-writable, so the signup trigger reads only `raw_app_meta_data` (server-written invitations). Self-signup must call the `create_company_and_admin` RPC — passing `company_name` in `signUp({ options: { data } })` creates the auth user but **no** company and **no** profile.
- **`api_usage` is invisible to clients by design** (`031`): RLS on with zero policies, and `ALL` revoked from `anon`/`authenticated`. Only the edge functions, which hold the service-role key, may read or write it. `034` adds `user_id` to that same ledger without touching any of it — a new column on a locked table needs no new policy, so do not "helpfully" add one. `user_id` is deliberately not a foreign key (neither is `company_id`, same table, same reason): a ledger row records what was spent, and must not disappear or block when a profile is deleted.
- Do the `store.js` swap **carefully / coordinated** — it's the spine of the app and the Antigravity agents also touch the codebase.

---

## 10. Live verification (applied 2026-09-27)

`029` and `030` were both applied to the live project (ref `zufsncswsoqlomtqhkks`) and the result was verified from outside with the published anon key and with a throwaway two-tenant account. Everything below was observed, not inferred.

| Probe | Result |
| --- | --- |
| Anon reads tenant rows (32 tables, `select=*`) | 0 rows anywhere |
| Anon writes (8 representative tables, row echoed back) | 8/8 refused — none reached INSERT |
| Anon executes `security-definer` helpers | all refused |
| Anon reads `relay_reserved_email_slugs` | 0 rows |
| Signed-in tenant reads own profile / company | works (1 row each) |
| Signed-in tenant reads another tenant's profiles / jobs | 0 rows |
| Signed-in tenant reads another tenant's `job_materials` (text key) | 0 rows |
| Signed-in tenant re-points own row at another `company_id` | refused `403` |
| Signed-in tenant rewrites `role` / `pay_rate` on own profile | frozen — values unchanged |
| Signed-in tenant updates a non-frozen profile field (`name`) | works |
| Signed-in tenant self-provisions a `profiles` row | refused `400 P0001` (guard trigger) |
| Signed-in tenant deletes a profile | 0 rows affected, row survives |
| Signed-in tenant runs `acquire_lock` / `release_lock` | works |
| Every table the app reads while signed in (33 tables) | all `200` |
| App writes: insert/update/read a customer, job and job material, then delete | all succeed |

Two regressions the hardening would have caused were found and fixed before launch:

- `store.js` `seedDefaultTechnicians()` wrote demo `profiles` rows from the client. `030` now rejects that (`400 P0001`), so the function early-returned unless the tenant was a local `acct_` account — cloud tenants get real profiles from signup or `invite-user`. (Local mode is single-user now and no longer seeds demo staff, so the function has since been removed entirely.)
- Migration `013` declares `job_materials.company_id uuid` while the live column is `text`; see the gotcha in Section 9.

---

## 11. Abuse controls on the paid APIs (031, 034)

Launch allows self-serve signup, so every caller of a paid API is capped. Geocoding, routing and email are capped **per tenant**; the AI is capped **per tenant and per seat**, because one person burning the team's whole day was the failure mode that mattered. The caps are edge-function secrets: change the value in the Supabase dashboard and the next invocation picks it up, no client release needed. The defaults are deliberately generous for a small trade business — a busy technician will not reach them — while still bounding what one account can spend of a budget that every tenant shares.

**The AI allowance is a pool, with a ceiling per seat** (`034`). A company's daily pool is `max(RELAY_AI_POOL_FLOOR, seats × per-seat)`, where seats are the Stripe-synced `companies.subscription_seats` when present and a live `company_active_seat_count()` otherwise (never less than 1). Every user in the company draws from that one pool, but no single user may spend more than the per-user ceiling, so one runaway chat cannot use up the team's day.

| Secret | Cloud | Cloud+ | What it bounds |
| --- | --- | --- | --- |
| `RELAY_AI_POOL_PER_SEAT` / `RELAY_AI_POOL_PER_SEAT_PLUS` | 50 | 75 | calls per seat, added to the company pool |
| `RELAY_AI_POOL_FLOOR` | 150 | 150 | calls per day, the minimum pool for a 1–2 seat company |
| `RELAY_AI_USER_CAP` / `RELAY_AI_USER_CAP_PLUS` | 150 | 200 | calls one user may spend of the pool per day |

The dual columns are two independent secrets, not one secret with two names: the tier decides which of the pair is read, so setting the un-suffixed key against a Cloud+ company is a no-op. Check `comp_tier` before arming a cap (Section 12).

All five were also **set explicitly in production on 2026-10-04** (`50 / 75 / 150 / 150 / 200`) even though every one of them already equalled the built-in default. Nothing changed and no redeploy followed — the point was to make the live allowance legible under **Edge Functions → Secrets**, because an unset secret and a secret that matches the default are indistinguishable there. `relay-copilot` reads a missing secret as the default, so the two are also indistinguishable in behaviour; the dashboard copy is what makes the answer to "what is this company allowed?" a URL rather than a code read.

The remaining proxies keep the flat per-tenant cap they were launched with:

| Proxy | Provider | Secret | Default | Unit |
| --- | --- | --- | --- | --- |
| `relay-copilot` | DeepSeek | — (see the pooled table above) | | calls |
| `relay-geocode` | Google Maps | `RELAY_GEOCODE_DAILY_CAP` | 1000 | addresses (a 50-address batch costs 50) |
| `relay-route` | Google Routes | `RELAY_ROUTE_DAILY_CAP` | 300 | routes |
| `relay-email` | Resend | `RELAY_EMAIL_DAILY_CAP` | 500 | emails |

How it behaves:

- **The day is the Sydney day, not the UTC day.** brny's customers are Australian and no company records a timezone, so the window is hard-coded to `Australia/Sydney` and the allowance comes back at local midnight — 10am UTC in winter, 11am UTC in summer. A UTC-midnight reset would hand the allowance back mid-morning.
- **At the cap** `relay-copilot` answers `429` with a structured body — `{ error, code: "ai_daily_limit", scope: "user" | "company", remainingMessages, resetsAt }`. brny renders the reset instant in the *reader's* local time, so an interstate or overseas user is told when their own allowance returns rather than a Sydney time they have to convert. `error` carries the same sentence with a Sydney timestamp, which is what a client that predates this change shows.
- **The two refusals mean different things.** `scope: "user"` names the personal ceiling and, when the team still has room, says how many messages are left; `scope: "company"` means the pool is gone and nobody in that company can send until the reset.
- **Allowance is quoted in messages; the ledger counts calls.** A chat turn is usually two calls (the reply, then the follow-up lookup/action turn), so `remainingMessages` is units ÷ 2.
- **The tier is read from the company row** (`comp_tier`, `subscription_tier`, or the legacy `settings.ai.tier`), never from the request, so a Cloud tenant cannot ask for the Cloud+ pool. Only the `settings.ai.tier` key is selected out of the settings document — the rest of it can hold an uploaded logo.
- **Unit accounting is per address/stops-request** for the Maps proxies, so one batch cannot spend the whole day's allowance in a single round trip. The Maps and email proxies keep their flat `429` copy (`Daily … limit reached (N). Try again tomorrow or contact RELAY support.`), and geocoding and routing degrade to "no result", exactly like any other provider failure, so background backfills stay quiet.
- **Failed provider calls are not charged** — the ledger row is written only after the provider answers successfully.
- **A missing secret never disables the cap**: an unset or unparsable value falls back to the default above.
- **If `031` has not been applied yet**, the proxies log `api_usage read failed` and run uncapped rather than break for every user. The cap is protection, not a hard dependency — which is why the functions can be deployed before the migration.
- `api_usage` grows one row per paid call. It is tiny (a few hundred rows per tenant per day); prune rows older than a few months with `pg_cron` once there is any reason to.

Dashboard-only items this migration deliberately does **not** change, because they are launch decisions rather than code:

- **CAPTCHA (Turnstile) on signup, `mailer_autoconfirm`, and per-IP signup rate limits.** A probe with the published anon key confirmed that signups are unthrottled and auto-confirmed (`disable_signup` is `false` by design — launch needs self-serve signup). Turning on Turnstile or per-IP limits is an Auth setting in the dashboard; the tenant-isolation work in `030` is what makes unthrottled signup survivable in the meantime: a spam tenant can only ever see its own empty workspace.
- **Paid tiers for the AI.** Out of scope until the launch feature set is settled. Usage *metering* has since shipped (Section 11a), but it only reports the allowance — nothing bills against it yet.

### 11a. The usage meters (`?action=usage`)

The Deputy panel and **Settings → Plan & Billing** each draw two bars — the reader's own allowance and the company's — and both read them from `relay-copilot` itself:

```
POST /functions/v1/relay-copilot?action=usage
Authorization: Bearer <user token>
{}

{ "available": true, "resetsAt": "2026-10-04T13:00:00.000Z",
  "blocked": null, "seats": 2,
  "user":    { "usedUnits": 51, "limitUnits": 200, "remainingUnits": 149,
               "usedMessages": 25, "limitMessages": 100, "remainingMessages": 74, "percent": 26 },
  "company": { "usedUnits": 51, "limitUnits": 150, "remainingUnits": 99,
               "usedMessages": 25, "limitMessages": 75,  "remainingMessages": 49, "percent": 34 } }
```

Why it lives on `relay-copilot` instead of a `relay-usage` function: it reuses the same auth chain, the same `limits.js`, the same tier and seat resolution and the same `usageToday` read, so **the bars cannot disagree with enforcement.** A second function would be a copy of ~150 lines of security-critical code that would quietly drift, and a bar that is wrong is worse than no bar at all.

- **The read path is a query parameter, not a body field.** `index.ts` parses the JSON body exactly once, *after* the allowance check; marking the request in the body would force the parse to move earlier and would change what happens to malformed JSON today. A query parameter costs nothing and needs no `Access-Control-Allow-Headers` change.
- **The branch sits behind the same Bearer check as everything else.** The anon key gets the usual `401 {"error":"Unauthorized: invalid token"}` whether or not `?action=usage` is present, so nothing about the allowance is public.
- **It is read-only and un-ledgered** — no provider call, no `recordUsage` — so asking about the allowance never spends any of it. That is what makes it safe for the client to call on every panel open and every Settings render.
- **`percent` is computed in units, not messages.** Units ÷ 2 is a floor, so converting to messages first would round a one-unit cap to a permanent `0%`. `percent` uses `Math.round` (the first call of the day reads `1%`) and clamps to 100.
- **`blocked`** is `null`, `"user"` or `"company"`, and the remainders come from the same `evaluateLimits` call that would allow or refuse the next message. The meters are not independent subtraction over the same rows.
- **`available: false` with `reason: "ledger_unavailable"`** means the ledger could not be read — which also means nothing is being capped. The client renders nothing rather than a reassuring `0%`, and a client with no snapshot hides its host container entirely.
- **`usedMessages` is a floor**, so an allowance worth less than one message reports `0` and the client falls back to quoting AI credits instead of messages.

`resetsAt` is the Sydney reset instant; the client renders it in the *reader's* local time, the same as the `429` copy. The renderer is `src/components/UsageBars.js` (mounted into any element carrying `data-usage-bars`, so both hosts share one implementation) and the styles live in `src/styles/components.css`: green, amber from 80%, red at 100%. Non-cloud workspaces get no snapshot at all, so the bars simply do not appear there.

---

## 12. Deploying an edge function

Every function in `supabase/functions/` is self-contained and uses URL imports (`esm.sh`) rather than npm, so deploying one is usually a copy-paste in the dashboard: no local bundler, no Docker, no CLI. **`relay-copilot` is now the one exception** — it imports `./limits.js`, because the allowance maths (pool size, per-user ceiling, the Sydney day window) is worth testing directly rather than only through the proxy. The dashboard editor holds one file, so deploy that function with the CLI (Section 12a) and keep the two files together.

1. Dashboard → the project → **Edge Functions** → pick the function, e.g. `relay-geocode`.
2. Select everything in the editor, delete it, and paste the whole local `index.ts`.
3. **Deploy**. The header shows the version timestamp once it is live.
4. Leave **Enforce JWT verification** on for every function except two: `relay-create-payment` (public by design, authorises by invoice id) and `relay-stripe-webhook` (verifies Stripe's HMAC signature itself).

Secrets live under **Edge Functions → Secrets** and are read per-invocation, so changing `RELAY_AI_POOL_PER_SEAT` (or any other cap) takes effect on the next call with no redeploy. A quick smoke test after deploying: calling the function with only the anon key must answer `401`.

To prove a cap actually bites, set its secret to `1` temporarily — the first call passes and is ledgered, the second answers `429` — then set it back. `1` is the smallest usable value: a zero or unparsable secret falls back to the documented default rather than disabling the cap, which is deliberate, so `0` does nothing.

**Check the tenant's tier before arming anything.** Every allowance secret has a `_PLUS` twin, and the function picks between them from the company row (`comp_tier` / `subscription_tier` / `settings.ai.tier`), so **a Cloud+ tenant never reads the un-suffixed secret**. Setting `RELAY_AI_USER_CAP=1` against a Cloud+ company changes nothing at all, which looks exactly like a broken cap. Read the tier first:

```
npx --yes supabase@2.119.0 db query "select c.name, c.comp_tier, c.subscription_tier, c.settings->'ai'->>'tier' as settings_ai_tier, company_active_seat_count(c.id) as seats from companies c" --linked --agent no --output-format text
```

`settings->'ai'->>'tier'` is the same value the function reads: over PostgREST it appears as an alias (`ai_tier:settings->ai->tier`), which is why `select … c.ai_tier` fails against the database with `column c.ai_tier does not exist`.

With the tier known, `relay-copilot` reads several allowance secrets at once, so the quickest way to see each refusal is: set `RELAY_AI_USER_CAP=1` (`_PLUS` for a Cloud+ tenant) to hit the personal ceiling — the second call from that seat gets `scope: "user"`, while a teammate still gets through — or set `RELAY_AI_POOL_PER_SEAT=1` and `RELAY_AI_POOL_FLOOR=1` (again `_PLUS` twins where relevant) to shrink the whole company's pool to a single call and get `scope: "company"`. Either flip is a Management API call, not a code change, so the secret takes effect on the next invocation with no redeploy:

```
npx --yes supabase@2.119.0 secrets set RELAY_AI_USER_CAP=1 --project-ref zufsncswsoqlomtqhkks --agent no --output-format text
npx --yes supabase@2.119.0 secrets unset RELAY_AI_USER_CAP --project-ref zufsncswsoqlomtqhkks --agent no --output-format text
```

Cheaper still, and what was actually used on 2026-10-02: insert the remaining units straight into `api_usage` for a throwaway tenant and call again. No secret is touched, and the real ceiling is the one being tested.

**Reading the ledger, and where the allowance is visible.** `supabase link` needs no database password and is enough to unlock read-only SQL against the project, which is how a smoke test is diagnosed without guessing:

```
npx --yes supabase@2.119.0 link --project-ref zufsncswsoqlomtqhkks --agent no --output-format text
npx --yes supabase@2.119.0 db query "select kind, count(*) rows, sum(units) units, count(distinct user_id) users from api_usage where kind='copilot' and created_at >= date_trunc('day', now() at time zone 'Australia/Sydney') at time zone 'Australia/Sydney' group by kind" --linked --agent no --output-format text
```

`--linked` is required (`--project-ref` alone makes the query look for a local database and fail with `ECONNREFUSED 127.0.0.1:54322`), and the `Initialising login role…` notice it prints to stderr is not an error. Adding `user_id` to the `group by` gives the per-seat breakdown the ceiling is actually enforced against — the quickest way to tell "the cap is wrong" from "the client is wrong" is whether the blocked call appears in the ledger at all: **enforcement runs before `recordUsage`, so a blocked call must not be counted.**

Tenants cannot read this table. `api_usage` has RLS enabled with **no policies**, so `anon` and `authenticated` get nothing from it and the published key answers `401 {"code":"42501","permission denied for table api_usage"}`. That is deliberate — usage rows are written by the service-role client inside the functions and are not readable or forgeable from a browser. Allowance numbers reach the client two ways: the totals inside a `429` response, and the `?action=usage` endpoint in Section 11a, which sums these same rows and returns only aggregates plus the caller's own total — the team's total is visible, who spent it is not. No RLS policy was added for that: the browser still cannot read or forge a ledger row.

The three spend-capped proxies (`relay-copilot`, `relay-geocode`, `relay-route`) can be deployed **before** `031` is applied: they log `api_usage read failed` and run uncapped, which is why deploying the code and applying the migration are independent steps. The same holds for `034` and `relay-copilot` — a missing `user_id` column only costs the ceiling, because a failed ledger read leaves the proxy uncapped. Apply the migration to get the cap; deploy the function to change the copy.

### 12a. Deploying `relay-copilot` (two files)

`supabase functions deploy relay-copilot` bundles `index.ts` and its relative imports, so it is the supported path. Nothing else has to be set up first: no Docker, no `supabase init`, no `supabase link`, no `supabase/config.toml`. The project is named with `--project-ref` and `--use-api` uploads the bundle instead of building it locally, which is what makes Docker unnecessary:

```
npx --yes supabase@2.119.0 functions deploy relay-copilot \
  --project-ref zufsncswsoqlomtqhkks --use-api \
  --agent no --output-format text
```

Run it from the repository root so the CLI finds `supabase/functions/relay-copilot`. It prints one `Uploading asset` line per file — **both `index.ts` and `limits.js` must appear**, because the import is relative and the file has to sit beside `index.ts` inside the deployed bundle.

Three flags to leave alone: **never `--prune`** (it deletes every remote function that has no local directory, and this repository holds only 14 of the project's functions), **never deploy without naming the function** (a bare `functions deploy` would push everything in `supabase/functions/`), and **never `--no-verify-jwt`** (every function in the project runs with verification on, and `relay-copilot` re-checks the caller's token itself, so the CLI default is correct).

The CLI needs an account login, which on Windows lives in Credential Manager rather than a file. **Confirm it with `projects list`, never with the success message from `login`** — a failed login flow silently falls back to whatever token was stored earlier, and the CLI does not validate a token locally before sending it.

If the shell exports agent markers (`AI_AGENT`, `COPILOT_CLI`, …), the CLI's `--agent auto` detection switches to JSON output, which then refuses to prompt (`NonInteractiveError: Cannot prompt for input in JSON output mode`). Pass `--agent no --output-format text` on any command that may prompt, including `login`.

Verify a deploy with three checks, in increasing order of certainty:

1. `functions list --project-ref <ref> --output json` — `verify_jwt` must still be `true`. The table output does **not** show it; only the JSON does, and that JSON is an **object** (`{ "functions": [ … ] }`), so select `.functions[]` rather than iterating it directly. Do **not** read `version` as proof that code shipped: it also advances when secrets or config change, so a bumped `version` with an unchanged `entrypoint_path` means nothing was deployed. The reliable marker is the `_N` suffix on `entrypoint_path`, which advances once per code deploy (`_21` → `_27` for the usage-meter release).
2. Call it with the anon key: with or without `?action=usage`, the answer must be `401 {"error":"Unauthorized: invalid token"}`. That comes from inside the function, after its module graph is instantiated, so it proves `limits.js` shipped. A `503` with `BOOT_ERROR` is the signature of a missing or unresolvable file. Note this check deliberately stops at the function's own `401` — the usage branch is behind the same Bearer check, so an anon-key call never reaches it, and only a real user token can prove the branch itself.
3. `functions download relay-copilot --project-ref <ref> --use-api` into a scratch directory, then compare hashes against the local files. Byte-identical means production is running exactly the reviewed code.

Without the CLI, the Management API accepts a tarball of the function directory. Build it with the two files at the bundle root and the same metadata part as below:

```
tar -czf relay-copilot.tar.gz -C supabase/functions/relay-copilot index.ts limits.js
curl.exe -s -X POST "https://api.supabase.com/v1/projects/{ref}/functions/deploy?slug=relay-copilot" \
  -H "Authorization: ******" \
  -F "file=@relay-copilot.tar.gz" \
  -F "metadata=<metadata.json"
```

Either way, **verify by calling it**: no `Authorization` header is refused at the platform gateway with `401`, the anon key gets `401 {"error":"Unauthorized: invalid token"}` from the function itself, and only a real user token reaches the `400` validation error. What must never appear is a `503` with `BOOT_ERROR` — the function cannot start, which for this function almost always means `limits.js` did not ship.

### 12b. Deploying without the dashboard (Management API)

`POST /v1/projects/{ref}/functions/deploy?slug={slug}` takes the source plus a metadata part. PowerShell mangles the inner quotes of `-F metadata='{"…"}'`, so put the metadata in a file:

```
curl.exe -s -X POST "https://api.supabase.com/v1/projects/{ref}/functions/deploy?slug=relay-geocode" \
  -H "Authorization: Bearer {personal_access_token}" \
  -F "file=@supabase/functions/relay-geocode/index.ts" \
  -F "metadata=<metadata.json"   # {"entrypoint_path":"index.ts","verify_jwt":true,"name":"relay-geocode"}
```

A `201` response carries the new `version` and an `entrypoint_path` ending in `…/source/index.ts`. **Do not deploy with `PATCH /functions/{slug}`**: it accepts the source and bumps the version, but leaves `entrypoint_path` pointing at the previous revision's temp directory, so every invocation then answers `503 BOOT_ERROR` until the function is deployed again. Always confirm a deploy by calling the function — the answer must be a `401` or a `400`, never a `503`.

Live as of 2026-10-02 (`zufsncswsoqlomtqhkks`, all with JWT verification on): `relay-copilot` v20, `relay-geocode` v17, `relay-route` v15. Verified in that state: all three return real answers (DeepSeek completion, a Sydney geocode, an 18.8 km route), each writes exactly one `api_usage` row of the right `kind`, and each answers `429` with its message once the tenant is over its cap.

`relay-copilot` was deployed again by the CLI on 2026-10-04 (version 21) to ship the pooled allowance and the disabled thinking mode. That deploy was checked by hash — the function downloaded back out of the project is byte-identical to `supabase/functions/relay-copilot/` in this repository — and by an anon-key call answering `401` from inside the function, which is what proves the two-file bundle boots. The allowances were then running on the `limits.js` defaults with no `RELAY_AI_*` secrets set, which is the intended state: one source of truth, and nothing to drift.

The personal ceiling was then confirmed end-to-end on the same day: `RELAY_AI_USER_CAP_PLUS=1` against the Cloud+ test tenant, one message accepted and ledgered, the next refused with `429 scope: "user"` and the reset rendered in the reader's local clock ("resets at 12:00 AM tomorrow… your team can still send about 57 more messages today"). The first two attempts at this looked like a broken cap and were not — `RELAY_AI_USER_CAP` was set against a Cloud+ tenant, which reads the `_PLUS` twin and ignored it. The secret was unset afterwards and `secrets list` confirmed no `RELAY_AI_*` or `RELAY_COPILOT_*` keys remain, so the live system is back on the defaults.

