/**
 * Runs the Xero Items migration (on top of Phase 1) against PGlite and checks
 * that stock changes queue exactly the right item jobs, that the xero_* link
 * columns can't be forged from a client JWT, and that the backfill and import
 * RPCs are service-role only and match stock the way the plan says.
 *
 * Run with: npm run test:migrations
 */
import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';

const migration = (name) => readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations', name), 'utf8');
const PHASE1 = migration('20261020090000_xero_integration.sql');
const ITEMS = migration('20261027090000_xero_items.sql');

const COMPANY_A = '00000000-0000-0000-0000-00000000000a';
const COMPANY_B = '00000000-0000-0000-0000-00000000000b';
const ADMIN_A = '11111111-1111-1111-1111-111111111111';

const FIXTURE = `
  CREATE ROLE anon NOLOGIN;
  CREATE ROLE authenticated NOLOGIN;
  CREATE ROLE service_role NOLOGIN BYPASSRLS;
  CREATE SCHEMA auth;
  CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $fn$
    SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid
  $fn$;
  GRANT USAGE ON SCHEMA auth, public TO anon, authenticated, service_role;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;

  CREATE TABLE public.companies (id uuid PRIMARY KEY, name text, settings jsonb);
  CREATE TABLE public.profiles (id uuid PRIMARY KEY, company_id uuid NOT NULL REFERENCES public.companies(id), role text);
  CREATE OR REPLACE FUNCTION public.get_user_company_id(uid uuid)
    RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
      SELECT company_id FROM public.profiles WHERE id = uid
    $fn$;

  CREATE TABLE public.customers (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    company text, first_name text, last_name text, email text, phone text, address text,
    created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE TABLE public.invoices (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    number text NOT NULL, job_id text, customer_id text, customer_name text,
    title text NOT NULL, status text DEFAULT 'Sent', line_items jsonb DEFAULT '[]'::jsonb,
    subtotal numeric DEFAULT 0, tax numeric DEFAULT 0, total numeric DEFAULT 0,
    due_date date, paid_date date, payment_method text, stripe_session_id text,
    created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE TABLE public.stock (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name text NOT NULL, category text, unit text DEFAULT 'Each',
    cost_price numeric DEFAULT 0, unit_price numeric DEFAULT 0, reorder_level numeric DEFAULT 0,
    quantity numeric DEFAULT 0, locations jsonb DEFAULT '[]'::jsonb, supplier text, sku text,
    created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
  );
  ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;
  CREATE POLICY stock_tenant ON public.stock FOR ALL TO authenticated
    USING (company_id = public.get_user_company_id(auth.uid()))
    WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

  INSERT INTO public.companies (id, name) VALUES ('${COMPANY_A}', 'Company A'), ('${COMPANY_B}', 'Company B');
  INSERT INTO public.profiles (id, company_id, role) VALUES ('${ADMIN_A}', '${COMPANY_A}', 'admin');
`;

let db;
const rows = (sql, params) => db.query(sql, params).then((r) => r.rows);

async function asUser(userId, fn) {
  await db.exec(`RESET ROLE; SELECT set_config('request.jwt.claim.sub', '${userId}', false); SET ROLE authenticated;`);
  try {
    return await fn();
  } finally {
    await db.exec("RESET ROLE; SELECT set_config('request.jwt.claim.sub', '', false);");
  }
}

async function asRole(role, fn) {
  await db.exec(`RESET ROLE; SELECT set_config('request.jwt.claim.sub', '', false); SET ROLE ${role};`);
  try {
    return await fn();
  } finally {
    await db.exec('RESET ROLE;');
  }
}

async function connect(companyId) {
  await db.query(
    `INSERT INTO public.xero_connections (company_id, tenant_id, tenant_name, base_currency, status)
     VALUES ($1, $2, 'Demo Company (AU)', 'AUD', 'active')`,
    [companyId, `tenant-${companyId.slice(-1)}`]
  );
}

const itemJobs = (companyId = COMPANY_A) => rows(
  `SELECT entity_id, action, status FROM public.xero_sync_jobs WHERE company_id = $1 AND entity = 'item' ORDER BY id`,
  [companyId]
);

async function insertStock(id, fields = {}, companyId = COMPANY_A) {
  const f = { name: `Item ${id}`, sku: null, unit_price: 10, cost_price: 5, ...fields };
  await db.query(
    `INSERT INTO public.stock (id, company_id, name, sku, unit_price, cost_price) VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, companyId, f.name, f.sku, f.unit_price, f.cost_price]
  );
}

describe('xero items migration', () => {
  before(async () => {
    db = new PGlite();
    await db.exec(FIXTURE);
    await db.exec(PHASE1);
    await db.exec(ITEMS);
  });

  after(async () => {
    await db.close();
  });

  beforeEach(async () => {
    await db.exec(`
      RESET ROLE;
      DELETE FROM public.xero_sync_jobs;
      DELETE FROM public.stock;
      DELETE FROM public.xero_connections;
    `);
  });

  describe('enqueue trigger', () => {
    test('nothing is queued for a company without Xero', async () => {
      await insertStock('S1');
      await db.query("UPDATE public.stock SET name = 'Renamed' WHERE id = 'S1'");
      assert.deepEqual(await itemJobs(), []);
    });

    test('new stock and Xero-visible edits queue one upsert; repeats collapse', async () => {
      await connect(COMPANY_A);
      await insertStock('S1');
      await db.query("UPDATE public.stock SET unit_price = 12 WHERE id = 'S1'");
      await db.query("UPDATE public.stock SET sku = 'PIPE-15' WHERE id = 'S1'");
      assert.deepEqual(await itemJobs(), [{ entity_id: 'S1', action: 'upsert', status: 'pending' }]);
    });

    test('quantity, location and reorder changes queue nothing', async () => {
      await connect(COMPANY_A);
      await insertStock('S1');
      await db.exec("UPDATE public.xero_sync_jobs SET status = 'done'");
      await db.query(`UPDATE public.stock SET quantity = 40, reorder_level = 5,
                        locations = '[{"location":"Van 1","quantity":40}]'::jsonb WHERE id = 'S1'`);
      assert.deepEqual((await itemJobs()).filter((j) => j.status === 'pending'), []);
    });

    test('worker writes to xero_* columns never echo back into the queue', async () => {
      await connect(COMPANY_A);
      await insertStock('S1');
      await db.exec("UPDATE public.xero_sync_jobs SET status = 'done'");
      await db.query("UPDATE public.stock SET xero_item_id = 'X1', xero_item_code = 'C1', xero_synced_at = now() WHERE id = 'S1'");
      assert.deepEqual((await itemJobs()).filter((j) => j.status === 'pending'), []);
    });
  });

  describe('client writes', () => {
    test('a client JWT cannot set or change the Xero link columns', async () => {
      await insertStock('S1');
      await db.query("UPDATE public.stock SET xero_item_id = 'REAL', xero_item_code = 'C1' WHERE id = 'S1'");
      await asUser(ADMIN_A, async () => {
        await db.query("UPDATE public.stock SET xero_item_id = 'FORGED', xero_sync_error = 'x', name = 'Edited' WHERE id = 'S1'");
        await db.query(`INSERT INTO public.stock (id, company_id, name, xero_item_id) VALUES ('S2', '${COMPANY_A}', 'New', 'FORGED')`);
      });
      const found = await rows("SELECT id, name, xero_item_id, xero_item_code, xero_sync_error FROM public.stock ORDER BY id");
      assert.deepEqual(found, [
        { id: 'S1', name: 'Edited', xero_item_id: 'REAL', xero_item_code: 'C1', xero_sync_error: null },
        { id: 'S2', name: 'New', xero_item_id: null, xero_item_code: null, xero_sync_error: null },
      ]);
    });
  });

  describe('xero_enqueue_items', () => {
    test('is service-role only', async () => {
      await asUser(ADMIN_A, async () => {
        await assert.rejects(() => db.query(`SELECT public.xero_enqueue_items('${COMPANY_A}')`), /permission denied/i);
        await assert.rejects(() => db.query(`SELECT public.xero_import_items('${COMPANY_A}', '[]'::jsonb)`), /permission denied/i);
      });
    });

    test('the backfill queues only unlinked stock; named ids resend linked ones', async () => {
      await insertStock('S1');
      await insertStock('S2');
      await insertStock('S3', {}, COMPANY_B);
      await db.query("UPDATE public.stock SET xero_item_id = 'X2' WHERE id = 'S2'");
      await connect(COMPANY_A);
      await asRole('service_role', async () => {
        const [{ n }] = await rows(`SELECT public.xero_enqueue_items('${COMPANY_A}') AS n`);
        assert.equal(n, 1);
        const [{ m }] = await rows(`SELECT public.xero_enqueue_items('${COMPANY_A}', ARRAY['S2']) AS m`);
        assert.equal(m, 1);
      });
      assert.deepEqual((await itemJobs()).map((j) => j.entity_id), ['S1', 'S2']);
      assert.deepEqual(await itemJobs(COMPANY_B), []);
    });

    test('queues nothing when the company is not connected', async () => {
      await insertStock('S1');
      await asRole('service_role', async () => {
        const [{ n }] = await rows(`SELECT public.xero_enqueue_items('${COMPANY_A}') AS n`);
        assert.equal(n, 0);
      });
    });
  });

  describe('xero_import_items', () => {
    const XERO_ITEMS = JSON.stringify([
      { id: 'X-linked', code: 'OLD', name: 'Already linked' },
      { id: 'X-sku', code: 'pipe-15', name: 'Copper pipe 15mm (Xero name)' },
      { id: 'X-name', code: 'VALVE', name: 'ball valve' },
      { id: 'X-new', code: 'TAPE', name: 'Thread tape', salePrice: 4.5, purchasePrice: 1.2 },
      { id: '', code: 'SKIP', name: 'No id' },
    ]);

    async function seed() {
      await insertStock('S-linked');
      await db.query("UPDATE public.stock SET xero_item_id = 'X-linked' WHERE id = 'S-linked'");
      await insertStock('S-sku', { name: 'Copper pipe', sku: 'PIPE-15' });
      await insertStock('S-name', { name: 'Ball Valve' });
      await insertStock('S-other', { name: 'Untouched' });
      await connect(COMPANY_A);
    }

    test('a dry run only counts', async () => {
      await seed();
      const result = await asRole('service_role', () =>
        rows(`SELECT public.xero_import_items('${COMPANY_A}', $1::jsonb, true) AS r`, [XERO_ITEMS]));
      assert.deepEqual(result[0].r, { linked: 2, created: 1, already_linked: 1 });
      const [{ n }] = await rows("SELECT count(*)::int AS n FROM public.stock WHERE xero_item_id IS NOT NULL");
      assert.equal(n, 1);
    });

    test('links by SKU then name, creates the rest, and queues nothing', async () => {
      await seed();
      const result = await asRole('service_role', () =>
        rows(`SELECT public.xero_import_items('${COMPANY_A}', $1::jsonb) AS r`, [XERO_ITEMS]));
      assert.deepEqual(result[0].r, { linked: 2, created: 1, already_linked: 1 });

      const found = await rows(`SELECT id, name, sku, unit_price, cost_price, quantity, xero_item_id, xero_item_code
                                  FROM public.stock WHERE company_id = $1 ORDER BY name`, [COMPANY_A]);
      const byXero = Object.fromEntries(found.filter((s) => s.xero_item_id).map((s) => [s.xero_item_id, s]));
      assert.equal(byXero['X-sku'].id, 'S-sku');
      assert.equal(byXero['X-sku'].name, 'Copper pipe', 'a linked row keeps its RELAY name');
      assert.equal(byXero['X-name'].id, 'S-name');
      assert.equal(byXero['X-name'].xero_item_code, 'VALVE');
      assert.equal(byXero['X-new'].name, 'Thread tape');
      assert.equal(byXero['X-new'].sku, 'TAPE');
      assert.equal(Number(byXero['X-new'].unit_price), 4.5);
      assert.equal(Number(byXero['X-new'].cost_price), 1.2);
      assert.equal(Number(byXero['X-new'].quantity), 0);
      assert.equal(found.find((s) => s.id === 'S-other').xero_item_id, null);

      assert.deepEqual(await itemJobs(), [], 'imported rows must not be pushed straight back');
    });

    test('running it again links nothing new', async () => {
      await seed();
      await asRole('service_role', () => rows(`SELECT public.xero_import_items('${COMPANY_A}', $1::jsonb)`, [XERO_ITEMS]));
      const again = await asRole('service_role', () =>
        rows(`SELECT public.xero_import_items('${COMPANY_A}', $1::jsonb) AS r`, [XERO_ITEMS]));
      assert.deepEqual(again[0].r, { linked: 0, created: 0, already_linked: 4 });
    });

    test('the queue still accepts Phase 1 entities', async () => {
      await connect(COMPANY_A);
      await db.query(`SELECT public.xero_enqueue('${COMPANY_A}', 'invoice', 'INV-1', 'upsert')`);
      await assert.rejects(() => db.query(`SELECT public.xero_enqueue('${COMPANY_A}', 'bogus', 'x', 'upsert')`), /check constraint/i);
    });
  });
});
