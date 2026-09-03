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

export default function PushOptIn() {
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    async function check() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        return setStatus("unsupported");
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      const sub = await reg.pushManager.getSubscription();
      setStatus(sub ? "on" : "off");
    }
    check().catch(() => setStatus("error"));
  }, []);

  async function enable() {
    setStatus("loading");
    try {
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) throw new Error("Brak klucza VAPID w konfiguracji.");

      const permission = await Notification.requestPermission();
      if (permission !== "granted") return setStatus("off");

      const reg = await navigator.serviceWorker.register("/sw.js");
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (!data.user) throw new Error("Brak zalogowanego uzytkownika.");

      await supabase.from("push_subscriptions").upsert(
        {
          user_id: data.user.id,
          endpoint: sub.endpoint,
          subscription: sub.toJSON(),
        },
        { onConflict: "endpoint" }
      );

      setStatus("on");
    } catch {
      setStatus("error");
    }
  }

  async function disable() {
    setStatus("loading");
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

  if (status === "unsupported") {
    return (
      <p className="text-xs text-paper-500">
        Ta przegladarka nie wspiera powiadomien push. Na iOS zainstaluj appke na ekran glowny
        (Udostepnij -&gt; Dodaj do ekranu poczatkowego), zeby dzialaly.
      </p>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm text-paper-100">Przypomnienia push</p>
        <p className="text-xs text-paper-500">
          Powiadomienie o starcie i koncu pracy wg standardowych godzin.
        </p>
      </div>
      {status === "on" ? (
        <button
          onClick={disable}
          className="shrink-0 rounded-card border border-ink-700 px-3 py-1.5 text-xs text-paper-300 hover:border-brick-500 hover:text-brick-400"
        >
          Wylacz
        </button>
      ) : (
        <button
          onClick={enable}
          disabled={status === "loading"}
          className="shrink-0 rounded-card bg-amber-500 px-3 py-1.5 text-xs font-medium text-ink-950 hover:bg-amber-400 disabled:opacity-60"
        >
          {status === "loading" ? "..." : status === "error" ? "Sprobuj ponownie" : "Wlacz"}
        </button>
      )}
    </div>
  );
}
