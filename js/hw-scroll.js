/* hw-scroll.js — scrolling is travelling.
   Turns page scroll into a position along the chain of worlds, then keeps the
   written page (panels, leader lines, rail, nav) pinned to whatever the camera
   is looking at. */
window.HW = window.HW || {};
(function (HW) {
  'use strict';

  HW.createTravelUI = function (scene, worlds) {
    var last = worlds.length - 1;
    var panels = [].slice.call(document.querySelectorAll('.hw-panel'));
    var dots = [].slice.call(document.querySelectorAll('.hw-rail-dot'));
    var leaderLine = document.getElementById('hw-leader-line');
    var leaderDot = document.getElementById('hw-leader-dot');
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
      window.scrollTo(0, top);
      // set it directly as well: scroll events can arrive a frame late, and a
      // late frame in a 1.3-second animation is a visible stutter
      scene.setTravel(HW.clamp(u, 0, last));
      if (hint) hint.classList.toggle('is-gone', top > 60);
    }

    function goTo(index) {
      var from = HW.clamp01(window.scrollY / scrollRange()) * last;
      // start from the world he is standing on, not from a half-way scroll
      hopper.to(Math.round(from), index, applyTravel);
    }

    /* Any real input from the reader wins. Their own scroll wheel, a finger on
       the glass, a page-down - all of it cancels the hop mid-air and hands
       control straight back. (The scroll events our own animation causes are
       not in this list, so it does not cancel itself.) */
    ['wheel', 'touchstart', 'pointerdown'].forEach(function (evt) {
      window.addEventListener(evt, function () { hopper.cancel(); }, { passive: true });
    });
    window.addEventListener('keydown', function (e) {
      if (e.key === 'Tab' || e.key === 'Enter' || e.key === ' ') return;
      hopper.cancel();
    });

    scene.onFrame = function (planets, travel) {
      var u = travel.u;
      var active = Math.round(u);
      var bestVis = -1, bestIndex = 0, bestGeom = null;

      for (var i = 0; i < panels.length; i++) {
        var el = panels[i];
        var p = planets[i];
        var vis = 1 - HW.smoothstep(0.14, 0.52, Math.abs(u - i));
        var size = sizes[i] || { w: 320, h: 220 };

        if (!narrow && p.screen.visible) {
          var gutter = parseFloat(getComputedStyle(document.body).getPropertyValue('--hw-gutter')) || 32;
          var left, top;
          if (worlds[i].pin) {
            left = gutter;
            top = HW.clamp(window.innerHeight * 0.5 - size.h * 0.56, 108,
                           window.innerHeight - size.h - 96);
          } else {
            var gap = Math.max(116, p.screen.r * 0.36);
            left = worlds[i].side === 'right'
              ? p.screen.x + p.screen.r + gap
              : p.screen.x - p.screen.r - gap - size.w;
            left = HW.clamp(left, gutter, window.innerWidth - size.w - gutter);
            top = HW.clamp(p.screen.y - size.h * 0.52, 104, window.innerHeight - size.h - 96);
          }
          el.style.transform = 'translate3d(' + Math.round(left) + 'px,' +
            Math.round(top + (1 - vis) * 16) + 'px,0)';
          if (vis > bestVis) {
            bestVis = vis; bestIndex = i;
            bestGeom = {
              left: left, top: top, w: size.w, h: size.h, p: p,
              side: worlds[i].side
            };
          }
        } else if (vis > bestVis) {
          bestVis = vis; bestIndex = i; bestGeom = null;
        }

        el.style.opacity = vis.toFixed(3);
        el.style.pointerEvents = vis > 0.6 ? 'auto' : 'none';
        el.setAttribute('aria-hidden', vis > 0.4 ? 'false' : 'true');
      }

      /* the annotation line, drawn with a deliberate waver */
      if (leaderLine) {
        if (narrow || !bestGeom || bestVis < 0.35) {
          leaderLine.setAttribute('opacity', '0');
          if (leaderDot) leaderDot.setAttribute('opacity', '0');
        } else {
          var g = bestGeom;
          var ax = g.side === 'right' ? g.left - 6 : g.left + g.w + 6;
          var ay = g.top + g.h * 0.42;
          var dx = g.p.screen.x - ax, dy = g.p.screen.y - ay;
          var dist = Math.sqrt(dx * dx + dy * dy) || 1;
          var bx = g.p.screen.x - (dx / dist) * g.p.screen.r * 1.04;
          var by = g.p.screen.y - (dy / dist) * g.p.screen.r * 1.04;
          var mx = (ax + bx) / 2, my = (ay + by) / 2;
          var wob = 16 * (g.side === 'right' ? -1 : 1);
          leaderLine.setAttribute('d',
            'M' + ax.toFixed(1) + ' ' + ay.toFixed(1) +
            ' Q' + (mx + wob).toFixed(1) + ' ' + (my - 18).toFixed(1) +
            ' ' + bx.toFixed(1) + ' ' + by.toFixed(1));
          leaderLine.setAttribute('opacity', (bestVis * 0.55).toFixed(3));
          if (leaderDot) {
            leaderDot.setAttribute('cx', bx.toFixed(1));
            leaderDot.setAttribute('cy', by.toFixed(1));
            leaderDot.setAttribute('opacity', (bestVis * 0.7).toFixed(3));
          }
        }
      }

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
          window.scrollTo(0, (i / last) * scrollRange());
          onScroll();
          return true;
        }
      }
      return false;
    }

    window.addEventListener('hashchange', goToHash);

    window.addEventListener('scroll', onScroll, { passive: true });
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


