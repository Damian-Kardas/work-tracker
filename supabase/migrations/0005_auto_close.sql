-- =========================================================
-- Automatyczne zakonczenie zapomnianego wpisu
-- Uruchom w Supabase: SQL Editor -> New query -> wklej -> Run
-- =========================================================

alter table public.profiles
  add column if not exists auto_close_enabled boolean not null default true,
  add column if not exists auto_close_time time not null default '23:00';

-- Oznacza wpisy zamkniete automatycznie (do sprawdzenia przez uzytkownika)
alter table public.time_entries
  add column if not exists auto_closed boolean not null default false;
