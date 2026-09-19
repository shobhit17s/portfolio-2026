export function Loader({ label = "Loading data…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-10 w-10">
        <span
          className="absolute inset-0 rounded-full border-2 border-line"
        />
        <span
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-coral border-r-coral/60"
          style={{ animation: "spin-ring 800ms linear infinite" }}
        />
      </div>
      <div className="flex items-center gap-1 text-[13px] text-ink-soft">
        <span>{label}</span>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="inline-block h-1 w-1 rounded-full bg-ink-soft"
            style={{ animation: `dot-pulse 1.2s ease-in-out ${i * 0.18}s infinite` }}
          />
        ))}
      </div>
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="relative h-9 overflow-hidden rounded-[3px] bg-canvas">
          <div
            className="absolute inset-y-0 -left-full w-1/2"
            style={{
              animation: "shimmer 1.4s ease-in-out infinite",
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)",
            }}
          />
        </div>
      ))}
    </div>
  );
}

