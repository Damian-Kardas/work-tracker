"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { LocationLabel, TimeEntry } from "@/types/database";
import TimeSelect from "./TimeSelect";

const LOCATION_OPTIONS: LocationLabel[] = ["Biuro", "Home office", "Targi / wyjazd", "Inne"];

const pad = (n: number) => String(n).padStart(2, "0");

/** Data (YYYY-MM-DD) w czasie lokalnym urzadzenia - NIE w UTC. */
function toLocalDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toLocalHHMM(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EntryEditModal({
  entry,
  onClose,
  defaultEndTime = "16:00",
}: {
  entry: TimeEntry | null; // null = tryb dodawania nowego wpisu
  onClose: (changed: boolean) => void;
  /** Proponowana godzina zakonczenia (np. standardowy koniec pracy z Ustawien), "HH:MM". */
  defaultEndTime?: string;
}) {
  const todayLocal = toLocalDate(new Date().toISOString());

  const [startDate, setStartDate] = useState(entry?.entry_date ?? todayLocal);
  const [startTime, setStartTime] = useState(entry ? toLocalHHMM(entry.start_time) || "08:00" : "08:00");
  const [endDate, setEndDate] = useState(
    entry?.end_time ? toLocalDate(entry.end_time) : entry?.entry_date ?? todayLocal
  );
  const [endTime, setEndTime] = useState(
    entry?.end_time ? toLocalHHMM(entry.end_time) : defaultEndTime
  );
  const [stillRunning, setStillRunning] = useState(!!entry && !entry.end_time);
  const [label, setLabel] = useState<LocationLabel>(entry?.location_label ?? "Biuro");
  const [notes, setNotes] = useState(entry?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function handleStartDateChange(value: string) {
    // dopoki koniec jest tego samego dnia co poczatek, przesuwaj go razem z poczatkiem
    if (endDate === startDate) setEndDate(value);
    setStartDate(value);
  }

  async function handleSave() {
    setBusy(true);
    setError(null);
    const supabase = createClient();

    const startIso = new Date(`${startDate}T${startTime}:00`).toISOString();
    const endIso = stillRunning ? null : new Date(`${endDate}T${endTime}:00`).toISOString();

    if (endIso && new Date(endIso) <= new Date(startIso)) {
      setError("Koniec musi być później niż początek.");
      setBusy(false);
      return;
    }

    if (endIso) {
      const hours = (new Date(endIso).getTime() - new Date(startIso).getTime()) / 3600000;
      if (hours > 16 && !confirm(`Ten wpis trwa ${Math.round(hours)} godzin. Na pewno zapisać?`)) {
        setBusy(false);
        return;
      }
    }

    if (entry) {
      const payload: Record<string, unknown> = {
        entry_date: startDate,
        start_time: startIso,
        end_time: endIso,
        location_label: label,
        notes: notes || null,
        is_edited: true,
      };
      // po recznym sprawdzeniu zdejmujemy oznaczenie "zamknieto automatycznie"
      if (entry.auto_closed) payload.auto_closed = false;

      const { error } = await supabase.from("time_entries").update(payload).eq("id", entry.id);
      if (error) {
        setError(error.message);
        setBusy(false);
        return;
      }
    } else {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setError("Brak sesji.");
        setBusy(false);
        return;
      }
      const { error } = await supabase.from("time_entries").insert({
        user_id: userData.user.id,
        entry_date: startDate,
        start_time: startIso,
        end_time: endIso,
        location_label: label,
        notes: notes || null,
        is_edited: true,
      });
      if (error) {
        setError(error.message);
        setBusy(false);
        return;
      }
    }

    setBusy(false);
    onClose(true);
  }

  async function handleDelete() {
    if (!entry) return;
    if (!confirm("Usunąć ten wpis?")) return;
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.from("time_entries").delete().eq("id", entry.id);
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    onClose(true);
  }

  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-ink/40 sm:items-center">
      <div className="max-h-[92vh] w-full max-w-sm overflow-y-auto rounded-t-lg bg-canvas p-6 sm:rounded-lg">
        <h2 className="display mb-5 text-[19px] font-semibold text-ink">
          {entry ? "Edytuj wpis" : "Dodaj wpis ręcznie"}
        </h2>

        {entry?.auto_closed && (
          <p className="mb-4 rounded-md bg-parchment p-3 text-[13px] leading-snug text-ink-muted-80">
            Ten wpis został zamknięty automatycznie. Ustaw prawdziwą datę i godzinę zakończenia.
          </p>
        )}

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-ink">Początek</label>
            <div className="space-y-2">
              <div className="min-w-0 overflow-x-auto">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="w-full min-w-0 rounded-md border border-hairline bg-canvas px-3 py-2 text-[15px] text-ink outline-none focus:border-primary"
                />
              </div>
              <TimeSelect value={startTime} onChange={setStartTime} />
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="block text-[13px] font-medium text-ink">Koniec</label>
              <label className="flex items-center gap-1.5 text-[12px] text-ink-muted-48">
                <input
                  type="checkbox"
                  checked={stillRunning}
                  onChange={(e) => setStillRunning(e.target.checked)}
                  className="accent-primary"
                />
                nadal trwa
              </label>
            </div>
            {stillRunning ? (
              <p className="text-[13px] text-ink-muted-48">
                Wpis jest otwarty. Odznacz „nadal trwa”, żeby ustawić datę i godzinę zakończenia.
              </p>
            ) : (
              <div className="space-y-2">
                <div className="min-w-0 overflow-x-auto">
                  <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full min-w-0 rounded-md border border-hairline bg-canvas px-3 py-2 text-[15px] text-ink outline-none focus:border-primary"
                  />
                </div>
                <TimeSelect value={endTime} onChange={setEndTime} />
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] text-ink-muted-48">Lokalizacja</label>
            <div className="grid grid-cols-2 gap-2">
              {LOCATION_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setLabel(opt)}
                  className={`press-scale rounded-pill border px-3 py-1.5 text-[14px] ${
                    label === opt
                      ? "border-2 border-primary-focus text-ink"
                      : "border-hairline text-ink-muted-48"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] text-ink-muted-48">Notatka (opcjonalnie)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-[15px] text-ink outline-none focus:border-primary"
              placeholder="np. targi Poznan"
            />
          </div>
        </div>

        {error && <p className="mt-3 text-[13px] text-danger">{error}</p>}

        <div className="mt-6 flex gap-2">
          <button
            onClick={() => onClose(false)}
            className="press-scale flex-1 rounded-pill border border-hairline py-2.5 text-[14px] text-ink-muted-80"
          >
            Anuluj
          </button>
          {entry && (
            <button
              onClick={handleDelete}
              disabled={busy}
              className="press-scale rounded-pill border border-danger px-4 py-2.5 text-[14px] text-danger"
            >
              Usuń
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={busy}
            className="press-scale flex-1 rounded-pill bg-primary py-2.5 text-[14px] font-medium text-white disabled:opacity-60"
          >
            {busy ? "Zapisywanie..." : "Zapisz"}
          </button>
        </div>
      </div>
    </div>
  );
}
