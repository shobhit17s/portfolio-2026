/* hw-planet.js — one low-poly planet, drawn as if by hand.
   Geometry gives us the silhouette and the way light falls; everything you
   actually *see* is a stroke: seams between facets that wander the way a hand
   does, a chalk contour, pencil hatching in the shadows, and your own drawings
   pinned to the surface.

   Two different kinds of line live here, on purpose:
     - inside the planet, the seams wander but never change. They are drawn
       once and carried around as the planet turns.
     - around the edge, the contour boils — it is redrawn a few times a second,
       because that is what an inked outline does in hand-drawn animation. */
window.HW = window.HW || {};
(function (HW) {
  'use strict';
  var V = HW.V;
  var BOIL_SETS = 3;

  HW.createPlanet = function (def, index) {
    var geo = HW.icosphere(def.detail);
    var rand = HW.rng(917 + index * 613);
    var n = geo.verts.length;

    /* --- continents ---------------------------------------------------
       A landmass is not a separate object sitting on the planet. It is the
       planet's own corners, pushed further out: every vertex inside the
       region moves outward along the direction it already points, so the
       facets stretch into cliffs and the shape stays folded paper. The
       coastline wanders, because a circle drawn around a point would read as
       a lens flare rather than a country. */
    var continents = (def.continents || []).map(function (c, ci) {
      return {
        id: c.id, href: c.href, label: c.label, locked: !!c.locked,
        color: c.color, rise: (c.rise == null ? 0.13 : c.rise),
        spread: (c.spread == null ? 34 : c.spread),
        dir: HW.latLon(c.lat, c.lon),
        seed: 11.3 + ci * 7.7
      };
    });

    /* How much of continent `ct` a direction belongs to: 1 well inland, 0 out
       at sea, with a short steep climb at the shore. */
    function share(dir, ct) {
      var d = HW.clamp(V.dot(dir, ct.dir), -1, 1);
      var ang = Math.acos(d) * 180 / Math.PI;
      var wob = Math.sin(dir.x * 5.1 + ct.seed) *
                Math.cos(dir.y * 4.3 + ct.seed * 1.7) *
                Math.sin(dir.z * 6.7 + ct.seed * 0.6);
      var shore = ct.spread * (1 + 0.26 * wob);
      return HW.smoothstep(shore, shore * 0.84, ang);
    }

    /* per vertex: which continent claims it, and how strongly */
    var vertCont = new Int8Array(n);
    var vertLift = new Float32Array(n);
    for (var vi = 0; vi < n; vi++) {
      vertCont[vi] = -1;
      var bestT = 0;
      for (var ci2 = 0; ci2 < continents.length; ci2++) {
        var t = share(geo.verts[vi], continents[ci2]);
        if (t > bestT) { bestT = t; vertCont[vi] = ci2; }
      }
      vertLift[vi] = bestT;
    }

    /* Nudge each corner in or out so the sphere reads as folded paper, never
       as a perfect ball. A little goes a long way: push this past a few per
       cent and the outline stops being a planet and starts being a rock. */
    var CRUMPLE = 0.055;
    var local = new Array(n);
    for (var i = 0; i < n; i++) {
      var r = def.radius * (1 + (rand() - 0.5) * CRUMPLE);
      local[i] = V.mul(geo.verts[i], r);
    }

    /* A facet is land when at least two of its three corners are, so the
       coastline runs along facet edges and stays as faceted as everything
       else. */
    var faceCont = new Int8Array(geo.faces.length);
    for (var fc = 0; fc < geo.faces.length; fc++) {
      var fv = geo.faces[fc], tally = {};
      faceCont[fc] = -1;
      for (var q0 = 0; q0 < 3; q0++) {
        var cid = vertCont[fv[q0]];
        if (cid < 0 || vertLift[fv[q0]] < 0.5) continue;
        tally[cid] = (tally[cid] || 0) + 1;
        if (tally[cid] >= 2) faceCont[fc] = cid;
      }
    }

    /* Each sheet, as a list of the facets it covers and the corners those
       facets use. The sheet is cut along facet edges, so its outline follows
       the planet's own geometry even though it is a separate object. */
    var contFaces = continents.map(function () { return []; });
    var contVerts = continents.map(function () { return []; });
    var seenVert = continents.map(function () { return {}; });
    for (var cf2 = 0; cf2 < geo.faces.length; cf2++) {
      var ci3 = faceCont[cf2];
      if (ci3 < 0) continue;
      contFaces[ci3].push(cf2);
      for (var vv = 0; vv < 3; vv++) {
        var vidx = geo.faces[cf2][vv];
        if (!seenVert[ci3][vidx]) { seenVert[ci3][vidx] = 1; contVerts[ci3].push(vidx); }
      }
    }

    /* Where the top of each sheet sits, once the planet has turned. Allocated
       once and rewritten every frame. */
    var topWorld = new Array(n);
    var topScreen = new Array(n);
    for (var tw2 = 0; tw2 < n; tw2++) {
      topWorld[tw2] = { x: 0, y: 0, z: 0 };
      topScreen[tw2] = { x: 0, y: 0, depth: 0, ok: false };
    }

    // Pre-rolled "hands": three slightly different wobbles we cycle between so
    // the line boils the way ink does in hand-drawn animation.
    var jitter = [];
    for (var s = 0; s < BOIL_SETS; s++) {
      var set = new Float32Array(n * 2);
      for (var j = 0; j < n; j++) {
        set[j * 2] = (rand() - 0.5) * 2;
        set[j * 2 + 1] = (rand() - 0.5) * 2;
      }
      jitter.push(set);
    }

    var faceTone = new Float32Array(geo.faces.length);
    for (var f = 0; f < geo.faces.length; f++) faceTone[f] = (rand() - 0.5) * 0.038;

    /* Every seam between two facets wanders, and it wanders the SAME way for
       both facets that meet along it — so the shapes still tile with no gaps,
       they just no longer meet along a ruler-straight line. Unlike the
       contour, this wander is rolled once and never changes: the inside of a
       planet is drawn, not animated. */
    var WAVE = 2;                                  // bends per seam
    var edgeWave = new Float32Array(geo.edges.length * WAVE);
    var edgeWidth = new Float32Array(geo.edges.length);
    var edgePts = new Float32Array(geo.edges.length * WAVE * 2);
    var edgeNorm = new Float32Array(geo.edges.length * 2);
    for (var ew = 0; ew < geo.edges.length; ew++) {
      for (var wv = 0; wv < WAVE; wv++) edgeWave[ew * WAVE + wv] = (rand() - 0.5) * 2;
      edgeWidth[ew] = 0.65 + rand() * 0.75;        // a little pressure variation
    }

    /* which three seams belong to each facet, and which way round */
    var edgeLookup = {};
    for (var el = 0; el < geo.edges.length; el++) {
      edgeLookup[geo.edges[el].a + '_' + geo.edges[el].b] = el;
    }
    var faceEdges = geo.faces.map(function (face) {
      var out = [];
      for (var e = 0; e < 3; e++) {
        var p1 = face[e], q1 = face[(e + 1) % 3];
        out.push({ e: edgeLookup[Math.min(p1, q1) + '_' + Math.max(p1, q1)], rev: p1 > q1 });
      }
      return out;
    });

    var props = (def.props || []).map(function (p) {
      return {
        dir: HW.latLon(p.lat, p.lon), size: p.size, src: p.src, img: null,
        href: p.href || null, label: p.label || '',  // a prop with an href is a door
        pole: !!p.pole,       // stands on the spin axis, so it never turns away
        glow: !!p.glow        // carries a lamp
      };
    });

    // snacks: like props, but clickable, and they grow back after they are eaten
    var food = (def.food || []).map(function (p, i) {
      return {
        dir: HW.latLon(p.lat, p.lon), size: p.size, src: p.src, img: null,
        eatenAt: 0, phase: i * 1.9
      };
    });

    var world = new Array(n);
    var screen = new Array(n);
    for (var k = 0; k < n; k++) { world[k] = { x: 0, y: 0, z: 0 }; screen[k] = { x: 0, y: 0, depth: 0, ok: false }; }

    return {
      def: def,
      props: props,
      food: food,
      hotspots: [],        // clickable things on screen: snacks and doors
      /* Where each landmass ended up on screen this frame, as the triangles
         it actually covers. A continent is not a circle, so a circular
         hotspot would either miss the coast or swallow the sea. */
      regions: continents.map(function (c) {
        return { id: c.id, href: c.href, label: c.label, locked: c.locked,
                 color: c.color, tris: [], cx: 0, cy: 0, n: 0 };
      }),
      hoverRegion: null,
      hoverFood: null,
      hoverLink: null,
      geo: geo,
      screen: { x: 0, y: 0, r: 0, depth: 0, visible: false },

      /* Project the whole planet for this frame. `spinTime` is the rotation
         clock from the scene, not wall time. */
      update: function (cam, spinTime, motion) {
        var angle = spinTime * def.spin * (motion ? 1 : 0.18);
        var m = HW.spinMatrix(def.tilt.x, def.tilt.z, angle);
        this.matrix = m;
        for (var i = 0; i < n; i++) {
          var w = HW.applyMatrix(m, local[i]);
          world[i].x = w.x + def.pos.x;
          world[i].y = w.y + def.pos.y;
          world[i].z = w.z + def.pos.z;
          cam.project(world[i], screen[i]);
        }
        var c = cam.project(def.pos, {});
        this.screen.x = c.x; this.screen.y = c.y;
        this.screen.depth = c.depth;
        this.screen.r = c.ok ? def.radius * cam.focal / c.depth : 0;
        this.screen.visible = c.ok && c.depth > 0.2;
      },

      draw: function (ctx, cam, time, motion) {
        this.hotspots.length = 0;
        for (var rr = 0; rr < this.regions.length; rr++) {
          this.regions[rr].tris.length = 0;
          this.regions[rr].cx = this.regions[rr].cy = this.regions[rr].n = 0;
        }
        if (!this.screen.visible || this.screen.r < 2) return;
        var regions = this.regions;
        var litLand = this.hoverRegion;
        var P = HW.PALETTE;
        var L = V.norm(HW.SETTINGS.lightDir);
        var camPos = cam.pos;
        var faces = geo.faces;
        var radiusPx = this.screen.r;

        // how far the hand slips, in pixels — bigger planets, looser line
        var wob = HW.clamp(radiusPx * 0.008, 0.22, 1.35);
        var setIndex = motion ? (Math.floor(time * HW.SETTINGS.boilFps) % BOIL_SETS) : 0;
        var jx = jitter[setIndex];

        /* --- atmosphere: a loose chalk circle drawn a little too big --- */
        ctx.save();
        ctx.globalAlpha = 0.16;
        ctx.strokeStyle = P.chalk;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([radiusPx * 0.12, radiusPx * 0.1]);
        ctx.beginPath();
        ctx.ellipse(this.screen.x, this.screen.y, radiusPx * 1.13, radiusPx * 1.1,
          time * 0.04, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        if (def.ring) {
          ctx.save();
          ctx.globalAlpha = 0.4;
          ctx.strokeStyle = P.chalk;
          ctx.lineWidth = 1.6;
          ctx.setLineDash([7, 6]);
          ctx.beginPath();
          ctx.ellipse(this.screen.x, this.screen.y, radiusPx * 1.75, radiusPx * 0.42,
            -0.42, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        /* --- facets --- */
        var edges = geo.edges;
        var lightOf = new Float32Array(faces.length);
        var front = new Uint8Array(faces.length);

        // the inside of the planet sits still: it uses the first wobble set,
        // never the one that changes with time
        var js = jitter[0];
        var sxS = function (i) { return screen[i].x + js[i * 2] * wob; };
        var syS = function (i) { return screen[i].y + js[i * 2 + 1] * wob; };

        // where each seam wanders, this frame, in screen space
        for (var ei2 = 0; ei2 < edges.length; ei2++) {
          var ed = edges[ei2];
          var ax0 = sxS(ed.a), ay0 = syS(ed.a), bx0 = sxS(ed.b), by0 = syS(ed.b);
          var dxE = bx0 - ax0, dyE = by0 - ay0;
          var lenE = Math.sqrt(dxE * dxE + dyE * dyE) || 1;
          var nxE = -dyE / lenE, nyE = dxE / lenE;
          edgeNorm[ei2 * 2] = nxE;
          edgeNorm[ei2 * 2 + 1] = nyE;
          var ampE = HW.clamp(lenE * 0.03, 0.3, 4.2);
          for (var kk = 0; kk < WAVE; kk++) {
            var tt = (kk + 1) / (WAVE + 1);
            var off = edgeWave[ei2 * WAVE + kk] * ampE;
            edgePts[(ei2 * WAVE + kk) * 2] = ax0 + dxE * tt + nxE * off;
            edgePts[(ei2 * WAVE + kk) * 2 + 1] = ay0 + dyE * tt + nyE * off;
          }
        }

        function traceFace(fi) {
          var fa = faces[fi], fe = faceEdges[fi];
          ctx.moveTo(sxS(fa[0]), syS(fa[0]));
          for (var e = 0; e < 3; e++) {
            var info = fe[e];
            for (var k = 0; k < WAVE; k++) {
              var idx = info.rev ? (WAVE - 1 - k) : k;
              var o = (info.e * WAVE + idx) * 2;
              ctx.lineTo(edgePts[o], edgePts[o + 1]);
            }
            ctx.lineTo(sxS(fa[(e + 1) % 3]), syS(fa[(e + 1) % 3]));
          }
          ctx.closePath();
        }

        for (var fi = 0; fi < faces.length; fi++) {
          var fa = faces[fi];
          var a = world[fa[0]], b = world[fa[1]], c2 = world[fa[2]];
          var nrm = V.norm(V.cross(V.sub(b, a), V.sub(c2, a)));
          var cx = (a.x + b.x + c2.x) / 3, cy = (a.y + b.y + c2.y) / 3, cz = (a.z + b.z + c2.z) / 3;
          var toCam = V.norm({ x: camPos.x - cx, y: camPos.y - cy, z: camPos.z - cz });
          var isFront = V.dot(nrm, toCam) > 0;
          front[fi] = isFront ? 1 : 0;
          if (!isFront) continue;
          if (!screen[fa[0]].ok || !screen[fa[1]].ok || !screen[fa[2]].ok) { front[fi] = 0; continue; }

          var landId = faceCont[fi];

          /* On the sea, each facet catches the light on its own — that is what
             makes a low-poly planet look folded. On the land we light the
             SMOOTH shape underneath instead: the direction straight out from
             the planet's centre, which changes gradually from one triangle to
             the next. The plateau then reads as one continuous surface with a
             soft gradient across it, rather than a mosaic. The per-facet tone
             variation is dropped there for the same reason. */
          var litBy = nrm;
          if (landId >= 0) {
            litBy = V.norm({ x: cx - def.pos.x, y: cy - def.pos.y, z: cz - def.pos.z });
          }
          var light = HW.clamp01(V.dot(litBy, L) * 0.5 + 0.5);
          light = HW.clamp01(light * light * 1.25 + (landId >= 0 ? 0 : faceTone[fi]));
          lightOf[fi] = light;

          ctx.beginPath();
          traceFace(fi);
          var landLit = landId >= 0 && litLand === regions[landId];
          ctx.fillStyle = HW.shade(landId >= 0 ? continents[landId].color : def.color,
            landLit ? HW.clamp01(light * 1.16 + 0.1) : light);
          ctx.fill();

          if (landId >= 0) {
            var rg = regions[landId];
            var t0x = sxS(fa[0]), t0y = syS(fa[0]);
            var t1x = sxS(fa[1]), t1y = syS(fa[1]);
            var t2x = sxS(fa[2]), t2y = syS(fa[2]);
            rg.tris.push(t0x, t0y, t1x, t1y, t2x, t2y);
            rg.cx += (t0x + t1x + t2x) / 3;
            rg.cy += (t0y + t1y + t2y) / 3;
            rg.n++;
          }

          // pencil hatching where the light does not reach — sea only, so the
          // plateau keeps its clean face
          if (light < 0.3 && radiusPx > 40 && landId < 0) {
            ctx.save();
            ctx.globalAlpha = 0.2;
            ctx.strokeStyle = P.ink;
            ctx.lineWidth = 1;
            var mx = (sxS(fa[0]) + sxS(fa[1]) + sxS(fa[2])) / 3;
            var my = (syS(fa[0]) + syS(fa[1]) + syS(fa[2])) / 3;
            var hl = radiusPx * 0.06;
            ctx.beginPath();
            for (var h = -1; h <= 1; h++) {
              ctx.moveTo(mx - hl + h * 3, my + hl + h * 3.4);
              ctx.lineTo(mx + hl + h * 3, my - hl + h * 3.4);
            }
            ctx.stroke();
            ctx.restore();
          }
        }

        /* --- the seams, drawn one at a time so each keeps its own weight --- */
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        if (radiusPx > 34) {
          for (var ci = 0; ci < edges.length; ci++) {
            var ce = edges[ci];
            if (ce.f[1] < 0) continue;
            if (!front[ce.f[0]] || !front[ce.f[1]]) continue;   // contour, or hidden
            var lt = (lightOf[ce.f[0]] + lightOf[ce.f[1]]) * 0.5;
            ctx.beginPath();
            ctx.moveTo(sxS(ce.a), syS(ce.a));
            for (var k2 = 0; k2 < WAVE; k2++) {
              var o2 = (ci * WAVE + k2) * 2;
              ctx.lineTo(edgePts[o2], edgePts[o2 + 1]);
            }
            ctx.lineTo(sxS(ce.b), syS(ce.b));
            ctx.strokeStyle = 'rgba(11,15,28,' + (0.08 + 0.24 * (1 - lt)).toFixed(3) + ')';
            ctx.lineWidth = edgeWidth[ci];
            ctx.stroke();
          }
        } else {
          // far away, the seams are one faint batched pass
          ctx.beginPath();
          for (var cj = 0; cj < edges.length; cj++) {
            var cf = edges[cj];
            if (cf.f[1] < 0 || !front[cf.f[0]] || !front[cf.f[1]]) continue;
            ctx.moveTo(sxS(cf.a), syS(cf.a));
            for (var k3 = 0; k3 < WAVE; k3++) {
              var o3 = (cj * WAVE + k3) * 2;
              ctx.lineTo(edgePts[o3], edgePts[o3 + 1]);
            }
            ctx.lineTo(sxS(cf.b), syS(cf.b));
          }
          ctx.strokeStyle = 'rgba(11,15,28,0.16)';
          ctx.lineWidth = 0.9;
          ctx.stroke();
        }
        ctx.restore();

        /* --- the inked contour: only the edges where the planet turns away.
               This one still boils, because a contour is the line a person
               redraws every frame. --- */
        ctx.save();
        ctx.lineCap = 'round';
        for (var pass = 0; pass < 2; pass++) {
          ctx.beginPath();
          for (var ei = 0; ei < edges.length; ei++) {
            var e = edges[ei];
            if (e.f[1] < 0) continue;
            if (front[e.f[0]] === front[e.f[1]]) continue;
            var nx = edgeNorm[ei * 2], ny = edgeNorm[ei * 2 + 1];
            var lean = (pass === 0 ? 1 : -1) * wob * 0.7;
            ctx.moveTo(sxS(e.a), syS(e.a));
            for (var q = 0; q < WAVE; q++) {
              var oq = (ei * WAVE + q) * 2;
              // the wander of the seam, plus a shiver that changes with the
              // boil — the contour is the one line that stays alive
              var shiver = jx[((e.a + q * 7 + ei) % (jx.length / 2)) * 2] * wob * 1.1;
              ctx.lineTo(edgePts[oq] + nx * (shiver + lean),
                         edgePts[oq + 1] + ny * (shiver + lean));
            }
            ctx.lineTo(sxS(e.b), syS(e.b));
          }
          ctx.strokeStyle = pass === 0
            ? 'rgba(242,237,225,0.5)'
            : 'rgba(242,237,225,0.78)';
          ctx.lineWidth = pass === 0 ? 3.2 : 1.5;
          ctx.stroke();
        }
        ctx.restore();

        /* ==================================================================
           THE CONTINENTS — sheets of foam, cut to shape and laid on top
           ==================================================================

           This is an architectural model, so the continents are made of a
           different material from the planet and are a different OBJECT. They
           are not the planet's own corners pushed out; the planet underneath
           is untouched and complete, and a sheet simply sits on it.

           Each sheet is drawn in three moves:

             1. the cut edge — the thickness of the foam, a band standing
                perpendicular to the surface all the way round the outline;
             2. the face — the whole sheet as ONE filled shape. Every facet it
                covers goes into a single path and is filled once, so the
                triangles merge and no seam survives anywhere inside it;
             3. the cut line — a firm outline where the face meets the edge.

           The planet's own seams carry on underneath and are simply covered,
           the way the board under a model is. */
        var mFoam = this.matrix;
        for (var sh = 0; sh < continents.length; sh++) {
          var sheet = continents[sh];
          var sfaces = contFaces[sh];
          if (!sfaces.length) continue;
          var region = regions[sh];
          var topR = def.radius * (1 + sheet.rise);

          /* where the top of this sheet is, now that the planet has turned */
          var sv = contVerts[sh];
          for (var q1 = 0; q1 < sv.length; q1++) {
            var vi3 = sv[q1];
            var tw3 = HW.applyMatrix(mFoam, V.mul(geo.verts[vi3], topR));
            topWorld[vi3].x = tw3.x + def.pos.x;
            topWorld[vi3].y = tw3.y + def.pos.y;
            topWorld[vi3].z = tw3.z + def.pos.z;
            cam.project(topWorld[vi3], topScreen[vi3]);
          }

          /* which of its facets we can see, and how the sheet as a whole is
             lit — one value, because a flat sheet has one face */
          var shown = [];
          var lightHi = -1, lightLo = 2;
          var hiAt = null, loAt = null, sumLight = 0;
          for (var q2 = 0; q2 < sfaces.length; q2++) {
            var sf = sfaces[q2], sfa = faces[sf];
            var ta = topWorld[sfa[0]], tb = topWorld[sfa[1]], tc = topWorld[sfa[2]];
            if (!topScreen[sfa[0]].ok || !topScreen[sfa[1]].ok || !topScreen[sfa[2]].ok) continue;
            var tn = V.norm(V.cross(V.sub(tb, ta), V.sub(tc, ta)));
            var tcx = (ta.x + tb.x + tc.x) / 3;
            var tcy = (ta.y + tb.y + tc.y) / 3;
            var tcz = (ta.z + tb.z + tc.z) / 3;
            if (V.dot(tn, V.norm({ x: camPos.x - tcx, y: camPos.y - tcy, z: camPos.z - tcz })) <= 0) continue;
            shown.push(sf);
            var fl = HW.clamp01(V.dot(tn, L) * 0.5 + 0.5);
            sumLight += fl;
            var sxm = (topScreen[sfa[0]].x + topScreen[sfa[1]].x + topScreen[sfa[2]].x) / 3;
            var sym = (topScreen[sfa[0]].y + topScreen[sfa[1]].y + topScreen[sfa[2]].y) / 3;
            if (fl > lightHi) { lightHi = fl; hiAt = { x: sxm, y: sym }; }
            if (fl < lightLo) { lightLo = fl; loAt = { x: sxm, y: sym }; }
          }
          if (!shown.length) continue;

          var warmSheet = litLand === region;
          var curve = function (v) {
            var out = HW.clamp01(v * v * 1.25 + 0.14);
            return warmSheet ? HW.clamp01(out * 1.12 + 0.08) : out;
          };
          var faceLight = curve(sumLight / shown.length);

          /* ---- 1. the cut edge ----
             A quad per outline segment, from the planet's surface up to the
             top of the sheet. Foam is paler where it has been cut than on its
             printed face, so the band is drawn desaturated and a little
             lighter — that contrast is what says "this is a sheet with a
             thickness", rather than a shape painted on. */
          /* A gentle step, not a white rim: enough of a lift to read as the
             cut side of the sheet, not so much that it becomes the loudest
             thing on the planet. */
          var cutColor = { h: sheet.color.h, s: sheet.color.s * 0.58, l: sheet.color.l * 1.06 };
          var outline = [];      // where the face stops and the cut begins
          for (var q3 = 0; q3 < shown.length; q3++) {
            var ff = shown[q3], fe2 = faceEdges[ff], ffa = faces[ff];
            for (var e2 = 0; e2 < 3; e2++) {
              var eInfo = fe2[e2], ed2 = edges[eInfo.e];
              var nb = ed2.f[0] === ff ? ed2.f[1] : ed2.f[0];
              if (nb >= 0 && faceCont[nb] === sh) continue;   // inside the sheet
              var ia = ffa[e2], ib = ffa[(e2 + 1) % 3];
              if (!screen[ia].ok || !screen[ib].ok) continue;
              outline.push(ia, ib);

              /* Only the near side of the band. A cut edge faces away from
                 the middle of the piece it belongs to, so the direction from
                 this facet's centre out to the edge — flattened against the
                 surface — is which way this bit of edge looks. If it does not
                 look towards us, it is round the back, behind the sheet's own
                 face, and drawing it would put a band where there should be a
                 clean silhouette. */
              var wallMid = {
                x: (topWorld[ia].x + topWorld[ib].x) / 2,
                y: (topWorld[ia].y + topWorld[ib].y) / 2,
                z: (topWorld[ia].z + topWorld[ib].z) / 2
              };
              var outward = V.norm(V.sub(wallMid, def.pos));
              var fmid = {
                x: (topWorld[ffa[0]].x + topWorld[ffa[1]].x + topWorld[ffa[2]].x) / 3,
                y: (topWorld[ffa[0]].y + topWorld[ffa[1]].y + topWorld[ffa[2]].y) / 3,
                z: (topWorld[ffa[0]].z + topWorld[ffa[1]].z + topWorld[ffa[2]].z) / 3
              };
              var away = V.sub(wallMid, fmid);
              var wallN = V.sub(away, V.mul(outward, V.dot(away, outward)));
              if (V.len(wallN) < 1e-6) continue;
              wallN = V.norm(wallN);
              var toCamW = V.norm(V.sub(camPos, wallMid));
              if (V.dot(wallN, toCamW) <= 0.02) continue;

              var wallLight = HW.clamp01(V.dot(wallN, L) * 0.5 + 0.44);
              ctx.beginPath();
              ctx.moveTo(screen[ia].x, screen[ia].y);
              ctx.lineTo(screen[ib].x, screen[ib].y);
              ctx.lineTo(topScreen[ib].x, topScreen[ib].y);
              ctx.lineTo(topScreen[ia].x, topScreen[ia].y);
              ctx.closePath();
              ctx.fillStyle = HW.shade(cutColor, wallLight);
              ctx.fill();
              /* hairline along the same path, so neighbouring quads meet with
                 no gap showing the planet through */
              ctx.strokeStyle = HW.shade(cutColor, wallLight);
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }

          /* ---- 2. the face, as one shape ----
             Every visible facet goes into a SINGLE path and is filled once.
             Adjacent triangles share their edges exactly, so filling the lot
             in one go merges them: there is no seam to see, because there is
             no second fill to leave one. */
          ctx.beginPath();
          for (var q4 = 0; q4 < shown.length; q4++) {
            var pf = faces[shown[q4]];
            ctx.moveTo(topScreen[pf[0]].x, topScreen[pf[0]].y);
            ctx.lineTo(topScreen[pf[1]].x, topScreen[pf[1]].y);
            ctx.lineTo(topScreen[pf[2]].x, topScreen[pf[2]].y);
            ctx.closePath();
          }
          /* One fill, but not one flat colour: a sheet bent round a planet
             still catches the light unevenly, so the fill runs from the
             brightest facet to the dimmest. A gradient has no steps in it, so
             the face stays seamless while still reading as a solid object. */
          var paint = HW.shade(sheet.color, faceLight);
          if (hiAt && loAt && (Math.abs(hiAt.x - loAt.x) > 1 || Math.abs(hiAt.y - loAt.y) > 1)) {
            var grad = ctx.createLinearGradient(hiAt.x, hiAt.y, loAt.x, loAt.y);
            grad.addColorStop(0, HW.shade(sheet.color, curve(lightHi)));
            grad.addColorStop(1, HW.shade(sheet.color, curve(lightLo)));
            paint = grad;
          }
          ctx.fillStyle = paint;
          ctx.fill();

          /* ---- 3. the cut line ----
             Foam board shows a crisp line where the face stops and the cut
             begins. This has to be its OWN path: filling the merged shape
             joins the triangles, but stroking it would draw every triangle
             including the shared inner edges, which is exactly the mesh we are
             trying to be rid of. So only the edges collected above — the ones
             with nothing of this sheet on the far side — are drawn. */
          if (outline.length) {
            ctx.beginPath();
            for (var q6 = 0; q6 < outline.length; q6 += 2) {
              var oa = topScreen[outline[q6]], ob = topScreen[outline[q6 + 1]];
              ctx.moveTo(oa.x, oa.y);
              ctx.lineTo(ob.x, ob.y);
            }
            ctx.strokeStyle = HW.shade(sheet.color, HW.clamp01(faceLight * 0.58));
            ctx.lineWidth = HW.clamp(radiusPx * 0.0036, 0.7, 1.6);
            ctx.lineCap = 'round';
            ctx.stroke();
          }

          /* remember where it landed, for clicking */
          for (var q5 = 0; q5 < shown.length; q5++) {
            var rf = faces[shown[q5]];
            var r0 = topScreen[rf[0]], r1 = topScreen[rf[1]], r2 = topScreen[rf[2]];
            region.tris.push(r0.x, r0.y, r1.x, r1.y, r2.x, r2.y);
            region.cx += (r0.x + r1.x + r2.x) / 3;
            region.cy += (r0.y + r1.y + r2.y) / 3;
            region.n++;
          }
        }

        /* --- a pin for each landmass ---------------------------------
           A continent turns away as the planet spins, and a visitor should
           never have to wait for one to come back round before they can open
           it. So each one keeps a small pin on screen: over the land while
           the land is facing us, and parked at the planet's edge — on the
           side it will reappear from — while it is not. The pin is what you
           click; the land itself is clickable too, whenever it is there. */
        var mPin = this.matrix;
        for (var gi = 0; gi < continents.length; gi++) {
          var cg = continents[gi], rg2 = regions[gi];
          var cdW = HW.applyMatrix(mPin, cg.dir);
          var cpt = {
            x: def.pos.x + cdW.x * def.radius,
            y: def.pos.y + cdW.y * def.radius,
            z: def.pos.z + cdW.z * def.radius
          };
          var csp = cam.project(cpt, {});
          if (!csp.ok) continue;
          var cFacing = V.dot(cdW, V.norm(V.sub(camPos, cpt)));
          var px, py, shown = cFacing > 0.2;
          if (shown && rg2.n) {
            px = rg2.cx / rg2.n; py = rg2.cy / rg2.n;
          } else {
            var vx = csp.x - this.screen.x, vy = csp.y - this.screen.y;
            var vl = Math.sqrt(vx * vx + vy * vy) || 1;
            px = this.screen.x + (vx / vl) * radiusPx * 0.88;
            py = this.screen.y + (vy / vl) * radiusPx * 0.88;
          }

          var pinR = HW.clamp(radiusPx * 0.052, 7, 15);
          var warm = this.hoverRegion === rg2;
          ctx.save();
          ctx.globalAlpha = shown ? 1 : 0.62;
          ctx.beginPath();
          ctx.arc(px, py, pinR * (warm ? 1.22 : 1), 0, Math.PI * 2);
          ctx.fillStyle = HW.shade(cg.color, 0.86);
          ctx.fill();
          ctx.strokeStyle = 'rgba(242,237,225,0.9)';
          ctx.lineWidth = 1.6;
          ctx.stroke();
          /* the keyhole: these two are locked */
          if (cg.locked) {
            ctx.beginPath();
            ctx.arc(px, py - pinR * 0.12, pinR * 0.26, 0, Math.PI * 2);
            ctx.moveTo(px, py + pinR * 0.05);
            ctx.lineTo(px, py + pinR * 0.46);
            ctx.strokeStyle = 'rgba(11,15,28,0.72)';
            ctx.lineWidth = 1.8;
            ctx.stroke();
          }
          ctx.restore();

          this.hotspots.push({
            kind: 'link', item: rg2, label: cg.label, href: cg.href,
            locked: cg.locked, x: px, y: py, r: pinR + 6
          });
        }

        /* --- the habitat: your drawings, standing on the surface --- */
        var m2 = this.matrix;
        var list = [];
        for (var pi = 0; pi < props.length; pi++) {
          var pr = props[pi];
          if (!pr.img || !pr.img.complete || !pr.img.naturalWidth) continue;
          var dirW = HW.applyMatrix(m2, pr.dir);
          var base = {
            x: def.pos.x + dirW.x * def.radius * 0.99,
            y: def.pos.y + dirW.y * def.radius * 0.99,
            z: def.pos.z + dirW.z * def.radius * 0.99
          };
          var toCamP = V.norm(V.sub(camPos, base));
          var facing = V.dot(dirW, toCamP);
          /* A prop marked `pole` stands on the axis the planet turns around,
             so spinning never carries it away. We also refuse to cull or fade
             it: it is the landmark, and it has to be there to be clicked. */
          if (pr.pole) facing = Math.max(facing, 0.62);
          else if (facing < 0.14) continue;
          var sp = cam.project(base, {});
          if (!sp.ok) continue;
          var tip = cam.project({
            x: base.x + dirW.x * 0.5, y: base.y + dirW.y * 0.5, z: base.z + dirW.z * 0.5
          }, {});
          list.push({
            pr: pr, sp: sp, tip: tip, depth: sp.depth, facing: facing,
            light: HW.clamp01(V.dot(dirW, L) * 0.5 + 0.62)
          });
        }
        list.sort(function (p, q) { return q.depth - p.depth; });

        for (var li = 0; li < list.length; li++) {
          var it = list[li];
          var hpx = it.pr.size * cam.focal / it.depth;
          if (hpx < 6) continue;
          var wpx = hpx * (it.pr.img.naturalWidth / it.pr.img.naturalHeight);
          var ang = Math.atan2(it.tip.y - it.sp.y, it.tip.x - it.sp.x) + Math.PI / 2;
          var isDoor = !!it.pr.href;
          var lit = isDoor && this.hoverLink === it.pr;
          ctx.save();
          ctx.translate(it.sp.x, it.sp.y);
          ctx.rotate(ang);
          ctx.globalAlpha = HW.clamp01(HW.smoothstep(0.14, 0.34, it.facing)) *
                            (0.55 + 0.45 * it.light);
          ctx.beginPath();
          ctx.ellipse(0, 0, wpx * 0.3, hpx * 0.05, 0, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(11,15,28,0.3)';
          ctx.fill();
          if (it.pr.glow) {
            /* a lamp behind the landmark, breathing slightly */
            var gr = hpx * (0.95 + 0.04 * Math.sin(time * 1.1));
            var gg = ctx.createRadialGradient(0, -hpx * 0.5, hpx * 0.06, 0, -hpx * 0.5, gr);
            gg.addColorStop(0, 'rgba(255,230,168,0.5)');
            gg.addColorStop(0.55, 'rgba(255,214,132,0.14)');
            gg.addColorStop(1, 'rgba(255,214,132,0)');
            ctx.save();
            ctx.globalAlpha = 1;
            ctx.fillStyle = gg;
            ctx.beginPath();
            ctx.arc(0, -hpx * 0.5, gr, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
          if (lit) {
            ctx.save();
            ctx.globalAlpha = 1;
            ctx.strokeStyle = 'rgba(242,237,225,0.75)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([5, 6]);
            ctx.beginPath();
            ctx.ellipse(0, -hpx * 0.48, hpx * 0.66, hpx * 0.66, time * 0.5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }
          ctx.drawImage(it.pr.img, -wpx / 2, -hpx * (lit ? 1.02 : 0.97), wpx,
                        hpx * (lit ? 1.06 : 1));
          ctx.restore();

          if (isDoor && it.facing > 0.26 && hpx > 12) {
            this.hotspots.push({
              kind: 'link', item: it.pr, label: it.pr.label, href: it.pr.href,
              x: it.sp.x + Math.sin(ang) * hpx * 0.48,
              y: it.sp.y - Math.cos(ang) * hpx * 0.48,
              r: Math.max(16, hpx * 0.55)
            });
          }
        }
        /* --- the snacks --- */
        for (var qi = 0; qi < food.length; qi++) {
          var snack = food[qi];
          if (!snack.img || !snack.img.complete || !snack.img.naturalWidth) continue;

          var grow = 1;
          if (snack.eatenAt) {
            var since = time - snack.eatenAt;
            if (since < HW.SNACKS.regrow) continue;
            grow = HW.clamp01((since - HW.SNACKS.regrow) / 0.7);
            if (grow >= 1) snack.eatenAt = 0;
            grow = 0.25 + 0.75 * grow;              // pops back into place
          }

          var sdir = HW.applyMatrix(m2, snack.dir);
          var sbase = {
            x: def.pos.x + sdir.x * def.radius * 0.99,
            y: def.pos.y + sdir.y * def.radius * 0.99,
            z: def.pos.z + sdir.z * def.radius * 0.99
          };
          var sFacing = V.dot(sdir, V.norm(V.sub(camPos, sbase)));
          if (sFacing < 0.2) continue;
          var ssp = cam.project(sbase, {});
          if (!ssp.ok) continue;
          var stip = cam.project({
            x: sbase.x + sdir.x * 0.5, y: sbase.y + sdir.y * 0.5, z: sbase.z + sdir.z * 0.5
          }, {});

          var hovered = this.hoverFood === snack;
          var shpx = snack.size * grow * (hovered ? 1.16 : 1) * cam.focal / ssp.depth;
          if (shpx < 5) continue;
          var swpx = shpx * (snack.img.naturalWidth / snack.img.naturalHeight);
          var sang = Math.atan2(stip.y - ssp.y, stip.x - ssp.x) + Math.PI / 2;
          var bob = motion ? Math.sin(time * 1.9 + snack.phase) * 0.1 : 0;

          ctx.save();
          ctx.translate(ssp.x, ssp.y);
          ctx.rotate(sang);
          ctx.globalAlpha = HW.clamp01(HW.smoothstep(0.2, 0.4, sFacing));
          if (hovered) {
            ctx.strokeStyle = 'rgba(242,237,225,0.6)';
            ctx.lineWidth = 1.4;
            ctx.setLineDash([4, 5]);
            ctx.beginPath();
            ctx.ellipse(0, -shpx * 0.5, shpx * 0.72, shpx * 0.72, time * 0.6, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
          }
          ctx.drawImage(snack.img, -swpx / 2, -shpx * (0.97 + bob), swpx, shpx);
          ctx.restore();

          this.hotspots.push({
            kind: 'snack', item: snack, world: sbase,
            x: ssp.x + Math.sin(sang) * shpx * 0.5,
            y: ssp.y - Math.cos(sang) * shpx * 0.5,
            r: Math.max(16, shpx * 0.6)
          });
        }

        ctx.globalAlpha = 1;
      }
    };
  };
})(window.HW);

