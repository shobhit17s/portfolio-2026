/* ===========================================================================
   dashboard.js — everything on this page that MOVES.

   The shell (bar, band, rail, panel) is written in index.html, because it
   is a fixed arrangement rather than a list of things. What lives here is:

       1  the view selector collapsing, and the rail giving its space back
       2  the widgets in each tab, built from data/widgets.js
       3  the tabs - including the closable one the expand icon opens
       4  the dropdown menus
       5  the client list, and which subsidiary the panel is showing
       6  light / dark

   The Performance to Plan widget itself is built by js/widget.js, which is
   the same file the standalone version uses, unchanged.
   =========================================================================== */
(function () {
  'use strict';

  var frame = document.getElementById('cd-frame');

  /* HOW MUCH WIDTH DOES THE DECK'S SCROLLBAR EAT ON THIS MACHINE?
     ASK THE DECK, not a throwaway box. A test div measures the browser's
     DEFAULT scrollbar, and this browser has two different answers: its
     default bar floats over the content and costs nothing, while the
     deck - which asks for `scrollbar-gutter: stable` so the widgets do
     not shift when you change tab - is given a real 10px strip. The test
     div said 0 and the deck lost 10, and the widgets stopped short of the
     panel by exactly that much.

     `offsetWidth` is the box including that strip; `clientWidth` is what
     is left for the content. The difference IS the strip, whatever this
     machine calls it, and it is a constant because the gutter is held
     open whether the bar is showing or not. The CSS then makes the deck
     that much wider to the right, so the content ends on the panel's edge
     and the strip sits out in the 16px margin. 0 on a Mac, where the two
     lines cancel to nothing. */
  function syncDeckEdge() {
    var d = document.getElementById('cd-deck');
    if (!d) return;
    frame.style.setProperty('--cd-sbw', (d.offsetWidth - d.clientWidth) + 'px');
  }
  var ICON = {
    expand: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M2 5.5V2h3.5M10.5 2H14v3.5M14 10.5V14h-3.5M5.5 14H2v-3.5"/></svg>',
    more:   '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><circle cx="3" cy="8" r="1.3"/><circle cx="8" cy="8" r="1.3"/><circle cx="13" cy="8" r="1.3"/></svg>',
    close:  '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg>'
  };

  function el(tag, cls, id) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (id) n.id = id;
    return n;
  }

  /* =======================================================================
     1 - THE VIEW SELECTOR
     =======================================================================
     One attribute on the frame does the whole thing: `data-rail`. The CSS
     reads it, the rail's width changes, and because everything to the
     right of it is a `1fr` column, the panel and the widgets take that
     space back without being told to.

     THE CONTENTS ARE HIDDEN WITH `hidden`, NOT SQUEEZED TO NOTHING. An
     element with no width is still focusable and still read aloud, so a
     shut rail would leave eleven invisible stops in the Tab order.

     AND IT IS HIDDEN AFTER THE WIDTH FINISHES CHANGING, not before: pull
     the contents out at the start and the rail collapses onto emptiness,
     which looks like a glitch rather than a fold. */
  var railToggle = document.getElementById('cd-rail-toggle');
  var railOpen   = document.getElementById('cd-rail-open');
  var MOVE = 180;   /* must match the transition in dashboard.css */

  function setRail(collapsed) {
    railToggle.setAttribute('aria-expanded', String(!collapsed));
    railToggle.setAttribute('aria-label',
      collapsed ? 'Expand the view selector' : 'Collapse the view selector');
    if (collapsed) {
      frame.dataset.rail = 'collapsed';
      window.setTimeout(function () {
        if (frame.dataset.rail === 'collapsed') railOpen.hidden = true;
      }, MOVE);
    } else {
      railOpen.hidden = false;
      frame.dataset.rail = 'open';
    }
  }
  railToggle.addEventListener('click', function () {
    setRail(frame.dataset.rail !== 'collapsed');
  });

  /* =======================================================================
     2 - THE WIDGETS IN EACH TAB
     =======================================================================
     Read from data/widgets.js and built here. A tab with an empty list
     gets the empty state instead, so a tab is never a blank rectangle
     with no explanation.

     THE PLACEHOLDER BODY IS DRAWN AS A PLACEHOLDER, not filled with an
     invented chart. These widgets have no subject yet, and a
     convincing-looking chart in one would be a lie about how far the
     design has got. */
  function placeholderWidget(spec) {
    var w = el('section', 'cd-widget', spec.id);
    w.setAttribute('aria-labelledby', spec.id + '-name');
    if (spec.wide) w.classList.add('cd-wide');

    var head = el('div', 'cd-widget-head');
    var name = el('h3', 'cd-widget-name', spec.id + '-name');
    name.textContent = spec.name;
    var tools = el('div', 'cd-widget-tools');
    [['expand', 'Expand ' + spec.name], ['more', 'More actions']].forEach(function (p) {
      var b = el('button', 'cd-widget-tool', spec.id + '-' + p[0]);
      b.type = 'button';
      b.setAttribute('aria-label', p[1]);
      b.innerHTML = ICON[p[0]];
      tools.appendChild(b);
    });
    head.appendChild(name);
    head.appendChild(tools);

    var body = el('div', 'cd-widget-body', spec.id + '-body');
    if (spec.body) body.style.minBlockSize = spec.body + 'px';

    var foot = el('div', 'cd-widget-foot');
    var sec = el('span', 'cd-secondary');
    sec.textContent = 'Secondary';
    var cta = el('button', 'cd-cta', spec.id + '-cta');
    cta.type = 'button';
    cta.textContent = 'CTA';
    foot.appendChild(sec);
    foot.appendChild(cta);

    w.appendChild(head);
    w.appendChild(body);
    w.appendChild(foot);
    return w;
  }

  function emptyState(label) {
    var e = el('div', 'cd-empty');
    var p = el('p', 'cd-empty-line');
    p.textContent = 'No widgets available in this view yet.';
    e.appendChild(p);
    if (label) e.setAttribute('aria-label', label);
    return e;
  }

  /* THE WIDGET'S OWN BUILDER REWRITES THE CLASS LIST of whatever element
     it is handed, so a `cd-wide` written on the widget itself is wiped
     the moment it is built and the widget drops into one column. The span
     therefore lives on a wrapper the builder cannot touch. */
  function buildPane(paneId) {
    var pane = document.getElementById(paneId);
    var list = (window.CD_WIDGETS || {})[paneId] || [];
    pane.textContent = '';

    if (!list.length) { pane.appendChild(emptyState(paneId)); return; }

    var grid = el('div', 'cd-grid', paneId + '-grid');
    list.forEach(function (spec) {
      if (spec.type === 'ptp') {
        var slot = el('div', spec.wide ? 'cd-wide' : '', spec.id + '-slot');
        var host = el('section', '', spec.id);
        slot.appendChild(host);
        grid.appendChild(slot);
        PTPWidget.build(host, 'blocks');
      } else {
        grid.appendChild(placeholderWidget(spec));
      }
    });
    pane.appendChild(grid);
  }

  ['cd-pane-profile', 'cd-pane-health', 'cd-pane-exposure'].forEach(buildPane);
  syncDeckEdge();
  window.addEventListener('resize', syncDeckEdge);

  /* =======================================================================
     3 - THE TABS
     =======================================================================
     A real tablist: each tab names the pane it controls, each pane names
     the tab that controls it, and only the selected tab is in the Tab
     order - inside the list you move with the arrow keys.

     THE LIST IS READ FRESH EVERY TIME rather than captured once, because
     a tab can now appear and disappear while the page is open. A captured
     array would keep pointing at a tab that is no longer there. */
  var tablist = document.getElementById('cd-tabs');
  var deck    = document.getElementById('cd-deck');

  function allTabs() {
    return [].slice.call(tablist.querySelectorAll('[role="tab"]'));
  }
  function paneOf(tab) {
    return document.getElementById(tab.getAttribute('aria-controls'));
  }
  function selectTab(tab) {
    allTabs().forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      var pane = paneOf(t);
      if (pane) pane.hidden = !on;
    });
    deck.scrollTop = 0;
  }

  tablist.addEventListener('click', function (e) {
    if (e.target.closest('.cd-tabclose')) return;    /* the close button is not a selection */
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
    if (e.key === 'Enter' || e.key === ' ') {
      if (e.target.getAttribute('role') === 'tab') { e.preventDefault(); selectTab(e.target); }
      return;
    }
    if (!to) return;
    e.preventDefault();
    selectTab(to);
    to.focus();
  });

  selectTab(tablist.querySelector('[aria-selected="true"]') || allTabs()[0]);

  /* ---- THE EXPANDED-WIDGET TAB ----------------------------------------
     Clicking the expand icon on a widget opens that widget in a tab of
     its own, added at the END of the strip - to the RIGHT of CLIENT
     EXPOSURE - and that tab can be closed again.

     THE EXPANDED COPY IS A SECOND INSTANCE, not the same element moved.
     Moving it would empty the tab you came from, so going back to Client
     health would show a hole where the widget used to be. Two instances
     of a widget that reads the same data file stay in step by
     construction.

     A TAB CANNOT CONTAIN A BUTTON if the tab is itself a button - nested
     buttons are not allowed and behave unpredictably. So the closable
     tab is a <div role="tab">, which is the same thing to a screen
     reader and can hold a real close button. */
  var EXPANDED = {};   /* widget id -> { tab, pane } */

  /* WHICH WIDGET IS THIS? Every widget on the page is described in
     data/widgets.js, so the expanded copy is built from the same entry
     the original was - otherwise expanding a grey placeholder would
     quietly produce a Performance to Plan table, which it did. */
  function specFor(widgetId) {
    var lists = window.CD_WIDGETS || {};
    var found = null;
    Object.keys(lists).forEach(function (k) {
      lists[k].forEach(function (s) { if (s.id === widgetId) found = s; });
    });
    return found;
  }

  function openInTab(widgetId, label) {
    if (EXPANDED[widgetId]) { selectTab(EXPANDED[widgetId].tab); return; }

    var tabId  = widgetId + '-tab';
    var paneId = widgetId + '-pane';

    var tab = el('div', 'cd-tab cd-tab--closable', tabId);
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', 'false');
    tab.setAttribute('aria-controls', paneId);
    tab.tabIndex = -1;

    var text = el('span', 'cd-tab-label');
    text.textContent = label;
    tab.appendChild(text);

    var close = el('button', 'cd-tabclose', tabId + '-close');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close ' + label);
    close.innerHTML = ICON.close;
    tab.appendChild(close);

    var pane = el('div', 'cd-pane cd-pane--single', paneId);
    pane.setAttribute('role', 'tabpanel');
    pane.setAttribute('aria-labelledby', tabId);
    pane.tabIndex = 0;
    pane.hidden = true;

    var spec = specFor(widgetId) || {};
    var expandedId = widgetId + '-expanded';

    /* ADDED AT THE END, not inserted among the three. The three named
       tabs are the page's own; an opened widget is a temporary thing
       stacked after them, and keeping it last means the permanent tabs
       never shuffle sideways while you are using them. */
    var wasOn = tablist.querySelector('[aria-selected="true"]');
    tablist.appendChild(tab);
    deck.appendChild(pane);

    if (spec.type === 'ptp') {
      var host = el('section', '', expandedId);
      pane.appendChild(host);
      PTPWidget.build(host, 'blocks');
    } else {
      var copy = {};
      Object.keys(spec).forEach(function (k) { copy[k] = spec[k]; });
      copy.id = expandedId;
      copy.name = label;
      copy.wide = true;
      copy.body = 420;
      pane.appendChild(placeholderWidget(copy));
    }

    EXPANDED[widgetId] = { tab: tab, pane: pane };

    /* the expanded copy gets the same menu its original has */
    attachMenu(document.getElementById(expandedId + '-more'),
               (window.CD_MENUS || {})[widgetId + '-more']);

    close.addEventListener('click', function (e) {
      e.stopPropagation();
      var wasOpen = tab.getAttribute('aria-selected') === 'true';
      tab.remove();
      pane.remove();
      delete EXPANDED[widgetId];
      if (wasOpen) {
        /* BACK TO WHERE YOU CAME FROM, not to a tab named in this file:
           the widget could have been opened from any of the three. */
        var back = (wasOn && wasOn.isConnected) ? wasOn : allTabs()[0];
        selectTab(back);
        back.focus();
      }
    });

    selectTab(tab);
    tab.focus();
  }

  /* =======================================================================
     4 - THE DROPDOWN MENUS
     =======================================================================
     One function for every menu on the page, so they all behave the same:
     click or Enter opens, Escape and a click anywhere else close, the
     arrow keys walk the items, and focus goes back to the button on the
     way out. Their labels live in data/widgets.js.

     THE MENU IS A SIBLING OF THE BUTTON inside a small positioned
     wrapper, rather than a child of it: a <button> may not contain
     interactive elements, and a menu full of buttons inside a button is
     exactly that. */
  var openMenu = null;

  function closeMenu() {
    if (!openMenu) return;
    openMenu.btn.setAttribute('aria-expanded', 'false');
    openMenu.menu.hidden = true;
    openMenu = null;
  }

  document.addEventListener('click', function (e) {
    if (openMenu && !openMenu.wrap.contains(e.target)) closeMenu();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && openMenu) {
      var b = openMenu.btn;
      closeMenu();
      b.focus();
    }
  });

  function attachMenu(btn, items) {
    if (!btn || !items || !items.length || btn.dataset.csMenu === '1') return;
    btn.dataset.csMenu = '1';
    btn.setAttribute('aria-haspopup', 'menu');
    btn.setAttribute('aria-expanded', 'false');

    var wrap = el('span', 'cd-menuwrap');
    btn.parentNode.insertBefore(wrap, btn);
    wrap.appendChild(btn);

    var menu = el('div', 'cd-menu', btn.id + '-menu');
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-labelledby', btn.id);
    menu.hidden = true;

    items.forEach(function (it) {
      var mi = el('button', 'cd-menuitem', it.id);
      mi.type = 'button';
      mi.setAttribute('role', 'menuitem');
      mi.tabIndex = -1;
      mi.textContent = it.label;
      mi.addEventListener('click', function () {
        closeMenu();
        btn.focus();
        /* WHAT THE ITEM DOES IS NOT PROTOTYPED. It closes and returns
           focus, which is the honest behaviour for a menu whose actions
           have not been designed yet. */
      });
      menu.appendChild(mi);
    });
    wrap.appendChild(menu);
    btn.setAttribute('aria-controls', menu.id);

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var wasOpen = openMenu && openMenu.btn === btn;
      closeMenu();
      if (wasOpen) return;
      menu.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
      openMenu = { btn: btn, menu: menu, wrap: wrap };
      var first = menu.querySelector('.cd-menuitem');
      if (first) first.focus();
    });

    menu.addEventListener('keydown', function (e) {
      var its = [].slice.call(menu.querySelectorAll('.cd-menuitem'));
      var i = its.indexOf(document.activeElement);
      var to = null;
      if (e.key === 'ArrowDown') to = its[(i + 1) % its.length];
      if (e.key === 'ArrowUp')   to = its[(i - 1 + its.length) % its.length];
      if (e.key === 'Home')      to = its[0];
      if (e.key === 'End')       to = its[its.length - 1];
      if (!to) return;
      e.preventDefault();
      to.focus();
    });
  }

  var MENUS = window.CD_MENUS || {};
  Object.keys(MENUS).forEach(function (id) {
    attachMenu(document.getElementById(id), MENUS[id]);
  });

  /* ---- the expand icons, wherever they are -----------------------------
     Delegated from the deck rather than bound per button, because the
     widgets are built after this file runs in some orders and because an
     expanded pane contains buttons of its own. */
  deck.addEventListener('click', function (e) {
    var btn = e.target.closest('[id$="-expand"]');
    if (!btn) return;
    /* the widget is the nearest thing with an id that the button's id
       starts with - for `ptp-c1-expand` that is `ptp-c1` */
    var widgetId = btn.id.replace(/-expand$/, '');
    if (widgetId.indexOf('-expanded') !== -1) return;   /* already expanded */
    var host = document.getElementById(widgetId);
    var name = host && host.querySelector('.ptp-head-title, .cd-widget-name');
    openInTab(widgetId, name ? name.textContent.trim() : 'Widget');
  });

  /* =======================================================================
     5 - THE CLIENT LIST
     ======================================================================= */
  [].slice.call(document.querySelectorAll('.cd-client')).forEach(function (btn) {
    var subs = document.getElementById(btn.getAttribute('aria-controls') || '');
    if (!subs) return;
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      subs.hidden = open;
    });
  });

  /* WHICH SUBSIDIARY IS BEING SHOWN, in the rail and in the panel at once.
     The panel's heading is the only place on screen that says what these
     figures belong to, so the two cannot be allowed to disagree. */
  var subject = document.getElementById('cd-subject');
  [].slice.call(document.querySelectorAll('.cd-sub')).forEach(function (btn) {
    btn.addEventListener('click', function () {
      [].slice.call(document.querySelectorAll('.cd-sub[aria-current]')).forEach(function (b) {
        b.removeAttribute('aria-current');
      });
      btn.setAttribute('aria-current', 'true');
      subject.textContent = btn.dataset.subject || btn.textContent.trim();
    });
  });

  /* =======================================================================
     6 - THE TWO SCREENS
     =======================================================================
     The dashboard and the projections module are two screens in one frame.
     They share the app bar and the page band above them and swap the row
     underneath, so nothing else on the page moves when you go from one to
     the other.

     THE WAIT IS SHOWN, NOT FAKED AWAY. Opening a module is a real wait in
     the real product. The veil covers the row for a moment and the page
     band's title changes BEFORE it lifts, so what comes back is already
     labelled - the other order leaves the reader looking at a new screen
     under the old screen's name. */
  var pageTitle = document.getElementById('cd-pagetitle');
  var dashBody  = document.getElementById('cd-body');
  var projBody  = document.getElementById('cd-proj');
  var veil      = document.getElementById('cd-veil');
  var veilSays  = document.getElementById('cd-veil-says');
  var navAnalyze = document.getElementById('cd-nav-analyze');
  var navClients = document.getElementById('cd-nav-clients');

  var SCREENS = {
    dashboard:   { title: 'Client dashboard',   nav: navClients },
    projections: { title: 'Projections module', nav: navAnalyze }
  };
  var screen = 'dashboard';

  function goTo(name, says) {
    if (screen === name) return;
    screen = name;

    veilSays.textContent = says || ('Opening the ' + SCREENS[name].title.toLowerCase());
    veil.hidden = false;

    window.setTimeout(function () {
      dashBody.hidden = name !== 'dashboard';
      projBody.hidden = name !== 'projections';
      pageTitle.textContent = SCREENS[name].title;

      /* THE NAV SAYS WHERE YOU ARE. Exactly one item carries
         `aria-current`, which is both the thing a screen reader announces
         and the thing the white pill is drawn from. */
      [navClients, navAnalyze].forEach(function (b) {
        if (b) b.removeAttribute('aria-current');
      });
      if (SCREENS[name].nav) SCREENS[name].nav.setAttribute('aria-current', 'page');

      veil.hidden = true;
    }, 900);
  }

  /* THE TWO DOORS. The widget's own button is the designed route; the nav
     item is the one a reader will try anyway, and a prototype that ignores
     it reads as broken rather than as unfinished. */
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('button') : null;
    if (!t) return;
    if (/-visit$/.test(t.id))   { goTo('projections', 'Opening the latest projection'); return; }
    if (t === navAnalyze)       { goTo('projections'); return; }
    if (t === navClients)       { goTo('dashboard'); return; }
  });

  /* =======================================================================
     7 - THE NUDGE
     =======================================================================
     The same two-step tour the projections module uses, pointed at this
     page's journey: open Client health, then open the latest projection.

     THE SECOND STEP CANNOT EXIST UNTIL THE FIRST HAS HAPPENED, because the
     thing it points at is inside a tab that is not showing yet. So step one
     waits on the tab being chosen, exactly as the other screen's step two
     waits on its menu being opened.

     IT ENDS THE MOMENT THEY DO IT, and never comes back. A nudge that
     reappears after you have done what it asked is not help, it is
     nagging. */
  var coach = { at: 0, done: false };
  var coach1 = document.getElementById('cd-coach-1');
  var coach2 = document.getElementById('cd-coach-2');
  var healthTab = document.getElementById('cd-tab-health');

  function visitButton() {
    return document.querySelector('#cd-pane-health [id$="-visit"]');
  }

  /* THE BUBBLE MOVES HOUSE ONCE. It is written into index.html so it has a
     name you can change, but it belongs in the widget's footer, and that
     footer is built by js/widget.js after this page is parsed. */
  function homeCoach2() {
    var btn = visitButton();
    if (!btn || coach2.parentElement === btn.parentElement) return;
    btn.parentElement.appendChild(coach2);
  }

  /* AIM THE FIRST ARROW AT THE MIDDLE OF THE TAB. Both numbers are the
     layout's own unscaled pixels, so this holds at any scale of the
     canvas - which is the whole reason it is measured from `offsetLeft`
     rather than from a rectangle on the screen. */
  function aimAt(tip, target) {
    if (!tip || !target) return;
    tip.style.setProperty('--cd-at',
      (target.offsetLeft + target.offsetWidth / 2) + 'px');
  }

  function paintCoach() {
    var on1 = !coach.done && coach.at === 0;
    var on2 = !coach.done && coach.at === 1;

    coach1.hidden = !on1;
    coach2.hidden = !on2;
    if (healthTab) healthTab.classList.toggle('is-coached', on1);

    var btn = visitButton();
    if (btn) btn.classList.toggle('is-coached', on2);

    if (on1) aimAt(coach1, healthTab);
    if (on2 && btn) {
      aimAt(coach2, btn);
      /* THE DECK SCROLLS, and the widget is below the fold when the tab
         opens. A tooltip pointing at something off the bottom of the page
         is worse than no tooltip. */
      btn.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  function endCoach() { coach.done = true; paintCoach(); }

  if (coach1 && coach2) {
    tablist.addEventListener('click', function (e) {
      if (coach.done) return;
      var tab = e.target.closest ? e.target.closest('[role="tab"]') : null;
      if (!tab) return;
      window.setTimeout(function () {
        homeCoach2();
        coach.at = (tab === healthTab) ? 1 : 0;
        paintCoach();
      }, 0);
    });

    /* EITHER DOOR ENDS IT. They were being led to the projections module;
       arriving by the nav instead of by the button is still arriving. */
    document.addEventListener('click', function (e) {
      if (coach.done) return;
      var t = e.target.closest ? e.target.closest('button') : null;
      if (!t) return;
      if (/-visit$/.test(t.id) || t === navAnalyze) endCoach();
    });

    paintCoach();
  }

  /* =======================================================================
     8 - LIGHT / DARK
     =======================================================================
     The whole theme turns on ONE attribute on <body>: every colour in the
     page, the widget included, is a token whose value is swapped by
     `[data-mode="dark"]` in salt-theme-caraxes.css. Nothing here knows
     any colour. */
  var body = document.body;
  var modeBtn = document.getElementById('cd-mode');
  if (modeBtn) {
    modeBtn.setAttribute('aria-pressed', 'false');
    modeBtn.addEventListener('click', function () {
      var dark = body.getAttribute('data-mode') === 'dark';
      body.setAttribute('data-mode', dark ? 'light' : 'dark');
      modeBtn.setAttribute('aria-pressed', dark ? 'false' : 'true');
    });
  }
})();
