/* cs-parallax.js — slides do not simply appear; they settle.
   Each slide is nudged a little further down and a little more transparent the
   further it is from the middle of the screen, so scrolling feels like paper
   moving rather than a list jumping. */
window.CS = window.CS || {};
(function (CS) {
  'use strict';

  CS.initParallax = function () {
    var slides = [].slice.call(document.querySelectorAll('.cs-slide-wrapper'));
    var progress = document.getElementById('cs-progress');
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
    }

    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(paint); }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    paint();
  };
})(window.CS);

