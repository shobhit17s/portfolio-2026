/* hw-scroll.js — scrolling is travelling.
   Turns page scroll into a position along the chain of worlds, then keeps the
   written page (panels, spin dial, rail) pinned to whatever the camera
   is looking at. */
window.HW = window.HW || {};
(function (HW) {
  'use strict';

  HW.createTravelUI = function (scene, worlds) {
    var last = worlds.length - 1;
    var panels = [].slice.call(document.querySelectorAll('.hw-panel'));
    var dots = [].slice.call(document.querySelectorAll('.hw-rail-dot'));
    var hint = document.getElementById('hw-scroll-hint');
    var sizes = [];
    var narrow = false;
    var spin = HW.createSpinControl();

    /* Measure the panels, and on a phone tell the stylesheet how tall the
       TALLEST world's writing is.

       Everything at the bottom of a phone screen is stacked off that one
       number (see the narrow block in hw-layout.css). Using the tallest for
       all four, rather than each world's own, is what keeps the spin dial
       still and every title on the same line as you travel.

       The custom property is cleared before measuring, because the panels'
       own min-height is set FROM it - measure without clearing and each
       resize would ratchet the number upwards and never come back down. */
    function measure() {
      narrow = window.innerWidth < 820;
      document.body.classList.toggle('hw-narrow', narrow);
      document.body.style.removeProperty('--hw-panel-h');
      sizes = panels.map(function (p) {
        return { w: p.offsetWidth, h: p.offsetHeight };
      });
      if (narrow) {
        var tallest = sizes.reduce(function (m, s) { return Math.max(m, s.h); }, 0);
        document.body.style.setProperty('--hw-panel-h', Math.ceil(tallest) + 'px');
      }
    }

    function scrollRange() {
      return Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    }

    function onScroll() {
      var t = HW.clamp01(window.scrollY / scrollRange());
      scene.setTravel(t * last);
      if (hint) hint.classList.toggle('is-gone', window.scrollY > 60);
    }

    /* The hop. Pressing a tab no longer hands the scrolling to the browser -
       we walk the scroll position ourselves, on a curve that dwells on the
       crouch and on the landing so both are actually visible. See hw-hop.js. */
    var hopper = HW.createHopper({ motion: scene.motion });

    function applyTravel(u) {
      var top = (u / last) * scrollRange();
      selfScroll = performance.now();
      window.scrollTo(0, top);
      // set it directly as well: scroll events can arrive a frame late, and a
      // late frame in a 1.3-second animation is a visible stutter
      scene.setTravel(HW.clamp(u, 0, last));
      if (hint) hint.classList.toggle('is-gone', top > 60);
    }

    /* =====================================================================
       SNAPPING - THERE IS NO SUCH PLACE AS HALF WAY

       Scrolling used to hand the traveller's position straight to the wheel.
       Move the wheel a little and he moved a little: mid-crouch, mid-air,
       mid-landing, and there he stayed until you moved it again. A drawn
       character frozen with one foot off the ground does not read as a pause,
       it reads as a broken page.

       So the scroll wheel no longer says WHERE to be. It says WHICH WAY to
       go, and the page does the rest - the same hop the tabs at the bottom
       have always done, crouch and flight and landing, start to finish.

       IT IS DELIBERATELY TWITCHY. The smallest flick of a wheel, six pixels
       of thumb, one tap of an arrow key: all of them are a whole world. There
       is no threshold to clear, because a threshold is exactly what leaves
       somebody stranded between two worlds wondering what they did wrong.

       ONE GESTURE SHOULD NOT BE FOUR WORLDS, though, and this is the part
       that needs care. A single flick of a trackpad fires a stream of wheel
       events over a second or more, all of them arriving while the first hop
       is still in the air. So an input during a hop is not ignored and not
       obeyed either - it is REMEMBERED, and honoured when the hop lands, but
       only if the reader is still scrolling AT THAT MOMENT. A flick's tail
       has gone quiet long before the landing, so a flick is one world. A
       finger held on the wheel is still live, so it keeps going, one world
       per hop. The test is `now - lastInput < STILL_GOING`, and that one line
       is the whole difference between responsive and out of control.
       ===================================================================== */
    var STILL_GOING = 140;      // ms of quiet that ends a gesture
    var settled = 0;            // the world we are resting at, or heading to
    var queued = 0;             // a direction asked for mid-hop
    var lastInput = 0;
    var selfScroll = 0;         // scrolling WE caused, not the reader

    function indexNow() {
      return HW.clamp(Math.round(HW.clamp01(window.scrollY / scrollRange()) * last), 0, last);
    }

    function goTo(index) {
      index = HW.clamp(Math.round(index), 0, last);
      var from = indexNow();
      settled = index;
      queued = 0;
      if (from === index) { applyTravel(index); return; }
      hopper.to(from, index, applyTravel, land);
    }

    function land() {
      applyTravel(settled);
      if (queued && performance.now() - lastInput < STILL_GOING) {
        var d = queued; queued = 0; step(d);
      } else {
        queued = 0;
      }
    }

    /* One notch of input, in a direction. */
    function step(dir) {
      if (!dir) return;
      lastInput = performance.now();
      if (hopper.running) { queued = dir; return; }
      var from = indexNow();
      var to = HW.clamp(settled + dir, 0, last);
      if (to === from) { applyTravel(to); return; }   // already at the end
      settled = to;
      hopper.to(from, to, applyTravel, land);
    }

    /* ---------- the wheel ----------
       preventDefault needs passive:false, and it is what stops the browser
       scrolling underneath us while the hop is walking the same scrollbar. */
    /* The drawer is a panel of writing that can be longer than the screen,
       so inside it a wheel still means "scroll this", not "travel". */
    function insidePanel(node) {
      return !!(node && node.closest && node.closest('#hw-drawer'));
    }

    window.addEventListener('wheel', function (e) {
      if (insidePanel(e.target)) return;
      e.preventDefault();
      step(e.deltaY > 0 ? 1 : (e.deltaY < 0 ? -1 : 0));
    }, { passive: false });

    /* ---------- a finger ----------
       Six pixels is the whole threshold, and the gesture is spent as soon as
       it is read: one swipe is one world, however far the finger travels. */
    var touchY = 0, touchSpent = true, touchOurs = false;
    window.addEventListener('touchstart', function (e) {
      touchY = e.touches[0].clientY;
      touchSpent = false;
      touchOurs = !insidePanel(e.target);
    }, { passive: true });

    window.addEventListener('touchmove', function (e) {
      if (!touchOurs) return;
      e.preventDefault();                       // no native scrolling underneath
      if (touchSpent) return;
      var dy = touchY - e.touches[0].clientY;
      if (Math.abs(dy) < 6) return;
      touchSpent = true;
      step(dy > 0 ? 1 : -1);
    }, { passive: false });

    /* ---------- keys ----------
       Left alone, Tab and Enter belong to whatever has focus. */
    window.addEventListener('keydown', function (e) {
      var d = 0;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight' ||
          e.key === 'PageDown' || e.key === ' ') d = 1;
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'PageUp') d = -1;
      else if (e.key === 'Home') { e.preventDefault(); goTo(0); return; }
      else if (e.key === 'End') { e.preventDefault(); goTo(last); return; }
      if (!d) return;
      if (insidePanel(document.activeElement)) return;
      if (document.activeElement && /^(BUTTON|A|INPUT)$/.test(document.activeElement.tagName)
          && e.key === ' ') return;             // space is that control's own
      e.preventDefault();
      step(d);
    });

    scene.onFrame = function (planets, travel) {
      var u = travel.u;
      var active = Math.round(u);
      var bestVis = -1, bestIndex = 0;

      for (var i = 0; i < panels.length; i++) {
        var el = panels[i];
        var p = planets[i];
        var vis = 1 - HW.smoothstep(0.14, 0.52, Math.abs(u - i));
        var size = sizes[i] || { w: 320, h: 220 };

        if (!narrow && p.screen.visible) {
          /* THE WRITING BELONGS TO THE PLANET, so it is placed beside it and
             level with its middle - near enough that the eye takes the two as
             one thing. That is the whole of it: things that are close together
             are read as related, and nothing else has to say so.

             The opening panel used to be an exception, pinned to the left
             margin. On a wide screen that put half a screen of empty sky
             between the words and the world they describe, and they stopped
             being one thing. There is no exception now.

             The gap scales with the planet, because a big planet needs more
             air around it than a small one to avoid looking crowded, but it
             never closes below a readable margin. */
          var gutter = parseFloat(getComputedStyle(document.body).getPropertyValue('--hw-gutter')) || 32;
          var gap = Math.max(96, p.screen.r * 0.34);
          var left = worlds[i].side === 'right'
            ? p.screen.x + p.screen.r + gap
            : p.screen.x - p.screen.r - gap - size.w;
          left = HW.clamp(left, gutter, window.innerWidth - size.w - gutter);
          var top = HW.clamp(p.screen.y - size.h * 0.52, 104,
                             window.innerHeight - size.h - 150);
          el.style.transform = 'translate3d(' + Math.round(left) + 'px,' +
            Math.round(top + (1 - vis) * 16) + 'px,0)';
          if (vis > bestVis) { bestVis = vis; bestIndex = i; }
        } else if (vis > bestVis) {
          bestVis = vis; bestIndex = i;
        }

        el.style.opacity = vis.toFixed(3);
        el.style.pointerEvents = vis > 0.6 ? 'auto' : 'none';
        el.setAttribute('aria-hidden', vis > 0.4 ? 'false' : 'true');
      }

      /* THE LEADER LINE HAS GONE. It was a dashed line drawn from the
         writing to the planet it described - necessary only because the
         writing used to sit a long way off. Now that the two are placed as
         one unit, a line pointing from a thing to the thing right next to it
         is noise: it says something the arrangement already says. */

      spin.place(planets[active], 1 - HW.smoothstep(0.14, 0.52, Math.abs(u - active)), narrow);

      for (var d = 0; d < dots.length; d++) {
        dots[d].classList.toggle('is-active', d === active);
      }
      document.body.dataset.hwWorld = worlds[active] ? worlds[active].id : '';

      var card = document.getElementById('hw-titlecard');
      if (card) {
        var cardVis = 1 - HW.smoothstep(0.04, 0.34, u);
        card.style.opacity = cardVis.toFixed(3);
        card.style.pointerEvents = cardVis > 0.5 ? 'auto' : 'none';
      }
    };

    dots.forEach(function (b, i) {
      b.addEventListener('click', function () { goTo(i); });
    });
    scene.onPlanetClick(function (i) { goTo(i); });

    /* ---------- arriving from somewhere else ----------

       A case study ends with a band that says "back to the worlds", and the
       link on it is index.html#hw-world-work. That is a promise: not just
       the worlds, but the one the case studies live on.

       The browser cannot keep that promise by itself. Its own anchor jump
       looks for an element with that id and scrolls it into view - but every
       panel here is positioned by script, not by where it sits in the page,
       so the id is on something that is not where it appears to be. The
       scroll position IS the camera, so the honest way to arrive somewhere
       is to set the scroll position to that world's own place along it.

       Done again after the webfonts settle, because they change how tall the
       page is and therefore where each world sits on it. */
    function goToHash() {
      var h = window.location.hash;
      if (!h) return false;
      for (var i = 0; i < worlds.length; i++) {
        if (worlds[i].href === h || h === '#hw-world-' + worlds[i].id) {
          settled = i;
          applyTravel(i);
          return true;
        }
      }
      return false;
    }

    window.addEventListener('hashchange', goToHash);

    /* THE SAFETY NET. Not every way of moving a page goes through the wheel:
       a scrollbar drag, find-in-page, a screen reader, a browser restoring
       where you were last time. Those still move the camera live - it would
       be worse to fight them - but the moment they stop, the traveller is
       walked to the nearest whole world so he is never left in the air.

       Our own hop moves the scrollbar too, so it has to be told apart from
       the reader's: applyTravel stamps the clock on its way past, and
       anything within a frame or two of that stamp is us. */
    var settleTimer = 0;
    window.addEventListener('scroll', function () {
      onScroll();
      if (performance.now() - selfScroll < 120 || hopper.running) return;
      clearTimeout(settleTimer);
      settleTimer = setTimeout(function () {
        if (hopper.running) return;
        var here = HW.clamp01(window.scrollY / scrollRange()) * last;
        var to = HW.clamp(Math.round(here), 0, last);
        settled = to;
        if (Math.abs(here - to) > 0.004) hopper.to(here, to, applyTravel, land);
        else applyTravel(to);
      }, 90);
    }, { passive: true });
    window.addEventListener('resize', function () { measure(); onScroll(); });

    // panels only size correctly once webfonts have settled
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { measure(); goToHash(); });
    }
    measure();
    onScroll();
    goToHash();

    return { goTo: goTo, measure: measure };
  };
})(window.HW);


