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
    var UP = { x: 0, y: 1, z: 0 };

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

      /* Work out the pose for this exact scroll position. */
      solve: function (planets, segment, t, cam, time, motion, chew) {
        var from = footing(planets[segment], cam);
        var to = footing(planets[Math.min(segment + 1, planets.length - 1)], cam);
        var span = V.len(V.sub(to.pos, from.pos));
        var arcH = HW.clamp(span * cfg.arc, 0.7, 2.2);

        var f = HW.clamp01((t - LAUNCH) / (LAND - LAUNCH));
        var air = Math.sin(Math.PI * f);
        var pos = arcPoint(from.pos, to.pos, f, arcH);

        // standing still: breathe
        var idle = (t <= 0.001 || t >= 0.999) && motion ? Math.sin(time * 1.9) : 0;
        pos = V.add(pos, V.mul(from.up, idle * 0.02 * (1 - air)));

        // He bends his knees to load the jump and again to absorb the landing;
        // in the air the whole body stretches where it is moving fastest.
        var stretch, bend, crouchLean = 0;
        if (t < LAUNCH) {
          var p = HW.easeInOut(t / LAUNCH);
          bend = cfg.bend * p;                               // crouch
          stretch = 1 - 0.04 * p;
          crouchLean = p;
        } else if (t > LAND) {
          var l = (t - LAND) / (1 - LAND);
          var absorb = HW.clamp01(l < 0.38 ? l / 0.38 : 1 - (l - 0.38) / 0.62);
          bend = cfg.bend * 1.15 * absorb;                   // take the impact
          stretch = 1 - 0.05 * absorb;
          crouchLean = absorb * 0.7;
        } else {
          bend = 0;
          stretch = 1 + 0.24 * Math.abs(Math.cos(Math.PI * f));
        }
        stretch += idle * 0.008;
        stretch *= 1 - 0.21 * (chew || 0);   // chewing

        var dir = to.pos.x >= from.pos.x ? 1 : -1;

        return {
          pos: pos, air: air, f: f, t: t, arcH: arcH,
          from: from, to: to, stretch: stretch, bend: bend,
          lean: dir * (0.3 * air + 0.06 * crouchLean)
        };
      },

      /* The travel line, drawn only as far as he has actually got. */
      drawTrail: function (ctx, cam, state) {
        if (state.air < 0.02) return;
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
            arcPoint(state.from.pos, state.to.pos, (i / steps) * state.f, state.arcH), {});
          if (!sp.ok) { started = false; continue; }
          if (!started) { ctx.moveTo(sp.x, sp.y); started = true; }
          else ctx.lineTo(sp.x, sp.y);
        }
        ctx.stroke();
        ctx.restore();
      },

      draw: function (ctx, cam, state, time, motion) {
        if (!img || !img.complete || !img.naturalWidth) return;
        var sp = cam.project(state.pos, {});
        if (!sp.ok) return;
        var h = cfg.size * cam.focal / sp.depth;
        if (h < 4) return;
        var ratio = img.naturalWidth / img.naturalHeight;

        function stamp(point, alpha, stretch, lean, bend, jx, jy) {
          var p = cam.project(point, {});
          if (!p.ok) return;
          var ph = cfg.size * cam.focal / p.depth;
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.translate(p.x + jx, p.y + jy);
          ctx.rotate(lean);
          ctx.scale(1 / Math.sqrt(stretch), stretch);
          drawFigure(ctx, img, ph * ratio, ph, bend, cfg.legTop);
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

        // dust at take-off and at touchdown
        puff(ctx, cam, state.from, (state.t - LAUNCH) / 0.2, h);
        puff(ctx, cam, state.to, (state.t - LAND) / (1 - LAND), h);

        // onion skins: two faint earlier positions, the way an animator leaves
        // the previous drawings showing through
        if (motion && state.air > 0.08) {
          for (var g = 2; g >= 1; g--) {
            var fg = state.f - g * 0.06;
            if (fg <= 0) continue;
            stamp(arcPoint(state.from.pos, state.to.pos, fg, state.arcH),
                  0.26 / g, 1 + 0.2 * Math.abs(Math.cos(Math.PI * fg)),
                  state.lean * 0.8, 0, 0, 0);
          }
        }

        var bi = motion ? (Math.floor(time * HW.SETTINGS.boilFps) % 24) : 0;
        stamp(state.pos, 1, state.stretch, state.lean, state.bend,
              boil[bi * 2] * 0.9, boil[bi * 2 + 1] * 0.9);
      }
    };
  };
})(window.HW);

