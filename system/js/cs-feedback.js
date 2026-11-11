/* cs-feedback.js — the tabs on a feedback slide, and the body each one loads.

   =========================================================================
   WHAT THIS FILE IS FOR
   =========================================================================

   The feedback slide has a row of tabs and a body of numbered cards under
   them. Pressing a tab swaps the whole body for that tab's cards.

   THE TEMPLATE BUILDS THE BODY EMPTY on purpose. Which tab's cards belong
   in it is not a decision that can be made while the slide is being built -
   it changes every time somebody presses a tab - so the filling is ONE job
   in ONE place rather than once in the template and again on every press.
   Two places that fill the same box is how the second one ends up subtly
   different from the first.

   =========================================================================
   WHAT IT DOES NOT DO
   =========================================================================

   IT DOES NOT BUILD THE TAB BAR. That is CS.makeTabs in cs-panels.js, which
   the whole site already uses - and it brings with it the two behaviours
   that are easy to forget and painful to rebuild: more tabs than fit move
   into a "+2" menu rather than squashing until none can be read, and on a
   phone the row becomes a dropdown showing the chosen one.

   IT DOES NOT DECIDE WHETHER THE BODY SCROLLS. cs-scrollers.js measures
   that, here as everywhere else. This file only tells it to measure again
   after a tab has changed the contents. */
window.CS = window.CS || {};
(function (CS) {
  'use strict';

  function el(tag, cls) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    return n;
  }

  /* ---------- one numbered card ----------
     The bubble is OPTIONAL. A card with no `number` is a plain card, which
     is a reasonable thing to want and costs nothing to allow. */
  function card(spec) {
    var box = el('div', 'cs-fb-card');
    if (spec && spec.number !== undefined && spec.number !== '') {
      /* NO DRAWN OUTLINE ON A NUMBER. Every drawn line on this site is
         drawn afresh, with its own wobble - which is what makes it look
         drawn, and which on something as small as a two-digit bubble made
         every one of them look a slightly different size. The numbers are
         a column you read DOWN; they have to be the same. So the number is
         just the number. */
      var n = el('div', 'cs-fb-num');
      n.innerHTML = String(spec.number);
      box.appendChild(n);
    }
    var text = el('div', 'cs-fb-text');
    text.setAttribute('data-cs-stroke', '22');
    var body = spec ? spec.body : undefined;
    var piece = CS.templates && CS.templates.piece;
    (Array.isArray(body) ? body : [body]).forEach(function (part) {
      if (part === undefined || part === null || part === '') return;
      if (part && part.kind && piece) { text.appendChild(piece(part)); return; }
      var para = document.createElement('p');
      /* innerHTML, not textContent: copy is written with entities like
         &mdash; spelled out, and textContent would print those letters */
      para.innerHTML = part;
      text.appendChild(para);
    });
    box.appendChild(text);
    return box;
  }

  /* ---------- the rows of one tab ----------

     TWO WAYS TO SAY THE SAME THING, and `rows` wins when both are given:

         rows:  [[a, b], [c]]   the rows written out, for an uneven one
         cards: [a, b, c, d]    a flat list, dealt into rows of `perRow`

     The flat list is the one to prefer and the one the manual recommends:
     adding a card to it is adding a line, where adding one to `rows` means
     rebalancing brackets by hand. */
  function rowsOf(tab) {
    if (tab && tab.rows && tab.rows.length) return tab.rows;
    var cards = (tab && tab.cards) || [];
    var per = Math.max(1, parseInt((tab && tab.perRow) || 2, 10) || 2);
    var out = [];
    for (var i = 0; i < cards.length; i += per) {
      out.push(cards.slice(i, i + per));
    }
    return out;
  }

  function paint(body, tab) {
    body.textContent = '';
    var rows = rowsOf(tab);

    /* NOTHING WRITTEN FOR THIS TAB YET SAYS SO. An empty box under a tab
       reads as a fault - as though pressing the tab broke something -
       rather than as writing that has not been done. Every empty slot on
       this site names what it is waiting for; this one does too. */
    if (!rows.length) {
      var note = el('p', 'cs-meta cs-feedback-empty');
      note.textContent = 'cards → ' + ((tab && tab.label) || 'this tab');
      body.appendChild(note);
      return;
    }

    rows.forEach(function (row) {
      var r = el('div', 'cs-feedback-row');
      /* the row is told how many it holds, so the cards share the width
         equally even on a short last row - a lone card on the last row
         stretching to full width while the ones above are half reads as a
         mistake rather than as a fact about the writing */
      r.style.setProperty('--cs-fb-per-row',
        Math.max(1, (tab && tab.rows) ? row.length
                                      : parseInt((tab && tab.perRow) || 2, 10) || 2));
      (row || []).forEach(function (c) { r.appendChild(card(c)); });
      body.appendChild(r);
    });
  }

  CS.initFeedback = function (root) {
    var slides = (root || document).querySelectorAll('.t-feedback');
    for (var i = 0; i < slides.length; i++) {
      (function (slide) {
        var body = slide.querySelector('.cs-feedback-body');
        var panel = slide.querySelector('.cs-tab-panel');
        if (!body) return;
        /* the template put them here - see the note on `csTabs` in
           cs-templates.js for why they travel on the element rather than
           being hunted for in the running order */
        var tabs = body.csTabs || [];

        if (!tabs.length) {
          /* A FEEDBACK SLIDE WITH NO TABS AT ALL. Say which copy block is
             missing rather than drawing an empty slide. */
          var note = el('p', 'cs-meta cs-feedback-empty');
          note.textContent = 'tabs → ' + (body.csCopyKey || 'this slide');
          body.appendChild(note);
          return;
        }

        function show(tab) {
          paint(body, tab);
          /* the contents just changed, so whether this body needs a
             scrollbar may have changed with it - see cs-scrollers.js */
          if (CS.remeasureScrollers) CS.remeasureScrollers(slide);
          /* and the drawn outlines are drawn to fit the boxes they are on,
             which are new boxes now */
          if (CS.strokes && CS.strokes.apply) CS.strokes.apply(slide);
        }

        if (panel && CS.makeTabs) {
          CS.makeTabs(panel, tabs, show);
          /* AND THESE TABS ARE NOT DRAWN EITHER. The rest of the site's
             tabs wear a hand-drawn outline; the sheet asks these to sit
             quietly, like the two tabs on the case study catalogue. The
             outline is drawn from this attribute, so taking it off before
             the strokes are applied is the whole of it - nothing is drawn
             and then hidden. */
          panel.querySelectorAll('[data-cs-stroke]').forEach(function (n) {
            n.removeAttribute('data-cs-stroke');
          });
        }
        /* the first tab is drawn whether or not the tab bar could be built,
           so a slide is never blank because one file did not load */
        show(tabs[0]);
      })(slides[i]);
    }
  };
})(window.CS);

