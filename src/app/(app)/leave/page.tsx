"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { LeaveEntry, Profile } from "@/types/database";
import { LEAVE_TYPE_LABELS } from "@/types/database";
import { formatDate } from "@/lib/utils/time";
import { usedLeaveDays } from "@/lib/utils/leave";
import LeaveBalanceCard from "@/components/LeaveBalanceCard";
import LeaveEntryForm from "@/components/LeaveEntryForm";

export default function LeavePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [entries, setEntries] = useState<LeaveEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalEntry, setModalEntry] = useState<LeaveEntry | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return setLoading(false);

    const [{ data: profileData }, { data: leaveData }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userData.user.id).single(),
      supabase
        .from("leave_entries")
        .select("*")
        .eq("user_id", userData.user.id)
        .order("start_date", { ascending: false }),
    ]);

    setProfile((profileData as Profile | null) ?? null);
    setEntries((leaveData as LeaveEntry[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const year = new Date().getFullYear();
  const used = usedLeaveDays(entries, year);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-paper-100">Urlop {year}</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="rounded-card bg-ink-700 px-3 py-1.5 text-sm text-paper-100 hover:bg-ink-600"
        >
          + Dodaj urlop
        </button>
      </div>

      {profile && <LeaveBalanceCard total={profile.annual_leave_days} used={used} />}

      {loading && <p className="text-sm text-paper-500">Wczytywanie...</p>}
      {!loading && entries.length === 0 && (
        <p className="text-sm text-paper-500">
          Brak wpisów urlopowych. Dodaj urlop, który już wykorzystałeś w tym roku, żeby saldo się zgadzało.
        </p>
      )}

      <div className="space-y-2">
        {entries.map((e) => (
          <button
            key={e.id}
            onClick={() => setModalEntry(e)}
            className="flex w-full items-center justify-between rounded-card border border-ink-700 bg-ink-800 px-4 py-3 text-left hover:border-ink-600"
          >
            <div>
              <p className="text-sm text-paper-100">
                {formatDate(e.start_date)}
                {e.end_date !== e.start_date && <> &ndash; {formatDate(e.end_date)}</>}
              </p>
              <p className="mt-1 text-xs text-paper-500">{LEAVE_TYPE_LABELS[e.leave_type]}</p>
            </div>
            <span className="font-mono text-sm text-moss-400">{e.days_count} dni</span>
          </button>
        ))}
      </div>

      {(modalEntry || showAdd) && (
        <LeaveEntryForm
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
