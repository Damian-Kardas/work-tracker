import { createClient } from "@/lib/supabase/server";

import StopwatchCard from "@/components/StopwatchCard";
import LocationBadge from "@/components/LocationBadge";

import {
  diffSeconds,
  formatDuration,
  formatHm,
  todayIsoDate,
} from "@/lib/utils/time";

import {
  calculateAverageDay,
  calculateBalance,
  calculateOvertimeSeconds,
  countWorkedDays,
  countWorkDaysInRange,
  endOfMonthStr,
  startOfMonthStr,
} from "@/lib/utils/stats";

import type { Profile, TimeEntry } from "@/types/database";

export default async function DashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  const profile = (profileData as Profile | null) ?? null;

  const today = todayIsoDate(profile?.timezone ?? "Europe/Warsaw");
  const monthStart = startOfMonthStr(today);
  const monthEnd = endOfMonthStr(today);

  const { data: openEntryRows } = await supabase
    .from("time_entries")
    .select("*")
    .eq("user_id", user!.id)
    .is("end_time", null)
    .limit(1);

  const openEntry = (openEntryRows?.[0] as TimeEntry | undefined) ?? null;

  const { data: todayEntries } = await supabase
    .from("time_entries")
    .select("*")
    .eq("user_id", user!.id)
    .eq("entry_date", today)
    .order("start_time", { ascending: true });

  const entries = (todayEntries as TimeEntry[]) ?? [];

  const { data: monthEntriesData } = await supabase
    .from("time_entries")
    .select("*")
    .eq("user_id", user!.id)
    .gte("entry_date", monthStart)
    .lte("entry_date", monthEnd);

  const monthEntries = (monthEntriesData as TimeEntry[]) ?? [];

  const closedToday = entries.filter((e) => e.end_time);
  const todaySeconds = closedToday.reduce(
    (sum, e) => sum + diffSeconds(e.start_time, e.end_time as string),
    0
  );

  const dailyTarget = profile
    ? diffSeconds(
        `2000-01-01T${profile.standard_start_time}`,
        `2000-01-01T${profile.standard_end_time}`
      )
    : 0;

  const monthWorked = monthEntries.reduce((sum, entry) => {
    if (!entry.end_time) return sum;
    return sum + diffSeconds(entry.start_time, entry.end_time);
  }, 0);

  const monthTarget =
    dailyTarget *
    countWorkDaysInRange(monthStart, monthEnd, profile?.work_days ?? [1, 2, 3, 4, 5]);

  const overtime = calculateOvertimeSeconds(monthEntries, dailyTarget);
  const averageDay = calculateAverageDay(monthEntries);
  const workedDays = countWorkedDays(monthEntries);
  const balance = calculateBalance(monthWorked, monthTarget);
  const remaining = Math.max(0, monthTarget - monthWorked);

  return (
    <div className="space-y-8">
      <StopwatchCard openEntry={openEntry} />

      <div className="grid grid-cols-2 gap-3">
        <MiniCard title="Miesiąc" value={formatDuration(monthWorked)} />
        <MiniCard title="Nadgodziny" value={formatDuration(overtime)} />
        <MiniCard
          title="Bilans"
          value={`${balance >= 0 ? "+" : "-"} ${formatDuration(Math.abs(balance))}`}
        />
        <MiniCard title="Średnia" value={formatDuration(averageDay)} />
        <MiniCard title="Do normy" value={formatDuration(remaining)} />
        <MiniCard title="Dni pracy" value={String(workedDays)} />
      </div>

      <div className="rounded-lg border border-hairline bg-canvas p-5">
        <div className="mb-3 flex items-baseline justify-between">
          <p className="text-[15px] text-ink">Dzisiaj</p>
          <p className="text-[14px] tabular-nums text-ink-muted-48">
            {formatDuration(todaySeconds)}
            {dailyTarget > 0 && <span> / {formatDuration(dailyTarget)}</span>}
          </p>
        </div>

        {entries.length === 0 ? (
          <p className="text-[14px] text-ink-muted-48">Brak wpisów na dzisiaj.</p>
        ) : (
          <ul>
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between border-b border-hairline py-2.5 last:border-b-0"
              >
                <span className="text-[14px] tabular-nums text-ink">
                  {formatHm(new Date(entry.start_time))} -{" "}
                  {entry.end_time ? formatHm(new Date(entry.end_time)) : "..."}
                </span>
                <LocationBadge label={entry.location_label} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function MiniCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-hairline bg-canvas p-4">
      <p className="text-[12px] text-ink-muted-48">{title}</p>
      <p className="display mt-1.5 text-[19px] font-semibold tabular-nums text-ink">{value}</p>
    </div>
  );
}
