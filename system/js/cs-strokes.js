/* cs-strokes.js — the stroke layer.

   THE IDEA: a CSS border is a perfect, even line. A real pen is not. So for
   every element that wants a hand-drawn edge we hide its CSS border and draw
   the same shape again as an SVG outline: the path wanders slightly off the
   true edge, its thickness swells and thins the way pressure does, it
   overshoots the corner it started from, and it is drawn twice — because a
   person going round a box twice never lands on the same line.

   SMOOTHNESS: the wander has to read as a slow drift, not a jitter. Two
   things do that. The path is emitted as curves, not straight hops between
   sample points — every point gets a Bezier handle worked out from its
   neighbours, so the line bends through them instead of turning corners at
   them. And the thickness changes across many short overlapping pieces
   rather than a few long ones, so a swell arrives gradually. */
window.CS = window.CS || {};

/* The house pen. These belong to the engine, not to any one case study —
   every study is drawn with the same hand. A study could override them before
   this file loads, but there is rarely a reason to.
     roughness — how far off the true edge the pen drifts, in pixels
     detail    — how many points a line is sampled at (more = smoother)
     pressure  — how much the thickness swells and thins
     overshoot — how far past the start the pen carries on, as a fraction
     passes    — 2 means the shape is gone round twice, the second faintly */
CS.STROKE = CS.STROKE || {
  roughness: 2.5,
  detail: 30,
  pressure: 0.32,
  overshoot: 0.006,
  passes: 2,
  baseWidth: 1.7,
  texture: false
};

(function (CS) {
  'use strict';
  var S = CS.STROKE;
  var SVG_NS = 'http://www.w3.org/2000/svg';

  /* How far outside the element's own edge the pen sits. Drawing on the edge
     means half the line falls inside the box, where anything that clips its
     contents cuts it off. Sitting outside keeps the whole line visible and
     reads the way a pen going round an object does.

     The number itself lives in CSS as --cs-stroke-out, so a layout that has
     to leave room for a drawn line can do its arithmetic against the same
     value rather than guessing. */
  var OUT = 3;
  var queue = new Set();
  var frame = null;

  function rng(seed) {
    var s = (seed >>> 0) || 7;
    return function () {
      s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
  }

  /* smooth wander: a few sine waves of different lengths added together, the
     way a hand drifts rather than jitters */
  function wobbler(seed) {
    var r = rng(seed);
    var a = [], f = [], ph = [];
    for (var i = 0; i < 4; i++) {
      a.push(1 / (i + 1));
      f.push((i + 1) * (1.1 + r() * 1.4));
      ph.push(r() * Math.PI * 2);
    }
    return function (t) {
      var v = 0, sum = 0;
      for (var i = 0; i < 4; i++) {
        v += a[i] * Math.sin(t * Math.PI * 2 * f[i] + ph[i]);
        sum += a[i];
      }
      return v / sum;
    };
  }

  /* The true outline of a rounded rectangle, sampled evenly, with the outward
     direction at every point. Each corner keeps its own radius, so a tab with
     rounded shoulders and square feet is drawn as exactly that rather than as
     a pill. Radii arrive as [top-left, top-right, bottom-right, bottom-left]. */
  function outline(w, h, radii, count) {
    var lim = Math.min(w, h) / 2;
    var tl = Math.max(0, Math.min(radii[0], lim));
    var tr = Math.max(0, Math.min(radii[1], lim));
    var br = Math.max(0, Math.min(radii[2], lim));
    var bl = Math.max(0, Math.min(radii[3], lim));
    var q = Math.PI / 2;
    var seg = [];
    seg.push({ t: 'l', len: w - tl - tr, x1: tl, y1: 0, x2: w - tr, y2: 0, nx: 0, ny: -1 });
    seg.push({ t: 'a', len: tr * q, r: tr, cx: w - tr, cy: tr, a0: -q });
    seg.push({ t: 'l', len: h - tr - br, x1: w, y1: tr, x2: w, y2: h - br, nx: 1, ny: 0 });
    seg.push({ t: 'a', len: br * q, r: br, cx: w - br, cy: h - br, a0: 0 });
    seg.push({ t: 'l', len: w - br - bl, x1: w - br, y1: h, x2: bl, y2: h, nx: 0, ny: 1 });
    seg.push({ t: 'a', len: bl * q, r: bl, cx: bl, cy: h - bl, a0: q });
    seg.push({ t: 'l', len: h - bl - tl, x1: 0, y1: h - bl, x2: 0, y2: tl, nx: -1, ny: 0 });
    seg.push({ t: 'a', len: tl * q, r: tl, cx: tl, cy: tl, a0: Math.PI });

    var total = seg.reduce(function (a, s) { return a + Math.max(0, s.len); }, 0);
    if (total <= 0) return { pts: [], total: 0 };

    function at(dist) {
      var d = ((dist % total) + total) % total;
      for (var i = 0; i < seg.length; i++) {
        var s = seg[i];
        var L = Math.max(0, s.len);
        if (d <= L || i === seg.length - 1) {
          var u = L ? d / L : 0;
          if (s.t === 'l') {
            return { x: s.x1 + (s.x2 - s.x1) * u, y: s.y1 + (s.y2 - s.y1) * u, nx: s.nx, ny: s.ny };
          }
          var a = s.a0 + u * Math.PI / 2;
          return { x: s.cx + s.r * Math.cos(a), y: s.cy + s.r * Math.sin(a), nx: Math.cos(a), ny: Math.sin(a) };
        }
        d -= L;
      }
      return { x: 0, y: 0, nx: 0, ny: 0 };
    }

    var pts = [];
    var over = total * S.overshoot;
    var n = Math.max(48, Math.round(count * (total / 420 + 1)));
    for (var i = 0; i <= n; i++) {
      var dist = -over + (total + over * 2) * (i / n);
      var p = at(dist);
      p.u = i / n;
      pts.push(p);
    }
    return { pts: pts, total: total };
  }

  /* Where a sample point ends up once the hand has wandered off the true
     edge: out along the outward direction by however much the wobble says. */
  function drift(p, wob, rough) {
    var off = wob(p.u) * rough;
    return { x: p.x + p.nx * off, y: p.y + p.ny * off };
  }

  /* Draw through the points as a curve. Each point's handles point along the
     line joining its two neighbours (a Catmull-Rom spline written out as
     cubic Beziers), which is what turns a chain of hops into a drawn line. */
  function pathFor(pts, from, to, wob, rough) {
    if (to <= from) return '';
    var q = [];
    for (var i = from; i <= to && i < pts.length; i++) q.push(drift(pts[i], wob, rough));
    if (q.length < 2) return '';

    var d = 'M' + q[0].x.toFixed(2) + ' ' + q[0].y.toFixed(2);
    for (var j = 0; j < q.length - 1; j++) {
      var p0 = q[j - 1] || q[j];
      var p1 = q[j];
      var p2 = q[j + 1];
      var p3 = q[j + 2] || p2;
      var c1x = p1.x + (p2.x - p0.x) / 6;
      var c1y = p1.y + (p2.y - p0.y) / 6;
      var c2x = p2.x - (p3.x - p1.x) / 6;
      var c2y = p2.y - (p3.y - p1.y) / 6;
      d += ' C' + c1x.toFixed(2) + ' ' + c1y.toFixed(2) +
           ' ' + c2x.toFixed(2) + ' ' + c2y.toFixed(2) +
           ' ' + p2.x.toFixed(2) + ' ' + p2.y.toFixed(2);
    }
    return d;
  }

  function render(el) {
    var bw = el.offsetWidth, bh = el.offsetHeight;  // layout size, never the
    if (!bw || !bh) return;                         // transformed size
    var cs = getComputedStyle(el);

    /* Two dials any component can turn, set in CSS next to its other styles:
         --cs-stroke-width   how thick the pen is here
         --cs-stroke-rough   how far it is allowed to wander here
       Small controls — tabs, toggles, dropdowns — want a finer, steadier line
       than a picture frame does. Left unset, the page defaults apply. */
    var baseWidth = parseFloat(cs.getPropertyValue('--cs-stroke-width'));
    if (isNaN(baseWidth)) baseWidth = S.baseWidth;
    var roughness = parseFloat(cs.getPropertyValue('--cs-stroke-rough'));
    if (isNaN(roughness)) roughness = S.roughness;

    var given = (el.dataset.csStroke || '').trim().split(/\s+/).map(parseFloat).filter(function (n) { return !isNaN(n); });
    var radii;
    if (given.length === 4) radii = given;
    else if (given.length === 1) radii = [given[0], given[0], given[0], given[0]];
    else radii = [
      parseFloat(cs.borderTopLeftRadius) || 0,
      parseFloat(cs.borderTopRightRadius) || 0,
      parseFloat(cs.borderBottomRightRadius) || 0,
      parseFloat(cs.borderBottomLeftRadius) || 0
    ];

    /* the drawn box is the element's box grown by the outset on every side */
    var pad = parseFloat(cs.getPropertyValue('--cs-stroke-out'));
    if (isNaN(pad)) pad = OUT;
    var w = bw + pad * 2, h = bh + pad * 2;

    var old = el.querySelector(':scope > .cs-stroke');
    if (old) old.remove();

    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'cs-stroke');
    svg.setAttribute('width', w);
    svg.setAttribute('height', h);
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.setAttribute('aria-hidden', 'true');
    svg.style.left = svg.style.top = (-pad) + 'px';
    svg.style.right = svg.style.bottom = 'auto';

    var seed = (bw * 31 + bh * 17 + (el.dataset.csSeed ? +el.dataset.csSeed : 0)) | 0;
    var o = outline(w, h, radii.map(function (v) { return v ? v + pad : 0; }), S.detail);
    if (!o.pts.length) return;

    var chunks = 26;
    for (var pass = 0; pass < S.passes; pass++) {
      var wob = wobbler(seed + pass * 977);
      var press = wobbler(seed + pass * 331 + 5);
      var rough = roughness * (pass === 0 ? 1 : 1.1);
      var base = baseWidth * (pass === 0 ? 1 : 0.6);
      var step = Math.ceil((o.pts.length - 1) / chunks);
      for (var c = 0; c < chunks; c++) {
        var from = c * step;
        /* one point of overlap, so consecutive pieces meet rather than
           leaving a nick where the thickness changes */
        var to = Math.min(o.pts.length - 1, from + step + 1);
        if (to <= from) continue;
        var path = document.createElementNS(SVG_NS, 'path');
        path.setAttribute('d', pathFor(o.pts, from, to, wob, rough));
        var t = (c + 0.5) / chunks;
        var width = base * (1 + S.pressure * press(t));
        path.setAttribute('stroke-width', Math.max(0.5, width).toFixed(2));
        if (pass === 1) path.setAttribute('opacity', '0.42');
        svg.appendChild(path);
      }
    }
    el.insertBefore(svg, el.firstChild);
  }

  function flush() {
    frame = null;
    queue.forEach(render);
    queue.clear();
  }

  function schedule(el) {
    queue.add(el);
    if (!frame) frame = requestAnimationFrame(flush);
  }

  var observer = ('ResizeObserver' in window) ? new ResizeObserver(function (entries) {
    entries.forEach(function (e) { schedule(e.target); });
  }) : null;

  /* The arrow between two steps of a flow. Drawn rather than typed: a shaft
     that wavers the way a pen does, and a head made of two separate strokes,
     because a hand lifts between them. One definition, used everywhere an
     arrow appears in a flow. */
  var ARROW = '<svg class="cs-arrow-drawn" viewBox="0 0 72 28" aria-hidden="true" focusable="false">' +
    '<path d="M3 14.4 C15 11.8, 27 16.4, 40 13.6 C46 12.3, 52 13.9, 57 14.2"></path>' +
    '<path d="M46.5 5.6 C50 8.4, 54 11.8, 58.6 14.1"></path>' +
    '<path d="M58.4 14.3 C54.2 16.6, 50.2 19.7, 46.9 22.8"></path>' +
    '</svg>';

  CS.drawArrows = function (root) {
    (root || document).querySelectorAll('.cs-flow-arrow').forEach(function (el) {
      if (el.querySelector('.cs-arrow-drawn')) return;
      el.textContent = '';
      el.innerHTML = ARROW;
    });
  };

  CS.strokes = {
    /* Give every element carrying data-cs-stroke a drawn outline, and keep it
       in step when the element changes size. */
    apply: function (root) {
      var list = (root || document).querySelectorAll('[data-cs-stroke]');
      list.forEach(function (el) {
        schedule(el);
        if (observer) observer.observe(el);
      });
    },
    refresh: function () {
      document.querySelectorAll('[data-cs-stroke]').forEach(schedule);
    }
  };
})(window.CS);

