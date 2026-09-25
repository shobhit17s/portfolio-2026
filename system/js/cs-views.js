/* cs-views.js — two ways of reading the same case study.

   "In a nutshell" holds the two interactive pieces: the persona carousel and
   the app landscape. "The detailed story" holds the written slides. They
   are separate sets of slides now, so switching is simply a matter of showing
   one and hiding the other.

   The only subtlety is arriving from outside. A link from the planets can
   point at any slide, and the right view has to open for it — so before
   anything is shown, we look up where the target actually lives. */
window.HW = window.HW || {};   /* (the landing page's namespace, if present) */
window.CS = window.CS || {};
(function (CS) {
  'use strict';

  /* The note beside the tabs belongs to the case study, not the engine —
     the number of slides is different in every one. cs-render.js sets it. */
  function notes() {
    return CS.VIEW_NOTES ||
      { nutshell: 'Two pieces.', story: 'The slides, in order.' };
  }

  CS.initViews = function () {
    var views = {
      nutshell: document.getElementById('cs-view-nutshell'),
      story: document.getElementById('cs-view-story')
    };
    if (!views.nutshell || !views.story) return;
    var note = document.getElementById('cs-view-note');
    var tabs = [].slice.call(document.querySelectorAll('.cs-view-tab'));
    var current = null;

    function show(name, silent) {
      if (!views[name]) name = 'story';
      if (name === current) return;
      current = name;

      Object.keys(views).forEach(function (key) { views[key].hidden = key !== name; });
      tabs.forEach(function (t) {
        t.setAttribute('aria-selected', t.dataset.csView === name ? 'true' : 'false');
      });
      if (note) note.textContent = notes()[name];
      document.body.dataset.csView = name;

      // everything that measures itself has to measure again: the drawn
      // outlines, the tab overflow, and the parallax
      window.dispatchEvent(new Event('resize'));
      requestAnimationFrame(function () {
        if (CS.strokes) CS.strokes.refresh();
        if (!silent) window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    /* Which view is a given slide in? */
    function viewOf(selector) {
      if (!selector || selector === '#') return null;
      var el;
      try { el = document.querySelector(selector); } catch (e) { return null; }
      if (!el) return null;
      return views.nutshell.contains(el) ? 'nutshell'
           : views.story.contains(el) ? 'story' : null;
    }

    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        show(t.dataset.csView);
        try {
          history.replaceState(null, '',
            t.dataset.csView === 'nutshell' ? '#nutshell' : location.pathname + location.search);
        } catch (e) { /* some embeds do not allow the address to be rewritten */ }
      });
    });

    function fromHash(silent) {
      var hash = location.hash;
      show(hash === '#nutshell' ? 'nutshell' : (viewOf(hash) || 'story'), true);
      if (!silent && hash && hash !== '#nutshell') {
        var target = document.querySelector(hash);
        if (target) setTimeout(function () { target.scrollIntoView({ block: 'center' }); }, 60);
      }
    }

    /* Arriving at a slide by changing the address — a link from the planets, or
       the back button — has to open the view that slide lives in. */
    window.addEventListener('hashchange', function () { fromHash(false); });

    fromHash(true);

    CS.views = { show: show, viewOf: viewOf, current: function () { return current; } };
  };
})(window.CS);


