/* lofi-main.js — starts everything, once.

   A prototype links this last and never calls anything itself. Each init
   takes an optional root, so a prototype that builds part of a screen
   later can wire just that part:  LOFI.initTabs(newSection). */
window.LOFI = window.LOFI || {};
(function (LOFI) {
  'use strict';

  /* ORDER MATTERS ONLY ONCE: icons go in before anything measures itself,
     because an icon that arrives late changes the width of the button it
     is in. Everything after that is independent. */
  LOFI.start = function (root) {
    if (LOFI.initStage)     LOFI.initStage(root);
    if (LOFI.initIcons)     LOFI.initIcons(root);
    if (LOFI.initTabs)      LOFI.initTabs(root);
    if (LOFI.initSegmented) LOFI.initSegmented(root);
    if (LOFI.initMenus)     LOFI.initMenus(root);
    if (LOFI.initCombos)    LOFI.initCombos(root);
    if (LOFI.initMulti)     LOFI.initMulti(root);
    if (LOFI.initCoach)     LOFI.initCoach(root);
    if (LOFI.initOverlays)  LOFI.initOverlays(root);
    if (LOFI.initTables)    LOFI.initTables(root);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { LOFI.start(); });
  } else {
    LOFI.start();
  }
})(window.LOFI);
