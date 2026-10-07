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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="display text-[22px] font-semibold text-ink">Urlop {year}</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="press-scale rounded-pill bg-primary px-4 py-2 text-[14px] font-medium text-white"
        >
          + Dodaj urlop
        </button>
      </div>

      {profile && <LeaveBalanceCard total={profile.annual_leave_days} used={used} />}

      {loading && <p className="text-[14px] text-ink-muted-48">Wczytywanie...</p>}
      {!loading && entries.length === 0 && (
        <p className="text-[14px] text-ink-muted-48">
          Brak wpisów urlopowych. Dodaj urlop, który już wykorzystałeś w tym roku, żeby saldo się zgadzało.
        </p>
      )}

      <div className="rounded-lg border border-hairline bg-canvas px-4">
        {entries.map((e) => (
          <button
            key={e.id}
            onClick={() => setModalEntry(e)}
            className="flex w-full items-center justify-between border-b border-hairline py-3 text-left last:border-b-0"
          >
            <div>
              <p className="text-[15px] text-ink">
                {formatDate(e.start_date)}
                {e.end_date !== e.start_date && <> – {formatDate(e.end_date)}</>}
              </p>
              <p className="mt-0.5 text-[13px] text-ink-muted-48">{LEAVE_TYPE_LABELS[e.leave_type]}</p>
            </div>
            <span className="text-[14px] tabular-nums text-ink">{e.days_count} dni</span>
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
