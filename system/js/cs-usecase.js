/* cs-usecase.js — the strip that puts the use-case panel away.

   =========================================================================
   WHAT IT DOES
   =========================================================================

   Every use-case slide has a narrow upright strip against its right-hand
   edge. Pressing it slides the panel of writing out of sight and lets the
   drawing have the rest of the slide; pressing it again brings it back.

   ALL THE MOVEMENT IS CSS. This file sets one class on the slide and
   changes what the button says about itself. The widths, the padding and
   the chevron are all in cs-slides.css under `.t-use-case`, which is where
   anyone wanting to change how it feels should look.

       open     (no class)          the panel is showing
       closed   .is-uc-closed       only the strip is

   =========================================================================
   EACH SLIDE REMEMBERS ITS OWN ANSWER, AND ONLY FOR THIS VISIT
   =========================================================================

   Four use-case slides in a row, and a reader who closes the panel on the
   first one has said something about that slide, not about the other three
   - they have different writing in them. So the state is per slide.

   It is kept in sessionStorage rather than localStorage: coming back to the
   page in a week and finding the writing hidden, with no memory of having
   hidden it, is a page that looks broken. Within one visit, scrolling past
   a slide and back and finding it as you left it is simply correct.

   And it is wrapped in try/catch, because a browser with site data blocked
   throws on the mere act of asking. A reader who cannot store the answer
   still gets a working button; they just get the panel back when they
   return to the slide. */
window.CS = window.CS || {};
(function (CS) {
  'use strict';

  var CLOSED = 'is-uc-closed';
  var KEY = 'cs-uc-closed';

  /* THE PANEL STARTS PUT AWAY. The sheet of 29 October marks the collapsed
     state DEFAULT, and it is the right way round: the drawing at its full
     1376 is what the slide is FOR, and the writing is there for a reader
     who wants it. Opening a panel is a small, deliberate act; closing one
     that opened itself is a chore.

     What is remembered is therefore "this reader OPENED this slide", not
     "this reader closed it" - the memory stores the exception to the
     default, whichever way round the default is. */
  var DEFAULT_CLOSED = true;

  function remembered() {
    try {
      return JSON.parse(sessionStorage.getItem(KEY) || '{}') || {};
    } catch (e) { return {}; }
  }

  function remember(id, closed) {
    try {
      var all = remembered();
      /* only the EXCEPTION is written down - see DEFAULT_CLOSED above */
      if (closed !== DEFAULT_CLOSED) all[id] = 1; else delete all[id];
      sessionStorage.setItem(KEY, JSON.stringify(all));
    } catch (e) { /* storage blocked: the button still works, that is enough */ }
  }

  /* A slide needs a name to be remembered by. Its own id is the right one
     when content.js gave it one; otherwise its place in the running order
     will do, which is stable for as long as the running order is. */
  function nameOf(slide, i) {
    return slide.id || ('uc-' + i);
  }

  function setState(slide, rail, closed) {
    slide.classList.toggle(CLOSED, closed);
    rail.setAttribute('aria-expanded', closed ? 'false' : 'true');
    var says = rail.querySelector('.cs-uc-rail-says');
    if (says) says.textContent = closed ? 'Show the writing' : 'Hide the writing';

    /* THE DRAWING HAS JUST CHANGED SIZE, and two other parts of the page
       measured it before it did:

         the drawn outlines are drawn to fit the box they are on
         whether the panel needs a scrollbar depends on its width

       Both are re-done AFTER the slide has finished moving, not during -
       measuring something mid-journey gives an answer that is wrong by the
       time it lands. */
    window.setTimeout(function () {
      if (CS.strokes && CS.strokes.refresh) CS.strokes.refresh();
      if (CS.remeasureScrollers) CS.remeasureScrollers(slide);
    }, 520);
  }

  CS.initUseCases = function (root) {
    var was = remembered();

    var slides = (root || document).querySelectorAll('.t-use-case');
    for (var i = 0; i < slides.length; i++) {
      (function (slide, i) {
        var rail = slide.querySelector('.cs-uc-rail');
        if (!rail) return;                 /* nothing to wire */
        var id = nameOf(slide, i);

        /* WITHOUT THE NO-TRANSITION GUARD a panel remembered as closed would
           be drawn open and then visibly swing shut as the page settled,
           which looks like a fault rather than like a memory. */
        var closedNow = was[id] ? !DEFAULT_CLOSED : DEFAULT_CLOSED;
        slide.classList.add('cs-uc-instant');
        setState(slide, rail, closedNow);
        window.requestAnimationFrame(function () {
          window.requestAnimationFrame(function () {
            slide.classList.remove('cs-uc-instant');
          });
        });

        rail.addEventListener('click', function () {
          var closed = !slide.classList.contains(CLOSED);
          setState(slide, rail, closed);
          remember(id, closed);
        });
      })(slides[i], i);
    }
  };
})(window.CS);

