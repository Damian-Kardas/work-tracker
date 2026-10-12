export default function Loading() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Wczytywanie">
      <div className="flex flex-col items-center pt-6">
        <div className="h-56 w-56 rounded-full border-[12px] border-divider-soft" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-[74px] rounded-lg border border-hairline bg-canvas" />
        ))}
      </div>
      <div className="h-32 rounded-lg border border-hairline bg-canvas" />
    </div>
  );
}
