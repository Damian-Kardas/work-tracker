-- =========================================================
-- Dziennik wyslanych powiadomien push - zeby kazde przypomnienie
-- (start / koniec / limit nadgodzin) poszlo maksymalnie raz dziennie,
-- niezaleznie od tego jak czesto cron wywoluje endpoint.
-- Uruchom w Supabase: SQL Editor -> New query -> wklej -> Run
-- =========================================================

create table if not exists public.push_log (
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,
  day date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, kind, day)
);

-- RLS wlaczone i brak polityk = dostep tylko dla klucza service_role (endpoint crona)
alter table public.push_log enable row level security;
