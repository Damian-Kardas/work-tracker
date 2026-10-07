"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { LocationLabel, TimeEntry } from "@/types/database";
import { diffSeconds, formatDuration, formatHm } from "@/lib/utils/time";

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

  return (
    <div className="flex flex-col items-center pb-2 pt-6">
      {!openEntry && (
        <div className="mb-8 grid w-full grid-cols-2 gap-2">
          {LOCATION_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => setLabel(opt)}
              className={`press-scale rounded-pill border px-4 py-2.5 text-[14px] transition-colors ${
                label === opt
                  ? "border-primary-focus border-2 bg-canvas text-ink"
                  : "border-hairline bg-canvas text-ink-muted-48"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={openEntry ? handleStop : handleStart}
        disabled={busy}
        className={`press-scale shadow-product flex h-56 w-56 flex-col items-center justify-center rounded-full text-center transition-colors disabled:opacity-70 ${
          openEntry ? "bg-tile-1" : "bg-primary"
        }`}
      >
        {openEntry ? (
          <>
            <span className="text-[12px] text-body-muted">
              od {formatHm(new Date(openEntry.start_time))}
            </span>
            <span className="display mt-1 text-[40px] font-semibold tabular-nums text-white">
              {formatDuration(elapsed, "stopwatch")}
            </span>
            <span className="mt-2 text-[14px] text-white">
              {busy ? "Zapisywanie…" : "Zakończ pracę"}
            </span>
          </>
        ) : (
          <>
            <IconStart />
            <span className="display mt-2 text-[21px] font-semibold text-white">
              {busy ? "Zapisywanie…" : "Rozpocznij"}
            </span>
            <span className="text-[14px] text-white/80">{label}</span>
          </>
        )}
      </button>

      {locationWarning && (
        <p className="mt-4 max-w-[220px] text-center text-[12px] text-ink-muted-48">
          {locationWarning}
        </p>
      )}
    </div>
  );
}

function IconStart() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5l3.2 1.8" />
    </svg>
  );
}
