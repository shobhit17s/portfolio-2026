/* ===========================================================================
   core.js — the handful of things every other file needs: the namespace, a
   few element helpers, the icons, the one piece of state, and the little
   message bus the nudge listens on.

   THE SHAPE OF THIS BUILD
   -----------------------
       core.js     this file: helpers, state, the bus, menus
       charts.js   two inline SVG charts, which know nothing about KIMs
       panel.js    the view selector on the left
       views.js    the three screens inside the card
       drawer.js   the trend panel
       coach.js    the four-step nudge
       app.js      wires them together and starts

   Each file attaches one object to `window.KIM` and calls nothing at load
   time. app.js, which loads last, is the only file that starts anything —
   so the order of the <script> tags is the only thing that has to be right.
   =========================================================================== */
window.KIM = window.KIM || {};

(function (KIM) {
  'use strict';

  KIM.$ = function (id) { return document.getElementById(id); };

  KIM.el = function (tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  KIM.clear = function (node) { while (node.firstChild) node.removeChild(node.firstChild); return node; };

  /* ---------------------------------------------------------------------
     THE ICONS
     ---------------------------------------------------------------------
     Written once, as paths, and stamped out when asked for. Every one is
     drawn on a 16 x 16 box and inherits its colour, and shell.css ties
     them all to the size of the text beside them. */
  var PATHS = {
    chev: '<path d="M4 6l4 4 4-4"/>',
    right: '<path d="M6 3.5L10.5 8 6 12.5"/>',
    search: '<circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/>',
    info: '<rect x="2.5" y="2.5" width="11" height="11"/><path d="M8 7v4M8 5.2v.6"/>',
    up: '<path d="M8 13V3M4 6.5L8 3l4 3.5"/>',
    down: '<path d="M8 3v10M4 9.5L8 13l4-3.5"/>',
    trend: '<path d="M2 12l3.5-5 3 2.5L13 3"/><path d="M9.6 3H13v3.4"/>',
    close: '<path d="M4 4l8 8M12 4l-8 8"/>',
    check: '<path d="M3.5 8.5l3 3 6-6.5"/>'
  };

  /* A STAR IS THE ONE FILLED ICON, because an outline star and a filled one
     is how every product on earth says "favourite" — and the difference has
     to survive being seen in grey. */
  var STAR = 'M8 1.9l1.85 3.9 4.15.6-3 3 .7 4.3L8 11.7 4.3 13.7l.7-4.3-3-3 4.15-.6z';

  KIM.icon = function (name, cls) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 16 16');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.4');
    if (cls) svg.setAttribute('class', cls);
    svg.innerHTML = PATHS[name] || '';
    return svg;
  };

  KIM.star = function (on) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 16 16');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('class', 'kim-star' + (on ? ' is-on' : ''));
    svg.setAttribute('fill', on ? 'currentColor' : 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.2');
    svg.innerHTML = '<path d="' + STAR + '"/>';
    return svg;
  };

  /* ---------------------------------------------------------------------
     NUMBERS
     --------------------------------------------------------------------- */
  KIM.num = function (v) {
    if (v == null) return '—';
    return (Math.round(v * 10) / 10).toLocaleString('en-GB', { minimumFractionDigits: 0 });
  };
  KIM.pct = function (v) {
    var s = (Math.round(v * 100) / 100).toFixed(2);
    return (v < 10 ? '0' : '') + s + ' %';
  };
  /* TWO DIGITS, ALWAYS, because your sheets write 04 / 07 rather than 4 / 7
     — and a column of counts that all have the same width is a column the
     eye can compare without reading. */
  KIM.pad2 = function (n) { return (n < 10 ? '0' : '') + n; };

  /* ---------------------------------------------------------------------
     THE STATE
     ---------------------------------------------------------------------
     Everything the screen is, in one object. Nothing else keeps a copy:
     a view reads this, draws, and forgets. */
  KIM.state = {
    group: 'favorites',     /* favorites | industry | country */
    view: 'overview',       /* overview | sub | metric */
    subId: null,
    metricName: null,
    matOnly: true,
    layout: 'grid',         /* grid | list */
    openGroups: {},
    openCats: { volume: true, price: true, cost: true },
    /* quarterly / annual: is the group on the grid at all (the Columns
       menu). qOpen / yOpen: is it open (the arrow in its own header).
       Annual starts closed, showing the latest year only, which is what
       the sheets draw. */
    cols: { quarterly: true, annual: true, qOpen: true, yOpen: false }
  };

  /* ---------------------------------------------------------------------
     THE BUS
     ---------------------------------------------------------------------
     The nudge has to know when a grouping was chosen, a sub-industry
     opened, a trend read and a KIM searched — four things that happen in
     four different files. Without a bus, each of those files would have to
     know the nudge exists, which is exactly the coupling that makes a
     tour impossible to remove later. With it, they announce what they did
     and carry on, and coach.js is the only file that listens. */
  var subs = {};
  KIM.on = function (name, fn) { (subs[name] = subs[name] || []).push(fn); };
  KIM.emit = function (name, data) {
    (subs[name] || []).forEach(function (fn) { fn(data); });
  };

  /* ---------------------------------------------------------------------
     MENUS
     ---------------------------------------------------------------------
     One open menu at a time, closed by a press anywhere else or by Escape,
     which hands focus back to the button that opened it. */
  var openMenu = null;

  function closeMenu() {
    if (!openMenu) return;
    openMenu.btn.setAttribute('aria-expanded', 'false');
    openMenu.menu.hidden = true;
    openMenu = null;
  }
  KIM.closeMenu = closeMenu;

  document.addEventListener('click', function (e) {
    if (openMenu && !e.target.closest('.kim-menuwrap, .kim-colswrap')) closeMenu();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && openMenu) { var b = openMenu.btn; closeMenu(); b.focus(); }
  });

  KIM.wireMenu = function (btn, menu, onPick) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var wasOpen = openMenu && openMenu.btn === btn;
      closeMenu();
      if (wasOpen) return;
      menu.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
      openMenu = { btn: btn, menu: menu };
      KIM.emit('menu-open', btn.id);
    });

    menu.addEventListener('click', function (e) {
      var item = e.target.closest('.kim-menu-item');
      if (!item) return;
      /* A MENU OF CHECKBOXES STAYS OPEN. Choosing a column is rarely one
         choice — it is three or four — and a menu that shuts after each
         one makes the reader open it again every time. */
      if (item.getAttribute('role') !== 'menuitemcheckbox') { closeMenu(); btn.focus(); }
      if (onPick) onPick(item.dataset.kimValue, item);
    });
  };

})(window.KIM);
