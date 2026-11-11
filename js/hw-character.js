/* hw-character.js — the traveller, and how he gets from one world to the next.
   The drawing itself never changes; what changes is how it is placed, squashed,
   leaned and repeated. That is enough to read as animation:

     crouch  ->  launch  ->  flight  ->  land  ->  settle

   Scroll position drives the whole sequence, so the jump plays forward when the
   reader scrolls down and backwards when they scroll up, frame for frame. */
window.HW = window.HW || {};
(function (HW) {
  'use strict';
  var V = HW.V;

  // where the hop begins and ends within one scroll segment
  var LAUNCH = 0.12;
  var LAND = 0.9;

  HW.createCharacter = function (cfg) {
    var img = null;
    var sheet = null;              // the drawn sprite sheet, once one exists
    var UP = { x: 0, y: 1, z: 0 };

    /* ---------- the seven states of a hop ----------

       Until real sprite sheets arrive, every one of these is faked out of the
       single standing drawing by folding the legs and stretching the body.
       The moment a sheet is supplied (see HW.CHARACTER.sprite) the same seven
       names are looked up in it instead, and nothing else has to change. */
    var PHASES = ['stand', 'crouch', 'launch', 'rise', 'fall', 'land', 'settle'];

    /* The cuts between states. These are not arbitrary: they are set so that
       a state with three drawings gets roughly three times as long on screen
       as a state with one, which is what stops the landing - the busiest
       three drawings in the whole sheet - flashing past unseen. */
    function phaseOf(t, f) {
      if (t <= 0.001 || t >= 0.999) return { name: 'stand', f: 0 };
      if (t < LAUNCH) return { name: 'crouch', f: t / LAUNCH };
      if (t <= LAND) {
        if (f < 0.18) return { name: 'launch', f: f / 0.18 };
        if (f < 0.52) return { name: 'rise', f: (f - 0.18) / 0.34 };
        return { name: 'fall', f: (f - 0.52) / 0.48 };
      }
      var l = (t - LAND) / (1 - LAND);
      if (l < 0.55) return { name: 'land', f: l / 0.55 };
      return { name: 'settle', f: (l - 0.55) / 0.45 };
    }

    /* Which cell of the sheet to show. A state with three drawings plays
       through them across its own slice of the jump; a state with one just
       holds. 'stand' loops on the clock instead, so he breathes while waiting. */
    function cellFor(phase, time) {
      if (!sheet || !sheet.complete || !sheet.naturalWidth) return null;
      var spec = cfg.sprite && cfg.sprite.states && cfg.sprite.states[phase.name];
      if (!spec) return null;
      var n = spec.frames || 1;
      var i = spec.loop
        ? Math.floor(time * (spec.fps || 6)) % n
        : Math.min(n - 1, Math.floor(HW.clamp01(phase.f) * n));
      return { col: i, row: spec.row || 0 };
    }

    // a pre-rolled set of tiny offsets: the figure is nudged a fraction of a
    // pixel a few times a second so the line looks redrawn, not pasted
    var boil = new Float32Array(48);
    (function () {
      var r = HW.rng(5501);
      for (var i = 0; i < boil.length; i++) boil[i] = (r() - 0.5) * 2;
    })();

    function footing(planet, cam) {
      var toCam = V.norm(V.sub(cam.pos, planet.def.pos));
      var dir = V.norm({
        x: toCam.x * 0.58 + UP.x * 0.9,
        y: toCam.y * 0.58 + UP.y * 0.9,
        z: toCam.z * 0.58 + UP.z * 0.9
      });
      return { pos: V.add(planet.def.pos, V.mul(dir, planet.def.radius + cfg.hover)), up: dir };
    }

    /* Draw the figure in horizontal bands so the legs can fold while the body
       above the hips stays rigid — a knee bend out of a single flat drawing.
       bend 0 is the drawing exactly as it was made. */
    function drawFigure(ctx, img, w, h, bend, legTop) {
      if (bend < 0.003) { ctx.drawImage(img, -w / 2, -h, w, h); return; }
      var bands = 26;
      var sw = img.naturalWidth, sh = img.naturalHeight;
      var stack = 0;                       // height built up from the feet
      for (var i = 0; i < bands; i++) {
        var u0 = i / bands, u1 = (i + 1) / bands;   // 0 = soles, 1 = top of head
        var mid = (u0 + u1) / 2;
        var squeeze = 1, widen = 1;
        if (mid < legTop) {
          var x = mid / legTop;                     // 0 at the foot, 1 at the hip
          // the fold is concentrated at the knee, so thigh and shin keep their
          // length and the leg reads as hinged rather than squashed
          var d = (x - 0.52) / 0.24;
          var fold = Math.exp(-d * d);
          squeeze = 1 - bend * fold;
          widen = 1 + bend * 0.1 * fold;            // knees push outward a little
        }
        var dstH = h * (u1 - u0) * squeeze;
        var dstW = w * widen;
        ctx.drawImage(img,
          0, sh * (1 - u1), sw, sh * (u1 - u0),
          -dstW / 2, -(stack + dstH) - 0.5, dstW, dstH + 1);
        stack += dstH;
      }
    }

    /* Put one drawing on the page, feet at the origin. Either a cell from the
       sheet, or - while there is no sheet - the single drawing, folded. */
    function paint(ctx, w, h, bend, cell) {
      if (cell) {
        var sp = cfg.sprite;
        var scale = h / sp.height;           // height is measured to the crown
        ctx.drawImage(sheet,
          cell.col * sp.cell.w, cell.row * sp.cell.h, sp.cell.w, sp.cell.h,
          -sp.cell.w * scale / 2, -sp.ground * scale,
          sp.cell.w * scale, sp.cell.h * scale);
        return;
      }
      drawFigure(ctx, img, w, h, bend, cfg.legTop);
    }

    function arcPoint(from, to, f, arcH) {
      f = HW.clamp01(f);
      var p = V.lerp(from, to, HW.easeInOut(f));
      return V.add(p, V.mul(UP, Math.sin(Math.PI * f) * arcH));
    }

    /* a little burst of chalk where a foot leaves or meets the ground */
    function puff(ctx, cam, spot, age, scalePx) {
      if (age < 0 || age > 1) return;
      var sp = cam.project(spot.pos, {});
      if (!sp.ok) return;
      var tip = cam.project(V.add(spot.pos, V.mul(spot.up, 0.4)), {});
      var upAngle = Math.atan2(tip.y - sp.y, tip.x - sp.x);
      var fade = 1 - age;
      ctx.save();
      ctx.translate(sp.x, sp.y);
      ctx.rotate(upAngle + Math.PI / 2);
      ctx.strokeStyle = 'rgba(242,237,225,' + (0.5 * fade).toFixed(3) + ')';
      ctx.lineWidth = 1.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (var i = 0; i < 7; i++) {
        var a = (-0.95 + (i / 6) * 1.9) + (i % 2 ? 0.12 : -0.12);
        var r0 = scalePx * (0.12 + age * 0.5);
        var r1 = r0 + scalePx * (0.1 + age * 0.22);
        ctx.moveTo(Math.cos(a) * r0, -Math.abs(Math.sin(a)) * r0 * 0.45);
        ctx.lineTo(Math.cos(a) * r1, -Math.abs(Math.sin(a)) * r1 * 0.55);
      }
      ctx.stroke();
      ctx.restore();
    }

    return {
      setImage: function (i) { img = i; },
      setSheet: function (i) { sheet = i; },
      PHASES: PHASES,

      /* Work out the pose for this exact scroll position.

         TWO CLOCKS, NOT ONE

         This used to run off a single number: how far through the segment the
         scroll has got. Scroll back up and that number ran backwards, so the
         whole jump played in reverse - he landed, un-crouched, flew home feet
         first and finished by standing up out of a crouch he never made. A
         film run backwards, which is not what going back up a page should
         look like.

         So the pose was separated from the position:

           t   WHERE HE IS. Straight off the scroll, unchanged. At t=0 he is
               on this planet, at t=1 on the next one, and in between he is
               on the arc. Scroll up and this runs backwards, which is right -
               he really is going back the way he came.

           pt  WHAT HE IS DOING. Always runs 0 -> 1, whichever way the reader
               is going, so the jump is always crouch, launch, rise, fall,
               land, settle. Going up the page it is simply the mirror of t,
               which puts the crouch at the end of the segment he is leaving
               and the landing at the start of the one he is arriving at -
               exactly where they belong.

         Everything about his body reads pt. Everything about his whereabouts
         reads t. The two only ever disagree about direction. */
      solve: function (planets, segment, t, cam, time, motion, chew, scrollDir) {
        var sdir = scrollDir < 0 ? -1 : 1;
        var from = footing(planets[segment], cam);
        var to = footing(planets[Math.min(segment + 1, planets.length - 1)], cam);
        var span = V.len(V.sub(to.pos, from.pos));
        var arcH = HW.clamp(span * cfg.arc, 0.7, 2.2);

        // ---- where he is ----
        var f = HW.clamp01((t - LAUNCH) / (LAND - LAUNCH));
        var air = Math.sin(Math.PI * f);
        var pos = arcPoint(from.pos, to.pos, f, arcH);

        // ---- what he is doing ----
        var pt = sdir < 0 ? 1 - t : t;
        var pf = HW.clamp01((pt - LAUNCH) / (LAND - LAUNCH));

        /* The planet he pushed off, and the one he is aiming at. Going back up
           the page these are the other way round from `from` and `to`, which
           is what puts the take-off dust under the right feet. */
        var origin = sdir < 0 ? to : from;
        var target = sdir < 0 ? from : to;

        // standing still: breathe
        var idle = (pt <= 0.001 || pt >= 0.999) && motion ? Math.sin(time * 1.9) : 0;
        pos = V.add(pos, V.mul(origin.up, idle * 0.02 * (1 - air)));

        // He bends his knees to load the jump and again to absorb the landing;
        // in the air the whole body stretches where it is moving fastest.
        var stretch, bend, crouchLean = 0;
        if (pt < LAUNCH) {
          var p = HW.easeInOut(pt / LAUNCH);
          bend = cfg.bend * p;                               // crouch
          stretch = 1 - 0.04 * p;
          crouchLean = p;
        } else if (pt > LAND) {
          var l = (pt - LAND) / (1 - LAND);
          var absorb = HW.clamp01(l < 0.38 ? l / 0.38 : 1 - (l - 0.38) / 0.62);
          bend = cfg.bend * 1.15 * absorb;                   // take the impact
          stretch = 1 - 0.05 * absorb;
          crouchLean = absorb * 0.7;
        } else {
          bend = 0;
          stretch = 1 + 0.24 * Math.abs(Math.cos(Math.PI * pf));
        }
        stretch += idle * 0.008;
        stretch *= 1 - 0.21 * (chew || 0);   // chewing

        // which way across the screen he is actually moving
        var faceX = target.pos.x >= origin.pos.x ? 1 : -1;

        return {
          pos: pos, air: air, f: f, t: t, arcH: arcH,
          pt: pt, pf: pf, sdir: sdir,
          from: from, to: to, origin: origin, target: target,
          stretch: stretch, bend: bend,
          phase: phaseOf(pt, pf),
          lean: faceX * (0.3 * air + 0.06 * crouchLean)
        };
      },

      /* The travel line, drawn only over the part of the arc he has actually
         covered - which, going back up the page, is the far half rather than
         the near one. */
      drawTrail: function (ctx, cam, state) {
        if (state.air < 0.02) return;
        var a = state.sdir < 0 ? state.f : 0;
        var b = state.sdir < 0 ? 1 : state.f;
        var steps = 26;
        ctx.save();
        ctx.setLineDash([6, 8]);
        ctx.lineWidth = 1.6;
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(242,237,225,' + (0.42 * state.air).toFixed(3) + ')';
        ctx.beginPath();
        var started = false;
        for (var i = 0; i <= steps; i++) {
          var sp = cam.project(
            arcPoint(state.from.pos, state.to.pos, a + (b - a) * (i / steps), state.arcH), {});
          if (!sp.ok) { started = false; continue; }
          if (!started) { ctx.moveTo(sp.x, sp.y); started = true; }
          else ctx.lineTo(sp.x, sp.y);
        }
        ctx.stroke();
        ctx.restore();
      },

      draw: function (ctx, cam, state, time, motion) {
        var haveSheet = sheet && sheet.complete && sheet.naturalWidth;
        var haveDrawing = img && img.complete && img.naturalWidth;
        if (!haveSheet && !haveDrawing) return;
        var sp = cam.project(state.pos, {});
        if (!sp.ok) return;
        var h = cfg.size * cam.focal / sp.depth;
        if (h < 4) return;
        var ratio = haveDrawing ? img.naturalWidth / img.naturalHeight : 1;

        var cell = cellFor(state.phase || { name: 'stand', f: 0 }, time);

        /* WHEN THE DRAWINGS DO THE ACTING, THE CODE STOPS

           Without a sheet, the crouch and the stretch are faked by squashing
           one drawing. With a sheet, somebody has drawn the crouch, and
           squashing it on top would be doing the same thing twice: a bent
           figure bent again. So the stretch is switched off entirely and the
           lean is cut right back - just enough to suggest which way he is
           going, since these drawings are all front-on. */
        var poseStretch = cell ? 1 : state.stretch;
        var poseLean = cell ? state.lean * 0.3 : state.lean;

        function stamp(point, alpha, stretch, lean, bend, jx, jy, useCell) {
          var p = cam.project(point, {});
          if (!p.ok) return;
          var ph = cfg.size * cam.focal / p.depth;
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.translate(p.x + jx, p.y + jy);
          ctx.rotate(lean);
          ctx.scale(1 / Math.sqrt(stretch), stretch);
          paint(ctx, ph * ratio, ph, bend, useCell === false ? null : cell);
          ctx.restore();
        }

        // a little weight on the ground while he is standing on something
        if (state.air < 0.25) {
          ctx.save();
          ctx.globalAlpha = 0.3 * (1 - state.air / 0.25);
          ctx.fillStyle = '#0B0F1C';
          ctx.beginPath();
          ctx.ellipse(sp.x, sp.y, h * 0.17, h * 0.035, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // dust at take-off and at touchdown, under whichever pair of feet is
        // doing the work - which swaps over when the reader scrolls back up
        puff(ctx, cam, state.origin, (state.pt - LAUNCH) / 0.2, h);
        puff(ctx, cam, state.target, (state.pt - LAND) / (1 - LAND), h);

        // onion skins: two faint earlier positions, the way an animator leaves
        // the previous drawings showing through
        if (motion && state.air > 0.08) {
          for (var g = 2; g >= 1; g--) {
            // behind him, which is the other side of him going back up
            var fg = state.f - state.sdir * g * 0.06;
            if (fg <= 0 || fg >= 1) continue;
            /* fainter once he is in colour, or the ghosts read as a smear
               rather than as earlier drawings showing through */
            stamp(arcPoint(state.from.pos, state.to.pos, fg, state.arcH),
                  (cell ? 0.15 : 0.26) / g,
                  cell ? 1 : 1 + 0.2 * Math.abs(Math.cos(Math.PI * fg)),
                  poseLean * 0.8, 0, 0, 0);
          }
        }

        var bi = motion ? (Math.floor(time * HW.SETTINGS.boilFps) % 24) : 0;
        stamp(state.pos, 1, poseStretch, poseLean, state.bend,
              boil[bi * 2] * 0.9, boil[bi * 2 + 1] * 0.9);
      }
    };
  };
})(window.HW);


