import type { LocationLabel } from "@/types/database";

const styles: Record<LocationLabel, string> = {
  Biuro: "bg-ink-700 text-paper-100",
  "Home office": "bg-moss-500/20 text-moss-400",
  "Targi / wyjazd": "bg-amber-500/20 text-amber-400",
  Inne: "bg-paper-500/20 text-paper-300",
};

export default function LocationBadge({ label }: { label: LocationLabel }) {
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${styles[label]}`}>{label}</span>
  );
}
