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

import type {
  Profile,
  TimeEntry,
} from "@/types/database";

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

  const profile =
    (profileData as Profile | null) ?? null;

  const today = todayIsoDate(
    profile?.timezone ??
      "Europe/Warsaw"
  );

  const monthStart =
    startOfMonthStr(today);

  const monthEnd =
    endOfMonthStr(today);

  const { data: openEntryRows } =
    await supabase
      .from("time_entries")
      .select("*")
      .eq("user_id", user!.id)
      .is("end_time", null)
      .limit(1);

  const openEntry =
    (openEntryRows?.[0] as
      | TimeEntry
      | undefined) ?? null;

  const { data: todayEntries } =
    await supabase
      .from("time_entries")
      .select("*")
      .eq("user_id", user!.id)
      .eq("entry_date", today)
      .order("start_time", {
        ascending: true,
      });

  const entries =
    (todayEntries as TimeEntry[]) ??
    [];

  const { data: monthEntriesData } =
    await supabase
      .from("time_entries")
      .select("*")
      .eq("user_id", user!.id)
      .gte(
        "entry_date",
        monthStart
      )
      .lte(
        "entry_date",
        monthEnd
      );

  const monthEntries =
    (monthEntriesData as TimeEntry[]) ??
    [];

  const closedToday =
    entries.filter(
      (e) => e.end_time
    );

  const todaySeconds =
    closedToday.reduce(
      (sum, e) =>
        sum +
        diffSeconds(
          e.start_time,
          e.end_time as string
        ),
      0
    );

  const dailyTarget =
    profile
      ? diffSeconds(
          `2000-01-01T${profile.standard_start_time}`,
          `2000-01-01T${profile.standard_end_time}`
        )
      : 0;

  const monthWorked =
    monthEntries.reduce(
      (sum, entry) => {
        if (!entry.end_time)
          return sum;

        return (
          sum +
          diffSeconds(
            entry.start_time,
            entry.end_time
          )
        );
      },
      0
    );

  const monthTarget =
    dailyTarget *
    countWorkDaysInRange(
      monthStart,
      monthEnd,
      profile?.work_days ??
        [1, 2, 3, 4, 5]
    );

  const overtime =
    calculateOvertimeSeconds(
      monthEntries,
      dailyTarget
    );

  const averageDay =
    calculateAverageDay(
      monthEntries
    );

  const workedDays =
    countWorkedDays(
      monthEntries
    );

  const balance =
    calculateBalance(
      monthWorked,
      monthTarget
    );

  const remaining =
    Math.max(
      0,
      monthTarget -
        monthWorked
    );

  return (
    <div className="space-y-6">
      <StopwatchCard
        openEntry={openEntry}
      />

      <div className="grid grid-cols-2 gap-3">
        <MiniCard
          title="Miesiąc"
          value={formatDuration(
            monthWorked
          )}
        />

        <MiniCard
          title="Nadgodziny"
          value={formatDuration(
            overtime
          )}
        />

        <MiniCard
          title="Bilans"
          value={`${
            balance >= 0
              ? "+"
              : "-"
          } ${formatDuration(
            Math.abs(balance)
          )}`}
          positive={
            balance >= 0
          }
        />

        <MiniCard
          title="Średnia"
          value={formatDuration(
            averageDay
          )}
        />

        <MiniCard
          title="Do normy"
          value={formatDuration(
            remaining
          )}
        />

        <MiniCard
          title="Dni pracy"
          value={String(
            workedDays
          )}
        />
      </div>

      <div className="rounded-card border border-ink-700 bg-ink-800 p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <p className="text-sm text-paper-100">
            Dzisiaj
          </p>

          <p className="font-mono text-sm text-paper-500">
            {formatDuration(
              todaySeconds
            )}

            {dailyTarget > 0 && (
              <span>
                {" "}
                /{" "}
                {formatDuration(
                  dailyTarget
                )}
              </span>
            )}
          </p>
        </div>

        {entries.length === 0 ? (
          <p className="text-sm text-paper-500">
            Brak wpisów na
            dzisiaj.
          </p>
        ) : (
          <ul className="space-y-2">
            {entries.map(
              (entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="font-mono text-paper-300">
                    {formatHm(
                      new Date(
                        entry.start_time
                      )
                    )}{" "}
                    -{" "}
                    {entry.end_time
                      ? formatHm(
                          new Date(
                            entry.end_time
                          )
                        )
                      : "..."}
                  </span>

                  <LocationBadge
                    label={
                      entry.location_label
                    }
                  />
                </li>
              )
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

function MiniCard({
  title,
  value,
  positive = true,
}: {
  title: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-card border border-ink-700 bg-ink-800 p-4">
      <p className="text-xs text-paper-500">
        {title}
      </p>

      <p
        className={`mt-2 font-mono text-lg font-semibold ${
          positive
            ? "text-amber-400"
            : "text-brick-400"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
