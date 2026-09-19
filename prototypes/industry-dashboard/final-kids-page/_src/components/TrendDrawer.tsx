import { useEffect, useMemo, useState } from "react";
import type { SubIndustryCard } from "../data";
import { makeTrend } from "../data";
import { ArrowUp, Close } from "./icons";
import { Loader } from "./Loader";
import { AreaTrend, LineTrend } from "./TrendChart";

const RANGES = ["1Y", "2Y", "3Y", "5Y", "Max"] as const;
const RANGE_POINTS: Record<string, number> = { "1Y": 12, "2Y": 24, "3Y": 36, "5Y": 60, Max: 300 };

export function TrendDrawer({
  card,
  onClose,
}: {
  card: SubIndustryCard | null;
  onClose: () => void;
}) {
  const open = !!card;
  const [range, setRange] = useState("5Y");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(t);
  }, [open, card?.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const trend = useMemo(
    () => (card ? makeTrend(card.id.charCodeAt(1) + 3, RANGE_POINTS[range]) : []),
    [card, range]
  );

  const markers = useMemo(() => {
    if (trend.length < 8) return [];
    const idxs = [
      Math.floor(trend.length * 0.15),
      Math.floor(trend.length * 0.55),
      Math.floor(trend.length * 0.78),
      trend.length - 1,
    ];
    return idxs.map((i) => ({ i, up: trend[i].pct >= 0 }));
  }, [trend]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-navy-deep/45"
        style={{ animation: "overlay-in 200ms ease-out" }}
        onClick={onClose}
      />
      <aside
        className="relative flex h-full w-full max-w-[720px] flex-col bg-surface shadow-2xl"
        style={{ animation: "drawer-in 260ms cubic-bezier(0.22,1,0.36,1)" }}
      >
        <header className="flex items-start justify-between border-b border-line px-7 py-5">
          <div>
            <p className="text-[11px] text-ink-faint">{card!.name}</p>
            <div className="mt-1 flex items-center gap-2">
              <h2 className="font-serif text-[20px] font-semibold text-ink">{card!.mostMoved}</h2>
              <span className="rounded-[2px] bg-canvas px-2 py-0.5 text-[11px] font-medium text-ink-soft">
                Volume Driver
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close drawer"
            className="rounded p-1 text-ink-soft transition-colors hover:bg-canvas hover:text-ink"
          >
            <Close width={20} height={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-7 py-6">
          {loading ? (
            <div className="flex h-full min-h-[420px] items-center justify-center">
              <Loader label="Loading metric trend…" />
            </div>
          ) : (
            <div className="space-y-8">
              {/* percent change table */}
              <section>
                <h3 className="mb-3 text-[15px] font-semibold text-ink">Percent Change Table</h3>
                <div className="overflow-hidden rounded-[4px] border border-line">
                  <table className="w-full text-left text-[12.5px]">
                    <thead className="bg-canvas text-[11px] uppercase tracking-wide text-ink-soft">
                      <tr>
                        <th className="px-3 py-2 font-medium">Latest Value</th>
                        <th className="px-3 py-2 font-medium">As of Date</th>
                        <th className="px-3 py-2 font-medium">% Chg (W-O-W)</th>
                        <th className="px-3 py-2 font-medium">% Chg (M-O-M)</th>
                        <th className="px-3 py-2 font-medium">% Chg (Y-O-Y)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-3 py-3">
                          <div className="font-semibold text-ink">220.6</div>
                          <div className="text-[10.5px] text-ink-faint">kt</div>
                        </td>
                        <td className="px-3 py-3 text-ink-soft">JUN-2023</td>
                        <td className="px-3 py-3 text-ink-faint">N/A</td>
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center gap-1 rounded-[2px] bg-neg px-1.5 py-0.5 font-semibold text-ink">
                            15.97% <ArrowUp width={11} height={11} className="text-neg-strong rotate-180" />
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center gap-1 font-semibold text-ink">
                            01.00% <ArrowUp width={11} height={11} className="text-pos-strong" />
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <ChartSection
                title="Metric Trend"
                range={range}
                onRange={setRange}
                variant="line"
                data={trend}
                markers={markers}
              />
              <ChartSection
                title="Metric Percent Change Trend"
                range={range}
                onRange={setRange}
                variant="area"
                data={trend}
                markers={[]}
              />
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function ChartSection({
  title,
  range,
  onRange,
  variant,
  data,
  markers,
}: {
  title: string;
  range: string;
  onRange: (r: string) => void;
  variant: "line" | "area";
  data: { year: number; value: number; pct: number }[];
  markers: { i: number; up: boolean }[];
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-ink">
          {title} <span className="text-[12px] font-normal text-ink-faint">(Last updated: JUN-2023)</span>
        </h3>
      </div>
      <div className="mb-3 flex gap-4 border-b border-line">
        {RANGES.map((r) => (
          <button
            key={r}
            onClick={() => onRange(r)}
            className={`relative pb-2 text-[12.5px] transition-colors ${
              range === r ? "font-semibold text-ink" : "text-ink-faint hover:text-ink-soft"
            }`}
          >
            {r}
            {range === r && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-amber" />}
          </button>
        ))}
      </div>
      <div className="w-full">
        {variant === "line" ? <LineTrend data={data} markers={markers} /> : <AreaTrend data={data} />}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px] text-ink-soft">
        <Legend color={variant === "line" ? "#7c3aed" : "#2f6fb0"} label={variant === "line" ? "Metric value" : "Percent change"} solid />
        {variant === "line" && (
          <>
            <Legend color="#7cc088" label="Material move (increase)" />
            <Legend color="#e2795d" label="Material move (decrease)" />
          </>
        )}
      </div>
    </section>
  );
}

function Legend({ color, label, solid }: { color: string; label: string; solid?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={solid ? "h-0.5 w-4" : "h-2 w-2 rounded-full"} style={{ background: color }} />
      {label}
    </span>
  );
}

