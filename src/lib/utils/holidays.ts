/**
 * Polskie dni ustawowo wolne od pracy (ustawa o dniach wolnych od pracy).
 * Swieta stale + ruchome (liczone od daty Wielkanocy). Wigilia (24.12) jest dniem wolnym od 2025 r.
 */

export interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
}

const pad = (n: number) => String(n).padStart(2, "0");

function toIso(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Niedziela Wielkanocna (kalendarz gregorianski) - algorytm Meeusa/Jonesa/Butchera. */
function easterSunday(year: number): string {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return toIso(year, month, day);
}

const cache = new Map<number, Map<string, Holiday>>();

function holidaysForYear(year: number): Map<string, Holiday> {
  const cached = cache.get(year);
  if (cached) return cached;

  const easter = easterSunday(year);
  const list: Holiday[] = [
    { date: toIso(year, 1, 1), name: "Nowy Rok" },
    { date: toIso(year, 1, 6), name: "Trzech Króli" },
    { date: easter, name: "Wielkanoc" },
    { date: addDays(easter, 1), name: "Poniedziałek Wielkanocny" },
    { date: toIso(year, 5, 1), name: "Święto Pracy" },
    { date: toIso(year, 5, 3), name: "Święto Konstytucji 3 Maja" },
    { date: addDays(easter, 49), name: "Zielone Świątki" },
    { date: addDays(easter, 60), name: "Boże Ciało" },
    { date: toIso(year, 8, 15), name: "Wniebowzięcie NMP" },
    { date: toIso(year, 11, 1), name: "Wszystkich Świętych" },
    { date: toIso(year, 11, 11), name: "Narodowe Święto Niepodległości" },
    { date: toIso(year, 12, 25), name: "Boże Narodzenie" },
    { date: toIso(year, 12, 26), name: "Drugi dzień Bożego Narodzenia" },
  ];
  // Wigilia jest dniem ustawowo wolnym dopiero od 2025 r.
  if (year >= 2025) list.push({ date: toIso(year, 12, 24), name: "Wigilia Bożego Narodzenia" });

  const map = new Map(list.map((h) => [h.date, h]));
  cache.set(year, map);
  return map;
}

/** Zwraca swieto przypadajace na dana date (YYYY-MM-DD) albo undefined. */
export function getHoliday(dateStr: string): Holiday | undefined {
  const year = Number(dateStr.slice(0, 4));
  return holidaysForYear(year).get(dateStr);
}

export function isHoliday(dateStr: string): boolean {
  return getHoliday(dateStr) !== undefined;
}

/** Dzien tygodnia ISO (1 = poniedzialek ... 7 = niedziela) dla daty YYYY-MM-DD. */
export function isoWeekday(dateStr: string): number {
  const day = new Date(dateStr + "T00:00:00Z").getUTCDay();
  return day === 0 ? 7 : day;
}
