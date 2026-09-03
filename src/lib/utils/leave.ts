import type { LeaveEntry } from "@/types/database";

/** Sumuje dni urlopu wypoczynkowego wykorzystane w danym roku kalendarzowym. */
export function usedLeaveDays(entries: LeaveEntry[], year: number): number {
  return entries
    .filter(
      (e) => e.leave_type === "Wypoczynkowy" && new Date(e.start_date).getFullYear() === year
    )
    .reduce((sum, e) => sum + Number(e.days_count), 0);
}
