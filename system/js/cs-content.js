/* cs-content.js — the file that puts a case study's three content files
   together, once, before anything is drawn.

   ===========================================================================
   WHY A CASE STUDY IS THREE FILES AND NOT ONE
   ===========================================================================

   It used to be one. Everything lived in content.js: the running order, every
   word, every picture. That is fine to write and miserable to edit, because
   the three are not the same KIND of thing and you never want to change all
   three at once. You want to fix a heading. You want to drop in a drawing.
   You do not want to go looking for either in the middle of a slide
   definition.

   So each case study now keeps three files, and each one answers one
   question:

       copy.js      WHAT DOES IT SAY?
                    Every word in the study. Titles, headings, paragraphs,
                    captions, tab labels, the people, the drawers.

       media.js     WHAT PICTURE GOES WHERE?
                    Every picture slot in the study, with what it is waiting
                    for and what a screen reader is told it shows.

       content.js   IN WHAT ORDER, AND IN WHAT SHAPE?
                    The running order. Which template each slide uses, and
                    which words and which picture it pulls. No prose.

   This file is the join. It runs once, before the page is built, and folds
   the words and the pictures into the running order so that everything
   downstream - the templates, the carousels, the drawers - sees exactly the
   single object it has always seen. Nothing else in the engine had to change.

   ===========================================================================
   THE THREE WAYS A WORD FINDS ITS WAY ONTO A SLIDE
   ===========================================================================

   1. BY KEY.  A slide in content.js says `copy: 'slide-02'`, and everything
      under 'slide-02' in copy.js is folded into it.

          content.js   { template: 'context-2', copy: 'slide-02',
                         media: 'img-02-time-to-insight' }
          copy.js      'slide-02': { title: '…', body: '…', title2: '…' }

   2. BY THE PICTURE IT BELONGS TO.  A caption describes a picture, so it is
      filed under that picture's name, in one flat list. A slot that has a
      caption there gets it automatically - the slide never mentions it.

          copy.js      captions: { 'img-12-early-ideas': 'The first round…' }

   3. BY THE THING IT NAMES.  A tab label names a tab, so it is filed under
      that tab's id, in another flat list.

          copy.js      labels: { 'material-moves': 'Identification of…' }

   In all three cases, A WORD WRITTEN IN content.js WINS. That is deliberate:
   if you are experimenting and want to type a heading straight into the
   running order, nothing stops you. copy.js fills in what is not there, it
   does not overwrite what is.

   ===========================================================================
   WHAT HAPPENS IF A FILE IS MISSING
   ===========================================================================

   Nothing breaks. A case study that has no copy.js and no media.js, and
   keeps everything in content.js the old way, runs exactly as it did. That
   is not politeness - it is what lets a study be converted one piece at a
   time instead of all at once. */
window.CS = window.CS || {};
(function (CS) {
  'use strict';

  /* =======================================================================
     HOW MANY DRAWINGS A SLIDE SHOWS, AND WHAT THEY ARE CALLED
     =======================================================================

     `views: 5` on a slide's line means five drawings, stepped through. The
     names follow from the count rather than being typed out one by one:

         views: 1   ->   slide-11_img-01
         views: 5   ->   slide-11_img-01 ... slide-11_img-05

     So changing a slide from one drawing to five is CHANGING ONE NUMBER,
     and the slots it then asks for are named by the same rule they always
     were. Nothing has to be kept in step by hand, which is the point: a
     list typed out separately from the count is a list that can disagree
     with it.

     The base is the slide's own copy key - `slide-11` - unless the line
     says otherwise with `slotBase`.

     This lives here, in the file that knows about content, because three
     different things need to agree on it: the template that builds the
     carousel, the carousel that fills it, and the map that counts the
     slots. One rule, read from one place. */
  CS.viewSlots = function (base, n, kind) {
    var out = [];
    for (var i = 1; i <= (n || 1); i++) {
      out.push(base + '_' + (kind || 'img') + '-' + ('0' + i).slice(-2));
    }
    return out;
  };

  /* =======================================================================
     A FLOW CHART'S SHAPE, WORKED OUT ONCE
     =======================================================================

     The flow-chart slide draws a diagram of steps that a reader can click
     through. This turns what somebody WROTE into where everything GOES and
     what joins what - once, in one place, because four things have to
     agree about it: the template that builds the diagram, the module that
     draws the lines, the module that steps the pictures, and the map that
     counts the drawing slots.

     =======================================================================
     WHAT CHANGED, AND WHY IT HAD TO
     =======================================================================

     The first version read the flow as a LINE: a list of steps, read left
     to right, with an optional fork that hung a second track underneath.
     The joins were never written down - they were inferred from the
     reading order, because in a line the only thing a step can join is the
     step after it.

     The sheet of 5 November is not a line. It loops back to the start, it
     runs two ways out of one step, and it has a step that is a box with
     smaller steps inside it. None of that can be inferred from an order,
     for the simple reason that an order has one direction and this has
     several.

     SO THE JOINS ARE NOW WRITTEN DOWN. `links` is a list of what connects
     to what, and the reading order no longer decides anything. Which turns
     out to make the drawing code SMALLER rather than larger: it used to
     work out where the line should go by grouping dots and guessing where
     a fork was; now it draws the joins it was given.

     Leave `links` out and the old behaviour is still there: every row is
     joined up left to right, and a legacy `branch` still hangs its tracks
     and joins them at the fork. Nothing written before this stops working.

     =======================================================================
     WHAT YOU WRITE
     =======================================================================

     ONE ROW - the way it has always been:

         steps: [ 'intake', 'triage', 'draft' ]

     SEVERAL ROWS - a list of lists. `null` leaves a gap, which is how a
     step sits under the third column rather than the first:

         steps: [
           [ 'intake', 'triage', 'draft', 'review', 'approve', 'publish' ],
           [ null, 'archive', null, 'rework' ],
           [ null, null, null, 'reject' ]
         ]

     A COLLECTIVE - one step that is a box of smaller ones:

         { id: 'checks', collective: [ 'legal', 'risk', 'credit' ] }

     THE JOINS, with the loop and the two-way split the sheet draws:

         links: [
           [ 'publish', 'rework' ],
           { from: 'publish', to: 'checks', out: 'right' },
           [ 'checks', 'rework' ],
           [ 'checks', 'reject' ],
           [ 'rework', 'reject' ],
           [ 'rework', 'archive' ],
           [ 'archive', 'intake' ]          <- the loop
         ]

     `out` says which way the line LEAVES the first step - 'up', 'down',
     'left' or 'right'. Left out, it is worked out: straight when the two
     share a row or a column, and otherwise away from the row it is on
     toward the row it is going to. Write it when the automatic answer
     crosses something it should go round. See the router in
     cs-flowchart.js for what each one does.

     =======================================================================
     THE FOUR NUMBERS EVERY NODE CARRIES
     =======================================================================

         col     which column it is in
         row     which row it is on
         seq     its place in reading order, everything included
         depth   how deeply nested it is

     The wide layout is drawn from col and row; the phone layout from seq
     and depth. Neither layout is known in here - only the four facts that
     either one needs, so a third layout would need no new planning. */
  CS.flowPlan = function (steps, links) {
    var nodes = [];
    var state = { lastRow: 0, seq: 0, maxDepth: 0 };
    var made = [];           /* every link the plan works out for itself */

    /* A LIST OF LISTS IS ROWS; a flat list is one row. Deciding by looking
       rather than by a flag means the simple case stays simple and nobody
       has to remember to say which kind they wrote. */
    var rows = Array.isArray(steps) && steps.some(Array.isArray)
      ? steps : [steps || []];

    function walk(list, row, startCol, depth) {
      var col = startCol;
      var runEnd = null;     /* the last step on this run, for joining up */
      if (depth > state.maxDepth) state.maxDepth = depth;

      (list || []).forEach(function (item) {
        /* A GAP. `null` in a row means "nothing in this column", which is
           how a step is placed under the fourth column rather than the
           first. It costs a column and nothing else. */
        if (item === null || item === undefined || item === '') { col++; return; }

        if (typeof item === 'string') item = { id: item };

        if (item.separator !== undefined && item.separator !== false) {
          nodes.push({ kind: 'separator', row: row, col: col,
                       seq: ++state.seq, depth: depth,
                       label: typeof item.separator === 'string' ? item.separator : '' });
          col++;
          return;
        }

        /* LEGACY: a fork that hangs its tracks below. Kept working because
           it is written down in the README and somebody may have used it.
           It now produces LINKS like everything else rather than being a
           shape the drawing code has to recognise. */
        if (item.branch) {
          var ends = [], firsts = [];
          item.branch.forEach(function (track, i) {
            var trackRow = (i === 0) ? row : ++state.lastRow;
            var before = nodes.length;
            ends.push(walk(Array.isArray(track) ? track : [track],
                           trackRow, col, depth + 1));
            for (var j = before; j < nodes.length; j++) {
              if (nodes[j].kind === 'step' || nodes[j].kind === 'collective') {
                firsts.push(nodes[j]); break;
              }
            }
          });
          if (runEnd) firsts.forEach(function (f) {
            made.push({ from: runEnd.id, to: f.id });
          });
          col = Math.max.apply(null, ends.concat([col]));
          runEnd = null;      /* the tracks carry on, not this run */
          return;
        }

        /* A COLLECTIVE. One cell on the grid holding a stack of smaller
           steps. The box is a place, not a button - what a reader presses
           is a sub-step inside it, because that is what has a drawing. */
        if (item.collective) {
          var cnode = { kind: 'collective', id: item.id, label: item.label,
                        row: row, col: col, seq: ++state.seq, depth: depth,
                        subs: [] };
          (item.collective || []).forEach(function (sub, i) {
            if (typeof sub === 'string') sub = { id: sub };
            cnode.subs.push({ kind: 'sub', id: sub.id, label: sub.label,
                              shots: sub.shots, parent: item.id, index: i,
                              row: row, col: col,
                              seq: ++state.seq, depth: depth + 1 });
          });
          nodes.push(cnode);
          if (runEnd) made.push({ from: runEnd.id, to: cnode.id });
          runEnd = cnode;
          col++;
          return;
        }

        if (item.id) {
          var snode = { kind: 'step', id: item.id, label: item.label,
                        shots: item.shots,
                        row: row, col: col, seq: ++state.seq, depth: depth };
          nodes.push(snode);
          /* THE IMPLICIT JOIN. With no `links` written, a row reads left
             to right, which is what a flow chart with one row has always
             meant. The moment `links` IS written these are dropped - half
             a diagram joined up by hand and half by accident would be the
             worst of both. */
          if (runEnd) made.push({ from: runEnd.id, to: snode.id });
          runEnd = snode;
          col++;
          return;
        }
      });
      return col;
    }

    rows.forEach(function (list, i) {
      if (i > state.lastRow) state.lastRow = i;
      walk(Array.isArray(list) ? list : [list], i, 0, 0);
    });

    /* ---- the joins ---- */
    var written = (links || []).map(function (l) {
      if (Array.isArray(l)) return { from: l[0], to: l[1], out: l[2], 'in': l[3] };
      return { from: l.from, to: l.to, out: l.out, 'in': l['in'] };
    }).filter(function (l) { return l.from && l.to; });

    var known = {};
    nodes.forEach(function (n) {
      if (n.id) known[n.id] = n;
      (n.subs || []).forEach(function (s) { if (s.id) known[s.id] = s; });
    });

    /* A JOIN TO SOMETHING THAT IS NOT THERE is a typo, and a typo that
       draws nothing and says nothing is the worst kind. It is dropped, and
       it says which name it could not find. */
    var use = (written.length ? written : made).filter(function (l) {
      var ok = known[l.from] && known[l.to];
      if (!ok && window.console && console.warn) {
        console.warn('[case study] flow chart: no step called "' +
          (known[l.from] ? l.to : l.from) + '" to join');
      }
      return ok;
    });

    var cols = 0;
    nodes.forEach(function (n) { if (n.col + 1 > cols) cols = n.col + 1; });
    return { nodes: nodes, links: use, cols: cols,
             rows: state.lastRow + 1, depth: state.maxDepth,
             count: state.seq };
  };

  /* EVERY PRESSABLE THING, IN READING ORDER. A collective is not one of
     them - it is a box. What a reader presses is a step, or a sub-step
     inside a collective, because those are the things with a drawing. */
  CS.flowSteps = function (steps) {
    var out = [];
    CS.flowPlan(steps).nodes.forEach(function (n) {
      if (n.kind === 'step') out.push(n);
      if (n.kind === 'collective') (n.subs || []).forEach(function (s) { out.push(s); });
    });
    return out;
  };

  /* WHAT EACH STEP'S DRAWING IS CALLED.

     ONE DRAWING, the way it has always been:

         phase-01_slide-07_step-5_img

     A CAROUSEL - `shots: 3` on the step - is numbered, using the same
     rule every other carousel on this site uses (CS.viewSlots above), so
     there is one convention for "several pictures in one place":

         phase-01_slide-07_step-5_img-01
         phase-01_slide-07_step-5_img-02
         phase-01_slide-07_step-5_img-03

     The two are deliberately spelled differently. A step that has always
     had one drawing keeps the name that drawing already has on disk, and
     nothing has to be renamed to upgrade the rest of the slide. */
  CS.flowSlot = function (base, id) {
    return (base ? base + '_' : '') + id + '_img';
  };

  CS.flowShots = function (base, id, n) {
    if (!n || n < 2) return [CS.flowSlot(base, id)];
    return CS.viewSlots((base ? base + '_' : '') + id, n);
  };

  /* =======================================================================
     AN ACCORDION'S DRAWINGS, WORKED OUT ONCE
     =======================================================================

     The strip-fancy-accordion slide holds a stack of accordions. Each one
     opens on a body of writing that may have drawings standing between its
     paragraphs - as many as you like, wherever you put them:

         accordionWords: {
           intake: { label: `How a case arrives`, body: [
             `The first paragraph.`,
             { kind: 'image' },
             `The paragraph after the drawing.`,
             { kind: 'image' },
             `And the last one.`
           ] }
         }

     THE NAMES FOLLOW FROM WHERE THE DRAWING SITS, so the count and the
     list cannot disagree - the same rule as `views:` everywhere else:

         slide-05_intake_img-01
         slide-05_intake_img-02

     NUMBERED EVEN WHEN THERE IS ONLY ONE. The flow chart spells a single
     drawing `..._step_img` without a number, because those files already
     existed on disk under that name and renaming them to add a feature
     would have been a poor trade. Nothing here exists yet, so it takes the
     plain rule instead: `views: 1` gives `_img-01` and so does this.

     A DRAWING YOU NAME YOURSELF IS LEFT ALONE. Write
     `{ kind: 'image', media: 'whatever_img-01' }` and that is the name
     used - the same exception every derived name on this site makes, for
     the same reason: you can see that one and it is yours.

     WHY THE COUNT IS READ OUT OF THE WORDS. Everywhere else on this site a
     count of drawings is a fact about the slide and lives in content.js.
     Here it cannot: a drawing's place is BETWEEN TWO PARAGRAPHS, and the
     paragraphs are in copy.js. Saying "after the second one" in content.js
     would mean two files having to be counted in step with each other, and
     the first inserted sentence would silently move every drawing. So the
     drawing is written where it stands. */
  CS.fancySlot = function (base, id, i) {
    return (base ? base + '_' : '') + id + '_img-' + ('0' + (i + 1)).slice(-2);
  };

  /* every drawing one accordion asks for, in the order they stand in */
  CS.fancyShots = function (base, id, bodyList) {
    var out = [];
    (Array.isArray(bodyList) ? bodyList : [bodyList]).forEach(function (part) {
      if (!part || part.kind !== 'image') return;
      out.push(part.media || CS.fancySlot(base, id, out.length));
    });
    return out;
  };

  /* EVERY PRESSABLE ACCORDION ON A SLIDE, in the order they are written.
     A string is the short form of { id: 'name' }, the same way a step is
     on a flow chart. */
  CS.fancyItems = function (accordions) {
    var out = [];
    (accordions || []).forEach(function (a) {
      if (typeof a === 'string') a = { id: a };
      if (a && a.id) out.push(a);
    });
    return out;
  };

  /* Asked for by the slide AND by tools/slide-map.js, so the map and the
     page can never disagree about which drawing is missing. */
  CS.fancySlots = function (base, accordions, words) {
    var out = [];
    words = words || {};
    CS.fancyItems(accordions).forEach(function (a) {
      var w = words[a.id] || {};
      CS.fancyShots(base, a.id, w.body).forEach(function (n) { out.push(n); });
    });
    return out;
  };

  CS.flowSlots = function (base, steps) {
    var out = [];
    CS.flowSteps(steps).forEach(function (n) {
      CS.flowShots(base, n.id, n.shots).forEach(function (s) { out.push(s); });
    });
    return out;
  };

  /* WHAT THE MIDDLE WORD IS. A drawing is `_img-`, and a thing that RUNS is
     `_prototype-` - that is how every slot on this site has been named since
     the first one, and a stepped prototype slide should not be the exception
     just because its names are worked out rather than typed.

     IT IS A FUNCTION RATHER THAN A LOOKUP WHERE IT IS NEEDED, because three
     places need the same answer - the template that builds the slide, the
     module that steps it, and the map that counts the slots - and three
     copies of a rule is two too many. */
  CS.viewKind = function (template) {
    return template === 'prototype' ? 'prototype' : 'img';
  };

  /* Fold `from` into `into`, but never over the top of something already
     there. Arrays and objects are taken whole; nothing is merged deeply,
     because a half-merged list of paragraphs is worse than either. */
  function fill(into, from) {
    if (!from) return into;
    Object.keys(from).forEach(function (k) {
      if (into[k] === undefined) into[k] = from[k];
    });
    return into;
  }

  /* Walk everything - objects inside arrays inside objects - and apply the
     three rules to each object on the way past. A guard list stops a shape
     that points back at itself from walking forever. */
  function walk(node, copy, seen, where) {
    if (!node || typeof node !== 'object') return;
    if (seen.indexOf(node) !== -1) return;
    seen.push(node);

    if (Array.isArray(node)) {
      node.forEach(function (item) { walk(item, copy, seen, where); });
      return;
    }

    /* 1 - by key */
    if (typeof node.copy === 'string') {
      var block = copy[node.copy];
      if (block && typeof block === 'object' && !Array.isArray(block)) fill(node, block);
      else if (block === undefined) {
        console.warn('[case study] ' + (where || 'copy.js') +
          ' has no block called "' + node.copy + '"');
      }
    }

    /* 2 - by the picture it belongs to */
    if (typeof node.media === 'string' && node.caption === undefined &&
        copy.captions && copy.captions[node.media] !== undefined) {
      node.caption = copy.captions[node.media];
    }

    /* 2a-bis - A SECOND PICTURE GETS ITS CAPTION THE SAME WAY. `media2` is
       the small drawing at the head of an explains panel, and the line
       beside it is filed under `captions` by that picture's name, exactly
       as a caption under any other picture is. */
    if (typeof node.media2 === 'string' && node.caption2 === undefined &&
        copy.captions && copy.captions[node.media2] !== undefined) {
      node.caption2 = copy.captions[node.media2];
    }

    /* 2b and 2c - the question above a stepped diagram and the writing
       beside it, both filed under the drawing's own name the same way its
       caption is. One function does it, because the carousels have to do
       exactly the same thing for drawings that are not written down - see
       CS.shotWords below. */
    if (typeof node.media === 'string') shotWords(node, copy);

    /* 3 - by the thing it names */
    if (typeof node.id === 'string' && node.label === undefined &&
        copy.labels && copy.labels[node.id] !== undefined) {
      node.label = copy.labels[node.id];
    }

    Object.keys(node).forEach(function (k) { walk(node[k], copy, seen, where); });
  }

  /* =======================================================================
     A PHASE OWNS EVERYTHING ITS SLIDES SHOW
     =======================================================================

     WHAT WENT WRONG. A phase folder held its running order and its words,
     and that looked like containment until a phase slide needed a LIST.
     Several slides do not carry their own contents - they NAME a list that
     lives somewhere else:

         { template: 'wireframe', flows: 'understanding' }
         { template: 'use-case',  groups: ['analysts'] }
         { template: 'persona' }

     `flows`, `diagrams`, `groups`, the people on the persona slide, the
     drawers a word opens - every one of those was looked up in the STUDY's
     content.js, because that was the only place the engine looked. So a
     phase slide could not be written without reaching back into the outer
     file, which is exactly what keeping a phase in its own folder was for.

     WORSE, IT FAILED QUIETLY. `flows: 'ideation'` with no such set in the
     study's content.js did not complain - it fell back to the study's plain
     `workflows` list, and if there was not one of those either the slide
     drew itself with one empty diagram and a counter reading "1 of 1".
     Nothing on the page or in the console said the set was never found.

     HOW IT WORKS NOW. A phase's content.js may carry any of these lists
     itself, written exactly as the study's content.js writes them:

         CS.TABS['phase-01'] = {
           label: 'Phase 1',
           slides: [ ... ],
           workflowSets: { understanding: [ ... ] },
           userGroups:   [ ... ],
           personas:     [ ... ],
           drawers:      { detail: { ... } }
         };

     and a slide inside that phase reads the PHASE's list. Not the study's,
     and not the study's as a fallback either: if the phase declares a list
     at all, the study's list of that name is invisible to it. Two lists
     with one name, one of them silently winning, is the mistake this whole
     arrangement exists to prevent.

     NOTHING CROSSES OVER UNLESS THE PHASE ASKS BY NAME. A phase that WANTS
     the study's people rather than its own copy of them says so in one
     word, where anyone reading the file can see it:

         shares: ['personas', 'userGroups']

     `shares: true` takes the lot, which is how a phase written before any
     of this keeps working. A list the phase neither declares nor shares is
     a list the phase does not have, and asking for a set out of it says so
     in the console rather than drawing a slide with one empty box in it.

     WHICH LISTS. These are the ones a slide can NAME rather than carry:

         workflows, workflowSets     the diagram carousels
         diagrams,  diagramSets      the backend slide
         personas                    the people carousel
         userGroups                  the faces on a use-case slide
         drawers                     the panels a word opens

     The DRAWINGS are a different shape of problem and are handled further
     down, where media.js is folded in: a phase's pictures are filed under
     names that already begin with the phase's own name, so those can be -
     and are - merged into one flat map with no chance of a collision. */
  var PHASE_POOLS = ['workflows', 'workflowSets', 'diagrams', 'diagramSets',
                     'personas', 'userGroups', 'drawers'];

  CS._phases = CS._phases || {};

  /* WHICH PHASE A THING BELONGS TO, asked of whatever you happen to have.

     THREE KINDS OF ANSWER, because the question gets asked at three
     different moments and only one of them has a page to look at:

       a name      'phase-01', when the caller already knows.

       a slide     the line out of content.js. It carries `copyIn` - the
                   phase it was read from - put there by prefixSlots below.
                   This is what the TEMPLATES have: they are handed the
                   slide's own line and build from it, long before any of
                   it is on the page.

       an element  something already drawn. The pane a phase's slides sit
                   in is stamped with the phase's name (see cs-render.js),
                   so anything inside it can find out where it is. This is
                   what the CAROUSELS have: they are wired after the page
                   is built and all they hold is a slide element.

     AN ELEMENT THAT IS ON THE PAGE AND NOT IN A PANE IS NOT IN A PHASE,
     and that is a real answer rather than a failure to find one - it is an
     ordinary slide in the outer story. */
  function phaseIdOf(where) {
    if (!where) return '';
    if (typeof where === 'string') return where;
    if (where.nodeType === 1) {
      var pane = where.closest && where.closest('[data-cs-phase]');
      return pane ? (pane.dataset.csPhase || '') : '';
    }
    return where.copyIn || '';
  }

  /* `CS.pool('workflowSets', slideOrElementOrName)` - the list that thing
     is entitled to see, which is the phase's own if it has one.

     IT RETURNS UNDEFINED RATHER THAN THE STUDY'S when a phase has neither
     declared nor shared the list. A caller that gets undefined should say
     so and draw nothing, which is what an unwritten list looks like. */
  CS.pool = function (name, where) {
    var study = (CS.CASE_STUDY || {})[name];
    var id = phaseIdOf(where);
    if (!id) return study;

    var phase = CS._phases[id];
    if (!phase) return study;
    if (phase[name] !== undefined) return phase[name];

    var shares = phase.shares;
    if (shares === true) return study;
    if (Array.isArray(shares) && shares.indexOf(name) !== -1) return study;

    /* SAID ONCE PER PHASE AND LIST, not once per slide that asks. Four
       slides in a phase reading the same missing list is one thing to fix,
       so it is one line in the console. */
    if (study !== undefined) {
      var said = phase._saidPools || (phase._saidPools = {});
      if (!said[name] && window.console && console.warn) {
        said[name] = true;
        console.warn('[case study] ' + id + ' has no `' + name + '`, and the ' +
          'study\'s is not shared with it. Either write `' + name + '` into ' +
          id + '/content.js, or add `shares: [\'' + name + '\']` there to use ' +
          'the study\'s.');
      }
    }
    return undefined;
  };

  /* =======================================================================
     WHAT A DRAWING'S OWN NAME IS ENOUGH TO FIND
     =======================================================================

     Three things on a stepped slide belong to the DRAWING rather than to
     the slide, and all three are filed in copy.js under the drawing's name:

         captions[<drawing>]    the line under it
         questions[<drawing>]   the question it answers, above it
         bodies[<drawing>]      the column of writing beside it

     THIS USED TO BE DONE IN ONE PLACE AND THAT PLACE WAS THE WRONG ONE.
     The rule lived inside the copy walk, which runs once at start-up over
     everything WRITTEN DOWN in content.js. A `flows:` set writes its shots
     out by hand, so the walk reached them and filled all three in.

     `views: 4` writes nothing down - the four drawings follow from the
     count, and the carousel works their names out in the browser, long
     after the walk has finished. So those shots were built with a name and
     nothing else: the pictures appeared and the questions and the writing
     beside them did not, with nothing to say why.

     That is the whole of the bug, and the cure is that the rule now lives
     in a function both callers use rather than inside one of them. */
  function shotWords(node, copy) {
    if (!node || typeof node.media !== 'string' || !copy) return node;
    if (node.caption === undefined && copy.captions &&
        copy.captions[node.media] !== undefined) {
      node.caption = copy.captions[node.media];
    }
    if (node.question === undefined && copy.questions &&
        copy.questions[node.media] !== undefined) {
      node.question = copy.questions[node.media];
    }
    if (node.body === undefined && copy.bodies &&
        copy.bodies[node.media] !== undefined) {
      node.body = copy.bodies[node.media];
    }
    return node;
  }

  /* THE COPY A PHASE'S SLIDES READ, kept from assembly so that anything
     built later in the browser reads the same words the walk did. Without
     it a phase's stepped slide would be handed the study's `questions`
     rather than its own. */
  CS._phaseCopy = CS._phaseCopy || {};

  /* `CS.shotWords({ media: 'slide-05_img-01' }, 'phase-01')` - the shot,
     with whatever copy.js has to say about that drawing folded in.
     `phaseId` is optional and is the phase the slide sits in, if any. */
  CS.shotWords = function (shot, phaseId) {
    var copy = (phaseId && CS._phaseCopy[phaseId]) || CS.COPY || {};
    return shotWords(shot, copy);
  };

  /* Run once, from cs-main.js, before CS.render(). */
  CS.assembleContent = function () {
    var data = CS.CASE_STUDY;
    if (!data) return;

    var copy = CS.COPY || {};
    data.meta = fill(data.meta || {}, copy.meta);

    /* ===================================================================
       THE TABS, EACH OUT OF ITS OWN PAIR OF FILES
       ===================================================================

       A tab series in content.js names its tabs rather than holding them:

           { group: 'tab-series', tabs: ['phase-01', 'phase-03'] }

       and each of those names is a FOLDER beside this study's own files:

           phase-01/content.js    CS.TABS['phase-01']     = { label, slides }
           phase-01/copy.js       CS.TAB_COPY['phase-01'] = { 'slide-01': … }

       WHY THEY ARE SEPARATE. A phase is a chapter with ten or twenty
       slides in it, and keeping all of them in the study's one content.js
       makes a file nobody can hold in their head - you scroll past phase 1
       to reach phase 3 and the outer story is lost in the middle of it.
       Separate files mean a phase can be opened, written and checked on
       its own.

       AND EACH PHASE HAS ITS OWN NAMES. `slide-01` in phase-01/copy.js and
       `slide-01` in phase-03/copy.js are two different blocks, because each
       phase's slides are looked up in that phase's copy FIRST. So a phase
       numbers its slides from 01 like any other little story, and adding
       one to phase 1 does not renumber anything in phase 3.

       A PHASE'S SLIDES READ ONLY THE PHASE'S OWN WORDS. This used to be
       softer - a block the phase did not have was looked for in the
       study's copy.js as a fallback - and that was a mistake, because the
       study's copy.js also has `slide-01` to `slide-22` in it. A phase
       slide whose block was not written yet did not come up empty; it
       quietly rendered a completely different slide's words, and nothing
       said so. A wrong answer with no warning is worse than a blank.

       So the fallback is now limited to the SHARED LISTS - `captions`,
       `labels`, `questions`, `bodies`. Those are flat name-to-words maps
       where every key is the name of a drawing or a tab, so they cannot
       collide by accident: a caption is filed under the picture it
       describes, and two phases cannot have the same picture. A phase may
       add its own entries to any of them, and its own entry wins.

       Slide blocks do not fall through. If a phase slide's block is
       missing, the slide comes up empty and the console says which file is
       missing which block - `phase-01/copy.js has no block called
       "slide-03"` - which is the whole name and the whole instruction.

       A TAB NAMED HERE WHOSE FILE DID NOT LOAD is left as the name it was
       written as, and cs-render.js draws it as a pane saying which file is
       missing. Silence would be a blank chapter. */
    /* ===================================================================
       A PHASE'S DRAWINGS ARE NAMED AFTER THE PHASE
       ===================================================================

       SOME DRAWINGS ARE NEVER NAMED BY HAND. A slide that says `views: 5`
       is asking for five drawings whose names FOLLOW from the slide - the
       count is the list, so nothing has to be kept in step. The names come
       out as `slide-03_img-01` and so on.

       THAT WAS FINE UNTIL THERE WERE PHASES. Each phase numbers its slides
       from 01, so phase 1's third slide and phase 3's third slide both ask
       for `slide-03_img-01` - one name, two different drawings, and
       whichever file is in assets/ wins for both. Nothing would say so:
       the second phase would quietly show the first phase's pictures.

       SO A PHASE PUTS ITS OWN NAME IN FRONT:

           phase-01_slide-03_img-01
           phase-03_slide-03_img-01

       and the two can never be the same file. The empty box on the page
       prints the whole name it is waiting for, as always, so what to call
       the file is never a guess.

       TO USE A DIFFERENT PREFIX, name it on the phase in its content.js:

           CS.TABS['phase-01'] = { label: 'Phase 1', slotPrefix: 'p1', … }

       and the drawings become `p1_slide-03_img-01`. Write `slotPrefix: ''`
       and there is no prefix at all, which is the old behaviour and is only
       safe while one phase has drawings.

       ONLY THE DERIVED NAMES ARE TOUCHED. A drawing you named yourself on
       a slide's line - `media: 'whatever_img-01'` - is left exactly as you
       typed it, because you can see that name and it is yours. This fixes
       the names you CANNOT see. A slide that sets its own `slotBase` is
       left alone for the same reason. */
    function prefixSlots(tab) {
      var prefix = tab.slotPrefix !== undefined ? tab.slotPrefix : tab.id;
      (tab.slides || []).forEach(function (slide) {
        if (!slide) return;

        /* WHICH FILE A SLIDE'S WORDS CAME FROM, so the page can say so.

           Every empty thing on this site names the block it is waiting for
           - `viewTitles -> slide-03`. That was a complete answer while
           there was one copy.js. With a phase holding its own, it is half
           an answer: slide-03 in WHICH file? The study's, or this phase's?

           So a slide inside a phase remembers which phase it is in, and
           the waiting messages say `viewTitles -> phase-01/slide-03`. It
           costs one word on each slide and turns a question into an
           instruction. */
        if (tab.id) slide.copyIn = tab.id;

        if (!prefix) return;
        if (slide.slotBase !== undefined) return;
        if (!slide.copy) return;
        slide.slotBase = prefix + '_' + slide.copy;
      });
    }

    /* THE WORDS A PHASE IS ALLOWED TO SEE.

       Its own file, whole, plus the four shared lists from the study's
       copy.js folded in UNDERNEATH its own. Nothing else crosses over.

       The lists are merged one level deep, which is the only place in this
       engine where that is safe: each is a flat map from a name to a line
       of words, so folding two of them together cannot produce a
       half-merged anything. A phase can add a caption without having to
       copy the study's captions into its file, and if both name the same
       picture the phase wins. */
    var SHARED_LISTS = ['captions', 'labels', 'questions', 'bodies'];

    function phaseCopy(own) {
      var out = fill({}, own);
      SHARED_LISTS.forEach(function (k) {
        var shared = copy[k];
        if (!shared || typeof shared !== 'object') return;
        if (out[k] === undefined) { out[k] = shared; return; }
        out[k] = fill(fill({}, out[k]), shared);
      });
      return out;
    }

    var tabObjects = [];
    (data.story || []).forEach(function (item) {
      if (!item || item.group !== 'tab-series') return;
      item.tabs = (item.tabs || []).map(function (t) {
        if (typeof t !== 'string') { tabObjects.push(t); return t; }
        var found = (CS.TABS || {})[t];
        if (!found) {
          console.warn('[case study] no tab called "' + t +
            '" - is ' + t + '/content.js loaded?');
          return { missing: t };
        }
        found.id = t;
        var mine = phaseCopy(CS.TAB_COPY && CS.TAB_COPY[t]);
        /* kept so that anything built in the browser later - a stepped
           slide working out its own drawings - reads the same words this
           walk does. See CS.shotWords. */
        CS._phaseCopy[t] = mine;
        walk(found, mine, [], t + '/copy.js');
        prefixSlots(found);
        /* SO THE REST OF THE ENGINE CAN FIND THIS PHASE'S OWN LISTS - see
           CS.pool above. The phase object itself is registered rather than
           a copy of it, so a list written in the phase's content.js is the
           list the slides read, with nothing in between to go stale. */
        CS._phases[t] = found;
        tabObjects.push(found);
        return found;
      });
    });

    /* THE PARKED LIST IS NOT WALKED EITHER. It holds slides that are
       deliberately not in the running order, and their `copy:` keys point
       at blocks from a structure that has moved on - so walking it printed
       fourteen console warnings about blocks "missing" from copy.js that
       nobody is waiting for.

       A warning nobody should act on is worse than no warning: it teaches
       the reader to scroll past the console, and the next one will be real.

       The tabs are skipped for the same mechanical reason - they have had
       their own walk already, with their own phase's copy. */
    var skip = tabObjects.slice();
    if (data.parked) skip.push(data.parked);

    walk(data, copy, skip);

    /* The pictures. A study that keeps its own `media` map inside content.js
       still works; otherwise media.js is where the engine looks. */
    if (!data.media && CS.MEDIA) data.media = CS.MEDIA;

    /* ===================================================================
       A PHASE'S DRAWINGS ARE DESCRIBED IN THE PHASE'S OWN media.js
       ===================================================================

       The study's media.js describes the study's drawings. A phase that
       has its own may describe them beside its own slides:

           phase-01/media.js    CS.TAB_MEDIA['phase-01'] = { ... }

       written exactly the way the study's media.js is written, and loaded
       in index.html right after that phase's copy.js:

           <script src="phase-01/media.js"></script>

       NO SUCH FILE IS A PERFECTLY GOOD ANSWER. A phase whose drawings need
       nothing said about them - no ratio, no poster, no link, just a file
       in a folder - needs no media.js at all, because a drawing left under
       the slot's own name is found without an entry (see cs-prototype.js).

       THESE ONES ARE MERGED, AND THAT IS SAFE HERE WHERE IT IS NOT SAFE
       ANYWHERE ELSE. Every other list a phase owns is keyed by a name you
       chose - `understanding`, `analysts` - and two phases can easily
       choose the same one. A media map is keyed by SLOT names, and a
       phase's slots already begin with the phase's own name
       (phase-01_slide-03_img-01), so two phases cannot file anything under
       one key even by accident. One flat map is therefore the honest shape
       for these, and it means a slot can be looked up from anywhere by its
       name alone, which is what the carousels and the prototype embed do.

       THE PHASE'S ENTRY WINS where both describe the same slot, the same
       way a phase's words win over the study's. */
    (function () {
      var maps = CS.TAB_MEDIA || {};
      var any = Object.keys(CS._phases);
      if (!any.length) return;
      any.forEach(function (id) {
        var mine = maps[id];
        if (!mine || typeof mine !== 'object') return;
        data.media = data.media || {};
        Object.keys(mine).forEach(function (slot) {
          data.media[slot] = mine[slot];
        });
      });
    })();

    /* ===================================================================
       AND THE FILES THEMSELVES LIVE IN THE PHASE'S FOLDER
       ===================================================================

       A drawing nobody wrote an entry for is found by looking for a file
       named after the slot. That used to mean one folder for the whole
       study - assets/ - so a phase's twenty pictures landed in the same
       heap as the outer story's, told apart only by the prefix on their
       filenames.

       A PHASE'S PICTURES NOW GO IN THE PHASE'S OWN FOLDER:

           case-studies/<study>/phase-01/assets/phase-01_slide-03_img-01.png

       and nothing has to be told that - the slot's name begins with the
       phase's prefix, so the prefix IS the instruction about where to look.
       This map is what turns one into the other; cs-prototype.js reads it.

       THE STUDY'S OWN assets/ IS STILL TRIED AFTERWARDS, so a drawing
       already sitting there keeps working and can be moved when convenient
       rather than all at once. The empty box prints the name it wants, as
       always, and the console says which folders were looked in. */
    CS.SLOT_DIRS = CS.SLOT_DIRS || {};
    Object.keys(CS._phases).forEach(function (id) {
      var tab = CS._phases[id];
      var prefix = tab.slotPrefix !== undefined ? tab.slotPrefix : id;
      if (!prefix) return;
      CS.SLOT_DIRS[prefix] = id + '/assets/';
    });

    /* ---------- THE MAP ----------
       Open the console on a case study and type

           CS.slideMap()

       and it prints the whole structure: every slide in order, what it is
       called, which layout it uses, and which picture slots sit on it. It
       is generated from the three content files rather than written down
       anywhere, so it cannot drift out of date.

       `node tools/slide-map.js <study>` prints the same thing without a
       browser, which is where the table in the change notes comes from. */
    CS.slideMap = function () {
      var rows = [];

      function slotsOf(node, out, seen) {
        if (!node || typeof node !== 'object') return out;
        if (seen.indexOf(node) !== -1) return out;
        seen.push(node);
        ['media', 'media2'].forEach(function (k) {
          if (typeof node[k] === 'string' && out.indexOf(node[k]) === -1) out.push(node[k]);
        });
        /* A GRID CELL NAMES ITS DRAWINGS AS A LIST, not one at a time -
           `medias: ['a','b']` for a row of faces, `fill:` for one filling
           the cell. Without these two lines a drawing used only inside a
           grid is reported as unused, which is the opposite of true and
           exactly the kind of wrong answer that gets a file deleted. */
        if (Array.isArray(node.medias)) {
          node.medias.forEach(function (m) {
            if (typeof m === 'string' && out.indexOf(m) === -1) out.push(m);
          });
        }
        if (typeof node.fill === 'string' && out.indexOf(node.fill) === -1) out.push(node.fill);
        /* A VERDICT IS A STATE, NOT A FILENAME - the slide says 'scrapped'
           and the engine reaches for verdict_scrapped. The map makes the
           same translation, or those drawings look unused. */
        if (typeof node.verdict === 'string' &&
            out.indexOf('verdict_' + node.verdict) === -1) out.push('verdict_' + node.verdict);
        if (typeof node.separator === 'string' && /_img-|_prototype-/.test(node.separator)
            && out.indexOf(node.separator) === -1) out.push(node.separator);
        Object.keys(node).forEach(function (k) { slotsOf(node[k], out, seen); });
        return out;
      }

      /* A slide can point at a NAMED SET of wireframes or diagrams that
         lives elsewhere in content.js, so the slots on screen are not all
         written on the slide's own line. Follow those too. */
      /* THE USE-CASE SLIDE GOES BY TWO NAMES. It was the idea slide until
         27 October and `title-explains` still works, so anything asking
         "is this one of those" has to accept both words. */
      function isUseCase(item) {
        return item.template === 'use-case' || item.template === 'title-explains';
      }

      function expand(item) {
        var parts = [item];
        /* THE MAP FOLLOWS THE SAME NAMES THE SLIDE DOES, which since the
           phases own their own lists means asking CS.pool rather than
           reaching straight into the study. A map that read the study's
           list while the slide read the phase's would report drawings that
           are not on the page and miss the ones that are - and the map is
           what "is this drawing still used?" gets answered with. */
        function poolOf(name) { return CS.pool(name, item); }
        if (item.flows) {
          parts.push(item.flows === true ? poolOf('workflows')
                                         : (poolOf('workflowSets') || {})[item.flows]
                                           || poolOf('workflows'));
        } else if (item.template === 'wireframe' && !item.flows) parts.push(poolOf('workflows'));
        if (item.diagrams) {
          parts.push((poolOf('diagramSets') || {})[item.diagrams] || poolOf('diagrams'));
        } else if (item.template === 'backend') parts.push(poolOf('diagrams'));
        /* `views: 5` means five drawings whose names are not written down
           anywhere - they follow from the count. The map works them out
           the same way the slide does. */
        if (item.views > 1 || (item.views === 1 && !item.media)) {
          CS.viewSlots(item.slotBase || item.copy || '', item.views,
                       CS.viewKind(item.template))
            .forEach(function (name) { parts.push({ media: name }); });
        }

        /* A FLOW CHART'S DRAWINGS ARE NOT WRITTEN DOWN EITHER - one per
           step, named after the step. Same rule as `views`, same reason
           for the map to work them out the same way the slide does. */
        if (item.steps && item.template === 'flow-chart') {
          CS.flowSlots(item.slotBase || item.copy || '', item.steps)
            .forEach(function (name) { parts.push({ media: name }); });
        }

        /* A SLIDE NAMES ITS USER GROUPS, and the drawings live on the
           study's `userGroups` list rather than on the slide - so the map
           has to follow the names across to find them. */
        if (item.groups || isUseCase(item)) {
          var all = CS.pool('userGroups', item) || [];
          var want = Array.isArray(item.groups)
            ? item.groups : all.map(function (g) { return g.id; });
          want.forEach(function (id) {
            all.forEach(function (g) { if (g.id === id) parts.push(g); });
          });
        }
        if (item.template === 'persona') parts.push(CS.pool('personas', item));
        return parts;
      }

      /* The App Landscape is ONE scrolling section made of several slides.
         Each piece is numbered as its own slide, because that is what its
         pictures are named after. */
      function flatten(list) {
        var out = [];
        (list || []).forEach(function (item) {
          if (!item.group) { out.push(item); return; }
          if (item.logo) out.push(Object.assign({}, item.logo, { label: item.label || 'The app landscape' }));
          (item.kingdom || []).forEach(function (k) { if (!k.separator) out.push(k); });
        });
        return out;
      }

      function add(prefix, list) {
        var n = 0;
        (list || []).forEach(function (item) {
          n++;
          var name = prefix + ' ' + (n < 10 ? '0' + n : n);
          rows.push({
            slide: name,
            what: item.label || (copy[item.copy] && copy[item.copy].label) || '—',
            layout: item.template || (item.group ? 'group: ' + item.group : '—'),
            slots: slotsOf(expand(item), [], []).sort().join(', ') || '—'
          });
        });
      }

      add('story   ', data.story);
      add('nutshell', flatten(data.nutshell));
      Object.keys(data.drawers || {}).forEach(function (k, i) {
        rows.push({
          slide: 'drawer   ' + (i + 1),
          what: (copy[data.drawers[k].copy] && copy[data.drawers[k].copy].title) || k,
          layout: 'drawer',
          slots: slotsOf(data.drawers[k], [], []).sort().join(', ') || '—'
        });
      });

      if (window.console && console.table) console.table(rows);
      return rows;
    };

    /* ---------- a way to check your own work ----------
       Open the console on a case study and type

           CS.copyGaps()

       and it lists every copy key a slide asks for that copy.js does not
       have, and every block in copy.js that no slide asks for. The first
       list is things that will render empty; the second is usually a
       renamed slide, or words you have finished with. */
    CS.copyGaps = function () {
      var asked = [], spare = [];
      (function collect(n, seen) {
        if (!n || typeof n !== 'object' || seen.indexOf(n) !== -1) return;
        seen.push(n);
        if (typeof n.copy === 'string' && asked.indexOf(n.copy) === -1) asked.push(n.copy);
        Object.keys(n).forEach(function (k) { collect(n[k], seen); });
      })(data, []);
      var missing = asked.filter(function (k) { return !copy[k]; });
      Object.keys(copy).forEach(function (k) {
        if (k === 'meta' || k === 'captions' || k === 'labels' ||
            k === 'questions') return;
        if (asked.indexOf(k) === -1) spare.push(k);
      });
      console.log('asked for but not in copy.js:', missing.length ? missing : 'none');
      console.log('in copy.js but nothing asks for it:', spare.length ? spare : 'none');
      return { missing: missing, unused: spare };
    };
  };
})(window.CS);

