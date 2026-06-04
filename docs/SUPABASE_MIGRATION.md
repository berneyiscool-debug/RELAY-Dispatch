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

---

## 9. Risks & gotchas

- **Sync→async** is the only real architectural change — handled by the cache (Section 2). Don't skip the boot `await hydrate()`.
- **camelCase columns must be quoted** in all SQL. supabase-js returns them correctly without quoting.
- **Denormalised name fields** can drift (rename a customer → old jobs keep the old name). Acceptable now; a DB trigger can sync later.
- **Portals** authenticate by `portalToken`, not Supabase Auth — needs the Netlify-Function path, don't expose all rows to anon.
- **`service_role` key**: server-side only, never in the frontend bundle.
- Do the `store.js` swap **carefully / coordinated** — it's the spine of the app and the Antigravity agents also touch the codebase.
