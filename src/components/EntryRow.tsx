import type { TimeEntry } from "@/types/database";
import { diffSeconds, formatDuration, formatHm } from "@/lib/utils/time";
import LocationBadge from "./LocationBadge";

export default function EntryRow({ entry, onEdit }: { entry: TimeEntry; onEdit: () => void }) {
  const seconds = entry.end_time ? diffSeconds(entry.start_time, entry.end_time) : null;

  return (
    <button
      onClick={onEdit}
      className="flex w-full items-center justify-between border-b border-hairline py-3 text-left last:border-b-0"
    >
      <div>
        <p className="text-[15px] text-ink">
          {formatHm(new Date(entry.start_time))} – {entry.end_time ? formatHm(new Date(entry.end_time)) : "w toku"}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <LocationBadge label={entry.location_label} />
          {entry.is_edited && <span className="text-[11px] text-ink-muted-48">edytowano</span>}
        </div>
      </div>
      {seconds !== null && (
        <span className="text-[14px] tabular-nums text-ink-muted-48">{formatDuration(seconds)}</span>
      )}
    </button>
  );
}
