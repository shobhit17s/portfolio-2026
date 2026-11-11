/* ===========================================================================
   views.js — the three screens inside the card.

       overview   the deck of sub-industry cards
       sub        one sub-industry: the heat grid of its KIMs
       metric     one KIM: its own row, and everything it drives

   ONE PLACE DECIDES WHAT THE HEAD SAYS. Every screen sets the title, the
   count beside it and which tools are on show through `head()` — so a new
   screen cannot forget to turn the Download button off again.
   =========================================================================== */
window.KIM = window.KIM || {};

(function (KIM) {
  'use strict';

  var $ = KIM.$, el = KIM.el;
  var D = window.KIM_DATA;
  var views = {};

  /* ---------------------------------------------------------------------
     THE HEAD AND THE PANES
     --------------------------------------------------------------------- */
  function head(title, count, opts) {
    opts = opts || {};
    $('kim-view-title').textContent = title;
    $('kim-view-count').textContent = count || '';
    $('kim-view-count').hidden = !count;
    $('kim-matonly-wrap').hidden = !opts.filters;
    $('kim-layout').hidden = !opts.filters;
    $('kim-download-wrap').hidden = !opts.download;
  }

  function show(which) {
    ['overview', 'sub', 'metric'].forEach(function (name) {
      $('kim-view-' + name).hidden = (name !== which);
    });
  }

  /* A PAUSE THAT IS HONEST ABOUT ITSELF. Your sheet draws a loading state
     for the sub-industry page, so there is one — and it is the only place
     in this build where something is slower than it needs to be. It is
     here because the real thing fetches, and a prototype that answers
     instantly teaches the reader a timing the product cannot keep. */
  function withLoading(ms, draw) {
    var box = $('kim-loading');
    box.hidden = false;
    window.setTimeout(function () {
      draw();
      box.hidden = true;
    }, ms);
  }

  /* ---------------------------------------------------------------------
     1 · THE OVERVIEW
     --------------------------------------------------------------------- */
  function card(sub) {
    var item = el('button', 'kim-card-item');
    item.type = 'button';
    item.dataset.kimSub = sub.id;

    var top = el('div', 'kim-card-top');
    top.appendChild(el('span', 'kim-card-name', sub.name));
    top.appendChild(KIM.star(sub.favourite));
    item.appendChild(top);
    item.appendChild(el('span', 'kim-card-asof', 'As of: ' + sub.asOf));

    item.appendChild(el('span', 'kim-card-label', '# KIMs'));
    item.appendChild(el('span', 'kim-card-big', KIM.pad2(sub.kims)));

    item.appendChild(el('span', 'kim-card-label', '# Material Movements'));

    /* THE COUNT CARRIES ITS OWN BREAKDOWN. Hovering it says how the moves
       split across Volume, Price and Cost — the number alone says that
       something moved but not what kind of thing. */
    var wrap = el('span', 'kim-movewrap');
    var pill = el('span', 'kim-movepill' + (sub.material ? '' : ' is-quiet'), KIM.pad2(sub.material));
    wrap.appendChild(pill);

    var pop = el('dl', 'kim-card-pop');
    [['Volume Drivers', sub.drivers.volume],
     ['Price Drivers', sub.drivers.price],
     ['Cost Drivers', sub.drivers.cost]].forEach(function (pair) {
      pop.appendChild(el('dt', null, pair[0]));
      pop.appendChild(el('dd', null, pair[1][0] + '/' + pair[1][1]));
    });
    wrap.appendChild(pop);

    /* IT FLIPS RATHER THAN SPILLING. The breakdown opens to the right of
       the count, which is fine for four columns out of five — on the last
       one it ran past the edge of the card deck and made the whole pane
       scroll sideways by about a hundred pixels, which moves the thing the
       reader is pointing at.

       MEASURED ON THE FRAME AFTER THE HOVER HAS LANDED. A hidden box has
       no size, so there is nothing to measure until the pointer is
       actually over it — hence the wait for the next frame. Which side it
       opens on cannot be written in CSS, because how many cards fit in a
       row depends on the width of the window. */
    function fitPop() {
      pop.classList.remove('is-flipped');
      window.requestAnimationFrame(function () {
        var pane = $('kim-view-overview').getBoundingClientRect();
        var box = pop.getBoundingClientRect();
        if (box.width && box.right > pane.right - 8) pop.classList.add('is-flipped');
      });
    }
    wrap.addEventListener('pointerenter', fitPop);
    wrap.addEventListener('focusin', fitPop);

    item.appendChild(wrap);

    item.appendChild(el('span', 'kim-card-label', 'Most Moved KIM'));
    item.appendChild(el('span', 'kim-card-strong', sub.mostMoved));

    item.addEventListener('click', function () { views.openSub(sub.id); });
    return item;
  }

  function drawOverview() {
    var host = KIM.clear($('kim-cardgroups'));
    var state = KIM.state;
    var shown = 0, total = 0;

    KIM.groups().forEach(function (grp) {
      total += grp.subs.length;
      var subs = KIM.visibleSubs(grp.subs);
      shown += subs.length;
      if (!subs.length) return;

      var box = el('section', 'kim-cardgroup');
      var open = state.openGroups['deck:' + grp.key] !== false;

      var h = el('button', 'kim-grouphead');
      h.type = 'button';
      h.setAttribute('aria-expanded', open ? 'true' : 'false');
      h.appendChild(KIM.icon('chev', 'kim-chev'));
      h.appendChild(el('span', null, grp.name));
      h.appendChild(el('span', 'kim-groupcount', KIM.pad2(subs.length)));
      h.addEventListener('click', function () {
        state.openGroups['deck:' + grp.key] = !open;
        drawOverview();
      });
      box.appendChild(h);

      var deck = el('div', 'kim-cards' + (state.layout === 'list' ? ' kim-cards--list' : ''));
      subs.forEach(function (s) { deck.appendChild(card(s)); });
      box.appendChild(deck);
      host.appendChild(box);
    });

    if (!host.firstChild) {
      host.appendChild(el('p', 'kim-empty',
        'No sub-industry has a material move in this grouping. Turn the switch off to see them all.'));
    }

    head('Overview of Sub-Industries',
         KIM.pad2(shown) + ' / ' + total + ' sub-industries with material moves',
         { filters: true });
  }

  /* ---------------------------------------------------------------------
     2 · ONE SUB-INDUSTRY — THE HEAT GRID
     --------------------------------------------------------------------- */
  var CATS = [['volume', 'Volume Drivers'], ['price', 'Price Drivers'], ['cost', 'Cost Drivers']];

  /* FROM AN IMPACT TO A TINT. Three steps rather than a continuous ramp,
     because a reader cannot tell 0.61 from 0.68 by eye and pretending
     otherwise just makes the grid noisy. Negative impact is bad for the
     sub-industry and takes fire; positive takes forest. */
  function heatClass(impact) {
    if (!impact) return '';
    var level = Math.abs(impact) > 0.8 ? 3 : (Math.abs(impact) > 0.6 ? 2 : 1);
    return ' is-' + (impact < 0 ? 'pos' : 'neg') + '-' + level;
  }

  /* WHICH COLUMNS ARE ON SHOW, and there are two different switches.

     `quarterly` / `annual`   is the group there at all — the Columns menu
     `qOpen` / `yOpen`        is the group OPEN — the arrow in its header

     A CLOSED GROUP KEEPS ITS LATEST COLUMN rather than disappearing. That
     is the difference between collapsing and hiding: closing Quarterly
     Data still answers "where is this metric now?", it just stops
     answering "and what was it doing two years ago". Annual starts closed
     for exactly that reason — one year is the useful default and the walk
     back to 2018 is on request. */
  function columns() {
    var c = KIM.state.cols;
    var cols = [];
    if (c.quarterly) {
      (c.qOpen ? D.quarters : D.quarters.slice(0, 1))
        .forEach(function (q) { cols.push({ kind: 'q', key: q, label: q }); });
    }
    if (c.annual) {
      (c.yOpen ? D.years : D.years.slice(0, 1))
        .forEach(function (y) { cols.push({ kind: 'y', key: y, label: y }); });
    }
    return cols;
  }

  /* A COLUMN GROUP'S HEADER, WHICH IS A BUTTON. The arrow turns to say
     which way the group is about to go: pointing left when open (press to
     fold it back), right when closed (press to let it out). */
  function groupTh(label, span, key, redraw) {
    var open = KIM.state.cols[key];
    var n = el('th');
    n.colSpan = span;
    n.scope = 'colgroup';
    var btn = el('button', 'kim-colgroup-btn');
    btn.type = 'button';
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', (open ? 'Collapse ' : 'Expand ') + label);
    btn.appendChild(el('span', null, label));
    btn.appendChild(KIM.icon('info'));
    btn.appendChild(KIM.icon('chev', 'kim-chev kim-chev--side'));
    btn.addEventListener('click', function () {
      KIM.state.cols[key] = !open;
      redraw();
    });
    n.appendChild(btn);
    return n;
  }

  function th(text, attrs, subText, icon) {
    var n = el('th', (attrs && attrs.cls) || null);
    if (attrs && attrs.rowspan) n.rowSpan = attrs.rowspan;
    if (attrs && attrs.colspan) n.colSpan = attrs.colspan;
    if (attrs && attrs.scope) n.scope = attrs.scope;
    var line = el('span', null, text);
    n.appendChild(line);
    if (icon) n.appendChild(KIM.icon(icon));
    if (subText) n.appendChild(el('span', 'kim-grid-sub', subText));
    return n;
  }

  function gridHead(table) {
    var cols = columns();
    var nQ = cols.filter(function (c) { return c.kind === 'q'; }).length;
    var nY = cols.filter(function (c) { return c.kind === 'y'; }).length;

    var thead = el('thead');
    var r1 = el('tr');
    r1.appendChild(th('Category & KIMs', { rowspan: 2, cls: 'kim-col-pin kim-col-1', scope: 'col' }));
    r1.appendChild(th('Latest Value', { rowspan: 2, cls: 'kim-col-pin kim-col-2', scope: 'col' }, '(as of date)', 'info'));
    r1.appendChild(th('% Change', { rowspan: 2, cls: 'kim-col-pin kim-col-3', scope: 'col' }, '(frequency)'));
    if (nQ) r1.appendChild(groupTh('Quarterly Data', nQ, 'qOpen', drawSub));
    if (nY) r1.appendChild(groupTh('Annual Data', nY, 'yOpen', drawSub));
    r1.appendChild(th('Trend', { rowspan: 2, cls: 'kim-col-trend', scope: 'col' }));
    thead.appendChild(r1);

    var r2 = el('tr');
    cols.forEach(function (c) { r2.appendChild(th(c.label, { scope: 'col' })); });
    thead.appendChild(r2);
    table.appendChild(thead);

    /* THE SECOND HEAD ROW HAS TO KNOW HOW TALL THE FIRST ONE IS, because
       both are sticky and the browser will not work that out for them.
       Measured rather than guessed: the density knob changes it. */
    window.requestAnimationFrame(function () {
      var h = r1.getBoundingClientRect().height;
      /* the canvas may be scaled, so the measured height is in screen
         pixels — divide it back out to the layout's own units */
      var k = Number(getComputedStyle($('kim-stage')).getPropertyValue('--fit-k')) || 1;
      if (h) table.style.setProperty('--kim-head-1', (h / k) + 'px');
    });
    return cols;
  }

  function metricRow(m, cols) {
    var tr = el('tr');

    var c1 = el('td', 'kim-col-pin kim-col-1');
    c1.appendChild(el('span', 'kim-metric-name', m.name));
    c1.appendChild(el('span', 'kim-metric-unit', m.unit));
    tr.appendChild(c1);

    var c2 = el('td', 'kim-col-pin kim-col-2');
    c2.appendChild(el('span', null, KIM.num(m.latest)));
    c2.appendChild(el('span', 'kim-metric-when', m.asOf));
    tr.appendChild(c2);

    var c3 = el('td', 'kim-col-pin kim-col-3');
    var pct = el('span', 'kim-pct' + (m.material ? ' is-material' : '') + (m.up ? ' is-up' : ' is-down'));
    pct.appendChild(el('span', 'kim-pct-val', KIM.pct(m.pct)));
    pct.appendChild(KIM.icon(m.up ? 'up' : 'down'));
    c3.appendChild(pct);
    c3.appendChild(el('span', 'kim-metric-freq', m.freq));
    tr.appendChild(c3);

    cols.forEach(function (c) {
      var cell = c.kind === 'q'
        ? m.quarters[D.quarters.indexOf(c.key)]
        : m.years[D.years.indexOf(c.key)];
      var td = el('td', 'kim-cell' + heatClass(cell.impact), KIM.num(cell.value));
      tr.appendChild(td);
    });

    var ct = el('td', 'kim-col-trend');
    var btn = el('button', 'kim-trendbtn');
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Open the trend for ' + m.name);
    btn.appendChild(KIM.icon('trend'));
    btn.addEventListener('click', function () { KIM.drawer.open(m); });
    ct.appendChild(btn);
    tr.appendChild(ct);

    return tr;
  }

  function drawSub() {
    var sub = D.subs.filter(function (s) { return s.id === KIM.state.subId; })[0];
    if (!sub) return views.openOverview();

    var table = KIM.clear($('kim-grid'));
    var cols = gridHead(table);
    var groups = D.metricsOf(sub.id);
    var span = 3 + cols.length + 1;

    var tbody = el('tbody');
    CATS.forEach(function (pair) {
      var list = groups[pair[0]];
      if (!list.length) return;
      var open = KIM.state.openCats[pair[0]] !== false;

      var gr = el('tr', 'kim-grouprow-grid');
      var gh = el('th');
      gh.colSpan = span;
      gh.scope = 'rowgroup';
      var btn = el('button', 'kim-catbtn');
      btn.type = 'button';
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.appendChild(KIM.icon('chev', 'kim-chev'));
      btn.appendChild(el('span', null, pair[1]));
      btn.addEventListener('click', function () {
        KIM.state.openCats[pair[0]] = !open;
        drawSub();
      });
      gh.appendChild(btn);
      gr.appendChild(gh);
      tbody.appendChild(gr);

      if (open) list.forEach(function (m) { tbody.appendChild(metricRow(m, cols)); });
    });
    table.appendChild(tbody);

    buildColumnsMenu();
    head(sub.name,
         KIM.pad2(sub.material) + ' / ' + KIM.pad2(sub.kims) + ' material movements',
         { download: true });
  }

  /* ---- which columns are on show ---- */
  function buildColumnsMenu() {
    var menu = KIM.clear($('kim-columns-menu'));
    [['quarterly', 'Quarterly Data'], ['annual', 'Annual Data']].forEach(function (pair) {
      var item = el('button', 'kim-menu-item');
      item.type = 'button';
      item.setAttribute('role', 'menuitemcheckbox');
      var on = KIM.state.cols[pair[0]];
      item.setAttribute('aria-checked', String(on));
      var tick = KIM.icon('check');
      tick.style.visibility = on ? 'visible' : 'hidden';
      item.appendChild(tick);
      item.appendChild(el('span', null, pair[1]));
      item.addEventListener('click', function () {
        /* THE LAST ONE CANNOT BE TURNED OFF. A grid with no data columns
           is not a view anybody asked for, and the way back from it is not
           obvious once the menu has closed. */
        if (on && !KIM.state.cols[pair[0] === 'quarterly' ? 'annual' : 'quarterly']) return;
        KIM.state.cols[pair[0]] = !on;
        drawSub();
      });
      menu.appendChild(item);
    });
  }

  /* ---------------------------------------------------------------------
     3 · ONE KIM, AND WHAT IT DRIVES
     --------------------------------------------------------------------- */
  function drawMetric() {
    var name = KIM.state.metricName;
    var all = D.metrics.filter(function (m) { return m.name === name; });
    if (!all.length) return views.openOverview();
    var m = all[0];

    /* the one row, with the extra columns this screen adds */
    var table = KIM.clear($('kim-metric-row'));
    var cols = columns();

    var thead = el('thead');
    var r1 = el('tr');
    r1.appendChild(th('Category & KIMs', { rowspan: 2, scope: 'col' }));
    r1.appendChild(th('Latest Value', { rowspan: 2, scope: 'col' }, '(as of date)', 'info'));
    r1.appendChild(th('% Change', { rowspan: 2, scope: 'col' }, '(frequency)'));
    var nQ = cols.filter(function (c) { return c.kind === 'q'; }).length;
    var nY = cols.filter(function (c) { return c.kind === 'y'; }).length;
    if (nQ) r1.appendChild(groupTh('Quarterly Data', nQ, 'qOpen', drawMetric));
    if (nY) r1.appendChild(groupTh('Annual Data', nY, 'yOpen', drawMetric));
    r1.appendChild(th('Min Value', { rowspan: 2, scope: 'col' }));
    r1.appendChild(th('Max Value', { rowspan: 2, scope: 'col' }));
    r1.appendChild(th('Mean Value', { rowspan: 2, scope: 'col' }));
    r1.appendChild(th('Trend', { rowspan: 2, cls: 'kim-col-trend', scope: 'col' }));
    thead.appendChild(r1);
    var r2 = el('tr');
    cols.forEach(function (c) { r2.appendChild(th(c.label, { scope: 'col' })); });
    thead.appendChild(r2);
    table.appendChild(thead);

    var tbody = el('tbody');
    var row = metricRow(m, cols);
    /* the pinned classes mean nothing on a one-row table that does not
       scroll sideways nearly as far — they are taken off so the row reads
       as one piece */
    [].forEach.call(row.querySelectorAll('.kim-col-pin'), function (td) {
      td.className = td.className.replace(/kim-col-pin|kim-col-\d/g, '').trim();
    });
    var trend = row.removeChild(row.lastChild);
    [KIM.num(m.min) + ' ', KIM.num(m.max) + ' ', KIM.num((m.min + m.max) / 2) + ' '].forEach(function (v, i) {
      var td = el('td', 'kim-cell');
      td.appendChild(el('span', null, v));
      td.appendChild(el('span', 'kim-metric-when', m.asOf));
      row.appendChild(td);
    });
    row.appendChild(trend);
    tbody.appendChild(row);
    table.appendChild(tbody);

    /* ---- the two correlation tables ---- */
    var split = D.drivenBy(name);
    [['kim-corr-neg', split.negative], ['kim-corr-pos', split.positive]].forEach(function (pair) {
      var host = $(pair[0]).querySelector('.kim-corr-table');
      KIM.clear(host);
      var hr = el('tr');
      ['Sub-Industry', 'Industry', 'Driver Of'].forEach(function (t) {
        var c = el('th', null, t); c.scope = 'col'; hr.appendChild(c);
      });
      var thd = el('thead'); thd.appendChild(hr); host.appendChild(thd);

      var body = el('tbody');
      if (!pair[1].length) {
        var none = el('tr');
        var td = el('td', null, 'None in this direction.');
        td.colSpan = 3;
        none.appendChild(td);
        body.appendChild(none);
      }
      pair[1].forEach(function (r) {
        var tr = el('tr');
        var c1 = el('td');
        var link = el('button', 'kim-corr-link', r.sub.name);
        link.type = 'button';
        link.addEventListener('click', function () { views.openSub(r.sub.id); });
        c1.appendChild(link);
        tr.appendChild(c1);
        tr.appendChild(el('td', null, r.sub.industry));
        tr.appendChild(el('td', null, r.driverOf.charAt(0).toUpperCase() + r.driverOf.slice(1)));
        body.appendChild(tr);
      });
      host.appendChild(body);
    });

    var moved = all.filter(function (x) { return x.material; }).length;
    head(name, KIM.pad2(moved) + ' / ' + KIM.pad2(all.length) + ' material movements',
         { download: true });
  }

  /* ---------------------------------------------------------------------
     GOING PLACES
     --------------------------------------------------------------------- */
  views.openOverview = function () {
    KIM.state.view = 'overview';
    KIM.state.subId = null;
    KIM.state.metricName = null;
    $('kim-overview-item').setAttribute('aria-current', 'page');
    show('overview');
    drawOverview();
    KIM.panel.draw();
  };

  views.openSub = function (id) {
    KIM.state.view = 'sub';
    KIM.state.subId = id;
    KIM.state.metricName = null;
    $('kim-overview-item').removeAttribute('aria-current');
    show('sub');
    KIM.panel.draw();

    /* OPEN THE GROUP THE CHOSEN SUB-INDUSTRY IS IN, so the panel is showing
       where the reader just went rather than leaving them to find it. */
    var sub = D.subs.filter(function (s) { return s.id === id; })[0];
    if (sub) {
      KIM.groups().forEach(function (grp) {
        if (grp.subs.indexOf(sub) > -1) KIM.state.openGroups[grp.key] = true;
      });
      KIM.panel.draw();
    }

    head(sub ? sub.name : '', '', { download: true });
    withLoading(700, drawSub);
    KIM.emit('sub-open', id);
  };

  views.openMetric = function (name) {
    KIM.state.view = 'metric';
    KIM.state.metricName = name;
    $('kim-overview-item').removeAttribute('aria-current');
    show('metric');
    /* THE SELECTOR GETS OUT OF THE WAY, as your sheet draws it: this screen
       is about one metric across many sub-industries, so a list of
       sub-industries down the side is no longer what the reader is
       steering with. */
    KIM.panel.setOpen(false);
    withLoading(500, drawMetric);
    KIM.emit('metric-open', name);
  };

  views.draw = function () {
    if (KIM.state.view === 'overview') drawOverview();
    else if (KIM.state.view === 'sub') drawSub();
    else drawMetric();
  };

  KIM.views = views;

})(window.KIM);
