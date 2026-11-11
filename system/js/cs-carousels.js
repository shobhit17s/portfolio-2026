/* cs-carousels.js — the three components that step through things.

   All three follow the same shape: something picks a set, something steps
   through that set, and what is shown decides the caption. None of them know
   anything about a particular case study — they read CS.CASE_STUDY and fill
   whatever the renderer has already put on the page.

   Every picture they show goes through PrototypeEmbed, so a workflow screen
   can just as easily be a running prototype as a still. */
window.CS = window.CS || {};
(function (CS) {
  'use strict';

  function data() { return CS.CASE_STUDY || {}; }

  function fill(node, name) {
    CS.PrototypeEmbed.fill(node, name, CS.PrototypeEmbed.lookup(name));
  }

  /* =======================================================================
     THE REEL - how a carousel changes its picture
     =======================================================================

     THREE PICTURES ARE ALIVE AT ONCE: the one before, the one showing, and
     the one after. They sit side by side on a strip inside a window that
     only shows the middle one.

         |  prev  |  ACTIVE  |  next  |
                  ^^^^^^^^^^
                  the window

     PRESSING NEXT SLIDES THE WHOLE STRIP ONE PLACE LEFT. The one showing
     leaves to the left and its successor arrives from the right, and
     because they are on the same strip they move TOGETHER - which is what
     makes it read as travel rather than as a picture being replaced.

     WHEN THE MOTION HAS PLAYED OUT the strip is re-labelled rather than
     moved back: the cell that has just scrolled off the left is lifted to
     the far right, the strip is snapped back one place with no animation,
     and that recycled cell is filled with the NEW successor. Nothing the
     eye can see changes at that moment - the picture now showing is
     already in the window - and the next press has its neighbours ready.

     So each step costs exactly ONE picture: the far neighbour. The two you
     can reach are always already loaded, which is the whole reason a step
     feels immediate.

     INERTIA, IN TWO LAYERS. The strip itself decelerates hard - it leaves
     quickly and takes its time settling, which is how something with
     weight moves. On top of that each picture LAGS INSIDE ITS OWN CELL at
     the start and catches up slightly after the strip has stopped, the way
     a thing being carried swings behind the hand carrying it. The lag is
     inside the cell, so nothing ever shows past the edge of the window.

     WHY NOT AN OVERSHOOT. A strip that overshoots its mark would pull the
     far edge of the window past the last picture on it and show a slice of
     nothing for a moment. The lag gives the same sense of weight with
     nothing to go wrong.

     THE CELLS ARE SPACED APART, and the reason is worth knowing because it
     is not what you would guess. Laid edge to edge, the two neighbours sat
     EXACTLY outside the window - measured, to the pixel - and you could
     still see a sliver of each of them. What was showing was not the cell
     but its HAND-DRAWN OUTLINE: a drawn line is painted a few pixels
     outside the box it belongs to, which is what makes it look drawn
     rather than printed. Six pixels on one side, three on the other.

     The lag above makes it worse for a moment: at the instant a move
     begins, every picture shifts a little the way the strip is about to
     travel, and the neighbour waiting on that side shifts INTO the window.

     So there is a gap between the cells, wide enough to swallow both - the
     bleed and the lag - and the strip travels one cell PLUS one gap each
     time. Which is why the positions below are arithmetic rather than
     round numbers. */
  var REEL_MS = 620;        /* the strip's own travel */

  /* where the strip sits for each of the three states it can be in */
  var REEL_AT = {
    prev:   'translate3d(0, 0, 0)',
    rest:   'translate3d(calc(-100% - var(--cs-reel-gap)), 0, 0)',
    next:   'translate3d(calc(-200% - 2 * var(--cs-reel-gap)), 0, 0)'
  };

  /* This file had no element helper of its own - everything it built, it
     built two lines at a time. The reel builds eight, so it gets one. */
  function el(tag, cls) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    return n;
  }

  function reduced() {
    return window.matchMedia &&
           window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function makeReel(opts) {
    var count = opts.count;
    var mediaAt = opts.mediaAt;             /* index -> slot name */
    var cellClass = opts.cellClass || 'cs-slot';

    var view = el('div', 'cs-reel' + (opts.className ? ' ' + opts.className : ''));
    var track = el('div', 'cs-reel-track');
    var cells = [];
    for (var i = 0; i < 3; i++) {
      var cell = el('div', 'cs-reel-cell');
      var slot = el('div', cellClass);
      cell.appendChild(slot);
      track.appendChild(cell);
      cells.push(cell);
    }
    view.appendChild(track);

    var index = 0, busy = false;

    function wrap(i) { return ((i % count) + count) % count; }
    function slotOf(cell) { return cell.firstElementChild; }

    /* the strip, with no animation, showing the middle cell */
    function settle() {
      track.style.transition = 'none';
      track.style.transform = REEL_AT.rest;
      /* read a layout value so the browser applies that before the
         transition is handed back - without this the snap animates */
      void track.offsetWidth;
      track.style.transition = '';
    }

    /* everything, from scratch. Used once at the start and whenever the
       whole set changes under us - a different tab, a different person. */
    function reset(i) {
      index = wrap(i);
      fill(slotOf(cells[0]), mediaAt(wrap(index - 1)));
      fill(slotOf(cells[1]), mediaAt(index));
      fill(slotOf(cells[2]), mediaAt(wrap(index + 1)));
      settle();
    }

    function go(dir, done) {
      if (busy) return false;
      if (count < 2) return false;

      if (reduced()) { reset(index + dir); if (done) done(index); return true; }

      busy = true;
      track.style.setProperty('--cs-reel-dir', dir > 0 ? '1' : '-1');
      track.classList.add('is-moving', 'is-lagging');
      /* the pictures start displaced the way the strip is about to travel,
         then catch up - see the note above */
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { track.classList.remove('is-lagging'); });
      });
      track.style.transform = dir > 0 ? REEL_AT.next : REEL_AT.prev;

      var over = false;
      function finish() {
        if (over) return;
        over = true;
        clearTimeout(guard);
        track.removeEventListener('transitionend', onEnd);
        track.classList.remove('is-moving');

        /* RE-LABEL RATHER THAN MOVE BACK. The cell that has just left the
           window is lifted round to the far side and refilled, and the
           strip is snapped one place so the picture now showing stays
           exactly where it is. */
        if (dir > 0) {
          var first = cells.shift();
          track.appendChild(first);
          cells.push(first);
          index = wrap(index + 1);
          settle();
          fill(slotOf(cells[2]), mediaAt(wrap(index + 1)));
        } else {
          var last = cells.pop();
          track.insertBefore(last, track.firstChild);
          cells.unshift(last);
          index = wrap(index - 1);
          settle();
          fill(slotOf(cells[0]), mediaAt(wrap(index - 1)));
        }
        busy = false;
        if (done) done(index);
      }
      function onEnd(e) { if (e.target === track && e.propertyName === 'transform') finish(); }
      track.addEventListener('transitionend', onEnd);
      /* a transition on an element that is off screen, or in a tab that is
         not showing, may never report that it ended - so the strip is never
         left half way */
      var guard = setTimeout(finish, REEL_MS + 400);
      return true;
    }

    return {
      node: view,
      reset: reset,
      go: go,
      /* a different tab is a different set of diagrams, and may be a
         different number of them */
      setCount: function (n) { count = n; },
      at: function () { return index; },
      busy: function () { return busy; },
      /* the picture showing, for anything that needs to reach into it */
      active: function () { return slotOf(cells[1]); }
    };
  }

  /* ---------- the wireframe slide: tabs pick a workflow ----------
     A case study may have SEVERAL of these - one showing the shipped
     workflows, another showing rounds of ideation - so this wires up every
     one on the page rather than the first it finds. Each slide's tab panel
     carries the name of the set it shows (see the `wireframe` template);
     an empty name means the study's plain `workflows` list. */
  /* `root` IS AN OPTIONAL PIECE OF THE PAGE TO WIRE, and it exists because
     of the tab series: it puts a run of slides on the page long after
     everything else has been wired, and those slides need the same
     treatment - but ONLY those slides. Calling this over the whole page a
     second time wires everything twice, and a thing wired twice does its
     job twice: two play buttons in one counter, two listeners on one
     arrow. Left out, it means the whole page, which is what boot() wants. */
  CS.initWireframes = function (root) {
    (root || document).querySelectorAll('.t-wireframe, .t-title-wireframe, .t-title-steps, .t-use-case, .t-feedback-detail')
      .forEach(buildWireframe);
  };

  /* A step's writing, in the same vocabulary as every other body on the
     site: a string, a list of strings, or anything with a `kind`. */
  function paintBody(node, content, slot) {
    node.textContent = '';
    /* NOTHING WRITTEN FOR THIS STEP YET. An empty panel is a filled box with
       nothing in it, which reads as a fault rather than as a gap - so it
       says what it is waiting for, the same way an empty picture box names
       the drawing it wants. Write the key it names into `bodies` in copy.js
       and the note is replaced by the writing. */
    if (content === undefined || content === '') {
      if (slot) {
        var note = document.createElement('p');
        note.className = 'cs-meta';
        note.textContent = 'bodies \u2192 ' + slot;
        node.appendChild(note);
      }
      return;
    }
    var piece = CS.templates && CS.templates.piece;
    (Array.isArray(content) ? content : [content]).forEach(function (part) {
      if (part && part.kind && piece) { node.appendChild(piece(part)); return; }
      var para = document.createElement('p');
      /* innerHTML, not textContent: copy is written with entities spelled out */
      para.innerHTML = part;
      node.appendChild(para);
    });

    /* THE WRITING JUST CHANGED, so whether this column needs a scrollbar
       may have changed with it - one step's paragraph fits and the next
       one's does not. See cs-scrollers.js. */
    if (CS.remeasureScrollers) CS.remeasureScrollers(node.parentNode || node);
  }

  function buildWireframe(slide) {
    var stage = slide.querySelector('.cs-wire-stage');
    var panel = slide.querySelector('.cs-tab-panel');   /* absent on a titled slide */
    var setName = (stage && stage.dataset.csFlows) || '';
    /* ASKED OF THE SLIDE RATHER THAN OF THE STUDY. A slide inside a phase
       reads that phase's own `workflowSets`; one in the outer story reads
       the study's. See CS.pool in cs-content.js for why the phase's list is
       not merged with the study's but replaces it. */
    var pool = (CS.pool ? CS.pool('workflowSets', slide) : data().workflowSets) || {};
    var plain = (CS.pool ? CS.pool('workflows', slide) : data().workflows) || [];
    var sets = pool;
    var flows = setName ? (sets[setName] || []) : plain;

    /* A SET THAT WAS NAMED AND NOT FOUND USED TO SAY NOTHING. The slide
       simply fell through to the plain `workflows` list, and if there was
       not one of those the carousel drew itself with a single empty box and
       a counter reading "1 of 1" - a slide that looks built and is not.

       Now it says which name it was given and which file should hold it.
       The file is the phase's where the slide is in a phase, which is the
       only answer that tells you where to go and type. */
    if (setName && !flows.length) {
      var where = 'content.js';
      var pane = slide.closest && slide.closest('[data-cs-phase]');
      if (pane && pane.dataset.csPhase) where = pane.dataset.csPhase + '/content.js';
      if (window.console && console.warn) {
        console.warn('[case study] no set of diagrams called "' + setName +
          '" - write `workflowSets: { \'' + setName + '\': [ ... ] }` into ' +
          where + ', or give the slide `views: <how many>` instead.');
      }
    }

    /* A SLIDE CAN SAY HOW MANY DRAWINGS IT HAS RATHER THAN LIST THEM.
       `views: 5` on its line means five, named from the slide - see
       CS.viewSlots in cs-content.js. There is nothing to look up and
       nothing to keep in step: the count IS the list. */
    if (!flows.length && stage && stage.dataset.csViews) {
      var n = parseInt(stage.dataset.csViews, 10) || 0;
      var base = stage.dataset.csBase || '';
      /* EACH VIEW CAN HAVE ITS OWN NAME - the line under the drawing on the
         use-case slide, from the sheet of 29 October. The list is handed
         over on the stage itself by the template; a slide that does not
         give one simply has none, and a slide that ASKED for one (it named
         a copy key) but has not written them yet says which block it is
         waiting for rather than showing a blank line. */
      var titles = (stage.csViewTitles || []);
      var titleKey = stage.dataset.csTitlesKey || '';
      if (n > 0 && base) {
        /* THE DRAWINGS ARE WORKED OUT HERE, SO THEIR WORDS MUST BE TOO.

           A shot written out by hand in `workflowSets` was handed its
           question and its body at start-up, by the copy walk, because it
           was there to be found. These four are not written down anywhere
           - the count is the list - so they are built in this line, long
           after that walk finished, and used to arrive carrying a name and
           nothing else. The pictures appeared and the question above them
           and the writing beside them did not.

           CS.shotWords applies the same rule the walk applies, out of the
           same copy.js, so a drawing's words are found whichever way the
           slide asked for the drawing. A phase's slide reads that phase's
           own words - hence the phase id. */
        var phase = slide.closest && slide.closest('[data-cs-phase]');
        var phaseId = phase ? phase.dataset.csPhase : '';
        flows = [{ id: base, shots: CS.viewSlots(base, n).map(function (name, i) {
          var shot = CS.shotWords
            ? CS.shotWords({ media: name }, phaseId)
            : { media: name };
          /* A TITLE THE SLIDE WROTE WINS over a caption filed under the
             drawing, because `viewTitles` is the more specific instruction
             - it was written for this slide, in this order. */
          if (titles[i] !== undefined) shot.caption = titles[i];
          else if (shot.caption === undefined && titleKey) {
            shot.caption = 'viewTitles \u2192 ' + titleKey;
          }
          return shot;
        }) }];
      }
    }

    if (!flows.length) return;

    var caption = slide.querySelector('.cs-caption');
    var pagerLabel = slide.querySelector('.cs-pager-label');
    var right = slide.querySelector('.cs-right-controls');
    /* The question band above the stage, on the slides that have one
       (template #13). A shot can carry a `question` as well as a caption:
       the question is what the diagram under it answers, and it changes as
       you step. Slides without the band simply never find it. */
    var question = slide.querySelector('[data-cs-question]');

    /* DOES THIS SLIDE WANT QUESTIONS AT ALL?

       MY FIRST ANSWER WAS "IF ANY OF ITS DRAWINGS HAS ONE", and that was
       wrong in the one case that matters. If all four questions are filed
       under slightly the wrong name, none of them is found, so the slide
       decides it never wanted questions and says nothing - which is
       exactly the silence this note is meant to break.

       THE BAND ITSELF IS THE ANSWER. The element only exists on a slide
       built to show a question above the diagram, so a slide that has one
       is asking for questions by definition. Found or not found is then a
       fact about the copy, not about the slide.

       AND THERE IS A WAY TO SAY NO, in the idiom the rest of the site
       already uses for this exact distinction - `title: null` is a heading
       deliberately not wanted, `media: null` a drawing deliberately not
       wanted. Here it is

           questions: false

       on the slide's line in content.js: no questions on this slide, on
       purpose, and the band stays empty with nothing asked for. A decision
       and a to-do are different things, and only you can say which it is. */
    var wantsQuestions = !(stage && stage.dataset.csNoQuestions);

    /* The column of writing beside the diagram, on the slides that have one
       (`split: true` on the slide's line). Like the question, it belongs to
       the diagram rather than to the slide, so it is written per step in
       copy.js and refilled as you step. Slides without it never find it. */
    var stepBody = slide.querySelector('[data-cs-step-body]');

    /* The secondary control beside the tabs, if this study asked for one.
       It belongs to the study's main workflow slide, not to every wireframe
       slide on the page - an ideation carousel has no workflow to view. */
    var action = setName ? null : data().workflowAction;
    if (right && action) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'cs-button cs-button--secondary';
      b.textContent = action.label;
      b.setAttribute('data-cs-stroke', '');
      if (action.drawer) b.dataset.csDrawer = action.drawer;
      right.appendChild(b);
    }

    var flow = flows[0], index = 0;

    /* THE STRIP OF DIAGRAMS. Three alive at once; see makeReel above. */
    var reel = makeReel({
      count: flow.shots.length,
      cellClass: 'cs-slot cs-wire-figure',
      mediaAt: function (i) { return flow.shots[i] && flow.shots[i].media; }
    });
    stage.insertBefore(reel.node, stage.firstChild);

    /* THE WORDS THAT BELONG TO A DIAGRAM - its question, the writing beside
       it, the counter. These are NOT on the strip: they are in their own
       places on the slide, so they change at the moment the strip settles
       rather than travelling with it. */
    function words() {
      var s = flow.shots[index] || {};
      /* innerHTML, not textContent: captions are written in content.js the
         same way every other line of copy is, with entities like &mdash;
         spelled out. textContent would print those letters literally. */
      /* NOT EVERY STEPPED SLIDE HAS A CAPTION UNDER IT. The idea slides do
         not - the writing beside the diagram says what it is - and this
         line used to assume one was always there, which is a crash waiting
         for the first slide that goes without. */
      if (caption) caption.innerHTML = s.caption || '';
      /* THE QUESTION ABOVE THE DIAGRAM, or a note saying which block it is
         waiting for. It used to go silently blank, which is the one thing
         nothing else on this site does: an empty picture box names its
         file, an empty panel names its `bodies` key, and this said
         nothing at all. So a question filed under the wrong name looked
         identical to a slide that never wanted one - which is exactly the
         gap somebody fell into.

         ONLY WHERE A QUESTION IS EXPECTED. A stepped slide whose drawings
         have no questions is a perfectly ordinary slide, so the note
         appears only once ANY drawing on this slide has one; then a gap in
         the set is a gap rather than a decision. */
      if (question) {
        if (s.question) {
          question.innerHTML = s.question;
          question.classList.remove('cs-meta');
        } else if (wantsQuestions && s.media) {
          question.textContent = 'questions \u2192 ' + s.media;
          question.classList.add('cs-meta');
        } else {
          question.innerHTML = '';
          question.classList.remove('cs-meta');
        }
      }
      if (stepBody) paintBody(stepBody, s.body, s.media);
      if (pagerLabel) pagerLabel.textContent = (index + 1) + ' / ' + flow.shots.length;
    }

    /* start from scratch: a different tab, or the first draw */
    function show() {
      reel.reset(index);
      words();
    }

    function step(d) {
      /* A PRESS WHILE THE STRIP IS STILL TRAVELLING IS IGNORED, and that is
         not laziness. The strip and the counter are two different things
         that have to agree, and a second press half way through the first
         would advance the counter while the strip was still catching up
         with the press before - so the number and the picture would drift
         apart and never come back together. Six hundred milliseconds is
         short enough that nobody is held up and long enough that they
         cannot get out of step. */
      if (reel.busy()) return;

      /* THE COUNTER AND THE QUESTION CHANGE WITH THE STRIP, not after it. A
         counter still saying 1 of 5 while the second diagram slides in is
         the page disagreeing with itself. */
      index = (index + d + flow.shots.length) % flow.shots.length;
      words();
      if (!reel.go(d)) reel.reset(index);
    }

    /* ---- it turns its own pages ----
       Seven seconds a diagram. cs-autoplay.js owns every rule about when it
       must not: under a pointer, while something inside has focus, off
       screen, while a picture is open full size, in a background tab, or for
       a reader who has asked for no motion. All this carousel supplies is
       "here is how to go forward, and here is how many there are". */
    var auto = CS.autoplay && CS.autoplay.attach({
      root: slide,
      /* the picture and the strip under it - NOT the whole slide, which is
         the whole screen */
      hover: [stage],
      pager: slide.querySelector('.cs-pager'),
      count: function () { return flow.shots.length; },
      step: function () { step(1); },
      name: 'diagrams'
    });
    function manual(d) { step(d); if (auto) auto.bump(); }

    if (panel) CS.makeTabs(panel, flows, function (w) {
      flow = w; index = 0;
      reel.setCount(flow.shots.length);
      show();
      if (auto) auto.bump();
    });
    slide.querySelectorAll('.cs-step--prev, .cs-pager-prev').forEach(function (b) {
      b.addEventListener('click', function () { manual(-1); });
    });
    slide.querySelectorAll('.cs-step--next, .cs-pager-next').forEach(function (b) {
      b.addEventListener('click', function () { manual(1); });
    });
    show();
  }

  /* ---------- switchable diagrams ----------

     One control picks one of several drawings and the caption follows it.
     Two templates use this now - the full-width backend slide (#9) and the
     half-width one with a section beside it (#11) - so this wires up every
     diagram stage on the page rather than the first one it finds, exactly
     as the wireframe carousels do.

     Each stage says which SET of diagrams it shows. An empty name means the
     study's plain `diagrams` list; a name picks that entry out of
     `diagramSets` in content.js.

     The control is whatever the template put above the stage: a row of tabs
     where the choice is between two readings of the same thing, or a pair of
     toggles where it is a switch. Neither template has to say which - the
     panel that is there decides. */
  CS.initDiagrams = function (root) {
    (root || document).querySelectorAll('.cs-diagram-stage').forEach(buildDiagrams);
  };

  function buildDiagrams(stage) {
    var slide = stage.closest('.cs-slide') || stage.parentNode;
    var setName = stage.dataset.csDiagrams || '';
    /* the phase's own sets where this slide is in a phase - see CS.pool */
    var sets = (CS.pool ? CS.pool('diagramSets', stage) : data().diagramSets) || {};
    var list = setName ? (sets[setName] || [])
                       : ((CS.pool ? CS.pool('diagrams', stage) : data().diagrams) || []);
    if (!list.length) {
      /* the same silence the wireframe slide used to keep, and the same
         cure: say which name was given and which file should hold it */
      if (setName && window.console && console.warn) {
        var pane = stage.closest && stage.closest('[data-cs-phase]');
        console.warn('[case study] no set of diagrams called "' + setName +
          '" - write `diagramSets: { \'' + setName + '\': [ ... ] }` into ' +
          (pane && pane.dataset.csPhase ? pane.dataset.csPhase + '/content.js'
                                        : 'content.js') + '.');
      }
      return;
    }

    var tabPanel = slide.querySelector('.cs-tab-panel');
    var togglePanel = slide.querySelector('.cs-toggle-panel');
    var caption = slide.querySelector('.cs-caption');

    var shot = document.createElement('div');
    shot.className = 'cs-slot';
    stage.appendChild(shot);

    function show(d) {
      fill(shot, d.media);
      if (caption) caption.innerHTML = d.caption || '';
    }

    if (tabPanel) CS.makeTabs(tabPanel, list, show);
    else if (togglePanel) CS.makeToggles(togglePanel, list, show);
    show(list[0]);
  }

  /* ---------- the persona slide ----------

     ===========================================================================
     HOW A PERSON IS WRITTEN
     ===========================================================================

     Everything about a person is one block in copy.js, and it is laid out the
     way you would describe them out loud:

         'user-1': {
           name:        'The credit analyst',
           description: 'Primary user · assesses client risk daily',
           sections: [
             { heading: 'Roles & responsibilities', body: '…' },
             { heading: 'Jobs to be done',          body: '…' },
             { heading: 'Collaboration model',      picture: true }
           ]
         }

     TWO THINGS THAT USED TO BE EASY TO GET WRONG, and are not any more:

     1. THE HEADING AND ITS WRITING ARE WRITTEN TOGETHER. They used to be in
        two different places - the headings in one shared list, the paragraphs
        in a `panels` array matched to them BY POSITION. Nothing on the page
        told you that the second string belonged under the second heading, and
        inserting a section silently shifted every paragraph down one.

     2. THE PICTURE SECTION SAYS SO. `picture: true` is the whole of it, and
        the drawing it shows is that person's `media2` in content.js. It used
        to be "whichever section happens to be last", which is a rule you
        cannot see by looking at the file.

     WHICH BLOCK BELONGS TO WHICH PERSON, and in what order they appear, is
     content.js's business - `personas` names a copy block, a portrait and a
     diagram per person. So moving someone to the front of the carousel does
     not touch a word of their writing.

     OLDER STUDIES STILL WORK. A person written the old way - `meta` instead
     of `description`, a flat `panels` array, headings in `study.sections` -
     is read exactly as before. Both shapes are handled below, and neither
     has to know about the other. */
  CS.initPersonas = function (root) {
    var slide = (root || document).querySelector('.t-persona');
    if (!slide) return;
    /* the phase's own people where the slide is in a phase - see CS.pool */
    var people = (CS.pool ? CS.pool('personas', slide) : data().personas) || [];
    if (!people.length) return;

    /* =====================================================================
       ONE PERSON IS NOT A CHOICE, SO THERE IS NOTHING TO STEP THROUGH
       =====================================================================

       A study with one persona used to get the whole carousel anyway: two
       arrows that did nothing, a counter reading "1 / 1", a strip that
       could not travel and a swipe that went nowhere. Every one of those
       invites a press and answers with silence, which reads as broken
       rather than as finished.

       THIS IS THE SAME DECISION THE TAB BAR AND THE VIEW TABS ALREADY
       MAKE. A chapter with one tab draws no bar; a study with no `nutshell`
       gets no "in a nutshell" switch. One of anything is not a choice, and
       a control offering one option asks the reader to choose between one
       thing.

       WHAT IS STILL BUILT: the picture, the name, the description and the
       panel beside it - everything that is ABOUT the person. Only the ways
       through are dropped, so adding a second persona brings them all back
       with nothing else to remember.

       THE CLASS IS WHAT THE STYLESHEET READS, and the wiring below is
       skipped so there is no listener on a button nobody can see. */
    var alone = people.length === 1;
    slide.classList.toggle('cs-persona--single', alone);

    /* The headings written once for everybody, if a study prefers that. A
       person's own `sections` names its own and wins where it does.

       IT IS LOOKED FOR IN TWO PLACES, and the second one is not belt and
       braces. `study` in copy.js is folded onto the case study only if
       content.js asks for it with `copy: 'study'` at the top. A study that
       does not - and two of the three here do not - would silently get no
       headings at all, with nothing on the page to say why. So the shared
       list is read straight out of copy.js as well. */
    var studyCopy = (CS.COPY && CS.COPY.study) || {};
    var shared = data().sections || data().tiles ||
                 studyCopy.sections || studyCopy.tiles || [];

    var stage = slide.querySelector('.cs-persona-stage');
    var nameEl = slide.querySelector('.cs-persona-name');
    var pagerLabel = slide.querySelector('.cs-pager-label');
    var scroller = slide.querySelector('.cs-persona-explains-scroll');

    /* THE PEOPLE TRAVEL ON A STRIP TOO - the same reel the diagrams use,
       so there is one piece of motion on the site rather than two that are
       nearly alike. See makeReel above. */
    var reel = makeReel({
      count: people.length,
      cellClass: 'cs-slot',
      className: 'cs-persona-reel',
      mediaAt: function (i) { return people[i] && people[i].media; }
    });
    stage.insertBefore(reel.node, stage.firstChild);

    var who = 0;

    /* ---- one person's sections, in the shape the panel wants ----
       This is the only place that knows about the old shape, so the rest of
       the file reads one kind of thing. */
    function sectionsOf(p) {
      if (Array.isArray(p.sections)) {
        return p.sections.map(function (sec, i) {
          return {
            heading: sec.heading !== undefined ? sec.heading : (shared[i] || ''),
            body: sec.body,
            picture: !!sec.picture
          };
        });
      }
      /* the old shape: headings shared, bodies by position, and the last
         section is a picture if the person has a second drawing */
      var panels = p.panels || [];
      var out = shared.map(function (h, i) {
        return { heading: h, body: panels[i], picture: false };
      });
      if (p.media2 && out.length) out[out.length - 1].picture = true;
      return out;
    }

    /* ---- the panel is rebuilt for each person ----
       Not refilled. Two people may describe themselves in a different number
       of sections, or put their picture somewhere other than the bottom, and
       a panel built once for the first person could not hold the second. The
       drawing is a different file per person anyway, so nothing is being
       re-fetched that would not have been. */
    function paint(p) {
      /* THE PANEL ITSELF IS NO LONGER BUILT HERE. It is a shared part now -
         see explainsBox / explainsPaint in cs-templates.js - because case
         study 2 wanted the same panel beside an idea rather than beside a
         person. All this still decides is WHICH DRAWING a picture section
         shows, which is the one thing that differs between the two: here it
         is this person's own second drawing. */
      CS.templates.explainsPaint(scroller, sectionsOf(p), function (sec) {
        var name = sec.media || p.media2 || (p.copy || 'this-person') + '_picture';
        /* the same call the slide templates make for every other picture
           box - it builds the box already filled, so there is no second
           step that could be forgotten */
        return CS.templates.slot(name, 'cs-persona-sec-figure');
      });
    }

    function show(dir) {
      var p = people[who];
      /* the portrait travels the way you asked to go; the writing beside
         it changes as the strip settles, because it is not on the strip */
      if (dir) { if (!reel.go(dir)) reel.reset(who); }
      else reel.reset(who);

      /* THE COLOUR THAT BELONGS TO THIS PERSON. It used to light the
         drawing as well as colour the name; the light has been taken out,
         so all it does now is the name - see the note in cs-slides.css.

         `ink` is what to write from now on, because that is what it does.
         `glow` is still read, so no existing study has to be edited.

         The STAGE carries it rather than the picture, because the picture
         is torn down and rebuilt on every change and an attribute on it
         would have to be set again each time from inside the slot
         machinery. The stage is the one thing here that stays put. */
      var tint = p.ink || p.glow;
      if (tint) stage.setAttribute('data-glow', tint);
      else stage.removeAttribute('data-glow');

      /* THE NAME AND THE DESCRIPTION, under the picture. `description` is
         the name this has now; `meta` is what it was called, and is still
         read so an older study is unchanged. */
      var description = p.description !== undefined ? p.description : (p.meta || '');
      nameEl.innerHTML = '<span class="cs-sub-title">' + (p.name || '') + '</span>' +
        (description ? '<br><span class="cs-meta">' + description + '</span>' : '');

      paint(p);

      if (pagerLabel) pagerLabel.textContent = (who + 1) + ' / ' + people.length;
      /* a new person is a new panel: start it at the top rather than wherever
         the last one was left */
      if (scroller) scroller.scrollTop = 0;
    }

    function go(d) {
      /* as on the diagrams: not while the strip is still travelling, or the
         portrait and the name beside it drift apart */
      if (reel.busy()) return;
      who = (who + d + people.length) % people.length;
      show(d);
    }

    /* This one changes WORDS as well as a picture, so being half way through
       the panel is as good a reason not to move on as studying the drawing.

       NOT WIRED AT ALL FOR ONE PERSON. Autoplay on a carousel of one is a
       timer that wakes up for ever to move from the only thing to itself. */
    var auto = !alone && CS.autoplay && CS.autoplay.attach({
      root: slide,
      hover: [slide.querySelector('.cs-persona-carousel'), scroller],
      pager: slide.querySelector('.cs-pager'),
      count: function () { return people.length; },
      step: function () { go(1); },
      name: 'people'
    });

    if (!alone) {
      slide.querySelectorAll('.cs-persona-step, .cs-pager .cs-arrow').forEach(function (b) {
        b.addEventListener('click', function () {
          go(b.classList.contains('cs-arrow--prev') ? -1 : 1);
          if (auto) auto.bump();
        });
      });
    }

    /* ---------- SWIPING, ON A TOUCH SCREEN ----------

       On a phone the click strips either side of the picture are gone - the
       picture is the width of the screen and there is no room for them - so
       the arrows under it were the only way through. Dragging sideways is
       what a hand expects of a row of faces, and it costs one gesture
       instead of an accurate tap on a small target.

       THE WHOLE DIFFICULTY IS NOT STEALING THE PAGE'S SCROLL. A finger on a
       picture is far more often starting to scroll down the case study than
       starting to change persona, and a carousel that grabs every touch
       makes the page feel broken. So nothing is decided on the way down: the
       first move decides. If it is more sideways than vertical by a clear
       margin this is a swipe and the browser is told to stop scrolling; if
       it is not, the touch is abandoned here and the page scrolls exactly as
       it always did.

       `pointerType` keeps a mouse out of it. A mouse already has the arrows
       and the side strips, and a click-drag across a picture is usually a
       person trying to select something. */
    (function swipe() {
      /* nothing to swipe to when there is one person - see `alone` above */
      if (alone) return;
      var carousel = slide.querySelector('.cs-persona-carousel');
      if (!carousel || !window.PointerEvent) return;

      var DECIDE = 12;     /* how far a finger moves before we judge it */
      var TAKE   = 48;     /* how far it must go to count as a swipe */
      var x0 = 0, y0 = 0, id = null, judged = false, mine = false;

      carousel.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'mouse') return;
        id = e.pointerId; x0 = e.clientX; y0 = e.clientY;
        judged = false; mine = false;
      });

      carousel.addEventListener('pointermove', function (e) {
        if (e.pointerId !== id) return;
        var dx = e.clientX - x0, dy = e.clientY - y0;
        if (!judged) {
          if (Math.abs(dx) < DECIDE && Math.abs(dy) < DECIDE) return;
          judged = true;
          /* sideways, and clearly so - 1.4 times further across than down */
          mine = Math.abs(dx) > Math.abs(dy) * 1.4;
          if (mine) {
            carousel.classList.add('is-swiping');
            if (auto) auto.pause();
          } else {
            id = null;                 /* it is a scroll; let go of it */
          }
        }
        /* cancelable is false once the browser has committed to scrolling,
           and calling preventDefault then only logs a warning */
        if (mine && e.cancelable) e.preventDefault();
      }, { passive: false });

      function end(e) {
        if (e.pointerId !== id) return;
        var dx = e.clientX - x0;
        carousel.classList.remove('is-swiping');
        if (mine && Math.abs(dx) > TAKE) {
          /* drag left to bring the NEXT person in from the right, the way a
             deck of cards moves under a thumb */
          go(dx < 0 ? 1 : -1);
        }
        if (auto) { auto.resume(); auto.bump(); }
        id = null; judged = false; mine = false;
      }

      carousel.addEventListener('pointerup', end);
      carousel.addEventListener('pointercancel', function (e) {
        if (e.pointerId !== id) return;
        carousel.classList.remove('is-swiping');
        if (auto) auto.resume();
        id = null; judged = false; mine = false;
      });
    })();

    show();
  };
})(window.CS);

