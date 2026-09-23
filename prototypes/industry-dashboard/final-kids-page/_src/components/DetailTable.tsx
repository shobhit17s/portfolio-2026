import { Fragment, useMemo, useState } from "react";
import {
  ANNUAL_YEARS,
  annualSeries,
  detailCategories,
  quarters,
  type MetricRow,
  type SubIndustryCard,
} from "../data";
import { ArrowUp, ChevronLeft, ChevronRight, ChevronDown, Download, Info } from "./icons";
import { Sparkline } from "./Sparkline";

function heatColor(v: number, min: number, max: number) {
  const t = (v - min) / (max - min || 1); // 0..1
  // low = red tint, high = green tint, mid = neutral
  if (t > 0.62) {
    const a = (t - 0.62) / 0.38;
    return `rgba(124,192,136,${0.18 + a * 0.42})`;
  }
  if (t < 0.38) {
    const a = (0.38 - t) / 0.38;
    return `rgba(226,121,93,${0.14 + a * 0.4})`;
  }
  return "transparent";
}

/* ---------------------------------------------------------------------------
   THE TWO COLUMN GROUPS

   The grid holds far more history than fits on a screen, so the two groups of
   dated columns open and close independently:

     Quarterly Data   open by default, eight quarters. Closing it leaves only
                      the most recent quarter - enough to know where things
                      stand, without eight columns of context in the way.
     Annual Data      closed by default, one year. Opening it walks back to
                      1994, which is what an analyst does when they want to
                      know whether this quarter is unusual or ordinary.

   Each group's own header carries its control, and the arrow points the way
   the columns will move.
   -------------------------------------------------------------------------- */

function GroupToggle({
  collapse,
  onClick,
  label,
}: {
  collapse: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-[2px] text-ink-faint transition-colors hover:bg-canvas hover:text-navy"
    >
      {collapse ? <ChevronLeft width={12} height={12} /> : <ChevronRight width={12} height={12} />}
    </button>
  );
}


export function MetricGrid({
  rows,
  grouped,
  onOpenTrend,
}: {
  /* Either a flat list of rows (the single-metric view) or the categorised
     list (the sub-industry view). One table, fed two ways. */
  rows?: MetricRow[];
  grouped?: { category: string; rows: MetricRow[] }[];
  onOpenTrend: () => void;
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [quarterlyOpen, setQuarterlyOpen] = useState(true);
  const [annualOpen, setAnnualOpen] = useState(false);

  const flat = useMemo(
    () => (grouped ? grouped.flatMap((c) => c.rows) : rows || []),
    [grouped, rows],
  );

  const allQ = flat.flatMap((r) => r.quarterly);
  const qMin = Math.min(...allQ);
  const qMax = Math.max(...allQ);

  const shownQuarters = quarterlyOpen ? quarters : quarters.slice(0, 1);
  const shownYears = annualOpen ? ANNUAL_YEARS : ANNUAL_YEARS.slice(0, 1);
  const spanCount = 3 + shownQuarters.length + shownYears.length + 3;

  const rowProps = {
    qMin,
    qMax,
    shownQuarters: shownQuarters.length,
    shownYears: shownYears.length,
    onTrend: onOpenTrend,
  };

  return (
    <div className="overflow-x-auto rounded-[4px] border border-line bg-surface">
      <table className="w-full min-w-[980px] border-collapse text-left text-[12.5px]">
        {/* TWO header rows, not one. The group names sit on the first row and
            span their columns; the dates sit on the second, one cell each, so
            every date is directly above the numbers it belongs to. With the
            annual group open that is twenty-nine columns, and nothing short
            of a real cell per date would stay lined up. */}
        <thead>
          <tr className="bg-canvas text-ink-soft">
            <th rowSpan={2} className="sticky left-0 z-10 bg-canvas px-4 py-3 font-semibold">
              Category &amp; KIMs
            </th>
            <th rowSpan={2} className="px-3 py-3 align-top font-semibold">
              <span className="inline-flex items-center gap-1">
                Latest Value <Info width={12} height={12} className="text-link" />
              </span>
              <div className="text-[10px] font-normal text-ink-faint">(as of date)</div>
            </th>
            <th rowSpan={2} className="px-3 py-3 align-top font-semibold">
              % Change<div className="text-[10px] font-normal text-ink-faint">(frequency)</div>
            </th>

            <th
              colSpan={shownQuarters.length}
              className="border-l border-line px-3 pb-1 pt-3 text-left font-semibold"
            >
              <span className="inline-flex items-center gap-1 whitespace-nowrap">
                Quarterly Data
                <Info width={12} height={12} className="text-link" />
                <GroupToggle
                  collapse={quarterlyOpen}
                  onClick={() => setQuarterlyOpen((o) => !o)}
                  label={
                    quarterlyOpen
                      ? "Collapse quarterly data to the latest quarter"
                      : "Show all eight quarters"
                  }
                />
              </span>
            </th>

            <th
              colSpan={shownYears.length}
              className="border-l border-line px-3 pb-1 pt-3 text-left font-semibold"
            >
              <span className="inline-flex items-center gap-1 whitespace-nowrap">
                Annual Data
                <Info width={12} height={12} className="text-link" />
                <GroupToggle
                  collapse={annualOpen}
                  onClick={() => setAnnualOpen((o) => !o)}
                  label={
                    annualOpen ? "Collapse annual data to 2022" : "Show annual data back to 1994"
                  }
                />
              </span>
            </th>

            <th rowSpan={2} className="border-l border-line px-3 py-3 text-center align-top font-semibold">
              Min Value<div className="text-[10px] font-normal text-ink-faint">(date)</div>
            </th>
            <th rowSpan={2} className="border-l border-line px-3 py-3 text-center align-top font-semibold">
              Max Value<div className="text-[10px] font-normal text-ink-faint">(date)</div>
            </th>
            <th rowSpan={2} className="border-l border-line px-3 py-3 text-center align-top font-semibold">
              Trend
            </th>
          </tr>
          <tr className="border-b border-line bg-canvas text-ink-faint">
            {shownQuarters.map((qq, i) => (
              <th
                key={qq}
                className={`px-2 pb-2 text-center text-[10px] font-normal ${
                  i === 0 ? "border-l border-line" : "border-l border-line/40"
                }`}
              >
                {qq}
              </th>
            ))}
            {shownYears.map((y, i) => (
              <th
                key={y}
                className={`px-2 pb-2 text-center text-[10px] font-normal ${
                  i === 0 ? "border-l border-line" : "border-l border-line/40"
                }`}
              >
                {y}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grouped
            ? grouped.map((cat) => {
                const isCollapsed = collapsed[cat.category];
                return (
                  <Fragment key={cat.category}>
                    <tr className="border-b border-line bg-surface">
                      <td colSpan={spanCount} className="px-4 py-2.5">
                        <button
                          onClick={() =>
                            setCollapsed((c) => ({ ...c, [cat.category]: !c[cat.category] }))
                          }
                          className="inline-flex items-center gap-2 text-[13px] font-semibold text-ink"
                        >
                          <ChevronDown
                            width={15}
                            height={15}
                            className={`transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
                          />
                          {cat.category}
                        </button>
                      </td>
                    </tr>
                    {!isCollapsed &&
                      cat.rows.map((row, ri) => (
                        <Row key={ri} row={row} indented {...rowProps} />
                      ))}
                  </Fragment>
                );
              })
            : (rows || []).map((row, ri) => <Row key={ri} row={row} {...rowProps} />)}
        </tbody>
      </table>
    </div>
  );
}

export function Legend({ impact }: { impact?: boolean }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-6 text-[12px] text-ink-soft">
      <span className="inline-flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-coral" /> Material Movement
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-ink-faint/50" /> No Material Movement
      </span>
      {impact && (
        <span className="ml-auto inline-flex items-center gap-2">
          Impact on sub-industry:
          <span className="text-[11px]">Positive</span>
          <span
            className="h-2.5 w-28 rounded-full"
            style={{ background: "linear-gradient(90deg,#7cc088,#eef0f2,#e2795d)" }}
          />
          <span className="text-[11px]">Negative</span>
        </span>
      )}
    </div>
  );
}

export function DetailTable({
  card,
  onOpenTrend,
}: {
  card: SubIndustryCard;
  onOpenTrend: (card: SubIndustryCard) => void;
}) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="font-serif text-[22px] font-semibold text-ink">{card.name}</h2>
          <span className="rounded-[2px] bg-coral-tint px-2 py-1 text-[12px] font-medium text-ink">
            {String(card.moves).padStart(2, "0")} / {String(card.kims).padStart(2, "0")} material
            movements
          </span>
        </div>
        <button className="inline-flex items-center gap-2 rounded-[3px] border border-line bg-surface px-3 py-1.5 text-[12px] font-semibold uppercase tracking-wide text-ink-soft transition-colors hover:bg-canvas">
          Download <Download width={14} height={14} />
        </button>
      </div>

      <MetricGrid grouped={detailCategories} onOpenTrend={() => onOpenTrend(card)} />
      <Legend impact />
    </div>
  );
}

function Row({
  row,
  qMin,
  qMax,
  shownQuarters,
  shownYears,
  onTrend,
  indented,
}: {
  row: MetricRow;
  qMin: number;
  qMax: number;
  shownQuarters: number;
  shownYears: number;
  onTrend: () => void;
  indented?: boolean;
}) {
  const down = row.change >= 15;
  const annual = annualSeries(row.name, row.annual);
  const lo = Math.min(...row.quarterly);
  const hi = Math.max(...row.quarterly);

  return (
    <tr className="border-b border-line/70 last:border-0 transition-colors hover:bg-canvas/60">
      <td className="sticky left-0 z-10 bg-surface px-4 py-2.5">
        <div className={`flex items-center gap-2 ${indented ? "pl-5" : ""}`}>
          <span className={`h-2 w-2 rounded-full ${row.material ? "bg-coral" : "bg-ink-faint/40"}`} />
          <div>
            <div className="font-medium text-ink">{row.name}</div>
            <div className="text-[10.5px] text-ink-faint">{row.unit}</div>
          </div>
        </div>
      </td>
      <td className="px-3 py-2.5">
        <div className="font-semibold text-ink">{row.value}</div>
        <div className="text-[10.5px] text-ink-faint">{row.asOfDate}</div>
      </td>
      <td className="px-3 py-2.5">
        <span
          className={`inline-flex items-center gap-1 rounded-[2px] px-1.5 py-0.5 text-[12px] font-semibold text-ink ${
            row.material ? (down ? "bg-neg" : "bg-pos") : ""
          }`}
        >
          {row.change.toFixed(2)}%
          {down ? (
            <ArrowUp width={11} height={11} className="rotate-180 text-neg-strong" />
          ) : (
            <ArrowUp width={11} height={11} className="text-pos-strong" />
          )}
        </span>
        <div className="mt-0.5 text-[10.5px] text-ink-faint">{row.freq}</div>
      </td>

      {row.quarterly.slice(0, shownQuarters).map((q, i) => (
        <td
          key={i}
          className="border-l border-line/40 px-2 py-2.5 text-center text-[12px] tabular-nums"
          style={{ background: heatColor(q, qMin, qMax) }}
        >
          {q}
        </td>
      ))}

      {annual.slice(0, shownYears).map((a, i) => (
        <td
          key={i}
          className="border-l border-line/40 px-2 py-2.5 text-center text-[12px] tabular-nums text-ink-soft"
        >
          {a}
        </td>
      ))}

      <td className="border-l border-line px-3 py-2.5 text-center text-[12px] tabular-nums text-ink-soft">
        {lo}
        <div className="text-[10px] text-ink-faint">{row.asOfDate}</div>
      </td>
      <td className="border-l border-line px-3 py-2.5 text-center text-[12px] tabular-nums text-ink-soft">
        {hi}
        <div className="text-[10px] text-ink-faint">{row.asOfDate}</div>
      </td>
      <td className="border-l border-line px-3 py-2.5">
        <button
          onClick={onTrend}
          className="mx-auto flex items-center justify-center text-navy transition-transform hover:scale-110"
          aria-label="Open trend"
        >
          <Sparkline data={row.quarterly} />
        </button>
      </td>
    </tr>
  );
}

