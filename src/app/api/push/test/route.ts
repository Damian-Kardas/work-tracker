import { NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";
import type { PushSubscriptionRow } from "@/types/database";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, message: "Nie jesteś zalogowany." }, { status: 401 });
  }

  if (!process.env.VAPID_PRIVATE_KEY || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Na serwerze brakuje kluczy VAPID (VAPID_PRIVATE_KEY / NEXT_PUBLIC_VAPID_PUBLIC_KEY). Dodaj je w Vercel i zrób Redeploy.",
      },
      { status: 500 }
    );
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:example@example.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const { data: subsData, error } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ ok: false, message: `Błąd bazy: ${error.message}` }, { status: 500 });
  }

  const subs = (subsData as PushSubscriptionRow[]) ?? [];
  if (subs.length === 0) {
    return NextResponse.json({
      ok: false,
      message:
        "Brak zapisanej subskrypcji dla Twojego konta. Wyłącz i ponownie włącz powiadomienia w Ustawieniach (w aplikacji z ekranu głównego).",
    });
  }

  const results: string[] = [];
  let delivered = 0;

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        sub.subscription as webpush.PushSubscription,
        JSON.stringify({ title: "Work Tracker", body: "Powiadomienia działają poprawnie." })
      );
      delivered++;
    } catch (err: unknown) {
      const e = err as { statusCode?: number; body?: string; message?: string };
      if (e.statusCode === 404 || e.statusCode === 410) {
        await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        results.push(`Subskrypcja wygasła (${e.statusCode}) i została usunięta - włącz powiadomienia ponownie.`);
      } else {
        results.push(`Błąd wysyłki (status ${e.statusCode ?? "?"}): ${e.body ?? e.message ?? "brak szczegółów"}`);
      }
    }
  }

  if (delivered > 0) {
    return NextResponse.json({
      ok: true,
      message: `Wysłano (${delivered}). Jeśli nic nie widzisz, sprawdź Ustawienia iPhone'a → Powiadomienia → Work Tracker.`,
    });
  }

  return NextResponse.json({ ok: false, message: results.join(" ") || "Nie udało się wysłać." });
}
