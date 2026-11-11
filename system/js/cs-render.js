/* cs-render.js — builds a case study page out of a case study's data.

   This is the only file that turns data into a page. Hand it CS.CASE_STUDY
   and it produces both views: "in a nutshell" and "the detailed story".

   It knows the SHAPE every case study shares — two views, slides in wrappers,
   an App Landscape grouping — and nothing about any particular one. Two case
   studies with completely different stories run through this same file
   unchanged; only their content.js differs. */
window.CS = window.CS || {};
(function (CS) {
  'use strict';

  /* Templates that are a strip rather than a full slide. */
  var STRIPS = { 'strip-figure': 1, 'strip-text': 1, 'strip-back': 1,
                 'strip-section': 1, 'strip-transition': 1,
                 /* the chapter mark with motion in its letters: its band is
                    1840 x 490, which is a strip's content box exactly */
                 'chapter-name-graphics': 1,
                 /* case study 2's chapter headings and its closing band:
                    four rows tall, like every other strip */
                 'rule-title': 1, 'title-body-rule': 1 };

  function el(tag, cls) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    return n;
  }

  /* One slide: the wrapper the parallax moves, the frame that sets its width,
     and the slide itself carrying its template's class. */
  function buildSlide(def, id, label) {
    /* A TEMPLATE MAY HAVE BEEN RENAMED since this content.js was written.
       Resolving the name here, once, means the rest of the page - the
       builder, the slide's class, the stylesheet - only ever sees the
       current name. See ALIASES in cs-templates.js. */
    var name = CS.templates.realName ? CS.templates.realName(def.template)
                                     : def.template;
    var build = CS.templates.registry[name];
    if (!build) {
      console.warn('[case study] no such template: ' + def.template);
      return null;
    }

    var slide = el('div', 'cs-slide ' +
      (STRIPS[name] ? 'cs-slide--strip ' : '') + 't-' + name);
    if (id) slide.id = id;

    if (def.draft) slide.appendChild(draft(def.draft));
    build(def).forEach(function (node) { if (node) slide.appendChild(node); });
    return slide;
  }

  function draft(d) {
    var n = el('p', 'cs-meta cs-draft');
    n.textContent = typeof d === 'string' ? d : 'draft copy';
    return n;
  }

  function wrap(slide, id, label) {
    var section = el('section', 'cs-slide-wrapper');
    if (id) section.id = id;
    if (label) section.setAttribute('aria-label', label);
    var frame = el('div', 'cs-slide-frame');
    frame.appendChild(slide);
    section.appendChild(frame);
    return section;
  }

  /* The App Landscape: a logo slide with a line of flow running down into a
     Kingdom of the Apps, with separators between its pieces. */
  function buildLandscape(def) {
    var landscape = el('div', 'cs-app-landscape');
    landscape.setAttribute('data-cs-stroke', '40');

    var logo = buildSlide(def.logo, def.logo.id || 'cs-slide-logo');
    if (logo) landscape.appendChild(logo);

    var kingdom = el('div', 'cs-kingdom');
    kingdom.setAttribute('data-cs-stroke', '28');
    (def.kingdom || []).forEach(function (item) {
      if (item.separator) {
        var sep = el('div', 'cs-kingdom-sep cs-kingdom-sep--' + item.separator);
        sep.setAttribute('aria-hidden', 'true');
        kingdom.appendChild(sep);
        return;
      }
      var s = buildSlide(item, item.id || ('cs-slide-' + item.template));
      if (s) kingdom.appendChild(s);
    });
    landscape.appendChild(kingdom);
    return landscape;
  }

  /* ---------------------------------------------------------------------
     THE TAB SERIES - a block of the story that comes in two or more
     versions, from the sheet of 29 October.
     ---------------------------------------------------------------------

     WHAT IT IS. Somewhere in the middle of case study 2 the story forks:
     the same shape of work happened in Phase 1 and again in Phase 3, and
     the reader chooses which one to read. It is NOT a slide with tabs on
     it - it is a whole RUN of slides that swaps for another whole run.

     THE SHAPE, as the sheet draws it:

         ┌──────────────────────────────────────────────┐
         │  [ Phase 1 ]  [ Phase 3 ]   <- the bar, which│  the parent
         ├──────────────────────────────────────────────┤  container
         │  slide                                       │
         │  slide        <- the chosen tab's own series │
         │  slide                                       │
         └──────────────────────────────────────────────┘

     ONE CHILD PER TAB, and only one of them is ever on the page at a time.
     The others are not hidden with `display: none` and left in place -
     they are taken OUT, which matters: a hidden slide still has drawn
     outlines to keep in step and a parallax position to calculate, and a
     page that quietly does that work for twenty slides nobody is looking
     at gets slow for no reason anybody can see.

     HOW TO WRITE ONE, in content.js, as one entry in the `story` list:

         { group: 'tab-series', id: 'cs-phases', label: 'The two phases',
           tabs: [
             { label: 'Phase 1', slides: [ … ordinary slide lines … ] },
             { label: 'Phase 3', slides: [ … ] }
           ] }

     Each slide inside `slides` is written exactly as a slide anywhere else
     is written. There is nothing special about being inside a tab. */
  function buildTabSeries(def) {
    var section = el('section', 'cs-tab-series');
    section.id = def.id || 'cs-tab-series';

    /* =================================================================
       ONE TAB IS NOT A CHOICE, SO THERE IS NO BAR
       =================================================================
       A chapter written with a single tab draws no bar at all, and its
       one run of slides simply carries on down the page as if the
       chapter were not there.

       THIS IS THE SAME DECISION THE VIEW TABS ALREADY MAKE. A study with
       no `nutshell` list gets no "In a nutshell / The detailed story"
       bar, because a tab bar with one tab in it asks the reader to
       choose between one thing - which reads as something half-built
       rather than as something deliberate.

       WHY THE CHAPTER IS STILL BUILT. The section, the body and the pane
       are all still here, holding the phase exactly where it has always
       been. So putting the second phase back is ONE WORD in content.js -
       its name back in the `tabs` list - and the bar returns with it,
       with nothing else to remember.

       THE SPACING COMES OUT THE SAME. `.cs-tab-series-pane` and
       `.cs-view` carry the identical gap, so with the bar gone the
       phase's slides sit in the outer story's own rhythm and no seam
       shows. That is measured, not assumed - see the note in
       cs-layout.css.

       NO `aria-label` EITHER, in that case. "Choose which to read" on a
       section with nothing to choose between is a label that lies to
       whoever is listening rather than looking. */
    var choice = (def.tabs || []).length > 1;
    if (choice) section.setAttribute('aria-label', def.label || 'Choose which to read');
    else section.className += ' cs-tab-series--single';

    /* THE BAR. It is the site's own control panel, in its quiet dress -
       the same one the feedback slide wears, for the same reason: these
       tabs are a way through the story, not the subject of it. The buttons
       themselves are put in by cs-tabseries.js, which also does the
       switching; this file only makes the places they go. */
    if (choice) {
      var bar = el('div', 'cs-tab-series-bar');
      var panel = el('div', 'cs-control-panel cs-control-panel--quiet');
      /* `--keep` IS WHAT STOPS IT BECOMING A DROPDOWN ON A PHONE. Every
         other tab bar on the site collapses into one control below 820;
         this one does not, because it follows the reader down the whole
         chapter and a choice that is already in front of you should not
         have to be opened to be seen. See cs-panels.js. */
      var tabs = el('div', 'cs-tab-panel cs-tab-panel--fill cs-tab-panel--keep');
      tabs.setAttribute('aria-label', def.label || 'Choose which to read');
      panel.appendChild(tabs);
      bar.appendChild(panel);
      section.appendChild(bar);
    }

    var body = el('div', 'cs-tab-series-body');
    (def.tabs || []).forEach(function (tab, i) {
      var pane = el('div', 'cs-tab-series-pane');
      pane.dataset.csTabIndex = i;
      /* WHICH PHASE THIS PANE HOLDS, written on the pane itself.

         Everything wired AFTER the page is built - the carousels, the
         drawer - holds an element and nothing else. This is how such a
         thing finds out which phase it is in, and therefore whose lists it
         is entitled to read. See CS.pool in cs-content.js.

         The templates do not need it: they are handed the slide's own line
         out of content.js, which already carries `copyIn`. */
      if (tab.id) pane.dataset.csPhase = tab.id;

      /* A PHASE WHOSE FILE DID NOT LOAD SAYS SO, in its own pane, naming
         the file. A blank chapter would look like a chapter with nothing
         in it yet, which is a different and much less fixable problem. */
      if (tab.missing) {
        var note = el('p', 'cs-meta cs-tab-series-missing');
        note.textContent = tab.missing + '/content.js did not load';
        pane.appendChild(note);
        body.appendChild(pane);
        return;
      }

      /* NUMBERED WITHIN ITS OWN TAB. "3 of 7" means three of the seven in
         THIS phase, which is the only count a reader of one phase can
         check against what they can see. */
      pane.appendChild(buildView(tab.slides || [], { numbered: true }));
      body.appendChild(pane);
    });
    section.appendChild(body);

    /* the labels travel on the element rather than in an attribute, the
       same way the feedback slide's tabs do - see cs-templates.js */
    section.csTabLabels = (def.tabs || []).map(function (t, i) {
      return { label: t.label || t.missing || ('Part ' + (i + 1)) };
    });
    return section;
  }

  /* One view's worth of slides.

     A slide marked `hidden: true` in the content file is skipped completely:
     it is not drawn, and it is not counted, so the numbering reads straight
     through as if it were never written. Nothing is deleted, so putting it
     back is a matter of removing that one word. */
  function buildView(list, opts) {
    var frag = document.createDocumentFragment();
    var n = 0;
    list = list.filter(function (i) { return !i.hidden; });
    var total = list.filter(function (i) { return !i.group; }).length;

    list.forEach(function (item) {
      if (item.group === 'tab-series') {
        /* IT IS NOT COUNTED as one of the story's slides, because it is not
           one - it is a container for a run of them, and each run does its
           own counting inside itself. */
        frag.appendChild(buildTabSeries(item));
        return;
      }

      if (item.group === 'app-landscape') {
        var section = el('section', 'cs-slide-wrapper');
        section.id = item.id || 'cs-slide-landscape';
        section.setAttribute('aria-label', item.label || 'The app landscape');
        var frame = el('div', 'cs-slide-frame');
        frame.appendChild(buildLandscape(item));
        section.appendChild(frame);
        frag.appendChild(section);
        return;
      }

      n++;
      var id = item.id || (opts.numbered ? 'cs-slide-' + n : null);
      var label = item.label ||
        (opts.numbered ? 'Slide ' + n + ' of ' + total : null);
      var slide = buildSlide(item, id ? id : null);
      if (!slide) return;
      /* the wrapper carries the id the deep links point at */
      frag.appendChild(wrap(slide, id, label));
      if (id) slide.removeAttribute('id');
    });
    return frag;
  }

  CS.render = function () {
    var data = CS.CASE_STUDY;
    if (!data) { console.warn('[case study] no content loaded'); return; }

    /* the two view containers are the only markup index.html has to provide */
    /* Some pages are one view, not two — the open primer behind the pantheon
       has no "in a nutshell" half. A case study says so by leaving `nutshell`
       out of its data, and the tab bar takes itself away. */
    var single = !data.nutshell || !data.nutshell.length;
    if (single) document.body.classList.add('cs-single-view');

    var nutshell = document.getElementById('cs-view-nutshell');
    var story = document.getElementById('cs-view-story');
    if (nutshell) {
      nutshell.textContent = '';
      nutshell.appendChild(buildView(data.nutshell || [], { numbered: false }));
    }
    if (story) {
      story.textContent = '';
      story.appendChild(buildView(data.story || [], { numbered: true }));
    }

    /* ---- WHAT THIS CASE STUDY IS CALLED ----
       The catalogue wins. common/catalogue.js is the list the landing page
       builds its cards from, so a study named there is named on its card,
       on the password screen, in the strip along the top of this page and
       in the browser tab - one entry, four places, nothing left to go
       stale.

       `meta.title` in this study's own copy.js is the fallback, for a study
       that is not in the catalogue at all. The big hero title on slide 1 is
       a different thing and stays in copy.js, so it can be longer or
       phrased differently from the name on the card. */
    var listed = (window.SITE && SITE.studyNamed)
      ? SITE.studyNamed(data.meta.id) : null;
    var pageName = (listed && listed.name) || data.meta.title;

    var topTitle = document.getElementById('cs-topbar-title');
    if (topTitle) topTitle.textContent = pageName;
    var back = document.getElementById('cs-back');
    if (back) {
      back.href = data.meta.backHref;
      back.textContent = '← ' + data.meta.backLabel;
    }
    document.title = pageName;

    /* the note beside the view tabs is per-study, because the number of
       slides is */
    CS.VIEW_NOTES = {
      nutshell: data.meta.nutshellNote || 'Two pieces.',
      story: data.meta.storyNote ||
        ((data.story || []).length + ' slides, in order.')
    };
  };
})(window.CS);

