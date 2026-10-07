"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";
import PushOptIn from "@/components/PushOptIn";
import TimeSelect from "@/components/TimeSelect";

const WEEKDAYS: { value: number; label: string }[] = [
  { value: 1, label: "Pon" },
  { value: 2, label: "Wt" },
  { value: 3, label: "Śr" },
  { value: 4, label: "Czw" },
  { value: 5, label: "Pt" },
  { value: 6, label: "Sob" },
  { value: 7, label: "Ndz" },
];

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return setLoading(false);
      setEmail(userData.user.email ?? "");
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userData.user.id)
        .single();
      setProfile((data as Profile | null) ?? null);
      setLoading(false);
    }
    load();
  }, []);

  function toggleDay(day: number) {
    if (!profile) return;
    const has = profile.work_days.includes(day);
    const work_days = has
      ? profile.work_days.filter((d) => d !== day)
      : [...profile.work_days, day].sort();
    setProfile({ ...profile, work_days });
  }

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    setSaved(false);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        standard_start_time: profile.standard_start_time,
        standard_end_time: profile.standard_end_time,
        work_days: profile.work_days,
        annual_leave_days: profile.annual_leave_days,
      })
      .eq("id", profile.id);
    setSaving(false);
    if (!error) setSaved(true);
  }

  if (loading) return <p className="text-[14px] text-ink-muted-48">Wczytywanie...</p>;
  if (!profile) return <p className="text-[14px] text-danger">Nie udało się wczytać profilu.</p>;

  return (
    <div className="space-y-6">
      <h1 className="display text-[22px] font-semibold text-ink">Ustawienia</h1>

      <div className="space-y-5 rounded-lg border border-hairline bg-canvas p-5">
        <div>
          <label className="mb-1.5 block text-[13px] text-ink-muted-48">Email</label>
          <p className="text-[15px] text-ink-muted-80">{email}</p>
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] text-ink-muted-48">Imię i nazwisko</label>
          <input
            type="text"
            value={profile.full_name ?? ""}
            onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
            className="w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-[15px] text-ink outline-none focus:border-primary"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="min-w-0">
            <label className="mb-1.5 block text-[13px] text-ink-muted-48">Standardowy start</label>
            <TimeSelect
              value={profile.standard_start_time.slice(0, 5)}
              onChange={(hhmm) => setProfile({ ...profile, standard_start_time: `${hhmm}:00` })}
            />
          </div>
          <div className="min-w-0">
            <label className="mb-1.5 block text-[13px] text-ink-muted-48">Standardowy koniec</label>
            <TimeSelect
              value={profile.standard_end_time.slice(0, 5)}
              onChange={(hhmm) => setProfile({ ...profile, standard_end_time: `${hhmm}:00` })}
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-[13px] text-ink-muted-48">Dni robocze</label>
          <div className="flex gap-1.5">
            {WEEKDAYS.map((d) => {
              const active = profile.work_days.includes(d.value);
              return (
                <button
                  key={d.value}
                  onClick={() => toggleDay(d.value)}
                  className={`press-scale flex-1 rounded-pill border py-2 text-[12px] ${
                    active ? "border-primary bg-primary text-white" : "border-hairline text-ink-muted-48"
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] text-ink-muted-48">Roczny wymiar urlopu (dni)</label>
          <input
            type="number"
            min={0}
            step={1}
            value={profile.annual_leave_days}
            onChange={(e) => setProfile({ ...profile, annual_leave_days: Number(e.target.value) })}
            className="w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-[15px] text-ink outline-none focus:border-primary"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="press-scale w-full rounded-pill bg-primary py-3 text-[15px] font-medium text-white disabled:opacity-60"
        >
          {saving ? "Zapisywanie..." : saved ? "Zapisano" : "Zapisz ustawienia"}
        </button>
      </div>

      <div className="rounded-lg border border-hairline bg-canvas p-5">
        <PushOptIn />
      </div>
    </div>
  );
}
