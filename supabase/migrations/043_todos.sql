-- =====================================================================
-- 043 — TO-DOS
-- =====================================================================
-- The dashboard's Daily To-Do card was a per-user localStorage blob
-- (src/pages/Dashboard.js), so a to-do could not be assigned to anyone, dated,
-- or linked to a job or a customer, and it disappeared with the browser
-- profile. The brny agent overhaul lets the assistant file and chase to-dos on
-- someone else's behalf, and that needs real, tenant-scoped rows.
--
-- The only writer is src/actions/todos.js, which sends exactly the columns
-- listed below. A new collection only reaches Postgres if TABLE_MAP and
-- TABLE_COLUMNS in src/data/store.js name it, because denormalizeRecord deletes
-- every key that is not in the whitelist before a cloud write, so this file
-- ships alongside that client change.
--
-- IMPORTANT: apply this migration in the same release as the client change.
-- There is no column-presence preflight to fall back on, so a project running
-- the new client against an un-migrated database would see to-do writes
-- rejected by PostgREST (404 on the missing table).
--
-- Additive only, no backfill: nothing existing is read or rewritten, and the
-- legacy localStorage to-dos are left untouched until the widget is switched
-- over to this collection.
--
-- Column notes:
--   assigned_to / created_by / completed_by are text, not uuid, matching
--     leads.assigned_to (040): an assignee can be a profile id or an actor id
--     such as the API actor brny runs as, and it is assigned_to_name that the
--     UI displays.
--   status ('open' | 'done') and record_type ('job' | 'customer' | null) are
--     left unconstrained on purpose, like portal_access_log.outcome in 042: a
--     new value should not need a migration, and src/actions/todos.js is the
--     only writer. `origin` records who filed it: 'brny' or 'ui'.
--   due_date is the calendar day the to-do is due (what the dashboard groups
--     by) and due_at is the exact instant (what "overdue" is measured against).
--     Both are nullable - an undated to-do is still a valid to-do.
--
-- Idempotent (IF NOT EXISTS throughout) so the file is re-runnable and safe to
-- apply to a project where it has already landed.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.todos (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id uuid REFERENCES companies ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  notes text DEFAULT '',
  status text DEFAULT 'open' NOT NULL,
  assigned_to text,
  assigned_to_name text,
  due_date date,
  due_at timestamp with time zone,
  record_type text,
  record_id text,
  record_label text,
  created_by text,
  created_by_name text,
  origin text DEFAULT 'ui' NOT NULL,
  completed_at timestamp with time zone,
  completed_by text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY has no IF NOT EXISTS, so the create is guarded by catalog
-- checks: re-runnable, and it leaves any existing policy of the same name alone.
-- Same shape as 029's password_reset_requests_tenant_policy, including the
-- second check - the policy body calls the tenant helper, so a project where 030
-- has not run is left with RLS on and no policy (unreachable by clients, which
-- is the safe direction), and 030 then creates both the helper and the policy.
DO $$
BEGIN
  IF to_regprocedure('public.get_user_company_id(uuid)') IS NOT NULL
     AND NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'todos'
      AND policyname = 'todos_tenant_policy'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY todos_tenant_policy ON public.todos
        FOR ALL TO authenticated
        USING (company_id = public.get_user_company_id(auth.uid()))
        WITH CHECK (company_id = public.get_user_company_id(auth.uid()));
    $policy$;
  END IF;
END $$;

-- The dashboard's "mine, overdue first" list: one tenant, ordered by due date.
CREATE INDEX IF NOT EXISTS todos_company_due_idx
  ON public.todos(company_id, due_date);

-- "What is on Dale's plate": one tenant, one assignee.
CREATE INDEX IF NOT EXISTS todos_company_assignee_idx
  ON public.todos(company_id, assigned_to);

-- ---------------------------------------------------------------------
-- VERIFY — every row should report is_present = true
-- ---------------------------------------------------------------------
WITH expected(tbl, col) AS (
  VALUES
    ('todos', 'id'),
    ('todos', 'company_id'),
    ('todos', 'title'),
    ('todos', 'notes'),
    ('todos', 'status'),
    ('todos', 'assigned_to'),
    ('todos', 'assigned_to_name'),
    ('todos', 'due_date'),
    ('todos', 'due_at'),
    ('todos', 'record_type'),
    ('todos', 'record_id'),
    ('todos', 'record_label'),
    ('todos', 'created_by'),
    ('todos', 'created_by_name'),
    ('todos', 'origin'),
    ('todos', 'completed_at'),
    ('todos', 'completed_by'),
    ('todos', 'created_at'),
    ('todos', 'updated_at')
)
SELECT (e.tbl || '.' || e.col) AS object_name,
       (c.column_name IS NOT NULL) AS is_present
FROM expected e
LEFT JOIN information_schema.columns c
  ON c.table_schema = 'public'
 AND c.table_name = e.tbl
 AND c.column_name = e.col
UNION ALL
SELECT 'todos (table)',
       (to_regclass('public.todos') IS NOT NULL);
