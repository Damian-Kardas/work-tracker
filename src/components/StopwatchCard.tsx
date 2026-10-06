"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { LocationLabel, TimeEntry } from "@/types/database";
import { diffSeconds, formatDuration, formatHm } from "@/lib/utils/time";
import LocationBadge from "./LocationBadge";

const LOCATION_OPTIONS: LocationLabel[] = ["Biuro", "Home office", "Targi / wyjazd", "Inne"];

function getPosition(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  });
}

export default function StopwatchCard({ openEntry }: { openEntry: TimeEntry | null }) {
  const router = useRouter();
  const [label, setLabel] = useState<LocationLabel>("Biuro");
  const [elapsed, setElapsed] = useState(0);
  const [busy, setBusy] = useState(false);
  const [locationWarning, setLocationWarning] = useState<string | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (openEntry) {
      setElapsed(diffSeconds(openEntry.start_time, new Date()));
      tickRef.current = setInterval(() => {
        setElapsed(diffSeconds(openEntry.start_time, new Date()));
      }, 1000);
      return () => {
        if (tickRef.current) clearInterval(tickRef.current);
      };
    }
  }, [openEntry]);

  async function handleStart() {
    setBusy(true);
    setLocationWarning(null);
    const pos = await getPosition();
    if (!pos) setLocationWarning("Nie udało się pobrać lokalizacji – wpis zapisany bez GPS.");

    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return setBusy(false);

    const { error } = await supabase.from("time_entries").insert({
      user_id: userData.user.id,
      start_time: new Date().toISOString(),
      start_lat: pos?.lat ?? null,
      start_lng: pos?.lng ?? null,
      location_label: label,
    });

    if (error) setLocationWarning(`Błąd zapisu: ${error.message}`);
    setBusy(false);
    router.refresh();
  }

  async function handleStop() {
    if (!openEntry) return;
    setBusy(true);
    setLocationWarning(null);
    const pos = await getPosition();
    if (!pos) setLocationWarning("Nie udało się pobrać lokalizacji końca – wpis zapisany bez GPS.");

    const supabase = createClient();
    const { error } = await supabase
      .from("time_entries")
      .update({
        end_time: new Date().toISOString(),
        end_lat: pos?.lat ?? null,
        end_lng: pos?.lng ?? null,
      })
      .eq("id", openEntry.id);

    if (error) setLocationWarning(`Błąd zapisu: ${error.message}`);
    setBusy(false);
    router.refresh();
  }

  if (openEntry) {
    return (
      <div className="rounded-[20px] border border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="text-xs uppercase tracking-wide text-paper-500">
          Praca trwa od {formatHm(new Date(openEntry.start_time))}
        </p>
        <p className="my-6 text-6xl font-bold text-gray-900 tabular-nums">
          {formatDuration(elapsed, "stopwatch")}
        </p>
        <div className="mb-5 flex justify-center">
          <LocationBadge label={openEntry.location_label} />
        </div>
        <button
          onClick={handleStop}
          disabled={busy}
          className="w-full rounded-card bg-brick-500 py-3 text-base font-medium text-paper-100 transition-colors hover:bg-brick-600 disabled:opacity-60"
        >
          {busy ? "Zapisywanie..." : "Zakończ pracę"}
        </button>
        {locationWarning && <p className="mt-3 text-xs text-paper-500">{locationWarning}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-[20px] border border-gray-200 bg-white p-8 text-center shadow-sm">
      <p className="mb-4 text-xs uppercase tracking-wide text-paper-500">Gdzie dzisiaj pracujesz?</p>
      <div className="mb-6 grid grid-cols-2 gap-2">
        {LOCATION_OPTIONS.map((opt) => (
          <button
            key={opt}
            onClick={() => setLabel(opt)}
            className={`rounded-card border px-3 py-2 text-sm transition-colors ${
              label === opt
                ? "border-blue-500 bg-blue-50 text-blue-600"
                : "border-ink-700 text-paper-500 hover:border-ink-600"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      <button
        onClick={handleStart}
        disabled={busy}
        className="w-full rounded-xl bg-blue-500 py-4 text-base font-medium text-white transition hover:bg-blue-600 disabled:opacity-60"
      >
        {busy ? "Zapisywanie..." : "Rozpocznij pracę"}
      </button>
      {locationWarning && <p className="mt-3 text-xs text-paper-500">{locationWarning}</p>}
    </div>
  );
}
