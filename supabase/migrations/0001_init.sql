-- =========================================================
-- Work Tracker - schemat poczatkowy
-- Uruchom w Supabase: SQL Editor -> New query -> wklej -> Run
-- =========================================================

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  standard_start_time time not null default '08:00',
  standard_end_time time not null default '16:00',
  work_days int[] not null default '{1,2,3,4,5}', -- 1=poniedzialek ... 7=niedziela
  annual_leave_days numeric not null default 26,
  timezone text not null default 'Europe/Warsaw',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- Automatyczne utworzenie profilu przy rejestracji uzytkownika
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- time_entries ----------
create table if not exists public.time_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_date date not null default (now() at time zone 'Europe/Warsaw')::date,
  start_time timestamptz not null,
  end_time timestamptz,
  start_lat double precision,
  start_lng double precision,
  end_lat double precision,
  end_lng double precision,
  location_label text not null default 'Biuro'
    check (location_label in ('Biuro', 'Home office', 'Targi / wyjazd', 'Inne')),
  notes text,
  is_edited boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists time_entries_user_date_idx
  on public.time_entries (user_id, entry_date desc);

-- tylko jeden otwarty (bez end_time) wpis na uzytkownika naraz
create unique index if not exists time_entries_one_open_per_user
  on public.time_entries (user_id)
  where end_time is null;

alter table public.time_entries enable row level security;

create policy "time_entries_all_own" on public.time_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists time_entries_set_updated_at on public.time_entries;
create trigger time_entries_set_updated_at
  before update on public.time_entries
  for each row execute procedure public.set_updated_at();

-- ---------- leave_entries ----------
create table if not exists public.leave_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  start_date date not null,
  end_date date not null,
  days_count numeric not null,
  leave_type text not null default 'Wypoczynkowy'
    check (leave_type in ('Wypoczynkowy', 'Na zadanie', 'Okolicznosciowy', 'Inne')),
  notes text,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create index if not exists leave_entries_user_idx
  on public.leave_entries (user_id, start_date desc);

alter table public.leave_entries enable row level security;

create policy "leave_entries_all_own" on public.leave_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- push_subscriptions ----------
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  subscription jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

create policy "push_subscriptions_all_own" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
