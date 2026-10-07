import type { SVGProps } from "react";

const base = (p: SVGProps<SVGSVGElement>) => ({
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  ...p,
});

export const ChevronDown = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="m6 9 6 6 6-6" /></svg>
);
export const ChevronRight = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="m9 6 6 6-6 6" /></svg>
);
export const ChevronLeft = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="m15 6-6 6 6 6" /></svg>
);
export const ChevronsLeft = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="m11 17-5-5 5-5M18 17l-5-5 5-5" /></svg>
);
export const ChevronsRight = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="m13 17 5-5-5-5M6 17l5-5-5-5" /></svg>
);
export const Search = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
);
export const Close = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M18 6 6 18M6 6l12 12" /></svg>
);
export const Sort = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M3 6h13M3 12h9M3 18h5M17 8l3-3 3 3M20 5v14" /></svg>
);
export const ArrowUp = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M12 19V5M5 12l7-7 7 7" /></svg>
);
export const ArrowDown = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M12 5v14M19 12l-7 7-7-7" /></svg>
);
export const Info = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M12 11v5M12 8h.01" /></svg>
);
export const Grid = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
);
export const List = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
);
export const Download = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M12 3v12M7 10l5 5 5-5M4 21h16" /></svg>
);
export const Trend = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M3 17l4-6 3 3 5-8 6 5" /></svg>
);
export const Star = ({ filled, ...p }: SVGProps<SVGSVGElement> & { filled?: boolean }) => (
  <svg {...base(p)} fill={filled ? "#e8a33d" : "none"} stroke={filled ? "#e8a33d" : "currentColor"}>
    <path d="m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.2l1-5.8L3.5 9.2l5.9-.9z" />
  </svg>
);

