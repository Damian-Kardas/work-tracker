import type { LeaveEntry } from "@/types/database";

/** Zwraca najblizszy nadchodzacy (lub trwajacy) urlop wzgledem podanej daty "today" (YYYY-MM-DD). */
export function nextUpcomingLeave(entries: LeaveEntry[], today: string): LeaveEntry | null {
  const upcoming = entries
    .filter((e) => e.end_date >= today)
    .sort((a, b) => a.start_date.localeCompare(b.start_date));
  return upcoming[0] ?? null;
}

/** Liczba dni kalendarzowych do startu urlopu (0 jesli juz trwa lub zaczyna sie dzis). */
export function daysUntil(dateStr: string, today: string): number {
  const d1 = new Date(dateStr + "T00:00:00Z").getTime();
  const d2 = new Date(today + "T00:00:00Z").getTime();
  return Math.max(0, Math.round((d1 - d2) / 86400000));
}

/** Sumuje dni urlopu wypoczynkowego wykorzystane w danym roku kalendarzowym. */
export function usedLeaveDays(entries: LeaveEntry[], year: number): number {
  return entries
    .filter(
      (e) => e.leave_type === "Wypoczynkowy" && new Date(e.start_date).getFullYear() === year
    )
    .reduce((sum, e) => sum + Number(e.days_count), 0);
}
