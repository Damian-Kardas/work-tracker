export default function LeaveBalanceCard({
  total,
  used,
}: {
  total: number;
  used: number;
}) {
  const remaining = Math.max(0, total - used);
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;

  return (
    <div className="rounded-card border border-ink-700 bg-ink-800 p-5">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <p className="font-mono text-3xl font-semibold text-moss-400">{remaining}</p>
          <p className="text-xs text-paper-500">dni pozostało z {total}</p>
        </div>
        <p className="text-sm text-paper-500">{used} wykorzystano</p>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-700">
        <div className="h-full rounded-full bg-moss-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
