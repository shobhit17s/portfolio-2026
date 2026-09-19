import { useState } from "react";

type Pt = { year: number; value: number; pct: number };

const W = 640;
const H = 220;
const PAD = { top: 12, right: 12, bottom: 24, left: 34 };

function scales(data: Pt[], key: "value" | "pct") {
  const xs = data.map((d) => d.year);
  const ys = data.map((d) => d[key]);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  let yMin = Math.min(...ys, 0);
  let yMax = Math.max(...ys, 0);
  const padY = (yMax - yMin) * 0.1 || 1;
  yMin -= padY;
  yMax += padY;
  const px = (x: number) => PAD.left + ((x - xMin) / (xMax - xMin || 1)) * (W - PAD.left - PAD.right);
  const py = (y: number) => PAD.top + (1 - (y - yMin) / (yMax - yMin || 1)) * (H - PAD.top - PAD.bottom);
  return { px, py, xMin, xMax, yMin, yMax };
}

function yTicks(min: number, max: number, n = 5) {
  const step = (max - min) / n;
  return Array.from({ length: n + 1 }, (_, i) => min + step * i);
}

export function LineTrend({ data, markers }: { data: Pt[]; markers: { i: number; up: boolean }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const s = scales(data, "value");
  const path = data.map((d, i) => `${i === 0 ? "M" : "L"}${s.px(d.year).toFixed(1)},${s.py(d.value).toFixed(1)}`).join(" ");
  const ticks = yTicks(s.yMin, s.yMax);
  const years = Array.from(new Set(data.map((d) => Math.round(d.year)))).filter((_, i, a) => a.length <= 8 || i % Math.ceil(a.length / 8) === 0);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" onMouseLeave={() => setHover(null)}
      onMouseMove={(e) => {
        const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width) * W;
        let best = 0, bd = Infinity;
        data.forEach((d, i) => { const dd = Math.abs(s.px(d.year) - x); if (dd < bd) { bd = dd; best = i; } });
        setHover(best);
      }}>
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={PAD.left} x2={W - PAD.right} y1={s.py(t)} y2={s.py(t)} stroke="#eef0f2" />
          <text x={PAD.left - 6} y={s.py(t) + 3} textAnchor="end" fontSize="9" fill="#8a95a1">{Math.round(t)}</text>
        </g>
      ))}
      {years.map((yr) => (
        <text key={yr} x={s.px(yr)} y={H - 6} textAnchor="middle" fontSize="9" fill="#8a95a1">{yr}</text>
      ))}
      <path d={path} fill="none" stroke="#7c3aed" strokeWidth="1.4" strokeLinejoin="round" />
      {markers.map((m, k) => (
        <circle key={k} cx={s.px(data[m.i].year)} cy={s.py(data[m.i].value)} r="3.5" fill={m.up ? "#7cc088" : "#e2795d"} stroke="#fff" strokeWidth="1.4" />
      ))}
      {hover !== null && (
        <g>
          <line x1={s.px(data[hover].year)} x2={s.px(data[hover].year)} y1={PAD.top} y2={H - PAD.bottom} stroke="#c9ced4" strokeDasharray="3 3" />
          <circle cx={s.px(data[hover].year)} cy={s.py(data[hover].value)} r="3" fill="#7c3aed" />
          <g transform={`translate(${Math.min(s.px(data[hover].year) + 8, W - 70)}, ${PAD.top + 6})`}>
            <rect width="64" height="30" rx="3" fill="#fff" stroke="#dfe3e8" />
            <text x="6" y="12" fontSize="8" fill="#8a95a1">{Math.round(data[hover].year)}</text>
            <text x="6" y="23" fontSize="10" fontWeight="600" fill="#1c2733">{data[hover].value}</text>
          </g>
        </g>
      )}
    </svg>
  );
}

export function AreaTrend({ data }: { data: Pt[] }) {
  const s = scales(data, "pct");
  const zeroY = s.py(0);
  const line = data.map((d, i) => `${i === 0 ? "M" : "L"}${s.px(d.year).toFixed(1)},${s.py(d.pct).toFixed(1)}`).join(" ");
  const area = `${line} L${s.px(data[data.length - 1].year).toFixed(1)},${zeroY} L${s.px(data[0].year).toFixed(1)},${zeroY} Z`;
  const ticks = yTicks(s.yMin, s.yMax);
  const years = Array.from(new Set(data.map((d) => Math.round(d.year)))).filter((_, i, a) => a.length <= 8 || i % Math.ceil(a.length / 8) === 0);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <defs>
        <linearGradient id="pctFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7fb3e6" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#7fb3e6" stopOpacity="0.04" />
        </linearGradient>
      </defs>
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={PAD.left} x2={W - PAD.right} y1={s.py(t)} y2={s.py(t)} stroke="#eef0f2" />
          <text x={PAD.left - 6} y={s.py(t) + 3} textAnchor="end" fontSize="9" fill="#8a95a1">{Math.round(t)}</text>
        </g>
      ))}
      {years.map((yr) => (
        <text key={yr} x={s.px(yr)} y={H - 6} textAnchor="middle" fontSize="9" fill="#8a95a1">{yr}</text>
      ))}
      <line x1={PAD.left} x2={W - PAD.right} y1={zeroY} y2={zeroY} stroke="#c9ced4" />
      <path d={area} fill="url(#pctFill)" />
      <path d={line} fill="none" stroke="#2f6fb0" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

