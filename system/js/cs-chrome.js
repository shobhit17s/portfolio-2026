/* cs-chrome.js — the page furniture that is not part of the story.

   There is nothing left in here.

   This file used to hold two things. The first was a set of keyboard
   shortcuts - `s` for drawn lines, `g` and `w` for measuring grids - which
   were working tools for checking the layout against the spec sheets, not
   things a reader should be able to reach. The drawn line IS the page, so
   switching it off is not a view of the case study, it is a broken one. They
   were removed.

   The second was the light / dark switch. That has moved to
   common/theme.js, because the choice belongs to the WHOLE SITE rather than
   to one case study: made here, it used to be forgotten the moment you went
   back to the worlds. The shared module finds the switch by its
   `data-theme-toggle` attribute and remembers the answer between pages.

   The file itself stays, with an empty function, so that the three pages
   which load it keep working unchanged. Delete it once they stop. */
window.CS = window.CS || {};
(function (CS) {
  'use strict';
  CS.initChrome = function () {};
})(window.CS);


