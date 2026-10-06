import type { TimeEntry } from "@/types/database";
import { diffSeconds } from "./time";

/** Dodaje dni do daty w formacie YYYY-MM-DD, licząc wyłącznie w kalendarzu. */
export function addDaysIso(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function isoWeekdayFromDateStr(dateStr: string): number {
  const d = new Date(dateStr + "T00:00:00Z");
  const day = d.getUTCDay();
  return day === 0 ? 7 : day;
}

export function startOfIsoWeekStr(dateStr: string): string {
  return addDaysIso(dateStr, -(isoWeekdayFromDateStr(dateStr) - 1));
}

export function endOfIsoWeekStr(dateStr: string): string {
  return addDaysIso(startOfIsoWeekStr(dateStr), 6);
}

export function startOfMonthStr(dateStr: string): string {
  return `${dateStr.slice(0, 7)}-01`;
}

export function endOfMonthStr(dateStr: string): string {
  const [y, m] = dateStr.split("-").map(Number);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();

  return `${dateStr.slice(0, 7)}-${String(lastDay).padStart(2, "0")}`;
}

export function countWorkDaysInRange(
  startStr: string,
  endStr: string,
  workDays: number[]
): number {
  let count = 0;
  let cur = startStr;

  while (cur <= endStr) {
    if (workDays.includes(isoWeekdayFromDateStr(cur))) {
      count++;
    }

    cur = addDaysIso(cur, 1);
  }

  return count;
}

export function leaveSecondsInRange(
  entries: { start_date: string; end_date: string }[],
  fromDate: string,
  toDate: string,
  workDays: number[],
  dailySeconds: number
): number {
  let total = 0;

  for (const entry of entries) {
    const start = entry.start_date > fromDate ? entry.start_date : fromDate;
    const end = entry.end_date < toDate ? entry.end_date : toDate;

    if (start > end) continue;

    let cur = start;

    while (cur <= end) {
      if (workDays.includes(isoWeekdayFromDateStr(cur))) {
        total += dailySeconds;
      }

      cur = addDaysIso(cur, 1);
    }
  }

  return total;
}

/* ========================= */
/* NOWE STATYSTYKI */
/* ========================= */

export function getWorkedSeconds(entries: TimeEntry[]): number {
  return entries.reduce((sum, entry) => {
    if (!entry.end_time) return sum;

    return sum + diffSeconds(entry.start_time, entry.end_time);
  }, 0);
}

export function groupEntriesByDay(entries: TimeEntry[]) {
  const result = new Map<string, number>();

  entries.forEach((entry) => {
    if (!entry.end_time) return;

    const duration = diffSeconds(
      entry.start_time,
      entry.end_time
    );

    result.set(
      entry.entry_date,
      (result.get(entry.entry_date) ?? 0) + duration
    );
  });

  return result;
}

export function calculateOvertimeSeconds(
  entries: TimeEntry[],
  dailyTargetSeconds: number
) {
  const days = groupEntriesByDay(entries);

  let overtime = 0;

  days.forEach((worked) => {
    overtime += Math.max(
      0,
      worked - dailyTargetSeconds
    );
  });

  return overtime;
}

export function calculateAverageDay(
  entries: TimeEntry[]
) {
  const days = groupEntriesByDay(entries);

  if (days.size === 0) return 0;

  let total = 0;

  days.forEach((seconds) => {
    total += seconds;
  });

  return Math.floor(total / days.size);
}

export function calculateLongestDay(
  entries: TimeEntry[]
) {
  const days = groupEntriesByDay(entries);

  let maxDate: string | null = null;
  let maxSeconds = 0;

  days.forEach((seconds, date) => {
    if (seconds > maxSeconds) {
      maxSeconds = seconds;
      maxDate = date;
    }
  });

  return {
    date: maxDate,
    seconds: maxSeconds,
  };
}

export function calculateShortestDay(
  entries: TimeEntry[]
) {
  const days = groupEntriesByDay(entries);

  let minDate: string | null = null;
  let minSeconds = Number.MAX_SAFE_INTEGER;

  days.forEach((seconds, date) => {
    if (seconds < minSeconds) {
      minSeconds = seconds;
      minDate = date;
    }
  });

  return {
    date: minDate,
    seconds:
      minSeconds === Number.MAX_SAFE_INTEGER
        ? 0
        : minSeconds,
  };
}

export function countWorkedDays(
  entries: TimeEntry[]
) {
  return groupEntriesByDay(entries).size;
}

export function calculateBalance(
  workedSeconds: number,
  targetSeconds: number
) {
  return workedSeconds - targetSeconds;
}

export function buildMonthlySummary(
  entries: TimeEntry[],
  dailyTargetSeconds: number
) {
  const summary: Record<
    string,
    {
      worked: number;
      overtime: number;
      workedDays: number;
    }
  > = {};

  entries.forEach((entry) => {
    if (!entry.end_time) return;

    const month = entry.entry_date.slice(0, 7);

    if (!summary[month]) {
      summary[month] = {
        worked: 0,
        overtime: 0,
        workedDays: 0,
      };
    }

    const duration = diffSeconds(
      entry.start_time,
      entry.end_time
    );

    summary[month].worked += duration;
  });

  Object.keys(summary).forEach((month) => {
    const monthEntries = entries.filter(
      (e) =>
        e.entry_date.startsWith(month) &&
        e.end_time
    );

    summary[month].overtime =
      calculateOvertimeSeconds(
        monthEntries,
        dailyTargetSeconds
      );

    summary[month].workedDays =
      countWorkedDays(monthEntries);
  });

  return summary;
}
