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

    /* ---------- where a direction actually meets the GROUND ----------

       Everything that stands on a planet used to be planted on the maths
       sphere, at radius * 0.99. That is not where the ground is.

       This planet is folded paper. Its CORNERS sit on that sphere; its flat
       facets sag inside it, by up to three per cent of the radius, and the
       crumple that makes it read as paper rather than a ball makes some of
       them sag further. In the middle of the disc nobody noticed, because
       you are looking straight down at the surface. At the EDGE, where you
       see the silhouette side-on, a tree stood visibly off the ground.

       So instead of assuming, we ask the mesh. Shoot a ray out from the
       centre along the direction the object stands in, find the facet it
       passes through, and take the distance to that facet. Done once, when
       the planet is built, because neither the mesh nor the object's
       direction ever changes afterwards - it costs nothing per frame. */
    function standR(dir) {
      var fs = geo.faces;
      for (var f = 0; f < fs.length; f++) {
        var fa = fs[f];
        var a = local[fa[0]], e1 = V.sub(local[fa[1]], a), e2 = V.sub(local[fa[2]], a);
        var pv = V.cross(dir, e2);
        var det = V.dot(e1, pv);
        if (det > -1e-9 && det < 1e-9) continue;   // ray parallel to the facet
        var inv = 1 / det;
        var tv = V.mul(a, -1);                     // the ray starts at the centre
        var u = V.dot(tv, pv) * inv;
        if (u < -1e-6 || u > 1.000001) continue;
        var qv = V.cross(tv, e1);
        var v = V.dot(dir, qv) * inv;
        if (v < -1e-6 || u + v > 1.000001) continue;
        var t = V.dot(e2, qv) * inv;
        if (t > 0) return t;
      }
      return def.radius * 0.97;                    // a closed mesh never gets here
    }

    /* =====================================================================
       A DIAGRAMMATIC LABEL
       =====================================================================
       The kind of label a drawing in a sketchbook has: always there, sitting
       off to one side of the thing it names, with a line drawn back to it.
       "she naps all day" beside the leopard. Not a hover name - that comes
       and goes with the cursor and answers "what is this?"; this one is part
       of the picture and says something ABOUT it.

       YOU CHOOSE THE DIRECTION; THE PAGE WORKS OUT THE DISTANCE.

       The direction is one of eight compass points, and it means the
       direction FROM THE OBJECT - so "south-west" is down and to the left of
       the leopard, wherever on the planet the leopard currently is.

       The distance cannot be yours to choose, and that is the heart of this.
       A fixed distance would put the words on open sky for an object near
       the edge of a planet and bury them in the planet's own face for one in
       the middle - and writing laid over a lit, turning, hand-drawn surface
       is writing nobody can read. So the label is pushed along your
       direction until it is CLEAR OF THE PLANET'S EDGE, and then a little
       further for air. Near the rim that is a short step; dead centre it is
       most of the planet's width. Same instruction, different answer,
       because the question is different.

       THE ARITHMETIC, since it is only one line of it. The planet on screen
       is a circle: a centre and a radius. Walking from the object's position
       P along a direction D, the question "when am I R away from the centre
       C?" is a quadratic in how far you have walked, and the larger of its
       two answers is where you leave the circle. (If the object is somehow
       already outside, there is nothing to leave, and the step is just the
       air.) Everything after that is spacing.
       ===================================================================== */

    /* The eight points, as screen directions. The screen's y grows DOWNWARDS,
       which is why north is -1 and south is +1 - the one place this file has
       to remember that a drawing's up is a screen's down. The diagonals use
       0.7071, which is one over the square root of two: it keeps a diagonal
       step the same length as a straight one, so "north-east" is not quietly
       forty per cent further away than "north". */
    var COMPASS = {
      'north':      { x:  0,      y: -1 },
      'north-east': { x:  0.7071, y: -0.7071 },
      'east':       { x:  1,      y:  0 },
      'south-east': { x:  0.7071, y:  0.7071 },
      'south':      { x:  0,      y:  1 },
      'south-west': { x: -0.7071, y:  0.7071 },
      'west':       { x: -1,      y:  0 },
      'north-west': { x: -0.7071, y: -0.7071 }
    };

    /* ---- the state each label keeps between frames ----

       A LABEL THAT RECOMPUTES ITSELF FROM SCRATCH EVERY FRAME JUMPS, and
       that is what was wrong with the first version. The planet turns, the
       object creeps a pixel, and some test that was just barely true
       becomes just barely false - so the words hop to the other side of the
       planet and back again, twice a second. The jump was never in the
       drawing; it was in the deciding.

       Two things fix it, and they are different fixes for different halves
       of the problem:

         WHICH SIDE a label is on is a DECISION, and decisions are kept.
         Once a label is on the right of the planet it stays on the right
         until the reason to move is comfortably true, not barely true.

         WHERE it sits is a POSITION, and positions are eased. The target
         may move a few pixels a frame; the drawn label walks towards it
         instead of teleporting.

       Keyed by the label's own text, which is stable across frames in a way
       that an index into a list of visible props is not. */
    var noteState = {};

    function stateFor(key) {
      if (!noteState[key]) noteState[key] = { side: 0, x: 0, y: 0, ready: false };
      return noteState[key];
    }

    /* =====================================================================
       A DIAGRAMMATIC LABEL
       =====================================================================
       Always there, for as long as its object is in view, with a line back
       to it - the way a label on a sketchbook drawing is.

       THE RULE IT KEEPS, and it is a stronger rule than it used to be:

           THE WORDS NEVER SIT WITHIN THE WIDTH OF THE PLANET.

       Picture two vertical lines, one touching each end of the equator. The
       planet lives between them; a label never does. Not merely outside the
       circle - outside that whole vertical band, so a label can never find
       itself over the top or the bottom of a world where the ground is
       lit, textured and turning. Writing over that is writing nobody reads.

       WHAT THAT DOES TO THE EIGHT DIRECTIONS. East and west, and the four
       diagonals, mean exactly what they say. North and south become "up and
       out" and "down and out" - the label goes above or below the object
       and then slides to whichever side it is already nearest. The
       direction is a lean rather than a compass bearing, and that is the
       price of the words always being readable.
       ===================================================================== */

    var COMPASS = {
      'north':      { x:  0,      y: -1 },
      'north-east': { x:  0.7071, y: -0.7071 },
      'east':       { x:  1,      y:  0 },
      'south-east': { x:  0.7071, y:  0.7071 },
      'south':      { x:  0,      y:  1 },
      'south-west': { x: -0.7071, y:  0.7071 },
      'west':       { x: -1,      y:  0 },
      'north-west': { x: -0.7071, y: -0.7071 }
    };

    /* BREAK A LINE THAT WILL NOT FIT, rather than letting it run off the
       side. Words only - a label is a handwritten note, and a note broken
       mid-word reads as damage. If a single word is itself wider than the
       room, it is left long: better one line poking out than a word cut in
       half. */
    function wrapWords(ctx, text, room) {
      var words = String(text).split(/\s+/);
      var lines = [], line = '';
      for (var i = 0; i < words.length; i++) {
        var next = line ? line + ' ' + words[i] : words[i];
        if (line && ctx.measureText(next).width > room) { lines.push(line); line = words[i]; }
        else line = next;
      }
      if (line) lines.push(line);
      return lines;
    }

    function drawNote(ctx, item, circle, vw, vh) {
      var n = item.note;
      if (!n || !n.text) return;
      /* below about a tenth it is a smudge, and a line drawn to a smudge is
         a scratch on the sky */
      if (item.alpha <= 0.1) return;

      var dir = COMPASS[n.place] || COMPASS.north;
      var st = stateFor(n.text);

      ctx.save();
      ctx.font = (HW.PALETTE && HW.PALETTE.noteFace) || '23px Caveat, cursive';
      ctx.textBaseline = 'middle';

      /* ---- 1. which side of the planet ----

         The direction decides when it has an opinion. North and south do
         not, so they take the side the object is already nearest - and that
         choice is KEPT until the object is well past the middle, not merely
         past it. Without that margin an object drifting across the centre
         line flips the label from side to side every few frames, which is
         exactly the jumping that needed fixing. */
      /* ---- 1. beside the planet, or above it ----

         A SIDE IS A DECISION, AND DECISIONS ARE KEPT. A label that can
         change sides will, every time its object drifts across the middle -
         and a hysteresis margin only makes that rarer, never impossible.

         IT MATTERS MORE THAN IT LOOKS, because a label that changes sides
         has to GET there, and the only road between the two sides runs
         straight across the planet. Easing it over means the words spend
         half a second in exactly the place this rule exists to keep them
         out of. So a change of side SNAPS rather than walks.

         AND THERE IS A SCREEN ON WHICH THE RULE CANNOT BE KEPT AT ALL. On a
         phone the planet is nearly as wide as the window - 330 pixels of
         world in a 390 pixel screen - and the strip either side of it is
         thirty pixels. No label fits in thirty pixels; wrapping it there
         produces a column of single words. Insisting on the rule in that
         case does not keep the words off the planet, it just makes them
         unreadable in a different way, and the side flips back and forth
         chasing whichever strip is a pixel wider.

         So when neither side can hold a label, the label goes ABOVE or
         BELOW the planet instead - still clear of the ball, still never
         over the drawing, simply not outside its width, because on that
         screen nothing can be. The rule is kept wherever it can be kept and
         dropped loudly rather than quietly where it cannot. */
      var gap = Math.max(16, circle.r * 0.12);
      var pad = 12;
      /* the page's own header stands over the top of the drawing - see the
         note on safeTop in js/hw-scroll.js */
      var top = Math.max(pad, (HW.SETTINGS && HW.SETTINGS.safeTop) || pad);

      function roomOn(sd) {
        var e = circle.x + sd * (circle.r + gap);
        return sd === 1 ? (vw - pad) - e : e - pad;
      }

      /* enough for a few words to a line; below this a label is a column of
         single words rather than a sentence */
      var least = Math.max(96, vw * 0.22);
      var beside = Math.max(roomOn(1), roomOn(-1)) >= least;

      /* THE MODE IS STICKY TOO. Travelling moves a planet across the screen,
         so the room either side changes as you go; without this the label
         would hop between beside-the-planet and above-it while you moved. */
      if (st.mode === undefined) st.mode = beside ? 'beside' : 'above';
      else if (st.mode === 'beside' && Math.max(roomOn(1), roomOn(-1)) < least * 0.8) st.mode = 'above';
      else if (st.mode === 'above' && Math.max(roomOn(1), roomOn(-1)) > least * 1.25) st.mode = 'beside';

      var side = 0, edge = 0, room, tx, ty, lines, widest = 0, lh, blockH;

      if (st.mode === 'beside') {
        var want;
        if (dir.x > 0.3) want = 1;
        else if (dir.x < -0.3) want = -1;
        else if (st.side) want = st.side;
        else want = (item.x - circle.x) >= 0 ? 1 : -1;

        /* the other side has to be CLEARLY better before the label moves,
           or the two take turns being a pixel wider */
        side = want;
        if (roomOn(want) < least && roomOn(-want) > roomOn(want) * 1.25) side = -want;

        if (st.side && st.side !== side) st.ready = false;   // snap, never walk across
        st.side = side;

        edge = circle.x + side * (circle.r + gap);
        room = Math.max(60, roomOn(side));
      } else {
        /* ABOVE OR BELOW: the words take the width of the window and sit
           clear of the top or the bottom of the ball. Which one is the
           direction's own answer - anything with a northward lean goes
           above - and it is kept, for the same reason a side is kept. */
        room = vw - pad * 2;
        if (!st.vert) st.vert = dir.y > 0.2 ? 1 : -1;
      }

      lines = wrapWords(ctx, n.text, room);
      for (var li = 0; li < lines.length; li++) {
        widest = Math.max(widest, ctx.measureText(lines[li]).width);
      }
      lh = 1.25 * (parseFloat(ctx.font) || 23);
      blockH = lines.length * lh;

      /* ---- 3. where it sits ---- */
      if (st.mode === 'beside') {
        tx = side === 1 ? edge : edge - widest;
        /* KEPT INSIDE THE WINDOW, BUT NEVER PULLED INTO THE BAND. These two
           used to fight and the window won, which is how words ended up
           back on the planet after all the work to get them off it. The
           side was chosen so there IS room, so this only trims a pixel. */
        var low  = side === 1 ? edge : pad;
        var high = side === 1 ? (vw - widest - pad) : (edge - widest);
        if (high >= low) tx = HW.clamp(tx, low, high);

        var reach = (item.r + Math.max(26, circle.r * 0.22)) * (n.lean || 1);
        ty = item.y + dir.y * reach;
      } else {
        /* CENTRED OVER THE PLANET, CLEAR OF THE BALL, top or bottom.

           WHICHEVER END HAS THE ROOM. Above is the usual answer, but a
           planet can sit high on a phone with the sky above it already
           gone - and clamping a label back onto the screen from up there
           lands it squarely on the world. So both ends are measured first
           and the one that actually fits wins; the choice is then kept, for
           the same reason a side is kept. */
        tx = HW.clamp(circle.x - widest / 2, pad, Math.max(pad, vw - widest - pad));
        /* CLEAR OF WHATEVER IS ACTUALLY IN THE WAY, which is the ball, and
           the object too if the object happens to be on the side we are
           going to.

           A thing pinned to a planet's pole stands up out of the top of it -
           the pantheon is nearly as tall as its world - so a label placed
           ABOVE has to clear the building, not the sphere underneath it. But
           the same building is no obstacle at all to a label placed BELOW,
           and counting it there pushed the words a whole pantheon's height
           past the bottom of the planet and straight into the page's own
           writing. What is above you is not in your way when you are going
           down. */
        function clearance(v) {
          var far = circle.r;
          var sameWay = (item.y - circle.y) * v > 0;
          if (sameWay) {
            far = Math.max(far, Math.abs(item.y - circle.y) + item.r);
          }
          return far + gap + blockH / 2 + 8;
        }
        var need = clearance(st.vert);
        var fitsUp = (circle.y - clearance(-1)) - blockH / 2 >= top;
        var fitsDown = (circle.y + clearance(1)) + blockH / 2 <= vh - pad;
        if (st.vert === -1 && !fitsUp && fitsDown) st.vert = 1;
        else if (st.vert === 1 && !fitsDown && fitsUp) st.vert = -1;
        need = clearance(st.vert);
        ty = circle.y + st.vert * need;
      }
      ty = HW.clamp(ty, top + blockH / 2, Math.max(top + blockH / 2, vh - pad - blockH / 2));

      /* ---- 4. ease, so it never teleports - but ease RELATIVE TO THE
         PLANET, not to the screen ----

         This distinction is the whole of why the last of the drifting went
         away. Easing a label's screen position means that when the PLANET
         moves - and it moves a long way, quickly, every time you travel -
         the label is always chasing it from behind. The lag is exactly the
         kind of lateness that leaves words lying across a world for a few
         frames while they catch up.

         So what is eased is the label's offset FROM the planet's centre.
         The planet can cross the whole screen in a second and the label
         rides with it, rigidly, as though pinned there; only a real change
         in where the label should sit relative to its world is smoothed.
         Nothing lags, because nothing is chasing.

         The first frame of a label is placed outright: easing in from
         wherever the last label of that name happened to be would be a
         visible slide across the screen. */
      var R = Math.max(1, circle.r);
      var ox = (tx - circle.x) / R, oy = (ty - circle.y) / R;
      if (!st.ready) { st.x = ox; st.y = oy; st.ready = true; }
      else { st.x += (ox - st.x) * 0.18; st.y += (oy - st.y) * 0.18; }
      tx = circle.x + st.x * R;
      ty = circle.y + st.y * R;

      /* IN UNITS OF THE PLANET'S OWN RADIUS, not in pixels, and that is the
         second half of the same idea. A world does not only move as you
         travel towards it - it GROWS, from a dot to a thing filling a third
         of the screen. An offset measured in pixels that sat comfortably
         outside the edge a moment ago is inside it once the ball has
         doubled. Measured in radii, the label swells outward with the world
         it belongs to and keeps its distance the whole way in.

         AND THEN THE RULE IS ENFORCED ON WHAT IS ACTUALLY DRAWN, below,
         rather than only on what was aimed at. Everything above is about
         making the right answer smooth; this is about the right answer
         being true even in the frames where smoothing has not caught up.
         It is the difference between a rule and a hope. */
      if (st.mode === 'beside') {
        var mustX = circle.x + side * (circle.r + gap);
        if (side === 1) tx = Math.max(tx, mustX);
        else tx = Math.min(tx, mustX - widest);
      } else {
        var mustY = circle.y + st.vert * (need - 8);
        if (st.vert === 1) ty = Math.max(ty, mustY);
        else ty = Math.min(ty, mustY);
      }

      /* AND INSIDE THE WINDOW, which is the one rule that outranks the
         others - words off the edge of the screen are not words. It bites
         only in the frames where a planet is arriving and briefly too big
         for the room it is in; the mode above was already chosen so that
         there IS somewhere for the label to go. */
      tx = HW.clamp(tx, pad, Math.max(pad, vw - widest - pad));
      ty = HW.clamp(ty, top + blockH / 2, Math.max(top + blockH / 2, vh - pad - blockH / 2));

      var firstY = ty - blockH / 2 + lh / 2;

      if (HW.DEBUG) {
        (HW.DEBUG_NOTES = HW.DEBUG_NOTES || []).push({
          text: n.text, place: n.place, lines: lines.length,
          x: tx, y: ty, w: widest, h: blockH,
          ox: item.x, oy: item.y,
          cx: circle.x, cy: circle.y, r: circle.r, vw: vw, vh: vh
        });
      }

      ctx.globalAlpha = item.alpha;

      /* ---- the leader line ----
         From the edge of the object to the near end of the words. Drawn
         first, so the writing sits over it. */
      var lx = side === 1 ? tx : tx + widest;
      var toObj = { x: item.x - lx, y: item.y - ty };
      var len = Math.hypot(toObj.x, toObj.y) || 1;
      var fromX = item.x - (toObj.x / len) * item.r * 0.55;
      var fromY = item.y - (toObj.y / len) * item.r * 0.55;
      var hookX = lx - side * 8;

      ctx.strokeStyle = 'rgba(242,237,225,0.5)';
      ctx.lineWidth = 1.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.quadraticCurveTo((fromX + hookX) / 2, (fromY + ty) / 2, hookX, ty);
      ctx.stroke();

      /* a small ring where it meets the object, so the line reads as
         pointing at something rather than leaking out of it */
      ctx.beginPath();
      ctx.arc(fromX, fromY, 2.2, 0, Math.PI * 2);
      ctx.stroke();

      /* ---- the words ----
         Dark outline first: a label may cross open sky, the dashed ring and
         a drifting star in the same second, and an outline is what lets one
         colour read over all three. */
      ctx.lineJoin = 'round';
      for (var k = 0; k < lines.length; k++) {
        var y = firstY + k * lh;
        ctx.strokeStyle = 'rgba(9,13,24,0.82)';
        ctx.lineWidth = 4;
        ctx.strokeText(lines[k], tx, y);
        ctx.fillStyle = 'rgba(242,237,225,0.96)';
        ctx.fillText(lines[k], tx, y);
      }
      ctx.restore();
    }

    var props = (def.props || []).map(function (p) {
      var d = HW.latLon(p.lat, p.lon);
      return {
        dir: d, stand: standR(d), size: p.size, src: p.src, img: null,
        /* THE THREE THINGS A PROP CAN OPEN, and they have to be copied
           across by name: this is a NEW object, not the one from
           hw-config.js, so anything not listed here is quietly dropped. The
           modal was added and not listed, and the pantheon became a
           building you could not press - no error, no warning, just
           nothing happening. */
        href: p.href || null, drawer: p.drawer || null, modal: p.modal || null,
        /* a fourth thing a door can be: an address to put on the clipboard */
        copy: p.copy || null,
        ring: p.ring || null, // 'always' keeps the door ring on, unhovered
        /* A FILE RATHER THAN A PLACE. The resume is the one door that hands
           you something instead of taking you somewhere. */
        download: !!p.download,
        /* THE ID IS WHAT THE WORDS ARE LOOKED UP BY. Everything this object
           SAYS - the name on hover, any diagrammatic label - lives in
           common/landing-copy.js under this id. A prop with no id simply
           says nothing, which is the right failure: it means a label can
           never silently attach itself to the wrong tree after a planet is
           reordered. */
        id: p.id || null,
        label: HW.knows(p.id) ? HW.says(p.id, 'hover') : (p.label || ''),
        /* The always-on label: { text, place, lean } or null. */
        note: HW.noteFor(p.id),
        pole: !!p.pole,       // stands on the spin axis, so it never turns away
        /* STAY VERTICAL ON SCREEN. Every prop is normally drawn standing up
           from the ground beneath it, and the ground turns - so a prop
           carried from one side of a planet to the other appears to rotate
           about the point it is pinned at. Right for a tree, wrong for an
           animal. See the note beside the leopard in hw-config.js. */
        upright: !!p.upright,
        glow: !!p.glow        // carries a lamp
      };
    });

    /* SNACKS: like props, but clickable, and they grow back after they are
       eaten. THEY CARRY AN ID AND A LABEL NOW, exactly as a prop does - a
       snack is a thing standing on a planet like any other, and there was
       no good reason it could not be written about. */
    var food = (def.food || []).map(function (p, i) {
      var d = HW.latLon(p.lat, p.lon);
      return {
        dir: d, stand: standR(d), size: p.size, src: p.src, img: null,
        id: p.id || null,
        note: HW.noteFor(p.id),
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
      /* How much of this world is showing, 0 to 1. The scene sets it every
         frame from how far the camera is from this world; the planet uses it
         to decide whether anything on it can be clicked. A world you cannot
         see is a world you cannot press. */
      presence: 1,
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
        if (this.presence < 0.5) return;   // too faint to be aimed at
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

        /* --- the glow ---
           A soft halo in the planet's OWN accent colour, sitting just outside
           its silhouette. It does two things: it lifts the planet off the
           background so a dark planet on a dark sky still has an edge, and it
           says what colour this world is before you can make out any detail -
           which matters now that only one planet is in view at a time.

           Drawn as a ring rather than a disc: it starts at 0.88 of the radius,
           so it is already under the planet's own edge when it begins, and
           there is never a seam between the two. */
        var gc = def.color;
        var halo = function (a) {
          return 'hsla(' + gc.h + ',' + Math.min(100, gc.s + 12) + '%,' +
                 Math.min(76, gc.l + 16) + '%,' + a + ')';
        };
        ctx.save();
        var gr = ctx.createRadialGradient(
          this.screen.x, this.screen.y, radiusPx * 0.88,
          this.screen.x, this.screen.y, radiusPx * 1.6);
        gr.addColorStop(0, halo(0.46));
        gr.addColorStop(0.22, halo(0.2));
        gr.addColorStop(0.58, halo(0.06));
        gr.addColorStop(1, halo(0));
        ctx.fillStyle = gr;
        ctx.beginPath();
        ctx.arc(this.screen.x, this.screen.y, radiusPx * 1.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

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
        var notes = [];
        for (var pi = 0; pi < props.length; pi++) {
          var pr = props[pi];
          if (!pr.img || !pr.img.complete || !pr.img.naturalWidth) continue;
          var dirW = HW.applyMatrix(m2, pr.dir);
          var base = {
            x: def.pos.x + dirW.x * pr.stand,
            y: def.pos.y + dirW.y * pr.stand,
            z: def.pos.z + dirW.z * pr.stand
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
          /* WHICH WAY IS UP FOR THIS PROP. Normally it is "away from the
             centre of the planet", worked out from a point half a unit
             above the prop's feet - which is what makes a tree on the left
             edge lean left. `upright` says "straight up the screen"
             instead, and 0 is exactly that. */
          var ang = it.pr.upright
            ? 0
            : Math.atan2(it.tip.y - it.sp.y, it.tip.x - it.sp.x) + Math.PI / 2;
          /* A door is anything that DOES something when you press it: it
             goes somewhere, or it opens a panel in place. Both get the
             hover ring and the hotspot; only the destination differs. */
          /* THREE THINGS A PROP CAN BE A DOOR TO, and any one of them
             earns it the hover ring and the hotspot: a page (href), a
             sliding panel (drawer) or the case study modal (modal). */
          var isDoor = !!(it.pr.href || it.pr.drawer || it.pr.modal || it.pr.copy);
          var lit = isDoor && this.hoverLink === it.pr;
          /* A DOOR THAT ADVERTISES ITSELF WITHOUT BEING POINTED AT.
             `ring: 'always'` in hw-config.js. It is for a door that is the
             only way in to something - the pantheon is the whole of the
             Work world's interaction, and a ring that only appears once the
             cursor has already found it is telling you something you have
             just worked out for yourself. */
          var always = isDoor && it.pr.ring === 'always';
          ctx.save();
          ctx.translate(it.sp.x, it.sp.y);
          ctx.rotate(ang);
          var faceAlpha = HW.clamp01(HW.smoothstep(0.14, 0.34, it.facing)) *
                          (0.55 + 0.45 * it.light);
          ctx.globalAlpha = faceAlpha;
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
          if (lit || always) {
            /* QUIETER WHEN IT IS NOT BEING POINTED AT, and it follows the
               prop's own fade rather than forcing itself to full strength -
               so while you are travelling past, the ring comes and goes with
               the building it belongs to instead of hanging in empty space
               after the planet has gone. Pointing at it still brightens it,
               which is what keeps the hover worth having. */
            ctx.save();
            ctx.globalAlpha = lit ? 1 : faceAlpha * 0.8;
            ctx.strokeStyle = lit ? 'rgba(242,237,225,0.75)' : 'rgba(242,237,225,0.52)';
            ctx.lineWidth = lit ? 1.5 : 1.2;
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
            /* THE RING IS THE TARGET.

               The click area used to be 0.55 of the drawing's height while
               the ring round it is 0.66, so there was a band of about a
               tenth all the way round that LOOKED live and was not. A press
               that lands there does nothing at all, which reads as the page
               ignoring you rather than as having missed - and on the
               pantheon, which is tall and narrow, most of the obvious places
               to aim fall in exactly that band.

               It now matches the ring, with a little over for the hand. What
               you can see you can press, which is the only rule anybody
               should have to learn. */
            this.hotspots.push({
              kind: 'link', item: it.pr, label: it.pr.label,
              href: it.pr.href, drawer: it.pr.drawer, modal: it.pr.modal,
              download: it.pr.download, copy: it.pr.copy,
              /* the same centre the ring is drawn from, so the two agree */
              x: it.sp.x + Math.sin(ang) * hpx * 0.48,
              y: it.sp.y - Math.cos(ang) * hpx * 0.48,
              r: Math.max(22, hpx * 0.72)
            });
          }

          /* GATHERED NOW, DRAWN LATER. A label has to sit on top of every
             prop on the planet, not just the ones drawn after it - so it
             cannot be painted here, inside the loop that is still drawing
             them. It is put on a list and the list is drawn once the planet
             is finished with. */
          if (it.pr.note) {
            notes.push({
              note: it.pr.note,
              /* the middle of the drawing rather than its feet, so the line
                 points at the thing and not at the ground under it */
              x: it.sp.x + Math.sin(ang) * hpx * 0.48,
              y: it.sp.y - Math.cos(ang) * hpx * 0.48,
              r: hpx * 0.5,
              /* IT FADES WITH ITS OWN OBJECT. As the prop turns away its
                 drawing fades, and the label goes with it - so a label is
                 never left pointing at something that is no longer
                 there. */
              alpha: faceAlpha
            });
          }
        }

        /* --- the labels, now that every prop has been drawn ---

           HOW BIG THE SCREEN IS, ASKED OF THE CANVAS ITSELF rather than of
           the window. The scene draws at the device's own pixel density and
           tells the canvas so once, with a transform; dividing the canvas's
           real width by the scale in that transform gives the size in the
           pixels everything else here is measured in. Asking
           `devicePixelRatio` directly would be wrong on a phone that
           reports 3, because the scene deliberately caps the density at 2
           to keep the drawing quick. */
        var sc = (ctx.getTransform && ctx.getTransform().a) || 1;
        var vw = ctx.canvas.width / (sc || 1);
        var vh = ctx.canvas.height / (sc || 1);
        for (var ni = 0; ni < notes.length; ni++) {
          drawNote(ctx, notes[ni], this.screen, vw, vh);
        }

        /* --- the snacks --- */
        var snacks = [];
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
            x: def.pos.x + sdir.x * snack.stand,
            y: def.pos.y + sdir.y * snack.stand,
            z: def.pos.z + sdir.z * snack.stand
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

          /* A SNACK CAN CARRY A LABEL TOO. Gathered here and drawn in the
             same pass as the props' labels below, so a note on a cola sits
             over the planet rather than under the next thing drawn. */
          if (snack.note) {
            snacks.push({
              note: snack.note,
              x: ssp.x + Math.sin(sang) * shpx * 0.5,
              y: ssp.y - Math.cos(sang) * shpx * 0.5,
              r: shpx * 0.5,
              alpha: HW.clamp01(HW.smoothstep(0.2, 0.4, sFacing))
            });
          }
        }

        /* the snacks' labels, after every snack has been drawn */
        for (var sni = 0; sni < snacks.length; sni++) {
          drawNote(ctx, snacks[sni], this.screen, vw, vh);
        }

        ctx.globalAlpha = 1;
      }
    };
  };
})(window.HW);

