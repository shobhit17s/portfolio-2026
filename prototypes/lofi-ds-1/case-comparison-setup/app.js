/* app.js — the case comparison flow.

   THE FLOW, which is what this prototype exists to show:

     1  Latest projection, a case chosen in the picker
     2  Actions -> Generate analysis -> Case comparison
     3  a RESULTS TAB APPEARS and selects itself, showing a loader
     4  the result arrives, in whichever of three lenses you choose
     5  Adjust parameters -> Apply -> it runs again
     6  Export -> a preview -> download

   Step 3 is the one worth building a prototype for. "Where does the answer
   GO?" is the question a static mock cannot answer, and the answer here -
   a third tab that appears, is selected, and can be closed - is a real
   design decision that a reader can now argue with. */
(function () {
  'use strict';

  var YEARS = ['2026','2027','2028','2029','2030','2031','2032','2033','2034','2035'];

  /* Deltas against the base case, per attribute, per case. Invented, but
     shaped so the washes have something to say. */
  /* THE SIXTH ROW. The sheet of 3 November adds `Custom case` under the
     five real ones - the case the reader builds in the Setup parameters
     modal. It is the only invented row in the table, and it is invented
     on purpose: nothing in the projection model can know what somebody is
     about to ask for. */
  var CUSTOM = {
    revenue:  [1.4, 2.9, 4.6, 6.1, 7.4, 8.2, 8.6, 8.9, 9.1, 9.4],
    ebitda:   [2.0, 4.1, 6.5, 8.8, 10.9, 12.2, 12.9, 13.4, 13.8, 14.2],
    leverage: [-1.8, -3.6, -5.7, -7.6, -9.3, -10.4, -11.0, -11.4, -11.7, -12.0],
    cashflow: [3.1, 5.9, 8.4, 10.6, 12.4, 13.5, 14.1, 14.5, 14.8, 15.1]
  };

  var DATA = {
    revenue:  { rising: 'good', cases: {
      'Credit case (base)': [0,0,0,0,0,0,0,0,0,0],
      'Management case':    [2.1,3.4,5.0,7.2,9.8,11.4,12.9,13.6,14.2,15.1],
      'Downside case':      [-3.2,-5.8,-9.1,-12.4,-15.9,-17.2,-16.4,-14.1,-11.8,-9.2],
      'Harvest case':       [1.1,1.4,1.2,0.8,0.3,-0.4,-1.2,-2.1,-3.0,-3.8],
      'Consensus case':     [0.8,1.9,3.1,4.4,5.8,6.6,7.1,7.4,7.8,8.1],
      'Custom case':        CUSTOM['revenue'] } },
    ebitda:   { rising: 'good', cases: {
      'Credit case (base)': [0,0,0,0,0,0,0,0,0,0],
      'Management case':    [3.0,5.1,8.4,11.9,15.4,18.1,19.8,20.6,21.2,22.0],
      'Downside case':      [-5.1,-9.4,-14.2,-19.8,-24.1,-25.6,-23.9,-20.2,-16.4,-12.8],
      'Harvest case':       [0.4,0.1,-0.8,-2.0,-3.6,-5.1,-6.8,-8.2,-9.6,-10.9],
      'Consensus case':     [1.2,2.4,3.9,5.1,6.2,6.9,7.3,7.6,7.9,8.2],
      'Custom case':        CUSTOM['ebitda'] } },
    /* LEVERAGE AND CASH FLOW ARE NOT INVENTED. They are measured off the
       projection grid in data/projections.js - gross leverage under each
       case against gross leverage under the credit case, year by year, and
       the same for free cash flow. So when this screen says downside runs
       34% more levered in 2031, that is exactly the gap a reader will find
       if they switch the Latest Projection picker and look. */
    leverage: { rising: 'bad', cases: {
      'Credit case (base)': [0,0,0,0,0,0,0,0,0,0],
      'Management case':    [-2.9,-4.9,-7.8,-10.6,-13.3,-15.3,-16.6,-17.1,-17.5,-18.0],
      'Downside case':      [5.4,10.4,16.6,24.7,31.7,34.3,31.5,25.3,19.7,14.7],
      'Harvest case':       [-0.4,-0.1,0.8,2.0,3.7,5.4,7.3,8.9,10.6,12.2],
      'Consensus case':     [-1.2,-2.3,-3.8,-4.8,-5.8,-6.4,-6.8,-7.1,-7.3,-7.6],
      'Custom case':        CUSTOM['leverage'] } },
    cashflow: { rising: 'good', cases: {
      'Credit case (base)': [0,0,0,0,0,0,0,0,0,0],
      'Management case':    [5.7,3.5,9.4,12.7,16.1,23.5,25.1,27.9,27.9,27.1],
      'Downside case':      [-10.0,-5.8,-12.3,-22.2,-27.0,-35.9,-38.6,-36.3,-29.4,-24.4],
      'Harvest case':       [0.2,-1.9,-2.4,-3.9,-6.5,-8.0,-10.2,-11.5,-13.1,-14.9],
      'Consensus case':     [2.3,-0.6,1.4,2.6,3.5,6.4,7.6,8.4,8.1,8.6],
      'Custom case':        CUSTOM['cashflow'] } }
  };

  var SHAPES = {
    'Credit case (base)': { colour: 'sun',    v: [.62,.52,.42,.36,.40,.50,.57,.58,.62,.70] },
    'Management case':    { colour: 'forest', v: [.80,.74,.68,.66,.69,.70,.66,.62,.72,.88] },
    'Downside case':      { colour: 'fire',   v: [.58,.48,.40,.38,.36,.30,.22,.20,.30,.48] }
  };

  var state = { attribute: 'revenue', threshold: 10, base: 'credit',
                against: ['management','downside','consensus'],
                attrs: ['revenue','ebitda','leverage','cashflow'], scrub: 6, from: null };

  var $ = function (id) { return document.getElementById(id); };
  var cameFrom = null;          /* the tab the analysis was started from */

  /* ------------------------------------------------------------------
     THE SECOND WAY IN : the projection inventory
     ------------------------------------------------------------------

     The same destination reached from somewhere else. A reader who came
     from a saved projection in a list has a different question in their
     head from one who came from the projection they were just looking at -
     so the results have to say WHICH projection they came from, or the
     second reader cannot tell.

     That is the whole reason this entry point is worth building rather
     than describing: it is the thing that turns "generate an analysis"
     into "generate an analysis OF something". */
  var CASES = ['Management', 'Credit', 'Downside', 'Consensus', 'Harvest', 'Other'];
  var SAVED = [
    { on: '02-Nov-2026', by: 'Surname, Name', has: [1,1,1,1,1,1] },
    { on: '28-Aug-2026', by: 'Surname, Name', has: [1,1,1,0,0,0] },
    { on: '28-Aug-2026', by: 'Surname, Name', has: [1,1,1,0,1,1] },
    { on: '03-Jun-2026', by: 'Surname, Name', has: [1,1,1,1,0,0] },
    { on: '03-Jun-2026', by: 'Surname, Name', has: [1,1,1,0,1,0] },
    { on: '12-Oct-2025', by: 'Surname, Name', has: [1,1,1,0,1,0] }
  ];

  /* ---------- THE FIGURE IN A CELL ----------

     The five real cases read their figure straight out of the projection
     model in data/projections.js, so the number in the comparison IS the
     number in the Latest Projection tab three clicks away. Two screens in
     one prototype quietly disagreeing about the same company is the kind
     of thing a reader notices and cannot unnotice.

     CUSTOM CASE IS THE EXCEPTION, and it has to be: it is whatever the
     reader just built in the Setup parameters modal, so by definition the
     model has never heard of it. It is derived from the base by its own
     delta, which keeps it internally consistent with the row it sits in
     even though it is invented. */
  var ATTR_ROW = { revenue: ['financial-summary', 'revenue'],
                   ebitda:  ['financial-summary', 'ebitda'],
                   leverage:['debt-leverage', 'gross-leverage'],
                   cashflow:['cash-flow', 'fcf'] };
  var CASE_ID = { 'Credit case (base)': 'credit', 'Management case': 'management',
                  'Downside case': 'downside', 'Harvest case': 'harvest',
                  'Consensus case': 'consensus' };

  function isBase(name) { return /\(base\)/.test(name); }

  function figure(set, name, i) {
    var M = (window.LOFI_DATA && window.LOFI_DATA.projection) || null;
    var row = ATTR_ROW[state.attribute];
    var id = CASE_ID[name];
    var unit = state.attribute === 'leverage' ? 'x' : '';
    if (M && row && id && M.values[id]) {
      var v = M.values[id][row[0]][row[1]][i];
      if (v != null) return unit ? v.toFixed(2) + 'x' : v.toFixed(1);
    }
    /* Custom case, or anything the model has no row for: build it off the
       base figure and this row's own delta */
    var baseName = Object.keys(set.cases).filter(isBase)[0];
    var bid = CASE_ID[baseName];
    if (M && row && bid && M.values[bid]) {
      var b = M.values[bid][row[0]][row[1]][i];
      if (b != null) {
        var out = b * (1 + (set.cases[name][i] || 0) / 100);
        return unit ? out.toFixed(2) + 'x' : out.toFixed(1);
      }
    }
    return '\u2014';
  }

  function drawInventory() {
    document.getElementById('cc-inventory-rows').innerHTML = SAVED.map(function (r, i) {
      return '<tr data-row="' + i + '">' +
        '<td>' + r.on + '</td>' +
        '<td class="lofi-rowhead">' + r.by + '</td>' +
        r.has.map(function (yes, c) {
          return '<td class="' + (c === 0 ? 'lofi-divide' : '') + '">' +
            (yes ? '<button type="button" class="lofi-link">' + CASES[c] + '</button>'
                 : '<span class="lofi-link is-off">N/A</span>') + '</td>';
        }).join('') +
        '<td><button type="button" class="lofi-link">View</button></td>' +
        '<td class="lofi-table-actions">' +
          '<span class="lofi-menu" data-lofi-menu>' +
            '<button type="button" class="lofi-btn lofi-btn--icon lofi-menu-trigger" ' +
              'aria-label="Actions for the projection saved on ' + r.on + '" ' +
              'data-lofi-icon="kebab"></button>' +
            '<div class="lofi-menu-panel" role="menu" hidden>' +
              '<p class="lofi-menu-group">Export</p>' +
              '<button type="button" class="lofi-menu-item" role="menuitem" data-lofi-value="export-projection">Export projection</button>' +
              '<hr class="lofi-menu-divide">' +
              '<p class="lofi-menu-group">Generate analysis</p>' +
              '<button type="button" class="lofi-menu-item" role="menuitem" data-lofi-value="case-comparison">Case comparison</button>' +
              '<button type="button" class="lofi-menu-item" role="menuitem" data-lofi-value="analysis-2">Analysis #2</button>' +
              '<button type="button" class="lofi-menu-item" role="menuitem" data-lofi-value="analysis-3">Analysis #3</button>' +
            '</div>' +
          '</span>' +
        '</td></tr>';
    }).join('');
    LOFI.start(document.getElementById('cc-view-inventory'));
  }

  /* THE ROW A MENU BELONGS TO IS MARKED while the menu is open, and stays
     marked afterwards. Without it, a reader who opens a kebab, reads six
     options and picks one has no way of being sure which row they were on
     - the menu covers the row it came from.

     LISTENED FOR IN THE CAPTURE PHASE, which is the whole point of this
     comment. A menu trigger stops its own click from bubbling, so that a
     press on it is not also read as a press on the page (which is what
     closes any other open menu). Perfectly correct, and it means an
     ordinary listener on the row NEVER HEARS the press at all. Capture
     runs on the way DOWN, before anything can stop it. */
  function markRow(el) {
    var tr = el && el.closest && el.closest('tr[data-row]');
    if (!tr) return;
    var table = document.getElementById('cc-inventory');
    [].forEach.call(table.querySelectorAll('tr.is-active'), function (r) {
      r.classList.remove('is-active');
    });
    tr.classList.add('is-active');
    state.from = SAVED[+tr.dataset.row];
  }

  document.getElementById('cc-inventory')
    .addEventListener('click', function (e) { markRow(e.target); }, true);

  /* ------------------------------------------------------------------
     STEP 2 -> 3 : the results tab appears
     ------------------------------------------------------------------ */
  function openResults(title) {
    /* REMEMBER WHERE THEY LAUNCHED FROM. The kit's own rule when a tab
       closes is "show the one to its left", which is what a browser does
       and is right in general. It is wrong here: the results tab is always
       last, so the left neighbour is always Projection inventory - even
       for a reader who started on Latest projection and has never opened
       the inventory in their life. Closing should put them back where they
       were, not somewhere they have never been. */
    var open = document.querySelector('#cc-tabs .lofi-tab[aria-selected="true"]');
    if (open && open.id !== 'cc-results-tab') cameFrom = open;

    var tabs = $('cc-tabs');
    var tab = $('cc-results-tab');

    /* WHERE IT CAME FROM, said on the tab itself. Two entry points, one
       destination - so the destination has to carry its own provenance. */
    if (state.from) title += ' \u00b7 ' + state.from.on;

    if (!tab) {
      tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'lofi-tab';
      tab.id = 'cc-results-tab';
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', 'cc-view-results');
      tab.setAttribute('aria-selected', 'false');
      tab.innerHTML = title +
        ' <span class="lofi-tab-close" role="button" tabindex="0" aria-label="Close this analysis">✕</span>';
      tabs.appendChild(tab);
    } else {
      tab.firstChild.textContent = title + ' ';
      /* THE ROW IS ALREADY WIRED, and its listener is on the row rather
         than on each tab - so a tab added later works with no re-wiring.
         That is the whole reason the kit listens on the row. */
    }
    LOFI.showTab(tab);
    run();
  }

  /* CLOSING THE TAB puts the reader back on the projection they came
     from. The kit announces the press and leaves the meaning to us. */
  document.addEventListener('lofi:tab-close', function (e) {
    var tab = e.detail.tab;
    if (!tab || tab.id !== 'cc-results-tab') return;
    /* LOFI.closeTab, NOT tab.remove(). Removing the tab leaves its pane on
       the page, showing, underneath whichever tab is open - see the note
       in lofi-tabs.js. closeTab puts the pane away first. */
    LOFI.closeTab(tab);
    if (cameFrom && cameFrom.isConnected) LOFI.showTab(cameFrom);
    cameFrom = null;
    state.from = null;
  });

  /* ------------------------------------------------------------------
     STEP 3 -> 4 : the loader, then the answer
     ------------------------------------------------------------------ */
  var timer = null;
  function run() {
    $('cc-loading').hidden = false;
    $('cc-result').hidden = true;
    $('cc-result-controls').hidden = true;
    clearTimeout(timer);
    timer = setTimeout(function () {
      $('cc-loading').hidden = true;
      $('cc-result').hidden = false;
      $('cc-result-controls').hidden = false;
      draw();
    }, 1400);
  }

  /* ------------------------------------------------------------------
     THE THREE LENSES
     ------------------------------------------------------------------ */
  function draw() { drawTable(); drawTrend(); drawInsights(); }

  function drawTable() {
    var set = DATA[state.attribute];
    var head = $('cc-table-head');
    var body = $('cc-table-body');
    var table = $('cc-table');
    table.dataset.lofiThreshold = state.threshold;

    head.innerHTML = '<th class="lofi-rowhead lofi-label">Cases</th>' +
      YEARS.map(function (y, i) {
        return '<th class="' + (i === 0 ? 'lofi-divide' : '') + '">' + y + '</th>';
      }).join('');

    /* EVERY CELL CARRIES THE FIGURE AND THE GAP, as the sheet of
       3 November draws it: the value on top, the delta against the base
       under it. The old cell showed the delta alone, which answers "how
       different" but never "different from what" - and a reader looking
       at -22.8% with no number beside it cannot tell a rounding wobble
       on a small figure from a hole in a large one.

       THE BASE ROW HAS NO DELTA, because it is what the others are
       measured against; a row of +0.0% down the middle of the table is
       noise pretending to be information. */
    body.innerHTML = Object.keys(set.cases).map(function (name) {
      var vals = set.cases[name];
      var base = isBase(name);
      var invert = set.rising === 'bad' ? ' data-lofi-invert' : '';
      return '<tr><td class="lofi-rowhead"' + invert + '>' + name + '</td>' +
        vals.map(function (v, i) {
          var fig = figure(set, name, i);
          var txt = (v > 0 ? '+' : '') + v.toFixed(1) + '%';
          var said = name + ', ' + YEARS[i] + ': ' + fig +
                     (base ? '' : ' (' + txt + ' against the base)');
          return '<td class="' + (i === 0 ? 'lofi-divide ' : '') + 'is-clickable" ' +
                 (base ? '' : 'data-lofi-delta="' + v + '" ') +
                 'data-lofi-value="' + said + '">' +
                 '<span class="cc-fig">' + fig + '</span>' +
                 (base ? '' : '<span class="cc-delta">' + txt + '</span>') +
                 '</td>';
        }).join('') + '</tr>';
    }).join('');

    LOFI.initTables($('cc-lens-table'));
  }

  /* THE SERIES THE CHART DRAWS, built once here rather than at each of
     the two places that need them - `drawTrend` when the lens opens, and
     the scrub handler when the marker moves. Two copies of this drifted
     apart the first time, which is how the chart ended up reading `set`
     from a scope that had never heard of it. */
  function chartSeries() {
    var set = DATA[state.attribute];
    return Object.keys(SHAPES).map(function (n) {
      return { name: n, colour: SHAPES[n].colour,
               values: YEARS.map(function (y, i) {
                 return parseFloat(figure(set, n, i)) || 0; }) };
    });
  }

  function drawTrend() {
    var names = Object.keys(SHAPES);
    /* THE CHART PLOTS THE REAL FIGURES NOW, on a numbered axis, because
       the grid one click away shows the same numbers and a reader who
       finds 165 in the table should be able to find 165 on the chart.
       The banded v.low/low/medium axis made that impossible - it was the
       right call while the numbers were invented and the wrong one the
       moment they stopped being. */
    var unit = state.attribute === 'leverage' ? 'x' : '';
    var series = chartSeries();

    LOFI.drawChart($('cc-chart'), {
      label: 'How each case moves over ten years',
      xLabels: YEARS,
      scale: 'value',
      unit: unit,
      scrubLabel: 'Year',
      series: series,
      scrub: state.scrub
    });
    paintReadout(series);
    $('cc-chart-legend').innerHTML = names.map(function (n) {
      return '<span class="lofi-chart-legend-item">' +
             '<i style="background: var(--lofi-' + SHAPES[n].colour + ')"></i>' +
             n.replace(' case (base)', '').replace(' case', '') + '</span>';
    }).join('');
  }

  function drawInsights() {
    var set = DATA[state.attribute];
    var worst = null, best = null;
    Object.keys(set.cases).forEach(function (n) {
      var last = set.cases[n][YEARS.length - 1];
      if (n.indexOf('base') > -1) return;
      var good = set.rising === 'bad' ? -last : last;
      if (best === null || good > best.good) best = { n: n, good: good, last: last };
      if (worst === null || good < worst.good) worst = { n: n, good: good, last: last };
    });
    /* WRITTEN FROM THE SAME NUMBERS THE TABLE SHOWS. An insight panel that
       is hand-typed prose stops agreeing with the data the moment anyone
       changes a parameter - and in a prototype about generating analysis,
       that disagreement is the one thing a reader will notice. */
    $('cc-ins-trends').textContent =
      'Against the credit case, ' + best.n.replace(' case', '').toLowerCase() +
      ' ends strongest at ' + (best.last > 0 ? '+' : '') + best.last.toFixed(1) +
      '% on ' + state.attribute + ' by ' + YEARS[YEARS.length - 1] + ', while ' +
      worst.n.replace(' case', '').toLowerCase() + ' is the weakest at ' +
      (worst.last > 0 ? '+' : '') + worst.last.toFixed(1) +
      '%. Anything beyond ' + state.threshold + '% off the base is marked on the table.';
  }

  /* ------------------------------------------------------------------
     WIRING
     ------------------------------------------------------------------ */
  document.addEventListener('lofi:menu', function (e) {
    var v = e.detail.value;
    /* A KEBAB CARRIES ITS ROW WITH IT; the toolbar menu is about the
       projection currently open, which has no saved date. Read off the
       event rather than trusted from earlier, so a menu opened by the
       keyboard works the same as one opened by a click. */
    var row = e.target.closest && e.target.closest('tr[data-row]');
    state.from = row ? SAVED[+row.dataset.row] : null;
    if (row) markRow(row);
    /* THE SETUP STEP COMES FIRST NOW. Choosing an analysis no longer
       starts it - it asks what you are asking. `pending` carries the
       title across, because by the time Apply is pressed the menu that
       named the analysis is long gone. */
    if (v === 'case-comparison' || v === 'analysis-2' || v === 'analysis-3') {
      pending = v === 'case-comparison' ? 'Case comparison results'
              : v === 'analysis-2' ? 'Analysis #2 results' : 'Analysis #3 results';
      LOFI.openOverlay('cc-setup');
    }
    else LOFI.openOverlay('cc-modal');          /* the two export items */
  });

  $('cc-attrs').addEventListener('lofi:tab', function (e) {
    state.attribute = e.detail.tab.dataset.lofiValue || 'revenue';
    draw();
  });

  /* which analysis the reader picked, held between the menu and Apply */
  var pending = null;

  $('cc-apply').addEventListener('click', function () {
    state.base    = $('cc-base').value;
    state.against = $('cc-against').value.split(',');
    state.attrs   = $('cc-attr-pick').value.split(',');
    LOFI.closeOverlay();
    /* FIRST TIME THROUGH it opens the results tab; every time after, the
       tab is already there and it simply runs again, visibly. That is the
       difference between Apply-from-the-menu and Apply-from-Adjust, and
       it is the only thing `pending` is for. */
    if (pending) { openResults(pending); pending = null; }
    else run();
  });

  /* WHAT THE SCRUBBER IS POINTING AT. The chart reports where it was
     dragged to; what that MEANS is this prototype's business, because
     only it knows which case is the base and what the figures are. */
  function paintReadout(series) {
    var i = state.scrub;
    /* THE UNIT GOES ON THE READOUT TOO. The grid says 1.63x, the axis
       says 1x, and a readout saying a bare 1.63 between them is the one
       place a reader has to supply the unit themselves. */
    var unit = state.attribute === 'leverage' ? 'x' : '';
    var base = series.filter(function (s) { return /\(base\)/.test(s.name); })[0];
    LOFI.drawReadout($('cc-readout'), {
      when: YEARS[i],
      rows: series.map(function (s) {
        var row = { name: s.name.replace(' case (base)', ' (base)')
                                .replace(' case', ''),
                    value: unit ? s.values[i].toFixed(2) + unit
                                : s.values[i] };
        if (base && s !== base && base.values[i]) {
          row.delta = (s.values[i] / base.values[i] - 1) * 100;
        }
        return row;
      })
    });
  }

  document.addEventListener('lofi:scrub', function (e) {
    state.scrub = e.detail.at;
    paintReadout(chartSeries());
  });

  document.addEventListener('lofi:cell', function (e) {
    $('cc-scrub-says').textContent = e.detail.value;
  });

  /* ---------- 1 · THE LATEST PROJECTION ----------

     The grid is the whole model: six sections, 2026 to 2035, scrolling
     inside a widget whose height never moves. None of it is in the markup
     - see the note on #cc-ledger in index.html.

     THE PICKER CHANGES THE FIGURES, NOT THE DOCUMENT. Every case has the
     same sections and the same rows; only the numbers differ. That is why
     `swapLedger` takes figures alone and keeps the reader's scroll
     position: someone comparing EBITDA margin across two cases should find
     the row still under their eye when they switch. */
  var MODEL = (window.LOFI_DATA && window.LOFI_DATA.projection) || null;

  function drawLedger(caseId) {
    if (!MODEL) return;
    var values = MODEL.values[caseId] || MODEL.values[MODEL.cases[0].id];
    LOFI.drawLedger($('cc-ledger'), {
      years: MODEL.meta.years,
      sections: MODEL.sections,
      values: values
    });
  }

  if (MODEL) {
    /* the toolbar says what the figures are in, and takes it from the data
       rather than repeating it in the markup where it could drift */
    var meta = $('cc-ledger').closest('.lofi-pane').querySelector('.lofi-toolbar-meta');
    if (meta) {
      meta.innerHTML = 'Currency: <b>' + MODEL.meta.currency + '</b>' +
        '<span class="lofi-toolbar-sep">|</span>Scale: <b>' + MODEL.meta.scale + '</b>' +
        '<span class="lofi-toolbar-sep">|</span>' + MODEL.meta.company;
    }
    drawLedger('credit');

    $('cc-case').addEventListener('lofi:combo', function (e) {
      var id = e.detail.value;
      if (!MODEL.values[id]) return;
      LOFI.swapLedger($('cc-ledger'), MODEL.values[id]);
    });
  }

  /* the export preview is the result, shrunk - built when it opens so it
     always shows what is on screen now rather than what was there before */
  drawInventory();

  $('cc-modal').addEventListener('lofi:overlay-open', function () {
    $('cc-preview').innerHTML =
      '<h4>Section 1 &middot; ' + state.attribute + '</h4>' +
      '<div class="lofi-table-wrap">' + $('cc-table').outerHTML + '</div>' +
      '<h4>Section 2 &middot; trend</h4>' + $('cc-chart').innerHTML;
  });

  $('cc-download').addEventListener('click', function () {
    $('cc-download').textContent = 'Downloaded ✓';
    setTimeout(function () { LOFI.closeOverlay(); }, 700);
  });
})();

