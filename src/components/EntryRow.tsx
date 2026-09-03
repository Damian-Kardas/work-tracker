import type { TimeEntry } from "@/types/database";
import { diffSeconds, formatDuration, formatHm } from "@/lib/utils/time";
import LocationBadge from "./LocationBadge";

export default function EntryRow({ entry, onEdit }: { entry: TimeEntry; onEdit: () => void }) {
  const seconds = entry.end_time ? diffSeconds(entry.start_time, entry.end_time) : null;

  return (
    <button
      onClick={onEdit}
      className="flex w-full items-center justify-between rounded-card border border-ink-700 bg-ink-800 px-4 py-3 text-left transition-colors hover:border-ink-600"
    >
      <div>
        <p className="font-mono text-sm text-paper-100">
          {formatHm(new Date(entry.start_time))} -{" "}
          {entry.end_time ? formatHm(new Date(entry.end_time)) : "w toku"}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <LocationBadge label={entry.location_label} />
          {entry.is_edited && <span className="text-xs text-paper-500">edytowano</span>}
        </div>
      </div>
      {seconds !== null && (
        <span className="font-mono text-sm text-paper-500">{formatDuration(seconds)}</span>
      )}
    </button>
  );
}
