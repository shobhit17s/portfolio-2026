/* hw-scene.js — the sky, the camera, and the loop that redraws everything.
   The camera is the whole navigation model: scrolling moves it from one world
   to the next, and every panel on the page is positioned from where the camera
   says its planet currently is. */
window.HW = window.HW || {};
(function (HW) {
  'use strict';
  var V = HW.V;

  HW.createScene = function (canvas, worlds) {
    var ctx = canvas.getContext('2d');
    var W = 1, H = 1, dpr = 1;
    var motion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var cam = {
      pos: { x: 0, y: 0, z: 8 },
      target: { x: 0, y: 0, z: 0 },
      focal: 800,
      shiftX: 0,
      shiftY: 0,
      right: { x: 1, y: 0, z: 0 },
      up: { x: 0, y: 1, z: 0 },
      fwd: { x: 0, y: 0, z: -1 },
      refresh: function () {
        this.fwd = V.norm(V.sub(this.target, this.pos));
        this.right = V.norm(V.cross(this.fwd, { x: 0, y: 1, z: 0 }));
        this.up = V.cross(this.right, this.fwd);
      },
      project: function (p, out) {
        out = out || {};
        var vx = p.x - this.pos.x, vy = p.y - this.pos.y, vz = p.z - this.pos.z;
        var d = vx * this.fwd.x + vy * this.fwd.y + vz * this.fwd.z;
        if (d < 0.08) { out.ok = false; out.x = 0; out.y = 0; out.depth = d; return out; }
        var cx = vx * this.right.x + vy * this.right.y + vz * this.right.z;
        var cy = vx * this.up.x + vy * this.up.y + vz * this.up.z;
        out.x = cx * this.focal / d + W / 2 + this.shiftX;
        out.y = -cy * this.focal / d + H / 2 + this.shiftY;
        out.depth = d;
        out.ok = true;
        return out;
      }
    };

    var planets = worlds.map(function (w, i) { return HW.createPlanet(w, i); });
    var character = HW.createCharacter(HW.CHARACTER);
    var munch = HW.createMunch();

    /* --- the sky: ink dots, crosses and a few four-point stars --- */
    var stars = [];
    (function () {
      var r = HW.rng(2024);
      for (var i = 0; i < HW.SETTINGS.starCount; i++) {
        var theta = r() * Math.PI * 2;
        var phi = Math.acos(2 * r() - 1);
        var rad = 42 + r() * 70;
        stars.push({
          p: {
            x: Math.sin(phi) * Math.cos(theta) * rad,
            y: Math.cos(phi) * rad * 0.7 - 6,
            z: Math.sin(phi) * Math.sin(theta) * rad - 8
          },
          kind: r() < 0.14 ? 2 : (r() < 0.3 ? 1 : 0),
          size: 0.8 + r() * 1.8,
          seed: r() * 6.28
        });
      }
    })();

    /* Camera anchors: one resting position per world. */
    function anchor(i) {
      var w = worlds[i];
      var d = w.radius * 4.6 + 2.1;
      return {
        pos: { x: w.pos.x + w.radius * 0.45, y: w.pos.y + w.radius * 0.7, z: w.pos.z + d },
        target: { x: w.pos.x, y: w.pos.y, z: w.pos.z },
        shift: (w.side === 'right' ? -1 : 1) * 0.17,
        lift: w.lift || 0
      };
    }

    /* ---------- framing the opening ----------
       The four worlds are placed so that, from the first camera position, none
       of them sits in front of another. On a small window that arrangement can
       still run off the edges, so before the first frame we step the camera
       backwards until every planet fits inside a safe area. Wide screens
       normally need no help at all and the factor stays at 1. */
    var openFit = 1;

    function fitOverflow(fit) {
      var A = anchor(0), t = A.target;
      var pos = {
        x: t.x + (A.pos.x - t.x) * fit,
        y: t.y + (A.pos.y - t.y) * fit,
        z: t.z + (A.pos.z - t.z) * fit
      };
      var fwd = V.norm(V.sub(t, pos));
      var rgt = V.norm(V.cross(fwd, { x: 0, y: 1, z: 0 }));
      var upv = V.cross(rgt, fwd);
      var narrow = W < 820;
      var cX = W / 2 + (narrow ? 0 : A.shift * W);
      var cY = H / 2 + (narrow ? -H * 0.19 : A.lift * H);
      // on a phone the far worlds are allowed to sit low, behind the text's
      // gradient — they still read as four separate worlds
      var box = narrow
        ? { l: 14, r: W - 14, t: 76, b: H - 56 }
        : { l: 22, r: W - 22, t: 96, b: H - 72 };

      var worst = 1;
      for (var i = 0; i < worlds.length; i++) {
        var w = worlds[i];
        var v = { x: w.pos.x - pos.x, y: w.pos.y - pos.y, z: w.pos.z - pos.z };
        var d = V.dot(v, fwd);
        if (d < 0.2) continue;
        var x = V.dot(v, rgt) * cam.focal / d + cX;
        var y = -V.dot(v, upv) * cam.focal / d + cY;
        var r = w.radius * cam.focal / d;
        var need = function (edge, value, centre) {
          var room = Math.abs(edge - centre);
          var reach = Math.abs(value - centre);
          return room > 1 && reach > room ? reach / room : 1;
        };
        worst = Math.max(worst,
          x + r > box.r ? need(box.r, x + r, cX) : 1,
          x - r < box.l ? need(box.l, x - r, cX) : 1,
          y + r > box.b ? need(box.b, y + r, cY) : 1,
          y - r < box.t ? need(box.t, y - r, cY) : 1);
      }
      return worst;
    }

    function measureOpening() {
      // a phone can never hold the whole spread at a readable size, so the
      // step-back is capped there rather than shrinking everything to pinheads
      var cap = W < 820 ? 2.45 : 3.4;
      var fit = 1;
      for (var i = 0; i < 14; i++) {
        var over = fitOverflow(fit);
        if (over <= 1.004) break;
        fit = Math.min(cap, fit * (1 + (over - 1) * 0.75));
        if (fit >= cap) break;
      }
      openFit = fit;
    }

    /* Rotation runs off its own clock rather than off wall time, so when the
       reader changes the speed the planets carry on from where they are
       instead of jumping to wherever the new speed says they should be. */
    var spinClock = 0;
    var lastTime = 0;

    var travel = { u: 0, segment: 0, t: 0 };
    var pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    var pointerPx = { x: -999, y: -999 };
    var hoverSpot = null;
    var clickHandler = null;
    var hoverLand = null;
    var landHandler = null;
    var start = performance.now();

    function layoutCamera(time) {
      var seg = HW.clamp(Math.floor(travel.u), 0, worlds.length - 2);
      var local = HW.clamp01(travel.u - seg);
      var t = HW.smoothstep(0.26, 0.95, local);
      travel.segment = seg;
      travel.t = t;

      var A = anchor(seg), B = anchor(Math.min(seg + 1, worlds.length - 1));
      var e = HW.easeInOut(t);
      cam.pos = V.lerp(A.pos, B.pos, e);
      cam.target = V.lerp(A.target, B.target, e);
      var narrow = W < 820;
      if (narrow) {
        // phones: stand further back and sit the planet in the upper half,
        // so the writing has the bottom of the screen to itself
        var away = 1.75;
        cam.pos.x = cam.target.x + (cam.pos.x - cam.target.x) * away;
        cam.pos.y = cam.target.y + (cam.pos.y - cam.target.y) * away;
        cam.pos.z = cam.target.z + (cam.pos.z - cam.target.z) * away;
      }
      cam.shiftX = narrow ? 0 : HW.lerp(A.shift, B.shift, e) * W;
      cam.shiftY = narrow ? -H * 0.19 : HW.lerp(A.lift, B.lift, e) * H;

      // ease the opening's extra distance away as soon as the journey starts
      var fit = HW.lerp(openFit, 1, HW.smoothstep(0, 0.45, travel.u));
      if (fit !== 1) {
        cam.pos.x = cam.target.x + (cam.pos.x - cam.target.x) * fit;
        cam.pos.y = cam.target.y + (cam.pos.y - cam.target.y) * fit;
        cam.pos.z = cam.target.z + (cam.pos.z - cam.target.z) * fit;
      }

      if (motion) {
        cam.pos.x += Math.sin(time * 0.21) * 0.16 + pointer.x * 0.5;
        cam.pos.y += Math.cos(time * 0.17) * 0.12 + pointer.y * 0.35;
      }
      cam.refresh();
    }

    function drawSky(time) {
      var g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#0D1120');
      g.addColorStop(0.55, '#141A2C');
      g.addColorStop(1, '#0F1424');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      // a wash of the active world's colour, as if the paper were bleeding
      var near = planets[Math.round(travel.u)] || planets[0];
      if (near && near.screen.visible) {
        var c = near.def.color;
        var glow = ctx.createRadialGradient(
          near.screen.x, near.screen.y, 0,
          near.screen.x, near.screen.y, Math.max(W, H) * 0.55);
        glow.addColorStop(0, 'hsla(' + c.h + ',' + c.s + '%,' + c.l + '%,0.16)');
        glow.addColorStop(1, 'hsla(' + c.h + ',' + c.s + '%,' + c.l + '%,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, W, H);
      }

      var out = {};
      ctx.strokeStyle = HW.PALETTE.chalk;
      ctx.fillStyle = HW.PALETTE.chalk;
      ctx.lineWidth = 1;
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        cam.project(s.p, out);
        if (!out.ok || out.x < -20 || out.x > W + 20 || out.y < -20 || out.y > H + 20) continue;
        var tw = motion ? 0.55 + 0.45 * Math.sin(time * 1.1 + s.seed) : 0.8;
        ctx.globalAlpha = 0.5 * tw;
        if (s.kind === 0) {
          ctx.beginPath();
          ctx.arc(out.x, out.y, s.size * 0.6, 0, Math.PI * 2);
          ctx.fill();
        } else if (s.kind === 1) {
          ctx.beginPath();
          ctx.moveTo(out.x - s.size, out.y); ctx.lineTo(out.x + s.size, out.y);
          ctx.moveTo(out.x, out.y - s.size); ctx.lineTo(out.x, out.y + s.size);
          ctx.stroke();
        } else {
          var r = s.size * 2.2;
          ctx.beginPath();
          ctx.moveTo(out.x, out.y - r);
          ctx.quadraticCurveTo(out.x, out.y, out.x + r, out.y);
          ctx.quadraticCurveTo(out.x, out.y, out.x, out.y + r);
          ctx.quadraticCurveTo(out.x, out.y, out.x - r, out.y);
          ctx.quadraticCurveTo(out.x, out.y, out.x, out.y - r);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    }

    /* the handwritten name that appears beside a door when you point at it */
    function drawSpotLabel(ctx, spot) {
      if (!spot || !spot.label) return;
      if (spot.kind && spot.kind !== 'link') return;
      ctx.save();
      ctx.font = '21px Caveat, cursive';
      ctx.textBaseline = 'middle';
      var tw = ctx.measureText(spot.label).width;
      var flip = spot.x + spot.r + 30 + tw + 26 > W;
      var x = flip ? spot.x - spot.r - 30 - tw : spot.x + spot.r + 16;
      var y = HW.clamp(spot.y - spot.r - 8, 24, H - 24);
      ctx.strokeStyle = 'rgba(242,237,225,0.65)';
      ctx.lineWidth = 1.3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(flip ? x + tw + 6 : x - 12, y + 4);
      ctx.lineTo(flip ? x + tw + 16 : x - 3, y + 4);
      ctx.stroke();
      // dark outline first, so the name reads over a sunlit planet as well as
      // over open sky
      ctx.strokeStyle = 'rgba(9,13,24,0.8)';
      ctx.lineWidth = 4;
      ctx.lineJoin = 'round';
      ctx.strokeText(spot.label, x, y);
      ctx.fillStyle = 'rgba(242,237,225,0.96)';
      ctx.fillText(spot.label, x, y);
      ctx.strokeStyle = 'rgba(242,237,225,0.65)';
      ctx.lineWidth = 1.3;
      var ax = x + tw + 7, ay = y - 6;
      ctx.beginPath();
      if (spot.locked) {
        // a small drawn padlock: this one asks before it opens
        ctx.moveTo(ax, ay + 1);
        ctx.lineTo(ax + 9, ay + 1);
        ctx.lineTo(ax + 9, ay + 8);
        ctx.lineTo(ax, ay + 8);
        ctx.closePath();
        ctx.moveTo(ax + 2, ay + 1);
        ctx.quadraticCurveTo(ax + 4.5, ay - 6, ax + 7, ay + 1);
      } else {
        // the little mark that means "this opens a page"
        ctx.moveTo(ax - 1, ay + 7);
        ctx.lineTo(ax + 8, ay - 2);
        ctx.moveTo(ax + 1, ay - 2);
        ctx.lineTo(ax + 8, ay - 2);
        ctx.lineTo(ax + 8, ay + 5);
      }
      ctx.stroke();
      ctx.restore();
    }

    /* Is this screen point inside this triangle? Sign-of-cross-product, three
       times. Used to decide whether a click landed on a landmass, because a
       coastline is not a circle. */
    function inTri(px, py, ax, ay, bx, by, cx, cy) {
      var d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by);
      var d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy);
      var d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay);
      var neg = (d1 < 0) || (d2 < 0) || (d3 < 0);
      var pos = (d1 > 0) || (d2 > 0) || (d3 > 0);
      return !(neg && pos);
    }

    /* Which landmass, if any, is under this point. Only the facets facing us
       were recorded, so the far side of the planet is never clickable. */
    function hitRegion(x, y) {
      for (var i = 0; i < planets.length; i++) {
        var rs = planets[i].regions;
        for (var r = 0; r < rs.length; r++) {
          var t = rs[r].tris;
          for (var k = 0; k < t.length; k += 6) {
            if (inTri(x, y, t[k], t[k + 1], t[k + 2], t[k + 3], t[k + 4], t[k + 5])) {
              rs[r].planet = planets[i];
              return rs[r];
            }
          }
        }
      }
      return null;
    }

    function openDoor(href) {
      if (!href) return;
      if (/^https?:\/\//i.test(href)) {
        var win = window.open(href, '_blank', 'noopener');
        if (!win) window.location.href = href;
      } else {
        window.location.href = href;
      }
    }

    function frame() {
      var time = (performance.now() - start) / 1000;
      spinClock += Math.min(0.1, time - lastTime) * (HW.SETTINGS.spinScale || 1);
      lastTime = time;
      pointer.x += (pointer.tx - pointer.x) * 0.06;
      pointer.y += (pointer.ty - pointer.y) * 0.06;

      layoutCamera(time);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawSky(time);

      for (var i = 0; i < planets.length; i++) planets[i].update(cam, spinClock, motion);

      var chew = munch.update(time);
      var state = character.solve(planets, travel.segment, travel.t, cam, time, motion, chew);
      var charDepth = cam.project(state.pos, {}).depth;

      var items = planets.map(function (p) { return { d: p.screen.depth, p: p }; });
      items.push({ d: charDepth, c: state });
      items.sort(function (a, b) { return b.d - a.d; });

      for (var k = 0; k < items.length; k++) {
        if (items[k].p) items[k].p.draw(ctx, cam, time, motion);
        else {
          character.drawTrail(ctx, cam, state);
          character.draw(ctx, cam, state, time, motion);
        }
      }

      // what is under the pointer right now, using this frame's positions
      hoverSpot = scene.hitSpot(pointerPx.x, pointerPx.y);
      for (var hp = 0; hp < planets.length; hp++) {
        planets[hp].hoverFood = null;
        planets[hp].hoverLink = null;
        planets[hp].hoverRegion = null;
      }
      if (hoverSpot) {
        if (hoverSpot.kind === 'snack') hoverSpot.planet.hoverFood = hoverSpot.item;
        else hoverSpot.planet.hoverLink = hoverSpot.item;
      }
      hoverLand = hoverSpot ? null : hitRegion(pointerPx.x, pointerPx.y);
      if (hoverLand) hoverLand.planet.hoverRegion = hoverLand;
      var overPlanet = scene.hitTest(pointerPx.x, pointerPx.y) >= 0;
      canvas.style.cursor = (hoverSpot || hoverLand || overPlanet) ? 'pointer' : 'default';

      // snacks fly to his mouth, not his feet
      var mouth = V.add(state.pos, { x: 0, y: HW.CHARACTER.size * 0.62, z: 0 });
      var mouthDepth = cam.project(mouth, {}).depth;
      var charH = HW.CHARACTER.size * cam.focal / Math.max(0.5, mouthDepth);
      munch.draw(ctx, cam, mouth, charH, time);

      drawSpotLabel(ctx, hoverSpot || (hoverLand && hoverLand.n
        ? { x: hoverLand.cx / hoverLand.n, y: hoverLand.cy / hoverLand.n,
            r: 0, label: hoverLand.label, locked: hoverLand.locked }
        : null));

      if (munch.eatenCount() === 0 && planets[0].hotspots.length) {
        munch.drawHint(ctx, planets[0].hotspots[0], time,
          HW.smoothstep(2.5, 4, time) * (1 - HW.smoothstep(0.25, 0.5, travel.u)));
      }

      if (typeof scene.onFrame === 'function') scene.onFrame(planets, travel, cam);
      requestAnimationFrame(frame);
    }

    var scene = {
      cam: cam,
      planets: planets,
      character: character,
      munch: munch,
      travel: travel,
      motion: motion,
      onFrame: null,

      setTravel: function (u) { travel.u = HW.clamp(u, 0, worlds.length - 1); },

      resize: function () {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        cam.focal = (H / 2) / Math.tan(HW.SETTINGS.fov * Math.PI / 360);
        measureOpening();
      },

      /* Snacks and doors are drawn into the canvas, so clicking them means
         checking the positions the planets recorded on the last frame. */
      hitSpot: function (x, y) {
        var best = null, bestD = Infinity;
        for (var i = 0; i < planets.length; i++) {
          var hs = planets[i].hotspots;
          for (var j = 0; j < hs.length; j++) {
            var dx = x - hs[j].x, dy = y - hs[j].y;
            var d = Math.sqrt(dx * dx + dy * dy);
            if (d < hs[j].r && d < bestD) { best = hs[j]; bestD = d; best.planet = planets[i]; }
          }
        }
        return best;
      },

      hitTest: function (x, y) {
        for (var i = 0; i < planets.length; i++) {
          var p = planets[i];
          if (!p.screen.visible || p.screen.r < 8) continue;
          var dx = x - p.screen.x, dy = y - p.screen.y;
          if (Math.sqrt(dx * dx + dy * dy) < p.screen.r * 1.08) return i;
        }
        return -1;
      },

      planets: planets,
      hitRegion: hitRegion,
      onPlanetClick: function (cb) { clickHandler = cb; },

      /* Called when someone clicks a landmass that is locked. The gate lives
         outside the scene — the planet only reports what was clicked. */
      onLockedLand: function (cb) { landHandler = cb; },
      openDoor: openDoor,

      begin: function () {
        this.resize();
        window.addEventListener('resize', this.resize.bind(this));
        window.addEventListener('pointermove', function (e) {
          pointer.tx = (e.clientX / W - 0.5) * 2;
          pointer.ty = (e.clientY / H - 0.5) * 2;
          pointerPx.x = e.clientX;
          pointerPx.y = e.clientY;
        });
        canvas.addEventListener('click', function (e) {
          var spot = scene.hitSpot(e.clientX, e.clientY);
          if (spot && spot.kind === 'snack') {
            munch.start(spot.item, spot.world, (performance.now() - start) / 1000);
            return;
          }
          if (spot && spot.kind === 'link') {
            if (spot.locked && landHandler) landHandler(spot.item || spot);
            else openDoor(spot.href);
            return;
          }
          var land = hitRegion(e.clientX, e.clientY);
          if (land) {
            /* A locked landmass asks for the password first; the gate is what
               decides whether the door opens. */
            if (land.locked && landHandler) landHandler(land);
            else openDoor(land.href);
            return;
          }
          var h = scene.hitTest(e.clientX, e.clientY);
          if (h >= 0 && clickHandler) clickHandler(h);
        });
        requestAnimationFrame(frame);
      }
    };
    return scene;
  };
})(window.HW);

