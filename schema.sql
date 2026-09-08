-- schema.sql
-- Ken Cordele Griffin Academy — current site operations
-- Project: lhqzybazpqukqojyasoz
-- Run in Supabase → SQL Editor (whole file).
--
-- Live app tables:
--   profiles     issued users (admin create, login, ledger)
--   desk_states  week / map / five-line / hours
--   memos        binder
--   notifications  in-app alerts
--
-- Admins (hardcoded in the site):
--   ceo@kengriffin.courses
--   admissions@kengriffin.courses

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Helper
-- ---------------------------------------------------------------------------
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

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles  (js/auth.js upsert + list + update)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  name          text,
  email         text unique,
  role          text not null default 'participant'
                  check (role in ('admin', 'participant')),
  track         text default 'Foundations of the Market',
  active        boolean not null default true,
  created_by    text,
  week          int not null default 1 check (week between 1 and 8),
  admin_notes   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.profiles add column if not exists week int;
alter table public.profiles add column if not exists admin_notes text;
alter table public.profiles add column if not exists updated_at timestamptz default now();

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
revoke all on public.profiles from anon, public;
grant select, insert, update, delete on public.profiles to authenticated;

drop policy if exists "read profiles" on public.profiles;
drop policy if exists "insert profiles" on public.profiles;
drop policy if exists "update profiles" on public.profiles;
drop policy if exists "profiles_select" on public.profiles;
drop policy if exists "profiles_insert" on public.profiles;
drop policy if exists "profiles_update" on public.profiles;
drop policy if exists "profiles_delete" on public.profiles;

create policy "profiles_select" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id or public.is_academy_admin());

create policy "profiles_insert" on public.profiles
  for insert to authenticated
  with check (public.is_academy_admin() or (select auth.uid()) = id);

create policy "profiles_update" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id or public.is_academy_admin())
  with check ((select auth.uid()) = id or public.is_academy_admin());

create policy "profiles_delete" on public.profiles
  for delete to authenticated
  using (public.is_academy_admin());

-- ---------------------------------------------------------------------------
-- desk_states  (js/desk.js seed: week, done, five, hours)
-- ---------------------------------------------------------------------------
create table if not exists public.desk_states (
  user_id     uuid primary key references public.profiles(id) on delete cascade,
  week        int not null default 1 check (week between 1 and 8),
  done        jsonb not null default '{}'::jsonb,
  five        jsonb not null default '{}'::jsonb,
  hours       text,
  updated_at  timestamptz not null default now()
);

alter table public.desk_states enable row level security;
revoke all on public.desk_states from anon, public;
grant select, insert, update on public.desk_states to authenticated;

drop policy if exists "desk_select" on public.desk_states;
drop policy if exists "desk_insert" on public.desk_states;
drop policy if exists "desk_update" on public.desk_states;

create policy "desk_select" on public.desk_states
  for select to authenticated
  using ((select auth.uid()) = user_id or public.is_academy_admin());

create policy "desk_insert" on public.desk_states
  for insert to authenticated
  with check ((select auth.uid()) = user_id or public.is_academy_admin());

create policy "desk_update" on public.desk_states
  for update to authenticated
  using ((select auth.uid()) = user_id or public.is_academy_admin())
  with check ((select auth.uid()) = user_id or public.is_academy_admin());

-- ---------------------------------------------------------------------------
-- memos  (binder)
-- ---------------------------------------------------------------------------
create table if not exists public.memos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  body        jsonb not null default '{}'::jsonb,
  status      text not null default 'Draft'
                check (status in ('Draft', 'Submitted', 'Returned')),
  created_at  timestamptz not null default now()
);

create index if not exists memos_user_id_idx on public.memos (user_id, created_at desc);

alter table public.memos enable row level security;
revoke all on public.memos from anon, public;
grant select, insert, update, delete on public.memos to authenticated;

drop policy if exists "memos_select" on public.memos;
drop policy if exists "memos_insert" on public.memos;
drop policy if exists "memos_update" on public.memos;
drop policy if exists "memos_delete" on public.memos;

create policy "memos_select" on public.memos
  for select to authenticated
  using ((select auth.uid()) = user_id or public.is_academy_admin());

create policy "memos_insert" on public.memos
  for insert to authenticated
  with check ((select auth.uid()) = user_id or public.is_academy_admin());

create policy "memos_update" on public.memos
  for update to authenticated
  using ((select auth.uid()) = user_id or public.is_academy_admin())
  with check ((select auth.uid()) = user_id or public.is_academy_admin());

create policy "memos_delete" on public.memos
  for delete to authenticated
  using ((select auth.uid()) = user_id or public.is_academy_admin());

-- ---------------------------------------------------------------------------
-- notifications  (priority-task alerts)
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  kind        text not null default 'done',
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists notifications_user_id_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;
revoke all on public.notifications from anon, public;
grant select, insert, update, delete on public.notifications to authenticated;

drop policy if exists "notes_select" on public.notifications;
drop policy if exists "notes_insert" on public.notifications;
drop policy if exists "notes_update" on public.notifications;
drop policy if exists "notes_delete" on public.notifications;

create policy "notes_select" on public.notifications
  for select to authenticated
  using ((select auth.uid()) = user_id or public.is_academy_admin());

create policy "notes_insert" on public.notifications
  for insert to authenticated
  with check ((select auth.uid()) = user_id or public.is_academy_admin());

create policy "notes_update" on public.notifications
  for update to authenticated
  using ((select auth.uid()) = user_id or public.is_academy_admin())
  with check ((select auth.uid()) = user_id or public.is_academy_admin());

create policy "notes_delete" on public.notifications
  for delete to authenticated
  using ((select auth.uid()) = user_id or public.is_academy_admin());
