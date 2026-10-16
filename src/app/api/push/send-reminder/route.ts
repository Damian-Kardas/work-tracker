import { NextResponse } from "next/server";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile, PushSubscriptionRow, TimeEntry } from "@/types/database";
import { autoCloseStaleEntry } from "@/lib/utils/autoClose";

export const dynamic = "force-dynamic";

// Przypomnienie jest wysylane, gdy aktualna godzina jest w oknie [godzina_docelowa, +30 min].
// Okno z zapasem pozwala przezyc pominiety "tik" crona; dublowaniu zapobiega tabela push_log
// (max jedno powiadomienie danego rodzaju na dzien), wiec czestotliwosc crona nie ma znaczenia.
const LATE_TOLERANCE_MINUTES = 30;

type Kind = "start" | "end" | "overtime_cap" | "auto_close";

function minutesSinceMidnight(hhmmss: string): number {
  const [h, m] = hhmmss.split(":").map(Number);
  return h * 60 + m;
}

function nowInTimezone(timezone: string): { minutes: number; weekday: number; dateStr: string } {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const hour = Number(get("hour")) % 24; // niektore silniki zwracaja "24" o polnocy
  const minute = Number(get("minute"));
  const weekdayMap: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

  return {
    minutes: hour * 60 + minute,
    weekday: weekdayMap[get("weekday")] ?? 1,
    dateStr: `${get("year")}-${get("month")}-${get("day")}`,
  };
}

function inWindow(nowMinutes: number, targetMinutes: number): boolean {
  const delta = nowMinutes - targetMinutes;
  return delta >= 0 && delta <= LATE_TOLERANCE_MINUTES;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!process.env.VAPID_PRIVATE_KEY || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    return NextResponse.json({ error: "VAPID nieskonfigurowane" }, { status: 500 });
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Brak SUPABASE_SERVICE_ROLE_KEY w zmiennych srodowiskowych" }, { status: 500 });
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:example@example.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const supabase = createAdminClient();
  const errors: string[] = [];
  const debug: Record<string, unknown>[] = [];
  let sent = 0;

  const { data: profiles, error: profilesError } = await supabase.from("profiles").select("*");
  if (profilesError) {
    return NextResponse.json({ error: `profiles: ${profilesError.message}` }, { status: 500 });
  }

  for (const profile of (profiles as Profile[]) ?? []) {
    const { minutes, weekday, dateStr } = nowInTimezone(profile.timezone);

    // Automatyczne zamkniecie zapomnianych wpisow - niezaleznie od tego, czy sa subskrypcje push.
    const closedNow: TimeEntry[] = [];
    {
      const { data: openAll } = await supabase
        .from("time_entries")
        .select("*")
        .eq("user_id", profile.id)
        .is("end_time", null);
      for (const e of (openAll as TimeEntry[]) ?? []) {
        const closed = await autoCloseStaleEntry(supabase, profile, e);
        if (closed) closedNow.push(closed);
      }
    }

    const { data: subsData } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", profile.id);
    const subs = (subsData as PushSubscriptionRow[]) ?? [];

    const info: Record<string, unknown> = {
      user: profile.id.slice(0, 8),
      localTime: `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`,
      weekday,
      date: dateStr,
      subscriptions: subs.length,
      autoClosedEntries: closedNow.length,
      decisions: [] as string[],
    };
    const decisions = info.decisions as string[];
    debug.push(info);

    if (subs.length === 0) {
      decisions.push("brak subskrypcji push - wlacz powiadomienia w Ustawieniach appki (PWA)");
      continue;
    }

    async function claim(kind: Kind): Promise<boolean> {
      const { error } = await supabase
        .from("push_log")
        .insert({ user_id: profile.id, kind, day: dateStr });
      if (!error) return true;
      if (error.code === "23505") {
        decisions.push(`${kind}: juz wyslano dzisiaj`);
        return false;
      }
      errors.push(`push_log (${kind}): ${error.message} - czy uruchomiono migracje 0004_push_log.sql?`);
      return false;
    }

    async function release(kind: Kind) {
      await supabase.from("push_log").delete().eq("user_id", profile.id).eq("kind", kind).eq("day", dateStr);
    }

    async function deliver(kind: Kind, message: { title: string; body: string }) {
      if (!(await claim(kind))) return;

      let delivered = 0;
      for (const sub of subs) {
        try {
          await webpush.sendNotification(
            sub.subscription as webpush.PushSubscription,
            JSON.stringify(message)
          );
          delivered++;
          sent++;
        } catch (err: unknown) {
          const e = err as { statusCode?: number; body?: string; message?: string };
          if (e.statusCode === 404 || e.statusCode === 410) {
            await supabase.from("push_subscriptions").delete().eq("id", sub.id);
            decisions.push(`${kind}: usunieto wygasla subskrypcje (${e.statusCode})`);
          } else {
            errors.push(`${kind}: push nie przeszedl (status ${e.statusCode ?? "?"}): ${e.body ?? e.message ?? "brak szczegolow"}`);
          }
        }
      }

      if (delivered === 0) {
        // nic nie dotarlo - zwolnij blokade, zeby nastepne wywolanie crona sprobowalo ponownie
        await release(kind);
      } else {
        decisions.push(`${kind}: wyslano (${delivered})`);
      }
    }

    if (closedNow.length > 0) {
      const hhmm = (profile.auto_close_time ?? "23:00").slice(0, 5);
      await deliver("auto_close", {
        title: "Wpis zakończony automatycznie",
        body: `Nie zakończono pracy – zamknięto wpis o ${hhmm}. Sprawdź godzinę w Historii.`,
      });
    }

    // Dzisiejsze wpisy + ewentualny urlop - potrzebne do decyzji
    const [{ data: todayRows }, { data: openRows }, { data: leaveRows }] = await Promise.all([
      supabase.from("time_entries").select("*").eq("user_id", profile.id).eq("entry_date", dateStr),
      supabase.from("time_entries").select("*").eq("user_id", profile.id).is("end_time", null).limit(1),
      supabase
        .from("leave_entries")
        .select("id")
        .eq("user_id", profile.id)
        .lte("start_date", dateStr)
        .gte("end_date", dateStr)
        .limit(1),
    ]);

    const todayEntries = (todayRows as TimeEntry[]) ?? [];
    const openEntry = (openRows?.[0] as TimeEntry | undefined) ?? null;
    const onLeave = (leaveRows?.length ?? 0) > 0;
    const isWorkDay = profile.work_days.includes(weekday);

    if (isWorkDay && !onLeave) {
      const startMinutes = minutesSinceMidnight(profile.standard_start_time);
      const endMinutes = minutesSinceMidnight(profile.standard_end_time);

      if (!profile.reminder_start_enabled) {
        decisions.push("start: wylaczone w ustawieniach");
      } else if (!inWindow(minutes, startMinutes)) {
        decisions.push("start: poza oknem czasowym");
      } else if (todayEntries.length > 0) {
        decisions.push("start: dzisiaj jest juz wpis - pomijam");
      } else {
        await deliver("start", {
          title: "Pora zacząć pracę",
          body: "Nie zapomnij włączyć rejestracji czasu pracy.",
        });
      }

      if (!profile.reminder_end_enabled) {
        decisions.push("end: wylaczone w ustawieniach");
      } else if (!inWindow(minutes, endMinutes)) {
        decisions.push("end: poza oknem czasowym");
      } else if (!openEntry) {
        decisions.push("end: brak otwartego wpisu - pomijam");
      } else {
        await deliver("end", {
          title: "Koniec dnia pracy",
          body: "Nie zapomnij zakończyć rejestracji czasu pracy.",
        });
      }
    } else {
      decisions.push(onLeave ? "dzis urlop - pomijam przypomnienia" : "dzis nie jest dniem roboczym");
    }

    if (profile.overtime_cap_enabled && openEntry) {
      const closedSeconds = todayEntries
        .filter((e) => e.end_time)
        .reduce((sum, e) => sum + (new Date(e.end_time as string).getTime() - new Date(e.start_time).getTime()) / 1000, 0);
      const openSeconds = (Date.now() - new Date(openEntry.start_time).getTime()) / 1000;
      const totalHours = (closedSeconds + openSeconds) / 3600;

      if (totalHours >= profile.overtime_cap_hours) {
        await deliver("overtime_cap", {
          title: "Przekroczono limit nadgodzin",
          body: `Dziś przepracowano już ponad ${profile.overtime_cap_hours} h. Rozważ zakończenie dnia.`,
        });
      }
    }
  }

  return NextResponse.json({ ok: true, sent, errors, debug });
}
