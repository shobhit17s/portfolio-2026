/* cs-flowchart.js — the diagram on a flow-chart slide.

   =========================================================================
   WHAT IT DOES
   =========================================================================

   cs-templates.js builds the steps, their labels and the room below them.
   This file does the four things that cannot be decided until the slide is
   actually on the page and has a width:

       1  which step is lit, and what the picture below it shows
       2  the lines that join the steps, and which way each one points
       3  stepping through a step's pictures when it has several
       4  all of that again whenever the slide changes size

   =========================================================================
   WHY THE LINES ARE DRAWN RATHER THAN BUILT
   =========================================================================

   The first sheet was explicit: "This line wouldn't have a predetermined
   length. Let the length be whatever is required to connect all the points
   together."

   That rules out borders. A border runs the length of the box it is on,
   and the box it would need to be on is "from this step, round that one,
   and back up to the start" - a box nobody can name in advance.

   So the steps are laid out first, by the grid, and the lines are drawn
   afterwards from where they actually landed: measure every step's dot,
   then draw one SVG path per join. Nothing is written down twice, so
   nothing can disagree. Add a step, move a row, make the window narrower -
   the lines are simply drawn again from the new positions.

   =========================================================================
   WHAT CHANGED ON 5 NOVEMBER, AND WHY IT MADE THIS FILE SMALLER
   =========================================================================

   This file used to work out the joins for itself. It grouped the dots by
   which row they were on, ran a straight line through each group, and then
   guessed where a fork must have been so it could draw an elbow into it.
   That worked for a LINE of steps because a line has only one answer.

   The new sheet is a diagram: it loops back to the start, it runs two ways
   out of one step, and nothing about the reading order says so. So the
   joins are written down now - see CS.flowPlan in cs-content.js - and this
   file draws the joins it is given. The grouping and the guessing are
   gone.

   =========================================================================
   HOW A JOIN IS ROUTED
   =========================================================================

   Every line is made of right angles, because that is what the sheet
   draws and because a diagonal across a diagram of boxes reads as a
   mistake.

   The one decision is WHICH WAY THE LINE LEAVES, and `out` on the join
   says so - 'up', 'down', 'left' or 'right'. From there the route follows:

       LEAVING UP OR DOWN
         out of the step into the LANE between its row and the row it is
         going to, along the lane, then into the target from above or
         below. Three segments, and the middle one runs BETWEEN the rows
         rather than along one - which is the whole point, because along a
         row is where the other steps are.

       LEAVING LEFT OR RIGHT, toward the target
         along to the target's column, then up or down into it. Two
         segments. This is the loop back to the start: left along the row,
         then up into the first step.

       LEAVING LEFT OR RIGHT, away from the target
         out to the MARGIN past everything, along it, and back in. Three
         segments. This is how the sheet reaches a box that sits behind
         the step pointing at it.

   WHEN `out` IS NOT WRITTEN it is worked out: straight when the two share
   a row or a column, and otherwise away from the row it is on toward the
   row it is going to. Write it when the automatic answer crosses
   something it should go round - there is no obstacle-avoidance here, on
   purpose. A router clever enough to find its own way round is a router
   that quietly re-routes when somebody adds a step, and a diagram that
   rearranges itself is worse than one you have to nudge.

   =========================================================================
   A SLIDE IS WIRED ONCE AND MEASURED EVERY TIME
   =========================================================================

   Wiring means adding the click handlers; measuring means drawing the
   lines. A slide inside a phase tab is built once but shown and hidden
   repeatedly, and a slide that is hidden has no width - every dot measures
   zero. So the two are deliberately separate, the same arrangement
   cs-tabseries.js uses, and the drawing is skipped entirely while the
   slide has no size rather than drawn wrongly and left. */
window.CS = window.CS || {};
(function (CS) {
  'use strict';

  var WIRED = 'csFlowWired';

  /* How far past the outermost steps the margin lane sits, and how far
     off a row the between-rows lane sits, both as a share of the gap they
     are in. A half would put a lane exactly on top of the next one along;
     these are off-centre on purpose. */
  var LANE = 0.5;
  var MARGIN = 0.6;

  function stepsOf(rail) {
    return [].slice.call(rail.querySelectorAll('.cs-flow-step'));
  }

  /* ---------------------------------------------------------------------
     SHOWING A STEP
     --------------------------------------------------------------------- */

  function partsOf(chart) {
    var slide = chart.closest ? chart.closest('.cs-slide') : null;
    var where = slide || chart.parentNode;
    return {
      rail: chart.querySelector('.cs-flow-rail'),
      stage: where.querySelector('.cs-flow-stage'),
      shots: where.querySelector('.cs-flow-shots'),
      cap: where.querySelector('.cs-flow-title'),
      count: where.querySelector('.cs-flow-count'),
      prev: where.querySelector('.cs-flow-step-prev'),
      next: where.querySelector('.cs-flow-step-next')
    };
  }

  /* THE PICTURE. Replacing the node rather than editing it is deliberate:
     PrototypeEmbed decides what a slot IS - a drawing, a video, a thing
     that runs, or the hatched box naming what is missing - and asking it
     again is the only way to be sure the answer is right for this slot
     rather than left over from the last one. */
  function paint(p, stage) {
    if (!p.shots) return;
    var names = (stage.csSlots || []);
    var at = stage.csShot || 0;
    var name = names[at] || names[0] || '';

    var old = p.shots.querySelector('.cs-flow-shot');
    var made = CS.PrototypeEmbed.create(name, CS.PrototypeEmbed.lookup(name));
    made.className += ' cs-flow-shot';
    if (old) p.shots.replaceChild(made, old); else p.shots.appendChild(made);

    /* THE COUNTER AND THE CLICK AREAS GO QUIET for a step with one
       drawing. Hidden rather than removed: a stage that changed size as
       you stepped from a step with three pictures to one with a single
       picture is a picture you have lost your place in. */
    var many = names.length > 1;
    if (p.count) {
      p.count.textContent = many
        ? (at + 1) + ' out of ' + names.length + ' diagrams' : '';
      p.count.hidden = !many;
    }
    if (p.prev) p.prev.hidden = !many;
    if (p.next) p.next.hidden = !many;

    if (CS.strokes && CS.strokes.refresh) CS.strokes.refresh();
  }

  function stepShot(chart, by) {
    var p = partsOf(chart);
    if (!p.stage) return;
    var n = (p.stage.csSlots || []).length;
    if (n < 2) return;
    p.stage.csShot = ((p.stage.csShot + by) % n + n) % n;
    paint(p, p.stage);
  }

  function show(chart, btn) {
    var p = partsOf(chart);
    if (!p.rail || !btn || !p.stage) return;

    stepsOf(p.rail).forEach(function (b) {
      var on = b === btn;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.classList.toggle('is-on', on);
      b.tabIndex = on ? 0 : -1;
    });

    /* A STEP'S OWN PICTURES, and back to the first of them. Keeping the
       position would mean pressing a step with one drawing and then a step
       with four and landing on the fourth, which is nobody's intention. */
    p.stage.csSlots = (btn.dataset.csSlots || '').split(' ').filter(Boolean);
    p.stage.csShot = 0;

    var words = (p.stage.csStepWords || {})[btn.dataset.csStep] || {};

    /* THE LINE UNDERNEATH, or what to write to get one. */
    if (p.cap) {
      var key = p.stage.dataset.csTitlesKey || 'this slide';
      var t = words.title;
      p.cap.classList.remove('cs-slot-waiting');
      if (t === undefined || t === null || t === '') {
        p.cap.classList.add('cs-slot-waiting');
        p.cap.textContent = 'stepWords → ' + key + ' → ' +
                            btn.dataset.csStep + '.title';
      } else {
        p.cap.textContent = t;
      }
    }

    paint(p, p.stage);
  }

  /* ---------------------------------------------------------------------
     DRAWING THE LINES
     --------------------------------------------------------------------- */

  /* WHERE A JOIN ATTACHES. A plain step is joined at its dot; a collective
     is joined at its BOX, because the sheet draws the lines reaching the
     box and not the steps inside it. That difference is the whole of what
     makes a collective read as one thing. */
  function anchors(rail, box) {
    var map = {};
    [].slice.call(rail.querySelectorAll('[data-cs-node]')).forEach(function (el) {
      var target = el.classList.contains('cs-flow-collective')
        ? el : (el.querySelector('.cs-flow-dot') || el);
      var r = target.getBoundingClientRect();
      map[el.dataset.csNode] = {
        x: r.left - box.left + r.width / 2,
        y: r.top - box.top + r.height / 2,
        left: r.left - box.left,
        right: r.right - box.left,
        top: r.top - box.top,
        bottom: r.bottom - box.top
      };
    });
    return map;
  }

  /* WHERE A LINE TOUCHES. A direction of travel picks the side: going
     left, it leaves the left edge and arrives at the right edge of what
     it is heading for. Edges rather than centres is what makes a line
     touch a dot instead of ending underneath it, and what makes a join to
     a collective land on the box. */
  function leaveAt(a, dir) {
    if (dir === 'left')  return { x: a.left,  y: a.y };
    if (dir === 'right') return { x: a.right, y: a.y };
    if (dir === 'up')    return { x: a.x, y: a.top };
    return { x: a.x, y: a.bottom };
  }
  function arriveAt(b, dir) {
    if (dir === 'left')  return { x: b.right, y: b.y };
    if (dir === 'right') return { x: b.left,  y: b.y };
    if (dir === 'up')    return { x: b.x, y: b.bottom };
    return { x: b.x, y: b.top };
  }
  function horizontal(dir) { return dir === 'left' || dir === 'right'; }

  /* The route, as a list of points. Right angles only.

     TWO DIRECTIONS DESCRIBE IT COMPLETELY: the way the line LEAVES and
     the way it ARRIVES. That is the whole model, and it is worth saying
     why it is two and not one.

     One direction leaves the other end to be guessed, and the guess is
     wrong often enough to matter: a join leaving leftward might want to
     come up into the step from below - which is how the loop back to the
     start is drawn - or to come in from the side, which is how the
     collective reaches the steps beside it. Same `out`, two different
     pictures, and nothing in the geometry says which.

     SAME AXIS BOTH ENDS gives three segments: out to a lane, along it,
     and in. DIFFERENT AXES gives two: along one, then the other. */
  function route(a, b, out, into, bounds) {
    var sameRow = Math.abs(a.y - b.y) < 2;
    var sameCol = Math.abs(a.x - b.x) < 2;

    if (!out) {
      if (sameRow) out = b.x > a.x ? 'right' : 'left';
      else if (sameCol) out = b.y > a.y ? 'down' : 'up';
      else out = b.y > a.y ? 'down' : 'up';
    }
    if (!into) into = out;        /* a lane and back in, unless told */

    var from = leaveAt(a, out);
    var to = arriveAt(b, into);

    /* ALREADY IN LINE: nothing to route. */
    if (horizontal(out) && horizontal(into) && Math.abs(from.y - to.y) < 2) {
      return [from, to];
    }
    if (!horizontal(out) && !horizontal(into) && Math.abs(from.x - to.x) < 2) {
      return [from, to];
    }

    /* DIFFERENT AXES: an elbow. Along the way out to the target's other
       coordinate, then along the way in. */
    if (horizontal(out) !== horizontal(into)) {
      return horizontal(out)
        ? [from, { x: to.x, y: from.y }, to]
        : [from, { x: from.x, y: to.y }, to];
    }

    /* SAME AXIS: out to a lane, along it, and back in. The lane sits
       between the two when the target is the way we are heading, and out
       past everything when it is not - which is how a line reaches
       something standing behind the step that points at it. */
    if (horizontal(out)) {
      var toward = (out === 'right' && to.x > from.x) || (out === 'left' && to.x < from.x);
      var laneX = toward
        ? from.x + (to.x - from.x) * LANE
        : (out === 'right' ? bounds.right + (bounds.width - bounds.right) * MARGIN
                           : bounds.left - bounds.left * MARGIN);
      return [from, { x: laneX, y: from.y }, { x: laneX, y: to.y }, to];
    }
    var down = (out === 'down' && to.y > from.y) || (out === 'up' && to.y < from.y);
    var laneY = down
      ? from.y + (to.y - from.y) * LANE
      : (out === 'down' ? bounds.bottom + (bounds.height - bounds.bottom) * MARGIN
                        : bounds.top - bounds.top * MARGIN);
    return [from, { x: from.x, y: laneY }, { x: to.x, y: laneY }, to];
  }

  /* THE ARROWHEAD sits at the middle of the LAST segment, so it always
     points the way the line arrives. On a straight join between two steps
     that is the middle of the whole line, which is where the sheet draws
     it; on a routed one it is just before the step it reaches, which is
     also where the sheet draws it. One rule, both answers. */
  function head(pts, size) {
    var b = pts[pts.length - 1], a = pts[pts.length - 2];
    var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    var dx = b.x - a.x, dy = b.y - a.y;
    var len = Math.sqrt(dx * dx + dy * dy) || 1;
    var ux = dx / len, uy = dy / len;          /* along */
    var px = -uy, py = ux;                     /* across */
    var tipX = mx + ux * size * 0.5, tipY = my + uy * size * 0.5;
    var backX = mx - ux * size * 0.5, backY = my - uy * size * 0.5;
    return [
      tipX + ' ' + tipY,
      (backX + px * size * 0.45) + ' ' + (backY + py * size * 0.45),
      (backX - px * size * 0.45) + ' ' + (backY - py * size * 0.45)
    ].join(' ');
  }

  function draw(chart) {
    var rail = chart.querySelector('.cs-flow-rail');
    var holder = chart.querySelector('.cs-flow-line');
    if (!rail || !holder) return;
    var svg = holder.querySelector('svg');
    if (!svg) return;

    var box = rail.getBoundingClientRect();
    if (!box.width || !box.height) return;      /* hidden: measure later */

    var at = anchors(rail, box);
    var links = rail.csLinks || [];
    if (!links.length) { svg.innerHTML = ''; svg.removeAttribute('viewBox'); return; }

    var bounds = { left: box.width, right: 0, top: box.height, bottom: 0,
                   width: box.width, height: box.height };
    Object.keys(at).forEach(function (k) {
      if (at[k].left < bounds.left) bounds.left = at[k].left;
      if (at[k].right > bounds.right) bounds.right = at[k].right;
      if (at[k].top < bounds.top) bounds.top = at[k].top;
      if (at[k].bottom > bounds.bottom) bounds.bottom = at[k].bottom;
    });

    /* HOW BIG AN ARROWHEAD IS, measured off a dot rather than typed. The
       whole diagram scales with the slide, so a number here would be the
       one thing on it that did not. */
    var dot = rail.querySelector('.cs-flow-dot');
    var size = dot ? dot.getBoundingClientRect().width * 0.9 : 10;

    /* =================================================================
       ON A NARROW SCREEN THE ROUTES ARE NOT DRAWN, ON PURPOSE
       =================================================================

       A diagram that loops and branches needs two directions to be read
       in, and a phone has one. The layout already answers that by
       stacking every step in reading order down the page - but the routes
       were written for the wide arrangement ("leave rightward", "come in
       from below") and in a single column those directions describe
       nothing. Drawn anyway, they come out as lines straying across the
       labels, which looks like a fault rather than a diagram.

       So on a narrow screen there is a SPINE instead: one line down the
       steps, in the order they are written, broken where a collective
       sits because the box is on the line rather than beside it. The
       order is honest, the names are all there, and the joins that cannot
       be shown are not shown rather than shown wrongly.

       It is measured, not asked: the dots tell us which way they spread. */
    var all = [];
    [].slice.call(rail.querySelectorAll('.cs-flow-cell')).forEach(function (cell) {
      var collective = cell.classList.contains('cs-flow-cell--collective');
      var dot = cell.querySelector('.cs-flow-dot');
      if (!dot) return;
      var r = dot.getBoundingClientRect();
      all.push({ x: r.left - box.left + r.width / 2,
                 y: r.top - box.top + r.height / 2,
                 breaks: collective });
    });
    var xs = all.map(function (p) { return p.x; });
    var ys = all.map(function (p) { return p.y; });
    var spreadX = xs.length ? Math.max.apply(null, xs) - Math.min.apply(null, xs) : 0;
    var spreadY = ys.length ? Math.max.apply(null, ys) - Math.min.apply(null, ys) : 0;

    if (spreadY > spreadX) {
      var runs = [], run = [];
      all.forEach(function (p) {
        if (p.breaks) { if (run.length) runs.push(run); run = []; return; }
        run.push(p);
      });
      if (run.length) runs.push(run);
      var spine = runs.filter(function (r) { return r.length > 1; }).map(function (r) {
        return 'M ' + r[0].x.toFixed(1) + ' ' + r[0].y.toFixed(1) +
               ' L ' + r[r.length - 1].x.toFixed(1) + ' ' + r[r.length - 1].y.toFixed(1);
      }).join(' ');
      svg.setAttribute('viewBox', '0 0 ' + box.width + ' ' + box.height);
      svg.setAttribute('width', box.width);
      svg.setAttribute('height', box.height);
      svg.innerHTML = spine ? '<path class="cs-flow-path" d="' + spine + '" />' : '';
      return;
    }

    var bits = [];
    links.forEach(function (l) {
      var a = at[l.from], b = at[l.to];
      if (!a || !b) return;
      var pts = route(a, b, l.out, l['in'], bounds);
      var d = pts.map(function (p, i) {
        return (i ? 'L ' : 'M ') + p.x.toFixed(1) + ' ' + p.y.toFixed(1);
      }).join(' ');
      bits.push('<path class="cs-flow-path" d="' + d + '" />');
      bits.push('<polygon class="cs-flow-arrow" points="' +
                head(pts, size) + '" />');
    });

    svg.setAttribute('viewBox', '0 0 ' + box.width + ' ' + box.height);
    svg.setAttribute('width', box.width);
    svg.setAttribute('height', box.height);
    /* NO stroke-width HERE. An SVG presentation attribute is a plain
       value, not a place a CSS variable can be read, so the weight and the
       colour of the line are set in cs-flow.css where every other stroke
       weight on this site is set. */
    svg.innerHTML = bits.join('');
  }

  /* ---------------------------------------------------------------------
     WIRING
     --------------------------------------------------------------------- */

  function wire(chart) {
    var p = partsOf(chart);
    if (!p.rail) return;
    var steps = stepsOf(p.rail);
    if (!steps.length) return;

    p.rail.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('.cs-flow-step') : null;
      if (btn && p.rail.contains(btn)) show(chart, btn);
    });

    /* ARROW KEYS WALK THE DIAGRAM. The steps are a tablist, and a reader
       who has reached one with the keyboard should not have to tab through
       every step to try the next. They follow reading order - which,
       because the plan walks rows in the order they are written and a
       collective's sub-steps in theirs, means nothing is skipped. */
    p.rail.addEventListener('keydown', function (e) {
      var i = steps.indexOf(document.activeElement);
      if (i === -1) return;
      var to = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') to = steps[i + 1];
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') to = steps[i - 1];
      if (e.key === 'Home') to = steps[0];
      if (e.key === 'End') to = steps[steps.length - 1];
      if (!to) return;
      e.preventDefault();
      to.focus();
      show(chart, to);
    });

    /* THE CLICK AREAS EITHER SIDE OF THE PICTURE step that step's own
       drawings, not the steps in the diagram. Two different "next"s on
       one slide would be a problem if they looked alike - they do not: one
       is a dot in a diagram, the other is a tall strip beside a picture. */
    if (p.prev) p.prev.addEventListener('click', function () { stepShot(chart, -1); });
    if (p.next) p.next.addEventListener('click', function () { stepShot(chart, 1); });

    show(chart, steps[0]);
  }

  CS.initFlowCharts = function (root) {
    var charts = (root || document).querySelectorAll('.cs-flow-chart');
    for (var i = 0; i < charts.length; i++) {
      var chart = charts[i];
      if (!chart.dataset[WIRED]) {
        chart.dataset[WIRED] = '1';
        wire(chart);
      }
      draw(chart);
    }
  };

  /* Redraw on resize, and after a tab pane or a view is shown - both of
     those dispatch a resize for exactly this reason. Coalesced into one
     frame so a drag of the window edge does not draw a hundred times. */
  var pending = false;
  window.addEventListener('resize', function () {
    if (pending) return;
    pending = true;
    window.requestAnimationFrame(function () {
      pending = false;
      var charts = document.querySelectorAll('.cs-flow-chart');
      for (var i = 0; i < charts.length; i++) draw(charts[i]);
    });
  });

  CS.redrawFlowCharts = function (root) {
    var charts = (root || document).querySelectorAll('.cs-flow-chart');
    for (var i = 0; i < charts.length; i++) draw(charts[i]);
  };
})(window.CS);
