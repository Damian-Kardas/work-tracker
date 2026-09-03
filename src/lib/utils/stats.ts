/** Dodaje dni do daty w formacie YYYY-MM-DD, liczac wylacznie w kalendarzu (bez stref czasowych). */
export function addDaysIso(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Dzien tygodnia (1 = poniedzialek ... 7 = niedziela) dla daty w formacie YYYY-MM-DD. */
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
  return dateStr.slice(0, 7) + "-01";
}

export function endOfMonthStr(dateStr: string): string {
  const [y, m] = dateStr.split("-").map(Number);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate(); // dzien 0 nastepnego miesiaca = ostatni dzien tego
  return `${dateStr.slice(0, 7)}-${String(lastDay).padStart(2, "0")}`;
}

/** Liczy ile dni w podanym zakresie (wlacznie) wypada na dni robocze z danej listy. */
export function countWorkDaysInRange(startStr: string, endStr: string, workDays: number[]): number {
  let count = 0;
  let cur = startStr;
  while (cur <= endStr) {
    if (workDays.includes(isoWeekdayFromDateStr(cur))) count++;
    cur = addDaysIso(cur, 1);
  }
  return count;
}
