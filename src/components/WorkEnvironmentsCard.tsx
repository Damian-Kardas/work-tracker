import type { LocationLabel } from "@/types/database";

const COLORS: Record<LocationLabel, string> = {
  Biuro: "#0066cc",
  "Home office": "#2997ff",
  "Targi / wyjazd": "#8ab8f0",
  Inne: "#c7d3e0",
};

export default function WorkEnvironmentsCard({
  daysByLocation,
}: {
  daysByLocation: Partial<Record<LocationLabel, number>>;
}) {
  const rows = (Object.entries(daysByLocation) as [LocationLabel, number][]).filter(
    ([, days]) => days > 0
  );
  const totalDays = rows.reduce((sum, [, d]) => sum + d, 0);

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-hairline bg-canvas p-5">
        <p className="text-[14px] font-medium text-ink">Miejsca pracy</p>
        <p className="mt-2 text-[13px] text-ink-muted-48">Brak danych w tym miesiącu.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-hairline bg-canvas p-5">
      <p className="text-[14px] font-medium text-ink">Miejsca pracy</p>
      <p className="mt-0.5 text-[12px] text-ink-muted-48">Podział w tym miesiącu</p>

      <div className="mt-4 flex h-2.5 w-full overflow-hidden rounded-pill bg-divider-soft">
        {rows.map(([label, days]) => (
          <div
            key={label}
            style={{ width: `${(days / totalDays) * 100}%`, backgroundColor: COLORS[label] }}
          />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {rows.map(([label, days]) => (
          <div key={label}>
            <p className="flex items-center gap-1.5 text-[12px] text-ink-muted-80">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: COLORS[label] }} />
              <span className="truncate">{label}</span>
            </p>
            <p className="display mt-0.5 text-[17px] font-semibold tabular-nums text-ink">
              {Math.round((days / totalDays) * 100)}%
            </p>
            <p className="text-[11px] text-ink-muted-48">{days} dni</p>
          </div>
        ))}
      </div>
    </div>
  );
}
