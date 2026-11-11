/* ===========================================================================
   cs-parallax.js — how a slide arrives, and the line at the top of the page
   that says how far through you are.

   ---------------------------------------------------------------------------
   WHAT IT DOES NOW, AND WHAT IT USED TO DO
   ---------------------------------------------------------------------------
   IT USED TO BREATHE. Every slide was nudged up or down and faded a little,
   continuously, by how far it sat from the middle of the screen — so a slide
   faded IN as it came up and back OUT again as it left, for ever, both ways.
   That is a lovely thing in principle and almost invisible in practice:
   nothing ever announced itself, because nothing ever finished.

   IT NOW ARRIVES. A slide starts a little low, invisible, and at 98.5% of its
   size; when it reaches the lower part of the screen it settles into place
   over about seven tenths of a second and STAYS there. Scrolling back up does
   not replay it.

   THE 1.5% OF SCALE IS THE WHOLE DIFFERENCE between a thing being switched on
   and a sheet of paper being laid down. Far too small to read as a zoom, just
   big enough that the slide feels like an object arriving.

   ---------------------------------------------------------------------------
   THE THREE RULES IT KEEPS
   ---------------------------------------------------------------------------
   1. NOTHING FADES WHILE IT IS BEING READ. The arrival finishes at full
      strength and nothing is animated afterwards, so no text is ever at a
      lower opacity than the contrast checks were run at. The old continuous
      version could not promise that — a slide at the edge of the screen sat
      at 0.58 for as long as you left it there.

   2. ANYTHING YOU HAVE ALREADY SCROLLED PAST IS SIMPLY THERE. A deep link
      (#cs-slide-19), a reload half way down, a fast flick — all of them land
      on slides that were never hidden in the first place. An entrance that
      has already happened must not be waiting to happen.

   3. IF THE SCRIPT DOES NOT RUN, NOTHING IS HIDDEN. Every class involved is
      written by this file. The stylesheet hides a slide only once this file
      has said it intends to show it again, so a reader with no JavaScript
      gets a plain page rather than thirty invisible slides.

   ---------------------------------------------------------------------------
   AND THE CARDS, ON A PHONE ONLY
   ---------------------------------------------------------------------------
   A column of four metric tiles is taller than the screen, so the slide's own
   arrival happens entirely off screen above them and the cards scroll past
   flat. Each card therefore arrives on its own account, a little faster and a
   little shorter than a whole slide. On a desktop the slide is one wide
   object and none of this applies.
   =========================================================================== */
window.CS = window.CS || {};
(function (CS) {
  'use strict';

  /* The stacked card lists. Both are a grid on a desktop and a single column
     on a phone, and it is only in the column that a card is far enough from
     its neighbours for an arrival of its own to read. */
  var CARDS = '.cs-tiles--static > .cs-tile, .cs-numbered > .cs-numbered-item';

  /* How far down the screen a thing has to reach before it is allowed to
     arrive. 15% up from the bottom edge: high enough that the movement is
     over by the time the slide is properly in view, low enough that it is
     not finished before you can see it start. */
  var TRIGGER = '0px 0px -15% 0px';

  CS.initParallax = function () {
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var stacked = window.matchMedia('(max-width: 820px)');
    var progress = document.getElementById('cs-progress');
    var ticking = false;

    /* -------------------------------------------------------------------
       THE LINE AT THE TOP
       -------------------------------------------------------------------
       Unchanged, and deliberately not part of the arrival: it answers "how
       far through am I", which is a question the reader asks at any moment,
       including while nothing is moving. */
    function paintProgress() {
      ticking = false;
      if (!progress) return;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
    }

    function onScroll() {
      if (!ticking) { ticking = true; window.requestAnimationFrame(paintProgress); }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    paintProgress();

    /* A READER WHO HAS ASKED FOR LESS MOTION GETS THE PAGE AND NOT THE
       PERFORMANCE. Nothing below this line runs for them: no classes are
       written, so nothing is ever hidden and there is nothing to show. */
    if (reduced) {
      CS.refreshParallax = function () { paintProgress(); };
      return;
    }

    /* -------------------------------------------------------------------
       THE ARRIVAL
       ------------------------------------------------------------------- */
    var watcher = null;

    function land(el) {
      el.classList.add('is-in');
      /* WILL-CHANGE IS A PROMISE, NOT A SETTING. It asks the browser to keep
         a layer in memory for something that is about to move; left on
         thirty slides for the life of the page it is thirty layers kept for
         an animation that happened once, minutes ago. Taken off as soon as
         the slide has landed. */
      window.setTimeout(function () { el.style.willChange = 'auto'; }, 760);
    }

    function see() {
      if (watcher) return watcher;
      watcher = new window.IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          land(e.target);
          watcher.unobserve(e.target);     /* once each, and never again */
        });
      }, { rootMargin: TRIGGER, threshold: 0 });
      return watcher;
    }

    /* MARK ONE ELEMENT, OR DECIDE IT NEEDS NO MARKING.

       `data-cs-enter` is the memory. Without it, every refresh would hand
       the same slide back to the observer, and a slide that had already
       arrived would be told to arrive again — which is the "slideshow"
       behaviour this was written to avoid. */
    function prepare(el, cls, nowCls) {
      if (el.dataset.csEnter) return;
      el.dataset.csEnter = '1';

      var box = el.getBoundingClientRect();
      var below = box.top > window.innerHeight * 0.85;
      /* A HIDDEN SLIDE MEASURES ZERO, which is not "already past" — it is
         "not on the page yet". The other view's slides are in the markup
         the whole time, so without this they would all be marked as
         already-arrived and would never animate when their tab was opened. */
      var hidden = !box.height && !box.width;

      if (!below && !hidden) {
        if (nowCls) el.classList.add(nowCls);   /* you were already past it */
        return;
      }
      el.classList.add(cls);
      see().observe(el);
    }

    function scanSlides() {
      [].slice.call(document.querySelectorAll('.cs-slide-wrapper'))
        .forEach(function (el) { prepare(el, 'cs-enter', 'cs-enter--now'); });
    }

    /* ---- the cards, on a phone ---- */
    function scanCards() {
      var cards = [].slice.call(document.querySelectorAll(CARDS));
      if (!stacked.matches) {
        /* COMING BACK TO A DESKTOP WIDTH MUST NOT LEAVE A CARD HIDDEN. A
           card marked on a phone and never scrolled to would otherwise
           still be at opacity 0 when the window is widened. */
        cards.forEach(function (c) {
          if (!c.dataset.csEnter) return;
          if (watcher) watcher.unobserve(c);
          c.classList.remove('cs-card-enter', 'is-in');
          delete c.dataset.csEnter;
        });
        return;
      }
      cards.forEach(function (c) { prepare(c, 'cs-card-enter', null); });
    }

    function scan() { scanSlides(); scanCards(); }

    /* THE PAGE CAN GROW AFTER THIS HAS RUN. The tab series swaps one whole
       run of slides for another, and the view tabs swap the nutshell for the
       story — so the list taken here, once, would be a list of slides that
       are no longer on the page plus no mention of the ones that are. The
       symptom is a run of slides that never appear at all.

       It is a function on CS rather than another listener because only the
       thing that CHANGED the page knows that it changed; watching for it
       would mean measuring constantly to catch something that happens twice
       in a visit. */
    CS.refreshParallax = function () { scan(); paintProgress(); };

    /* Turning a phone on its side crosses 820, which is a state the page
       should not have to be reloaded out of. */
    if (stacked.addEventListener) stacked.addEventListener('change', scan);
    else if (stacked.addListener) stacked.addListener(scan);

    scan();
  };
})(window.CS);
