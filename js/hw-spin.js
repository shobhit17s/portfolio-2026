/* hw-spin.js — the little dial under whichever planet you are looking at.

   Rotation is a trade-off: slow enough to feel calm, fast enough that you are
   never waiting for the far side to come round. Rather than guess on everyone's
   behalf, the page picks a middle speed and lets the reader change it. The
   choice is remembered in their own browser. */
window.HW = window.HW || {};
(function (HW) {
  'use strict';

  HW.createSpinControl = function () {
    var el = document.getElementById('hw-spin');
    if (!el) return { place: function () {} };
    var buttons = [].slice.call(el.querySelectorAll('.hw-spin-btn'));

    function apply(v, quiet) {
      HW.SETTINGS.spinScale = v;
      buttons.forEach(function (b) {
        var on = parseFloat(b.dataset.hwSpin) === v;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      if (quiet) return;
      try { localStorage.setItem('hw-spin', String(v)); } catch (e) { /* private window */ }
    }

    buttons.forEach(function (b) {
      b.addEventListener('click', function () { apply(parseFloat(b.dataset.hwSpin)); });
    });

    var saved = 1;
    try {
      var v = parseFloat(localStorage.getItem('hw-spin'));
      if (v > 0 && v <= 4) saved = v;
    } catch (e) { /* private window */ }
    apply(saved, true);

    return {
      /* Sit under the planet currently being read, and step out of the way
         while the traveller is between worlds. */
      place: function (planet, vis, narrow) {
        if (!planet || !planet.screen.visible || vis < 0.35) {
          el.classList.remove('is-on');
          return;
        }
        el.classList.add('is-on');
        var w = el.offsetWidth, h = el.offsetHeight;
        var x = HW.clamp(planet.screen.x - w / 2, 16, window.innerWidth - w - 16);
        var y = HW.clamp(planet.screen.y + planet.screen.r + (narrow ? 12 : 24),
                         90, window.innerHeight - h - (narrow ? 20 : 96));
        el.style.transform = 'translate3d(' + Math.round(x) + 'px,' + Math.round(y) + 'px,0)';
      }
    };
  };
})(window.HW);

