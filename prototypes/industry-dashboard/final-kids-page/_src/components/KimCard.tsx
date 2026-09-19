import { useState } from "react";
import type { SubIndustryCard } from "../data";
import { Star, Trend } from "./icons";

export function KimCard({
  card,
  onOpenTrend,
  onOpen,
}: {
  card: SubIndustryCard;
  onOpenTrend: (card: SubIndustryCard) => void;
  onOpen: (card: SubIndustryCard) => void;
}) {
  const [hover, setHover] = useState(false);
  const [fav, setFav] = useState(card.favorite);

  return (
    <div
      className="group relative z-0 cursor-pointer rounded-[3px] border-x border-b border-line bg-surface transition-all duration-200 hover:z-40 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_-14px_rgba(16,49,94,0.45)] hover:border-navy/25"
      style={{ borderTop: "3px solid var(--color-coral)" }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => onOpen(card)}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="text-[13.5px] font-semibold leading-tight text-ink">{card.name}</h4>
            <p className="mt-0.5 text-[11px] text-ink-faint">As of: {card.asOf}</p>
          </div>
          <button
            aria-label="Toggle favorite"
            onClick={(e) => { e.stopPropagation(); setFav((f) => !f); }}
            className="shrink-0 rounded p-0.5 transition-transform hover:scale-110"
          >
            <Star width={16} height={16} filled={fav} className={fav ? "" : "text-ink-faint"} />
          </button>
        </div>

        <div className="mt-3.5 space-y-2.5">
          <Metric label="# KIMs" value={String(card.kims).padStart(2, "0")} />
          <div>
            <p className="text-[10.5px] uppercase tracking-wide text-ink-faint"># Material Movements</p>
            <span className="mt-1 inline-block rounded-[2px] bg-coral-soft px-2 py-0.5 text-[13px] font-semibold text-ink">
              {String(card.moves).padStart(2, "0")}
            </span>
          </div>
          <div>
            <p className="text-[10.5px] uppercase tracking-wide text-ink-faint">Most Moved KIM</p>
            <p className="mt-0.5 text-[13px] font-semibold text-ink">{card.mostMoved}</p>
          </div>
        </div>
      </div>

      {/* trend affordance */}
      <button
        aria-label="Open metric trend"
        onClick={(e) => { e.stopPropagation(); onOpenTrend(card); }}
        className="absolute bottom-3 right-3 flex h-7 w-7 items-center justify-center rounded-full border border-line bg-surface text-navy opacity-0 shadow-sm transition-all duration-200 hover:bg-navy hover:text-white group-hover:opacity-100"
      >
        <Trend width={15} height={15} />
      </button>

      {/* hover popover with driver breakdown */}
      {hover && (
        <div
          className="pointer-events-none absolute left-1/2 top-[58%] z-20 w-40 -translate-x-1/2 rounded-[4px] border border-line bg-surface p-3 shadow-[0_16px_40px_-12px_rgba(16,49,94,0.5)]"
          style={{ animation: "fade-up 140ms ease-out" }}
        >
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-ink-faint">Driver breakdown</p>
          <DriverRow label="Volume Drivers" value={card.drivers.volume} />
          <DriverRow label="Price Drivers" value={card.drivers.price} />
          <DriverRow label="Cost Drivers" value={card.drivers.cost} />
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10.5px] uppercase tracking-wide text-ink-faint">{label}</p>
      <p className="mt-0.5 text-[15px] font-semibold text-ink">{value}</p>
    </div>
  );
}

function DriverRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-line/70 py-1.5 last:border-0">
      <span className="text-[11.5px] text-ink-soft">{label}</span>
      <span className="font-mono text-[12px] font-semibold text-navy">{value}</span>
    </div>
  );
}

