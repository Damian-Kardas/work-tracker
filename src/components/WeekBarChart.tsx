import type { DayBreakdown } from "@/lib/utils/stats";
import { formatDuration } from "@/lib/utils/time";

const WEEKDAY_LABELS = ["P", "W", "Ś", "C", "Pt", "So", "Nd"];

export default function WeekBarChart({
  days,
  dailyTargetSeconds,
  totalSeconds,
  weeklyTargetSeconds,
  todayDate,
}: {
  days: DayBreakdown[];
  dailyTargetSeconds: number;
  totalSeconds: number;
  weeklyTargetSeconds: number;
  todayDate: string;
}) {
  const maxWorked = Math.max(...days.map((d) => d.worked), 0);
  const scale = Math.max(dailyTargetSeconds * 1.35, maxWorked * 1.1, 1);
  const baselinePct = Math.min(100, (dailyTargetSeconds / scale) * 100);
  const diff = totalSeconds - weeklyTargetSeconds;

  return (
    <div className="rounded-lg border border-hairline bg-canvas p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#34a853]" />
          <p className="text-[14px] font-medium text-ink">Rytm pracy</p>
        </div>
        <p className="text-[12px] text-ink-muted-48">ten tydzień</p>
      </div>

      <div className="mb-1 flex items-baseline gap-2">
        <span className="display text-[28px] font-bold tabular-nums text-ink">
          {formatDuration(totalSeconds)}
        </span>
        <span
          className={`rounded-pill px-2 py-0.5 text-[12px] font-medium ${
            diff >= 0 ? "bg-[#e6f4ea] text-[#1e7e34]" : "bg-parchment text-ink-muted-48"
          }`}
        >
          {diff >= 0
            ? `+${formatDuration(diff)} nadgodzin`
            : `${formatDuration(Math.abs(diff))} do normy tygodnia`}
        </span>
      </div>

      <div className="relative mt-6 flex h-32 items-end justify-between gap-2">
        <div
          className="absolute left-0 right-0 border-t border-dashed border-ink-muted-48/40"
          style={{ bottom: `${baselinePct}%` }}
        />
        {days.map((day) => {
          const isToday = day.date === todayDate;
          const hasData = day.worked > 0;
          const standardPct = (day.standard / scale) * 100;
          const overtimePct = (day.overtime / scale) * 100;

          return (
            <div key={day.date} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex h-24 w-full items-end justify-center">
                {hasData ? (
                  <div
                    className="flex w-full max-w-[22px] flex-col-reverse overflow-hidden rounded-sm"
                    style={{ height: `${standardPct + overtimePct}%` }}
                  >
                    <div className="w-full bg-primary" style={{ height: `${(standardPct / (standardPct + overtimePct)) * 100}%` }} />
                    {overtimePct > 0 && (
                      <div
                        className="w-full bg-[#34a853]"
                        style={{ height: `${(overtimePct / (standardPct + overtimePct)) * 100}%` }}
                      />
                    )}
                  </div>
                ) : (
                  <div className="h-1 w-full max-w-[22px] rounded-sm bg-divider-soft" />
                )}
              </div>
              <span className={`text-[11px] ${isToday ? "font-semibold text-primary" : "text-ink-muted-48"}`}>
                {WEEKDAY_LABELS[day.weekday - 1]}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex items-center gap-4 border-t border-hairline pt-4 text-[12px] text-ink-muted-48">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-primary" /> Standardowe
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-[#34a853]" /> Nadgodziny
        </span>
      </div>
    </div>
  );
}
