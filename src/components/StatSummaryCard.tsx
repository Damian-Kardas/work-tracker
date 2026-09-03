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
    <div className="rounded-card border border-ink-700 bg-ink-800 p-4">
      <p className="mb-3 text-sm text-paper-100">{title}</p>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="font-mono text-2xl font-semibold text-amber-400">
          {formatDuration(worked)}
        </span>
        <span className="text-xs text-paper-500">cel {formatDuration(target)}</span>
      </div>
      <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-ink-700">
        <div
          className={`h-full rounded-full ${overtime ? "bg-moss-500" : "bg-amber-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className={`text-xs ${overtime ? "text-moss-400" : "text-paper-500"}`}>
        {overtime
          ? `Nadgodziny: ${formatDuration(Math.abs(remaining))}`
          : `Pozostało: ${formatDuration(remaining)}`}
      </p>
      {leaveSeconds > 0 && (
        <p className="mt-1 text-xs text-paper-500">
          w tym urlop: {formatDuration(leaveSeconds)}
        </p>
      )}
    </div>
  );
}
