"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { LeaveEntry, LeaveType } from "@/types/database";
import { LEAVE_TYPE_LABELS } from "@/types/database";

const LEAVE_TYPES: LeaveType[] = ["Wypoczynkowy", "Na zadanie", "Okolicznosciowy", "Inne"];

function businessDaysBetween(startStr: string, endStr: string): number {
  const start = new Date(startStr);
  const end = new Date(endStr);
  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

export default function LeaveEntryForm({
  entry,
  onClose,
}: {
  entry: LeaveEntry | null;
  onClose: (changed: boolean) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(entry?.start_date ?? today);
  const [endDate, setEndDate] = useState(entry?.end_date ?? today);
  const [daysCount, setDaysCount] = useState(
    entry?.days_count ?? businessDaysBetween(today, today)
  );
  const [leaveType, setLeaveType] = useState<LeaveType>(entry?.leave_type ?? "Wypoczynkowy");
  const [notes, setNotes] = useState(entry?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function handleDatesChange(newStart: string, newEnd: string) {
    setStartDate(newStart);
    setEndDate(newEnd);
    if (newStart && newEnd && newEnd >= newStart) {
      setDaysCount(businessDaysBetween(newStart, newEnd));
    }
  }

  async function handleSave() {
    if (!startDate || !endDate || endDate < startDate) {
      setError("Sprawdź zakres dat.");
      return;
    }
    setBusy(true);
    setError(null);
    const supabase = createClient();

    const payload = {
      start_date: startDate,
      end_date: endDate,
      days_count: daysCount,
      leave_type: leaveType,
      notes: notes || null,
    };

    if (entry) {
      const { error } = await supabase.from("leave_entries").update(payload).eq("id", entry.id);
      if (error) return fail(error.message);
    } else {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return fail("Brak sesji.");
      const { error } = await supabase
        .from("leave_entries")
        .insert({ ...payload, user_id: userData.user.id });
      if (error) return fail(error.message);
    }
    setBusy(false);
    onClose(true);
  }

  function fail(msg: string) {
    setError(msg);
    setBusy(false);
  }

  async function handleDelete() {
    if (!entry) return;
    if (!confirm("Usunąć ten wpis urlopu?")) return;
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.from("leave_entries").delete().eq("id", entry.id);
    if (error) return fail(error.message);
    onClose(true);
  }

  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-ink/40 sm:items-center">
      <div className="w-full max-w-sm rounded-t-lg bg-canvas p-6 sm:rounded-lg">
        <h2 className="display mb-5 text-[19px] font-semibold text-ink">
          {entry ? "Edytuj urlop" : "Dodaj urlop"}
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="min-w-0 overflow-x-auto">
              <label className="mb-1.5 block text-[13px] text-ink-muted-48">Od</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleDatesChange(e.target.value, endDate)}
                className="w-full min-w-0 rounded-md border border-hairline bg-canvas px-3 py-2 text-[15px] text-ink outline-none focus:border-primary"
              />
            </div>
            <div className="min-w-0 overflow-x-auto">
              <label className="mb-1.5 block text-[13px] text-ink-muted-48">Do</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => handleDatesChange(startDate, e.target.value)}
                className="w-full min-w-0 rounded-md border border-hairline bg-canvas px-3 py-2 text-[15px] text-ink outline-none focus:border-primary"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] text-ink-muted-48">
              Liczba dni (wyliczona z dni roboczych, możesz poprawić)
            </label>
            <input
              type="number"
              min={0}
              step={0.5}
              value={daysCount}
              onChange={(e) => setDaysCount(Number(e.target.value))}
              className="w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-[15px] text-ink outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] text-ink-muted-48">Typ</label>
            <div className="grid grid-cols-2 gap-2">
              {LEAVE_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setLeaveType(t)}
                  className={`press-scale rounded-pill border px-3 py-1.5 text-[14px] ${
                    leaveType === t
                      ? "border-primary-focus border-2 text-ink"
                      : "border-hairline text-ink-muted-48"
                  }`}
                >
                  {LEAVE_TYPE_LABELS[t]}
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
