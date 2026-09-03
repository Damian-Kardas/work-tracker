export function formatClock(date: Date): string {
  return date.toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function formatHm(date: Date): string {
  return date.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("pl-PL", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Roznica w sekundach miedzy dwoma znacznikami czasu (>= 0). */
export function diffSeconds(start: string | Date, end: string | Date): number {
  const s = typeof start === "string" ? new Date(start) : start;
  const e = typeof end === "string" ? new Date(end) : end;
  return Math.max(0, Math.floor((e.getTime() - s.getTime()) / 1000));
}

/** Formatuje sekundy jako "Xh Ym" albo "HH:MM:SS" (tryb stopera). */
export function formatDuration(totalSeconds: number, mode: "short" | "stopwatch" = "short"): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  if (mode === "stopwatch") {
    return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
  }
  if (h === 0) return `${m} min`;
  return `${h}h ${String(m).padStart(2, "0")}min`;
}

/** Dzien tygodnia jako 1 (poniedzialek) ... 7 (niedziela), zgodnie z konwencja ISO. */
export function isoWeekday(date: Date): number {
  const day = date.getDay(); // 0 = niedziela
  return day === 0 ? 7 : day;
}

export function todayIsoDate(timezone = "Europe/Warsaw"): string {
  const now = new Date();
  return new Intl.DateTimeFormat("sv-SE", { timeZone: timezone }).format(now); // sv-SE => YYYY-MM-DD
}
