-- Ken Cordele Griffin Academy — schema + RLS
-- Run in Supabase → SQL Editor

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text unique,
  role text not null default 'participant',
  track text,
  active boolean not null default true,
  created_by text,
  created_at timestamptz not null default now(),
  week int default 1,
  admin_notes text
);

alter table public.profiles add column if not exists week int default 1;
alter table public.profiles add column if not exists admin_notes text;

alter table public.profiles enable row level security;
revoke all on public.profiles from anon;
grant select, insert, update on public.profiles to authenticated;

-- Emails that may govern every row
create or replace function public.is_academy_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''))
    in ('ceo@kengriffin.courses', 'admissions@kengriffin.courses');
$$;

drop policy if exists "read profiles" on public.profiles;
drop policy if exists "insert profiles" on public.profiles;
drop policy if exists "update profiles" on public.profiles;
drop policy if exists "profiles_select" on public.profiles;
drop policy if exists "profiles_insert" on public.profiles;
drop policy if exists "profiles_update" on public.profiles;
drop policy if exists "profiles_delete" on public.profiles;

-- Read: own row, or any row if academy admin
create policy "profiles_select"
on public.profiles for select
to authenticated
using (
  (select auth.uid()) = id
  or public.is_academy_admin()
);

-- Insert: admin may issue any profile; a user may insert only their own id
create policy "profiles_insert"
on public.profiles for insert
to authenticated
with check (
  public.is_academy_admin()
  or (select auth.uid()) = id
);

-- Update: participant may edit own name/track only via app;
-- admin may edit every column on every row
create policy "profiles_update"
on public.profiles for update
to authenticated
using (
  (select auth.uid()) = id
  or public.is_academy_admin()
)
with check (
  (select auth.uid()) = id
  or public.is_academy_admin()
);

-- Delete: admin only
create policy "profiles_delete"
on public.profiles for delete
to authenticated
using (public.is_academy_admin());

-- Auth: turn OFF "Confirm email" so issued participants can sign in at once.
