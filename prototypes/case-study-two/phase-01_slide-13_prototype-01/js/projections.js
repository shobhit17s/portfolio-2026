/* ===========================================================================
   app.js — everything on this page that moves.

   THE FLOW, in the order the reference draws it:

       1  Latest projection  ->  Actions  ->  Case comparison
       2  Setup parameters, over a scrim
       3  the results tab appears, loading
       4  the grid: one table, grouped by attribute, cases as rows
          Adjust parameters reopens the same modal

   WHAT IS WHERE
       section 1   the data, and what an "attribute" means
       section 2   the ledger            (screen 1)
       section 3   the inventory         (screen 2)
       section 4   the pill field        (a control, used twice)
       section 5   the setup modal       (screen 3)
       section 6   the loader + the grid (screens 4 and 5)
       section 7   the tabs
       section 8   the Actions menu
       section 9   the nudge
      section 10   light / dark
   =========================================================================== */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  var ICON = {
    chev:  '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 6l4 4 4-4"/></svg>',
    tick:  '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M3.5 8.5l3 3L12.5 5"/></svg>',
    cross: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg>',
    kebab: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><circle cx="8" cy="3" r="1.4"/><circle cx="8" cy="8" r="1.4"/><circle cx="8" cy="13" r="1.4"/></svg>'
  };

  /* =======================================================================
     1 - THE DATA, AND WHAT AN "ATTRIBUTE" IS
     =======================================================================
     An attribute is one row of the projection model, named for the reader.
     Keeping the mapping here means the grid never has to know where in the
     model a figure lives, and a new attribute is one line. */
  var MODEL = (window.CC_DATA || {}).projection;
  if (!MODEL) { return; }

  /* CAN THIS COPY OF THE SCREEN RUN A COMPARISON?

     The same screen is embedded in two prototypes. In the case-comparison
     prototype it is the whole point, and this is true. In the client
     dashboard the projections module is where the Performance to Plan
     widget lands you, and generating an analysis there is a different
     story told badly - so that page sets this to false before loading
     this file.

     ONE FILE, TWO PROTOTYPES. The alternative was a second, trimmed copy
     of this script, and two copies of anything drift the moment one of
     them is touched. The flag is the only difference, and it is read in
     exactly two places: the Actions menu, and whether the tour runs at
     all - because a tour whose destination has been switched off is a
     tour that leads nowhere. */
  var CAN_COMPARE = window.CC_ALLOW_COMPARISON !== false;

  /* `upIsGood` IS THE WHOLE OF THE COLOUR RULE, and it is a fact about the
     attribute rather than about the grid - so it lives here, next to the
     row it describes.

     GREEN MEANS GOOD, NOT UP. On revenue, EBITDA and cash flow those are
     the same thing and the distinction never shows. On LEVERAGE they are
     opposite: leverage is debt measured against earnings, so a rise means
     more borrowed against the same money, and the grid has to say that in
     red even though the number went up. */
  var ATTRS = [
    { id: 'revenue',  name: 'Revenue',   at: ['financial-summary', 'revenue'],  unit: '',  upIsGood: true  },
    { id: 'ebitda',   name: 'EBITDA',    at: ['financial-summary', 'ebitda'],   unit: '',  upIsGood: true  },
    { id: 'leverage', name: 'Leverage',  at: ['debt-leverage', 'net-leverage'], unit: 'x', upIsGood: false },
    { id: 'cashflow', name: 'Cash flow', at: ['cash-flow', 'fcf'],              unit: '',  upIsGood: true  }
  ];

  /* THE CASES THE COMPARISON OFFERS. Five of them are columns of the model.
     CUSTOM CASE IS NOT AND CANNOT BE: it is whatever the reader has just
     built in the modal, so the model has never heard of it. It is derived
     from the base by a fixed shape, which keeps it consistent with its own
     row - and it is the one row in this prototype whose figures are
     invented rather than read. */
  var CASES = MODEL.cases.concat([{ id: 'custom', name: 'Custom case', derived: true }]);
  var CUSTOM_SHAPE = [-0.04, -0.06, -0.09, -0.13, -0.11, -0.08, -0.12, -0.15, -0.13, -0.09];

  var NAME_OF = {};
  CASES.forEach(function (c) { NAME_OF[c.id] = c.name; });

  /* A PILL SAYS THE CASE, NOT THE WORD "CASE". Four pills reading
     "... CASE" each is four copies of a word that is already the name of
     the field they are sitting in, and the reference drops it. The rows
     keep the full name, because there the word is doing work. */
  function shortName(name) { return name.replace(/\s+case$/i, ''); }
  var PILL_CASES = CASES.map(function (c) {
    return { id: c.id, name: shortName(c.name) };
  });

  var state = {
    period: 10,
    base: 'credit',
    against: ['management', 'downside', 'consensus'],
    attrs: ['revenue', 'ebitda', 'leverage', 'cashflow'],
    showDeltas: true,
    logic: 'pct',
    openGroups: {}
  };

  function years() { return MODEL.meta.years.slice(0, state.period); }

  function seriesOf(caseId, attr) {
    var a = ATTRS.filter(function (x) { return x.id === attr; })[0];
    if (!a) return [];
    if (caseId === 'custom') {
      var base = seriesOf(state.base, attr);
      return base.map(function (v, i) {
        return v == null ? null : v * (1 + (CUSTOM_SHAPE[i] || 0));
      });
    }
    var vals = (MODEL.values[caseId] || {})[a.at[0]];
    return (vals && vals[a.at[1]]) || [];
  }

  function fmt(v, unit) {
    if (v == null) return '—';
    return unit === 'x' ? v.toFixed(2) + 'x' : v.toFixed(1);
  }

  /* THE DELTA IS A DIFFERENCE, SAID TWO WAYS. Percentage answers "how much
     worse", absolute answers "how much money" - the modal lets the reader
     pick which question the grid is answering.

     THE WASH IS DECIDED ON THE PERCENTAGE EITHER WAY, because a threshold
     in millions means nothing on a leverage row measured in multiples. */
  function deltaOf(caseId, attr, i) {
    var mine = seriesOf(caseId, attr)[i];
    var theirs = seriesOf(state.base, attr)[i];
    if (mine == null || theirs == null || !theirs) return null;
    return { pct: ((mine - theirs) / Math.abs(theirs)) * 100, abs: mine - theirs };
  }

  /* A FLAT ZERO HAS NO SIGN. Written as "−0.0%" it says the figure went
     down and then rounds the amount away to nothing - the reader sees a
     minus that means nothing and has to work out that it means nothing. */
  function deltaText(d, unit) {
    if (!d) return '';
    if (state.logic === 'abs') {
      if (d.pct === 0) return fmt(0, unit);
      var a = d.abs;
      return (a > 0 ? '+' : '−') + fmt(Math.abs(a), unit);
    }
    if (d.pct === 0) return '0.0%';
    return (d.pct > 0 ? '+' : '−') + Math.abs(d.pct).toFixed(1) + '%';
  }

  /* WHICH ROWS THE GRID HAS, in the order they are read: the base first,
     because everything else is measured against it, then the reader's
     choices in the reader's order. */
  function rowIds() {
    var out = [state.base];
    state.against.forEach(function (id) {
      if (id !== state.base && out.indexOf(id) === -1) out.push(id);
    });
    return out;
  }

  /* =======================================================================
     2 - THE LEDGER (screen 1)
     =======================================================================
     Every section, every row and every figure comes out of
     data/projections.js, so the shape of the document lives in one place
     and the markup can never fall out of step with it. */
  function metaLine(target, withCompany) {
    target.innerHTML =
      'Currency: <b>' + MODEL.meta.currency + '</b>' +
      '<span class="cc-meta-sep" aria-hidden="true"></span>Scale: <b>' + MODEL.meta.scale + '</b>' +
      (withCompany ? '<span class="cc-meta-sep" aria-hidden="true"></span>' + MODEL.meta.company : '');
  }

  function drawLedger(caseId) {
    var host = $('cc-ledger');
    host.textContent = '';
    var vals = MODEL.values[caseId] || MODEL.values[MODEL.cases[0].id];

    MODEL.sections.forEach(function (sec) {
      var wrap = el('section', 'cc-section');
      var h = el('h2', 'cc-section-name', 'Section #' + sec.no + ': ' + sec.name);
      wrap.appendChild(h);

      var table = el('table', 'cc-table');
      var thead = el('thead');
      var hr = el('tr');
      hr.appendChild(Object.assign(el('th', 'cc-rowhead', 'Metric'), { scope: 'col' }));
      MODEL.meta.years.forEach(function (y) {
        hr.appendChild(Object.assign(el('th', '', String(y)), { scope: 'col' }));
      });
      thead.appendChild(hr);
      table.appendChild(thead);

      var tbody = el('tbody');
      sec.rows.forEach(function (row) {
        var tr = el('tr', row.rule ? 'cc-rule' : '');
        var th = el('th', 'cc-rowhead' + (row.sub ? ' cc-sub' : ''), row.label);
        th.scope = 'row';
        tr.appendChild(th);
        var series = (vals[sec.id] || {})[row.key] || [];
        MODEL.meta.years.forEach(function (_y, i) {
          var v = series[i];
          var txt = v == null ? '—'
                  : row.format === 'pct'  ? v.toFixed(1) + '%'
                  : row.format === 'x'    ? v.toFixed(2) + 'x'
                  : row.format === 'days' ? v.toFixed(1)
                  : v.toFixed(1);
          tr.appendChild(el('td', row.sub ? 'cc-sub' : '', txt));
        });
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      wrap.appendChild(table);
      host.appendChild(wrap);
    });
  }

  /* =======================================================================
     3 - THE INVENTORY (screen 2)
     ======================================================================= */
  var SAVED = [
    { on: '02-Nov-2026', by: 'Surname, Name', has: [1, 1, 1, 1, 1, 1] },
    { on: '28-Aug-2026', by: 'Surname, Name', has: [1, 1, 1, 0, 0, 0] },
    { on: '28-Aug-2026', by: 'Surname, Name', has: [1, 1, 1, 0, 1, 1] },
    { on: '03-Jun-2026', by: 'Surname, Name', has: [1, 1, 1, 1, 0, 0] },
    { on: '03-Jun-2026', by: 'Surname, Name', has: [1, 1, 1, 0, 1, 0] },
    { on: '12-Oct-2025', by: 'Surname, Name', has: [1, 1, 1, 0, 1, 0] }
  ];
  var COLS = ['Management', 'Credit', 'Downside', 'Consensus', 'Harvest', 'Other'];

  function drawInventory() {
    var body = $('cc-inventory-rows');
    body.textContent = '';
    SAVED.forEach(function (r, i) {
      var tr = el('tr');
      tr.dataset.row = String(i);
      tr.appendChild(el('td', '', r.on));
      tr.appendChild(el('td', '', r.by));
      r.has.forEach(function (yes, c) {
        var td = el('td', c === 0 ? 'cc-divide' : '');
        if (yes) {
          var b = el('button', 'cc-link', COLS[c]);
          b.type = 'button';
          td.appendChild(b);
        } else {
          td.appendChild(el('span', 'cc-link is-off', 'N/A'));
        }
        tr.appendChild(td);
      });
      var view = el('td');
      var vb = el('button', 'cc-link', 'View'); vb.type = 'button';
      view.appendChild(vb);
      tr.appendChild(view);

      var act = el('td', 'cc-divide');
      act.appendChild(kebabFor(r, i));
      tr.appendChild(act);
      body.appendChild(tr);
    });
  }

  /* A KEBAB CARRIES ITS ROW WITH IT, and the row stays marked while the
     menu is open: the menu covers the row it came from, and a reader who
     opens one, reads five options and picks one has otherwise no way of
     being sure which row they were on. */
  function kebabFor(row, i) {
    var wrap = el('span', 'cc-menuwrap');
    var btn = el('button', 'cc-kebab');
    btn.type = 'button';
    btn.innerHTML = ICON.kebab;
    btn.setAttribute('aria-label', 'Actions for the projection saved on ' + row.on);
    btn.setAttribute('aria-haspopup', 'menu');
    btn.setAttribute('aria-expanded', 'false');

    var menu = el('div', 'cc-menu');
    menu.setAttribute('role', 'menu');
    menu.hidden = true;
    menu.innerHTML =
      '<p class="cc-menu-group">Export</p>' +
      '<button type="button" class="cc-menu-item" role="menuitem" data-cc-value="export-projection">Export projection</button>' +
      '<hr class="cc-menu-rule">' +
      '<p class="cc-menu-group">Generate analysis</p>' +
      '<button type="button" class="cc-menu-item" role="menuitem" data-cc-value="case-comparison">Case comparison</button>' +
      '<button type="button" class="cc-menu-item" role="menuitem" data-cc-value="analysis-2">Analysis #2</button>' +
      '<button type="button" class="cc-menu-item" role="menuitem" data-cc-value="analysis-3">Analysis #3</button>';

    wrap.appendChild(btn);
    wrap.appendChild(menu);
    wireMenu(btn, menu, function () { return btn.closest('tr'); });
    return wrap;
  }

  /* =======================================================================
     4 - THE PILL FIELD
     =======================================================================
     A dropdown answers "which one". This answers "which ones", and shows
     the whole answer in the field without being opened. */
  function buildMulti(host, items, chosen, onChange) {
    host.textContent = '';
    var trigger = el('button', 'cc-multi-trigger');
    trigger.type = 'button';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    var tags = el('span', 'cc-multi-tags');
    trigger.appendChild(tags);
    trigger.insertAdjacentHTML('beforeend', ICON.chev);

    var panel = el('div', 'cc-multi-panel');
    panel.setAttribute('role', 'listbox');
    panel.setAttribute('aria-multiselectable', 'true');
    panel.hidden = true;

    var picked = chosen.slice();

    items.forEach(function (it) {
      var b = el('button', 'cc-multi-item');
      b.type = 'button';
      b.setAttribute('role', 'option');
      b.dataset.ccValue = it.id;
      var box = el('span', 'cc-multi-box');
      box.innerHTML = ICON.tick;
      b.appendChild(box);
      b.appendChild(el('span', '', it.name));
      b.addEventListener('click', function () {
        if (b.getAttribute('aria-disabled') === 'true') return;
        var at = picked.indexOf(it.id);
        if (at > -1) picked.splice(at, 1); else picked.push(it.id);
        paint();
        onChange(picked.slice());
      });
      panel.appendChild(b);
    });

    function paint() {
      tags.textContent = '';
      var live = picked.filter(function (id) {
        var b = panel.querySelector('[data-cc-value="' + id + '"]');
        return b && b.getAttribute('aria-disabled') !== 'true';
      });
      if (!live.length) {
        tags.appendChild(el('span', 'cc-multi-empty', host.dataset.ccEmpty || 'Pick at least one'));
      }
      live.forEach(function (id) {
        var item = items.filter(function (x) { return x.id === id; })[0];
        var tag = el('span', 'cc-tag');
        tag.appendChild(el('span', '', item ? item.name : id));
        var x = el('button', 'cc-tag-x');
        x.type = 'button';
        x.innerHTML = ICON.cross;
        x.setAttribute('aria-label', 'Remove ' + (item ? item.name : id));
        x.addEventListener('click', function (e) {
          e.stopPropagation();
          picked = picked.filter(function (p) { return p !== id; });
          paint();
          onChange(picked.slice());
        });
        tag.appendChild(x);
        tags.appendChild(tag);
      });
      [].forEach.call(panel.querySelectorAll('.cc-multi-item'), function (b) {
        b.setAttribute('aria-selected', String(picked.indexOf(b.dataset.ccValue) > -1));
      });
    }

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = !panel.hidden;
      closeAllPanels();
      if (open) return;
      panel.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
    });

    /* ESCAPE CLOSES THE NEAREST THING, NOT THE WHOLE STACK. These lists
       live inside a modal that also listens for Escape; without stopping
       the event here, one press shut the list AND the modal behind it,
       and a reader who opened the wrong dropdown lost everything. */
    host.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || panel.hidden) return;
      e.stopPropagation();
      panel.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      trigger.focus();
    });

    host.appendChild(trigger);
    host.appendChild(panel);
    host._paint = paint;
    host._panel = panel;
    host._trigger = trigger;
    host._set = function (next) { picked = next.slice(); paint(); };
    paint();
  }

  function closeAllPanels() {
    [].forEach.call(document.querySelectorAll('.cc-multi-panel'), function (p) {
      if (p.hidden) return;
      p.hidden = true;
      var t = p.parentElement.querySelector('.cc-multi-trigger');
      if (t) t.setAttribute('aria-expanded', 'false');
    });
  }
  document.addEventListener('click', function (e) {
    if (!e.target.closest || !e.target.closest('.cc-multi')) closeAllPanels();
  });

  /* =======================================================================
     5 - THE SETUP MODAL (screen 3)
     ======================================================================= */
  var scrim = $('cc-scrim');
  var modal = $('cc-setup');
  var cameFrom = null;
  var pending = null;           /* the analysis the menu named, held until Apply */

  function fillSelect(sel, list, value) {
    sel.textContent = '';
    list.forEach(function (o) {
      var opt = el('option', '', o.name);
      opt.value = o.id;
      sel.appendChild(opt);
    });
    sel.value = value;
  }

  function openSetup(from) {
    cameFrom = from || document.activeElement;
    scrim.hidden = false;
    modal.hidden = false;
    $('cc-period').value = String(state.period);
    $('cc-base').value = state.base;
    $('cc-against')._set(state.against);
    $('cc-attrs')._set(state.attrs);
    $('cc-show-deltas').setAttribute('aria-checked', String(state.showDeltas));
    $('cc-delta-logic').value = state.logic;
    lockBaseOut();
    $('cc-period').focus();
  }

  function closeSetup() {
    closeAllPanels();
    modal.hidden = true;
    scrim.hidden = true;
    if (cameFrom && cameFrom.focus) cameFrom.focus();
    cameFrom = null;
  }

  /* A CASE CANNOT BE COMPARED WITH ITSELF - that is a column of zeroes
     pretending to be an answer. Whichever case is the base is greyed out
     of "compare to", and greyed rather than removed: a list that silently
     loses an item as you change something above it is a list the reader
     cannot trust. */
  function lockBaseOut() {
    var panel = $('cc-against')._panel;
    [].forEach.call(panel.querySelectorAll('.cc-multi-item'), function (b) {
      if (b.dataset.ccValue === $('cc-base').value) b.setAttribute('aria-disabled', 'true');
      else b.removeAttribute('aria-disabled');
    });
    $('cc-against')._paint();
  }

  $('cc-base').addEventListener('change', lockBaseOut);
  $('cc-cancel').addEventListener('click', closeSetup);
  scrim.addEventListener('click', closeSetup);
  /* ESCAPE CLOSES THE NEAREST THING, and "nearest" is decided by what is
     OPEN, not by where the focus happens to be. The list has a handler of
     its own for the keyboard case, but a reader who opened a list with
     the mouse may have focus anywhere; asking the page what is open is
     the answer that holds either way.

     Without this, one Escape shut the list AND the modal behind it, and
     everything the reader had set went with it. */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || modal.hidden) return;
    var open = document.querySelector('.cc-multi-panel:not([hidden])');
    if (open) { closeAllPanels(); return; }
    closeSetup();
  });

  /* the box and its words are one button, so there is nothing else to
     wire - see .cc-check in app.css */
  $('cc-show-deltas').addEventListener('click', function () {
    var on = this.getAttribute('aria-checked') === 'true';
    this.setAttribute('aria-checked', String(!on));
  });

  $('cc-apply').addEventListener('click', function () {
    state.period = parseInt($('cc-period').value, 10) || 10;
    state.base = $('cc-base').value;
    state.against = readMulti($('cc-against'));
    state.attrs = readMulti($('cc-attrs'));
    state.showDeltas = $('cc-show-deltas').getAttribute('aria-checked') === 'true';
    state.logic = $('cc-delta-logic').value;
    closeSetup();
    /* FIRST TIME THROUGH it opens the results tab; every time after, the
       tab is already there and it simply runs again, visibly. */
    if (pending) { openResults(pending); pending = null; }
    else run();
  });

  function readMulti(host) {
    return [].slice.call(host._panel.querySelectorAll('.cc-multi-item[aria-selected="true"]'))
      .filter(function (b) { return b.getAttribute('aria-disabled') !== 'true'; })
      .map(function (b) { return b.dataset.ccValue; });
  }

  /* =======================================================================
     6 - THE LOADER AND THE GRID (screens 4 and 5)
     ======================================================================= */
  function openResults(title) {
    var tab = $('cc-tab-results');
    if (!tab) {
      tab = el('div', 'cc-tab cc-tab--closable');
      tab.id = 'cc-tab-results';
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', 'false');
      tab.setAttribute('aria-controls', 'cc-pane-results');
      tab.tabIndex = -1;
      tab.appendChild(el('span', '', title));
      var x = el('button', 'cc-tabclose');
      x.type = 'button';
      x.innerHTML = ICON.cross;
      x.setAttribute('aria-label', 'Close ' + title);
      x.addEventListener('click', function (e) {
        e.stopPropagation();
        tab.remove();
        $('cc-pane-results').hidden = true;
        selectTab($('cc-tab-latest'));
      });
      tab.appendChild(x);
      $('cc-tabs').appendChild(tab);
    } else {
      tab.firstChild.textContent = title;
    }
    selectTab(tab);
    run();
  }

  function run() {
    $('cc-result').hidden = true;
    $('cc-legend').hidden = true;
    $('cc-loading').hidden = false;
    window.setTimeout(function () {
      drawGrid();
      $('cc-loading').hidden = true;
      $('cc-result').hidden = false;
      /* THE KEY ONLY APPEARS WHEN THERE IS SOMETHING TO KEY. With the
         deltas switched off there is no colour on the page, and a legend
         for colours nobody can see is furniture. */
      $('cc-legend').hidden = !state.showDeltas;
    }, 1400);
  }

  /* THE GRID IS ONE TABLE GROUPED BY ATTRIBUTE, as page 5 draws it: the
     attribute is a heading you can fold away, and the cases are its rows.
     The older version put the attributes in a tab strip, which made the
     reader choose one at a time; this way the whole comparison is one
     document and a reader can shut the parts they are not reading. */
  function drawGrid() {
    var head = $('cc-grid-head');
    var body = $('cc-grid-body');
    var ys = years();

    head.textContent = '';
    head.appendChild(Object.assign(el('th', 'cc-rowhead', 'Cases'), { scope: 'col' }));
    ys.forEach(function (y) {
      head.appendChild(Object.assign(el('th', '', String(y)), { scope: 'col' }));
    });

    body.textContent = '';
    var shown = ATTRS.filter(function (a) { return state.attrs.indexOf(a.id) > -1; });
    if (!shown.length) shown = [ATTRS[0]];

    shown.forEach(function (a) {
      if (state.openGroups[a.id] === undefined) state.openGroups[a.id] = true;
      var open = state.openGroups[a.id];

      var gr = el('tr', 'cc-group-row');
      var gh = el('th', 'cc-rowhead');
      gh.scope = 'colgroup';
      gh.colSpan = ys.length + 1;
      var tgl = el('button', 'cc-group-toggle');
      tgl.type = 'button';
      tgl.setAttribute('aria-expanded', String(open));
      tgl.innerHTML = ICON.chev;
      tgl.appendChild(el('span', '', a.name));
      tgl.addEventListener('click', function () {
        state.openGroups[a.id] = !state.openGroups[a.id];
        drawGrid();
      });
      gh.appendChild(tgl);
      gr.appendChild(gh);
      body.appendChild(gr);
      if (!open) return;

      rowIds().forEach(function (id) {
        var isBase = id === state.base;
        var tr = el('tr');
        var th = el('th', 'cc-rowhead', NAME_OF[id] + (isBase ? ' (base)' : ''));
        th.scope = 'row';
        tr.appendChild(th);

        var series = seriesOf(id, a.id);
        ys.forEach(function (_y, i) {
          /* THE BASE ROW HAS NO DELTA, because it is what the others are
             measured against; a column of +0.0% down the middle of the
             table is noise pretending to be information. */
          var d = isBase ? null : deltaOf(id, a.id, i);
          var td = el('td');
          td.appendChild(el('span', 'cc-val', fmt(series[i], a.unit)));
          if (d && state.showDeltas) {
            /* EVERY DELTA IS COLOURED, and a flat zero is coloured by
               neither: it has no direction to have, so it keeps the quiet
               grey the rest of the row is written in. */
            var good = d.pct === 0 ? '' : ((d.pct > 0) === a.upIsGood ? ' cc-delta--good' : ' cc-delta--bad');
            td.appendChild(el('span', 'cc-delta' + good, deltaText(d, a.unit)));
          }
          tr.appendChild(td);
        });
        body.appendChild(tr);
      });
    });
  }

  /* =======================================================================
     7 - THE TABS
     =======================================================================
     THE LIST IS READ FRESH EVERY TIME rather than captured once, because a
     tab can appear and disappear while the page is open. */
  var tablist = $('cc-tabs');

  function allTabs() { return [].slice.call(tablist.querySelectorAll('[role="tab"]')); }

  function selectTab(tab) {
    allTabs().forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      var pane = document.getElementById(t.getAttribute('aria-controls'));
      if (pane) pane.hidden = !on;
    });
  }

  tablist.addEventListener('click', function (e) {
    if (e.target.closest('.cc-tabclose')) return;
    var tab = e.target.closest('[role="tab"]');
    if (tab) selectTab(tab);
  });

  tablist.addEventListener('keydown', function (e) {
    var tabs = allTabs();
    var i = tabs.indexOf(e.target.closest('[role="tab"]'));
    if (i < 0) return;
    var to = null;
    if (e.key === 'ArrowRight') to = tabs[(i + 1) % tabs.length];
    if (e.key === 'ArrowLeft')  to = tabs[(i - 1 + tabs.length) % tabs.length];
    if (e.key === 'Home')       to = tabs[0];
    if (e.key === 'End')        to = tabs[tabs.length - 1];
    if ((e.key === 'Enter' || e.key === ' ') && e.target.getAttribute('role') === 'tab') {
      e.preventDefault(); selectTab(e.target); return;
    }
    if (!to) return;
    e.preventDefault();
    selectTab(to);
    to.focus();
  });

  /* =======================================================================
     8 - THE ACTIONS MENU
     =======================================================================
     EXPORT IS DRAWN AND DOES NOTHING, on purpose and by instruction: the
     reader can see that exporting is part of the picture without the
     prototype pretending to have designed it. */
  var openMenu = null;

  function closeMenu() {
    if (!openMenu) return;
    openMenu.btn.setAttribute('aria-expanded', 'false');
    openMenu.menu.hidden = true;
    if (openMenu.row) openMenu.row.classList.remove('is-menued');
    openMenu = null;
  }

  document.addEventListener('click', function (e) {
    if (openMenu && !e.target.closest('.cc-menuwrap')) closeMenu();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && openMenu) { var b = openMenu.btn; closeMenu(); b.focus(); }
  });

  function wireMenu(btn, menu, rowOf) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var wasOpen = openMenu && openMenu.btn === btn;
      closeMenu();
      if (wasOpen) return;
      menu.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
      var row = rowOf ? rowOf() : null;
      if (row) row.classList.add('is-menued');
      openMenu = { btn: btn, menu: menu, row: row };
      menu.dispatchEvent(new CustomEvent('cc:menu-open', { bubbles: true }));
    });

    menu.addEventListener('click', function (e) {
      var item = e.target.closest('.cc-menu-item');
      if (!item) return;
      var v = item.dataset.ccValue;
      closeMenu();
      btn.focus();
      if (CAN_COMPARE &&
          (v === 'case-comparison' || v === 'analysis-2' || v === 'analysis-3')) {
        pending = v === 'case-comparison' ? 'Case comparison results'
                : v === 'analysis-2' ? 'Analysis #2 results' : 'Analysis #3 results';
        openSetup(btn);
      }
      /* every export item lands here and stops, which is the honest
         behaviour for an action that has not been designed yet */
    });
  }

  wireMenu($('cc-actions-btn'), $('cc-actions-menu'), null);

  $('cc-adjust').addEventListener('click', function () {
    if (CAN_COMPARE) openSetup(this);
  });
  $('cc-export').addEventListener('click', function () { /* drawn, not wired */ });

  /* =======================================================================
     9 - THE NUDGE
     =======================================================================
     Two steps: open Actions, then choose Case comparison. The second step
     cannot exist until the first has happened, because the item it points
     at is inside a panel that is not on screen yet - so the menu says when
     it opens and the tour follows it.

     IT ENDS THE MOMENT THEY PICK THE THING, and never comes back. A nudge
     that reappears after you have done what it asked is not help, it is
     nagging. */
  var coach = { at: 0, done: CAN_COMPARE ? false : true };

  function paintCoach() {
    var on1 = !coach.done && coach.at === 0;
    var on2 = !coach.done && coach.at === 1;
    $('cc-coach-1').hidden = !on1;
    $('cc-coach-2').hidden = !on2;
    $('cc-actions-btn').classList.toggle('is-coached', on1);
    $('cc-cmp-item').classList.toggle('is-coached', on2);
    if (on2) aimAtItem();
  }

  /* PUT THE POINT ON THE ITEM. The bubble lives in the menu rather than in
     the item - a <button> cannot hold one - so it has to be told where
     down the menu its target is. Both numbers are the layout's own
     unscaled pixels, so this holds at any scale of the canvas. */
  function aimAtItem() {
    var item = $('cc-cmp-item');
    var tip = $('cc-coach-2');
    var mid = item.offsetTop + item.offsetHeight / 2;
    tip.style.setProperty('--cc-at', (mid - tip.offsetHeight / 2) + 'px');
  }

  function endCoach() { coach.done = true; paintCoach(); }

  $('cc-actions-menu').addEventListener('cc:menu-open', function () {
    if (!coach.done) { coach.at = 1; paintCoach(); }
  });
  $('cc-actions-btn').addEventListener('click', function () {
    window.setTimeout(function () {
      if (coach.done) return;
      coach.at = $('cc-actions-menu').hidden ? 0 : 1;
      paintCoach();
    }, 0);
  });
  /* CHOOSING THE THING IS THE ONLY WAY OUT now that Skip has gone. That is
     fine while the tour is two steps long and the second step is already
     on the item it is asking for; a longer one would need a way to leave. */
  $('cc-cmp-item').addEventListener('click', endCoach);

  /* =======================================================================
     10 - LIGHT / DARK
     =======================================================================
     The whole theme turns on ONE attribute on <body>: every colour on the
     page is a token whose value is swapped by `[data-mode="dark"]`.
     Nothing here knows any colour. */
  /* GUARDED, BECAUSE THIS SCREEN NOW LIVES IN TWO PLACES. In its own
     prototype it owns the app bar and this button is always there. Inside
     the client dashboard the bar belongs to the dashboard, which has its
     own switch - so here there is nothing to wire, and one unguarded line
     reaching for a button that is not on the page would stop every line
     after it from running. */
  var modeBtn = $('cc-mode');
  if (modeBtn) {
    modeBtn.setAttribute('aria-pressed', 'false');
    modeBtn.addEventListener('click', function () {
      var dark = document.body.getAttribute('data-mode') === 'dark';
      document.body.setAttribute('data-mode', dark ? 'light' : 'dark');
      modeBtn.setAttribute('aria-pressed', dark ? 'false' : 'true');
    });
  }

  /* =======================================================================
     11 - THE CLIENT LOADER
     =======================================================================
     It is numbered last and drawn first: the band sits above the tabs and
     names the subject of every screen below it. Everything it knows comes
     out of data/clients.js.

     WHAT IT DOES
     ------------
     - the band opens a panel that overlays the page, so nothing below moves
     - the search filters both levels live, as you type
     - a FAMILY is selectable as well as a subsidiary: picking one loads the
       family, consolidated, and the caption line under the name goes away
       because the big line already is the family
     - picking anyone shows the module reloading, briefly. The figures that
       come back are the same ones: this prototype has one set of numbers,
       and inventing a dozen more would be inventing them. What is being
       prototyped here is the ACT of loading a client. */
  var CLIENTS = window.CC_CLIENTS;

  if (CLIENTS) {
    var clientHead  = $('cc-client-head');
    var clientPanel = $('cc-client-panel');
    var clientList  = $('cc-client-list');
    var clientNone  = $('cc-client-none');
    var clientFind  = $('cc-client-search-input');
    var veil        = $('cc-veil');

    /* EVERY NODE, FLAT, AND ITS FAMILY WITH IT. The list is drawn from the
       tree; everything else only ever has an id in its hand, so one lookup
       saves every other piece of this section from walking the tree. */
    var ENTRY = {};
    CLIENTS.families.forEach(function (f) {
      ENTRY[f.id] = { node: f, family: null };
      (f.children || []).forEach(function (c) {
        ENTRY[c.id] = { node: c, family: f };
      });
    });

    var loaded = ENTRY[CLIENTS.loaded] ? CLIENTS.loaded : CLIENTS.families[0].id;

    function pillsInto(host, labels) {
      host.textContent = '';
      labels.forEach(function (t) { host.appendChild(el('span', 'cc-pill', t)); });
    }

    function paintHead() {
      var e = ENTRY[loaded];
      $('cc-client-name').textContent = e.node.name;
      $('cc-client-family').textContent = e.family ? e.family.name : '';
      pillsInto($('cc-client-pills'),
                e.node.pills.concat(e.node.review ? [e.node.review] : []));
    }

    function hits(name, q) { return name.toLowerCase().indexOf(q) >= 0; }

    function rowFor(node, level) {
      var b = el('button', 'cc-client-row');
      b.type = 'button';
      b.dataset.ccLevel = level;
      if (node.id === loaded) b.setAttribute('aria-current', 'true');

      var dot = el('span', 'cc-avatar');
      dot.setAttribute('aria-hidden', 'true');
      b.appendChild(dot);
      b.appendChild(el('span', 'cc-client-row-name', node.name));

      var pills = el('span', 'cc-pills');
      pillsInto(pills, node.pills);
      b.appendChild(pills);

      b.addEventListener('click', function () { load(node.id); });
      return b;
    }

    /* A FAMILY THAT MATCHES BRINGS ITS WHOLE FAMILY WITH IT, and a
       subsidiary that matches brings its family's NAME with it - because a
       row reading "Subsidiary one" on its own, with three others like it in
       the book, does not say which one it is. */
    function drawList(query) {
      var q = (query || '').trim().toLowerCase();
      clientList.textContent = '';
      var shown = 0;

      CLIENTS.families.forEach(function (f) {
        var famHit = !q || hits(f.name, q);
        var kids = (f.children || []).filter(function (c) {
          return famHit || hits(c.name, q);
        });
        if (!famHit && !kids.length) return;

        var group = el('div', 'cc-client-group');
        group.appendChild(rowFor(f, 'family'));
        kids.forEach(function (c) { group.appendChild(rowFor(c, 'child')); });
        clientList.appendChild(group);
        shown += 1;
      });

      clientList.hidden = shown === 0;
      clientNone.hidden = shown > 0;
    }

    /* THE NUDGE STANDS DOWN while this component has the floor, and comes
       back when it gives it up. Both the open panel and the reload use it. */
    function quietNudge(on) { $('cc-card').classList.toggle('is-clientactive', on); }

    function openClients() {
      clientPanel.hidden = false;
      quietNudge(true);
      clientHead.setAttribute('aria-expanded', 'true');
      clientHead.setAttribute('data-salt-surface', 'accented');
      clientFind.value = '';
      drawList('');
      clientFind.focus();
    }

    function closeClients(giveFocusBack) {
      if (clientPanel.hidden) return;
      clientPanel.hidden = true;
      quietNudge(false);
      clientHead.setAttribute('aria-expanded', 'false');
      clientHead.removeAttribute('data-salt-surface');
      if (giveFocusBack) clientHead.focus();
    }

    /* =====================================================================
       THE WARNING, AND WHY IT SITS HERE
       =====================================================================
       A comparison belongs to the client it was run for. Loading someone
       else makes it meaningless, so it has to go - and taking something away
       without saying so first is the one thing a prototype must not teach.

       It asks at the CHEVRON, before the panel opens, because that is the
       last moment the reader has not yet committed to anything. Asking after
       they have picked a client means asking them to undo a choice they have
       already made in their head.

       It only asks when there is something to lose: with no results tab open
       the chevron just opens the panel. */
    var ask      = $('cc-ask');
    var askScrim = $('cc-ask-scrim');
    var askedBy  = null;

    function openAsk(from) {
      askedBy = from || clientHead;
      askScrim.hidden = false;
      ask.hidden = false;
      /* CANCEL TAKES THE FOCUS, not Proceed. The safe answer is the one a
         stray Enter should give. */
      $('cc-ask-no').focus();
    }

    function closeAsk(goAhead) {
      ask.hidden = true;
      askScrim.hidden = true;
      var back = askedBy;
      askedBy = null;
      if (goAhead) { openClients(); return; }
      if (back && back.focus) back.focus();
    }

    $('cc-ask-yes').addEventListener('click', function () { closeAsk(true); });
    $('cc-ask-no').addEventListener('click', function () { closeAsk(false); });

    /* THE RESULTS GO WHEN THE CLIENT CHANGES, not when the question is
       answered. Opening the panel and shutting it again without picking
       anybody has changed nothing, so nothing should be taken away. */
    function dropResults() {
      var tab = $('cc-tab-results');
      if (!tab) return;
      tab.remove();
      $('cc-pane-results').hidden = true;
      $('cc-result').hidden = true;
      $('cc-legend').hidden = true;
      selectTab($('cc-tab-latest'));
    }

    clientHead.addEventListener('click', function (e) {
      e.stopPropagation();
      if (!clientPanel.hidden) { closeClients(true); return; }
      if ($('cc-tab-results')) { openAsk(clientHead); return; }
      openClients();
    });

    clientFind.addEventListener('input', function () { drawList(this.value); });

    /* THE HEADER CHANGES FIRST, THEN THE WAIT. Doing it the other way round
       - wait, then change - leaves the reader looking at a spinner under the
       name of the client they just left. */
    function load(id) {
      if (!ENTRY[id]) return;
      loaded = id;
      paintHead();
      dropResults();
      closeClients(true);

      $('cc-veil-says').textContent = 'Loading ' + ENTRY[id].node.name;
      veil.hidden = false;
      quietNudge(true);
      window.setTimeout(function () { veil.hidden = true; quietNudge(false); }, 900);
    }

    /* A CLICK ANYWHERE ELSE SHUTS IT, which is what a reader expects of a
       thing that is covering the page. */
    document.addEventListener('click', function (e) {
      if (!ask.hidden) return;        /* the dialog is answered, not dodged */
      if (!e.target.closest) return;
      /* A DIALOG COUNTS AS INSIDE. Proceed opens the panel, and that same
         click then carries on up to here - without this line it would shut
         the panel again in the same breath, and the button would look
         broken. */
      if (!e.target.closest('.cc-client, .cc-modal')) closeClients(false);
    });

    /* ESCAPE CLOSES THE NEAREST OPEN LAYER, and the nearest layer is decided
       by WHAT IS OPEN, not by where the focus happens to be. A menu or the
       setup modal is above this panel, so either of those gets the key
       first and this one stays put. */
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      /* THE QUESTION IS THE TOPMOST LAYER while it is up, and Escape is the
         safe answer to it - the same answer Cancel gives. */
      if (!ask.hidden) { closeAsk(false); return; }
      if (openMenu || !modal.hidden) return;
      closeClients(true);
    });

    paintHead();
    drawList('');
  }

  /* =======================================================================
     START
     ======================================================================= */
  /* THE REFERENCE SHOWS CURRENCY AND SCALE AND NOTHING ELSE on both
     toolbars. The company name was in the older prototype; it is out
     here because the sheet does not draw it. */
  metaLine($('cc-latest-meta'), false);
  metaLine($('cc-results-meta'), false);

  fillSelect($('cc-case'), MODEL.cases, 'credit');
  $('cc-case').addEventListener('change', function () { drawLedger(this.value); });
  drawLedger('credit');

  drawInventory();

  fillSelect($('cc-base'), CASES.filter(function (c) { return !c.derived; }), state.base);
  $('cc-against').dataset.ccEmpty = 'Pick at least one case';
  $('cc-attrs').dataset.ccEmpty = 'Pick at least one attribute';
  buildMulti($('cc-against'), PILL_CASES, state.against, function () {});
  buildMulti($('cc-attrs'), ATTRS, state.attrs, function () {});

  selectTab($('cc-tab-latest'));
  paintCoach();
})();
