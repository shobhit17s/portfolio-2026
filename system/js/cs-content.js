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
  function walk(node, copy, seen) {
    if (!node || typeof node !== 'object') return;
    if (seen.indexOf(node) !== -1) return;
    seen.push(node);

    if (Array.isArray(node)) {
      node.forEach(function (item) { walk(item, copy, seen); });
      return;
    }

    /* 1 - by key */
    if (typeof node.copy === 'string') {
      var block = copy[node.copy];
      if (block && typeof block === 'object' && !Array.isArray(block)) fill(node, block);
      else if (block === undefined) {
        console.warn('[case study] copy.js has no block called "' + node.copy + '"');
      }
    }

    /* 2 - by the picture it belongs to */
    if (typeof node.media === 'string' && node.caption === undefined &&
        copy.captions && copy.captions[node.media] !== undefined) {
      node.caption = copy.captions[node.media];
    }

    /* 2b - the same rule again for the question above a stepped diagram.
       A question belongs to the diagram that answers it, exactly as a
       caption belongs to the picture it describes. */
    if (typeof node.media === 'string' && node.question === undefined &&
        copy.questions && copy.questions[node.media] !== undefined) {
      node.question = copy.questions[node.media];
    }

    /* 3 - by the thing it names */
    if (typeof node.id === 'string' && node.label === undefined &&
        copy.labels && copy.labels[node.id] !== undefined) {
      node.label = copy.labels[node.id];
    }

    Object.keys(node).forEach(function (k) { walk(node[k], copy, seen); });
  }

  /* Run once, from cs-main.js, before CS.render(). */
  CS.assembleContent = function () {
    var data = CS.CASE_STUDY;
    if (!data) return;

    var copy = CS.COPY || {};
    data.meta = fill(data.meta || {}, copy.meta);
    walk(data, copy, []);

    /* The pictures. A study that keeps its own `media` map inside content.js
       still works; otherwise media.js is where the engine looks. */
    if (!data.media && CS.MEDIA) data.media = CS.MEDIA;

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
        if (typeof node.separator === 'string' && /_img-|_prototype-/.test(node.separator)
            && out.indexOf(node.separator) === -1) out.push(node.separator);
        Object.keys(node).forEach(function (k) { slotsOf(node[k], out, seen); });
        return out;
      }

      /* A slide can point at a NAMED SET of wireframes or diagrams that
         lives elsewhere in content.js, so the slots on screen are not all
         written on the slide's own line. Follow those too. */
      function expand(item) {
        var parts = [item];
        if (item.flows) {
          parts.push(item.flows === true ? data.workflows
                                         : (data.workflowSets || {})[item.flows] || data.workflows);
        } else if (item.template === 'wireframe' && !item.flows) parts.push(data.workflows);
        if (item.diagrams) {
          parts.push((data.diagramSets || {})[item.diagrams] || data.diagrams);
        } else if (item.template === 'backend') parts.push(data.diagrams);
        if (item.template === 'persona') parts.push(data.personas);
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


