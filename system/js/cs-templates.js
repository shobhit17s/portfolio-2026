/* cs-templates.js — the slide templates, as components.

   Every template from the layout specs is a function here. It is handed a
   slide's DATA and returns a finished slide. It knows the shape of that
   template and nothing else: not what this case study is about, not what its
   pictures are called, not a single word of its copy.

   A case study's content.js says, for each slide, which template to use and
   what goes in its slots. Add a template here and every case study can use
   it; write a slide there and no code changes at all.

   THE SLOTS A TEMPLATE CAN ASK FOR
     title / title2      a section title, with an optional eyebrow above it
     body / body2        running copy: a string, or a list of strings
     media / media2      a named media slot — see cs-prototype.js
     caption             the line under a picture
     impact              a large statement
     stage               tiles, a flow, or anything else built by a helper
   A template uses the ones it needs and ignores the rest. */
window.CS = window.CS || {};
(function (CS) {
  'use strict';

  /* ---------- small builders ---------- */

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.innerHTML = text;
    return n;
  }

  function title(text, opts) {
    opts = opts || {};
    var h = el('h2', 'cs-section-title ' + (opts.slot || 'cs-sec-1-title'));
    if (opts.eyebrow) {
      h.appendChild(el('span', 'cs-meta cs-eyebrow', opts.eyebrow));
    }
    h.insertAdjacentHTML('beforeend', text);
    return h;
  }

  /* Copy arrives as one string or as several paragraphs. Either way it comes
     out as a block that can be placed. */
  function body(content, slotClass, extraClass) {
    var wrap = el('div', 'cs-body ' + slotClass + (extraClass ? ' ' + extraClass : ''));
    (Array.isArray(content) ? content : [content]).forEach(function (part) {
      if (part && part.kind) { wrap.appendChild(piece(part)); return; }
      wrap.appendChild(el('p', null, part));
    });
    return wrap;
  }

  /* the few richer things a body can hold */
  function piece(p) {
    if (p.kind === 'quote') return el('p', 'cs-quote', p.text);
    if (p.kind === 'drawer') {
      var b = el('button', 'cs-dig', p.text);
      b.type = 'button';
      b.dataset.csDrawer = p.drawer;
      return b;
    }
    /* Two lists, same shape, different mark in front of each line:
         questions  opens each line with a ?, for things not yet answered
         points     opens each line with a small dash, for things settled -
                    a learning is a conclusion, not an open question, and a
                    row of question marks in front of them says the opposite */
    if (p.kind === 'questions' || p.kind === 'points' || p.kind === 'numbers') {
      /* 'numbers' is the third of the same list: a sequence, where the order
         is part of the meaning. It is the only one drawn as an <ol>, because
         a screen reader should announce "one of two" rather than read a
         bullet that happens to look like a digit. */
      var ordered = p.kind === 'numbers';
      var ul = el(ordered ? 'ol' : 'ul', 'cs-questions' +
        (p.kind === 'points' ? ' cs-questions--points' : '') +
        (ordered ? ' cs-questions--numbers' : '') +
        (p.wide ? ' cs-questions--wide' : ''));
      p.items.forEach(function (q) { ul.appendChild(el('li', null, q)); });
      return ul;
    }
    if (p.kind === 'flow') return flow(p);
    if (p.kind === 'tiles') return tiles(p);
    if (p.kind === 'note') return el('p', 'cs-meta', p.text);
    return el('p', null, String(p));
  }

  function flow(p) {
    var wrap = el('div', 'cs-flow' + (p.stacked ? ' cs-flow--stacked' : ''));
    p.steps.forEach(function (step, i) {
      if (i) wrap.appendChild(el('span', 'cs-flow-arrow'));
      var box = el('div', 'cs-flow-step' + (step.quiet ? ' cs-flow-step--quiet' : ''));
      box.setAttribute('data-cs-stroke', '24');
      if (step.label) box.appendChild(el('p', 'cs-meta', step.label));
      box.appendChild(el('p', 'cs-body', step.text));
      if (step.note) box.appendChild(el('p', 'cs-meta', step.note));
      wrap.appendChild(box);
    });
    return wrap;
  }

  /* A row of tiles. Two shapes come out of the same function:

       no `value`  the tile opens with an empty drawn circle - a placeholder
                   mark, used where the tile names a force or a theme
       a `value`   the circle is replaced by the figure itself, set large,
                   because on a results slide the number IS the point

     A tile with figures also gets a `unit` under the number (per month, out
     of 5) so the figure can stay short. */
  function tiles(p) {
    var hasFigures = p.items.some(function (t) { return t.value; });
    var ul = el('ul', 'cs-tiles cs-tiles--static' +
      (hasFigures ? ' cs-tiles--figures' : ''));
    p.items.forEach(function (t) {
      var li = el('li', 'cs-tile');
      li.setAttribute('data-cs-stroke', '24');
      if (t.value) {
        var fig = el('span', 'cs-tile-figure');
        fig.appendChild(el('span', 'cs-tile-value', t.value));
        if (t.unit) fig.appendChild(el('span', 'cs-tile-unit', t.unit));
        li.appendChild(fig);
      } else {
        li.appendChild(el('span', 'cs-tile-mark'));
      }
      li.appendChild(el('span', 'cs-tile-label', t.label));
      if (t.note) li.appendChild(el('span', 'cs-tile-note', t.note));
      ul.appendChild(li);
    });
    return ul;
  }

  /* A media slot. What fills it is the case study's business, not the
     template's — the template only decides where it sits. */
  function slot(name, extraClass) {
    var node = CS.PrototypeEmbed.create(name, CS.PrototypeEmbed.lookup(name));
    if (extraClass) node.className += ' ' + extraClass;
    return node;
  }

  function stage(content, extraClass) {
    var s = el('div', 'cs-stage' + (extraClass ? ' ' + extraClass : ''));
    s.appendChild(content);
    return s;
  }

  function caption(text) { return el('p', 'cs-caption', text); }

  function draftMark(d) {
    var n = el('p', 'cs-meta cs-draft', typeof d === 'string' ? d : 'draft copy');
    return n;
  }

  /* ---------- the templates ---------- */
  /* Each returns an array of children; the renderer puts them in the slide. */

  var T = {

    /* #1 — hero */
    'hero': function (d) {
      var out = [];
      var h1 = el('h1', 'cs-hero-title', d.title);
      if (d.subtitle) h1.appendChild(el('span', 'cs-hero-sub', d.subtitle));
      out.push(h1);
      /* Spec #1 puts a long horizontal illustration here, between the title
         and the body, as an ornamental separator. It is OUT for now: without
         a real drawing to cut it from, the stencil showed as a flat grey
         slab. Put a drawn separator in assets.css and this line comes back. */
      if (d.lead) out.push(el('p', 'cs-lead cs-hero-lead', d.lead));
      if (d.tags) {
        var ul = el('ul', 'cs-hero-tags');
        d.tags.forEach(function (t) {
          var li = el('li', 'cs-tag', t);
          li.setAttribute('data-cs-stroke', '');
          ul.appendChild(li);
        });
        out.push(ul);
      }
      if (d.artwork) out.push(el('div', 'cs-hero-image cs-art ' + d.artwork));
      else if (d.media) out.push(slot(d.media, 'cs-hero-image'));
      /* The long horizontal drawing along the bottom of the slide, which
         spec #1 uses as an ornamental separator between the title block and
         everything that follows. It was taken out once because it had no
         drawing behind it and showed as a flat grey slab; it is back as a
         proper named slot, so with no drawing it is a labelled placeholder
         and with one it is the drawing. Leave `separator` out and the row
         simply stands empty. */
      if (d.separator) out.push(slot(d.separator, 'cs-hero-rule-slot'));
      return out;
    },

    /* #2.1 — a picture, two sections beside it
       #2.3 — the same, with a picture where the second body would be */
    'context-2': function (d) {
      var out = [slot(d.media, 'cs-context-figure')];
      out.push(title(d.title, { eyebrow: d.eyebrow }));
      out.push(body(d.body, 'cs-sec-1-body'));
      out.push(title(d.title2, { slot: 'cs-sec-2-title' }));
      out.push(d.media2 ? slot(d.media2, 'cs-sec-2-body')
                        : body(d.body2, 'cs-sec-2-body'));
      return out;
    },

    /* #2.2 — a picture, one section beside it */
    'context-1': function (d) {
      return [
        slot(d.media, 'cs-context-figure'),
        title(d.title, { eyebrow: d.eyebrow }),
        body(d.body, 'cs-sec-1-body')
      ];
    },

    /* #3.1 — section title, picture, caption */
    'title-figure-caption': function (d) {
      return [
        title(d.title, { eyebrow: d.eyebrow }),
        stage(d.stage ? piece(d.stage) : slot(d.media), d.band ? 'cs-stage--band' : ''),
        caption(d.caption || '')
      ];
    },

    /* #3.2 — picture and caption, no title */
    'figure': function (d) {
      return [slot(d.media), caption(d.caption || '')];
    },

    /* #3.3 — section title and picture, no caption */
    'title-figure': function (d) {
      return [
        title(d.title, { eyebrow: d.eyebrow }),
        stage(d.stage ? piece(d.stage) : slot(d.media), d.band ? 'cs-stage--band' : '')
      ];
    },

    /* #3.4 — section title, then a statement, then a picture.
       Three bands down the slide: the title on one row, the statement across
       two (centred in its own space, as the spec asks), and the picture on
       the remaining five. Use it where a single sentence is the finding and
       the picture is the evidence for it. */
    'title-impact-figure': function (d) {
      return [
        title(d.title, { eyebrow: d.eyebrow }),
        el('p', 'cs-impact', d.impact),
        stage(d.stage ? piece(d.stage) : slot(d.media), d.band ? 'cs-stage--band' : '')
      ];
    },

    /* #4.1 and #4.2 — two sections, stacked, nothing else. The second
       section is optional: leave `title2` out and the slide is one section
       with the whole height to itself, rather than one section and an empty
       space where the other one would have been. */
    'sections': function (d) {
      var out = [
        title(d.title, { eyebrow: d.eyebrow }),
        d.media ? slot(d.media, 'cs-sec-1-body')
                : body(d.body, 'cs-sec-1-body', d.split ? 'cs-split' : '')
      ];
      if (d.title2 || d.body2 || d.media2) {
        out.push(title(d.title2, { slot: 'cs-sec-2-title' }));
        out.push(d.media2 ? slot(d.media2, 'cs-sec-2-body')
                          : body(d.body2, 'cs-sec-2-body', d.split2 ? 'cs-split' : ''));
      }
      return out;
    },

    /* #5.1 — impact text with a small mark */
    'impact-text': function (d) {
      var out = [];
      if (d.media) out.push(slot(d.media, 'cs-impact-mark'));
      out.push(el('p', 'cs-impact', d.impact));
      if (d.caption) out.push(caption(d.caption));
      return out;
    },

    /* #5.2 — impact text over a picture */
    'impact-bg': function (d) {
      return [slot(d.media), el('p', 'cs-impact', d.impact)];
    },

    /* #10.1 — slide strip: picture and caption */
    'strip-figure': function (d) {
      return [slot(d.media), caption(d.caption || '')];
    },

    /* #10.2 — slide strip: a heading with either one statement under it, or
       a diagram. The statement is the usual case; `stage` is for a short
       chain or a row of tiles that reads better as a band across the page
       than as a full slide. */
    'strip-text': function (d) {
      var out = [];
      if (d.title) out.push(title(d.title));
      out.push(d.stage ? stage(piece(d.stage)) : el('p', 'cs-impact', d.impact));
      return out;
    },

    /* #10.3 — the way back. A strip at the very end of a case study: one
       drawing, and the whole thing is the control. Pressing anywhere on it
       returns the reader to the worlds, landing on the planet the case
       studies belong to rather than at the top of the page.

       It is an <a>, not a strip with a button somewhere inside it, for two
       reasons: the whole band is the target, which is the easiest thing in
       the world to hit; and it goes somewhere, so it should behave like
       every other link - open in a new tab on a middle click, show its
       destination in the status bar, be reachable by keyboard without
       anything being wired up. */
    'strip-back': function (d) {
      var a = el('a', 'cs-strip-back');
      a.href = d.href || '../../index.html#hw-world-work';
      a.setAttribute('aria-label', d.label || 'Back to the worlds');
      a.appendChild(slot(d.media));
      a.appendChild(el('span', 'cs-strip-back-label',
        (d.text || 'back to the worlds') +
        ' <span class="cs-strip-back-arrow" aria-hidden="true">&rarr;</span>'));
      return [a];
    },

    /* #6 — the interactive persona slide. Built empty here; cs-carousels.js
       fills it from the study's people. */
    'persona': function () {
      var carousel = el('div', 'cs-persona-carousel');
      carousel.appendChild(arrowButton('prev', 'Previous person', 'cs-persona-step cs-persona-step--prev'));
      var stageEl = el('div', 'cs-persona-stage');
      stageEl.appendChild(el('p', 'cs-persona-name'));
      carousel.appendChild(stageEl);
      carousel.appendChild(arrowButton('next', 'Next person', 'cs-persona-step cs-persona-step--next'));
      var pager = el('div', 'cs-pager');
      pager.appendChild(arrowButton('prev', 'Previous person'));
      pager.appendChild(el('span', null, 'swipe the people'));
      pager.appendChild(arrowButton('next', 'Next person'));
      carousel.appendChild(pager);

      var tabs = el('div', 'cs-tiles');
      tabs.setAttribute('role', 'tablist');
      tabs.setAttribute('aria-label', 'What to read about this person');

      return [carousel, tabs, title('', { slot: 'cs-sec-1-title' }), el('p', 'cs-body cs-sec-1-body')];
    },

    /* #7 — the app logo slide */
    'logo': function (d) {
      var out = [el('div', 'cs-logo-flow')];
      out[0].setAttribute('aria-hidden', 'true');
      (d.tiles || ['START tile', 'AUTH tile']).forEach(function (t, i) {
        var tile = el('p', 'cs-flow-tile cs-flow-tile--' + (i === 0 ? 'start' : 'auth'), t);
        tile.setAttribute('data-cs-stroke', '28');
        out.push(tile);
      });
      var row = el('div', 'cs-logo-row');
      row.appendChild(arrowButton('prev', 'Previous app', 'cs-logo-step--prev'));
      var box = slot(d.media, 'cs-logo-box');
      box.setAttribute('data-cs-stroke', '48');
      row.appendChild(box);
      row.appendChild(arrowButton('next', 'Next app', 'cs-logo-step--next'));
      out.push(row);
      return out;
    },

    /* #8 — the wireframe slide. Empty; cs-carousels.js fills it.

       A case study can have more than one of these, so each names the set of
       workflows it shows. `flows: 'ideation'` picks the set called ideation
       out of `workflowSets` in content.js; saying nothing picks the study's
       plain `workflows` list. The name is written onto the tab panel, which
       is where cs-carousels.js looks for it. */
    'wireframe': function (d) {
      return wireframeSlide(d, controlPanel(true));
    },

    /* #3.5 — the same carousel, with a section title where the tab panel
       would be. Use it where the slide shows ONE set of screens: a row of a
       single tab says less than a heading does. */
    'title-wireframe': function (d) {
      return wireframeSlide(d, title((d && d.title) || '', { eyebrow: d && d.eyebrow }));
    },

    /* #11 — NEW. A switchable diagram on the left, a section on the right.

       WHY THIS IS NOT ONE OF THE EXISTING TEMPLATES

       The spec sheet for this slide asks for two things at once that no
       existing template puts together: the tab-and-stage mechanism of the
       backend slide (#9), which is full-width, and the writing column of the
       context templates (#2.x), which have a still picture on the left. It
       is #9 squeezed into seven columns with #2.2's section beside it.

       Rather than bolt a right-hand column onto #9 and have every other
       backend slide inherit it, this is its own template. It reuses #9's
       PARTS - the same tab panel, the same diagram stage, the same caption -
       so cs-carousels.js fills it with the same code, and the study names
       its pair of diagrams the same way it names a set of wireframes. */
    'toggle-figure-section': function (d) {
      var panel = el('div', 'cs-control-panel');
      var tabs = el('div', 'cs-tab-panel');
      tabs.setAttribute('role', 'tablist');
      tabs.setAttribute('aria-label', d.tabsLabel || 'Diagrams');
      panel.appendChild(tabs);

      var stageEl = el('div', 'cs-diagram-stage');
      /* which set of diagrams this slide shows; empty means the study's
         plain `diagrams` list, exactly as with wireframe sets */
      stageEl.dataset.csDiagrams = d.diagrams || '';

      return [
        panel,
        stageEl,
        caption(d.caption || ''),
        title(d.title, { eyebrow: d.eyebrow }),
        body(d.body, 'cs-sec-1-body')
      ];
    },

    /* #9 — the backend diagram slide. Empty; cs-carousels.js fills it. */
    'backend': function () {
      var panel = el('div', 'cs-control-panel');
      panel.appendChild(el('div', 'cs-toggle-panel'));
      var stageEl = el('div', 'cs-diagram-stage');
      stageEl.dataset.csDiagrams = '';      // the study's plain `diagrams` list
      return [panel, stageEl, caption('')];
    }
  };

  /* ---------- pieces the templates share ---------- */

  function arrowButton(dir, label, extra) {
    var b = el('button', 'cs-arrow cs-arrow--' + dir + (extra ? ' ' + extra : ''));
    b.type = 'button';
    b.setAttribute('aria-label', label);
    var mark = el('span', 'cs-arrow-mark');
    mark.setAttribute('aria-hidden', 'true');
    b.appendChild(mark);
    return b;
  }

  function controlPanel(withSecondary) {
    var panel = el('div', 'cs-control-panel');
    var tabs = el('div', 'cs-tab-panel');
    tabs.setAttribute('role', 'tablist');
    tabs.setAttribute('aria-label', 'Workflows');
    panel.appendChild(tabs);
    if (withSecondary) {
      panel.appendChild(el('div', 'cs-separator'));
      var right = el('div', 'cs-right-controls');
      panel.appendChild(right);
    }
    return panel;
  }

  /* #8 and #3.5 differ in one row and nothing else, so they are built by one
     function that is handed whatever goes in that row. */
  function wireframeSlide(d, topRow) {
    d = d || {};
    var st = wireStage();
    /* Which set of screens this slide shows. It is written on the stage
       rather than on the tab panel, because #3.5 has no tab panel. */
    st.dataset.csFlows = d.flows || '';
    return [
      topRow,
      arrowButton('prev', 'Previous screen', 'cs-step cs-step--prev'),
      st,
      arrowButton('next', 'Next screen', 'cs-step cs-step--next'),
      caption('')
    ];
  }

  function wireStage() {
    var s = el('div', 'cs-wire-stage');
    var pager = el('div', 'cs-pager');
    pager.appendChild(arrowButton('prev', 'Previous screen', 'cs-pager-prev'));
    pager.appendChild(el('span', 'cs-pager-label', '1 / 1'));
    pager.appendChild(arrowButton('next', 'Next screen', 'cs-pager-next'));
    s.appendChild(pager);
    return s;
  }

  CS.templates = {
    /* every template the system knows, by name */
    registry: T,
    /* the helpers a case study's content can reach through `stage` */
    piece: piece,
    slot: slot,
    arrowButton: arrowButton,
    controlPanel: controlPanel,
    names: function () { return Object.keys(T); }
  };
})(window.CS);


