"use client";

import { useState } from "react";
import { formatDuration } from "@/lib/utils/time";

interface MonthData {
  worked: number;
  overtime: number;
  workedDays: number;
  target: number;
}

const MONTH_NAMES = [
  "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
  "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień",
];

export default function MonthSummaryNav({ months }: { months: Record<string, MonthData> }) {
  const sortedKeys = Object.keys(months).sort();
  const [index, setIndex] = useState(sortedKeys.length - 1);

  if (sortedKeys.length === 0) {
    return (
      <div className="rounded-lg border border-hairline bg-canvas p-5">
        <p className="text-[14px] text-ink-muted-48">Brak danych historycznych.</p>
      </div>
    );
  }

  const key = sortedKeys[index];
  const data = months[key];
  const [year, monthNum] = key.split("-").map(Number);
  const label = `${MONTH_NAMES[monthNum - 1]} ${year}`;
  const completion = data.target > 0 ? Math.min(100, (data.worked / data.target) * 100) : 0;
  const avgDaily = data.workedDays > 0 ? data.worked / data.workedDays : 0;

  return (
    <div className="rounded-lg border border-hairline bg-canvas p-5">
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="press-scale flex h-8 w-8 items-center justify-center rounded-pill bg-parchment text-ink disabled:opacity-30"
        >
          ‹
        </button>
        <p className="text-[15px] font-medium text-ink">{label}</p>
        <button
          onClick={() => setIndex((i) => Math.min(sortedKeys.length - 1, i + 1))}
          disabled={index === sortedKeys.length - 1}
          className="press-scale flex h-8 w-8 items-center justify-center rounded-pill bg-parchment text-ink disabled:opacity-30"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-md bg-parchment p-3 text-center">
          <p className="text-[11px] text-ink-muted-48">Łącznie</p>
          <p className="display mt-1 text-[16px] font-bold tabular-nums text-ink">
            {formatDuration(data.worked)}
          </p>
        </div>
        <div className="rounded-md bg-parchment p-3 text-center">
          <p className="text-[11px] text-ink-muted-48">Nadgodziny</p>
          <p className="display mt-1 text-[16px] font-bold tabular-nums text-primary">
            +{formatDuration(data.overtime)}
          </p>
        </div>
        <div className="rounded-md bg-parchment p-3 text-center">
          <p className="text-[11px] text-ink-muted-48">Średnio/dzień</p>
          <p className="display mt-1 text-[16px] font-bold tabular-nums text-ink">
            {formatDuration(avgDaily)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-[12px] text-ink-muted-48">
        <span>Realizacja celu</span>
        <span className="font-medium text-ink">{Math.round(completion)}%</span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-pill bg-divider-soft">
        <div className="h-full rounded-pill bg-primary" style={{ width: `${completion}%` }} />
      </div>
    </div>
  );
}
