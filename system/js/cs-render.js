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
  var STRIPS = { 'strip-figure': 1, 'strip-text': 1, 'strip-back': 1 };

  function el(tag, cls) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    return n;
  }

  /* One slide: the wrapper the parallax moves, the frame that sets its width,
     and the slide itself carrying its template's class. */
  function buildSlide(def, id, label) {
    var build = CS.templates.registry[def.template];
    if (!build) {
      console.warn('[case study] no such template: ' + def.template);
      return null;
    }

    var slide = el('div', 'cs-slide ' +
      (STRIPS[def.template] ? 'cs-slide--strip ' : '') + 't-' + def.template);
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

    /* the bits of chrome that carry the study's own words */
    var topTitle = document.getElementById('cs-topbar-title');
    if (topTitle) topTitle.textContent = data.meta.title;
    var back = document.getElementById('cs-back');
    if (back) {
      back.href = data.meta.backHref;
      back.textContent = '← ' + data.meta.backLabel;
    }
    document.title = data.meta.title;

    /* the note beside the view tabs is per-study, because the number of
       slides is */
    CS.VIEW_NOTES = {
      nutshell: data.meta.nutshellNote || 'Two pieces.',
      story: data.meta.storyNote ||
        ((data.story || []).length + ' slides, in order.')
    };
  };
})(window.CS);


