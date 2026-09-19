/* cs-main.js — start everything, in the order the page needs it.

   The order matters and is worth stating: the page is EMPTY until the
   renderer runs. Everything after it is wiring up things the renderer has
   just made, so nothing here may run before it. */
window.CS = window.CS || {};
(function (CS) {
  'use strict';

  function boot() {
    /* 1. build the page out of this study's content */
    CS.render();

    /* 2. everything that needs those slides to exist */
    CS.drawArrows(document);
    CS.initViews();
    CS.initWireframes();
    CS.initDiagrams();
    CS.initPersonas();
    CS.initDrawer();
    CS.initParallax();
    CS.initChrome();

    /* 3. the drawn outlines go on last, once every panel has its real size */
    var draw = function () { CS.strokes.apply(document); };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
    requestAnimationFrame(draw);
    window.addEventListener('resize', function () {
      clearTimeout(CS._t);
      CS._t = setTimeout(function () { CS.strokes.refresh(); }, 180);
    });

    /* arriving from a planet: land on the slide that was clicked */
    if (location.hash && location.hash !== '#nutshell') {
      var target = document.querySelector(location.hash);
      if (target) setTimeout(function () { target.scrollIntoView({ block: 'center' }); }, 80);
    }

    document.body.classList.add('cs-ready');
  }

  /* A locked case study has nothing to render until the reader has been let
     in, so the page tells us to wait and calls CS.boot() itself afterwards. */
  CS.boot = boot;

  function start() {
    if (CS.AWAIT_UNLOCK) return;
    boot();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})(window.CS);

