import type { LocationLabel } from "@/types/database";

export default function LocationBadge({ label }: { label: LocationLabel }) {
  return (
    <span className="rounded-pill bg-parchment px-2.5 py-0.5 text-[12px] text-ink-muted-80">
      {label}
    </span>
  );
}
