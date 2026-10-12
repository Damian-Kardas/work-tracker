"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

type Status = "unsupported" | "loading" | "off" | "on" | "error";

/** Zapisuje subskrypcje w bazie i zwraca tekst bledu (albo null gdy sie udalo). */
async function saveSubscription(sub: PushSubscription): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return "Brak zalogowanego użytkownika.";

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: data.user.id,
      endpoint: sub.endpoint,
      subscription: sub.toJSON(),
    },
    { onConflict: "endpoint" }
  );
  return error ? `Nie udało się zapisać subskrypcji: ${error.message}` : null;
}

export default function PushOptIn() {
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    async function check() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        return setStatus("unsupported");
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        // Samonaprawianie: upewnij sie, ze subskrypcja tego urzadzenia na pewno jest w bazie
        // (mogla zostac usunieta po wygasnieciu albo nigdy sie nie zapisac).
        const err = await saveSubscription(sub);
        if (err) setMessage(err);
        setStatus("on");
      } else {
        setStatus("off");
      }
    }
    check().catch(() => setStatus("error"));
  }, []);

  async function enable() {
    setStatus("loading");
    setMessage(null);
    try {
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) throw new Error("Brak klucza VAPID w konfiguracji (NEXT_PUBLIC_VAPID_PUBLIC_KEY).");

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMessage(
          "Zgoda na powiadomienia nie została udzielona. Sprawdź: Ustawienia iPhone'a → Powiadomienia → Work Tracker."
        );
        return setStatus("off");
      }

      const reg = await navigator.serviceWorker.register("/sw.js");
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const err = await saveSubscription(sub);
      if (err) throw new Error(err);

      setStatus("on");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Nie udało się włączyć powiadomień.");
      setStatus("error");
    }
  }

  async function disable() {
    setStatus("loading");
    setMessage(null);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        const supabase = createClient();
        await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        await sub.unsubscribe();
      }
      setStatus("off");
    } catch {
      setStatus("error");
    }
  }

  async function sendTest() {
    setTesting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/push/test", { method: "POST" });
      const json = (await res.json()) as { ok: boolean; message: string };
      setMessage(json.message);
    } catch {
      setMessage("Nie udało się połączyć z serwerem.");
    }
    setTesting(false);
  }

  if (status === "unsupported") {
    return (
      <p className="text-[13px] text-ink-muted-48">
        Ta przeglądarka nie wspiera powiadomień push. Na iOS zainstaluj aplikację na ekran główny
        (Udostępnij -&gt; Dodaj do ekranu początkowego) i otwórz ją z ikony, żeby działały.
      </p>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[15px] text-ink">Powiadomienia push</p>
          <p className="text-[13px] text-ink-muted-48">
            {status === "on"
              ? "Włączone na tym urządzeniu."
              : "Wymagane, żeby przypomnienia w ogóle docierały."}
          </p>
        </div>
        {status === "on" ? (
          <button
            onClick={disable}
            className="press-scale shrink-0 rounded-pill border border-hairline px-3 py-1.5 text-[13px] text-ink-muted-80"
          >
            Wyłącz
          </button>
        ) : (
          <button
            onClick={enable}
            disabled={status === "loading"}
            className="press-scale shrink-0 rounded-pill bg-primary px-3 py-1.5 text-[13px] font-medium text-white disabled:opacity-60"
          >
            {status === "loading" ? "…" : status === "error" ? "Spróbuj ponownie" : "Włącz"}
          </button>
        )}
      </div>

      {status === "on" && (
        <button
          onClick={sendTest}
          disabled={testing}
          className="press-scale mt-4 w-full rounded-pill border border-hairline py-2.5 text-[14px] font-medium text-ink-muted-80 disabled:opacity-60"
        >
          {testing ? "Wysyłanie…" : "Wyślij powiadomienie testowe"}
        </button>
      )}

      {message && <p className="mt-3 text-[13px] leading-snug text-ink-muted-80">{message}</p>}
    </div>
  );
}
