/* cs-scrollers.js — a box only becomes a scroller when it actually has
   something to scroll.

   =========================================================================
   THE PROBLEM THIS SOLVES
   =========================================================================

   A box with `overflow: auto` is a SCROLL CONTAINER whether or not anything
   overflows it. Browsers hand the wheel to whatever scroll container is
   under the pointer, and a container with nothing to scroll does not pass
   the gesture on - it simply absorbs it. So a panel whose writing fitted
   comfortably inside it still stopped the page dead the moment the pointer
   crossed into it. Nothing was moving, and nothing else could move either.

   CSS cannot see this. "Is my content taller than me" is a measurement, not
   a condition a stylesheet can ask about, so the decision has to be made
   where measurements live. That is all this file is: measure, and set one
   class.

       nothing overflows   ->  overflow: hidden, the page scrolls normally
       something does      ->  .is-scrollable, the panel scrolls

   =========================================================================
   WHY IT HAS TO KEEP WATCHING
   =========================================================================

   The answer changes under us, and never because of anything the reader
   did deliberately:

       stepping a carousel swaps the writing beside it for different writing
       the window is resized, or a phone is turned
       a webfont finishes loading and every line re-wraps

   So this measures again on all three, rather than once at startup and
   hoping. A ResizeObserver covers the first two by watching the box and its
   content; `document.fonts.ready` covers the third.

   =========================================================================
   WHAT IT DELIBERATELY DOES NOT DO
   =========================================================================

   It does not trap the scroll. When the panel IS scrollable and the reader
   reaches its end, the page carries on from there - the browser's own
   behaviour, and the one the hand expects. The alternative,
   `overscroll-behavior: contain`, builds a wall the reader has to notice
   and steer around, and we had one until now. */
window.CS = window.CS || {};
(function (CS) {
  'use strict';

  /* Every kind of box that holds writing beside a fixed-size drawing. They
     are listed here rather than marked in the templates so that a new one
     cannot be added without this file being opened. */
  var SELECTOR = [
    '.cs-persona-explains-scroll',           /* the explains panel's inside */
    '.cs-wire-stage--split > .cs-steps-body', /* the plain column on 4 and 9 */
    '.cs-feedback-body',                     /* the cards under a feedback tab */
    '.cs-grid-scroll'                        /* the grid slide's window */
  ].join(',');

  /* A pixel of slack. Sub-pixel layout means a box can report one or two
     hundredths more content than room while looking perfectly full, and a
     scrollbar that appears for a hundredth of a line is worse than no
     scrollbar at all. */
  var SLACK = 1;

  function measure(box) {
    if (!box) return;
    /* The class itself changes the answer - a scrollbar takes width, which
       re-wraps the text, which can change its height. Measuring with the
       class off is the only reading that does not depend on the last one. */
    var had = box.classList.contains('is-scrollable');
    if (had) box.classList.remove('is-scrollable');
    /* EITHER DIRECTION COUNTS. This used to ask about height alone, which
       was true of everything it watched at the time - panels of writing,
       all of which only ever grow downwards. The grid slide broke that
       assumption: it can fit comfortably top to bottom and still have four
       more attributes off the right-hand edge, and measuring only the
       height would have left it with nothing to scroll sideways with. */
    var over = box.scrollHeight > box.clientHeight + SLACK ||
               box.scrollWidth  > box.clientWidth  + SLACK;
    if (over) box.classList.add('is-scrollable');

    /* AND IF IT STILL CANNOT SCROLL, SAY SO OUT LOUD.

       The class is on, so the stylesheet should have turned the box into a
       scroller. If it has not, some other rule is winning - and the result
       is writing that is quietly cut off with no scrollbar to find it
       with, which is the one failure here that a reader cannot see is a
       failure. It has happened once, when a drawn edge was added to the
       panel and the stroke layer's own rule pulled the scroller back into
       the flow.

       A warning rather than a fix, because the fix depends on which rule
       won and this file cannot know. */
    if (over) {
      var how = getComputedStyle(box);
      if (how.overflowY !== 'auto' && how.overflowY !== 'scroll' &&
          how.overflowX !== 'auto' && how.overflowX !== 'scroll') {
        /* eslint-disable-next-line no-console */
        console.warn('[cs-scrollers] content is taller than its box and the ' +
          'box is not scrolling - something is overriding `overflow`, and ' +
          'the writing is being cut off:', box);
      }
    }

    /* THE KEYBOARD FOLLOWS THE MOUSE. A box that cannot scroll should not
       be a tab stop - there is nothing to do there - and one that can
       should be, or the panel is reachable by mouse only. */
    if (over) {
      box.setAttribute('tabindex', '0');
    } else {
      box.removeAttribute('tabindex');
      /* nothing to scroll means nothing scrolled - in both directions */
      box.scrollTop = 0;
      box.scrollLeft = 0;
    }
  }

  function measureAll(root) {
    var list = (root || document).querySelectorAll(SELECTOR);
    for (var i = 0; i < list.length; i++) measure(list[i]);
  }

  CS.initScrollers = function (root) {
    /* THE STYLESHEET NEEDS TO KNOW THIS FILE IS RUNNING.

       A watched box rests at `overflow: hidden` on purpose - a scroll
       container with nothing to scroll swallows the wheel - and that
       resting state is only safe because this file is here to lift it the
       moment the writing is too long. If the file never loads, `hidden` is
       a box that crops its contents with no way to reach the rest.

       So the class goes on first, and the stylesheet keeps those boxes
       scrollable until it appears. The failure mode becomes a scrollbar
       that did not need to be there, instead of writing nobody can read. */
    document.documentElement.classList.add('cs-scrollers-on');

    measureAll(root || document);

    /* ---- when the answer changes ---- */
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
          var t = entries[i].target;
          /* the observer watches both the box and its contents, so the
             target may be either - walk up to the box itself */
          measure(t.matches(SELECTOR) ? t : t.closest(SELECTOR));
        }
      });
      var boxes = document.querySelectorAll(SELECTOR);
      for (var i = 0; i < boxes.length; i++) {
        ro.observe(boxes[i]);
        /* the children too: the box's own size does not change when the
           writing inside it is swapped for longer writing, but its
           children's sizes do */
        for (var j = 0; j < boxes[i].children.length; j++) {
          ro.observe(boxes[i].children[j]);
        }
      }
      CS._scrollRO = ro;
    } else {
      /* no ResizeObserver: measure on resize and move on. The class is a
         refinement, not the thing that makes the panel work. */
      window.addEventListener('resize', function () { measureAll(document); });
    }

    /* a webfont arriving re-wraps every line in the panel */
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { measureAll(document); });
    }

    /* CALLED BY HAND after anything replaces the writing in a panel - see
       cs-carousels.js, where stepping a diagram does exactly that. */
    CS.remeasureScrollers = measureAll;
  };

  /* Before this runs, and in the unlikely event it never does, every panel
     is simply `overflow: hidden` - the writing is clipped rather than the
     page being stuck. Of the two failures that is the right one: a clipped
     paragraph is visible and reportable, a page that will not scroll looks
     like the site is broken. */
  CS.remeasureScrollers = measureAll;
})(window.CS);
