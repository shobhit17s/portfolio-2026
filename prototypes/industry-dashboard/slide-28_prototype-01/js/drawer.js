/* ===========================================================================
   drawer.js — the trend panel behind every sparkline in the Trend column.

   WHAT IS IN IT, top to bottom, exactly as your sheet draws it:
       the percent change table   latest value, as-of date, W-O-W, M-O-M, Y-O-Y
       Metric Trend               the long line, with its material moves marked
       Metric Percent Change      the same series as year-on-year change

   Both charts carry the same two controls: a row of ranges, and a slider
   for narrowing the window inside the range.
   =========================================================================== */
window.KIM = window.KIM || {};

(function (KIM) {
  'use strict';

  var $ = KIM.$, el = KIM.el;
  var D = window.KIM_DATA;

  var RANGES = [['1Y', 12], ['2Y', 24], ['3Y', 36], ['5Y', 60], ['Max', 0]];

  var open = null;      /* { metric, trend, a: {…}, b: {…} } */
  var waiting = 0;      /* the handle of the wait, so closing can cancel it */

  /* ---------------------------------------------------------------------
     THE WINDOW
     ---------------------------------------------------------------------
     A range picks how far back to look; the slider then narrows that.
     Both are kept as FRACTIONS of the range rather than as point indexes,
     so switching from 5Y to Max keeps roughly the part of the series the
     reader was looking at instead of jumping somewhere arbitrary. */
  function windowOf(pts, sect) {
    var months = sect.range;
    var start = months ? Math.max(0, pts.length - months) : 0;
    var full = pts.slice(start);
    var a = Math.floor(sect.from * (full.length - 1));
    var b = Math.ceil(sect.to * (full.length - 1));
    if (b - a < 4) b = Math.min(full.length - 1, a + 4);
    return full.slice(a, b + 1);
  }

  function ranges(sect, redraw) {
    var row = el('div', 'kim-ranges');
    RANGES.forEach(function (r) {
      var b = el('button', 'kim-range', r[0]);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(sect.range === r[1]));
      b.addEventListener('click', function () {
        sect.range = r[1];
        sect.from = 0; sect.to = 1;
        redraw();
      });
      row.appendChild(b);
    });
    return row;
  }

  /* ---- the two-handle slider ---- */
  function slider(sect, redraw) {
    var box = el('div', 'kim-slider');
    var track = el('span', 'kim-slider-track');
    var fill = el('span', 'kim-slider-fill');
    box.appendChild(track); box.appendChild(fill);

    var handles = [];
    ['from', 'to'].forEach(function (which) {
      var h = el('button', 'kim-slider-handle');
      h.type = 'button';
      h.setAttribute('role', 'slider');
      h.setAttribute('aria-label', which === 'from' ? 'Start of the window' : 'End of the window');
      h.setAttribute('aria-valuemin', '0');
      h.setAttribute('aria-valuemax', '100');
      box.appendChild(h);
      handles.push({ key: which, node: h });
    });

    function place() {
      handles.forEach(function (h) {
        var v = sect[h.key];
        h.node.style.insetInlineStart = (v * 100) + '%';
        h.node.setAttribute('aria-valuenow', Math.round(v * 100));
      });
      fill.style.insetInlineStart = (sect.from * 100) + '%';
      fill.style.inlineSize = ((sect.to - sect.from) * 100) + '%';
    }

    handles.forEach(function (h) {
      /* POINTER COORDINATES ARE IN SCREEN PIXELS AND THE CANVAS IS SCALED,
         so the sum has to be done in screen pixels too — the track's own
         measured box. Mixing the two is how a dragged handle ends up
         lagging the pointer by exactly the scale factor. */
      function move(e) {
        var r = track.getBoundingClientRect();
        var v = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
        if (h.key === 'from') sect.from = Math.min(v, sect.to - 0.04);
        else sect.to = Math.max(v, sect.from + 0.04);
        sect.from = Math.max(0, sect.from);
        sect.to = Math.min(1, sect.to);
        place();
        redraw(true);
      }
      h.node.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        h.node.setPointerCapture(e.pointerId);
        h.node.addEventListener('pointermove', move);
      });
      h.node.addEventListener('pointerup', function (e) {
        h.node.releasePointerCapture(e.pointerId);
        h.node.removeEventListener('pointermove', move);
      });
      /* AND IT WORKS FROM THE KEYBOARD, which a slider made of two buttons
         otherwise would not. */
      h.node.addEventListener('keydown', function (e) {
        var step = e.shiftKey ? 0.1 : 0.02;
        if (e.key === 'ArrowLeft') { sect[h.key] -= step; }
        else if (e.key === 'ArrowRight') { sect[h.key] += step; }
        else if (e.key === 'Home') { sect[h.key] = h.key === 'from' ? 0 : 0.5; }
        else if (e.key === 'End') { sect[h.key] = h.key === 'from' ? 0.5 : 1; }
        else return;
        e.preventDefault();
        sect.from = Math.max(0, Math.min(sect.from, sect.to - 0.04));
        sect.to = Math.min(1, Math.max(sect.to, sect.from + 0.04));
        place();
        redraw(true);
      });
    });

    place();
    return box;
  }

  /* ---------------------------------------------------------------------
     THE PERCENT CHANGE TABLE
     --------------------------------------------------------------------- */
  function pctCell(td, value, material) {
    var wrap = el('span', 'kim-pct' + (material ? ' is-material' : '') + (value >= 0 ? ' is-up' : ' is-down'));
    wrap.appendChild(el('span', 'kim-pct-val', KIM.pct(Math.abs(value))));
    wrap.appendChild(KIM.icon(value >= 0 ? 'up' : 'down'));
    td.appendChild(wrap);
    return td;
  }

  function pctTable(m, pts) {
    var table = el('table', 'kim-pcttable');
    var thead = el('thead'), hr = el('tr');

    [['Latest Value', '(unit)'], ['As Of Date', null],
     ['% Change', '(W-O-W)'], ['% Change', '(M-O-M)'], ['% Change', '(Y-O-Y)']]
      .forEach(function (pair) {
        var th = el('th', null, pair[0]);
        th.scope = 'col';
        if (pair[1]) th.appendChild(el('span', 'kim-th-sub', pair[1]));
        hr.appendChild(th);
      });
    thead.appendChild(hr); table.appendChild(thead);

    var last = pts[pts.length - 1];
    var mom = pts.length > 1 ? (last.v - pts[pts.length - 2].v) / pts[pts.length - 2].v * 100 : 0;
    var yoy = pts.length > 13 ? (last.v - pts[pts.length - 13].v) / pts[pts.length - 13].v * 100 : 0;

    var tbody = el('tbody'), tr = el('tr');
    var c1 = el('td');
    c1.appendChild(el('span', null, KIM.num(last.v)));
    c1.appendChild(el('span', 'kim-metric-when', m.unit));
    tr.appendChild(c1);
    tr.appendChild(el('td', null, KIM.charts.monthLabel(last)));
    /* W-O-W IS NOT AVAILABLE FOR A MONTHLY SERIES, and the honest answer is
       the one your sheet prints: N/A. Inventing a weekly figure from
       monthly data would be making something up on screen. */
    tr.appendChild(el('td', null, m.freq === 'M-O-M' ? 'N/A' : 'N/A'));
    tr.appendChild(pctCell(el('td'), mom, m.material));
    tr.appendChild(pctCell(el('td'), yoy, false));
    tbody.appendChild(tr); table.appendChild(tbody);
    return table;
  }

  /* ---------------------------------------------------------------------
     A CHART SECTION
     --------------------------------------------------------------------- */
  /* THE SECTION PUTS ITSELF ON THE PAGE BEFORE IT DRAWS, and that order is
     load-bearing. A chart is drawn at the width it measures, and a box that
     is not in the document yet measures nothing — so building first gave
     both charts the 360px fallback rather than the width they actually had.
     Hence `parent` rather than a returned node. */
  function section(parent, title, when, sect, build) {
    var box = el('section', 'kim-chartwrap');
    var h = el('h3', 'kim-sect-title', title + ' ');
    h.appendChild(el('span', 'kim-sect-when', '(Last Updated: ' + when + ')'));
    box.appendChild(h);

    var body = el('div', 'kim-chartwrap');
    box.appendChild(ranges(sect, function () { rebuildAll(); }));
    box.appendChild(slider(sect, function () { KIM.clear(body); build(body); }));
    box.appendChild(body);
    parent.appendChild(box);
    build(body);
  }

  var rebuildAll = function () {};

  /* ---------------------------------------------------------------------
     OPEN AND CLOSE
     --------------------------------------------------------------------- */
  var drawer = {};

  drawer.open = function (metric) {
    var trend = D.trendOf(metric.id);
    var sub = D.subs.filter(function (s) { return s.id === metric.subId; })[0];

    open = {
      metric: metric, trend: trend,
      a: { range: 60, from: 0, to: 1 },
      b: { range: 60, from: 0, to: 1 }
    };

    $('kim-drawer-crumb').textContent = (sub ? sub.name + ' · ' : '') + metric.name;
    $('kim-scrim').hidden = false;
    $('kim-drawer').hidden = false;
    KIM.clear($('kim-drawer-body'));

    /* THE PANEL ARRIVES FIRST AND THE FIGURES FOLLOW. Opening it empty and
       filling it a beat later is the honest shape for something that
       fetches thirty years of a series — and it means the slide-in is
       never competing with two charts being drawn. The close is live the
       whole time, because a panel you cannot shut while it loads is a
       trap. */
    $('kim-drawer-loading').hidden = false;
    window.clearTimeout(waiting);
    waiting = window.setTimeout(function () {
      if (!open) return;                 /* shut again before it landed */
      $('kim-drawer-loading').hidden = true;
      drawer.paint();
    }, 550);

    /* `preventScroll` IS LOAD-BEARING HERE. The drawer starts one panel-
       width off the right edge of the canvas, and focusing something that
       lies outside its container asks the browser to bring it into view —
       which it does by scrolling the container, sliding the whole screen
       sideways. The frame is `overflow: clip` now so it cannot scroll at
       all, and this says the same thing a second time at the one place it
       was being asked for. */
    $('kim-drawer-close').focus({ preventScroll: true });
    KIM.emit('trend-open', metric.id);
  };

  drawer.paint = function () {
    if (!open) return;
    var m = open.metric, pts = open.trend.points, marks = open.trend.marks;
    var body = KIM.clear($('kim-drawer-body'));

    var pct = el('section');
    pct.appendChild(el('h3', 'kim-sect-title', 'Percent Change Table'));
    pct.appendChild(pctTable(m, pts));
    body.appendChild(pct);

    rebuildAll = drawer.paint;

    /* ---- the line ---- */
    /* THE HEADING IS THE METRIC'S OWN NAME. "Metric Trend" is what the
       layout sheet writes because it does not know which metric it will
       be; on a working screen the reader has just opened one, and the
       panel should say which. */
    section(body, m.name + ' Trend', D.asOfLabel, open.a, function (host) {
      var win = windowOf(pts, open.a);
      var first = pts.length - win.length;
      var inWin = marks.filter(function (k) { return k.i >= first; })
                       .map(function (k) { return { i: k.i - first, up: k.up }; })
                       .filter(function (k) { return k.i < win.length; });
      KIM.charts.line(host, win, inWin, {
        unit: m.unit,
        alt: m.name + ' from ' + KIM.charts.monthLabel(win[0]) +
             ' to ' + KIM.charts.monthLabel(win[win.length - 1])
      });

      var key = el('ul', 'kim-chartkey');
      key.appendChild(keyItem('line', m.name));
      key.appendChild(keyItem('up', 'Material Move (Increase)'));
      key.appendChild(keyItem('down', 'Material Move (Decrease)'));
      host.appendChild(key);
    });

    /* ---- the same series as year-on-year change ---- */
    section(body, m.name + ' Percent Change Trend', D.asOfLabel, open.b, function (host) {
      var win = windowOf(pts, open.b);
      var first = pts.length - win.length;
      var changes = win.map(function (p, i) {
        var back = pts[first + i - 12];
        return { y: p.y, m: p.m, v: back ? ((p.v - back.v) / back.v) * 100 : 0 };
      });
      KIM.charts.area(host, changes, { alt: m.name + ', year-on-year percent change' });
    });
  };

  function keyItem(kind, says) {
    var li = el('li');
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 30 12');
    svg.setAttribute('aria-hidden', 'true');
    if (kind === 'line') {
      svg.innerHTML = '<path class="kim-line" d="M1 6h28"/>';
      /* the swatch has to be the same colour as the line it stands for,
         which means wearing the same class that colours it */
      svg.setAttribute('class', 'kim-chart kim-chart--key kim-chart--abs');
    } else {
      svg.innerHTML = '<path class="kim-mark kim-mark--' + kind + '" d="M1 6h9M20 6h9"/>' +
                      '<circle class="kim-markdot--' + kind + '" cx="15" cy="6" r="3.4"/>';
    }
    /* the key's swatches are chart-coloured but NOT chart-sized */
    if (!svg.getAttribute('class')) svg.setAttribute('class', 'kim-chart kim-chart--key');
    li.appendChild(svg);
    li.appendChild(el('span', null, says));
    return li;
  }

  drawer.close = function () {
    open = null;
    window.clearTimeout(waiting);
    $('kim-drawer-loading').hidden = true;
    $('kim-drawer').hidden = true;
    $('kim-scrim').hidden = true;
  };

  drawer.init = function () {
    $('kim-drawer-close').addEventListener('click', drawer.close);
    $('kim-scrim').addEventListener('click', drawer.close);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !$('kim-drawer').hidden) drawer.close();
    });
    /* THE CHARTS ARE DRAWN AT A MEASURED WIDTH, so anything that changes
       the width of the drawer has to redraw them. */
    KIM.on('layout-change', function () { if (open) drawer.paint(); });
  };

  drawer.isOpen = function () { return !!open; };

  KIM.drawer = drawer;

})(window.KIM);
