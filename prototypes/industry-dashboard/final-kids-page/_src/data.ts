export type SubIndustryCard = {
  id: string;
  name: string;
  asOf: string;
  kims: number;
  moves: number;
  mostMoved: string;
  favorite: boolean;
  drivers: { volume: string; price: string; cost: string };
};

export const favorites: SubIndustryCard[] = [
  { id: "f1", name: "Aluminum & Bauxite", asOf: "30-06-2023", kims: 7, moves: 4, mostMoved: "Alumina Spot Price", favorite: true, drivers: { volume: "3/5", price: "0/1", cost: "1/6" } },
  { id: "f2", name: "Integrated Steel", asOf: "30-06-2023", kims: 5, moves: 2, mostMoved: "Hot-Rolled Coil PPI", favorite: true, drivers: { volume: "2/3", price: "0/1", cost: "0/1" } },
  { id: "f3", name: "Copper Mining", asOf: "30-06-2023", kims: 3, moves: 1, mostMoved: "LME Copper Cash", favorite: true, drivers: { volume: "1/1", price: "0/1", cost: "0/1" } },
  { id: "f4", name: "Diversified Chemicals", asOf: "30-06-2023", kims: 8, moves: 3, mostMoved: "Ethylene Margin", favorite: true, drivers: { volume: "2/4", price: "1/2", cost: "0/2" } },
  { id: "f5", name: "Container Shipping", asOf: "30-06-2023", kims: 6, moves: 2, mostMoved: "Shanghai Freight Idx", favorite: true, drivers: { volume: "1/3", price: "1/2", cost: "0/1" } },
  { id: "f6", name: "Semiconductors", asOf: "30-06-2023", kims: 15, moves: 4, mostMoved: "DRAM Contract Price", favorite: true, drivers: { volume: "2/7", price: "2/4", cost: "0/4" } },
  { id: "f7", name: "Auto OEMs", asOf: "30-06-2023", kims: 12, moves: 5, mostMoved: "New Vehicle Inventory", favorite: true, drivers: { volume: "3/6", price: "1/3", cost: "1/3" } },
];

export const others: SubIndustryCard[] = [
  { id: "o1", name: "Gold Mining", asOf: "30-06-2023", kims: 7, moves: 4, mostMoved: "AISC per Ounce", favorite: false, drivers: { volume: "2/3", price: "1/2", cost: "1/2" } },
  { id: "o2", name: "Oilfield Services", asOf: "30-06-2023", kims: 5, moves: 2, mostMoved: "US Rig Count", favorite: false, drivers: { volume: "1/2", price: "1/2", cost: "0/1" } },
  { id: "o3", name: "Refining & Marketing", asOf: "30-06-2023", kims: 3, moves: 1, mostMoved: "3-2-1 Crack Spread", favorite: false, drivers: { volume: "0/1", price: "1/1", cost: "0/1" } },
  { id: "o4", name: "Fertilizers", asOf: "30-06-2023", kims: 8, moves: 3, mostMoved: "Urea FOB Baltic", favorite: false, drivers: { volume: "1/3", price: "2/3", cost: "0/2" } },
  { id: "o5", name: "Pulp & Paper", asOf: "30-06-2023", kims: 6, moves: 2, mostMoved: "NBSK Pulp Price", favorite: false, drivers: { volume: "1/2", price: "1/2", cost: "0/2" } },
];

export type MetricRow = {
  name: string;
  unit: string;
  value: string;
  asOfDate: string;
  change: number;
  freq: string;
  quarterly: number[];
  annual: number;
  material: boolean;
};

/* Every year the annual column can reach back to. The table shows only the
   most recent one until the reader opens the group; opening it walks all the
   way back to 1994. */
export const ANNUAL_YEARS: number[] = (() => {
  const out: number[] = [];
  for (let y = 2022; y >= 1994; y--) out.push(y);
  return out;
})();

/* Dummy annual history, generated from the metric's own name so the same
   metric always gets the same series. Real data would come from the service;
   the point here is that the numbers are stable between renders and look
   like a series rather than noise. */
export function annualSeries(rowName: string, latest: number): number[] {
  let s = 0;
  for (let i = 0; i < rowName.length; i++) s = (s * 31 + rowName.charCodeAt(i)) % 233280;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const out: number[] = [];
  let v = latest;
  for (let i = 0; i < ANNUAL_YEARS.length; i++) {
    out.push(Math.round(v * 10) / 10);
    /* walking backwards in time, so each earlier year drifts off the one
       after it rather than off the start */
    v = Math.max(20, v * (0.9 + rnd() * 0.22));
  }
  return out;
}

export const detailCategories: { category: string; rows: MetricRow[] }[] = [
  {
    category: "Volume Drivers",
    rows: [
      { name: "Primary Shipments", unit: "kt", value: "451.7", asOfDate: "JUN-2023", change: 40.0, freq: "Y-O-Y", quarterly: [451.7, 215, 167, 462.8, 457, 167, 202, 162], annual: 1290, material: true },
      { name: "Capacity Utilisation", unit: "%", value: "211.5", asOfDate: "JUN-2023", change: 15.97, freq: "Q-O-Q", quarterly: [211.5, 457, 468, 215, 215, 457, 457, 468], annual: 1101, material: true },
      { name: "Inventory Days", unit: "days", value: "167", asOfDate: "JUN-2023", change: 6.0, freq: "M-O-M", quarterly: [167, 468, 457, 167, 468, 461.8, 468, 215], annual: 905, material: true },
      { name: "Order Backlog", unit: "kt", value: "468", asOfDate: "JUN-2023", change: 0.08, freq: "M-O-M", quarterly: [468, 131.5, 215.3, 457, 135, 215.1, 135, 457], annual: 760, material: false },
      { name: "Export Volume", unit: "kt", value: "135", asOfDate: "JUN-2023", change: 0.05, freq: "M-O-M", quarterly: [135, 167, 134.5, 135, 167, 135, 162.7, 135.5], annual: 540, material: false },
    ],
  },
  {
    category: "Price Drivers",
    rows: [
      { name: "Spot Benchmark", unit: "USD/t", value: "135", asOfDate: "JUN-2023", change: 21.22, freq: "M-O-M", quarterly: [135, 468, 215, 167, 157, 171, 143, 124], annual: 640, material: true },
    ],
  },
  {
    category: "Cost Drivers",
    rows: [
      { name: "Energy Input Index", unit: "idx", value: "175", asOfDate: "JUN-2023", change: 1.0, freq: "Q-O-Q", quarterly: [175, 165, 124, 135, 141, 152, 145, 178], annual: 812, material: true },
    ],
  },
];

export const quarters = ["4Q22", "3Q22", "2Q22", "1Q22", "4Q21", "3Q21", "2Q21", "1Q21"];

export const negativeCorrelated = [
  { name: "Long-Haul Trucking", industry: "Transportation", driver: "Cost" },
  { name: "Residential HVAC", industry: "Building Products", driver: "Volume" },
  { name: "Beverage Cans", industry: "Packaging", driver: "Volume" },
  { name: "Wind Turbines", industry: "Capital Goods", driver: "Cost" },
  { name: "Distribution Grids", industry: "Utilities", driver: "Cost" },
  { name: "Rail Freight", industry: "Transportation", driver: "Cost" },
  { name: "Data Centers", industry: "Technology", driver: "Volume" },
  { name: "Ammonia Producers", industry: "Chemicals", driver: "Cost" },
];

export const positiveCorrelated = [
  { name: "Auto Components", industry: "Automotive", driver: "Cost" },
  { name: "Appliance OEMs", industry: "Consumer Durables", driver: "Volume" },
  { name: "Construction Equip.", industry: "Capital Goods", driver: "Volume" },
];

// Deterministic pseudo-random trend generator for the drawer chart
export function makeTrend(seed: number, points: number) {
  const out: { year: number; value: number; pct: number }[] = [];
  let v = 32;
  let s = seed;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const startYear = 2024 - Math.round(points / 12);
  for (let i = 0; i < points; i++) {
    v += (rnd() - 0.48) * 6;
    v = Math.max(8, Math.min(95, v));
    out.push({
      year: startYear + i / 12,
      value: Math.round(v * 10) / 10,
      pct: Math.round((rnd() - 0.5) * 18 * 10) / 10,
    });
  }
  return out;
}

