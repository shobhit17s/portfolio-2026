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

    /* ---------- moons ----------
       A moon is a small planet, built by exactly the same function, so it
       gets the same faceted surface, the same wavering outline and the same
       glow for free. The only thing that makes it a moon is that its position
       is recomputed every frame from its host's position and where it has got
       to on its orbit, rather than standing still in space.

       They are kept in a flat list beside the planets, and dropped into the
       same depth-sorted draw order, so a moon passing behind its planet is
       hidden by it and one passing in front covers it. */
    var moons = [];
    worlds.forEach(function (w, wi) {
      (w.moons || []).forEach(function (m, mi) {
        var def = {
          id: m.id,
          radius: m.radius,
          detail: 1,                      // fewer facets than a planet, but still round
          color: m.color,
          pos: { x: 0, y: 0, z: 0 },      // written each frame, see below
          tilt: m.axis || { x: 0.2, z: 0.1 },
          spin: m.spin || 0.2,
          props: [],
          food: []
        };
        moons.push({
          m: m,
          host: wi,
          planet: HW.createPlanet(def, 90 + wi * 8 + mi),
          def: def
        });
      });
    });

    /* Where each moon is, this instant. Called once a frame, before drawing. */
    function placeMoons(clock) {
      for (var i = 0; i < moons.length; i++) {
        var mo = moons[i], m = mo.m, host = worlds[mo.host];
        var a = (m.phase || 0) * Math.PI * 2 + clock * (m.speed || 0.1) * Math.PI * 2;
        var ct = Math.cos(m.tilt || 0), st = Math.sin(m.tilt || 0);
        var ox = Math.cos(a) * m.orbit;
        var oz = Math.sin(a) * m.orbit;
        mo.def.pos.x = host.pos.x + ox;
        mo.def.pos.y = host.pos.y + oz * st;   // the tilt lifts the far side
        mo.def.pos.z = host.pos.z + oz * ct;
        mo.planet.update(cam, clock, motion);
        mo.planet.presence = planets[mo.host].presence;
      }
    }

    /* ---------- the name across a moon's face ----------

       PROPORTIONS. Everything below is written in units of `u`, the size of
       the big line. The small line is 0.46 of it, the gap between them 0.30,
       and the block is centred on the moon's middle. Those three numbers are
       the whole design; change one and the solver does the rest. */
    var MARK = {
      small: 0.46,      // the small line, as a fraction of the big one
      gap: 0.30,        // the space between them
      pad: 0.06,        // margin inside the shape, as a fraction of its radius

      /* A MOON IS NOT A CIRCLE. It is a sphere drawn as flat facets, so its
         outline is a polygon sitting INSIDE the circle the maths knows
         about - the chords cut the corners off. Fitting type to the circle
         therefore fits it to a shape slightly larger than the one you can
         see, and the ends of a long word poke out over the edge.

         So the solver is given a smaller circle to work in: far enough
         inside the real one to clear the flats, and no further. */
      inset: 0.88
    };

    /* How wide each line is PER PIXEL of its own font size. Measured once
       per moon and kept, because it never changes: the strings are fixed and
       text width is proportional to font size. */
    var markWidths = {};

    function markMetrics(ctx, m) {
      if (markWidths[m.id]) return markWidths[m.id];
      var face = HW.PALETTE.bodyFace;
      ctx.save();
      ctx.font = '700 100px ' + face;
      var big = ctx.measureText(m.mark.big || '').width / 100;
      ctx.font = '600 100px ' + face;
      var small = ctx.measureText((m.mark.small || '').toUpperCase()).width / 100;
      ctx.restore();
      /* both expressed against u: the big line IS u, the small one is a
         fraction of it, and the small caps carry a little letter-spacing */
      markWidths[m.id] = Math.max(big, small * MARK.small * 1.18);
      return markWidths[m.id];
    }

    /* The largest u at which the two lines still sit inside a circle of
       radius r. Both lines reach the same distance from the middle by
       construction, so one test serves for both. */
    function fitMark(k, r) {
      var lo = 0, hi = r;
      for (var i = 0; i < 18; i++) {
        var u = (lo + hi) / 2;
        /* how far the block's outermost corner sits from the centre,
           vertically: half the block's height */
        var half = (MARK.small + MARK.gap + 1) * u / 2;
        if (half >= r) { hi = u; continue; }
        /* the chord available at that height, less a margin */
        var room = 2 * (Math.sqrt(r * r - half * half) - r * MARK.pad);
        if (k * u <= room) lo = u; else hi = u;
      }
      return lo;
    }

    function drawMoonMark(ctx, mo) {
      var m = mo.m;
      if (!m.mark || !m.mark.big) return;
      var sc = mo.planet.screen;
      var host = planets[mo.host].screen;
      if (!sc.visible || sc.r < 22 || mo.planet.presence < 0.5) return;
      /* Hidden only when the moon is genuinely hidden: further away than its
         planet AND overlapping it on screen. Testing depth alone would drop
         the name off a moon that is simply out at the far side of its orbit
         but still in plain sight beside the planet. */
      if (sc.depth > host.depth) {
        var ddx = sc.x - host.x, ddy = sc.y - host.y;
        if (Math.sqrt(ddx * ddx + ddy * ddy) < host.r + sc.r * 0.4) return;
      }

      var u = fitMark(markMetrics(ctx, m), sc.r * MARK.inset);
      if (u < 7) return;                       // too small to read; say nothing

      var blockH = (MARK.small + MARK.gap + 1) * u;
      var top = sc.y - blockH / 2;
      var smallY = top + MARK.small * u / 2;
      var bigY = top + MARK.small * u + MARK.gap * u + u / 2;

      ctx.save();
      ctx.globalAlpha = mo.planet.presence;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      /* A moon is shaded facet by facet, so the face under the writing is
         light in one place and dark in another. The letters are painted in
         the sky's colour and given a soft halo in the writing colour - the
         two furthest-apart colours the page has - so they stay legible
         wherever on the moon they happen to land. */
      ctx.shadowColor = HW.PALETTE.chalk;
      ctx.shadowBlur = Math.max(2, u * 0.34);
      ctx.fillStyle = HW.PALETTE.sky;

      ctx.font = '600 ' + (MARK.small * u).toFixed(2) + 'px ' + HW.PALETTE.bodyFace;
      if ('letterSpacing' in ctx) ctx.letterSpacing = (u * 0.05).toFixed(2) + 'px';
      ctx.fillText((m.mark.small || '').toUpperCase(), sc.x, smallY);
      if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';

      ctx.font = '700 ' + u.toFixed(2) + 'px ' + HW.PALETTE.bodyFace;
      ctx.fillText(m.mark.big, sc.x, bigY);
      ctx.restore();
    }

    /* Which moon is under the pointer, if any. A moon is a circle on screen,
       so this is the one place a circular test is honest. */
    function hitMoon(x, y) {
      for (var i = 0; i < moons.length; i++) {
        var mo = moons[i], sc = mo.planet.screen;
        if (!sc.visible || sc.r < 4 || mo.planet.presence < 0.5) continue;
        var dx = x - sc.x, dy = y - sc.y;
        if (Math.sqrt(dx * dx + dy * dy) <= sc.r * 1.1) return mo.m;
      }
      return null;
    }
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
      /* How far back the camera stands. It is worked out FROM the planet's
         own size, which means shrinking a planet normally changes nothing on
         screen - the camera simply walks in and fills the gap. `zoom` is the
         way out of that: above 1 the camera holds its ground, so a smaller
         planet really does take up less of the frame and everything standing
         on it keeps the size it had. */
      var d = (w.radius * 4.6 + 2.1) * (w.zoom || 1);
      return {
        pos: { x: w.pos.x + w.radius * 0.45, y: w.pos.y + w.radius * 0.7, z: w.pos.z + d },
        target: { x: w.pos.x, y: w.pos.y, z: w.pos.z },
        shift: (w.side === 'right' ? -1 : 1) * 0.17,
        lift: w.lift || 0
      };
    }

    /* ---------- framing the opening ----------
       THE PAGE OPENS ON ONE WORLD, NOT ON ALL OF THEM.

       It used to step the camera backwards far enough to fit all four planets
       into the first screen, so the reader arrived looking at the whole solar
       system. That told them everything at once and left the scroll with
       nothing to reveal. Now the camera simply stands where it stands for the
       first world, and the others are somewhere out there in the dark until
       the reader goes looking.

       `openFit` is kept at 1, and the fitting code below with it, because the
       arrangement of the worlds in hw-config.js is still tuned against it and
       it is the thing to turn back on if the wide view is ever wanted again. */
    var openFit = 1;
    var FIT_OPENING = false;

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
      if (!FIT_OPENING) { openFit = 1; return; }
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

    /* `dir` is which way the reader is travelling: +1 down the page, -1 back
       up it. It is remembered rather than recomputed from scratch, because a
       reader who stops scrolling has not changed their mind about which way
       they were going. See the note in hw-character.js about why it matters. */
    var travel = { u: 0, segment: 0, t: 0, dir: 1 };
    var lastU = 0;
    var pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    var pointerPx = { x: -999, y: -999 };
    var hoverSpot = null;
    var clickHandler = null;
    var hoverLand = null;
    var hoverMoon = null;
    var landHandler = null;
    var drawerHandler = null;
    var start = performance.now();

    function layoutCamera(time) {
      /* A dead zone, so a trackpad twitch or a rounding wobble at the end of a
         smooth scroll cannot flip the traveller round. Anything smaller than
         this is not a change of direction, it is noise. */
      var du = travel.u - lastU;
      if (du > 0.0008) { travel.dir = 1; lastU = travel.u; }
      else if (du < -0.0008) { travel.dir = -1; lastU = travel.u; }

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
      /* The primary background, flat. It used to be a blue gradient written
         out as three numbers; now it is whatever --cs-bg-1 says, so the sky
         matches every other page on the site and follows light and dark
         without a second set of values to keep in step. */
      ctx.fillStyle = HW.PALETTE.sky;
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

      /* HOW MUCH OF EACH WORLD IS SHOWING.

         One world at a time. A planet is solid while the camera is at it, and
         gone by the time the camera has settled on the next one - but BOTH
         ends of a jump are fully visible while the jump is happening, which is
         what the 0.5 keeps: at the halfway point of a scroll between two
         worlds, |u - i| is 0.5 for both of them, and both are still at 1.

         Reading the curve: at rest on world 0, world 1 is 1.0 away, which is
         past the far end of the fade, so it is not drawn at all. Start
         scrolling and it comes up. */
      for (var i = 0; i < planets.length; i++) {
        planets[i].update(cam, spinClock, motion);
        planets[i].presence = 1 - HW.smoothstep(0.5, 1.0, Math.abs(travel.u - i));
      }

      var chew = munch.update(time);
      var state = character.solve(planets, travel.segment, travel.t, cam, time, motion, chew, travel.dir);
      var charDepth = cam.project(state.pos, {}).depth;

      placeMoons(spinClock);

      var items = planets.map(function (p) { return { d: p.screen.depth, p: p }; });
      for (var mi = 0; mi < moons.length; mi++) {
        items.push({ d: moons[mi].planet.screen.depth, p: moons[mi].planet });
      }
      items.push({ d: charDepth, c: state });
      items.sort(function (a, b) { return b.d - a.d; });

      for (var k = 0; k < items.length; k++) {
        if (items[k].p) {
          var show = items[k].p.presence;
          if (show <= 0.004) continue;          // not on screen, not drawn
          if (show >= 0.999) {
            items[k].p.draw(ctx, cam, time, motion);
          } else {
            ctx.save();
            ctx.globalAlpha = show;
            items[k].p.draw(ctx, cam, time, motion);
            ctx.restore();
          }
        }
        else {
          character.drawTrail(ctx, cam, state);
          character.draw(ctx, cam, state, time, motion);
        }
      }

      /* ---------- what is written across a moon ----------

         Each moon carries its own name, painted onto its face: a small line
         over a big one. It replaces the keyhole that used to mark a locked
         study - a name says more than a padlock, and the password screen
         announces itself well enough when you get there.

         THE ONLY HARD PART IS MAKING IT FIT. A moon is a circle, and a
         circle is the least forgiving shape to set type in: the room
         available narrows the further you get from the middle, so a block of
         two lines is widest exactly where the circle is tightest. Rather
         than pick a size that happens to work for these two names at this
         size and break on the next one, the size is SOLVED for.

         The whole block is measured once, at a reference size, and from then
         on both its width and its height are just that measurement times
         whatever size we choose. So we can ask the question the other way
         round: what is the largest size at which the block still sits inside
         the circle? The answer is found by halving the interval - guess,
         test, halve, repeat - which lands on it in a few steps and is exact
         enough that nothing ever touches the edge.

         Change a name to something twice as long and it simply arrives
         smaller. Nothing else has to be adjusted. */
      for (var lk = 0; lk < moons.length; lk++) {
        drawMoonMark(ctx, moons[lk]);
      }

      // what is under the pointer right now, using this frame's positions
      hoverSpot = scene.hitSpot(pointerPx.x, pointerPx.y);
      hoverMoon = hitMoon(pointerPx.x, pointerPx.y);
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
      canvas.style.cursor =
        (hoverSpot || hoverLand || hoverMoon || overPlanet) ? 'pointer' : 'default';

      // snacks fly to his mouth, not his feet
      var mouth = V.add(state.pos, { x: 0, y: HW.CHARACTER.size * 0.62, z: 0 });
      var mouthDepth = cam.project(mouth, {}).depth;
      var charH = HW.CHARACTER.size * cam.focal / Math.max(0.5, mouthDepth);
      munch.draw(ctx, cam, mouth, charH, time);

      /* One label at a time, and the nearest thing wins: an object standing
         on a planet, then a moon, then a landmass. */
      var labelled = hoverSpot;
      if (!labelled && hoverMoon) {
        var msc = null;
        for (var mh = 0; mh < moons.length; mh++) {
          if (moons[mh].m === hoverMoon) { msc = moons[mh].planet.screen; break; }
        }
        if (msc) {
          labelled = { x: msc.x, y: msc.y - msc.r * 0.9, r: 0,
                       label: hoverMoon.label, locked: hoverMoon.locked };
        }
      }
      if (!labelled && hoverLand && hoverLand.n) {
        labelled = { x: hoverLand.cx / hoverLand.n, y: hoverLand.cy / hoverLand.n,
                     r: 0, label: hoverLand.label, locked: hoverLand.locked };
      }
      drawSpotLabel(ctx, labelled);

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
      moons: moons,
      hitRegion: hitRegion,
      onPlanetClick: function (cb) { clickHandler = cb; },

      /* Called when someone clicks a landmass that is locked. The gate lives
         outside the scene — the planet only reports what was clicked. */
      onLockedLand: function (cb) { landHandler = cb; },
      /* something on a planet wants a panel opened rather than a page */
      onDrawer: function (cb) { drawerHandler = cb; },
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
            /* Three things a door can be: shut (ask for the password), a
               panel (open it here), or a place (go there). */
            if (spot.locked && landHandler) landHandler(spot.item || spot);
            else if (spot.drawer && drawerHandler) drawerHandler(spot.drawer);
            else openDoor(spot.href);
            return;
          }
          var moon = hitMoon(e.clientX, e.clientY);
          if (moon) {
            /* A locked case study asks for the password first; the gate is
               what decides whether the door opens. */
            if (moon.locked && landHandler) landHandler(moon);
            else openDoor(moon.href);
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


