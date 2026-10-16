import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile, TimeEntry } from "@/types/database";
import { addDaysIso } from "@/lib/utils/stats";

/** Przesuniecie strefy czasowej (ms) wzgledem UTC dla danego momentu. */
function tzOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** Zamienia "scienny czas" (data + HH:MM w strefie) na prawdziwy moment w czasie (UTC), z obsluga DST. */
export function zonedTimeToUtc(dateStr: string, hhmm: string, timeZone: string): Date {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const [h, mi] = hhmm.split(":").map(Number);
  const utcGuess = Date.UTC(y, mo - 1, d, h, mi, 0);
  const offset = tzOffsetMs(new Date(utcGuess), timeZone);
  let result = utcGuess - offset;
  const offset2 = tzOffsetMs(new Date(result), timeZone);
  if (offset2 !== offset) result = utcGuess - offset2;
  return new Date(result);
}

/**
 * Moment, w ktorym wpis powinien zostac zamkniety automatycznie: godzina graniczna dnia, w ktorym
 * wpis sie zaczal. Jesli wpis zaczal sie juz PO tej godzinie (np. praca nocna), liczymy
 * godzine graniczna nastepnego dnia.
 */
export function autoCloseInstant(entry: Pick<TimeEntry, "start_time" | "entry_date">, closeTime: string, timeZone: string): Date {
  let closeAt = zonedTimeToUtc(entry.entry_date, closeTime, timeZone);
  if (closeAt.getTime() <= new Date(entry.start_time).getTime()) {
    closeAt = zonedTimeToUtc(addDaysIso(entry.entry_date, 1), closeTime, timeZone);
  }
  return closeAt;
}

/**
 * Zamyka otwarty wpis, jesli minela juz godzina graniczna. Zwraca zamkniety wpis albo null,
 * gdy nic nie zrobiono (funkcja wylaczona, jeszcze nie pora albo blad zapisu).
 */
export async function autoCloseStaleEntry(
  client: SupabaseClient,
  profile: Profile,
  entry: TimeEntry
): Promise<TimeEntry | null> {
  if (!profile.auto_close_enabled || !profile.auto_close_time) return null;
  if (entry.end_time) return null;

  const closeAt = autoCloseInstant(entry, profile.auto_close_time.slice(0, 5), profile.timezone);
  if (Date.now() < closeAt.getTime()) return null;

  const { error } = await client
    .from("time_entries")
    .update({ end_time: closeAt.toISOString(), auto_closed: true })
    .eq("id", entry.id)
    .is("end_time", null);

  if (error) return null;
  return { ...entry, end_time: closeAt.toISOString(), auto_closed: true };
}
