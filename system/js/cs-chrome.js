/* cs-chrome.js — the page furniture that is not part of the story.

   =========================================================================
   WHAT IS LEFT IN HERE: GETTING THE TOP BAR OUT OF THE WAY ON A PHONE
   =========================================================================

   On a phone the page's own furniture - the "back to the worlds" bar, the
   thin progress line under it and the view bar under that - is fixed to the
   top of the screen and never moves. Together they are about 84 pixels, a
   tenth of an 844-tall phone, held permanently by something a reader needs
   about twice in a visit.

   WORSE, they are not alone up there any more. The tab series' bar follows
   the reader down the whole phase chapter, so inside that chapter there
   were TWO bars stacked at the top, taking a fifth of the screen between
   them, and the one that mattered was the lower of the two.

   SO THE FURNITURE NOW HIDES WHEN YOU READ AND COMES BACK WHEN YOU LOOK UP.
   Scroll down - which is what reading is - and it slides away, leaving the
   phase bar alone against the top edge. Scroll up - which is almost always
   what wanting to leave is - and it slides back.

   It is the behaviour of a reading app rather than a website, and it is the
   right one here: the thing you are reading is the page, and the way out is
   something you ask for.

   =========================================================================
   THREE THINGS THAT MAKE IT FEEL RIGHT RATHER THAN TWITCHY
   =========================================================================

   A THRESHOLD, so a one-pixel wobble is not a decision. Four pixels of
   movement in one direction before anything happens. Without it a finger
   resting on a scrolling page makes the bar flicker.

   ALWAYS SHOWN AT THE TOP. Within the furniture's own height of the top of
   the page there is nothing to gain by hiding it and a reader who has just
   arrived should see where they are.

   AND IT MEASURES ITSELF. How far to move is read off the bars rather than
   typed in here, because the view bar is a different height on a study with
   two views and a phone is a different height from a laptop. `offsetTop`
   and `offsetHeight` are used rather than the drawn rectangle, because the
   drawn rectangle already includes the move and would shrink to nothing
   over a few scrolls.

   =========================================================================
   WHAT THE REST OF THE PAGE READS
   =========================================================================

       --cs-chrome-stack   how tall the furniture is, measured
       --cs-chrome-h       how far down a sticky bar must start to clear it:
                           the same number, or 0 while the furniture is away

   The tab series' bar sticks at `--cs-chrome-h`, so it rises to the top
   edge as the furniture leaves and drops back under it as it returns. One
   number, set in one place, and nothing else has to know.

   ON A LAPTOP NOTHING HIDES. There is room, and a bar that disappeared
   under a mouse wheel would be a surprise rather than a kindness. */
window.CS = window.CS || {};
(function (CS) {
  'use strict';

  var AWAY = 'cs-chrome-away';
  var THRESHOLD = 4;      /* pixels of travel before it counts as a direction */

  CS.initChrome = function () {
    var root = document.documentElement;
    var phone = window.matchMedia('(max-width: 820px)');
    var bars = ['cs-topbar', 'cs-progress', 'cs-viewbar']
      .map(function (id) { return document.getElementById(id); })
      .filter(Boolean);
    if (!bars.length) return;

    var stack = 0;
    var away = false;
    var last = window.scrollY;
    var ticking = false;

    /* THE UNMOVED HEIGHT. `offsetTop + offsetHeight` is where a bar sits in
       the layout, which a transform does not change - unlike the drawn
       rectangle, which would report where the bar currently IS and so get
       smaller every time this ran. */
    function measure() {
      stack = bars.reduce(function (n, b) {
        return Math.max(n, b.offsetTop + b.offsetHeight);
      }, 0);
      root.style.setProperty('--cs-chrome-stack', stack + 'px');
      apply();
    }

    function apply() {
      var hidden = away && phone.matches;
      document.body.classList.toggle(AWAY, hidden);
      root.style.setProperty('--cs-chrome-h', (hidden ? 0 : stack) + 'px');
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        ticking = false;
        var y = window.scrollY;
        var was = away;

        if (y <= stack + 8) away = false;              /* at the top: always there */
        else if (y > last + THRESHOLD) away = true;    /* going down: reading */
        else if (y < last - THRESHOLD) away = false;   /* going up: leaving */

        if (Math.abs(y - last) > THRESHOLD) last = y;
        if (away !== was) apply();
      });
    }

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () {
      /* a phone turned on its side crosses 820, and a bar left hidden on a
         laptop would be a bar nobody can get back */
      if (!phone.matches) away = false;
      measure();
    });
  };
})(window.CS);

