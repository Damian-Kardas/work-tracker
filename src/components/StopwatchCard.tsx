"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { LocationLabel, TimeEntry } from "@/types/database";
import { diffSeconds, formatDuration, formatHm } from "@/lib/utils/time";

const LOCATION_OPTIONS: LocationLabel[] = ["Biuro", "Home office", "Targi / wyjazd", "Inne"];
const RADIUS = 92;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

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

export default function StopwatchCard({
  openEntry,
  dailyTargetSeconds,
}: {
  openEntry: TimeEntry | null;
  dailyTargetSeconds: number;
}) {
  const router = useRouter();
  const [label, setLabel] = useState<LocationLabel>("Biuro");
  const [elapsed, setElapsed] = useState(0);
  const [now, setNow] = useState(new Date());
  const [busy, setBusy] = useState(false);
  const [locationWarning, setLocationWarning] = useState<string | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (openEntry) {
      setElapsed(diffSeconds(openEntry.start_time, new Date()));
      tickRef.current = setInterval(() => {
        setElapsed(diffSeconds(openEntry.start_time, new Date()));
        setNow(new Date());
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
    const pct = dailyTargetSeconds > 0 ? Math.min(100, (elapsed / dailyTargetSeconds) * 100) : 0;
    const overtime = dailyTargetSeconds > 0 && elapsed > dailyTargetSeconds;
    const offset = CIRCUMFERENCE * (1 - pct / 100);

    return (
      <div className="flex flex-col items-center pb-2 pt-6">
        <button
          onClick={handleStop}
          disabled={busy}
          className="press-scale relative flex h-56 w-56 items-center justify-center disabled:opacity-70"
        >
          <svg width="224" height="224" viewBox="0 0 224 224" className="absolute inset-0 -rotate-90">
            <defs>
              <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={overtime ? "#34a853" : "#2997ff"} />
                <stop offset="100%" stopColor={overtime ? "#1e7e34" : "#0066cc"} />
              </linearGradient>
            </defs>
            <circle cx="112" cy="112" r={RADIUS} fill="none" stroke="#e5e7eb" strokeWidth="12" />
            <circle
              cx="112"
              cy="112"
              r={RADIUS}
              fill="none"
              stroke="url(#ringGradient)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
              className="transition-[stroke-dashoffset] duration-700 ease-out"
            />
          </svg>

          <div className="flex flex-col items-center">
            <div className="mb-1 flex items-center gap-1 text-ink-muted-48">
              <IconBell />
              <span className="text-[13px] tabular-nums">{formatHm(now)}</span>
            </div>
            <span className="display text-[34px] font-bold tabular-nums text-ink">
              {formatDuration(elapsed, "stopwatch")}
            </span>
            <span className={`mt-1 text-[15px] font-semibold ${overtime ? "text-[#1e7e34]" : "text-primary"}`}>
              {Math.round(pct)}%
            </span>
          </div>
        </button>

        <p className="mt-4 text-[13px] text-ink-muted-48">
          od {formatHm(new Date(openEntry.start_time))} &middot; {busy ? "Zapisywanie…" : "Dotknij, aby zakończyć"}
        </p>

        {locationWarning && (
          <p className="mt-2 max-w-[240px] text-center text-[12px] text-ink-muted-48">{locationWarning}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center pb-2 pt-6">
      <div className="mb-8 grid w-full grid-cols-2 gap-2">
        {LOCATION_OPTIONS.map((opt) => (
          <button
            key={opt}
            onClick={() => setLabel(opt)}
            className={`press-scale rounded-pill border px-4 py-2.5 text-[14px] transition-colors ${
              label === opt
                ? "border-2 border-primary-focus bg-canvas text-ink"
                : "border-hairline bg-canvas text-ink-muted-48"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      <button
        onClick={handleStart}
        disabled={busy}
        className="press-scale relative flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br from-primary-on-dark to-primary text-white shadow-product disabled:opacity-70"
      >
        <span className="pulse-ring absolute inset-0 rounded-full border-2 border-primary" />
        <span className="pulse-ring absolute inset-0 rounded-full border-2 border-primary" style={{ animationDelay: "0.8s" }} />
        <span className="z-10 text-[16px] font-semibold">
          {busy ? "Zapisywanie…" : "Rozpocznij"}
        </span>
      </button>

      <p className="mt-5 text-[13px] text-ink-muted-48">{label}</p>

      {locationWarning && (
        <p className="mt-3 max-w-[240px] text-center text-[12px] text-ink-muted-48">{locationWarning}</p>
      )}
    </div>
  );
}

function IconBell() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}
