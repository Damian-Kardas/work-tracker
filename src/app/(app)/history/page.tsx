"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { TimeEntry } from "@/types/database";
import { formatDate } from "@/lib/utils/time";
import EntryRow from "@/components/EntryRow";
import EntryEditModal from "@/components/EntryEditModal";

export default function HistoryPage() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalEntry, setModalEntry] = useState<TimeEntry | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("time_entries")
      .select("*")
      .order("start_time", { ascending: false })
      .limit(200);
    setEntries((data as TimeEntry[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const grouped = entries.reduce<Record<string, TimeEntry[]>>((acc, e) => {
    (acc[e.entry_date] ??= []).push(e);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-paper-100">Historia</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="rounded-card bg-ink-700 px-3 py-1.5 text-sm text-paper-100 hover:bg-ink-600"
        >
          + Dodaj wpis
        </button>
      </div>

      {loading && <p className="text-sm text-paper-500">Wczytywanie...</p>}
      {!loading && entries.length === 0 && (
        <p className="text-sm text-paper-500">Brak wpisów. Kliknij &quot;Dodaj wpis&quot;, żeby uzupełnić historię.</p>
      )}

      {Object.entries(grouped).map(([date, dayEntries]) => (
        <div key={date}>
          <p className="mb-2 text-xs uppercase tracking-wide text-paper-500">{formatDate(date)}</p>
          <div className="space-y-2">
            {dayEntries.map((e) => (
              <EntryRow key={e.id} entry={e} onEdit={() => setModalEntry(e)} />
            ))}
          </div>
        </div>
      ))}

      {(modalEntry || showAdd) && (
        <EntryEditModal
          entry={modalEntry}
          onClose={(changed) => {
            setModalEntry(null);
            setShowAdd(false);
            if (changed) load();
          }}
        />
      )}
    </div>
  );
}
