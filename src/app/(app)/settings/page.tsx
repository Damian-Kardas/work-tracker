"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";
import PushOptIn from "@/components/PushOptIn";

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

  if (loading) return <p className="text-sm text-paper-500">Wczytywanie...</p>;
  if (!profile) return <p className="text-sm text-brick-400">Nie udało się wczytać profilu.</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-paper-100">Ustawienia</h1>

      <div className="space-y-4 rounded-card border border-ink-700 bg-ink-800 p-4">
        <div>
          <label className="mb-1 block text-xs text-paper-500">Email</label>
          <p className="text-sm text-paper-300">{email}</p>
        </div>

        <div>
          <label className="mb-1 block text-xs text-paper-500">Imię i nazwisko</label>
          <input
            type="text"
            value={profile.full_name ?? ""}
            onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
            className="w-full rounded-card border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-paper-100 outline-none focus:border-amber-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="min-w-0">
            <label className="mb-1 block text-xs text-paper-500">Standardowy start</label>
            <input
              type="time"
              value={profile.standard_start_time.slice(0, 5)}
              onChange={(e) =>
                setProfile({ ...profile, standard_start_time: `${e.target.value}:00` })
              }
              className="w-full min-w-0 rounded-card border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-paper-100 outline-none focus:border-amber-500"
            />
          </div>
          <div className="min-w-0">
            <label className="mb-1 block text-xs text-paper-500">Standardowy koniec</label>
            <input
              type="time"
              value={profile.standard_end_time.slice(0, 5)}
              onChange={(e) =>
                setProfile({ ...profile, standard_end_time: `${e.target.value}:00` })
              }
              className="w-full min-w-0 rounded-card border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-paper-100 outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs text-paper-500">Dni robocze</label>
          <div className="flex gap-1.5">
            {WEEKDAYS.map((d) => {
              const active = profile.work_days.includes(d.value);
              return (
                <button
                  key={d.value}
                  onClick={() => toggleDay(d.value)}
                  className={`flex-1 rounded-card border py-2 text-xs ${
                    active
                      ? "border-amber-500 bg-amber-500/10 text-amber-400"
                      : "border-ink-700 text-paper-500"
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs text-paper-500">Roczny wymiar urlopu (dni)</label>
          <input
            type="number"
            min={0}
            step={1}
            value={profile.annual_leave_days}
            onChange={(e) =>
              setProfile({ ...profile, annual_leave_days: Number(e.target.value) })
            }
            className="w-full rounded-card border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-paper-100 outline-none focus:border-amber-500"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-card bg-amber-500 py-2.5 text-sm font-medium text-ink-950 hover:bg-amber-400 disabled:opacity-60"
        >
          {saving ? "Zapisywanie..." : saved ? "Zapisano ✓" : "Zapisz ustawienia"}
        </button>
      </div>

      <div className="rounded-card border border-ink-700 bg-ink-800 p-4">
        <PushOptIn />
      </div>
    </div>
  );
}
