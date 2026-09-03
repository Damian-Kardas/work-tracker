"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { LocationLabel, TimeEntry } from "@/types/database";

const LOCATION_OPTIONS: LocationLabel[] = ["Biuro", "Home office", "Targi / wyjazd", "Inne"];

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

export default function EntryEditModal({
  entry,
  onClose,
}: {
  entry: TimeEntry | null; // null = tryb dodawania nowego wpisu
  onClose: (changed: boolean) => void;
}) {
  const [date, setDate] = useState(entry?.entry_date ?? new Date().toISOString().slice(0, 10));
  const [start, setStart] = useState(
    entry ? toLocalInput(entry.start_time) : `${new Date().toISOString().slice(0, 10)}T08:00`
  );
  const [end, setEnd] = useState(
    entry ? toLocalInput(entry.end_time) : `${new Date().toISOString().slice(0, 10)}T16:00`
  );
  const [label, setLabel] = useState<LocationLabel>(entry?.location_label ?? "Biuro");
  const [notes, setNotes] = useState(entry?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    setBusy(true);
    setError(null);
    const supabase = createClient();

    if (!start) {
      setError("Podaj godzinę rozpoczęcia.");
      setBusy(false);
      return;
    }
    const startIso = new Date(start).toISOString();
    const endIso = end ? new Date(end).toISOString() : null;
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
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/60 sm:items-center">
      <div className="w-full max-w-sm rounded-t-card border border-ink-700 bg-ink-800 p-5 sm:rounded-card">
        <h2 className="mb-4 text-base font-semibold text-paper-100">
          {entry ? "Edytuj wpis" : "Dodaj wpis ręcznie"}
        </h2>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-paper-500">Data</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-card border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-paper-100 outline-none focus:border-amber-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0">
              <label className="mb-1 block text-xs text-paper-500">Początek</label>
              <input
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-full min-w-0 rounded-card border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-paper-100 outline-none focus:border-amber-500"
              />
            </div>
            <div className="min-w-0">
              <label className="mb-1 block text-xs text-paper-500">Koniec</label>
              <input
                type="datetime-local"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full min-w-0 rounded-card border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-paper-100 outline-none focus:border-amber-500"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-paper-500">Lokalizacja</label>
            <div className="grid grid-cols-2 gap-2">
              {LOCATION_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setLabel(opt)}
                  className={`rounded-card border px-3 py-1.5 text-sm ${
                    label === opt
                      ? "border-amber-500 bg-amber-500/10 text-amber-400"
                      : "border-ink-700 text-paper-500"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-paper-500">Notatka (opcjonalnie)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-card border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-paper-100 outline-none focus:border-amber-500"
              placeholder="np. targi Poznan"
            />
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-brick-400">{error}</p>}

        <div className="mt-5 flex gap-2">
          <button
            onClick={() => onClose(false)}
            className="flex-1 rounded-card border border-ink-700 py-2 text-sm text-paper-300"
          >
            Anuluj
          </button>
          {entry && (
            <button
              onClick={handleDelete}
              disabled={busy}
              className="rounded-card border border-brick-500 px-3 py-2 text-sm text-brick-400"
            >
              Usuń
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={busy}
            className="flex-1 rounded-card bg-amber-500 py-2 text-sm font-medium text-ink-950 disabled:opacity-60"
          >
            {busy ? "Zapisywanie..." : "Zapisz"}
          </button>
        </div>
      </div>
    </div>
  );
}
