/* ===========================================================================
   charts.js — the two pictures in the trend drawer.

   THEY KNOW NOTHING ABOUT KIMs. Each takes a list of points and a window to
   draw, and gives back an <svg>. That is on purpose: a chart that knows what
   a sub-industry is cannot be lifted into the next prototype.

   WHY INLINE SVG AND NOT A CHART LIBRARY. Salt's own charting is Highcharts,
   which is a licensed dependency and not something to bundle into a
   prototype folder you are going to email around. These two draw what your
   sheets draw and nothing more, in about a hundred lines, with every colour
   coming from the theme like everything else.

   THE ONE THING WORTH KNOWING: the SVG is drawn at its MEASURED size rather
   than at a fixed viewBox stretched to fit. Stretching a viewBox stretches
   the text and the line weights with it — the letters go fat in one
   direction, which is the giveaway of a chart that was scaled rather than
   drawn.
   =========================================================================== */
window.KIM = window.KIM || {};

(function (KIM) {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
                'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  function mk(tag, attrs) {
    var n = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  }

  /* NICE NUMBERS FOR AN AXIS. Left to itself an axis runs 0 to 97.3 in
     steps of 16.2, which nobody can read across. This walks a short list
     of steps people actually count in and takes the first one that gives
     at most seven lines. */
  function ticks(lo, hi) {
    if (hi === lo) { hi = lo + 1; }
    var span = hi - lo;
    var steps = [1, 2, 2.5, 5, 10, 20, 25, 50, 100, 200, 500, 1000];
    var mag = Math.pow(10, Math.floor(Math.log(span) / Math.LN10) - 1);
    var step = steps[steps.length - 1] * mag;
    for (var i = 0; i < steps.length; i++) {
      if (span / (steps[i] * mag) <= 7) { step = steps[i] * mag; break; }
    }
    var start = Math.floor(lo / step) * step;
    var end = Math.ceil(hi / step) * step;
    var out = [];
    for (var v = start; v <= end + step / 2; v += step) out.push(Math.round(v * 1000) / 1000);
    return out;
  }

  function label(v) {
    var s = Math.abs(v) < 100 ? String(Math.round(v)) : String(Math.round(v));
    /* two digits, as the sheet writes them: 00, 10, 20 */
    if (Math.abs(v) < 10) s = (v < 0 ? '-' : '') + '0' + Math.abs(Math.round(v));
    return s;
  }

  /* ---------------------------------------------------------------------
     THE SHARED FRAME: axes, gridlines, year labels
     --------------------------------------------------------------------- */
  function frame(host, pts, opts) {
    var w = Math.max(360, host.clientWidth || 640);
    var h = opts.height || 210;
    var pad = { l: 42, r: 10, t: 10, b: 24 };

    var svg = mk('svg', {
      'class': 'kim-chart', viewBox: '0 0 ' + w + ' ' + h,
      width: w, height: h, role: 'img',
      'aria-label': opts.alt || 'Trend chart'
    });

    var lo = Infinity, hi = -Infinity;
    pts.forEach(function (p) { if (p.v < lo) lo = p.v; if (p.v > hi) hi = p.v; });
    if (opts.zero) { lo = Math.min(lo, 0); hi = Math.max(hi, 0); }
    var tk = ticks(lo, hi);
    var yLo = tk[0], yHi = tk[tk.length - 1];

    var x = function (i) { return pad.l + (i / Math.max(1, pts.length - 1)) * (w - pad.l - pad.r); };
    var y = function (v) { return h - pad.b - ((v - yLo) / (yHi - yLo)) * (h - pad.t - pad.b); };

    tk.forEach(function (v) {
      svg.appendChild(mk('line', { 'class': 'kim-gridline', x1: pad.l, x2: w - pad.r, y1: y(v), y2: y(v) }));
      var t = mk('text', { x: pad.l - 6, y: y(v) + 3.5, 'text-anchor': 'end' });
      t.textContent = label(v);
      svg.appendChild(t);
    });

    /* YEAR LABELS, EVERY OTHER YEAR, and the first and last are anchored
       rather than centred — centred, they hang half their width off the
       drawing and get clipped. */
    var seen = {};
    pts.forEach(function (p, i) {
      if (p.m !== 0 || seen[p.y] || p.y % 2 !== 1) return;
      seen[p.y] = 1;
      var px = x(i);
      var anchor = px < pad.l + 14 ? 'start' : (px > w - pad.r - 14 ? 'end' : 'middle');
      var t = mk('text', { x: px, y: h - pad.b + 15, 'text-anchor': anchor });
      t.textContent = String(p.y);
      svg.appendChild(t);
    });

    svg.appendChild(mk('line', {
      'class': 'kim-axisline', x1: pad.l, x2: w - pad.r,
      y1: h - pad.b, y2: h - pad.b
    }));

    if (opts.yTitle) {
      var yt = mk('text', {
        'class': 'kim-axis-title', x: 10, y: (h - pad.b + pad.t) / 2,
        'text-anchor': 'middle', transform: 'rotate(-90 10 ' + ((h - pad.b + pad.t) / 2) + ')'
      });
      yt.textContent = opts.yTitle;
      svg.appendChild(yt);
    }

    return { svg: svg, x: x, y: y, w: w, h: h, pad: pad, yLo: yLo, yHi: yHi };
  }

  /* =======================================================================
     THE READOUT
     =======================================================================
     WHY A CHART NEEDS ONE. A line says the shape of a thing; it cannot say
     what a number was in March 2019. Without a readout the reader is left
     measuring against the axis by eye, which is the point at which they
     stop trusting the picture and go looking for the table.

     IT IS HTML SITTING OVER THE SVG, not SVG inside it, and that is worth
     a line: a label drawn in SVG has to be measured and then have a box
     drawn behind it by hand, in the chart's own coordinates. In HTML it is
     a div that sizes itself, wears the same tokens as every other tooltip
     on the page, and is placed in PER CENT of the chart — which means the
     whole thing survives the canvas being scaled without a single
     division.

     THE NEAREST POINT WINS, not the point under the pointer. A reader
     aiming at a line two pixels wide would otherwise get nothing half the
     time. */
  function readout(host, svg, pts, geo, fmt) {
    var tip = document.createElement('div');
    tip.className = 'kim-tip';
    tip.hidden = true;
    host.appendChild(tip);

    var guide = mk('line', { 'class': 'kim-guide', y1: geo.pad.t, y2: geo.h - geo.pad.b, x1: 0, x2: 0 });
    var dot = mk('circle', { 'class': 'kim-guidedot', r: 3.6, cx: 0, cy: 0 });
    guide.style.display = dot.style.display = 'none';
    svg.appendChild(guide);
    svg.appendChild(dot);

    function at(e) {
      var box = svg.getBoundingClientRect();
      if (!box.width) return;
      var vx = ((e.clientX - box.left) / box.width) * geo.w;
      var span = geo.w - geo.pad.l - geo.pad.r;
      var i = Math.round(((vx - geo.pad.l) / span) * (pts.length - 1));
      i = Math.max(0, Math.min(pts.length - 1, i));
      var p = pts[i];

      guide.setAttribute('x1', geo.x(i));
      guide.setAttribute('x2', geo.x(i));
      dot.setAttribute('cx', geo.x(i));
      dot.setAttribute('cy', geo.y(p.v));
      guide.style.display = dot.style.display = '';

      tip.textContent = '';
      var when = document.createElement('span');
      when.className = 'kim-tip-when';
      when.textContent = MONTHS[p.m] + '-' + p.y;
      var val = document.createElement('span');
      val.className = 'kim-tip-val';
      val.textContent = fmt(p.v);
      tip.appendChild(when);
      tip.appendChild(val);
      tip.hidden = false;

      var fx = geo.x(i) / geo.w;
      tip.style.insetInlineStart = (fx * 100) + '%';
      tip.style.insetBlockStart = ((geo.y(p.v) / geo.h) * 100) + '%';
      /* at the ends it would hang off the drawing, so it leans the other
         way instead of being clipped */
      tip.classList.toggle('is-start', fx < 0.12);
      tip.classList.toggle('is-end', fx > 0.88);
    }

    svg.addEventListener('pointermove', at);
    svg.addEventListener('pointerdown', at);
    svg.addEventListener('pointerleave', function () {
      tip.hidden = true;
      guide.style.display = dot.style.display = 'none';
    });
  }

  function path(pts, x, y) {
    var d = '';
    pts.forEach(function (p, i) { d += (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p.v).toFixed(1); });
    return d;
  }

  /* ---------------------------------------------------------------------
     THE LINE, WITH ITS MATERIAL MOVES
     --------------------------------------------------------------------- */
  KIM.charts = {
    line: function (host, pts, marks, opts) {
      opts = opts || {};
      var f = frame(host, pts, { height: opts.height || 210, yTitle: 'Index', alt: opts.alt });
      /* THE CHART OF ACTUAL VALUES IS MARKED AS SUCH, because it is the
         one that runs in mist rather than in the teal. The class is on the
         chart rather than a colour being passed in, so the stylesheet is
         still the only file that knows a colour. */
      f.svg.setAttribute('class', 'kim-chart kim-chart--abs');

      (marks || []).forEach(function (m) {
        var px = f.x(m.i);
        f.svg.appendChild(mk('line', {
          'class': 'kim-mark kim-mark--' + (m.up ? 'up' : 'down'),
          x1: px, x2: px, y1: f.pad.t, y2: f.h - f.pad.b
        }));
      });

      f.svg.appendChild(mk('path', { 'class': 'kim-line', d: path(pts, f.x, f.y) }));

      (marks || []).forEach(function (m) {
        if (!pts[m.i]) return;
        f.svg.appendChild(mk('circle', {
          'class': 'kim-markdot--' + (m.up ? 'up' : 'down'),
          cx: f.x(m.i), cy: f.y(pts[m.i].v), r: 3.4
        }));
      });

      host.appendChild(f.svg);
      readout(host, f.svg, pts, f, opts.format || function (v) {
        return (Math.round(v * 100) / 100).toFixed(2) + (opts.unit ? ' ' + opts.unit : '');
      });
      return f.svg;
    },

    /* ---- the percent-change chart: an area, with a zero line ---- */
    area: function (host, pts, opts) {
      opts = opts || {};
      var f = frame(host, pts, {
        height: opts.height || 180, zero: true,
        yTitle: 'Percent Change', alt: opts.alt
      });

      var d = path(pts, f.x, f.y) +
              'L' + f.x(pts.length - 1).toFixed(1) + ' ' + f.y(0).toFixed(1) +
              'L' + f.x(0).toFixed(1) + ' ' + f.y(0).toFixed(1) + 'Z';
      f.svg.appendChild(mk('path', { 'class': 'kim-area', d: d }));
      f.svg.appendChild(mk('line', {
        'class': 'kim-axisline', x1: f.pad.l, x2: f.w - f.pad.r, y1: f.y(0), y2: f.y(0)
      }));
      f.svg.appendChild(mk('path', { 'class': 'kim-line', d: path(pts, f.x, f.y) }));

      host.appendChild(f.svg);
      readout(host, f.svg, pts, f, opts.format || function (v) {
        return (v >= 0 ? '+' : '') + (Math.round(v * 100) / 100).toFixed(2) + ' %';
      });
      return f.svg;
    },

    monthLabel: function (p) { return MONTHS[p.m] + '-' + p.y; }
  };

})(window.KIM);
