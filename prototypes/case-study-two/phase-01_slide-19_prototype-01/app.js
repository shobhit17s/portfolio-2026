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

  /* =====================================================================
     THE SETUP MODAL ACTUALLY DRIVES THE GRID NOW
     =====================================================================

     It used to read all three fields into `state` and then draw the same
     six rows and the same four attribute tabs whatever they said, which
     is the worst kind of prototype bug: it looks like it works. Three
     small maps are what it takes to make it real.

     EVERY DELTA IN `DATA` IS MEASURED AGAINST THE CREDIT CASE, because
     that is how the model was written down. Choosing a different base
     does not mean going back to the model - it means asking the same
     numbers a different question, and the arithmetic is one line:

         a case is  (1 + its own gap)  /  (1 + the base's gap)  - 1

     Both gaps are against credit, so credit cancels out and what is left
     is the gap against whatever the reader picked. */
  var ID_OF = { 'Credit case (base)': 'credit', 'Management case': 'management',
                'Downside case': 'downside',    'Harvest case': 'harvest',
                'Consensus case': 'consensus',  'Custom case': 'custom' };
  var NAME_OF = { credit: 'Credit case', management: 'Management case',
                  downside: 'Downside case', harvest: 'Harvest case',
                  consensus: 'Consensus case', custom: 'Custom case' };
  var ATTR_NAME = { revenue: 'Revenue', ebitda: 'EBITDA',
                    leverage: 'Leverage', cashflow: 'Cash flow' };

  /* THE BASE IS ALWAYS SUN - the kit's "this is the reference" colour -
     and the cases being compared take the rest in order. Assigning by
     position rather than by name means no two series can ever come out
     the same colour however the reader has set the modal, which a fixed
     case-to-colour table could not promise once the cases became a
     choice. */
  var LINE_COLOURS = ['forest', 'fire', 'water', 'mist'];

  /* the row's delta against whatever the reader chose as the base */
  function deltaOf(id, i) {
    var cases = DATA[state.attribute].cases;
    var mine = cases[NAME_OF[id] === 'Credit case' ? 'Credit case (base)' : NAME_OF[id]];
    var theirs = cases[state.base === 'credit' ? 'Credit case (base)' : NAME_OF[state.base]];
    if (!mine || !theirs) return 0;
    var a = 1 + (mine[i] || 0) / 100;
    var b = 1 + (theirs[i] || 0) / 100;
    return b ? (a / b - 1) * 100 : 0;
  }

  /* WHICH ROWS THE TABLE HAS, in the order they are read: the base
     first, because everything else is measured off it, then the cases
     the reader ticked, in the order the list offers them. */
  function rowIds() {
    var out = [state.base];
    state.against.forEach(function (id) {
      if (id !== state.base && out.indexOf(id) === -1) out.push(id);
    });
    return out;
  }

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
       CHOSEN base's figure and this row's own delta. It used to find the
       base by looking for "(base)" in a row name, which was correct only
       while the base could never be anything but Credit. */
    var bid = state.base;
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
              '<button type="button" class="lofi-menu-item" role="menuitem" data-lofi-value="export-projection" disabled>Export projection</button>' +
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
  function draw() { drawAttrTabs(); drawTable(); drawTrend(); drawInsights(); }

  /* THE ATTRIBUTE TABS ARE THE CHOICE, DRAWN. Four of them were written
     into index.html, which meant picking "revenue and EBITDA" in the
     modal still produced a Leverage tab and a Cash flow tab - the two
     halves of the screen openly disagreeing about what was asked for.

     The row's listener is on the ROW, not on each tab, so replacing the
     buttons inside it needs no re-wiring - that is exactly why the kit
     listens where it does. */
  function drawAttrTabs() {
    var row = $('cc-attrs');
    if (!state.attrs.length) state.attrs = ['revenue'];
    if (state.attrs.indexOf(state.attribute) === -1) state.attribute = state.attrs[0];
    row.innerHTML = state.attrs.map(function (a) {
      return '<button type="button" class="lofi-ptab" role="tab" aria-selected="' +
             (a === state.attribute) + '" data-lofi-value="' + a + '">' +
             (ATTR_NAME[a] || a) + '</button>';
    }).join('');
    /* ONE ATTRIBUTE IS NOT A CHOICE. A tab strip with a single tab in it
       is a label pretending to be a control; it gets out of the way. */
    row.hidden = state.attrs.length < 2;
  }

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
    /* THE ROWS ARE THE READER'S CHOICE, in the reader's order. It used
       to be `Object.keys(set.cases)` - every case the data file knows
       about, every time, whatever the modal said. */
    body.innerHTML = rowIds().map(function (id) {
      var base = id === state.base;
      var name = NAME_OF[id] + (base ? ' (base)' : '');
      var lookup = id === 'credit' ? 'Credit case (base)' : NAME_OF[id];
      var invert = set.rising === 'bad' ? ' data-lofi-invert' : '';
      return '<tr><td class="lofi-rowhead"' + invert + '>' + name + '</td>' +
        YEARS.map(function (_y, i) {
          var v = deltaOf(id, i);
          var fig = figure(set, lookup, i);
          var txt = (v > 0 ? '+' : '') + v.toFixed(1) + '%';
          var said = name + ', ' + YEARS[i] + ': ' + fig +
                     (base ? '' : ' (' + txt + ' against ' + NAME_OF[state.base] + ')');
          return '<td class="' + (i === 0 ? 'lofi-divide ' : '') + 'is-clickable" ' +
                 (base ? '' : 'data-lofi-delta="' + v + '" ') +
                 'data-lofi-value="' + said + '">' +
                 '<span class="cc-fig">' + fig + '</span>' +
                 (base ? '' : '<span class="cc-delta">' + txt + '</span>') +
                 '</td>';
        }).join('') + '</tr>';
    }).join('') +
    /* the empty row that soaks up the leftover height - see the note in
       lofi-table.css. Two cases must not become two enormous rows. */
    '<tr class="lofi-table-filler" aria-hidden="true"><td colspan="' +
      (YEARS.length + 1) + '"></td></tr>';

    LOFI.initTables($('cc-lens-table'));
  }

  /* THE SERIES THE CHART DRAWS, built once here rather than at each of
     the two places that need them - `drawTrend` when the lens opens, and
     the scrub handler when the marker moves. Two copies of this drifted
     apart the first time, which is how the chart ended up reading `set`
     from a scope that had never heard of it. */
  function chartSeries() {
    var set = DATA[state.attribute];
    /* THE SAME ROWS THE TABLE HAS. It used to plot three cases named in
       a constant, so a reader who swapped Downside for Harvest in the
       modal got a table about Harvest and a chart about Downside - one
       click apart, both claiming to be the same analysis. */
    var ids = rowIds();
    var k = -1;
    return ids.map(function (id) {
      var base = id === state.base;
      if (!base) k += 1;
      var lookup = id === 'credit' ? 'Credit case (base)' : NAME_OF[id];
      return {
        name: NAME_OF[id] + (base ? ' (base)' : ''),
        colour: base ? 'sun' : LINE_COLOURS[k % LINE_COLOURS.length],
        values: YEARS.map(function (_y, i) {
          return parseFloat(figure(set, lookup, i)) || 0; })
      };
    });
  }

  function drawTrend() {
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
    /* THE LEGEND IS BUILT FROM THE SERIES, not from a second list that
       has to be kept in step with them by hand. */
    $('cc-chart-legend').innerHTML = series.map(function (s) {
      return '<span class="lofi-chart-legend-item">' +
             '<i style="background: var(--lofi-' + s.colour + ')"></i>' +
             s.name.replace(' case (base)', '').replace(' case', '') + '</span>';
    }).join('');
  }

  function drawInsights() {
    var set = DATA[state.attribute];
    var worst = null, best = null;
    var last_i = YEARS.length - 1;
    /* THE SAME ROWS AGAIN. An insight about a case the reader did not
       ask to see is the panel talking about a different screen. */
    rowIds().forEach(function (id) {
      if (id === state.base) return;
      var last = deltaOf(id, last_i);
      var n = NAME_OF[id];
      var good = set.rising === 'bad' ? -last : last;
      if (best === null || good > best.good) best = { n: n, good: good, last: last };
      if (worst === null || good < worst.good) worst = { n: n, good: good, last: last };
    });
    /* NOTHING TO COMPARE IS A SENTENCE, not a crash. The reader can take
       every pill out of "compare to", and the panel has to survive it. */
    if (!best) {
      $('cc-ins-trends').textContent =
        'Nothing is being compared against ' + NAME_OF[state.base].toLowerCase() +
        ' yet. Add a case in Adjust parameters.';
      return;
    }
    /* WRITTEN FROM THE SAME NUMBERS THE TABLE SHOWS. An insight panel that
       is hand-typed prose stops agreeing with the data the moment anyone
       changes a parameter - and in a prototype about generating analysis,
       that disagreement is the one thing a reader will notice. */
    $('cc-ins-trends').textContent =
      'Against the ' + NAME_OF[state.base].replace(' case', '').toLowerCase() +
      ' case, ' + best.n.replace(' case', '').toLowerCase() +
      ' ends strongest at ' + (best.last > 0 ? '+' : '') + best.last.toFixed(1) +
      '% on ' + state.attribute + ' by ' + YEARS[YEARS.length - 1] + ', while ' +
      worst.n.replace(' case', '').toLowerCase() + ' is the weakest at ' +
      (worst.last > 0 ? '+' : '') + worst.last.toFixed(1) +
      '%. Anything beyond ' + state.threshold + '% off the base is marked on the table.';
  }

  /* ------------------------------------------------------------------
     WIRING
     ------------------------------------------------------------------ */
  /* =====================================================================
     THE TWO FIELDS THAT KNOW ABOUT EACH OTHER
     =====================================================================
     A case cannot be compared with itself: that is a column of zeroes
     pretending to be an answer. So whichever case is the BASE is greyed
     out of COMPARE TO, exactly as the sheet of 7 November draws it.

     GREYED AND STILL THERE, not removed. A list that silently loses an
     item as you change something above it is a list the reader cannot
     trust - they look for Credit case, do not find it, and have no way
     of knowing whether it was never there or has just gone. Greyed, it
     answers the question it raises.

     AND IF IT WAS ALREADY PICKED, IT IS UNPICKED at the same moment.
     Leaving its pill in the field while the list says it is unavailable
     is the two halves of one control disagreeing in front of the reader.
     `LOFI.multiDisable` does both in one call. */
  var baseWas = null;

  function lockBaseOut() {
    var now = $('cc-base').value;
    if (baseWas && baseWas !== now) LOFI.multiDisable('cc-against', baseWas, false);
    LOFI.multiDisable('cc-against', now, true);
    baseWas = now;
  }

  $('cc-base').addEventListener('change', lockBaseOut);
  lockBaseOut();          /* on load, too - Credit case is the base */

  /* =====================================================================
     THE NUDGE
     =====================================================================
     Two steps: open Actions, then choose Case comparison. Both bubbles
     are already in the markup, sitting inside the thing they point at.

     IT IS A TOUR AND NOT A TOOLTIP because the second step cannot exist
     until the first has happened - the item it points at is inside a
     panel that is not on screen yet. So the menu now says when it opens
     and when it shuts, and the tour follows it.

     `coachAt` rather than `coachNext`: a reader can open the menu, think
     better of it, close it and open it again, and "show step two" has to
     be something we can say three times without the tour running off the
     end of its own list.

     IT ENDS THE MOMENT THEY PICK THE THING, and never comes back. A
     nudge that reappears after you have done what it asked is not help,
     it is nagging - and in a prototype shown over somebody's shoulder,
     the second appearance is the one that makes them ask if it is
     stuck. Skip on either bubble ends it just as finally. */
  LOFI.coach('setup', [
    { bubble: 'cc-coach-1', ring: 'cc-actions-btn' },
    { bubble: 'cc-coach-2', ring: 'cc-cmp-item' }
  ]);

  $('cc-actions').addEventListener('lofi:menu-open',  function () { LOFI.coachAt('setup', 1); });
  $('cc-actions').addEventListener('lofi:menu-close', function () { LOFI.coachAt('setup', 0); });

  document.addEventListener('lofi:menu', function (e) {
    var v = e.detail.value;
    if (v === 'case-comparison') LOFI.coachEnd('setup');
    /* A KEBAB CARRIES ITS ROW WITH IT; the toolbar menu is about the
       projection currently open, which has no saved date. Read off the
       event rather than trusted from earlier, so a menu opened by the
       keyboard works the same as one opened by a click. */
    var row = e.target.closest && e.target.closest('tr[data-row]');
    state.from = row ? SAVED[+row.dataset.row] : null;
    if (row) markRow(row);
    /* NO SETUP STEP IN THIS ONE. Choosing an analysis runs it, on the
       defaults already in the modal, and the reader changes them
       afterwards from Adjust parameters. That is this prototype's whole
       argument: answer first, refine after. */
    if (v === 'case-comparison') openResults('Case comparison results');
    else if (v === 'analysis-2')  openResults('Analysis #2 results');
    else if (v === 'analysis-3')  openResults('Analysis #3 results');
    /* and nothing else opens anything: the export items are disabled in
       the markup, so this branch can only be reached by a value nobody
       has wired, and quietly doing nothing is the right answer. */
  });

  $('cc-attrs').addEventListener('lofi:tab', function (e) {
    state.attribute = e.detail.tab.dataset.lofiValue || 'revenue';
    draw();
  });

  $('cc-apply').addEventListener('click', function () {
    /* READ THROUGH THE KIT'S OWN API, not off a `.value` property.
       `.lofi-multi` is a <div>, and a <div> has no `.value` - it came
       back `undefined`, `.split` threw, and Apply died halfway: the
       modal stayed open, the grid kept the selection it had, and the
       whole control looked as if it were not wired to anything. That is
       exactly the "unresponsive to the selected options" symptom.

       The base case IS a <select>, so `.value` is right there. The two
       lines reading differently is the honest version - they are
       different kinds of control. */
    state.base    = $('cc-base').value;
    state.against = LOFI.multiValues('cc-against');
    state.attrs   = LOFI.multiValues('cc-attr-pick');
    LOFI.closeOverlay();
    /* ALWAYS A RE-RUN. The results tab is already open by the time this
       modal can be reached at all - the only way to it is the Adjust
       button on that tab. */
    run();
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

  drawInventory();

  /* EXPORT IS SWITCHED OFF IN THIS PROTOTYPE and its modal is gone with
     it. The lines that used to fill that modal's preview were left
     behind when the markup went, and `$('cc-modal')` came back null -
     one unguarded `addEventListener` on nothing, and every line after it
     in this file stopped running: the coach never appeared, the
     attribute tabs never drew, Apply did nothing. One dead reference is
     enough to take a whole prototype down without a word.

     THE LESSON, written here because it will happen again: when markup
     is removed, the script that reaches for it goes in the same breath.
     Nothing warns you. */
})();
