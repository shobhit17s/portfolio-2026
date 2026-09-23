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
    document.querySelectorAll('.t-wireframe, .t-title-wireframe').forEach(buildWireframe);
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
      if (pagerLabel) pagerLabel.textContent = (index + 1) + ' / ' + flow.shots.length;
    }

    function step(d) {
      index = (index + d + flow.shots.length) % flow.shots.length;
      show();
    }

    if (panel) CS.makeTabs(panel, flows, function (w) { flow = w; index = 0; show(); });
    slide.querySelectorAll('.cs-step--prev, .cs-pager-prev').forEach(function (b) {
      b.addEventListener('click', function () { step(-1); });
    });
    slide.querySelectorAll('.cs-step--next, .cs-pager-next').forEach(function (b) {
      b.addEventListener('click', function () { step(1); });
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

  /* ---------- the persona slide ---------- */
  CS.initPersonas = function () {
    var slide = document.querySelector('.t-persona');
    if (!slide) return;
    var people = data().personas || [];
    var tileNames = data().tiles || [];
    if (!people.length) return;

    var stage = slide.querySelector('.cs-persona-stage');
    var nameEl = slide.querySelector('.cs-persona-name');
    var tabs = slide.querySelector('.cs-tiles');
    var title = slide.querySelector('.cs-sec-1-title');
    var bodyEl = slide.querySelector('.cs-sec-1-body');

    var shot = document.createElement('div');
    shot.className = 'cs-slot';
    stage.insertBefore(shot, stage.firstChild);

    /* the four things you can read about a person */
    tileNames.forEach(function (label, j) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'cs-tile';
      b.setAttribute('role', 'tab');
      b.setAttribute('data-cs-stroke', '');
      b.setAttribute('aria-selected', j === 0 ? 'true' : 'false');
      var mark = document.createElement('span');
      mark.className = 'cs-tile-mark';
      var text = document.createElement('span');
      text.className = 'cs-tile-label';
      text.textContent = label;
      b.append(mark, text);
      b.addEventListener('click', function () { tile = j; show(); });
      tabs.appendChild(b);
    });

    var who = 0, tile = 0;

    function show() {
      var p = people[who];
      fill(shot, p.media);
      /* the name sits centred under the picture, so it wears the sub-heading
         role rather than a section title, which carries a rule down one side */
      nameEl.innerHTML = '<span class="cs-sub-title">' + p.name +
        '</span><br><span class="cs-meta">' + p.meta + '</span>';
      tabs.querySelectorAll('.cs-tile').forEach(function (t, j) {
        t.setAttribute('aria-selected', j === tile ? 'true' : 'false');
      });
      title.innerHTML = tileNames[tile] || '';
      bodyEl.innerHTML = p.panels[tile] || '';
    }

    slide.querySelectorAll('.cs-persona-step, .cs-pager .cs-arrow').forEach(function (b) {
      b.addEventListener('click', function () {
        var back = b.classList.contains('cs-arrow--prev');
        who = (who + (back ? -1 : 1) + people.length) % people.length;
        show();
      });
    });
    show();
  };
})(window.CS);


