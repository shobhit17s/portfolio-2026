/* lofi-chart.js — CONTENT. Drawing the trend view.

       LOFI.drawChart(el, {
         xLabels: ['2026', … ],
         series:  [ { name: 'Credit', colour: 'sun', values: [ … ] }, … ],
         scale:   'value',        // or leave it out for the banded chart
         unit:    'x',            // optional suffix on the axis numbers
         scrub:   6               // ONE marker, at this x position
       });

   TWO SCALES, AND THE DIFFERENCE IS WHAT THE READER IS ALLOWED TO ASK.

   BANDED (the original) takes values 0..1 and labels the y-axis in words
   - v.low, low, medium, high. It is for a chart about SHAPE: which line
   is above which, and where they cross. Naming the axis in words is a way
   of saying "do not read a number off this", which is honest when the
   numbers were invented.

   VALUE (`scale: 'value'`) takes real figures and draws a real numbered
   axis with ticks. It is for a chart whose numbers mean something - the
   case comparison, where the same figures are in the grid one click away.
   A reader who can see 165 in the table should be able to find 165 on the
   chart, and a banded axis makes that impossible.

   ONE SCRUBBER, NOT THREE. The sheet of 3 November draws a single upright
   with a triangle at each end, a dot where it crosses every line, and the
   figures for that year read out beside the chart. Three markers were
   three answers to a question nobody asked twice; one marker is a reader
   moving through time.

   A SERIES NAMES A TOKEN, NOT A COLOUR: `colour: 'sun'` becomes
   `var(--lofi-sun)`. So a chart re-themes with the rest of the kit and no
   hex code ever appears in a prototype. */
window.LOFI = window.LOFI || {};
(function (LOFI) {
  'use strict';

  /* ---------- HOW BIG THE DRAWING IS ----------

     The drawing has its own measuring system, 1000 units wide, and every
     padding and type size in this file is written in those units. That is
     what keeps a chart looking the same whether it is 400 pixels wide or
     1200: the whole picture is scaled as one object.

     THE HEIGHT IS NOT FIXED ANY MORE, and that is the fix for "the chart
     is overflowing out of the bottom edge". It used to be 460 units tall
     always, drawn at `height: auto` - so the taller the box got in units,
     the taller the chart got in pixels, and a wide widget produced a chart
     taller than the room it had.

     Now the height is MEASURED. We ask the box how tall it is relative to
     how wide it is, and build the unit grid to that same shape: a box
     twice as wide as it is tall becomes a 1000 x 500 drawing. The viewBox
     then has exactly the box's proportions, so `height: 100%` fills it
     with nothing stretched and nothing cut off.

     The clamp is there for the two silly cases - a box measured before it
     has been laid out (zero), and a box so letterboxed that the axis
     labels would collide. */
  var W = 1000;
  var H_MIN = 260, H_MAX = 900, H_FALLBACK = 460;
  var PAD = { t: 30, r: 24, b: 48, l: 92 };

  function measure(el) {
    var w = el.clientWidth || el.offsetWidth || 0;
    var h = el.clientHeight || el.offsetHeight || 0;
    if (!w || !h) return H_FALLBACK;
    var units = Math.round(W * (h / w));
    return Math.max(H_MIN, Math.min(H_MAX, units));
  }

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function path(pts) {
    /* A ROUNDED POLYLINE rather than a true spline. A spline can overshoot
       - it will happily draw a dip that is not in the data - and on a
       chart whose whole job is "which line is on top", an invented dip is
       a lie. Rounded joins give the hand-drawn softness without moving a
       single point. */
    return pts.map(function (p, i) {
      return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1);
    }).join(' ');
  }

  /* NICE NUMBERS FOR AN AXIS. A scale that runs 0 to 173.4 and labels
     itself 0, 43.35, 86.7 is arithmetically perfect and unreadable. A
     person drawing the same axis picks 50, 100, 150 - steps of 1, 2 or 5
     times a power of ten - so that is what this does, then widens the
     range to land on one of them at each end. */
  function niceScale(lo, hi, want) {
    want = want || 5;
    if (!(hi > lo)) { hi = lo + 1; }
    var raw = (hi - lo) / want;
    var mag = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10));
    var norm = raw / mag;
    var step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
    var from = Math.floor(lo / step) * step;
    var to   = Math.ceil(hi / step) * step;
    var ticks = [];
    for (var v = from; v <= to + step / 1000; v += step) ticks.push(+v.toFixed(6));
    return { from: from, to: to, ticks: ticks, step: step };
  }

  function writeTick(v, unit) {
    var t = Math.abs(v) >= 100 || v === Math.round(v)
          ? String(Math.round(v)) : v.toFixed(1);
    return t + (unit || '');
  }

  LOFI.drawChart = function (el, cfg) {
    if (!el || !cfg || !cfg.series || !cfg.series.length) return;
    var xs = cfg.xLabels || [];
    var ys = cfg.yLabels || [];
    var n = xs.length;
    if (n < 2) return;

    /* The config is kept ON the element, so the chart can redraw itself
       later - when the window changes shape, or when a hidden lens is
       shown and the box finally has a height to measure - without the
       prototype having to remember to ask. */
    el._lofiChart = cfg;
    watch(el);

    var H = measure(el);
    var plotW = W - PAD.l - PAD.r;
    var plotH = H - PAD.t - PAD.b;
    var X = function (i) { return PAD.l + (i / (n - 1)) * plotW; };

    var valueScale = cfg.scale === 'value';
    var sc = null, Y;
    if (valueScale) {
      var all = [];
      cfg.series.forEach(function (s) {
        (s.values || []).forEach(function (v) {
          if (typeof v === 'number' && isFinite(v)) all.push(v);
        });
      });
      sc = niceScale(Math.min.apply(null, all), Math.max.apply(null, all), 5);
      Y = function (v) {
        var t = (v - sc.from) / (sc.to - sc.from);
        return PAD.t + (1 - Math.max(0, Math.min(1, t))) * plotH;
      };
    } else {
      Y = function (v) {
        return PAD.t + (1 - Math.max(0, Math.min(1, v))) * plotH;
      };
    }

    var out = [];

    /* THE TWO AXES, DRAWN AS ARROWS. The sheet puts a head on each one -
       a drawn axis that just stops reads as a line someone forgot to
       finish, where an arrow says "and onwards". */
    var ax0 = PAD.l, ay1 = H - PAD.b, ax1 = W - PAD.r + 10, ay0 = PAD.t - 16;
    out.push('<path class="lofi-chart-axis" d="M' + ax0 + ' ' + ay0 +
             ' L' + ax0 + ' ' + ay1 + ' L' + ax1 + ' ' + ay1 + '"/>');
    out.push('<path class="lofi-chart-axis-head" d="M' + (ax0 - 7) + ' ' + (ay0 + 13) +
             ' L' + ax0 + ' ' + ay0 + ' L' + (ax0 + 7) + ' ' + (ay0 + 13) + '"/>');
    out.push('<path class="lofi-chart-axis-head" d="M' + (ax1 - 13) + ' ' + (ay1 - 7) +
             ' L' + ax1 + ' ' + ay1 + ' L' + (ax1 - 13) + ' ' + (ay1 + 7) + '"/>');

    if (valueScale) {
      /* a numbered axis, with a tick at every step */
      sc.ticks.forEach(function (v) {
        var y = Y(v);
        if (y < PAD.t - 2 || y > ay1 + 2) return;
        out.push('<path class="lofi-chart-grid" d="M' + (PAD.l - 12) + ' ' + y.toFixed(1) +
                 ' L' + PAD.l + ' ' + y.toFixed(1) + '"/>');
        out.push('<text class="lofi-chart-tick" x="' + (PAD.l - 20) + '" y="' + y.toFixed(1) +
                 '" text-anchor="end" dominant-baseline="middle">' +
                 esc(writeTick(v, cfg.unit)) + '</text>');
      });
    } else {
      /* y bands and their names */
      ys.forEach(function (label, i) {
        var v = ys.length === 1 ? 0.5 : i / (ys.length - 1);
        var y = Y(v);
        out.push('<path class="lofi-chart-grid" d="M' + (PAD.l - 10) + ' ' + y.toFixed(1) +
                 ' L' + (PAD.l + 8) + ' ' + y.toFixed(1) + '"/>');
        out.push('<text class="lofi-chart-tick" x="' + (PAD.l - 18) + '" y="' + y.toFixed(1) +
                 '" text-anchor="middle" dominant-baseline="middle" ' +
                 'transform="rotate(-90 ' + (PAD.l - 18) + ' ' + y.toFixed(1) + ')">' +
                 esc(label) + '</text>');
      });

      if (cfg.yTitle) {
        var my = PAD.t + plotH / 2;
        out.push('<text class="lofi-chart-name" x="' + (PAD.l - 56) + '" y="' + my +
                 '" text-anchor="middle" transform="rotate(-90 ' + (PAD.l - 56) + ' ' + my + ')">' +
                 esc(cfg.yTitle) + '</text>');
      }
    }

    /* x labels, sitting under the baseline */
    xs.forEach(function (label, i) {
      out.push('<text class="lofi-chart-tick" x="' + X(i).toFixed(1) + '" y="' + (H - PAD.b + 26) +
               '" text-anchor="middle">' + esc(label) + '</text>');
    });

    /* the series */
    cfg.series.forEach(function (s) {
      var pts = (s.values || []).map(function (v, i) { return [X(i), Y(v)]; });
      out.push('<path class="lofi-chart-line" d="' + path(pts) +
               '" style="stroke: var(--lofi-' + (s.colour || 'water') + ')"/>');
    });

    /* ONE SCRUBBER, LAST, so it sits over the lines.
       `scrub: 6` is the new way; `scrubs: [2,3,5]` still works, because
       the banded chart in the kit gallery uses it. */
    var marks = cfg.scrub !== undefined ? [cfg.scrub] : (cfg.scrubs || []);
    marks.forEach(function (i, k) {
      if (i < 0 || i > n - 1) return;
      var x = X(i);
      out.push('<g data-lofi-scrub="' + k + '">');
      out.push('<path class="lofi-chart-scrub" d="M' + x.toFixed(1) + ' ' + (PAD.t - 6) +
               ' L' + x.toFixed(1) + ' ' + (H - PAD.b - 4) + '"/>');
      out.push('<path class="lofi-chart-scrub-cap" d="M' + (x - 11) + ' ' + (PAD.t - 20) +
               ' h22 l-11 16 z"/>');
      out.push('<path class="lofi-chart-scrub-cap" d="M' + (x - 11) + ' ' + (H - PAD.b - 2) +
               ' h22 l-11 -16 z"/>');
      cfg.series.forEach(function (s) {
        var v = (s.values || [])[i];
        if (v === undefined) return;
        out.push('<circle class="lofi-chart-scrub-knot" cx="' + x.toFixed(1) +
                 '" cy="' + Y(v).toFixed(1) + '" r="11"/>');
      });
      /* A WIDE INVISIBLE GRAB AREA. The upright is 3 units thick; nobody
         can hit 3 units with a mouse, let alone a thumb. */
      out.push('<rect class="lofi-chart-scrub-hit" x="' + (x - 18) + '" y="' + (PAD.t - 22) +
               '" width="36" height="' + (plotH + 40) + '" tabindex="0" role="slider" ' +
               'aria-label="' + esc(cfg.scrubLabel || 'Year') + '" aria-valuemin="0" aria-valuemax="' + (n - 1) +
               '" aria-valuenow="' + i + '" aria-valuetext="' + esc(xs[i]) + '"/>');
      out.push('</g>');
    });

    el.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" ' +
                   'aria-label="' + esc(cfg.label || 'Trend chart') + '">' +
                   out.join('') + '</svg>';

    /* ---- dragging a marker ---- */
    el.querySelectorAll('[data-lofi-scrub]').forEach(function (g) {
      var k = +g.dataset.lofiScrub;
      var hit = g.querySelector('.lofi-chart-scrub-hit');
      if (!hit) return;

      function moveTo(i) {
        i = Math.max(0, Math.min(n - 1, Math.round(i)));
        var now = cfg.scrub !== undefined ? cfg.scrub : cfg.scrubs[k];
        if (now === i) return;
        if (cfg.scrub !== undefined) cfg.scrub = i; else cfg.scrubs[k] = i;
        LOFI.drawChart(el, cfg);                 /* redraw from the config */
        el.dispatchEvent(new CustomEvent('lofi:scrub', {
          bubbles: true, detail: { index: k, at: i, label: xs[i] }
        }));
      }

      function fromClientX(cx) {
        var box = el.getBoundingClientRect();
        var u = ((cx - box.left) / box.width) * W;          /* px -> drawing units */
        return ((u - PAD.l) / plotW) * (n - 1);
      }

      hit.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        var move = function (ev) { moveTo(fromClientX(ev.clientX)); };
        var up = function () {
          window.removeEventListener('pointermove', move);
          window.removeEventListener('pointerup', up);
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
      });

      hit.addEventListener('keydown', function (e) {
        var at = function () {
          return cfg.scrub !== undefined ? cfg.scrub : cfg.scrubs[k];
        };
        if (e.key === 'ArrowRight') { e.preventDefault(); moveTo(at() + 1); }
        if (e.key === 'ArrowLeft')  { e.preventDefault(); moveTo(at() - 1); }
      });
    });
  };

  /* ---------- REDRAWING WHEN THE BOX CHANGES SHAPE ----------

     The drawing is built to the box's proportions, so the drawing has to
     be rebuilt whenever those proportions change. Two things change them:

     THE WINDOW. The canvas is scaled as one object, so this is rarer than
     it sounds - but the segmented control fires a `resize` when it swaps
     lenses, which is how a chart that was hidden (and therefore had no
     height to measure) gets its real one.

     THE BOX ITSELF, when a panel above it grows or a tab row wraps onto a
     second line. `ResizeObserver` is the only thing that hears that.

     A redraw is cheap - it is one string of SVG - but it is still skipped
     when the measured height has not actually changed, so dragging a
     marker does not set off a cascade. */
  function redraw(el) {
    if (!el || !el._lofiChart || !el.isConnected) return;
    var h = measure(el);
    if (el._lofiChartH === h) return;
    el._lofiChartH = h;
    LOFI.drawChart(el, el._lofiChart);
  }

  var watched = [];
  var ro = (typeof ResizeObserver === 'function')
    ? new ResizeObserver(function (entries) {
        entries.forEach(function (e) { redraw(e.target); });
      })
    : null;

  function watch(el) {
    if (watched.indexOf(el) !== -1) return;
    watched.push(el);
    el._lofiChartH = measure(el);
    if (ro) ro.observe(el);
  }

  window.addEventListener('resize', function () {
    watched.forEach(redraw);
  });
  /* ---------- THE READOUT ----------

         LOFI.drawReadout(el, {
           when:   '2032',
           rows: [ { name: 'Credit (base)', value: 165 },
                   { name: 'Management', value: 175, delta: 6.06 } ]
         });

     It is in the kit rather than in a prototype because both prototypes
     need it and it is tightly tied to how the chart's scrubber reports
     itself. It draws only; what the scrubber is pointing AT is the
     prototype's business, because only the prototype knows what the
     numbers mean. */
  LOFI.drawReadout = function (el, cfg) {
    if (!el || !cfg) return;
    el.classList.add('lofi-chart-readout');
    var out = ['<p class="lofi-chart-readout-when">Values for ' +
               esc(cfg.when) + '</p>'];
    (cfg.rows || []).forEach(function (r) {
      var d = (r.delta === undefined || r.delta === null) ? ''
            : '<span class="lofi-chart-readout-delta">' +
              (r.delta > 0 ? '+' : '') + r.delta.toFixed(2) + '%</span>';
      out.push('<div class="lofi-chart-readout-row">' +
        '<span class="lofi-chart-readout-name">' + esc(r.name) + ':</span>' +
        '<span class="lofi-chart-readout-figs">' +
          '<span class="lofi-chart-readout-value">' + esc(r.value) + '</span>' +
          d +
        '</span></div>');
    });
    el.innerHTML = out.join('');
  };
})(window.LOFI);
