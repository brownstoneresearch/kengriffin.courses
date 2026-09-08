-- Run in Supabase → SQL Editor

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text unique,
  role text not null default 'participant',
  track text,
  active boolean not null default true,
  created_by text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "read profiles" on public.profiles;
create policy "read profiles" on public.profiles
  for select to authenticated using (true);

drop policy if exists "insert profiles" on public.profiles;
create policy "insert profiles" on public.profiles
  for insert to authenticated with check (true);

drop policy if exists "update profiles" on public.profiles;
create policy "update profiles" on public.profiles
  for update to authenticated using (true);

-- Auth: Authentication → Providers → Email
-- Turn OFF "Confirm email" so issued participants can sign in at once.
