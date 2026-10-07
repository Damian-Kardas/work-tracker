"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { LocationLabel, Profile, TimeEntry } from "@/types/database";
import { diffSeconds, formatDate, formatDuration, formatHm, todayIsoDate } from "@/lib/utils/time";
import { addDaysIso } from "@/lib/utils/stats";
import LocationBadge from "@/components/LocationBadge";
import EntryEditModal from "@/components/EntryEditModal";

const LOCATION_OPTIONS: LocationLabel[] = ["Biuro", "Home office", "Targi / wyjazd", "Inne"];

export default function HistoryPage() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalEntry, setModalEntry] = useState<TimeEntry | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<LocationLabel | "all">("all");

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return setLoading(false);

    const [{ data }, { data: profileData }] = await Promise.all([
      supabase
        .from("time_entries")
        .select("*")
        .order("start_time", { ascending: false })
        .limit(200),
      supabase.from("profiles").select("*").eq("id", userData.user.id).single(),
    ]);

    setEntries((data as TimeEntry[]) ?? []);
    setProfile((profileData as Profile | null) ?? null);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const today = todayIsoDate(profile?.timezone ?? "Europe/Warsaw");
  const yesterday = addDaysIso(today, -1);

  const dailyTarget = profile
    ? diffSeconds(`2000-01-01T${profile.standard_start_time}`, `2000-01-01T${profile.standard_end_time}`)
    : 0;

  const counts = useMemo(() => {
    const result: Record<string, number> = {};
    entries.forEach((e) => {
      result[e.location_label] = (result[e.location_label] ?? 0) + 1;
    });
    return result;
  }, [entries]);

  const filtered = filter === "all" ? entries : entries.filter((e) => e.location_label === filter);

  const grouped = filtered.reduce<Record<string, TimeEntry[]>>((acc, e) => {
    (acc[e.entry_date] ??= []).push(e);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  function dayBadge(date: string) {
    if (date === today) return "DZIŚ";
    if (date === yesterday) return "WCZORAJ";
    return null;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="display text-[22px] font-semibold text-ink">Historia</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="press-scale rounded-pill bg-primary px-4 py-2 text-[14px] font-medium text-white"
        >
          + Wpis ręczny
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <FilterPill active={filter === "all"} onClick={() => setFilter("all")}>
          Wszystkie ({entries.length})
        </FilterPill>
        {LOCATION_OPTIONS.filter((opt) => counts[opt]).map((opt) => (
          <FilterPill key={opt} active={filter === opt} onClick={() => setFilter(opt)}>
            {opt} ({counts[opt]})
          </FilterPill>
        ))}
      </div>

      {loading && <p className="text-[14px] text-ink-muted-48">Wczytywanie...</p>}
      {!loading && sortedDates.length === 0 && (
        <p className="text-[14px] text-ink-muted-48">
          Brak wpisów. Kliknij &quot;Wpis ręczny&quot;, żeby uzupełnić historię.
        </p>
      )}

      <div className="space-y-3">
        {sortedDates.map((date) => {
          const dayEntries = grouped[date];
          const dayWorked = dayEntries.reduce(
            (sum, e) => sum + (e.end_time ? diffSeconds(e.start_time, e.end_time) : 0),
            0
          );
          const overtime = dailyTarget > 0 ? Math.max(0, dayWorked - dailyTarget) : 0;
          const badge = dayBadge(date);
          const firstStart = dayEntries[dayEntries.length - 1].start_time;
          const lastEnd = dayEntries[0].end_time;

          return (
            <div
              key={date}
              className="relative overflow-hidden rounded-lg border border-hairline bg-canvas p-5 pl-6"
            >
              <span className="absolute left-0 top-0 h-full w-1.5 bg-primary" />

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {badge && (
                    <span className="rounded-pill bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                      {badge}
                    </span>
                  )}
                  <span className="text-[14px] font-medium text-ink">{formatDate(date)}</span>
                </div>
                {overtime > 0 && (
                  <span className="rounded-pill bg-[#e6f4ea] px-2 py-0.5 text-[11px] font-semibold text-[#1e7e34]">
                    +{formatDuration(overtime)} nadgodzin
                  </span>
                )}
              </div>

              <p className="display mt-2 text-[28px] font-bold tabular-nums text-ink">
                {formatDuration(dayWorked)}
              </p>

              <p className="mt-1 flex items-center gap-1.5 text-[13px] text-ink-muted-48">
                <IconClock />
                {formatHm(new Date(firstStart))} – {lastEnd ? formatHm(new Date(lastEnd)) : "w toku"}
              </p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {Array.from(new Set(dayEntries.map((e) => e.location_label))).map((label) => (
                  <LocationBadge key={label} label={label} />
                ))}
              </div>

              <div className="mt-3 divide-y divide-hairline border-t border-hairline">
                {dayEntries.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => setModalEntry(e)}
                    className="flex w-full items-center justify-between py-2.5 text-left"
                  >
                    <span className="text-[13px] tabular-nums text-ink-muted-80">
                      {formatHm(new Date(e.start_time))} – {e.end_time ? formatHm(new Date(e.end_time)) : "w toku"}
                    </span>
                    <span className="flex items-center gap-2 text-[12px] text-ink-muted-48">
                      {e.is_edited && "edytowano"}
                      {e.notes && <IconNote />}
                      <IconPencil />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {(modalEntry || showAdd) && (
        <EntryEditModal
          entry={modalEntry}
          onClose={(changed) => {
            setModalEntry(null);
            setShowAdd(false);
            if (changed) load();
          }}
        />
      )}
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`press-scale shrink-0 rounded-pill px-3.5 py-1.5 text-[13px] font-medium ${
        active ? "bg-primary text-white" : "bg-parchment text-ink-muted-80"
      }`}
    >
      {children}
    </button>
  );
}

function IconClock() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8v4.2l3 2" />
    </svg>
  );
}

function IconPencil() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" />
    </svg>
  );
}

function IconNote() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h12l4 4v12H4z" />
      <path d="M8 10h8" />
      <path d="M8 14h5" />
    </svg>
  );
}
