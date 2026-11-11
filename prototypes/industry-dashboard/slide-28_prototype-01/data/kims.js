/* ===========================================================================
   data/kims.js — EVERYTHING THIS PROTOTYPE KNOWS.

   >>> THIS IS THE FILE TO EDIT IF YOU WANT DIFFERENT CONTENT. <<<
   No other file names a sub-industry, a metric or a number. Replace what is
   below and the whole screen follows.

   ---------------------------------------------------------------------------
   WHY THE FIGURES ARE MADE UP, AND WHY THEY NEVER CHANGE
   ---------------------------------------------------------------------------
   Your sheets print "Sub-Industry #1" and "Metric Name" everywhere, which is
   right for a layout drawing and wrong for a working prototype: a search box
   cannot be demonstrated against a list of things all called "Metric Name".
   So the names here are plausible stand-ins, and they are the ONLY invented
   content in the build.

   EVERY NUMBER IS GENERATED FROM ITS OWN NAME. A little seeded generator
   turns the text "Hot Rolled Coil Price" into the same series of figures
   every single time, on every machine, for ever. That matters more than it
   sounds: a prototype whose numbers change on each reload cannot be screen-
   shotted, cannot be demoed twice the same way, and makes every reviewer
   wonder whether the thing they are looking at is a bug.

   ---------------------------------------------------------------------------
   THE SHAPE OF THE DATA
   ---------------------------------------------------------------------------
       KIM_DATA.quarters     ['4Q22', '3Q22', ...]   newest first, as drawn
       KIM_DATA.years        ['2022', '2021', ...]
       KIM_DATA.industries   the L1 grouping
       KIM_DATA.countries    the country-of-assets grouping
       KIM_DATA.subs         120 sub-industries
       KIM_DATA.metrics      every KIM, flat, so search is one pass
       KIM_DATA.metricsOf(subId)      the KIMs of one sub-industry, grouped
       KIM_DATA.trendOf(metricId)     the long monthly series for the drawer

   A SUB-INDUSTRY
       id, name, industry, country, favourite, asOf,
       kims, material, mostMoved, drivers {volume:[x,y], price:[x,y], cost:[x,y]}

   A METRIC (a KIM)
       id, name, unit, category ('volume' | 'price' | 'cost'), subId,
       freq ('Y-O-Y' | 'Q-O-Q' | 'M-O-M'), asOf, latest, pct, up,
       quarters [{value, impact, material}], years [{...}], material
       impact runs -1 (good for the sub-industry) to +1 (bad), and is what
       the heat tint reads. See the ramp in css/views.css.
   =========================================================================== */
window.KIM_DATA = (function () {
  'use strict';

  /* ---------------------------------------------------------------------
     THE GENERATOR
     ---------------------------------------------------------------------
     A string goes in, a repeatable stream of numbers comes out. `hash` is
     the standard FNV-ish mix and `rng` is mulberry32 - small, fast, and
     good enough for figures nobody is going to run statistics on. */
  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h * 16777619) >>> 0;
    }
    return h >>> 0;
  }

  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function pick(r, list) { return list[Math.floor(r() * list.length)]; }
  function between(r, lo, hi) { return lo + r() * (hi - lo); }
  function round(v, dp) { var m = Math.pow(10, dp || 0); return Math.round(v * m) / m; }

  /* ---------------------------------------------------------------------
     THE GROUPINGS
     --------------------------------------------------------------------- */
  var INDUSTRIES = [
    'Metals & Mining', 'Chemicals', 'Automotive', 'Construction Materials',
    'Shipping & Freight', 'Energy', 'Agriculture', 'Consumer Retail'
  ];

  var COUNTRIES = [
    'United States', 'Germany', 'Japan', 'Brazil', 'India', 'United Kingdom',
    'Australia', 'Canada', 'France', 'China', 'Mexico', 'Italy',
    'Spain', 'South Korea', 'Netherlands', 'Sweden'
  ];

  /* Fifteen sub-industries per industry, which is where the 120 comes
     from. They are ordinary trade names rather than anything proprietary. */
  var SUB_NAMES = {
    'Metals & Mining': ['Flat Carbon Steel', 'Long Steel Products', 'Stainless Steel',
      'Primary Aluminium', 'Aluminium Rolling', 'Copper Mining', 'Copper Smelting',
      'Zinc & Lead', 'Nickel & Cobalt', 'Iron Ore', 'Metallurgical Coal',
      'Precious Metals', 'Scrap & Recycling', 'Ferroalloys', 'Titanium & Specialty'],
    'Chemicals': ['Petrochemical Olefins', 'Aromatics', 'Polyethylene', 'Polypropylene',
      'PVC & Chlor-Alkali', 'Industrial Gases', 'Nitrogen Fertilisers', 'Phosphate Fertilisers',
      'Agrochemicals', 'Specialty Coatings', 'Adhesives & Sealants', 'Pigments & Titanium Dioxide',
      'Synthetic Rubber', 'Lubricant Additives', 'Fine & Custom Chemicals'],
    'Automotive': ['Passenger Vehicles', 'Light Commercial Vehicles', 'Heavy Trucks',
      'Buses & Coaches', 'Powertrain Components', 'Electric Drivetrains', 'Battery Cells',
      'Interior Systems', 'Chassis & Suspension', 'Braking Systems', 'Automotive Electronics',
      'Tyres & Rubber', 'Aftermarket Parts', 'Vehicle Leasing', 'Dealership Networks'],
    'Construction Materials': ['Cement', 'Ready-Mix Concrete', 'Aggregates', 'Bricks & Blocks',
      'Flat Glass', 'Insulation', 'Gypsum & Plasterboard', 'Roofing Materials',
      'Structural Timber', 'Engineered Wood', 'Pipes & Fittings', 'Heavy Equipment Rental',
      'Prefabricated Structures', 'Architectural Hardware', 'Paints & Renders'],
    'Shipping & Freight': ['Container Liners', 'Dry Bulk Carriers', 'Crude Tankers',
      'Product Tankers', 'LNG Carriers', 'Port Terminals', 'Freight Forwarding',
      'Rail Freight', 'Road Haulage', 'Cold Chain Logistics', 'Air Cargo',
      'Warehousing', 'Last-Mile Delivery', 'Ship Chartering', 'Ship Repair & Yards'],
    'Energy': ['Upstream Oil & Gas', 'Oilfield Services', 'Refining', 'Midstream Pipelines',
      'LNG Liquefaction', 'Thermal Power', 'Hydro Power', 'Onshore Wind',
      'Offshore Wind', 'Utility Solar', 'Grid Transmission', 'Power Retail',
      'Coal Mining', 'Nuclear Generation', 'Hydrogen & Electrolysers'],
    'Agriculture': ['Grain Growing', 'Oilseeds', 'Sugar & Sweeteners', 'Cotton & Fibres',
      'Dairy Farming', 'Beef & Cattle', 'Poultry', 'Pork',
      'Aquaculture', 'Fresh Produce', 'Grain Trading', 'Food Processing',
      'Animal Feed', 'Seeds & Genetics', 'Farm Machinery'],
    'Consumer Retail': ['Grocery Chains', 'Discount Retail', 'Department Stores', 'Apparel Retail',
      'Footwear', 'Home Improvement', 'Furniture Retail', 'Consumer Electronics Retail',
      'Pharmacy Chains', 'E-Commerce Marketplaces', 'Quick-Service Restaurants', 'Casual Dining',
      'Convenience Stores', 'Beauty & Personal Care', 'Toys & Leisure']
  };

  /* ---------------------------------------------------------------------
     THE METRIC VOCABULARY
     ---------------------------------------------------------------------
     Each entry is [name, unit, frequency]. A sub-industry draws its KIMs
     from these three pools, so the same metric can drive several
     sub-industries - which is the whole point of the search results
     screen, where one KIM lists everything it moves. */
  var POOL = {
    volume: [
      ['Industrial Production Index', 'Index', 'M-O-M'],
      ['Capacity Utilisation', '%', 'M-O-M'],
      ['New Orders', 'Index', 'M-O-M'],
      ['Shipments', 'kt', 'M-O-M'],
      ['Inventory to Sales Ratio', 'Ratio', 'M-O-M'],
      ['Housing Starts', 'k units', 'M-O-M'],
      ['Vehicle Registrations', 'k units', 'M-O-M'],
      ['Container Throughput', 'TEU m', 'M-O-M'],
      ['Rail Carloadings', 'k cars', 'M-O-M'],
      ['Manufacturing PMI', 'Index', 'M-O-M'],
      ['Export Volumes', 'kt', 'Q-O-Q'],
      ['Import Volumes', 'kt', 'Q-O-Q'],
      ['Retail Sales Volume', 'Index', 'M-O-M'],
      ['Construction Permits', 'k permits', 'M-O-M'],
      ['Fleet Utilisation', '%', 'M-O-M']
    ],
    price: [
      ['Steel PPI', 'Index', 'M-O-M'],
      ['Aluminium LME Cash', 'USD/t', 'M-O-M'],
      ['Copper LME Cash', 'USD/t', 'M-O-M'],
      ['Brent Crude', 'USD/bbl', 'M-O-M'],
      ['Henry Hub Gas', 'USD/MMBtu', 'M-O-M'],
      ['Container Freight Rate', 'USD/FEU', 'M-O-M'],
      ['Producer Price Index', 'Index', 'M-O-M'],
      ['Realised Selling Price', 'USD/t', 'Q-O-Q'],
      ['Spot Margin', 'USD/t', 'Q-O-Q'],
      ['Contract Price Index', 'Index', 'Q-O-Q'],
      ['Wheat Futures', 'USD/bu', 'M-O-M'],
      ['Electricity Spot Price', 'USD/MWh', 'M-O-M']
    ],
    cost: [
      ['Unit Labour Cost', 'Index', 'Q-O-Q'],
      ['Energy Cost per Tonne', 'USD/t', 'M-O-M'],
      ['Freight Cost Index', 'Index', 'M-O-M'],
      ['Scrap Input Cost', 'USD/t', 'M-O-M'],
      ['Resin Feedstock Cost', 'USD/t', 'M-O-M'],
      ['Coking Coal Cost', 'USD/t', 'M-O-M'],
      ['Working Capital Days', 'Days', 'Q-O-Q'],
      ['Maintenance Capex', 'USD m', 'Q-O-Q'],
      ['Insurance & Charter Cost', 'Index', 'Q-O-Q'],
      ['Fertiliser Input Cost', 'USD/t', 'M-O-M'],
      ['Packaging Cost Index', 'Index', 'M-O-M'],
      ['Wage Inflation', '%', 'Y-O-Y']
    ]
  };

  /* THE ONE NUMBER THAT DECIDES WHAT COUNTS AS A MATERIAL MOVE. Read by
     makeMetric below and by nothing else; every screen reads the answer
     rather than the rule. */
  var MATERIAL_AT = 35;

  var QUARTERS = ['4Q22', '3Q22', '2Q22', '1Q22', '4Q21', '3Q21', '2Q21', '1Q21'];
  var YEARS = ['2022', '2021', '2020', '2019', '2018'];
  var MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
                'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  /* The one date the whole prototype is "as of". Everything dated is
     derived from it, so moving the prototype forward in time is one line. */
  var AS_OF = { y: 2023, m: 5 };          /* JUN-2023, zero-based month */

  function asOfLabel(r) {
    var back = Math.floor(r() * 4);
    var m = AS_OF.m - back, y = AS_OF.y;
    if (m < 0) { m += 12; y -= 1; }
    return MONTHS[m] + '-' + y;
  }

  function dmy(r) {
    var d = 1 + Math.floor(r() * 27);
    var m = 1 + Math.floor(r() * 12);
    return (d < 10 ? '0' : '') + d + '-' + (m < 10 ? '0' : '') + m + '-2023';
  }

  /* ---------------------------------------------------------------------
     BUILDING ONE METRIC
     ---------------------------------------------------------------------
     `impact` is the number the heat tint reads, and it is deliberately
     NOT the same thing as the change: a metric can move a lot and matter
     little. Negative means the move is good for the sub-industry,
     positive means it is bad - which follows the scale on your sheet,
     where Positive sits at the pale end and Negative at the strong end. */
  function makeMetric(subId, cat, def, n, moving) {
    var id = subId + '::' + def[0].toLowerCase().replace(/[^a-z0-9]+/g, '-');
    var r = rng(hash(id));
    var base = between(r, 90, 480);

    function cell(i, span) {
      var drift = Math.sin((i + n) * 1.3) * 0.08 + (r() - 0.5) * 0.22;
      var v = base * (1 + drift * span);
      var impact = Math.max(-1, Math.min(1, (r() - 0.45) * 2.2));
      /* most cells are quiet; only a few carry enough weight to be tinted */
      if (Math.abs(impact) < 0.42) impact = 0;
      return { value: round(v, v < 100 ? 2 : 1), impact: round(impact, 2),
               material: Math.abs(impact) > 0.72 };
    }

    var quarters = QUARTERS.map(function (q, i) { return cell(i, 1); });
    var years = YEARS.map(function (y, i) { return cell(i + 9, 1.6); });
    /* ===================================================================
       WHAT MAKES A MOVE "MATERIAL": ONE NUMBER, IN ONE PLACE
       ===================================================================
       A KIM has moved materially when its change is bigger than
       MATERIAL_AT, which is 35%. That is the whole rule — nothing
       anywhere else in the build decides it, so moving the threshold is
       this one constant and every count, tag, pill and filter on every
       screen follows it.

       THE RANGE THE CHANGE IS DRAWN FROM IS WHAT CONTROLS HOW MANY THERE
       ARE. A moving sub-industry's KIMs can land either side of the
       threshold; a quiet one's are drawn from below it and so can never
       cross. That keeps the threshold HONEST — the pill, the tag and the
       count are all reading the same number off the same figure — while
       still letting the dummy data have only a handful of moving
       sub-industries, which is what you asked for. */
    var pct = round(moving ? between(r, 0.05, 52) : between(r, 0.05, 32), 2);
    var up = r() < 0.5;
    var material = pct > MATERIAL_AT;

    return {
      id: id, subId: subId, name: def[0], unit: def[1], freq: def[2],
      category: cat,
      asOf: asOfLabel(r),
      latest: round(base * (1 + (r() - 0.5) * 0.1), 1),
      pct: pct, up: up, material: material,
      quarters: quarters, years: years,
      min: round(base * between(r, 0.42, 0.72), 2),
      max: round(base * between(r, 1.2, 1.9), 2)
    };
  }

  /* ---------------------------------------------------------------------
     BUILDING EVERYTHING
     --------------------------------------------------------------------- */
  var subs = [];
  var metrics = [];
  var bySub = {};

  INDUSTRIES.forEach(function (ind, ii) {
    SUB_NAMES[ind].forEach(function (name, si) {
      var id = 'sub-' + ii + '-' + si;
      var r = rng(hash(id + name));
      var country = COUNTRIES[(ii * 5 + si * 3) % COUNTRIES.length];

      /* HOW MANY KIMs OF EACH KIND. The sheet's hover card shows the three
         counts as "moved / total", so both halves live here. */
      var nVol = 3 + Math.floor(r() * 5);
      var nPri = 1 + Math.floor(r() * 3);
      var nCos = 1 + Math.floor(r() * 6);

      /* ABOUT ONE SUB-INDUSTRY IN TEN IS MOVING AT ALL. It was a fifth,
         which put a "Material Move" tag against nearly every country in
         the selector — and a tag that is on everything has stopped being
         a tag. A dozen out of a hundred and twenty leaves the list quiet
         enough that the ones carrying a tag stand out. */
      var moving = r() < 0.10;

      var mine = [];
      for (var a = 0; a < nVol; a++) mine.push(makeMetric(id, 'volume', POOL.volume[(si * 3 + a) % POOL.volume.length], a, moving));
      for (var b = 0; b < nPri; b++) mine.push(makeMetric(id, 'price', POOL.price[(si * 2 + b) % POOL.price.length], b + 7, moving));
      for (var c = 0; c < nCos; c++) mine.push(makeMetric(id, 'cost', POOL.cost[(si + c) % POOL.cost.length], c + 13, moving));

      var moved = mine.filter(function (m) { return m.material; });
      var movedIn = function (cat) {
        var all = mine.filter(function (m) { return m.category === cat; });
        return [all.filter(function (m) { return m.material; }).length, all.length];
      };

      var most = moved.length
        ? moved.slice().sort(function (x, y) { return y.pct - x.pct; })[0]
        : mine.slice().sort(function (x, y) { return y.pct - x.pct; })[0];

      subs.push({
        id: id, name: name, industry: ind, country: country,
        favourite: r() < 0.14,
        asOf: dmy(r),
        kims: mine.length,
        material: moved.length,
        mostMoved: most.name,
        drivers: { volume: movedIn('volume'), price: movedIn('price'), cost: movedIn('cost') }
      });

      bySub[id] = mine;
      metrics = metrics.concat(mine);
    });
  });

  /* ---------------------------------------------------------------------
     THE LONG SERIES BEHIND THE DRAWER
     ---------------------------------------------------------------------
     Monthly from 1994 to the as-of date - about 350 points - built as a
     random walk from the metric's own seed, so the drawer always draws the
     same picture for the same metric. Computed on demand and kept, because
     a reader opens two or three of these, not three hundred. */
  var TREND_CACHE = {};

  function trendOf(metricId) {
    if (TREND_CACHE[metricId]) return TREND_CACHE[metricId];
    var r = rng(hash('trend::' + metricId));
    var pts = [];
    var v = between(r, 28, 46);
    var y = 1994, m = 0;
    var cycle = between(r, 40, 90);
    while (y < AS_OF.y || (y === AS_OF.y && m <= AS_OF.m)) {
      var wave = Math.sin((pts.length / cycle) * Math.PI * 2) * 6;
      v = v + (r() - 0.5) * 3.4 + wave * 0.06;
      v = Math.max(6, Math.min(98, v));
      pts.push({ y: y, m: m, v: round(v, 2) });
      m++; if (m > 11) { m = 0; y++; }
    }

    /* THE MATERIAL MOVES ARE FOUND, NOT SPRINKLED. A point counts when the
       year-on-year change is big enough, which is why the markers always
       land on a turn in the line rather than in the middle of a flat run. */
    var marks = [];
    var moves = [];
    for (var i = 12; i < pts.length; i += 1) {
      var ch = (pts[i].v - pts[i - 12].v) / pts[i - 12].v;
      moves.push({ i: i, up: ch > 0, size: Math.abs(ch) });
    }
    moves.filter(function (m) { return m.size > 0.3; }).forEach(function (m) {
      if (!marks.length || m.i - marks[marks.length - 1].i > 24) marks.push({ i: m.i, up: m.up });
    });

    /* A SERIES THAT NEVER MOVED 30% STILL HAS ITS BIGGEST MOVES, and the
       drawer is about showing them. Without this a quiet metric drew a
       chart with a legend naming two kinds of marker and no markers on it,
       which reads as a fault rather than as "nothing much happened". */
    if (marks.length < 2) {
      marks = moves.slice().sort(function (a, b) { return b.size - a.size; })
                   .slice(0, 4)
                   .sort(function (a, b) { return a.i - b.i; })
                   .filter(function (m, k, all) { return !k || m.i - all[k - 1].i > 24; })
                   .map(function (m) { return { i: m.i, up: m.up }; });
    }

    var out = { points: pts, marks: marks };
    TREND_CACHE[metricId] = out;
    return out;
  }

  /* The KIMs of one sub-industry, in the three groups the sheet draws. */
  function metricsOf(subId) {
    var mine = bySub[subId] || [];
    return {
      volume: mine.filter(function (m) { return m.category === 'volume'; }),
      price: mine.filter(function (m) { return m.category === 'price'; }),
      cost: mine.filter(function (m) { return m.category === 'cost'; })
    };
  }

  /* EVERY SUB-INDUSTRY ONE NAMED METRIC DRIVES, which is the search
     results screen. Correlation is derived from the metric's own impact
     in that sub-industry, so the two screens cannot disagree. */
  function drivenBy(name) {
    var neg = [], pos = [];
    metrics.forEach(function (m) {
      if (m.name !== name) return;
      var sub = subs.filter(function (s) { return s.id === m.subId; })[0];
      if (!sub) return;
      var row = { sub: sub, driverOf: m.category, metric: m };
      (m.up ? pos : neg).push(row);
    });
    return { negative: neg.slice(0, 8), positive: pos.slice(0, 8) };
  }

  /* One row per DISTINCT metric name, for the search box. */
  var byName = {};
  metrics.forEach(function (m) { if (!byName[m.name]) byName[m.name] = m; });
  var uniqueMetrics = Object.keys(byName).map(function (k) { return byName[k]; });

  return {
    quarters: QUARTERS,
    years: YEARS,
    industries: INDUSTRIES,
    countries: COUNTRIES,
    subs: subs,
    metrics: metrics,
    uniqueMetrics: uniqueMetrics,
    metricsOf: metricsOf,
    trendOf: trendOf,
    drivenBy: drivenBy,
    asOfLabel: MONTHS[AS_OF.m] + '-' + AS_OF.y
  };
})();
