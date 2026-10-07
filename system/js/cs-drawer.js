/* cs-drawer.js — the drawer.
   Anything in the copy marked as worth digging into opens a panel over the
   slides: from the right on a desktop, up from the bottom on a phone. The
   whole move takes 1200ms, and the contents arrive a beat after the panel. */
window.CS = window.CS || {};
(function (CS) {
  'use strict';

  CS.initDrawer = function () {
    var drawer = document.getElementById('cs-drawer');
    var scrim = document.getElementById('cs-scrim');
    if (!drawer) return;
    var titleEl = document.getElementById('cs-drawer-title');
    var contentEl = document.getElementById('cs-drawer-content');
    var closeBtn = document.getElementById('cs-drawer-close');

    /* Pictures named in a drawer are relative to this study's own assets
       folder, which is where the rest of its drawings live. */
    window.SITE = window.SITE || {};
    SITE.assetBase = 'assets/';
    /* ...but a SHARED drawer (common/drawers.js) names pictures that belong
       to the whole site, not to this study, and those sit two folders up. */
    SITE.sharedBase = '../../assets/';
    var opener = null;

    function open(id) {
      /* This study's own drawers first, then the ones shared with the rest
         of the site (common/drawers.js). A study can therefore override a
         shared panel simply by using the same name in its own `drawers`
         block - which is the right way round: the specific wins. */
      var mine = (CS.CASE_STUDY && CS.CASE_STUDY.drawers) || {};
      var shared = (window.SITE && SITE.DRAWERS) || {};
      var d = mine[id] || shared[id];
      if (!d) return;
      titleEl.textContent = d.title || '';
      /* The contents are not this file's business any more. One shared
         renderer builds them (common/drawer-content.js) so a drawer looks
         and behaves the same here as it does on the landing page - and a
         panel that is only words is simply a list with one text block in
         it, rather than a special case with things to hide. */
      SITE.drawerContent(contentEl, d);
      document.body.classList.add('cs-drawer-open');
      drawer.setAttribute('aria-hidden', 'false');
      setTimeout(function () { closeBtn.focus(); }, 420);
    }

    function close() {
      document.body.classList.remove('cs-drawer-open');
      drawer.setAttribute('aria-hidden', 'true');
      if (opener) opener.focus();
    }

    /* Openers are built by the renderer, and some of them appear later than
       this runs, so the click is caught on the way up rather than bound to
       each one. */
    document.addEventListener('click', function (e) {
      var el = e.target.closest && e.target.closest('[data-cs-drawer]');
      if (!el) return;
      opener = el;
      open(el.dataset.csDrawer);
    });

    closeBtn.addEventListener('click', close);
    scrim.addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('cs-drawer-open')) close();
    });

    CS.drawer = { open: open, close: close };
  };
})(window.CS);


