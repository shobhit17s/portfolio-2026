/* ============================================================================
   hw-copy.js — puts the words from common/landing-copy.js into the page.

   THIS FILE DECIDES NOTHING. Every word it writes comes from that one file,
   and every size it leaves alone comes from block 2e of
   common/type-scale.css. If you are looking for something to change, it is
   almost certainly in one of those two and not in here.

   THE RULE IT KEEPS, AND WHY IT MATTERS:

       A MISSING KEY LEAVES WHAT THE PAGE ALREADY SAYS.

   index.html carries today's wording written into it, so the page reads
   before a single script has run - which is what a search engine sees, what
   somebody with JavaScript turned off sees, and what you see for the
   half-second before this file does its work. If a key is absent, empty, or
   the whole copy file failed to load, nothing is overwritten and the page
   keeps the words it was born with. The failure case is "slightly out of
   date", never "blank".

   That is also why nothing in here throws. A copy file is the kind of file
   that gets a comma deleted at eleven at night; it should never be able to
   take the planets down with it.
   ========================================================================= */
window.HW = window.HW || {};
(function (HW) {
  'use strict';

  /* Write `text` into the element, unless there is nothing worth writing.
     An empty string IS worth writing - that is how you clear the subtext -
     so the test is for absent rather than for falsy. */
  function say(id, text) {
    if (text === undefined || text === null) return;
    var node = document.getElementById(id);
    if (node) node.textContent = text;
  }

  HW.applyCopy = function () {
    var C = (window.SITE && SITE.LANDING) || null;
    if (!C) return;

    /* ---------- the browser tab ---------- */
    if (C.tab) document.title = C.tab;
    if (C.description) {
      var meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute('content', C.description);
    }

    /* ---------- the header ---------- */
    if (C.masthead) {
      say('hw-wordmark-text', C.masthead.name);
      say('hw-wordmark-subtext', C.masthead.subtext);
    }

    /* ---------- the four worlds ----------

       THE PARAGRAPHS ARE REBUILT, NOT EDITED. A world may have one
       paragraph today and three tomorrow, and matching a list of sentences
       against whatever paragraphs happen to be in the markup is the kind of
       job that works until the day the two lists are different lengths. So
       the title is kept and the body is written fresh from the list. */
    if (C.panels) {
      Object.keys(C.panels).forEach(function (id) {
        var panel = document.getElementById('hw-world-' + id);
        var words = C.panels[id];
        if (!panel || !words) return;

        var title = panel.querySelector('.hw-panel-title');
        if (title && words.title) title.textContent = words.title;

        if (!Array.isArray(words.body)) return;
        var old = panel.querySelectorAll('.hw-panel-body');
        for (var i = 0; i < old.length; i++) old[i].remove();
        words.body.forEach(function (line) {
          var p = document.createElement('p');
          p.className = 'hw-panel-body';
          p.textContent = line;
          panel.appendChild(p);
        });
      });
    }

    /* ---------- the spin control ----------
       The word on each button is matched by `data-hw-copy`, never by its
       position, so reordering the three in the markup cannot silently swap
       their names round. */
    if (C.spin) {
      say('hw-spin-label', C.spin.label);
      var btns = document.querySelectorAll('.hw-spin-btn[data-hw-copy]');
      for (var b = 0; b < btns.length; b++) {
        var key = btns[b].getAttribute('data-hw-copy');
        if (C.spin[key]) btns[b].textContent = C.spin[key];
      }
    }

    /* ---------- the scroll note ----------
       One line now, on both screens. The older shape of this file had a
       `scroll` OBJECT with `desktop` and `phone` in it; if yours still does,
       the desktop one is used rather than nothing appearing at all. */
    if (typeof C.scroll === 'string') say('hw-scroll-hint-text', C.scroll);
    else if (C.scroll) say('hw-scroll-hint-text', C.scroll.desktop);
  };

  /* AS EARLY AS THERE IS A PAGE TO WRITE INTO. The planets take a moment to
     draw; the words should not wait for them. */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', HW.applyCopy);
  } else {
    HW.applyCopy();
  }
})(window.HW);
