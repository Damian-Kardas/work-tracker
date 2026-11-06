"use client";

import { useMemo, useState } from "react";
import type { LeaveEntry, LeaveType, TimeEntry } from "@/types/database";
import { LEAVE_TYPE_LABELS } from "@/types/database";
import { diffSeconds, formatDuration, formatHm, formatDate, todayIsoDate } from "@/lib/utils/time";
import { addDaysIso } from "@/lib/utils/stats";
import { getHoliday } from "@/lib/utils/holidays";
import LocationBadge from "./LocationBadge";

const WEEKS_SHOWN = 18;
const MONTH_NAMES_SHORT = [
  "Sty", "Lut", "Mar", "Kwi", "Maj", "Cze", "Lip", "Sie", "Wrz", "Paź", "Lis", "Gru",
];
const WEEKDAY_ROW_LABELS = ["Pn", "", "Śr", "", "Pt", "", "Nd"];

// Kolory kropek - zwolnienie lekarskie ma wlasny kolor, odrozniony od urlopu
const COLOR_WORKED = "#0066cc";
const COLOR_LEAVE = "#34a853";
const COLOR_SICK = "#ff9f0a";
const COLOR_HOLIDAY = "#c7c7cc";
const COLOR_NONE = "#f0f0f0";

type DotStatus = "worked" | "leave" | "sick" | "holiday" | "future" | "none";

const DOT_COLORS: Record<Exclude<DotStatus, "future">, string> = {
  worked: COLOR_WORKED,
  leave: COLOR_LEAVE,
  sick: COLOR_SICK,
  holiday: COLOR_HOLIDAY,
  none: COLOR_NONE,
};

export default function ActivityCalendar({
  entries,
  leaveEntries,
  timezone,
  onAddAbsence,
}: {
  entries: TimeEntry[];
  leaveEntries: LeaveEntry[];
  timezone: string;
  /** Wywolywane po kliknieciu "Oznacz jako urlop / zwolnienie" dla wybranego dnia. */
  onAddAbsence?: (date: string) => void;
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

  // data -> typ nieobecnosci
  const absenceByDate = useMemo(() => {
    const map = new Map<string, LeaveType>();
    leaveEntries.forEach((l) => {
      let cur = l.start_date;
      while (cur <= l.end_date) {
        map.set(cur, l.leave_type);
        cur = addDaysIso(cur, 1);
      }
    });
    return map;
  }, [leaveEntries]);

  // Siatka: kolumny = tygodnie, wiersze = Pn..Nd (tydzien zaczyna sie w poniedzialek),
  // konczy sie w niedziele biezacego tygodnia.
  const todayIsoIndex = (new Date(today + "T00:00:00Z").getUTCDay() + 6) % 7; // 0 = poniedzialek
  const gridEnd = addDaysIso(today, 6 - todayIsoIndex); // najblizsza niedziela >= dzis
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

  function dotStatus(date: string): DotStatus {
    const absence = absenceByDate.get(date);
    if (absence) return absence === "Zwolnienie" ? "sick" : "leave";
    if (workedDates.has(date)) return "worked";
    if (getHoliday(date)) return "holiday";
    if (date > today) return "future";
    return "none";
  }

  const selectedEntries = entries
    .filter((e) => e.entry_date === selected)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));
  const selectedAbsence = absenceByDate.get(selected);
  const selectedHoliday = getHoliday(selected);
  const selectedWorked = selectedEntries.reduce(
    (sum, e) => sum + (e.end_time ? diffSeconds(e.start_time, e.end_time) : 0),
    0
  );
  const selectedIsSick = selectedAbsence === "Zwolnienie";

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
                      style={{
                        backgroundColor: status === "future" ? "transparent" : DOT_COLORS[status],
                      }}
                      className={`h-[13px] w-[13px] rounded-[3px] transition-transform ${
                        isSelected ? "ring-2 ring-offset-1 ring-ink" : ""
                      } ${isToday ? "ring-2 ring-offset-1 ring-primary" : ""}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-ink-muted-48">
        <LegendItem color={COLOR_WORKED} label="Praca" />
        <LegendItem color={COLOR_LEAVE} label="Urlop" />
        <LegendItem color={COLOR_SICK} label="Zwolnienie" />
        <LegendItem color={COLOR_HOLIDAY} label="Święto" />
        <LegendItem color={COLOR_NONE} label="Brak danych" />
      </div>

      <div className="mt-4 border-t border-hairline pt-4">
        <p className="mb-2 text-[13px] font-medium text-ink">{formatDate(selected)}</p>

        <div className="mb-2 flex flex-wrap gap-1.5">
          {selectedHoliday && (
            <span className="rounded-pill bg-parchment px-2.5 py-1 text-[12px] font-medium text-ink-muted-80">
              Święto: {selectedHoliday.name}
            </span>
          )}
          {selectedAbsence && (
            <span
              className="rounded-pill px-2.5 py-1 text-[12px] font-medium"
              style={
                selectedIsSick
                  ? { backgroundColor: "#fff3e0", color: "#b25e00" }
                  : { backgroundColor: "#e6f4ea", color: "#1e7e34" }
              }
            >
              {selectedIsSick ? "Zwolnienie lekarskie" : `Urlop: ${LEAVE_TYPE_LABELS[selectedAbsence]}`}
            </span>
          )}
        </div>

        {selectedEntries.length === 0 && !selectedAbsence && !selectedHoliday && (
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

        {onAddAbsence && !selectedAbsence && (
          <button
            onClick={() => onAddAbsence(selected)}
            className="press-scale mt-3 rounded-pill border border-hairline px-4 py-2 text-[13px] font-medium text-ink-muted-80"
          >
            Oznacz jako urlop / zwolnienie
          </button>
        )}
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
