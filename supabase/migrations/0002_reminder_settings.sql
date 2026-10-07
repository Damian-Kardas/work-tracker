-- =========================================================
-- Ustawienia przypomnien i limitu nadgodzin
-- Uruchom w Supabase: SQL Editor -> New query -> wklej -> Run
-- =========================================================

alter table public.profiles
  add column if not exists reminder_start_enabled boolean not null default true,
  add column if not exists reminder_end_enabled boolean not null default true,
  add column if not exists overtime_cap_enabled boolean not null default false,
  add column if not exists overtime_cap_hours numeric not null default 9.5;
