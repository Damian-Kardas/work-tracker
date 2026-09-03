import { createClient } from "@/lib/supabase/server";
import StopwatchCard from "@/components/StopwatchCard";
import LocationBadge from "@/components/LocationBadge";
import { diffSeconds, formatDuration, formatHm, todayIsoDate } from "@/lib/utils/time";
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
  const closedToday = entries.filter((e) => e.end_time);
  const todaySeconds = closedToday.reduce(
    (sum, e) => sum + diffSeconds(e.start_time, e.end_time as string),
    0
  );

  const standardHours = profile
    ? diffSeconds(`2000-01-01T${profile.standard_start_time}`, `2000-01-01T${profile.standard_end_time}`)
    : 0;

  return (
    <div className="space-y-6">
      <StopwatchCard openEntry={openEntry} />

      <div className="rounded-card border border-ink-700 bg-ink-800 p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <p className="text-sm text-paper-100">Dzisiaj</p>
          <p className="font-mono text-sm text-paper-500">
            {formatDuration(todaySeconds)}
            {standardHours > 0 && (
              <span className="text-paper-500"> / {formatDuration(standardHours)}</span>
            )}
          </p>
        </div>

        {entries.length === 0 ? (
          <p className="text-sm text-paper-500">Brak wpisow na dzisiaj.</p>
        ) : (
          <ul className="space-y-2">
            {entries.map((e) => (
              <li key={e.id} className="flex items-center justify-between text-sm">
                <span className="font-mono text-paper-300">
                  {formatHm(new Date(e.start_time))} -{" "}
                  {e.end_time ? formatHm(new Date(e.end_time)) : "..."}
                </span>
                <LocationBadge label={e.location_label} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
