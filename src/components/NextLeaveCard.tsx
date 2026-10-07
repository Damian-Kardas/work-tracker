import type { LeaveEntry } from "@/types/database";
import { LEAVE_TYPE_LABELS } from "@/types/database";
import { daysUntil } from "@/lib/utils/leave";
import { formatDate } from "@/lib/utils/time";

export default function NextLeaveCard({ leave, today }: { leave: LeaveEntry; today: string }) {
  const days = daysUntil(leave.start_date, today);
  const alreadyStarted = leave.start_date <= today;

  return (
    <div className="rounded-lg border border-hairline bg-canvas p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="inline-block rounded-pill bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
            {alreadyStarted ? "TRWA" : "NASTĘPNY URLOP"}
          </span>
          <p className="display mt-2 text-[17px] font-semibold text-ink">
            {LEAVE_TYPE_LABELS[leave.leave_type]}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-ink-muted-48">
            <IconCalendar />
            {formatDate(leave.start_date)}
            {leave.end_date !== leave.start_date && <> – {formatDate(leave.end_date)}</>}
          </p>
        </div>

        {!alreadyStarted && (
          <div className="shrink-0 rounded-md bg-parchment px-3 py-2 text-center">
            <p className="text-[10px] uppercase tracking-wide text-ink-muted-48">zaczyna się za</p>
            <p className="display text-[22px] font-bold tabular-nums text-ink">{days}</p>
            <p className="text-[10px] text-ink-muted-48">dni</p>
          </div>
        )}
      </div>

      {leave.notes && (
        <>
          <div className="my-3 h-px bg-hairline" />
          <p className="text-[13px] text-ink-muted-80">{leave.notes}</p>
        </>
      )}
    </div>
  );
}

function IconCalendar() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M3.5 10h17" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
    </svg>
  );
}
