"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { LeaveEntry, LocationLabel, Profile, TimeEntry } from "@/types/database";
import { diffSeconds, formatDuration, todayIsoDate } from "@/lib/utils/time";
import {
  countWorkDaysInRange,
  endOfIsoWeekStr,
  endOfMonthStr,
  leaveSecondsInRange,
  startOfIsoWeekStr,
  startOfMonthStr,
} from "@/lib/utils/stats";
import StatSummaryCard from "@/components/StatSummaryCard";
import LocationBadge from "@/components/LocationBadge";

export default function StatsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [leaveEntries, setLeaveEntries] = useState<LeaveEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return setLoading(false);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userData.user.id)
        .single();
      const p = (profileData as Profile | null) ?? null;
      setProfile(p);

      const today = todayIsoDate(p?.timezone ?? "Europe/Warsaw");
      const monthStart = startOfMonthStr(today);
      const weekStart = startOfIsoWeekStr(today);
      const queryStart = weekStart < monthStart ? weekStart : monthStart;

      const [{ data: entryData }, { data: leaveData }] = await Promise.all([
        supabase
          .from("time_entries")
          .select("*")
          .eq("user_id", userData.user.id)
          .gte("entry_date", monthStart)
          .order("entry_date", { ascending: true }),
        supabase
          .from("leave_entries")
          .select("*")
          .eq("user_id", userData.user.id)
          .gte("end_date", queryStart),
      ]);

      setEntries((entryData as TimeEntry[]) ?? []);
      setLeaveEntries((leaveData as LeaveEntry[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <p className="text-sm text-paper-500">Wczytywanie...</p>;
  if (!profile) return <p className="text-sm text-brick-400">Nie udało się wczytać danych.</p>;

  const today = todayIsoDate(profile.timezone);
  const weekStart = startOfIsoWeekStr(today);
  const weekEnd = endOfIsoWeekStr(today);
  const monthStart = startOfMonthStr(today);
  const monthEnd = endOfMonthStr(today);

  const dailySeconds = diffSeconds(
    `2000-01-01T${profile.standard_start_time}`,
    `2000-01-01T${profile.standard_end_time}`
  );

  function sumSeconds(fromDate: string, toDate: string) {
    return entries
      .filter((e) => e.entry_date >= fromDate && e.entry_date <= toDate)
      .reduce((sum, e) => sum + diffSeconds(e.start_time, e.end_time ?? new Date().toISOString()), 0);
  }

  const weekWorkedActual = sumSeconds(weekStart, weekEnd);
  const weekLeave = leaveSecondsInRange(leaveEntries, weekStart, weekEnd, profile.work_days, dailySeconds);
  const weekWorked = weekWorkedActual + weekLeave;
  const weekTarget = dailySeconds * countWorkDaysInRange(weekStart, weekEnd, profile.work_days);

  const monthWorkedActual = sumSeconds(monthStart, monthEnd);
  const monthLeave = leaveSecondsInRange(leaveEntries, monthStart, monthEnd, profile.work_days, dailySeconds);
  const monthWorked = monthWorkedActual + monthLeave;
  const monthTarget = dailySeconds * countWorkDaysInRange(monthStart, monthEnd, profile.work_days);

  const byLocation: Partial<Record<LocationLabel, number>> = {};
  entries
    .filter((e) => e.entry_date >= monthStart && e.entry_date <= monthEnd)
    .forEach((e) => {
      const seconds = diffSeconds(e.start_time, e.end_time ?? new Date().toISOString());
      byLocation[e.location_label] = (byLocation[e.location_label] ?? 0) + seconds;
    });
  const locationRows = Object.entries(byLocation) as [LocationLabel, number][];

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-paper-100">Statystyki</h1>

      <StatSummaryCard title="Ten tydzień" worked={weekWorked} target={weekTarget} leaveSeconds={weekLeave} />
      <StatSummaryCard title="Ten miesiąc" worked={monthWorked} target={monthTarget} leaveSeconds={monthLeave} />

      <div className="rounded-card border border-ink-700 bg-ink-800 p-4">
        <p className="mb-3 text-sm text-paper-100">Podział wg lokalizacji (ten miesiąc)</p>
        {locationRows.length === 0 ? (
          <p className="text-sm text-paper-500">Brak danych w tym miesiącu.</p>
        ) : (
          <ul className="space-y-2">
            {locationRows.map(([label, seconds]) => (
              <li key={label} className="flex items-center justify-between text-sm">
                <LocationBadge label={label} />
                <span className="font-mono text-paper-300">{formatDuration(seconds)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
