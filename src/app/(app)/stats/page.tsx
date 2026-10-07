"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ExportButtons from "@/components/ExportButtons";

import type {
  LeaveEntry,
  LocationLabel,
  Profile,
  TimeEntry,
} from "@/types/database";

import {
  diffSeconds,
  formatDuration,
  todayIsoDate,
} from "@/lib/utils/time";

import {
  calculateAverageDay,
  calculateBalance,
  calculateLongestDay,
  calculateOvertimeSeconds,
  calculateShortestDay,
  buildMonthlySummary,
  countWorkedDays,
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

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      const p = (profileData as Profile | null) ?? null;
      setProfile(p);

      const [{ data: entryData }, { data: leaveData }] = await Promise.all([
        supabase
          .from("time_entries")
          .select("*")
          .eq("user_id", user.id)
          .order("entry_date", { ascending: true }),
        supabase.from("leave_entries").select("*").eq("user_id", user.id),
      ]);

      setEntries((entryData as TimeEntry[]) ?? []);
      setLeaveEntries((leaveData as LeaveEntry[]) ?? []);
      setLoading(false);
    }

    load();
  }, []);

  if (loading) return <p className="text-[14px] text-ink-muted-48">Wczytywanie...</p>;
  if (!profile) return <p className="text-[14px] text-danger">Nie udało się wczytać danych.</p>;

  const today = todayIsoDate(profile.timezone);
  const weekStart = startOfIsoWeekStr(today);
  const weekEnd = endOfIsoWeekStr(today);
  const monthStart = startOfMonthStr(today);
  const monthEnd = endOfMonthStr(today);
  const currentYear = today.slice(0, 4);

  const dailySeconds = diffSeconds(
    `2000-01-01T${profile.standard_start_time}`,
    `2000-01-01T${profile.standard_end_time}`
  );

  const monthEntries = entries.filter((e) => e.entry_date >= monthStart && e.entry_date <= monthEnd);
  const yearEntries = entries.filter((e) => e.entry_date.startsWith(currentYear));

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

  const monthOvertime = calculateOvertimeSeconds(monthEntries, dailySeconds);
  const yearOvertime = calculateOvertimeSeconds(yearEntries, dailySeconds);
  const averageDay = calculateAverageDay(monthEntries);
  const workedDays = countWorkedDays(monthEntries);
  const longestDay = calculateLongestDay(monthEntries);
  const shortestDay = calculateShortestDay(monthEntries);
  const balance = calculateBalance(monthWorked, monthTarget);
  const monthlySummary = buildMonthlySummary(entries, dailySeconds);

  const summaryRows = Object.entries(monthlySummary)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 12);

  const byLocation: Partial<Record<LocationLabel, number>> = {};
  monthEntries.forEach((entry) => {
    const seconds = entry.end_time ? diffSeconds(entry.start_time, entry.end_time) : 0;
    byLocation[entry.location_label] = (byLocation[entry.location_label] ?? 0) + seconds;
  });
  const locationRows = Object.entries(byLocation) as [LocationLabel, number][];

  return (
    <div className="space-y-6">
      <h1 className="display text-[22px] font-semibold text-ink">Statystyki</h1>

      <StatSummaryCard title="Ten tydzień" worked={weekWorked} target={weekTarget} leaveSeconds={weekLeave} />
      <StatSummaryCard title="Ten miesiąc" worked={monthWorked} target={monthTarget} leaveSeconds={monthLeave} />

      <div className="grid gap-3 md:grid-cols-2">
        <InfoCard title="Nadgodziny miesiąca" value={formatDuration(monthOvertime)} />
        <InfoCard title="Nadgodziny roku" value={formatDuration(yearOvertime)} />
        <InfoCard
          title="Bilans miesiąca"
          value={`${balance >= 0 ? "+" : "-"} ${formatDuration(Math.abs(balance))}`}
        />
        <InfoCard title="Średnia dzienna" value={formatDuration(averageDay)} />
        <InfoCard title="Dni pracy" value={String(workedDays)} />
      </div>

      <ExportButtons
        entries={monthEntries}
        leaveEntries={leaveEntries}
        monthName={monthStart.slice(0, 7)}
      />

      <div className="rounded-lg border border-hairline bg-canvas p-5">
        <h2 className="mb-3 text-[15px] text-ink">Rekordy miesiąca</h2>
        <div className="space-y-2 text-[14px] text-ink-muted-80">
          <p>
            Najdłuższy dzień:
            <span className="ml-2 tabular-nums text-ink">{formatDuration(longestDay.seconds)}</span>
            <span className="ml-2 text-ink-muted-48">{longestDay.date}</span>
          </p>
          <p>
            Najkrótszy dzień:
            <span className="ml-2 tabular-nums text-ink">{formatDuration(shortestDay.seconds)}</span>
            <span className="ml-2 text-ink-muted-48">{shortestDay.date}</span>
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-hairline bg-canvas p-5">
        <h2 className="mb-3 text-[15px] text-ink">Historia miesięczna</h2>
        <div>
          {summaryRows.map(([month, summary]) => (
            <div
              key={month}
              className="flex items-center justify-between border-b border-hairline py-2.5 last:border-b-0"
            >
              <div>
                <p className="text-[14px] text-ink">{month}</p>
                <p className="text-[12px] text-ink-muted-48">{summary.workedDays} dni pracy</p>
              </div>
              <div className="text-right">
                <p className="tabular-nums text-[14px] text-ink">{formatDuration(summary.worked)}</p>
                <p className="text-[12px] text-primary">+{formatDuration(summary.overtime)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-hairline bg-canvas p-5">
        <h2 className="mb-3 text-[15px] text-ink">Lokalizacje (miesiąc)</h2>
        {locationRows.length === 0 ? (
          <p className="text-[14px] text-ink-muted-48">Brak danych.</p>
        ) : (
          <ul className="space-y-2.5">
            {locationRows.map(([label, seconds]) => (
              <li key={label} className="flex items-center justify-between">
                <LocationBadge label={label} />
                <span className="tabular-nums text-[14px] text-ink-muted-80">
                  {formatDuration(seconds)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-hairline bg-canvas p-4">
      <p className="text-[12px] text-ink-muted-48">{title}</p>
      <p className="display mt-1.5 text-[19px] font-semibold tabular-nums text-ink">{value}</p>
    </div>
  );
}
