import { formatDuration } from "@/lib/utils/time";

export default function StatSummaryCard({
  title,
  worked,
  target,
  leaveSeconds = 0,
}: {
  title: string;
  worked: number;
  target: number;
  leaveSeconds?: number;
}) {
  const remaining = target - worked;
  const overtime = remaining < 0;
  const pct = target > 0 ? Math.min(100, (worked / target) * 100) : 0;

  return (
    <div className="rounded-lg border border-hairline bg-canvas p-5">
      <p className="mb-3 text-[14px] text-ink-muted-48">{title}</p>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="display text-[28px] font-semibold tabular-nums text-ink">
          {formatDuration(worked)}
        </span>
        <span className="text-[13px] text-ink-muted-48">cel {formatDuration(target)}</span>
      </div>
      <div className="mb-2 h-1.5 w-full overflow-hidden rounded-pill bg-divider-soft">
        <div className="h-full rounded-pill bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[13px] text-ink-muted-48">
        {overtime
          ? `Nadgodziny: ${formatDuration(Math.abs(remaining))}`
          : `Pozostało: ${formatDuration(remaining)}`}
      </p>
      {leaveSeconds > 0 && (
        <p className="mt-1 text-[12px] text-ink-muted-48">w tym urlop: {formatDuration(leaveSeconds)}</p>
      )}
    </div>
  );
}
