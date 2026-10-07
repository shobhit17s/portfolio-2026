/* common/theme.js — light or dark, for the whole site.

   The switch used to live inside a case study, which meant the setting only
   existed on that page: go back to the worlds and you were in the dark again.
   It belongs to the SITE, so it lives here, in the folder both the landing
   page and every case study already read from.

   Two things make it work across pages:

     1. The choice is written on the <html> element, as data-cs-mode. Every
        stylesheet on the site reads its colours from that one attribute, so
        one line changes the whole page.
     2. The choice is remembered in localStorage, which is the browser's own
        notepad for a site. It survives moving between pages, closing the tab,
        and coming back tomorrow.

   This file must load in the <head>, BEFORE any stylesheet does its work, so
   the page is never painted in the wrong mode and then corrected - which the
   reader would see as a flash. */
(function () {
  'use strict';

  var KEY = 'hw-mode';
  var root = document.documentElement;

  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function remember(mode) {
    try { localStorage.setItem(KEY, mode); } catch (e) { /* private window */ }
  }

  function current() {
    return root.getAttribute('data-cs-mode') === 'light' ? 'light' : 'dark';
  }

  function apply(mode) {
    root.setAttribute('data-cs-mode', mode === 'light' ? 'light' : 'dark');

    /* Every switch on the page says what it will do next, not what is on. */
    var word = mode === 'light' ? 'dark mode' : 'light mode';
    var all = document.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < all.length; i++) {
      /* Two kinds of switch live on this site.

         The PILL (common/switch.css) has a drawing and two words inside it,
         and everything it does is driven by the data-cs-mode attribute set
         one line above - so all this has to do is keep the label a screen
         reader hears in step with it. Writing text into it would throw its
         insides away, which is what the marker below is for.

         The PLAIN CHIP is just the words "light mode", and it still needs
         them written. */
      if (all[i].hasAttribute('data-theme-switch')) {
        all[i].setAttribute('aria-checked', mode === 'light' ? 'true' : 'false');
      } else {
        all[i].textContent = word;
      }
      all[i].setAttribute('aria-label', 'Switch to ' + word);
    }
  }

  /* Dark unless the reader has said otherwise. The page is drawn dark, so
     that is the honest default rather than following the operating system. */
  apply(stored() || 'dark');

  function toggle() {
    var next = current() === 'light' ? 'dark' : 'light';
    apply(next);
    remember(next);
    /* anything that has to redraw itself - the planets, the drawn outlines -
       listens for this rather than polling */
    window.dispatchEvent(new CustomEvent('hw:mode', { detail: { mode: next } }));
    return next;
  }

  function wire() {
    apply(current());
    var all = document.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < all.length; i++) {
      if (all[i].dataset.themeWired) continue;
      all[i].dataset.themeWired = '1';
      all[i].addEventListener('click', toggle);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();

  window.HWTheme = { toggle: toggle, current: current, apply: apply, wire: wire };
})();


