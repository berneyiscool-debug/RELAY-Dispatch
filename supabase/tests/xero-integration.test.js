/**
 * Runs the Xero Phase 1 migration against PGlite (real Postgres in WASM) and
 * checks the guarantees the sync design rests on: tokens are invisible to every
 * client role, the xero_* link columns can't be forged from a client JWT, the
 * enqueue trigger turns invoice changes into exactly the right jobs (and never
 * echoes worker writes back into the queue), and the worker RPCs are
 * service-role only.
 *
 * Run with: npm run test:migrations
 */
import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';

const MIGRATION = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations', '20261020090000_xero_integration.sql'),
  'utf8'
);
const SEND_TO_XERO = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations', '20261022090000_xero_send_to_xero.sql'),
  'utf8'
);

const COMPANY_A = '00000000-0000-0000-0000-00000000000a';
const COMPANY_B = '00000000-0000-0000-0000-00000000000b';
const ADMIN_A = '11111111-1111-1111-1111-111111111111';
const ADMIN_B = '22222222-2222-2222-2222-222222222222';

// Mirrors the live shape of the tables the migration touches, plus Supabase's
// default privileges (every new table/function is granted to the API roles),
// so the migration's REVOKEs are what actually keep things private.
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
    status text DEFAULT 'Active',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE TABLE public.invoices (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    number text NOT NULL, job_id text, customer_id text, customer_name text, contact_name text,
    title text NOT NULL, status text DEFAULT 'Sent', line_items jsonb DEFAULT '[]'::jsonb,
    subtotal numeric DEFAULT 0, tax numeric DEFAULT 0, total numeric DEFAULT 0,
    due_date date, notes text, paid_date date, payment_method text, stripe_session_id text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );
  ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
  CREATE POLICY customers_tenant ON public.customers FOR ALL TO authenticated
    USING (company_id = public.get_user_company_id(auth.uid()))
    WITH CHECK (company_id = public.get_user_company_id(auth.uid()));
  ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
  CREATE POLICY invoices_tenant ON public.invoices FOR ALL TO authenticated
    USING (company_id = public.get_user_company_id(auth.uid()))
    WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

  INSERT INTO public.companies (id, name) VALUES ('${COMPANY_A}', 'Company A'), ('${COMPANY_B}', 'Company B');
  INSERT INTO public.profiles (id, company_id, role) VALUES
    ('${ADMIN_A}', '${COMPANY_A}', 'admin'),
    ('${ADMIN_B}', '${COMPANY_B}', 'admin');
`;

let db;

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

const rows = (sql, params) => db.query(sql, params).then((r) => r.rows);

async function jobs(companyId = COMPANY_A) {
  return rows(
    `SELECT entity, entity_id, action, status FROM public.xero_sync_jobs
      WHERE company_id = $1 ORDER BY id`,
    [companyId]
  );
}

async function connect(companyId, status = 'active') {
  await db.query(
    `INSERT INTO public.xero_connections (company_id, tenant_id, tenant_name, base_currency, status, access_token_enc, refresh_token_enc)
     VALUES ($1, $2, 'Demo Company (AU)', 'AUD', $3, 'cipher-access', 'cipher-refresh')
     ON CONFLICT (company_id) DO UPDATE SET status = EXCLUDED.status`,
    [companyId, `tenant-${companyId.slice(-1)}`, status]
  );
}

async function resetData() {
  await db.exec(`
    RESET ROLE;
    DELETE FROM public.xero_sync_jobs;
    DELETE FROM public.invoices;
    DELETE FROM public.customers;
    DELETE FROM public.xero_connections;
  `);
}

async function insertInvoice(id, { status = 'Draft', companyId = COMPANY_A, total = 110 } = {}) {
  await db.query(
    `INSERT INTO public.invoices (id, company_id, number, title, status, subtotal, tax, total, customer_id)
     VALUES ($1, $2, $1, 'Service call', $3, $4 / 1.1, $4 - $4 / 1.1, $4, 'cust-1')`,
    [id, companyId, status, total]
  );
}

describe('xero integration migration', () => {
  before(async () => {
    db = new PGlite();
    await db.exec(FIXTURE);
    await db.exec(MIGRATION);
    await db.exec(SEND_TO_XERO);
  });

  after(async () => {
    await db.close();
  });

  beforeEach(resetData);

  describe('privacy', () => {
    test('no client role can read the OAuth tokens table, even for its own company', async () => {
      await connect(COMPANY_A);
      await asUser(ADMIN_A, async () => {
        await assert.rejects(() => db.query('SELECT * FROM public.xero_connections'), /permission denied/i);
      });
      await asRole('anon', async () => {
        await assert.rejects(() => db.query('SELECT * FROM public.xero_connections'), /permission denied/i);
      });
      const [{ relrowsecurity }] = await rows("SELECT relrowsecurity FROM pg_class WHERE relname = 'xero_connections'");
      assert.equal(relrowsecurity, true);
      await asRole('service_role', async () => {
        const found = await rows('SELECT refresh_token_enc FROM public.xero_connections');
        assert.deepEqual(found, [{ refresh_token_enc: 'cipher-refresh' }]);
      });
    });

    test('the status function returns only the caller company and no tokens', async () => {
      await connect(COMPANY_A);
      await asUser(ADMIN_A, async () => {
        const status = await rows('SELECT * FROM public.xero_connection_status()');
        assert.equal(status.length, 1);
        assert.equal(status[0].tenant_name, 'Demo Company (AU)');
        assert.equal(status[0].status, 'active');
        assert.equal(status[0].pending_jobs, 0);
        assert.ok(!Object.keys(status[0]).some((key) => /token/.test(key)));
      });
      await asUser(ADMIN_B, async () => {
        assert.deepEqual(await rows('SELECT * FROM public.xero_connection_status()'), []);
      });
      await asRole('anon', async () => {
        await assert.rejects(() => db.query('SELECT * FROM public.xero_connection_status()'), /permission denied/i);
      });
    });

    test('company users can read their own sync log but never write it', async () => {
      await connect(COMPANY_A);
      await connect(COMPANY_B);
      await insertInvoice('INV-A', { status: 'Sent' });
      await insertInvoice('INV-B', { status: 'Sent', companyId: COMPANY_B });
      await asUser(ADMIN_A, async () => {
        const seen = await rows('SELECT entity_id FROM public.xero_sync_jobs');
        assert.deepEqual(seen, [{ entity_id: 'INV-A' }]);
        await assert.rejects(
          () => db.query(`INSERT INTO public.xero_sync_jobs (company_id, entity, entity_id, action) VALUES ('${COMPANY_A}', 'invoice', 'x', 'upsert')`),
          /permission denied/i
        );
        await assert.rejects(() => db.query("UPDATE public.xero_sync_jobs SET status = 'done'"), /permission denied/i);
      });
      await asRole('anon', async () => {
        await assert.rejects(() => db.query('SELECT * FROM public.xero_sync_jobs'), /permission denied/i);
      });
    });

    test('client roles cannot call the worker or enqueue RPCs', async () => {
      await asUser(ADMIN_A, async () => {
        await assert.rejects(() => db.query('SELECT * FROM public.xero_claim_sync_jobs(10)'), /permission denied/i);
        await assert.rejects(
          () => db.query(`SELECT public.xero_apply_invoice_pull('${COMPANY_A}', 'x', 'PAID', 0, NULL)`),
          /permission denied/i
        );
        await assert.rejects(
          () => db.query(`SELECT public.xero_enqueue('${COMPANY_A}', 'invoice', 'x', 'upsert')`),
          /permission denied/i
        );
      });
    });

    test('API roles hold no EXECUTE on any Xero SECURITY DEFINER function except the status call', async () => {
      const { rows: exposed } = await db.query(`
        SELECT p.proname, r.rolname
          FROM pg_proc p
          JOIN pg_namespace n ON n.oid = p.pronamespace AND n.nspname = 'public'
          CROSS JOIN (VALUES ('anon'), ('authenticated')) AS r(rolname)
         WHERE p.prosecdef AND p.proname ~ 'xero'
           AND has_function_privilege(r.rolname, p.oid, 'EXECUTE')
         ORDER BY 1, 2
      `);
      assert.deepEqual(exposed, [{ proname: 'xero_connection_status', rolname: 'authenticated' }]);
    });
  });

  describe('column guard', () => {
    test('a client JWT cannot forge or change xero link columns', async () => {
      await asUser(ADMIN_A, async () => {
        await db.query(`
          INSERT INTO public.invoices (id, company_id, number, title, status, xero_invoice_id, xero_status, xero_payment_ids)
          VALUES ('INV-1', '${COMPANY_A}', 'INV-1', 'Forged', 'Draft', 'forged-id', 'PAID', '{"p":"x"}')
        `);
        await db.query(`INSERT INTO public.customers (id, company_id, company, xero_contact_id) VALUES ('cust-1', '${COMPANY_A}', 'Acme', 'forged-contact')`);
      });
      assert.deepEqual(
        await rows("SELECT xero_invoice_id, xero_status, xero_payment_ids FROM public.invoices WHERE id = 'INV-1'"),
        [{ xero_invoice_id: null, xero_status: null, xero_payment_ids: {} }]
      );
      assert.deepEqual(await rows("SELECT xero_contact_id FROM public.customers WHERE id = 'cust-1'"), [{ xero_contact_id: null }]);

      await asRole('service_role', async () => {
        await db.query("UPDATE public.invoices SET xero_invoice_id = 'real-id', xero_status = 'AUTHORISED' WHERE id = 'INV-1'");
        await db.query("UPDATE public.customers SET xero_contact_id = 'real-contact' WHERE id = 'cust-1'");
      });
      await asUser(ADMIN_A, async () => {
        await db.query("UPDATE public.invoices SET xero_invoice_id = 'hijack', xero_sync_error = 'x', title = 'Edited' WHERE id = 'INV-1'");
        await db.query("UPDATE public.customers SET xero_contact_id = NULL, company = 'Acme Pty' WHERE id = 'cust-1'");
      });
      assert.deepEqual(
        await rows("SELECT xero_invoice_id, xero_sync_error, title FROM public.invoices WHERE id = 'INV-1'"),
        [{ xero_invoice_id: 'real-id', xero_sync_error: null, title: 'Edited' }]
      );
      assert.deepEqual(
        await rows("SELECT xero_contact_id, company FROM public.customers WHERE id = 'cust-1'"),
        [{ xero_contact_id: 'real-contact', company: 'Acme Pty' }]
      );
    });
  });

  describe('enqueue trigger', () => {
    test('nothing is queued for a company without a Xero connection', async () => {
      await insertInvoice('INV-1', { status: 'Sent' });
      await db.query("UPDATE public.invoices SET status = 'Paid' WHERE id = 'INV-1'");
      assert.deepEqual(await jobs(), []);
    });

    test('a disconnected or unfinished connection queues nothing', async () => {
      await connect(COMPANY_A, 'disconnected');
      await insertInvoice('INV-1', { status: 'Sent' });
      assert.deepEqual(await jobs(), []);
    });

    test('a connection needing re-auth still queues, so work goes out after reconnecting', async () => {
      await connect(COMPANY_A, 'needs_reauth');
      await insertInvoice('INV-1', { status: 'Sent' });
      assert.deepEqual(await jobs(), [{ entity: 'invoice', entity_id: 'INV-1', action: 'upsert', status: 'pending' }]);
    });

    test('drafts are never pushed; sending queues one upsert and later edits collapse into it', async () => {
      await connect(COMPANY_A);
      await insertInvoice('INV-1');
      await db.query("UPDATE public.invoices SET title = 'Draft edit' WHERE id = 'INV-1'");
      assert.deepEqual(await jobs(), []);

      await asUser(ADMIN_A, () => db.query("UPDATE public.invoices SET status = 'Sent' WHERE id = 'INV-1'"));
      await asUser(ADMIN_A, () => db.query("UPDATE public.invoices SET total = 220 WHERE id = 'INV-1'"));
      assert.deepEqual(await jobs(), [{ entity: 'invoice', entity_id: 'INV-1', action: 'upsert', status: 'pending' }]);
    });

    test('an edit after the pending job was claimed queues a fresh upsert', async () => {
      await connect(COMPANY_A);
      await insertInvoice('INV-1', { status: 'Sent' });
      await asRole('service_role', () => db.query('SELECT * FROM public.xero_claim_sync_jobs(10)'));
      await db.query("UPDATE public.invoices SET due_date = '2026-11-30' WHERE id = 'INV-1'");
      assert.deepEqual((await jobs()).map((j) => j.status), ['running', 'pending']);
    });

    test('worker writes to xero_* columns and unrelated columns never queue work', async () => {
      await connect(COMPANY_A);
      await insertInvoice('INV-1', { status: 'Sent' });
      await db.exec('DELETE FROM public.xero_sync_jobs');
      await asRole('service_role', () => db.query(`
        UPDATE public.invoices
           SET xero_invoice_id = 'x-1', xero_status = 'AUTHORISED', xero_amount_due = 110, xero_synced_at = now()
         WHERE id = 'INV-1'
      `));
      await db.query("UPDATE public.invoices SET notes = 'internal', stripe_session_id = 'cs_1' WHERE id = 'INV-1'");
      assert.deepEqual(await jobs(), []);
    });

    test('marking paid queues the push and the payment; an invoice created as paid does too', async () => {
      await connect(COMPANY_A);
      await insertInvoice('INV-1', { status: 'Sent' });
      await db.exec('DELETE FROM public.xero_sync_jobs');
      // The Stripe webhook marks invoices paid with the service role.
      await asRole('service_role', () => db.query(
        "UPDATE public.invoices SET status = 'Paid', paid_date = '2026-10-20', payment_method = 'Stripe (online)' WHERE id = 'INV-1'"
      ));
      await insertInvoice('INV-2', { status: 'Paid' });
      assert.deepEqual(
        (await jobs()).map((j) => `${j.entity_id}:${j.action}`),
        ['INV-1:upsert', 'INV-1:pay', 'INV-2:upsert', 'INV-2:pay']
      );
    });

    test('voiding queues a Xero void only when the invoice is in Xero', async () => {
      await connect(COMPANY_A);
      await insertInvoice('INV-1', { status: 'Sent' });
      await insertInvoice('INV-2', { status: 'Sent' });
      await asRole('service_role', () => db.query("UPDATE public.invoices SET xero_invoice_id = 'x-1' WHERE id = 'INV-1'"));
      await db.exec('DELETE FROM public.xero_sync_jobs');
      await db.query("UPDATE public.invoices SET status = 'Void' WHERE id IN ('INV-1', 'INV-2')");
      assert.deepEqual(await jobs(), [{ entity: 'invoice', entity_id: 'INV-1', action: 'void', status: 'pending' }]);
    });

    test('once Xero holds a payment, RELAY content edits are no longer pushed', async () => {
      await connect(COMPANY_A);
      await insertInvoice('INV-1', { status: 'Sent' });
      await insertInvoice('INV-2', { status: 'Sent' });
      await asRole('service_role', () => db.query(`
        UPDATE public.invoices SET xero_invoice_id = 'x-' || id, xero_status = 'AUTHORISED',
          xero_amount_due = CASE WHEN id = 'INV-1' THEN 50 ELSE 110 END
      `));
      await db.exec('DELETE FROM public.xero_sync_jobs');
      await db.query("UPDATE public.invoices SET title = 'Edited after payment'");
      assert.deepEqual(await jobs(), [{ entity: 'invoice', entity_id: 'INV-2', action: 'upsert', status: 'pending' }]);
    });

    test('a broken Xero queue never stops an invoice or customer being saved', async () => {
      await connect(COMPANY_A);
      await insertInvoice('INV-1', { status: 'Draft' });
      await db.query(`INSERT INTO public.customers (id, company_id, company) VALUES ('cust-linked', '${COMPANY_A}', 'Linked Co')`);
      await asRole('service_role', () => db.query("UPDATE public.customers SET xero_contact_id = 'c-1' WHERE id = 'cust-linked'"));
      await db.exec(`
        CREATE OR REPLACE FUNCTION public.xero_enqueue(p_company_id uuid, p_entity text, p_entity_id text, p_action text)
        RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $f$
        BEGIN RAISE EXCEPTION 'simulated Xero queue failure'; END $f$;
      `);
      try {
        // A client sending an invoice, a webhook marking one paid, a new invoice and
        // a customer edit: all of them must still save.
        await asUser(ADMIN_A, () => db.query("UPDATE public.invoices SET status = 'Sent' WHERE id = 'INV-1'"));
        await asRole('service_role', () => db.query("UPDATE public.invoices SET status = 'Paid' WHERE id = 'INV-1'"));
        await insertInvoice('INV-2', { status: 'Sent' });
        await db.query("UPDATE public.customers SET company = 'Linked Co Pty' WHERE id = 'cust-linked'");
        assert.deepEqual(
          await rows('SELECT id, status FROM public.invoices ORDER BY id'),
          [{ id: 'INV-1', status: 'Paid' }, { id: 'INV-2', status: 'Sent' }]
        );
        assert.deepEqual(await rows("SELECT company FROM public.customers WHERE id = 'cust-linked'"), [{ company: 'Linked Co Pty' }]);
        assert.deepEqual(await jobs(), []);
      } finally {
        await db.exec(MIGRATION); // restores the real xero_enqueue
      }
      await db.query("UPDATE public.invoices SET title = 'Back to normal' WHERE id = 'INV-2'");
      assert.deepEqual(await jobs(), [{ entity: 'invoice', entity_id: 'INV-2', action: 'upsert', status: 'pending' }]);
    });

    test('a broken connection lookup fails open too', async () => {
      await connect(COMPANY_A);
      await db.exec(`
        CREATE OR REPLACE FUNCTION public.xero_company_connected(p_company_id uuid)
        RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $f$
        BEGIN RAISE EXCEPTION 'simulated lookup failure'; END $f$;
      `);
      try {
        await insertInvoice('INV-1', { status: 'Sent' });
        assert.equal((await rows('SELECT count(*)::int AS n FROM public.invoices'))[0].n, 1);
      } finally {
        await db.exec(MIGRATION);
      }
    });

    test('linked customers push detail changes; unlinked customers wait for an invoice', async () => {
      await connect(COMPANY_A);
      await db.query(`
        INSERT INTO public.customers (id, company_id, company, email) VALUES
          ('cust-linked', '${COMPANY_A}', 'Linked Co', 'l@x.test'),
          ('cust-new', '${COMPANY_A}', 'New Co', 'n@x.test')
      `);
      await asRole('service_role', () => db.query("UPDATE public.customers SET xero_contact_id = 'c-1' WHERE id = 'cust-linked'"));
      await db.query("UPDATE public.customers SET email = 'changed@x.test'");
      await db.query("UPDATE public.customers SET status = 'Inactive'");
      assert.deepEqual(await jobs(), [{ entity: 'contact', entity_id: 'cust-linked', action: 'upsert', status: 'pending' }]);
    });
  });

  describe('send to Xero', () => {
    const send = (ids) => asRole('service_role', () =>
      rows('SELECT public.xero_enqueue_invoices($1, $2::text[]) AS n', [COMPANY_A, ids]).then((r) => r[0].n));

    test('the backfill queues every sent invoice not yet in Xero, and payments for paid ones', async () => {
      await insertInvoice('OLD-SENT', { status: 'Sent' });
      await insertInvoice('OLD-PAID', { status: 'Paid' });
      await insertInvoice('OLD-DRAFT', { status: 'Draft' });
      await insertInvoice('OLD-VOID', { status: 'Void' });
      await insertInvoice('LINKED', { status: 'Sent' });
      await insertInvoice('OTHER-CO', { status: 'Sent', companyId: COMPANY_B });
      await asRole('service_role', () => db.query("UPDATE public.invoices SET xero_invoice_id = 'x-1' WHERE id = 'LINKED'"));

      assert.equal(await send(null), 0, 'nothing is queued before Xero is connected');
      await connect(COMPANY_A);
      await db.exec('DELETE FROM public.xero_sync_jobs');

      assert.equal(await send(null), 2);
      assert.deepEqual(
        (await jobs()).map((j) => `${j.entity_id}:${j.action}`).sort(),
        ['OLD-PAID:pay', 'OLD-PAID:upsert', 'OLD-SENT:upsert']
      );
      assert.equal(await send(null), 2, 'running it again collapses into the pending jobs');
      assert.equal((await jobs()).length, 3);
    });

    test('a named resend includes linked invoices but never drafts, voids or other companies', async () => {
      await connect(COMPANY_A);
      await insertInvoice('LINKED', { status: 'Sent' });
      await insertInvoice('DRAFT', { status: 'Draft' });
      await insertInvoice('OTHER-CO', { status: 'Sent', companyId: COMPANY_B });
      await asRole('service_role', () => db.query(
        "UPDATE public.invoices SET xero_invoice_id = 'x-1', xero_payment_ids = '{\"balance\":\"p\"}' WHERE id = 'LINKED'"
      ));
      await db.exec('DELETE FROM public.xero_sync_jobs');

      assert.equal(await send(['LINKED', 'DRAFT', 'OTHER-CO', 'MISSING']), 1);
      assert.deepEqual(await jobs(), [{ entity: 'invoice', entity_id: 'LINKED', action: 'upsert', status: 'pending' }]);
      assert.deepEqual(await jobs(COMPANY_B), []);
    });

    test('client roles cannot call it', async () => {
      await asUser(ADMIN_A, async () => {
        await assert.rejects(() => db.query(`SELECT public.xero_enqueue_invoices('${COMPANY_A}', NULL)`), /permission denied/i);
      });
    });
  });

  describe('worker RPCs', () => {
    test('claiming takes due jobs oldest first, once, and reclaims a stuck run', async () => {
      await connect(COMPANY_A);
      await insertInvoice('INV-1', { status: 'Sent' });
      await insertInvoice('INV-2', { status: 'Sent' });
      await db.query("UPDATE public.xero_sync_jobs SET run_after = now() + interval '1 hour' WHERE entity_id = 'INV-2'");

      const first = await asRole('service_role', () => rows('SELECT entity_id, status, attempts FROM public.xero_claim_sync_jobs(10)'));
      assert.deepEqual(first, [{ entity_id: 'INV-1', status: 'running', attempts: 1 }]);
      const again = await asRole('service_role', () => rows('SELECT entity_id FROM public.xero_claim_sync_jobs(10)'));
      assert.deepEqual(again, []);

      await db.query("UPDATE public.xero_sync_jobs SET updated_at = now() - interval '11 minutes' WHERE entity_id = 'INV-1'");
      const reclaimed = await asRole('service_role', () => rows('SELECT entity_id, attempts FROM public.xero_claim_sync_jobs(10)'));
      assert.deepEqual(reclaimed, [{ entity_id: 'INV-1', attempts: 2 }]);
    });

    test('claiming skips companies that must reconnect, and can narrow by company and action', async () => {
      await connect(COMPANY_A);
      await connect(COMPANY_B);
      await insertInvoice('INV-A', { status: 'Paid' });
      await insertInvoice('INV-B', { status: 'Sent', companyId: COMPANY_B });
      await db.query(`UPDATE public.xero_connections SET status = 'needs_reauth' WHERE company_id = '${COMPANY_B}'`);

      const claim = (sql) => asRole('service_role', () => rows(sql));
      assert.deepEqual(
        await claim(`SELECT entity_id, action FROM public.xero_claim_sync_jobs(10, NULL, ARRAY['upsert', 'void'])`),
        [{ entity_id: 'INV-A', action: 'upsert' }]
      );
      assert.deepEqual(await claim(`SELECT entity_id FROM public.xero_claim_sync_jobs(10, '${COMPANY_B}')`), []);
      assert.deepEqual((await jobs(COMPANY_B)).map((j) => j.status), ['pending']);

      await db.query(`UPDATE public.xero_connections SET status = 'active' WHERE company_id = '${COMPANY_B}'`);
      assert.deepEqual(await claim(`SELECT entity_id FROM public.xero_claim_sync_jobs(10, '${COMPANY_B}')`), [{ entity_id: 'INV-B' }]);
      assert.deepEqual(await claim(`SELECT entity_id, action FROM public.xero_claim_sync_jobs(10)`), [{ entity_id: 'INV-A', action: 'pay' }]);
    });

    test('a Xero PAID pull marks the RELAY invoice paid without echoing a push', async () => {
      await connect(COMPANY_A);
      await insertInvoice('INV-1', { status: 'Sent' });
      await asRole('service_role', () => db.query("UPDATE public.invoices SET xero_invoice_id = 'x-1', xero_status = 'AUTHORISED' WHERE id = 'INV-1'"));
      await db.exec('DELETE FROM public.xero_sync_jobs');

      const applied = await asRole('service_role', () =>
        rows(`SELECT public.xero_apply_invoice_pull('${COMPANY_A}', 'x-1', 'PAID', 0, '2026-10-19') AS id`)
      );
      assert.deepEqual(applied, [{ id: 'INV-1' }]);
      const [invoice] = await rows("SELECT status, paid_date::text, payment_method, xero_status, xero_amount_due::int FROM public.invoices WHERE id = 'INV-1'");
      assert.deepEqual(invoice, { status: 'Paid', paid_date: '2026-10-19', payment_method: 'Xero', xero_status: 'PAID', xero_amount_due: 0 });
      assert.deepEqual(await jobs(), []);

      // The quiet flag is scoped to the RPC's transaction and doesn't leak.
      const [{ flag }] = await rows("SELECT coalesce(current_setting('relay.xero_sync', true), '') AS flag");
      assert.notEqual(flag, 'true');
    });

    test('a Xero VOIDED pull flags the invoice instead of voiding it', async () => {
      await connect(COMPANY_A);
      await insertInvoice('INV-1', { status: 'Sent' });
      await asRole('service_role', () => db.query("UPDATE public.invoices SET xero_invoice_id = 'x-1' WHERE id = 'INV-1'"));
      await asRole('service_role', () => db.query(`SELECT public.xero_apply_invoice_pull('${COMPANY_A}', 'x-1', 'VOIDED', 0, NULL)`));
      const [invoice] = await rows("SELECT status, xero_status, xero_sync_error FROM public.invoices WHERE id = 'INV-1'");
      assert.equal(invoice.status, 'Sent');
      assert.equal(invoice.xero_status, 'VOIDED');
      assert.match(invoice.xero_sync_error, /Voided in Xero/);
    });

    test('retrying requeues failed jobs without colliding with newer pending work', async () => {
      await connect(COMPANY_A);
      await connect(COMPANY_B);
      await db.query(`
        INSERT INTO public.xero_sync_jobs (company_id, entity, entity_id, action, status, attempts, last_error) VALUES
          ('${COMPANY_A}', 'invoice', 'INV-1', 'upsert', 'failed', 6, 'old'),
          ('${COMPANY_A}', 'invoice', 'INV-1', 'upsert', 'failed', 6, 'newer'),
          ('${COMPANY_A}', 'invoice', 'INV-2', 'upsert', 'failed', 6, 'x'),
          ('${COMPANY_A}', 'invoice', 'INV-2', 'upsert', 'pending', 0, NULL),
          ('${COMPANY_A}', 'invoice', 'INV-3', 'pay', 'failed', 6, 'x'),
          ('${COMPANY_B}', 'invoice', 'INV-B', 'upsert', 'failed', 6, 'x')
      `);
      await asUser(ADMIN_A, async () => {
        await assert.rejects(() => db.query(`SELECT public.xero_retry_failed_jobs('${COMPANY_A}', NULL)`), /permission denied/i);
      });

      const [{ requeued }] = await asRole('service_role', () => rows(`SELECT public.xero_retry_failed_jobs('${COMPANY_A}', NULL) AS requeued`));
      assert.equal(requeued, 2);
      assert.deepEqual(
        (await jobs()).map((j) => `${j.entity_id}:${j.action}:${j.status}`).sort(),
        ['INV-1:upsert:pending', 'INV-2:upsert:pending', 'INV-3:pay:pending']
      );
      const [kept] = await rows(`SELECT attempts, last_error FROM public.xero_sync_jobs WHERE entity_id = 'INV-1'`);
      assert.deepEqual(kept, { attempts: 0, last_error: null });
      assert.deepEqual((await jobs(COMPANY_B)).map((j) => j.status), ['failed']);

      const [{ requeued: one }] = await asRole('service_role', () =>
        rows(`SELECT public.xero_retry_failed_jobs('${COMPANY_B}', (SELECT id FROM public.xero_sync_jobs WHERE entity_id = 'INV-B')) AS requeued`)
      );
      assert.equal(one, 1);
    });

    test('webhook events queue pulls only for invoices RELAY pushed, for the right company', async () => {
      await connect(COMPANY_A);
      await connect(COMPANY_B);
      await insertInvoice('INV-A', { status: 'Sent' });
      await insertInvoice('INV-B', { status: 'Sent', companyId: COMPANY_B });
      await asRole('service_role', () => db.query("UPDATE public.invoices SET xero_invoice_id = 'x-' || id"));
      await db.exec('DELETE FROM public.xero_sync_jobs');

      const enqueue = (tenant, ids) => asRole('service_role', () =>
        rows(`SELECT public.xero_enqueue_pulls($1, $2::text[]) AS n`, [tenant, ids]).then((r) => r[0].n));
      // Tenant A's event naming B's invoice id, an unknown id and a repeat.
      assert.equal(await enqueue('tenant-a', ['x-INV-A', 'x-INV-B', 'x-unknown', 'x-INV-A']), 1);
      assert.equal(await enqueue('tenant-a', ['x-INV-A']), 0, 'a repeat collapses into the pending pull');
      assert.equal(await enqueue('tenant-nobody', ['x-INV-A']), 0);
      assert.deepEqual(await jobs(), [{ entity: 'xero_invoice', entity_id: 'x-INV-A', action: 'refresh', status: 'pending' }]);
      assert.deepEqual(await jobs(COMPANY_B), []);

      await db.query(`UPDATE public.xero_connections SET status = 'disconnected' WHERE company_id = '${COMPANY_B}'`);
      assert.equal(await enqueue('tenant-b', ['x-INV-B']), 0);

      await asUser(ADMIN_A, async () => {
        await assert.rejects(() => db.query(`SELECT public.xero_enqueue_pulls('tenant-a', ARRAY['x-INV-A'])`), /permission denied/i);
      });
    });

    test('a pull for an unknown or other-company Xero invoice changes nothing', async () => {
      await connect(COMPANY_A);
      await insertInvoice('INV-B', { status: 'Sent', companyId: COMPANY_B });
      await asRole('service_role', () => db.query("UPDATE public.invoices SET xero_invoice_id = 'x-b' WHERE id = 'INV-B'"));
      const applied = await asRole('service_role', () =>
        rows(`SELECT public.xero_apply_invoice_pull('${COMPANY_A}', 'x-b', 'PAID', 0, NULL) AS id`)
      );
      assert.deepEqual(applied, [{ id: null }]);
      assert.deepEqual(await rows("SELECT status FROM public.invoices WHERE id = 'INV-B'"), [{ status: 'Sent' }]);
    });
  });

  describe('constraints', () => {
    test('an active connection must name its Xero organisation; one org feeds one company', async () => {
      await assert.rejects(
        () => db.query(`INSERT INTO public.xero_connections (company_id, status) VALUES ('${COMPANY_A}', 'active')`),
        /check constraint/i
      );
      await db.query(`INSERT INTO public.xero_connections (company_id, status) VALUES ('${COMPANY_A}', 'choose_tenant')`);
      await db.query(`UPDATE public.xero_connections SET tenant_id = 'shared', status = 'active' WHERE company_id = '${COMPANY_A}'`);
      await assert.rejects(
        () => db.query(`INSERT INTO public.xero_connections (company_id, tenant_id, status) VALUES ('${COMPANY_B}', 'shared', 'active')`),
        /duplicate key/i
      );
      await db.query(`UPDATE public.xero_connections SET status = 'disconnected' WHERE company_id = '${COMPANY_A}'`);
      await db.query(`INSERT INTO public.xero_connections (company_id, tenant_id, status) VALUES ('${COMPANY_B}', 'shared', 'active')`);
    });

    test('the migration can be re-applied', async () => {
      await db.exec(MIGRATION);
      const [{ triggers }] = await rows(`
        SELECT count(*)::int AS triggers FROM pg_trigger
         WHERE tgname IN ('invoices_xero_guard', 'invoices_xero_enqueue', 'customers_xero_guard', 'customers_xero_enqueue')
      `);
      assert.equal(triggers, 4);
    });
  });
});
