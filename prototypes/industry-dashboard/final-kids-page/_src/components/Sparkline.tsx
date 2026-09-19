export function Sparkline({ data, className = "" }: { data: number[]; className?: string }) {
  const w = 52;
  const h = 22;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * (w - 2) + 1;
    const y = h - 1 - ((d - min) / span) * (h - 2);
    return `${x},${y}`;
  });
  const last = data[data.length - 1];
  const lx = (w - 2) + 1;
  const ly = h - 1 - ((last - min) / span) * (h - 2);
  return (
    <svg width={w} height={h} className={className} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts.join(" ")} fill="none" stroke="var(--color-navy)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lx} cy={ly} r="1.6" fill="var(--color-coral)" />
    </svg>
  );
}

