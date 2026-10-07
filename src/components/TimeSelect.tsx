"use client";

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

export default function TimeSelect({
  value, // "HH:MM" (sekundy, jesli obecne, sa ignorowane)
  onChange,
}: {
  value: string;
  onChange: (hhmm: string) => void;
}) {
  const [h, m] = value.slice(0, 5).split(":");

  return (
    <div className="flex items-center gap-1.5">
      <select
        value={h || "08"}
        onChange={(e) => onChange(`${e.target.value}:${m || "00"}`)}
        className="min-w-0 flex-1 rounded-md border border-hairline bg-canvas px-2 py-2 text-center text-[15px] text-ink outline-none focus:border-primary"
      >
        {HOURS.map((hh) => (
          <option key={hh} value={hh}>
            {hh}
          </option>
        ))}
      </select>
      <span className="text-ink-muted-48">:</span>
      <select
        value={m || "00"}
        onChange={(e) => onChange(`${h || "08"}:${e.target.value}`)}
        className="min-w-0 flex-1 rounded-md border border-hairline bg-canvas px-2 py-2 text-center text-[15px] text-ink outline-none focus:border-primary"
      >
        {MINUTES.map((mm) => (
          <option key={mm} value={mm}>
            {mm}
          </option>
        ))}
      </select>
    </div>
  );
}
