import { negativeCorrelated, positiveCorrelated, type MetricRow } from "../data";
import { Download } from "./icons";
import { Legend, MetricGrid } from "./DetailTable";

/* ---------------------------------------------------------------------------
   ONE METRIC, ON ITS OWN

   Where the sub-industry view answers "what moved here", this view answers
   "who else does this touch". It is what a search for a single metric opens.

   Three parts, top to bottom:
     1. the metric's own row, in the same grid as everywhere else - so the
        columns a reader has learned do not change meaning between views
     2. the legend, unchanged
     3. the sub-industries this metric drives, split by whether the effect is
        negative or positive. These are the reason to search for a metric at
        all: an analyst looking at one client wants to know which of their
        other names this movement reaches.
   -------------------------------------------------------------------------- */

function CorrelationTable({
  title,
  rows,
  onOpenSub,
}: {
  title: string;
  rows: { name: string; industry: string; driver: string }[];
  onOpenSub: (name: string) => void;
}) {
  return (
    <section className="min-w-0">
      <h3 className="mb-3 text-[15px] font-semibold text-ink">{title}</h3>
      <div className="overflow-hidden rounded-[4px] border border-line bg-surface">
        <table className="w-full border-collapse text-left text-[12.5px]">
          <thead>
            <tr className="border-b border-line bg-canvas text-ink-soft">
              <th className="px-4 py-3 font-semibold">Sub-Industry</th>
              <th className="border-l border-line px-4 py-3 font-semibold">Industry</th>
              <th className="border-l border-line px-4 py-3 font-semibold">Driver Of</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.name}
                className="border-b border-line/70 last:border-0 transition-colors hover:bg-canvas/60"
              >
                <td className="px-4 py-2.5">
                  <button
                    onClick={() => onOpenSub(r.name)}
                    className="text-link underline-offset-2 hover:underline"
                  >
                    {r.name}
                  </button>
                </td>
                <td className="border-l border-line/40 px-4 py-2.5 text-ink-soft">{r.industry}</td>
                <td className="border-l border-line/40 px-4 py-2.5 text-ink-soft">{r.driver}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-ink-faint">
                  Nothing correlated at the threshold.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function MetricView({
  row,
  moves,
  kims,
  onOpenTrend,
  onOpenSub,
}: {
  row: MetricRow;
  moves: number;
  kims: number;
  onOpenTrend: () => void;
  onOpenSub: (name: string) => void;
}) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="font-serif text-[22px] font-semibold text-ink">{row.name}</h2>
          <span className="rounded-[2px] bg-coral-tint px-2 py-1 text-[12px] font-medium text-ink">
            {String(moves).padStart(2, "0")} / {String(kims).padStart(2, "0")} material movements
          </span>
        </div>
        <button className="inline-flex items-center gap-2 rounded-[3px] border border-line bg-surface px-3 py-1.5 text-[12px] font-semibold uppercase tracking-wide text-ink-soft transition-colors hover:bg-canvas">
          Download <Download width={14} height={14} />
        </button>
      </div>

      <MetricGrid rows={[row]} onOpenTrend={onOpenTrend} />
      <Legend />

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <CorrelationTable
          title="Negatively Correlated Sub-Industries"
          rows={negativeCorrelated}
          onOpenSub={onOpenSub}
        />
        <CorrelationTable
          title="Positively Correlated Sub-Industries"
          rows={positiveCorrelated}
          onOpenSub={onOpenSub}
        />
      </div>
    </div>
  );
}

