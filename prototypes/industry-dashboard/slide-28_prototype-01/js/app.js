/* ===========================================================================
   app.js — the wiring, and the only file that starts anything.

   Everything above it defines and nothing above it runs, so this is the one
   place to look for "what happens when the page opens".
   =========================================================================== */
window.KIM = window.KIM || {};

(function (KIM) {
  'use strict';

  var $ = KIM.$, el = KIM.el;
  var D = window.KIM_DATA;

  /* =======================================================================
     THE KIM SEARCH
     =======================================================================
     IT FINDS METRICS, NOT SUB-INDUSTRIES. The box at the top of the card is
     the one on your sheet labelled "Search KIMs (eg: Steel PPI, Inventory
     etc.)", and it opens the metric-level screen. Sub-industries are found
     in the selector on the left, which has its own box — two searches that
     look alike doing two different jobs, so each one says what it searches
     in its placeholder.

     PREFIX MATCHES COME FIRST. Someone typing "ste" means Steel, not
     "Realised Selling Price" — which contains the letters s, t and e
     somewhere. Sorting by where the match lands is the difference between
     a search that feels obedient and one that feels random. */
  function matches(q) {
    q = q.trim().toLowerCase();
    if (!q) return [];
    var starts = [], has = [];
    D.uniqueMetrics.forEach(function (m) {
      var i = m.name.toLowerCase().indexOf(q);
      if (i === 0) starts.push(m);
      else if (i > 0) has.push(m);
    });
    return starts.concat(has).slice(0, 8);
  }

  var active = -1;

  function drawSuggest() {
    var list = KIM.clear($('kim-kimsearch-suggest'));
    var found = matches($('kim-kimsearch-input').value);
    active = found.length ? 0 : -1;

    found.forEach(function (m, i) {
      var li = el('li');
      var b = el('button');
      b.type = 'button';
      b.setAttribute('role', 'option');
      if (i === 0) b.className = 'is-active';
      b.appendChild(el('span', null, m.name));
      b.appendChild(el('span', 'kim-suggest-cat', m.category + ' · ' + KIM.num(m.latest) + ' ' + m.unit));
      b.addEventListener('click', function () { take(m.name); });
      li.appendChild(b);
      list.appendChild(li);
    });

    list.hidden = !found.length;
    $('kim-kimsearch-input').setAttribute('aria-expanded', String(!!found.length));
    $('kim-kimsearch-x').hidden = !$('kim-kimsearch-input').value;
  }

  function moveActive(by) {
    var items = $('kim-kimsearch-suggest').querySelectorAll('button');
    if (!items.length) return;
    active = (active + by + items.length) % items.length;
    [].forEach.call(items, function (b, i) { b.classList.toggle('is-active', i === active); });
  }

  function take(name) {
    $('kim-kimsearch-input').value = name;
    $('kim-kimsearch-suggest').hidden = true;
    $('kim-kimsearch-input').setAttribute('aria-expanded', 'false');
    $('kim-kimsearch-x').hidden = false;
    $('kim-kimsearch-clear').hidden = false;
    KIM.views.openMetric(name);
  }

  function clearSearch() {
    $('kim-kimsearch-input').value = '';
    $('kim-kimsearch-suggest').hidden = true;
    $('kim-kimsearch-x').hidden = true;
    $('kim-kimsearch-clear').hidden = true;
    KIM.panel.setOpen(true);
    KIM.views.openOverview();
  }

  function wireSearch() {
    var input = $('kim-kimsearch-input');
    input.addEventListener('input', drawSuggest);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); moveActive(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); moveActive(-1); }
      else if (e.key === 'Enter') {
        var items = $('kim-kimsearch-suggest').querySelectorAll('button');
        if (items[active]) { e.preventDefault(); items[active].click(); }
      } else if (e.key === 'Escape') {
        $('kim-kimsearch-suggest').hidden = true;
      }
    });
    /* A LIST THAT STAYS OPEN AFTER YOU HAVE LOOKED AWAY is a list covering
       something else you were trying to read. */
    document.addEventListener('click', function (e) {
      if (!e.target.closest('#kim-kimsearch')) $('kim-kimsearch-suggest').hidden = true;
    });

    $('kim-kimsearch-x').addEventListener('click', clearSearch);
    $('kim-kimsearch-clear').addEventListener('click', clearSearch);
  }

  /* =======================================================================
     THE HEAD'S OWN CONTROLS
     ======================================================================= */
  function wireHead() {
    $('kim-matonly').addEventListener('change', function () {
      KIM.state.matOnly = this.checked;
      KIM.panel.draw();
      KIM.views.draw();
    });

    [['kim-layout-grid', 'grid'], ['kim-layout-list', 'list']].forEach(function (pair) {
      $(pair[0]).addEventListener('click', function () {
        KIM.state.layout = pair[1];
        $('kim-layout-grid').setAttribute('aria-pressed', String(pair[1] === 'grid'));
        $('kim-layout-list').setAttribute('aria-pressed', String(pair[1] === 'list'));
        KIM.views.draw();
      });
    });

    /* Download and Columns are drawn and wired as menus; what each item
       would actually produce is not designed yet, so an item closes the
       menu and stops there rather than pretending to do something. */
    KIM.wireMenu($('kim-download'), $('kim-download-menu'), null);
    KIM.wireMenu($('kim-columns-btn'), $('kim-columns-menu'), null);
  }

  /* =======================================================================
     LIGHT AND DARK
     =======================================================================
     The whole theme turns on ONE attribute on <body>: every colour on the
     page is a token whose value is swapped by `[data-mode="dark"]`.
     Nothing in any other file knows a colour. */
  function wireMode() {
    var btn = $('kim-mode');
    btn.setAttribute('aria-pressed', 'false');
    btn.addEventListener('click', function () {
      var dark = document.body.getAttribute('data-mode') === 'dark';
      document.body.setAttribute('data-mode', dark ? 'light' : 'dark');
      btn.setAttribute('aria-pressed', dark ? 'false' : 'true');
      /* the charts are drawn, not styled, in one respect: their geometry.
         Their colours are tokens, so a redraw is not needed for the mode —
         but it costs nothing and keeps the two in step if that changes. */
      if (KIM.drawer.isOpen()) KIM.drawer.paint();
    });
  }

  /* THE NAV IS DRAWN, NOT WIRED. Surveillance, Clients and the rest belong
     to a product this prototype is one screen of; pressing one and landing
     nowhere would be worse than pressing one and nothing happening. */

  /* =======================================================================
     START
     ======================================================================= */
  function start() {
    KIM.panel.init();
    KIM.drawer.init();
    wireSearch();
    wireHead();
    wireMode();
    KIM.views.openOverview();
    KIM.coach.init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

})(window.KIM);
