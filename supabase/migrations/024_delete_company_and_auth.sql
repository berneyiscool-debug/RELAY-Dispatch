-- =====================================================================
-- DELETE COMPANY (cascade + auth cleanup)
-- =====================================================================
-- The old "Delete Company Profile" only deleted the companies row and let
-- Postgres cascade to tenant data. It never touched Supabase Auth, so the
-- login accounts in `auth.users` survived and their emails stayed
-- "already registered" forever.
--
-- This RPC fixes that: it deletes the company's login accounts (freeing the
-- emails for reuse) and then deletes the company row, which ON DELETE
-- CASCADE wipes every tenant table.
--
-- SECURITY DEFINER is required so the function can write to `auth.users`
-- (a normal authenticated role cannot) and bypass RLS. The explicit role
-- check at the top is therefore MANDATORY — only the company's admin may
-- run this.

create or replace function public.delete_company_and_auth(p_company_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  -- Authorization: only an admin of the TARGET company may delete it. RLS is
  -- bypassed by SECURITY DEFINER, so this check is the only guard.
  select role into v_role
    from profiles
   where id = auth.uid()
     and company_id = p_company_id;

  if v_role is distinct from 'admin' then
    raise exception 'Only the administrator of this company can delete it.';
  end if;

  -- Delete every login account belonging to the company. This frees the
  -- emails for reuse and cascades to `profiles` via profiles.id -> auth.users
  -- ON DELETE CASCADE.
  delete from auth.users
   where id in (select id from profiles where company_id = p_company_id);

  -- Delete the company row; every tenant table cascades with it.
  delete from companies where id = p_company_id;
end;
$$;

revoke execute on function public.delete_company_and_auth(uuid) from public;
revoke execute on function public.delete_company_and_auth(uuid) from anon;
grant  execute on function public.delete_company_and_auth(uuid) to authenticated;
