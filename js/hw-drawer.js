/* hw-drawer.js — the panel that slides in over the worlds.

   The case studies have had one of these for a while (system/js/
   cs-drawer.js). The landing page now has its own, because the pantheon on
   the yellow planet opens the same explanation that a word inside the case
   study opens, and it would be a strange thing to leave the worlds for.

   The two drawers are deliberately SEPARATE PIECES OF CODE reading ONE PIECE
   OF TEXT. They live on different pages with different furniture around
   them, so sharing the code would mean carrying the case study engine onto
   the landing page for the sake of one panel. What must not diverge is the
   words, and those are in common/drawers.js, read by both.

   What opens it:
     any element with data-hw-drawer="<name>"
     HW.drawer.open('<name>') - which is what a click on the pantheon calls */
window.HW = window.HW || {};
(function (HW) {
  'use strict';

  HW.createDrawer = function () {
    /* Pictures named in a drawer are relative to this page's assets folder.
       The case studies set their own. */
    window.SITE = window.SITE || {};
    SITE.assetBase = SITE.assetBase || 'assets/';
    /* On this page the site's shared pictures and the page's own pictures
       are the same folder. A drawer written with '~/' therefore lands in
       exactly the same place either way - which is why the shared drawers
       can be written once and read correctly here and inside a study. */
    SITE.sharedBase = SITE.sharedBase || 'assets/';

    var drawer = document.getElementById('hw-drawer');
    if (!drawer) return { open: function () {}, close: function () {} };

    var scrim = document.getElementById('hw-drawer-scrim');
    var titleEl = document.getElementById('hw-drawer-title');
    var contentEl = document.getElementById('hw-drawer-content');
    var closeBtn = document.getElementById('hw-drawer-close');
    var opener = null;

    function open(id) {
      var all = (window.SITE && SITE.DRAWERS) || {};
      var d = all[id];
      if (!d) return;
      titleEl.textContent = d.title || '';
      /* The contents are not this file's business any more. One shared
         renderer builds them (common/drawer-content.js) so a drawer looks
         and behaves the same here as it does inside a case study. */
      SITE.drawerContent(contentEl, d);
      document.body.classList.add('hw-drawer-open');
      drawer.setAttribute('aria-hidden', 'false');
      /* focus lands inside the panel, so a keyboard reader is not left
         behind on the page underneath */
      setTimeout(function () { closeBtn.focus(); }, 380);
    }

    function close() {
      document.body.classList.remove('hw-drawer-open');
      drawer.setAttribute('aria-hidden', 'true');
      if (opener && opener.focus) opener.focus();
    }

    /* Caught on the way up rather than bound to each opener, because some of
       them - the keyboard list of doors - are built after this runs. */
    document.addEventListener('click', function (e) {
      var el = e.target.closest && e.target.closest('[data-hw-drawer]');
      if (!el) return;
      e.preventDefault();
      opener = el;
      open(el.dataset.hwDrawer);
    });

    if (closeBtn) closeBtn.addEventListener('click', close);
    if (scrim) scrim.addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('hw-drawer-open')) close();
    });

    return { open: function (id) { opener = null; open(id); }, close: close };
  };
})(window.HW);


