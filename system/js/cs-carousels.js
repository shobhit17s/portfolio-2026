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

  /* ---------- the wireframe slide: tabs pick a workflow ----------
     A case study may have SEVERAL of these - one showing the shipped
     workflows, another showing rounds of ideation - so this wires up every
     one on the page rather than the first it finds. Each slide's tab panel
     carries the name of the set it shows (see the `wireframe` template);
     an empty name means the study's plain `workflows` list. */
  CS.initWireframes = function () {
    document.querySelectorAll('.t-wireframe, .t-title-wireframe, .t-title-steps').forEach(buildWireframe);
  };

  function buildWireframe(slide) {
    var stage = slide.querySelector('.cs-wire-stage');
    var panel = slide.querySelector('.cs-tab-panel');   /* absent on a titled slide */
    var setName = (stage && stage.dataset.csFlows) || '';
    var sets = data().workflowSets || {};
    var flows = setName ? (sets[setName] || []) : (data().workflows || []);
    if (!flows.length) return;

    var caption = slide.querySelector('.cs-caption');
    var pagerLabel = slide.querySelector('.cs-pager-label');
    var right = slide.querySelector('.cs-right-controls');
    /* The question band above the stage, on the slides that have one
       (template #13). A shot can carry a `question` as well as a caption:
       the question is what the diagram under it answers, and it changes as
       you step. Slides without the band simply never find it. */
    var question = slide.querySelector('[data-cs-question]');

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

    /* the one slot the carousel keeps and refills */
    var shot = document.createElement('div');
    shot.className = 'cs-slot cs-wire-figure';
    stage.insertBefore(shot, stage.firstChild);

    var flow = flows[0], index = 0;

    function show() {
      var s = flow.shots[index];
      fill(shot, s.media);
      /* innerHTML, not textContent: captions are written in content.js the
         same way every other line of copy is, with entities like &mdash;
         spelled out. textContent would print those letters literally. */
      caption.innerHTML = s.caption || '';
      if (question) question.innerHTML = s.question || '';
      if (pagerLabel) pagerLabel.textContent = (index + 1) + ' / ' + flow.shots.length;
    }

    function step(d) {
      index = (index + d + flow.shots.length) % flow.shots.length;
      show();
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
      flow = w; index = 0; show(); if (auto) auto.bump();
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
  CS.initDiagrams = function () {
    document.querySelectorAll('.cs-diagram-stage').forEach(buildDiagrams);
  };

  function buildDiagrams(stage) {
    var slide = stage.closest('.cs-slide') || stage.parentNode;
    var setName = stage.dataset.csDiagrams || '';
    var sets = data().diagramSets || {};
    var list = setName ? (sets[setName] || []) : (data().diagrams || []);
    if (!list.length) return;

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
  CS.initPersonas = function () {
    var slide = document.querySelector('.t-persona');
    if (!slide) return;
    var people = data().personas || [];
    if (!people.length) return;

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

    var shot = document.createElement('div');
    shot.className = 'cs-slot';
    stage.insertBefore(shot, stage.firstChild);

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
      if (!scroller) return;
      scroller.textContent = '';
      sectionsOf(p).forEach(function (sec) {
        var el = document.createElement('section');
        el.className = 'cs-persona-sec';

        if (sec.heading) {
          var h = document.createElement('h3');
          h.className = 'cs-persona-sec-title';
          h.innerHTML = sec.heading;
          el.appendChild(h);
        }

        if (sec.picture) {
          var fig = document.createElement('div');
          fig.className = 'cs-slot cs-persona-sec-figure';
          el.appendChild(fig);
          scroller.appendChild(el);
          /* square, full width - the slot's own machinery draws the named
             empty box at exactly the size the drawing will take */
          fill(fig, p.media2 || (p.copy || 'this-person') + '_picture');
          return;
        }

        if (sec.body !== undefined && sec.body !== '') {
          var b = document.createElement('div');
          b.className = 'cs-body cs-persona-sec-body';

          /* A SECTION'S BODY IS WRITTEN THE SAME WAY AS ANY OTHER BODY on
             the site, so there is one vocabulary to learn rather than two:

                 body: 'one paragraph'
                 body: ['first paragraph', 'second paragraph']
                 body: [{ kind: 'points',  items: ['…', '…'] }]   bullets
                 body: [{ kind: 'numbers', items: ['…', '…'] }]   numbered
                 body: [{ kind: 'quote',   text: '…' }]

             Anything with a `kind` goes through the same builder the slide
             templates use, so a bulleted list in a person's panel is the
             same object as a bulleted list anywhere else. */
          var parts = Array.isArray(sec.body) ? sec.body : [sec.body];
          var piece = CS.templates && CS.templates.piece;
          parts.forEach(function (part) {
            if (part && part.kind && piece) { b.appendChild(piece(part)); return; }
            var para = document.createElement('p');
            /* innerHTML, not textContent: copy is written with entities like
               &mdash; spelled out */
            para.innerHTML = part;
            b.appendChild(para);
          });
          el.appendChild(b);
        }
        scroller.appendChild(el);
      });
    }

    function show() {
      var p = people[who];
      fill(shot, p.media);

      /* The light behind this person. The STAGE carries it rather than the
         picture, because the picture is torn down and rebuilt on every
         change and an attribute on it would have to be set again each time
         from inside the slot machinery. The stage is the one thing here
         that stays put. CSS turns the name into a colour; this only has to
         know which name. */
      if (p.glow) stage.setAttribute('data-glow', p.glow);
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
      who = (who + d + people.length) % people.length;
      show();
    }

    /* This one changes WORDS as well as a picture, so being half way through
       the panel is as good a reason not to move on as studying the drawing. */
    var auto = CS.autoplay && CS.autoplay.attach({
      root: slide,
      hover: [slide.querySelector('.cs-persona-carousel'), scroller],
      pager: slide.querySelector('.cs-pager'),
      count: function () { return people.length; },
      step: function () { go(1); },
      name: 'people'
    });

    slide.querySelectorAll('.cs-persona-step, .cs-pager .cs-arrow').forEach(function (b) {
      b.addEventListener('click', function () {
        go(b.classList.contains('cs-arrow--prev') ? -1 : 1);
        if (auto) auto.bump();
      });
    });
    show();
  };
})(window.CS);


