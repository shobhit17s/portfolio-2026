/* hw-munch.js — snack time.
   Click a snack on any world and it sails over to the traveller, who chews it
   with a few quick squashes, drops some crumbs and is briefly very pleased.
   Nothing else on the page depends on this file; delete it and everything
   still works, minus the joy. */
window.HW = window.HW || {};
(function (HW) {
  'use strict';
  var V = HW.V;

  HW.createMunch = function () {
    var S = HW.SNACKS;
    var active = null;
    var crumbs = [];
    var eatenEver = 0;

    return {
      busy: function () { return !!active; },
      eatenCount: function () { return eatenEver; },

      start: function (item, worldPos, time) {
        if (active) return;
        active = { item: item, from: worldPos, t0: time, phase: 'fly' };
      },

      /* Advance the sequence. Returns how hard the traveller is chewing
         right now, 0 to 1, which the character module turns into a squash. */
      update: function (time) {
        if (!active) return 0;
        if (active.phase === 'fly') {
          if (time - active.t0 >= S.fly) {
            active.phase = 'chew';
            active.t1 = time;
            active.item.eatenAt = time;
            eatenEver++;
            var r = HW.rng(Math.floor(time * 1000) % 100000);
            for (var i = 0; i < 9; i++) {
              crumbs.push({
                a: -Math.PI * 0.1 - r() * Math.PI * 0.8,
                v: 60 + r() * 110, born: time, len: 4 + r() * 7,
                r0: 0.22 + r() * 0.2
              });
            }
          }
          return 0;
        }
        var k = (time - active.t1) / S.chew;
        if (k >= 1) { active = null; return 0; }
        return Math.pow(Math.sin(k * Math.PI * 2.5), 2) * (1 - k * 0.55);
      },

      draw: function (ctx, cam, mouth, charH, time) {
        // crumbs first, so the snack passes in front of them
        for (var i = crumbs.length - 1; i >= 0; i--) {
          var c = crumbs[i];
          var age = time - c.born;
          if (age > 0.85) { crumbs.splice(i, 1); continue; }
          var sp = cam.project(mouth, {});
          if (!sp.ok) continue;
          // crumb colour sits between the chalk body and the dark sky, so they
          // read whether they fly across him or past him
          var dx = Math.cos(c.a) * (c.r0 * charH + c.v * age);
          var dy = Math.sin(c.a) * (c.r0 * charH + c.v * age) + 190 * age * age;
          ctx.save();
          ctx.globalAlpha = HW.clamp01(1 - age / 0.85) * 0.95;
          ctx.strokeStyle = '#D98F62';
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(sp.x + dx, sp.y + dy);
          ctx.lineTo(sp.x + dx + c.len, sp.y + dy - c.len * 0.6);
          ctx.stroke();
          ctx.restore();
        }

        if (!active) return;

        if (active.phase === 'fly') {
          var k = HW.clamp01((time - active.t0) / S.fly);
          var span = V.len(V.sub(mouth, active.from));
          var lift = 0.35 + span * 0.1;
          var p = V.lerp(active.from, mouth, HW.easeInOut(k));
          p = V.add(p, V.mul({ x: 0, y: 1, z: 0 }, Math.sin(Math.PI * k) * lift));
          var sp2 = cam.project(p, {});
          var img = active.item.img;
          if (!sp2.ok || !img || !img.naturalWidth) return;
          var h = active.item.size * (1 - 0.25 * k) * cam.focal / sp2.depth;
          var w = h * (img.naturalWidth / img.naturalHeight);
          ctx.save();
          ctx.translate(sp2.x, sp2.y);
          ctx.rotate(k * 3.2);
          ctx.drawImage(img, -w / 2, -h / 2, w, h);
          ctx.restore();
          return;
        }

        // chewing: one small heart drifting up, drawn with a wobble
        var ck = HW.clamp01((time - active.t1) / S.chew);
        var msp = cam.project(mouth, {});
        if (!msp.ok) return;
        var rise = 10 + ck * charH * 0.45;
        var s = Math.max(5, charH * 0.1);
        ctx.save();
        ctx.globalAlpha = (1 - ck) * 0.9;
        ctx.translate(msp.x + charH * 0.16, msp.y - rise);
        ctx.rotate(Math.sin(time * 6) * 0.12);
        ctx.strokeStyle = '#DE7C68';
        ctx.lineWidth = 1.8;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(0, s * 0.9);
        ctx.bezierCurveTo(-s * 1.25, -s * 0.15, -s * 0.5, -s, 0, -s * 0.32);
        ctx.bezierCurveTo(s * 0.5, -s, s * 1.25, -s * 0.15, 0, s * 0.9);
        ctx.stroke();
        ctx.restore();
      },

      /* A handwritten nudge next to the first snack, until one gets eaten. */
      drawHint: function (ctx, spot, time, alpha) {
        if (alpha <= 0.01) return;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = 'rgba(242,237,225,0.75)';
        ctx.fillStyle = 'rgba(242,237,225,0.8)';
        ctx.lineWidth = 1.4;
        ctx.lineCap = 'round';
        var x = spot.x + spot.r + 16, y = spot.y - spot.r - 10;
        ctx.beginPath();
        ctx.moveTo(x + 4, y + 2);
        ctx.quadraticCurveTo(x + 18, y - 4, x + 34, y - 6);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + 4, y + 2);
        ctx.lineTo(x + 13, y - 2);
        ctx.moveTo(x + 4, y + 2);
        ctx.lineTo(x + 11, y + 8);
        ctx.stroke();
        ctx.font = '20px Caveat, cursive';
        ctx.textBaseline = 'middle';
        ctx.fillText('he is always hungry', x + 40, y - 6);
        ctx.restore();
      }
    };
  };
})(window.HW);


