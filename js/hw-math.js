/* hw-math.js — tiny geometry + noise helpers for the hand-drawn worlds engine.
   No dependencies. Everything hangs off the single global HW namespace so the
   whole thing can be dropped into a larger site without collisions. */
window.HW = window.HW || {};
(function (HW) {
  'use strict';

  /* ---------- scalars ---------- */
  HW.clamp = function (v, a, b) { return v < a ? a : (v > b ? b : v); };
  HW.clamp01 = function (v) { return HW.clamp(v, 0, 1); };
  HW.lerp = function (a, b, t) { return a + (b - a) * t; };
  HW.smoothstep = function (e0, e1, x) {
    var t = HW.clamp01((x - e0) / (e1 - e0));
    return t * t * (3 - 2 * t);
  };
  HW.easeInOut = function (t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  /* ---------- deterministic randomness ----------
     Same seed always draws the same "hand", so a planet's wobble is stable
     between reloads instead of re-rolling every visit. */
  HW.rng = function (seed) {
    var s = (seed >>> 0) || 1;
    return function () {
      s ^= s << 13; s >>>= 0;
      s ^= s >> 17;
      s ^= s << 5;  s >>>= 0;
      return s / 4294967296;
    };
  };

  /* ---------- vectors ---------- */
  var V = {
    make: function (x, y, z) { return { x: x, y: y, z: z }; },
    add: function (a, b) { return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }; },
    sub: function (a, b) { return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }; },
    mul: function (a, s) { return { x: a.x * s, y: a.y * s, z: a.z * s }; },
    dot: function (a, b) { return a.x * b.x + a.y * b.y + a.z * b.z; },
    cross: function (a, b) {
      return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x };
    },
    len: function (a) { return Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z); },
    norm: function (a) {
      var l = V.len(a) || 1;
      return { x: a.x / l, y: a.y / l, z: a.z / l };
    },
    lerp: function (a, b, t) {
      return { x: HW.lerp(a.x, b.x, t), y: HW.lerp(a.y, b.y, t), z: HW.lerp(a.z, b.z, t) };
    }
  };
  HW.V = V;

  /* ---------- colour ----------
     Planets are described in HSL so a single facet can be shaded by pushing
     lightness around without picking a second hex by hand. */
  HW.shade = function (col, light) {
    var l = HW.clamp(col.l * (0.34 + 0.86 * light), 5, 94);
    var s = HW.clamp(col.s * (0.62 + 0.42 * light), 4, 100);
    var h = col.h + (light - 0.5) * (col.drift || 6);
    return 'hsl(' + h.toFixed(1) + ',' + s.toFixed(1) + '%,' + l.toFixed(1) + '%)';
  };

  /* ---------- icosphere ----------
     Subdivided icosahedron. Low detail levels are what give the planets their
     faceted, folded-paper silhouette. Returns shared vertices (so neighbouring
     facets agree on where a corner is) plus an edge table used to find the
     contour we ink each frame. */
  HW.icosphere = function (detail) {
    var t = (1 + Math.sqrt(5)) / 2;
    var verts = [
      [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
      [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
      [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]
    ].map(function (v) { return V.norm(V.make(v[0], v[1], v[2])); });

    var faces = [
      [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
      [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
      [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
      [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
    ];

    for (var d = 0; d < detail; d++) {
      var cache = {}, next = [];
      var mid = function (a, b) {
        var key = a < b ? a + '_' + b : b + '_' + a;
        if (cache[key] !== undefined) return cache[key];
        var m = V.norm(V.mul(V.add(verts[a], verts[b]), 0.5));
        verts.push(m);
        cache[key] = verts.length - 1;
        return cache[key];
      };
      for (var i = 0; i < faces.length; i++) {
        var f = faces[i];
        var a = mid(f[0], f[1]), b = mid(f[1], f[2]), c = mid(f[2], f[0]);
        next.push([f[0], a, c], [f[1], b, a], [f[2], c, b], [a, b, c]);
      }
      faces = next;
    }

    // edge table: every edge knows the (one or two) facets it belongs to
    var edgeMap = {}, edges = [];
    for (var fi = 0; fi < faces.length; fi++) {
      var face = faces[fi];
      for (var e = 0; e < 3; e++) {
        var p = face[e], q = face[(e + 1) % 3];
        var k = p < q ? p + '_' + q : q + '_' + p;
        if (edgeMap[k] === undefined) {
          edgeMap[k] = edges.length;
          edges.push({ a: Math.min(p, q), b: Math.max(p, q), f: [fi, -1] });
        } else {
          edges[edgeMap[k]].f[1] = fi;
        }
      }
    }

    return { verts: verts, faces: faces, edges: edges };
  };

  /* ---------- rotation ----------
     A planet spins around its own tilted axis; we build the 3x3 once per frame
     rather than per vertex. */
  HW.spinMatrix = function (tiltX, tiltZ, angle) {
    var ca = Math.cos(angle), sa = Math.sin(angle);
    var cx = Math.cos(tiltX), sx = Math.sin(tiltX);
    var cz = Math.cos(tiltZ), sz = Math.sin(tiltZ);
    // R = Rz(tiltZ) * Rx(tiltX) * Ry(angle)
    var m = [
      [ca, 0, sa],
      [0, 1, 0],
      [-sa, 0, ca]
    ];
    var rx = [
      [1, 0, 0],
      [0, cx, -sx],
      [0, sx, cx]
    ];
    var rz = [
      [cz, -sz, 0],
      [sz, cz, 0],
      [0, 0, 1]
    ];
    var mul = function (A, B) {
      var out = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
      for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) {
        out[i][j] = A[i][0] * B[0][j] + A[i][1] * B[1][j] + A[i][2] * B[2][j];
      }
      return out;
    };
    return mul(rz, mul(rx, m));
  };

  HW.applyMatrix = function (m, v) {
    return {
      x: m[0][0] * v.x + m[0][1] * v.y + m[0][2] * v.z,
      y: m[1][0] * v.x + m[1][1] * v.y + m[1][2] * v.z,
      z: m[2][0] * v.x + m[2][1] * v.y + m[2][2] * v.z
    };
  };

  /* lat/lon in degrees -> unit direction, for pinning props to a surface */
  HW.latLon = function (lat, lon) {
    var a = lat * Math.PI / 180, b = lon * Math.PI / 180;
    return {
      x: Math.cos(a) * Math.sin(b),
      y: Math.sin(a),
      z: Math.cos(a) * Math.cos(b)
    };
  };
})(window.HW);

