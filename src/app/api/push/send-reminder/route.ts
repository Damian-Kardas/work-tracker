import { NextResponse } from "next/server";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile, PushSubscriptionRow, TimeEntry } from "@/types/database";

export const dynamic = "force-dynamic";

// Ile minut tolerancji liczymy jako "pora wyslac". Powinno byc >= czestotliwosci
// wywolan crona (patrz cron-job.org), zeby nic nie przepadlo, ale malo, zeby nie
// wysylac tego samego powiadomienia wielokrotnie.
const WINDOW_MINUTES = 15;

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
  const hour = Number(get("hour"));
  const minute = Number(get("minute"));
  const weekdayMap: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

  return {
    minutes: hour * 60 + minute,
    weekday: weekdayMap[get("weekday")] ?? 1,
    dateStr: `${get("year")}-${get("month")}-${get("day")}`,
  };
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!process.env.VAPID_PRIVATE_KEY || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    return NextResponse.json({ error: "VAPID nieskonfigurowane" }, { status: 500 });
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:example@example.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const supabase = createAdminClient();
  const { data: profiles } = await supabase.from("profiles").select("*");
  const now = new Date();
  let sent = 0;

  for (const profile of (profiles as Profile[]) ?? []) {
    const { minutes, weekday, dateStr } = nowInTimezone(profile.timezone);
    const messages: { title: string; body: string }[] = [];

    if (profile.work_days.includes(weekday)) {
      const startMinutes = minutesSinceMidnight(profile.standard_start_time);
      const endMinutes = minutesSinceMidnight(profile.standard_end_time);

      if (profile.reminder_start_enabled && Math.abs(minutes - startMinutes) <= WINDOW_MINUTES) {
        const { data: todayRows } = await supabase
          .from("time_entries")
          .select("id")
          .eq("user_id", profile.id)
          .eq("entry_date", dateStr)
          .limit(1);
        if (!todayRows || todayRows.length === 0) {
          messages.push({ title: "Pora zacząć pracę", body: "Nie zapomnij włączyć rejestracji czasu pracy." });
        }
      }

      if (profile.reminder_end_enabled && Math.abs(minutes - endMinutes) <= WINDOW_MINUTES) {
        const { data: openRows } = await supabase
          .from("time_entries")
          .select("id")
          .eq("user_id", profile.id)
          .is("end_time", null)
          .limit(1);
        if (openRows && openRows.length > 0) {
          messages.push({ title: "Koniec dnia pracy", body: "Nie zapomnij zakończyć rejestracji czasu pracy." });
        }
      }
    }

    if (profile.overtime_cap_enabled) {
      const { data: openRows } = await supabase
        .from("time_entries")
        .select("*")
        .eq("user_id", profile.id)
        .is("end_time", null)
        .limit(1);
      const openEntry = (openRows?.[0] as TimeEntry | undefined) ?? null;

      if (openEntry) {
        const capMs = profile.overtime_cap_hours * 3600 * 1000;
        const crossTime = new Date(openEntry.start_time).getTime() + capMs;
        const diffMinutes = (now.getTime() - crossTime) / 60000;
        if (diffMinutes >= 0 && diffMinutes <= WINDOW_MINUTES) {
          messages.push({
            title: "Przekroczono limit nadgodzin",
            body: `Pracujesz dziś już ponad ${profile.overtime_cap_hours}h. Rozważ zakończenie dnia.`,
          });
        }
      }
    }

    if (messages.length === 0) continue;

    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", profile.id);

    for (const sub of (subs as PushSubscriptionRow[]) ?? []) {
      for (const message of messages) {
        try {
          await webpush.sendNotification(
            sub.subscription as webpush.PushSubscription,
            JSON.stringify(message)
          );
          sent++;
        } catch (err: unknown) {
          const statusCode = (err as { statusCode?: number })?.statusCode;
          if (statusCode === 404 || statusCode === 410) {
            await supabase.from("push_subscriptions").delete().eq("id", sub.id);
          }
        }
      }
    }
  }

  return NextResponse.json({ ok: true, sent });
}
