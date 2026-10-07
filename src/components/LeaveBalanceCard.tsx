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
    <div className="rounded-lg border border-hairline bg-canvas p-6">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="display text-[34px] font-semibold text-ink">{remaining}</p>
          <p className="text-[13px] text-ink-muted-48">dni pozostało z {total}</p>
        </div>
        <p className="text-[13px] text-ink-muted-48">{used} wykorzystano</p>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-pill bg-divider-soft">
        <div className="h-full rounded-pill bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
