"use client";

import { useMemo, useState } from "react";
import type { LeaveEntry, TimeEntry } from "@/types/database";
import { LEAVE_TYPE_LABELS } from "@/types/database";
import { diffSeconds, formatDuration, formatHm, formatDate, todayIsoDate } from "@/lib/utils/time";
import { addDaysIso } from "@/lib/utils/stats";
import LocationBadge from "./LocationBadge";

const WEEKS_SHOWN = 18;
const MONTH_NAMES_SHORT = [
  "Sty", "Lut", "Mar", "Kwi", "Maj", "Cze", "Lip", "Sie", "Wrz", "Paź", "Lis", "Gru",
];
const WEEKDAY_ROW_LABELS = ["Nd", "", "Wt", "", "Czw", "", "Sob"];

export default function ActivityCalendar({
  entries,
  leaveEntries,
  timezone,
}: {
  entries: TimeEntry[];
  leaveEntries: LeaveEntry[];
  timezone: string;
}) {
  const today = todayIsoDate(timezone);
  const [selected, setSelected] = useState<string>(today);

  const workedDates = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => {
      if (e.end_time) set.add(e.entry_date);
    });
    return set;
  }, [entries]);

  const leaveDates = useMemo(() => {
    const set = new Set<string>();
    leaveEntries.forEach((l) => {
      let cur = l.start_date;
      while (cur <= l.end_date) {
        set.add(cur);
        cur = addDaysIso(cur, 1);
      }
    });
    return set;
  }, [leaveEntries]);

  // Zbuduj siatke: kolumny = tygodnie, wiersze = Nd..Sob, zakonczona na dzisiejszej niedzieli-koncu tygodnia
  const todayWeekday = new Date(today + "T00:00:00Z").getUTCDay(); // 0 = niedziela
  const gridEnd = addDaysIso(today, 6 - todayWeekday); // najblizsza sobota >= dzis
  const gridStart = addDaysIso(gridEnd, -(WEEKS_SHOWN * 7 - 1));

  const weeks: string[][] = [];
  for (let w = 0; w < WEEKS_SHOWN; w++) {
    const week: string[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(addDaysIso(gridStart, w * 7 + d));
    }
    weeks.push(week);
  }

  const monthLabels = weeks.map((week, i) => {
    const firstOfMonth = week.find((d) => d.endsWith("-01"));
    if (!firstOfMonth) return null;
    if (i === 0) return null; // unikaj obciecia etykiety na samym brzegu
    const monthIdx = Number(firstOfMonth.slice(5, 7)) - 1;
    return MONTH_NAMES_SHORT[monthIdx];
  });

  function dotStatus(date: string): "worked" | "leave" | "future" | "none" {
    if (date > today) return "future";
    if (leaveDates.has(date)) return "leave";
    if (workedDates.has(date)) return "worked";
    return "none";
  }

  const selectedEntries = entries
    .filter((e) => e.entry_date === selected)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));
  const selectedLeave = leaveEntries.find((l) => selected >= l.start_date && selected <= l.end_date);
  const selectedWorked = selectedEntries.reduce(
    (sum, e) => sum + (e.end_time ? diffSeconds(e.start_time, e.end_time) : 0),
    0
  );

  return (
    <div className="rounded-lg border border-hairline bg-canvas p-5">
      <p className="mb-4 text-[14px] font-medium text-ink">Aktywność</p>

      <div className="overflow-x-auto">
        <div className="inline-block">
          <div className="mb-1 flex gap-[3px] pl-6">
            {monthLabels.map((label, i) => (
              <span key={i} className="w-[13px] text-[10px] text-ink-muted-48">
                {label ?? ""}
              </span>
            ))}
          </div>
          <div className="flex gap-[3px]">
            <div className="flex flex-col gap-[3px] pr-1">
              {WEEKDAY_ROW_LABELS.map((label, i) => (
                <span key={i} className="flex h-[13px] items-center text-[9px] text-ink-muted-48">
                  {label}
                </span>
              ))}
            </div>
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((date) => {
                  const status = dotStatus(date);
                  const isSelected = date === selected;
                  const isToday = date === today;
                  return (
                    <button
                      key={date}
                      onClick={() => status !== "future" && setSelected(date)}
                      disabled={status === "future"}
                      title={date}
                      className={`h-[13px] w-[13px] rounded-[3px] transition-transform ${
                        status === "worked"
                          ? "bg-primary"
                          : status === "leave"
                          ? "bg-[#34a853]"
                          : status === "future"
                          ? "bg-transparent"
                          : "bg-divider-soft"
                      } ${isSelected ? "ring-2 ring-offset-1 ring-ink" : ""} ${
                        isToday ? "ring-2 ring-offset-1 ring-primary" : ""
                      }`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4 text-[11px] text-ink-muted-48">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px] bg-primary" /> Pracowałeś
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px] bg-[#34a853]" /> Urlop
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px] bg-divider-soft" /> Brak danych
        </span>
      </div>

      <div className="mt-4 border-t border-hairline pt-4">
        <p className="mb-2 text-[13px] font-medium text-ink">{formatDate(selected)}</p>
        {selectedLeave && (
          <p className="mb-2 inline-block rounded-pill bg-[#e6f4ea] px-2.5 py-1 text-[12px] font-medium text-[#1e7e34]">
            Urlop: {LEAVE_TYPE_LABELS[selectedLeave.leave_type]}
          </p>
        )}
        {selectedEntries.length === 0 && !selectedLeave && (
          <p className="text-[13px] text-ink-muted-48">Brak wpisów tego dnia.</p>
        )}
        {selectedEntries.length > 0 && (
          <>
            <p className="display mb-2 text-[20px] font-bold tabular-nums text-ink">
              {formatDuration(selectedWorked)}
            </p>
            <div className="space-y-1.5">
              {selectedEntries.map((e) => (
                <div key={e.id} className="flex items-center justify-between text-[12px]">
                  <span className="tabular-nums text-ink-muted-80">
                    {formatHm(new Date(e.start_time))} – {e.end_time ? formatHm(new Date(e.end_time)) : "w toku"}
                  </span>
                  <LocationBadge label={e.location_label} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
