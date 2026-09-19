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
    var navLinks = [].slice.call(document.querySelectorAll('.hw-nav-link'));
    var leaderLine = document.getElementById('hw-leader-line');
    var leaderDot = document.getElementById('hw-leader-dot');
    var hint = document.getElementById('hw-scroll-hint');
    var sizes = [];
    var narrow = false;
    var spin = HW.createSpinControl();

    function measure() {
      narrow = window.innerWidth < 820;
      document.body.classList.toggle('hw-narrow', narrow);
      sizes = panels.map(function (p) {
        return { w: p.offsetWidth, h: p.offsetHeight };
      });
    }

    function scrollRange() {
      return Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    }

    function onScroll() {
      var t = HW.clamp01(window.scrollY / scrollRange());
      scene.setTravel(t * last);
      if (hint) hint.classList.toggle('is-gone', window.scrollY > 60);
    }

    function goTo(index) {
      window.scrollTo({
        top: (index / last) * scrollRange(),
        behavior: scene.motion ? 'smooth' : 'auto'
      });
    }

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
      for (var nl = 0; nl < navLinks.length; nl++) {
        navLinks[nl].classList.toggle('is-active', nl === active);
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
    navLinks.forEach(function (a, i) {
      a.addEventListener('click', function (e) { e.preventDefault(); goTo(i); });
    });
    scene.onPlanetClick(function (i) { goTo(i); });

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () { measure(); onScroll(); });

    // panels only size correctly once webfonts have settled
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    measure();
    onScroll();

    return { goTo: goTo, measure: measure };
  };
})(window.HW);

