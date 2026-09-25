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

    function apply(v) {
      HW.SETTINGS.spinScale = v;
      buttons.forEach(function (b) {
        var on = parseFloat(b.dataset.hwSpin) === v;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }

    buttons.forEach(function (b) {
      b.addEventListener('click', function () { apply(parseFloat(b.dataset.hwSpin)); });
    });

    /* ALWAYS SLOW TO BEGIN WITH, every time, for everybody.

       This used to remember the reader's last choice in their own browser,
       which sounds thoughtful and was the wrong call here. Almost everyone
       who opens a portfolio opens it once, so the remembered setting nearly
       never helps - and the one person it does reach is the person who has
       been clicking Fast all afternoon to test something, and who then opens
       the page expecting the default and does not get it.

       A planet that turns slowly reads as somewhere you are standing. A fast
       one reads as a demo. That is the first impression, and it should not
       depend on what anybody pressed last time. */
    var SLOW = 0.5;
    apply(SLOW);

    return {
      /* Sit under the planet currently being read, and step out of the way
         while the traveller is between worlds. */
      place: function (planet, vis, narrow) {
        if (!planet || !planet.screen.visible || vis < 0.35) {
          el.classList.remove('is-on');
          return;
        }
        el.classList.add('is-on');
        /* On a phone the dial is not placed here at all. It has a fixed seat
           in the stack at the bottom of the screen, set in CSS, and chasing
           the planet would only put it back on top of the writing - which is
           what made the old phone layout feel like a pile. Clearing the
           inline transform hands placement back to the stylesheet. */
        if (narrow) { el.style.transform = ''; return; }
        var w = el.offsetWidth, h = el.offsetHeight;
        var x = HW.clamp(planet.screen.x - w / 2, 16, window.innerWidth - w - 16);
        var y = HW.clamp(planet.screen.y + planet.screen.r + (narrow ? 12 : 24),
                         90, window.innerHeight - h - (narrow ? 20 : 96));
        el.style.transform = 'translate3d(' + Math.round(x) + 'px,' + Math.round(y) + 'px,0)';
      }
    };
  };
})(window.HW);


