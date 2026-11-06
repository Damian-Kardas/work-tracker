-- =========================================================
-- Nowy typ nieobecnosci: zwolnienie lekarskie ('Zwolnienie')
-- Uruchom w Supabase: SQL Editor -> New query -> wklej -> Run
-- =========================================================

-- usun istniejace ograniczenie CHECK na kolumnie leave_type (niezaleznie od jego nazwy)
do $$
declare
  c record;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.leave_entries'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%leave_type%'
  loop
    execute format('alter table public.leave_entries drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.leave_entries
  add constraint leave_entries_leave_type_check
  check (leave_type in ('Wypoczynkowy', 'Na zadanie', 'Okolicznosciowy', 'Inne', 'Zwolnienie'));
