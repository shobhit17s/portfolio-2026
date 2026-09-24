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
    var drawer = document.getElementById('hw-drawer');
    if (!drawer) return { open: function () {}, close: function () {} };

    var scrim = document.getElementById('hw-drawer-scrim');
    var titleEl = document.getElementById('hw-drawer-title');
    var bodyEl = document.getElementById('hw-drawer-body');
    var noteEl = document.getElementById('hw-drawer-note');
    var closeBtn = document.getElementById('hw-drawer-close');
    var opener = null;

    function open(id) {
      var all = (window.SITE && SITE.DRAWERS) || {};
      var d = all[id];
      if (!d) return;
      titleEl.textContent = d.title || '';
      bodyEl.innerHTML = (d.body || []).map(function (p) {
        return '<p>' + p + '</p>';
      }).join('');
      noteEl.innerHTML = d.note || '';
      noteEl.hidden = !d.note;
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


