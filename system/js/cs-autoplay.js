/* cs-autoplay.js — the thing that turns a carousel's pages by itself.

   ===========================================================================
   WHAT IT IS
   ===========================================================================

   Every stepped set on a case study - the three people on slide 3, the seven
   diagrams on slide 6, any run of wireframes - now turns its own pages. Seven
   seconds a picture, then the next one.

   The whole of it lives here rather than inside the carousels, for one
   reason: the rules about WHEN IT MUST NOT TURN are the hard part, they are
   the same for every carousel, and they are the part that is easy to get
   wrong in a way nobody notices until a reader is annoyed.

   ===========================================================================
   WHEN IT STOPS, AND WHY EACH ONE MATTERS
   ===========================================================================

   THE READER ASKED IT TO          The pause button in the pager. This is not
                                   a nicety: anything on a page that moves by
                                   itself for more than five seconds has to
                                   have a way to stop it, or people who read
                                   slowly, or who are using a screen
                                   magnifier, simply cannot finish a sentence.
                                   Once pressed it stays pressed.

   THE POINTER IS OVER THE         You are examining it. Nothing should move
   PICTURE OR THE CONTROLS         out from under a pointer.

                                   OVER THE PICTURE, not over the slide. The
                                   first version watched the whole slide, and
                                   a slide fills the screen - so wherever a
                                   reader leaves their cursor it is on top of
                                   one, and nothing ever turned. It only
                                   worked in testing because the test parked
                                   the pointer in the corner of the window
                                   first, which is a state no reader is ever
                                   in.

                                   AND THE POINTER HAS TO BE ALIVE. A cursor
                                   abandoned in the middle of the screen while
                                   someone reads is not attention; it is
                                   furniture. So the hold needs the pointer to
                                   be over the picture AND to have moved in
                                   the last few seconds. Move it and
                                   everything stops for as long as you are
                                   working; leave it and the page carries on
                                   around it. This is what lets the people
                                   slide watch its panel of writing - which it
                                   must, because the writing changes with the
                                   person - without that panel freezing the
                                   slide for good.

   SOMETHING INSIDE HAS FOCUS      You arrived by keyboard and are stepping
                                   through by hand. The same courtesy.

   IT IS NOT ON SCREEN             A carousel four slides down does not need
                                   to be shuffling. It also means that by the
                                   time you scroll to it you see its first
                                   picture, not whichever one it happened to
                                   reach while you were somewhere else -
                                   which was the single most disorienting
                                   thing about the first version of this.

   THE PICTURE IS OPEN FULL SIZE   The expand button is there exactly because
                                   seven seconds is not always enough.

   THE TAB IS IN THE BACKGROUND    Nothing to see; no reason to burn a timer.

   THE READER PREFERS NO MOTION    prefers-reduced-motion. Then it never
                                   starts at all, and the arrows are the only
                                   way through - which is the correct reading
                                   of that setting, not a degraded one.

   AND ONE THING IT DOES NOT DO: pressing an arrow does not switch autoplay
   off. It restarts the seven seconds, so the page you just asked for gets a
   full turn rather than being whipped away a moment later. If you want it to
   stop, that is what the pause button is for - a control that says what it
   does beats a side effect you have to discover.

   ===========================================================================
   THE LINE UNDER THE PICTURE
   ===========================================================================

   A page that changes on its own with no warning reads as a glitch. So the
   pager carries a thin line that fills over the seven seconds, and empties
   and refills on each turn. It is the only part of this that is decoration,
   and it is the part that makes the rest feel deliberate.

   ===========================================================================
   HOW A CAROUSEL ASKS FOR IT
   ===========================================================================

       CS.autoplay.attach({
         root:  slide,              // focus and on-screen are judged here
         hover: [stage],            // ...but the pointer is judged HERE
         pager: pagerElement,       // where the pause button and line go
         count: function () { return shots.length; },
         step:  function () { step(1); },
         name:  'diagrams'          // for the button's spoken label
       });

   `hover` is a list, because a carousel that changes WORDS as well as
   pictures - the people on slide 3 - has to count the words as something you
   can be in the middle of. Leave it out and it falls back to whatever holds
   the pager, which is right for a carousel of pictures alone.

   It hands back { bump, destroy }. `bump` is what a carousel calls after the
   reader has stepped by hand, to give the new page a full seven seconds. */
window.CS = window.CS || {};
(function (CS) {
  'use strict';

  /* Seven seconds, in one place. Long enough to read a caption, short enough
     that a reader does not give up on a diagram they have already finished
     with. If this ever becomes a per-slide decision, it becomes a field on
     the slide rather than a second number here. */
  var DWELL = 7000;

  var reduced = window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function el(tag, cls) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    return n;
  }

  CS.autoplay = {
    DWELL: DWELL,

    attach: function (spec) {
      var root = spec.root, pager = spec.pager;
      if (!root || !pager || typeof spec.step !== 'function') return null;
      if (typeof spec.count === 'function' && spec.count() < 2) return null;

      /* ---- the control ---- */
      var btn = el('button', 'cs-pager-play');
      btn.type = 'button';

      var mark = el('span', 'cs-pager-play-mark');
      btn.appendChild(mark);

      /* the line that fills */
      var meter = el('span', 'cs-pager-meter');
      var fill = el('span', 'cs-pager-meter-fill');
      meter.appendChild(fill);
      meter.setAttribute('aria-hidden', 'true');

      /* The pause button goes FIRST in the pager and the line last, so the
         reading order is: stop this / back / where am I / forward. */
      pager.insertBefore(btn, pager.firstChild);
      pager.appendChild(meter);

      /* ---- state ----
         `stopped` is the reader's decision and survives everything else.
         The rest are NAMED REASONS to be holding, not a counter. A counter
         was the first version of this and it was wrong within an hour: a
         `focusout` that never found its matching `focusin` left the count
         stuck at one and the carousel never moved again. Named reasons
         cannot drift - setting the same one twice is setting it twice. */
      var stopped = reduced;
      var hold = { pointer: false, keys: false, away: true, hidden: false, zoom: false };
      var timer = null;

      function held() {
        for (var k in hold) if (hold[k]) return true;
        return false;
      }
      function running() { return !stopped && !held(); }

      function paint() {
        var on = running();
        btn.setAttribute('aria-pressed', stopped ? 'true' : 'false');
        btn.setAttribute('aria-label',
          (stopped ? 'Play the ' : 'Pause the ') + (spec.name || 'pictures'));
        btn.title = btn.getAttribute('aria-label');
        btn.classList.toggle('is-paused', stopped);
        root.classList.toggle('cs-autoplay-on', on);
        meter.classList.toggle('is-running', on);
      }

      function clear() {
        if (timer) { clearTimeout(timer); timer = null; }
        fill.style.transition = 'none';
        fill.style.transform = 'scaleX(0)';
      }

      function run() {
        clear();
        if (!running()) { paint(); return; }
        /* two frames: one to land at zero width, one to start the journey.
           In one frame the browser collapses the two and nothing moves. */
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            if (!running()) return;
            fill.style.transition = 'transform ' + DWELL + 'ms linear';
            fill.style.transform = 'scaleX(1)';
          });
        });
        timer = setTimeout(function () {
          timer = null;
          if (!running()) return;
          spec.step();
          run();
        }, DWELL);
        paint();
      }

      /* one way in and out of every hold, so the two can never disagree */
      function set(reason, on) {
        if (hold[reason] === on) return;
        hold[reason] = on;
        if (on) { clear(); paint(); } else run();
      }

      /* ---- the reasons ---- */

      /* THE POINTER, over the picture and its controls rather than over the
         whole slide. See the long note at the top of this file: watching the
         slide meant watching the screen, and nothing ever turned.

         A TOUCH IS NOT A HOVER. On a touch screen a tap raises pointerenter
         and there may never be a matching pointerleave, which would hold the
         carousel for the rest of the session. Only a mouse counts. */
      var watch = spec.hover && spec.hover.length ? spec.hover : [pager.parentNode];
      var over = 0, idleTimer = null;

      /* How long a motionless cursor still counts as someone working. Longer
         than the gap between two deliberate movements, shorter than the time
         it takes to feel stuck. */
      var STILL = 6000;

      function alive() {
        if (idleTimer) clearTimeout(idleTimer);
        set('pointer', true);
        idleTimer = setTimeout(function () {
          idleTimer = null;
          set('pointer', false);              /* the cursor is furniture now */
        }, STILL);
      }

      function gone() {
        if (idleTimer) { clearTimeout(idleTimer); idleTimer = null; }
        set('pointer', false);
      }

      watch.forEach(function (node) {
        if (!node) return;
        /* ENTERING IS NOT MOVING, and the difference is not pedantry.
           Replacing the picture pulls the old one out from under the cursor,
           which makes the browser work out what the pointer is over again and
           dispatch a FRESH enter - with the mouse sitting perfectly still. A
           parked cursor was therefore re-arming the hold on every turn, and
           the carousel ran at thirteen seconds a picture instead of seven.
           Only real movement counts, so only pointermove calls alive(). */
        node.addEventListener('pointerenter', function (e) {
          if (e.pointerType && e.pointerType !== 'mouse') return;
          over++;
        });
        node.addEventListener('pointermove', function (e) {
          if (e.pointerType && e.pointerType !== 'mouse') return;
          alive();
        });
        node.addEventListener('pointerleave', function (e) {
          if (e.pointerType && e.pointerType !== 'mouse') return;
          over = Math.max(0, over - 1);
          if (over <= 0) gone();
        });
      });

      /* FOCUS, BUT ONLY THE KIND YOU CAN SEE.

         Holding on any focus at all sounds right and is not. Closing the
         full-size view puts the focus back on the button that opened it -
         which is the correct thing to do - and a plain focus rule then left
         the carousel held for good, because a mouse user has no way to take
         focus off a button again. :focus-visible is the browser's own answer
         to "is this person navigating by keyboard", so it is the right
         question to ask: a reader tabbing through gets the hold, a reader
         who clicked does not. */
      function keyboardInside() {
        var a = document.activeElement;
        if (!a || !root.contains(a)) return false;
        try { return a.matches(':focus-visible'); } catch (e) { return true; }
      }
      root.addEventListener('focusin', function () { set('keys', keyboardInside()); });
      root.addEventListener('focusout', function () {
        /* after the focus has actually landed somewhere */
        setTimeout(function () { set('keys', keyboardInside()); }, 0);
      });

      document.addEventListener('visibilitychange', function () {
        set('hidden', document.hidden);
      });

      /* a picture open full size, whichever one opened it */
      if (window.MutationObserver) {
        new MutationObserver(function () {
          set('zoom', document.body.classList.contains('cs-overlay-open'));
        }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
      }

      /* on screen or not. It starts held - `away` is true above - so a
         carousel four slides down is still on its first picture when you
         reach it rather than wherever it drifted to while you were elsewhere. */
      if (window.IntersectionObserver) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (e) { set('away', e.intersectionRatio < 0.4); });
        }, { threshold: [0, 0.4, 0.75] }).observe(root);
      } else {
        hold.away = false;
      }

      btn.addEventListener('click', function () {
        stopped = !stopped;
        if (stopped) { clear(); paint(); } else run();
      });

      paint();
      run();

      return {
        /* a manual step: give the new picture a full turn rather than
           snatching it away a moment later */
        bump: function () { if (running()) run(); },
        pause: function () { set('zoom', true); },
        resume: function () { set('zoom', false); },
        destroy: clear
      };
    }
  };
})(window.CS);


