/* cs-fancy.js — the stack of accordions, and the three things <details>
   does not do by itself.

   =========================================================================
   WHAT THIS FILE IS, AND IS NOT
   =========================================================================

   Every accordion on the strip-fancy-accordion slide is a real <details>
   with a <summary> inside it. So opening and closing, the keyboard, and
   what a screen reader announces are all the browser's job and none of
   them are written down anywhere - which is the point. There is no code
   here that can get those wrong.

   WHICH MEANS THIS FILE IS OPTIONAL. If it never loads, every accordion
   still opens and closes; it just opens as many at a time as the reader
   presses, forgets which was open when they scroll away, and snaps shut
   without playing the closing movement. A slide that half-works is worth a
   great deal more than one that does nothing, and that is why the markup
   is <details> rather than a div with a click listener.

   What this file adds is the three things <details> has no opinion about:

       ONE AT A TIME     opening one closes whichever was open
       REMEMBERING       which one, per slide, for this visit only
       THE WAY DOWN      the closing movement, and re-measuring after

   =========================================================================
   WHY NOT <details name="..."> FOR THE ONE-AT-A-TIME
   =========================================================================

   Browsers can do this themselves now: give every <details> in a group the
   same `name` and they behave as an exclusive accordion with no script at
   all. It is tempting and it was tried.

   THE TROUBLE IS THAT IT CANNOT BE THE ONLY ANSWER. Not every browser a
   reader might arrive with has it yet, so the script has to be able to do
   the same job - and then two things are doing it. In the browsers with
   both, the one that closes a panel is the BROWSER, instantly, before this
   file hears about it. So the panel that opens glides and the panel that
   closes vanishes, on some machines and not others, for no reason anybody
   looking at the page could work out.

   One owner for one rule. The `name` is not set, and this file decides.

   =========================================================================
   WHY CLOSING NEEDS HELP AND OPENING DOES NOT
   =========================================================================

   A <details> shows its contents the instant `open` is set, so the opening
   movement plays over content that is already there. Closing is the other
   way round: the browser takes the contents away the instant `open` is
   removed, and the movement has nothing left to play over.

   So a close is held: the panel is marked as closing, the movement runs,
   and `open` comes off at the end of it. The length of that wait is read
   off the element's own transition rather than written down here, so
   changing the feel in cs-slides.css changes it everywhere and this file
   never disagrees with the stylesheet.

   =========================================================================
   AND THE PAGE HAS JUST CHANGED HEIGHT
   =========================================================================

   This is the slide with no height of its own, so opening an accordion
   moves everything below it down the page. Three other parts of the page
   measured the old positions:

       the drawn outlines are drawn to fit the box they are on
       the parallax knows where each slide sits in the document
       a scrolling panel knows whether it needs to scroll

   All three are asked again once the movement has finished, not during it
   - measuring something mid-journey gives an answer that is wrong by the
   time it lands. */
window.CS = window.CS || {};
(function (CS) {
  'use strict';

  var KEY = 'cs-fancy-open';
  var CLOSING = 'is-fancy-closing';

  function remembered() {
    try { return JSON.parse(sessionStorage.getItem(KEY) || '{}') || {}; }
    catch (e) { return {}; }
  }

  function remember(slideId, accId) {
    try {
      var all = remembered();
      if (accId) all[slideId] = accId; else all[slideId] = '';
      sessionStorage.setItem(KEY, JSON.stringify(all));
    } catch (e) { /* storage blocked: the accordions still work */ }
  }

  /* HOW LONG THE MOVEMENT TAKES, ASKED OF THE ELEMENT rather than written
     down twice. getComputedStyle gives it as '0.32s' or '320ms'; either
     way this turns it into a number of milliseconds, and an element with
     no transition at all - which is what "reduce motion" leaves - gives 0
     and the close happens at once, which is correct. */
  function movementOf(node) {
    if (!node || !window.getComputedStyle) return 0;
    var v = window.getComputedStyle(node).transitionDuration || '0s';
    var first = v.split(',')[0].trim();
    var n = parseFloat(first) || 0;
    return first.indexOf('ms') > -1 ? n : n * 1000;
  }

  /* A SLIDE NEEDS A NAME TO BE REMEMBERED BY. Its own id when content.js
     gave it one, otherwise its place in the running order, which is stable
     for as long as the running order is. */
  function nameOf(slide, i) {
    return slide.id || ('fancy-' + i);
  }

  CS.initFancyAccordions = function (root) {
    var was = remembered();
    var slides = (root || document).querySelectorAll('.t-strip-fancy-accordion');

    for (var s = 0; s < slides.length; s++) {
      (function (slide, s) {
        if (slide.csFancyWired) return;     /* a pane coming back is already wired */
        var items = [].slice.call(slide.querySelectorAll('.cs-fancy-item'));
        if (!items.length) return;
        slide.csFancyWired = true;

        var id = nameOf(slide, s);

        /* WHAT THIS READER LEFT OPEN, if they were here a moment ago.

           An empty string means "they closed them all", which is a real
           answer and a different one from never having touched the slide -
           so it is stored, and `undefined` is what "never touched" looks
           like. Without that distinction, closing the last one and
           scrolling away would reopen the first on the way back, which
           reads as the page arguing. */
        var want = was[id];
        if (want !== undefined) {
          items.forEach(function (it) {
            var should = (it.dataset.csFancy === want);
            if (it.open === should) return;
            /* MARKED AS OUR OWN DOING BEFORE IT IS CHANGED. Setting `open`
               fires a toggle, and a toggle that this file caused must not
               be read as a reader pressing something - restoring a
               remembered state would otherwise write a new, wrong state
               over the one it was restoring. */
            it.csSelfClose = true;
            it.open = should;
          });
        }

        /* AFTER THE HEIGHT HAS SETTLED, ask the three things that measured
           the old one to measure again. */
        function settle(wait) {
          window.setTimeout(function () {
            if (CS.strokes && CS.strokes.refresh) CS.strokes.refresh();
            if (CS.remeasureScrollers) CS.remeasureScrollers(slide);
            if (CS.refreshParallax) CS.refreshParallax();
          }, wait + 40);
        }

        /* CLOSING IS HELD OPEN WHILE IT MOVES. The class is what the
           stylesheet watches: it pulls the panel shut while `open` is
           still set, so there is something on the screen for the movement
           to happen to. `open` comes off at the end. */
        function close(it, wait) {
          if (!it.open) return;
          if (!wait) { it.csSelfClose = true; it.open = false; return; }
          it.classList.add(CLOSING);
          window.setTimeout(function () {
            it.csSelfClose = true;
            it.open = false;
            it.classList.remove(CLOSING);
          }, wait);
        }

        items.forEach(function (it) {
          /* THE TOGGLE EVENT, NOT A CLICK. A <details> can be opened by a
             click, by the keyboard, by find-in-page reaching inside it, and
             by another script - and `toggle` is the one thing all four go
             through. Listening for clicks would miss three of them. */
          it.addEventListener('toggle', function () {
            /* A TOGGLE THIS FILE CAUSED IS NOT A READER PRESSING ANYTHING.
               Without this, closing the panel that was open in order to
               open another one would be read as "they closed it", and the
               thing just opened would be forgotten a tick after it
               opened. */
            if (it.csSelfClose) { it.csSelfClose = false; return; }

            var reveal = it.querySelector('.cs-fancy-reveal');
            var wait = movementOf(reveal);

            if (it.open) {
              items.forEach(function (other) {
                if (other !== it) close(other, wait);
              });
              remember(id, it.dataset.csFancy);
            } else {
              remember(id, '');
            }
            settle(wait);
          });
        });

        /* UP AND DOWN MOVE BETWEEN THE TITLES, Home and End to the ends.
           A reader on a keyboard already has Tab, which walks the whole
           page; this is the shortcut that says "these five bars are one
           thing", and it is what every accordion a reader has met before
           does. Enter and Space are the browser's own and are not touched. */
        var heads = [].slice.call(slide.querySelectorAll('.cs-fancy-head'));
        heads.forEach(function (head, i) {
          head.addEventListener('keydown', function (e) {
            var to = null;
            if (e.key === 'ArrowDown') to = heads[i + 1];
            else if (e.key === 'ArrowUp') to = heads[i - 1];
            else if (e.key === 'Home') to = heads[0];
            else if (e.key === 'End') to = heads[heads.length - 1];
            if (!to) return;
            e.preventDefault();
            to.focus();
          });
        });
      })(slides[s], s);
    }
  };
})(window.CS);
