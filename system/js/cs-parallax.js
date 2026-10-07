/* cs-parallax.js — slides do not simply appear; they settle.
   Each slide is nudged a little further down and a little more transparent the
   further it is from the middle of the screen, so scrolling feels like paper
   moving rather than a list jumping.

   ON A PHONE THE CARDS DO IT TOO, one at a time. A slide of four metric
   tiles is one wide object on a desktop and a tall column on a phone - so
   tall that the slide's own settling happens entirely off screen and the
   cards simply slide past, flat. Each card is therefore given its own small
   drift, measured from its own distance to the middle of the screen, and the
   column reads as paper again.

   THE CARDS MOVE BUT DO NOT FADE, and that is deliberate rather than an
   omission. A slide at the edge of the screen is already down to 0.58
   opacity; fading a card inside it as well would multiply the two, and text
   that passes a contrast check at rest would quietly fail it while moving.
   Movement alone carries the effect and costs nothing that can be read. */
window.CS = window.CS || {};
(function (CS) {
  'use strict';

  /* The stacked card lists. Both of these are a grid on a desktop and a
     single column on a phone, and it is only in the column that a card is far
     enough from its neighbours for a drift of its own to read. */
  var CARDS = '.cs-tiles--static > .cs-tile, .cs-numbered > .cs-numbered-item';

  CS.initParallax = function () {
    var slides = [].slice.call(document.querySelectorAll('.cs-slide-wrapper'));
    var cards = [].slice.call(document.querySelectorAll(CARDS));
    var progress = document.getElementById('cs-progress');
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    /* asked each time it paints rather than once, so turning a phone on its
       side - which can cross 820 - is not a state the page has to be
       reloaded out of */
    var stacked = window.matchMedia('(max-width: 820px)');
    var ticking = false;

    function paint() {
      ticking = false;
      var vh = window.innerHeight;
      if (progress) {
        var max = document.documentElement.scrollHeight - vh;
        progress.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
      }
      if (reduced) return;
      for (var i = 0; i < slides.length; i++) {
        var el = slides[i];
        var box = el.getBoundingClientRect();
        if (box.bottom < -200 || box.top > vh + 200) continue;
        var centre = box.top + box.height / 2;
        var d = (centre - vh / 2) / vh;              // -1 above, +1 below
        var lift = Math.max(-1, Math.min(1, d)) * 26;
        var fade = 1 - Math.min(0.42, Math.abs(d) * 0.42);
        el.style.transform = 'translate3d(0,' + lift.toFixed(1) + 'px,0)';
        el.style.opacity = fade.toFixed(3);
      }

      /* ---- and, on a phone, each card within its slide ---- */
      if (!stacked.matches) {
        for (var c = 0; c < cards.length; c++) {
          if (cards[c].style.transform) cards[c].style.transform = '';
        }
        return;
      }
      for (var j = 0; j < cards.length; j++) {
        var card = cards[j];
        var cb = card.getBoundingClientRect();
        if (cb.bottom < -120 || cb.top > vh + 120) continue;
        var cd = ((cb.top + cb.height / 2) - vh / 2) / vh;
        /* smaller than the slide's own 26: this rides on top of that, and
           the two together should read as one movement, not two */
        var drift = Math.max(-1, Math.min(1, cd)) * 14;
        card.style.transform = 'translate3d(0,' + drift.toFixed(1) + 'px,0)';
      }
    }

    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(paint); }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    paint();
  };
})(window.CS);


