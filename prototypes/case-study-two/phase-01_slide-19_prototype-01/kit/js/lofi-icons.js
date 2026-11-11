/* lofi-icons.js — CONTROL. One place every mark in the kit is drawn.

   A prototype asks for an icon by name instead of pasting SVG paths:

       btn.innerHTML = 'Export ' + LOFI.icon('export');

   or, with no script at all, by putting the name in the markup and
   letting LOFI.initIcons() fill it in:

       <i class="lofi-icon" data-lofi-icon="export"></i>

   WHY NOT JUST PASTE THE SVG. Because the second time a path is pasted it
   is already two paths, and by the fifth screen the export icon has three
   slightly different versions in the codebase. A name cannot drift.

   Every icon is drawn on a 24-unit square, with no fill and a 2-unit
   stroke in `currentColor`, so it takes the colour of whatever it is
   sitting in. Adding one means adding a line here and nothing else. */
window.LOFI = window.LOFI || {};
(function (LOFI) {
  'use strict';

  var P = {
    /* the three views */
    list:    '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.2"/><circle cx="4.5" cy="12" r="1.2"/><circle cx="4.5" cy="18" r="1.2"/>',
    trend:   '<path d="M3 17l5-5 4 3 6-7"/><path d="M15 8h4v4"/>',
    sparkle: '<path d="M12 3l1.7 4.8L18.5 9.5 13.7 11 12 16l-1.7-5L5.5 9.5l4.8-1.7z"/><path d="M18.5 15l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
    /* actions */
    export:  '<path d="M12 15V4"/><path d="M8.5 7.5L12 4l3.5 3.5"/><path d="M4 14v4.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V14"/>',
    sliders: '<path d="M5 20V14M5 10V4M12 20v-8M12 8V4M19 20v-4M19 12V4"/><path d="M2.5 12h5M9.5 8h5M16.5 16h5"/>',
    check:   '<path d="M4.5 12.5l5 5 10-11"/>',
    close:   '<path d="M5.5 5.5l13 13M18.5 5.5l-13 13"/>',
    search:  '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l4.5 4.5"/>',
    caret:   '<path d="M5 9l7 7 7-7"/>',
    kebab:   '<circle cx="12" cy="5" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.6" fill="currentColor" stroke="none"/>',
    eye:     '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>'
  };

  LOFI.icon = function (name, cls) {
    var d = P[name];
    if (!d) {
      /* LOUD RATHER THAN BLANK. An icon that is simply absent is a gap
         nobody notices until it ships; one that says its own name is a
         five-second fix. */
      if (window.console) console.warn('[lofi] no icon called "' + name + '"');
      return '<span class="lofi-icon-missing">' + name + '?</span>';
    }
    return '<svg class="lofi-icon ' + (cls || '') + '" viewBox="0 0 24 24" ' +
           'fill="none" stroke="currentColor" stroke-width="2" ' +
           'stroke-linecap="round" stroke-linejoin="round" ' +
           'aria-hidden="true" focusable="false">' + d + '</svg>';
  };

  LOFI.initIcons = function (root) {
    var holes = (root || document).querySelectorAll('[data-lofi-icon]');
    for (var i = 0; i < holes.length; i++) {
      var h = holes[i];
      if (h.dataset.lofiIconDone) continue;
      h.dataset.lofiIconDone = '1';
      h.innerHTML = LOFI.icon(h.dataset.lofiIcon);
    }
  };

  LOFI.iconNames = function () { return Object.keys(P); };
})(window.LOFI);
