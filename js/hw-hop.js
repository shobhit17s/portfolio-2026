/* hw-hop.js — the jump you get when you press a tab.

   THE PROBLEM THIS SOLVES

   The traveller already knows how to jump. Scroll down and he crouches,
   launches, flies and lands, because every part of that pose is worked out
   from how far through the journey the scroll has got (see hw-character.js).

   But pressing a tab used to hand the scrolling to the browser, with
   `behavior: 'smooth'`. The browser's easing is its own: it starts fast and
   glides to a halt, and it has no idea that the first tenth of the journey is
   a crouch and the last tenth is a landing. So the whole hop went past in a
   blur, and the parts that carry the character - the bend before, the beat in
   the air, the absorb on touchdown - were over before the eye caught them.

   So the page does its own scrolling for that one move. It walks the scroll
   position forward on a curve that HOLDS at the moments that matter:

       crouch    he sinks where he stands, and the ground does not move yet
       flight    the long middle: he is airborne and the world slides past
       landing   he arrives, takes the impact, straightens up

   One hop per planet crossed. Press "contact" from "about" and he makes the
   journey in three, rather than teleporting.

   The numbers below are in milliseconds and are meant to be played with. */
window.HW = window.HW || {};
(function (HW) {
  'use strict';

  var PHASE = {
    crouch: 360,   // sinking down, gathering    - 3 drawings
    flight: 640,   // feet off the ground         - 6 drawings
    land:   420    // impact, then standing up    - 5 drawings
  };

  /* A journey of several planets should not take several seconds per planet,
     so longer journeys move a little more briskly. */
  function pace(hops) {
    if (hops <= 1) return 1;
    if (hops === 2) return 0.84;
    return 0.72;
  }

  /* ---------- where the phases sit inside one segment ----------

     hw-scene.js turns the raw position within a segment into the character's
     own clock with smoothstep(0.26, 0.95, local) - the camera eases in and out
     of each leg. The character then treats its clock as: crouch below 0.12,
     airborne up to 0.9, landing after that.

     To hold the crouch for a third of a second we therefore have to know
     which SCROLL position produces a character clock of exactly 0.12. That is
     the inverse of the smoothstep, which has no tidy formula - so we find it
     by halving the interval a couple of dozen times, which is exact to more
     decimal places than a scroll position has.

     AND IT IS DIFFERENT IN EACH DIRECTION. The easing is not symmetrical:
     it has a quarter of the segment as a slow start and only a twentieth as
     a slow finish. Going forwards the crouch therefore occupies the first
     40% of the scroll; going backwards - where the character mirrors its own
     clock so the jump still plays crouch-first - it occupies the last 20%.
     Use the wrong pair and the hold lands on the wrong part of the jump, and
     he appears to crouch in mid-air. */
  function localFor(t, a, b) {
    var lo = a, hi = b;
    for (var i = 0; i < 26; i++) {
      var mid = (lo + hi) / 2;
      if (HW.smoothstep(a, b, mid) < t) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  HW.createHopper = function (opts) {
    var EASE_A = 0.26, EASE_B = 0.95;     // must match hw-scene.js
    var LAUNCH = 0.12, LAND = 0.9;        // must match hw-character.js

    /* Both read as "how far through this one hop's scrolling are we when his
       feet leave the ground / meet it again", as a fraction from 0 to 1. */
    var FWD = {
      lift: localFor(LAUNCH, EASE_A, EASE_B),
      touch: localFor(LAND, EASE_A, EASE_B)
    };
    var BACK = {
      lift: 1 - localFor(1 - LAUNCH, EASE_A, EASE_B),
      touch: 1 - localFor(1 - LAND, EASE_A, EASE_B)
    };

    var raf = 0;
    var running = false;

    function stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      running = false;
    }

    /* How far through the whole journey we are, given the elapsed time.
       Returns a position in world-units-of-travel, the same number the scroll
       produces, so everything downstream carries on as normal. */
    function positionAt(ms, from, dir, hops, scale, mark) {
      var crouch = PHASE.crouch * scale;
      var flight = PHASE.flight * scale;
      var land = PHASE.land * scale;
      var per = crouch + flight + land;

      var whole = Math.min(hops - 1, Math.floor(ms / per));
      var into = ms - whole * per;
      var gone;                             // how far through this hop, 0 to 1

      if (into < crouch) {
        /* Sinking. The ground barely moves: he is loading the jump, and the
           world waiting still is what makes that read as effort. */
        gone = mark.lift * HW.easeInOut(into / crouch);
      } else if (into < crouch + flight) {
        var f = (into - crouch) / flight;
        gone = mark.lift + (mark.touch - mark.lift) * f;   // even, like a thrown thing
      } else {
        var l = Math.min(1, (into - crouch - flight) / land);
        gone = mark.touch + (1 - mark.touch) * HW.easeInOut(l);
      }

      return from + dir * (whole + gone);
    }

    return {
      get running() { return running; },
      cancel: stop,

      /* Take the traveller from one world to another, one hop per world. */
      to: function (from, to, apply, done) {
        stop();
        var hops = Math.abs(to - from);
        if (!hops) { apply(to); if (done) done(); return; }
        if (!opts.motion) { apply(to); if (done) done(); return; }

        var dir = to > from ? 1 : -1;
        var mark = dir > 0 ? FWD : BACK;
        var scale = pace(hops);
        var total = (PHASE.crouch + PHASE.flight + PHASE.land) * scale * hops;
        var t0 = performance.now();
        running = true;

        (function step(now) {
          var ms = now - t0;
          if (ms >= total) { apply(to); stop(); if (done) done(); return; }
          apply(positionAt(ms, from, dir, hops, scale, mark));
          raf = requestAnimationFrame(step);
        })(t0);
      }
    };
  };
})(window.HW);


