/* cs-chrome.js — the page furniture that is not part of the story.

   Right now that is one thing: the switch between the dark and the light
   reading of the page.

   This file replaces cs-shortcuts.js, which used to let a reader press `s`
   to turn the drawn outlines off and `g` / `w` to lay measuring grids over
   the slides. Those were working tools for checking the layout against the
   spec sheets, not things a reader should be able to reach: the drawn line
   IS the page, so switching it off is not a view of the case study, it is a
   broken one. The grids have gone with them. */
window.CS = window.CS || {};
(function (CS) {
  'use strict';

  CS.initChrome = function () {
    var themeBtn = document.getElementById('cs-theme');
    if (!themeBtn) return;

    themeBtn.addEventListener('click', function () {
      var root = document.documentElement;
      var light = root.getAttribute('data-cs-mode') === 'light';
      root.setAttribute('data-cs-mode', light ? 'dark' : 'light');
      themeBtn.textContent = light ? 'light mode' : 'dark mode';
    });
  };
})(window.CS);

