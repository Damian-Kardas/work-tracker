"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { LocationLabel, TimeEntry } from "@/types/database";
import TimeSelect from "./TimeSelect";

const LOCATION_OPTIONS: LocationLabel[] = ["Biuro", "Home office", "Targi / wyjazd", "Inne"];

function toLocalHHMM(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EntryEditModal({
  entry,
  onClose,
}: {
  entry: TimeEntry | null; // null = tryb dodawania nowego wpisu
  onClose: (changed: boolean) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(entry?.entry_date ?? today);
  const [startTime, setStartTime] = useState(entry ? toLocalHHMM(entry.start_time) || "08:00" : "08:00");
  const [endTime, setEndTime] = useState(entry ? toLocalHHMM(entry.end_time) || "16:00" : "16:00");
  const [stillRunning, setStillRunning] = useState(!!entry && !entry.end_time);
  const [label, setLabel] = useState<LocationLabel>(entry?.location_label ?? "Biuro");
  const [notes, setNotes] = useState(entry?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    setBusy(true);
    setError(null);
    const supabase = createClient();

    const startIso = new Date(`${date}T${startTime}:00`).toISOString();
    const endIso = stillRunning ? null : new Date(`${date}T${endTime}:00`).toISOString();

    if (endIso && new Date(endIso) <= new Date(startIso)) {
      setError("Koniec musi być później niż początek.");
      setBusy(false);
      return;
    }

    if (entry) {
      const { error } = await supabase
        .from("time_entries")
        .update({
          entry_date: date,
          start_time: startIso,
          end_time: endIso,
          location_label: label,
          notes: notes || null,
          is_edited: true,
        })
        .eq("id", entry.id);
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
        entry_date: date,
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
      <div className="w-full max-w-sm rounded-t-lg bg-canvas p-6 sm:rounded-lg">
        <h2 className="display mb-5 text-[19px] font-semibold text-ink">
          {entry ? "Edytuj wpis" : "Dodaj wpis ręcznie"}
        </h2>

        <div className="space-y-4">
          <div className="min-w-0 overflow-x-auto">
            <label className="mb-1.5 block text-[13px] text-ink-muted-48">Data</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full min-w-0 rounded-md border border-hairline bg-canvas px-3 py-2 text-[15px] text-ink outline-none focus:border-primary"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="min-w-0">
              <label className="mb-1.5 block text-[13px] text-ink-muted-48">Początek</label>
              <TimeSelect value={startTime} onChange={setStartTime} />
            </div>
            <div className="min-w-0">
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-[13px] text-ink-muted-48">Koniec</label>
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
              {!stillRunning && <TimeSelect value={endTime} onChange={setEndTime} />}
            </div>
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
                      ? "border-primary-focus border-2 text-ink"
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
