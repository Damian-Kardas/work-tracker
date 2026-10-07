"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";
import PushOptIn from "@/components/PushOptIn";
import TimeSelect from "@/components/TimeSelect";
import Toggle from "@/components/Toggle";

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
        reminder_start_enabled: profile.reminder_start_enabled,
        reminder_end_enabled: profile.reminder_end_enabled,
        overtime_cap_enabled: profile.overtime_cap_enabled,
        overtime_cap_hours: profile.overtime_cap_hours,
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
      </div>

      <div className="rounded-lg border border-hairline bg-canvas p-5">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
            <IconBell />
          </span>
          <p className="text-[15px] font-medium text-ink">Tempo i przypomnienia</p>
        </div>

        <ReminderRow
          icon={<IconSun />}
          title="Przypomnienie startu"
          subtitle="Powiadomienie, żeby rozpocząć pracę"
        >
          <TimeSelect
            value={profile.standard_start_time.slice(0, 5)}
            onChange={(hhmm) => setProfile({ ...profile, standard_start_time: `${hhmm}:00` })}
          />
          <Toggle
            checked={profile.reminder_start_enabled}
            onChange={(v) => setProfile({ ...profile, reminder_start_enabled: v })}
            label="Przypomnienie startu"
          />
        </ReminderRow>

        <ReminderRow
          icon={<IconMoon />}
          title="Przypomnienie końca"
          subtitle="Powiadomienie, żeby zakończyć pracę"
        >
          <TimeSelect
            value={profile.standard_end_time.slice(0, 5)}
            onChange={(hhmm) => setProfile({ ...profile, standard_end_time: `${hhmm}:00` })}
          />
          <Toggle
            checked={profile.reminder_end_enabled}
            onChange={(v) => setProfile({ ...profile, reminder_end_enabled: v })}
            label="Przypomnienie końca"
          />
        </ReminderRow>

        <ReminderRow
          icon={<IconWarning />}
          title="Limit nadgodzin"
          subtitle="Powiadomienie po przekroczeniu"
          last
        >
          <input
            type="number"
            min={0}
            step={0.5}
            value={profile.overtime_cap_hours}
            onChange={(e) => setProfile({ ...profile, overtime_cap_hours: Number(e.target.value) })}
            className="w-20 rounded-md border border-hairline bg-canvas px-2 py-1.5 text-center text-[14px] text-ink outline-none focus:border-primary"
          />
          <Toggle
            checked={profile.overtime_cap_enabled}
            onChange={(v) => setProfile({ ...profile, overtime_cap_enabled: v })}
            label="Limit nadgodzin"
          />
        </ReminderRow>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="press-scale w-full rounded-pill bg-primary py-3 text-[15px] font-medium text-white disabled:opacity-60"
      >
        {saving ? "Zapisywanie..." : saved ? "Zapisano" : "Zapisz ustawienia"}
      </button>

      <div className="rounded-lg border border-hairline bg-canvas p-5">
        <PushOptIn />
      </div>
    </div>
  );
}

function ReminderRow({
  icon,
  title,
  subtitle,
  children,
  last = false,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 py-3.5 ${!last ? "border-b border-hairline" : ""}`}>
      <span className="mt-0.5 shrink-0 text-ink-muted-48">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] text-ink">{title}</p>
        <p className="truncate text-[12px] text-ink-muted-48">{subtitle}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  );
}

function IconBell() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}
function IconSun() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2.5v2.3M12 19.2v2.3M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.5 12h2.3M19.2 12h2.3M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6" />
    </svg>
  );
}
function IconMoon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 14.5A8.5 8.5 0 119.5 4a7 7 0 0010.5 10.5z" />
    </svg>
  );
}
function IconWarning() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3.5l9.5 16.5h-19z" />
      <path d="M12 10v4" />
      <path d="M12 17.2h.01" />
    </svg>
  );
}
