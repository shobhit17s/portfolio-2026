/* hw-catalogue.js — the modal that opens from the pantheon.

   WHAT IT IS. One panel with TWO STATES, not two panels:

       company   the company's name, two tabs, and the stack of case study
                 cards under the second one
       gate      the password screen for whichever card was pressed

   They are states of one element because that is what they are to a
   reader: you press a card and the panel you are already looking at
   becomes the thing that asks for the password. Closing and opening a
   second panel would say "you have gone somewhere else", which is not
   true - "back to case study catalogue" returns you to exactly where you
   were.

   WHAT IT DOES NOT HOLD: a single word. Every piece of writing, every case
   study, and which page each card opens, are in common/catalogue.js. This
   file only knows how to build and behave.

   WHAT OPENS IT:
       any element with data-hw-catalogue
       HW.catalogue.open()        - which is what a click on the pantheon calls
*/
window.HW = window.HW || {};
(function (HW) {
  'use strict';

  var KEEP = 'cs-open';          /* the same key the case study gate reads,  */
                                 /* so unlocking here unlocks there too      */
  var TRIED = ['.png', '.jpg', '.jpeg', '.webp', '.svg'];

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.innerHTML = text;   /* copy is written with &mdash; etc */
    return n;
  }

  function sha256(text) {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
      .then(function (buf) {
        return Array.prototype.map.call(new Uint8Array(buf), function (b) {
          return ('0' + b.toString(16)).slice(-2);
        }).join('');
      });
  }

  /* ---------- the picture on a card ----------
     The same bargain the case studies make: you are never asked to edit a
     file to add a drawing. Name it after the slot, drop it in assets/, and
     it appears. Until it does, the card shows a box printing the exact file
     name it is waiting for, so a misspelling is visible rather than silent. */
  function picture(box, name) {
    if (!name) return;
    var i = 0;
    (function look() {
      if (i >= TRIED.length) {
        box.classList.add('is-empty');
        box.appendChild(el('span', 'hw-case-card-slot', name));
        return;
      }
      var url = 'assets/' + name + TRIED[i++];
      var probe = new Image();
      probe.onerror = look;
      probe.onload = function () {
        box.classList.remove('is-empty');
        box.textContent = '';
        var img = document.createElement('img');
        img.src = url;
        img.alt = '';
        box.appendChild(img);
      };
      probe.src = url;
    })();
  }

  HW.createCatalogue = function () {
    var data = (window.SITE && SITE.CATALOGUE) || null;
    var root = document.getElementById('hw-catalogue');
    if (!root || !data) return { open: function () {}, close: function () {} };

    var scrim    = document.getElementById('hw-catalogue-scrim');
    var closeBtn = document.getElementById('hw-catalogue-close');
    var listBox  = document.getElementById('hw-catalogue-list');
    var subtitle = document.getElementById('hw-catalogue-subtitle');
    var opener   = null;
    var chosen   = null;          /* the study whose password we are asking for */
    var labels   = data.labels || {};

    /* ---------- the fixed words, written once at start-up ---------- */
    function fillText(id, html) {
      var n = document.getElementById(id);
      if (n) n.innerHTML = html || '';
    }
    fillText('hw-catalogue-company', data.company);
    fillText('hw-catalogue-cancel', labels.cancel || 'Cancel');
    fillText('hw-catalogue-gate-lead', (data.password || {}).lead);
    fillText('hw-catalogue-gate-note', (data.password || {}).note);
    fillText('hw-catalogue-gate-back', '&larr; ' + ((data.password || {}).back || 'Back'));
    fillText('hw-catalogue-gate-go', (data.password || {}).submit);

    var field = document.getElementById('hw-catalogue-gate-input');
    if (field) field.placeholder = (data.password || {}).placeholder || 'Password';

    /* BUILT ONCE, BUT SAFE TO BUILD TWICE. Nothing calls this a second time
       today; a card list that APPENDS would quietly double if anything ever
       did, and a component that cannot be rebuilt is a trap laid for later.
       Emptying first costs one line. */
    if (listBox) listBox.textContent = '';

    /* ---------- one card ----------

       TWO STATES. Both are buttons, and the second one is NOT `disabled`.

       That distinction is the whole of this, so it is worth being plain
       about. A `disabled` button is removed from the page as far as a
       keyboard and a screen reader are concerned: Tab goes straight past it
       and a reader is never told it is there, which is a strange way to
       treat a case study whose only news is that it is coming. `aria-
       disabled` says the opposite thing in the right way - the control is
       still here, still reachable, still announced, and currently
       unavailable. The press is simply not wired up.

       The name on its own would not explain that, so the button carries a
       label of its own saying the study will be uploaded soon. A screen
       reader reads that label instead of the words inside the card. */
    function card(study) {
      var item = el('li', 'hw-catalogue-item');
      var soon = study.state === 'coming-soon';
      var b = el('button', 'hw-case-card' + (soon ? ' is-coming-soon' : ''));
      b.type = 'button';
      if (soon) {
        b.setAttribute('aria-disabled', 'true');
        var says = labels.comingSoonSays || 'will be uploaded soon';
        b.setAttribute('aria-label', (study.name || 'This case study') + ' \u2014 ' + says);
      }

      /* ---- the drawing, top left ---- */
      var fig = el('div', 'hw-case-card-figure is-empty');
      b.appendChild(fig);
      picture(fig, study.image);

      /* ---- the name and the line under it, beside it ---- */
      var words = el('div', 'hw-case-card-says');
      words.appendChild(el('p', 'hw-case-card-name', study.name || ''));
      words.appendChild(el('p', 'hw-case-card-desc', study.description || ''));
      b.appendChild(words);

      /* ---- the panel across the foot ----

         A CASE STUDY THAT IS NOT UP YET PUTS ITS BADGE HERE, in the room the
         impacts would have taken, rather than anywhere else on the card.
         Both states of a card are then the same size to the pixel - a badge
         squeezed in beside the name would make one card taller than its
         neighbour, which reads as a layout fault rather than as a
         difference in status. And impacts claimed for a case study nobody
         can open yet are claims about nothing. */
      var wants = (study.showImpacts !== undefined)
        ? study.showImpacts
        : (data.showImpacts !== false);
      var impacts = (!soon && wants) ? (study.impacts || []) : [];

      if (soon) {
        var state = el('div', 'hw-case-card-state');
        state.appendChild(el('span', 'hw-case-card-badge',
          labels.comingSoon || 'In progress'));
        state.appendChild(el('p', 'hw-case-card-state-says',
          labels.comingSoonSays || ''));
        b.appendChild(state);
      } else {
        var panel = el('div', 'hw-case-card-impacts');
        panel.appendChild(el('p', 'hw-case-card-impacts-title',
          labels.impacts || 'Business Impact'));

        /* THE LABEL IS WRITTEN FROM THE POSITION, not typed into the data.
           "Impact#1" and "Impact#2" are the same two words on every card
           for ever, so asking for them twice per study is asking for two
           cards to disagree about a colon. The sentence is all catalogue.js
           carries. */
        var row = el('div', 'hw-case-card-impact-row');
        impacts.slice(0, 2).forEach(function (text, i) {
          /* THE CELL AND THE PARAGRAPH ARE TWO ELEMENTS ON PURPOSE - see
             the note in hw-catalogue.css: a grid item cannot carry the
             line clamp, so the cell holds the room and the paragraph
             inside it holds the words. */
          var cell = el('div', 'hw-case-card-impact');
          var line = el('p', 'hw-case-card-impact-text');

          /* THE LABEL IN FRONT OF THE SENTENCE IS OPTIONAL, and there are
             three different things `labels.impact` can be saying:

                 not written at all   use the default, "Impact#"
                 a word               use that word
                 '' (or false)        no label at all - just the sentence

             The empty string had to be made to mean something, because
             before this it meant ": " - the word was gone but the number
             and the colon were still being added to it, which is the kind
             of half-removal that looks like a bug rather than a setting. */
          var word = labels.impact === undefined ? 'Impact#' : labels.impact;
          var mark = word ? word + (i + 1) + ':' : '';

          if (mark) {
            line.appendChild(el('span', 'hw-case-card-impact-lead', mark));
            line.appendChild(document.createTextNode(' ' + text));
          } else {
            /* NO LEADING SPACE WHEN THERE IS NOTHING TO LEAD. A space at
               the front of a line is invisible until the line wraps, and
               then it is a sentence that starts one notch further in than
               the one beside it. */
            line.appendChild(document.createTextNode(text));
          }
          cell.appendChild(line);
          row.appendChild(cell);
        });
        panel.appendChild(row);
        b.appendChild(panel);
      }

      /* Nothing is wired to the press on a card that is not up yet. It is
         left to say so rather than to apologise for it. */
      if (!soon) b.addEventListener('click', function () { choose(study); });
      item.appendChild(b);
      return item;
    }

    if (listBox) {
      (data.studies || []).forEach(function (s) { listBox.appendChild(card(s)); });
    }

    /* SAID ONCE AT START-UP, not only when the panel opens. The markup
       arrives in the catalogue state with an empty second line in the band;
       filling it here means the panel is correct before anybody has pressed
       anything - which matters for the one reader who opens the page with
       the modal already up, and for anyone screenshotting it. */
    state('company');

    /* ---------- moving between the two states ----------

       THE BAND ALWAYS SAYS WHERE YOU ARE. The header is shared by both
       states, so its second line is the one thing that changes with them:
       the catalogue's own title, or the name of the case study whose
       password is being asked for. Written here rather than in two places,
       because there is exactly one thing that changes the state. */
    function state(name) {
      root.setAttribute('data-hw-state', name);
      if (!subtitle) return;
      subtitle.textContent = (name === 'gate' && chosen)
        ? (chosen.name || '')
        : (data.title || '');
    }

    function choose(study) {
      chosen = study;
      /* Already through the password once in this tab? Then there is nothing
         to ask - go. Closing the tab forgets it. */
      var kept = null;
      try { kept = sessionStorage.getItem(KEEP); } catch (e) {}
      if (!study.locked || kept) { go(study); return; }

      say('');
      if (field) field.value = '';
      state('gate');
      setTimeout(function () { if (field) field.focus(); }, 60);
    }

    function go(study) {
      if (study && study.href) window.location.href = study.href;
    }

    function say(msg) {
      var n = document.getElementById('hw-catalogue-gate-say');
      if (n) n.innerHTML = msg || '';
    }

    /* ---------- the password ---------- */
    var form = document.getElementById('hw-catalogue-gate');
    if (form) form.addEventListener('submit', function (e) {
      e.preventDefault();
      var access = (window.CS && CS.ACCESS) || {};
      if (!access.hash) { go(chosen); return; }        /* no password set */
      if (!field || !field.value) { if (field) field.focus(); return; }

      /* SOME BROWSERS WILL NOT DO THIS AT ALL off a file opened from the
         disk: the hashing lives in crypto.subtle, which a browser only
         offers on a page it considers secure. Rather than appear broken,
         the screen says so. */
      if (!(window.crypto && crypto.subtle)) {
        say((data.password || {}).unavailable || '');
        return;
      }

      var go_ = document.getElementById('hw-catalogue-gate-go');
      if (go_) go_.disabled = true;
      sha256(field.value).then(function (h) {
        if (go_) go_.disabled = false;
        if (h !== access.hash) {
          root.classList.add('is-wrong');
          say((data.password || {}).wrong || '');
          field.select();
          setTimeout(function () { root.classList.remove('is-wrong'); }, 600);
          return;
        }
        try { sessionStorage.setItem(KEEP, '1'); } catch (e) {}
        go(chosen);
      });
    });

    var backBtn = document.getElementById('hw-catalogue-gate-back');
    if (backBtn) backBtn.addEventListener('click', function (e) {
      e.preventDefault();
      chosen = null;
      state('company');
    });

    /* MOVE FOCUS WITHOUT ANNOUNCING IT.

       `preventScroll` is not a nicety here. The body of this panel is a
       scroll container, and a browser asked to focus something inside one
       will scroll that container to reveal it - which, on a row that is
       already showing the thing being focused, means a sideways jolt for
       no reason at all. */
    function quietly(el) {
      if (!el || !el.focus) return;
      root.setAttribute('data-hw-quiet-focus', '');
      el.focus({ preventScroll: true });
    }

    /* THE FIRST KEYPRESS IS THE QUESTION BEING ASKED. Caught on the way
       down so it runs before anything else decides what that key does, and
       on the panel rather than the window because a key pressed anywhere
       else is not this panel's business. */
    root.addEventListener('keydown', function () {
      root.removeAttribute('data-hw-quiet-focus');
    }, true);

    /* ---------- opening and closing ---------- */
    function open() {
      chosen = null;
      state('company');
      document.body.classList.add('hw-catalogue-open');
      root.setAttribute('aria-hidden', 'false');
      /* FOCUS GOES TO THE FIRST CASE STUDY, not to the close button. Both
         answer the "something inside the modal must hold focus" rule, but
         only one of them is the thing you came here to press - and landing
         on Close reads as the panel offering you the way out before it has
         offered you anything else.

         QUIETLY, THOUGH. See the note on `data-hw-quiet-focus` in the
         stylesheet: the ring is held back until a key is actually pressed,
         so a reader who opened this with a mouse is not shown a dashed
         outline answering a question they did not ask. */
      setTimeout(function () {
        quietly(root.querySelector('.hw-case-card') || closeBtn);
      }, 320);
    }

    function close() {
      document.body.classList.remove('hw-catalogue-open');
      root.setAttribute('aria-hidden', 'true');
      if (opener && opener.focus) opener.focus();
    }

    /* Caught on the way up rather than bound to each opener, because the
       keyboard list of doors is built after this runs. */
    document.addEventListener('click', function (e) {
      var node = e.target.closest && e.target.closest('[data-hw-catalogue]');
      if (!node) return;
      e.preventDefault();
      opener = node;
      open();
    });

    if (closeBtn) closeBtn.addEventListener('click', close);

    /* CANCEL AND THE CROSS DO THE SAME THING, and that is on purpose. The
       sheet puts a word in the footer and a cross in the band; a reader who
       reaches for either is saying "not this, thank you", and two controls
       that look like they mean the same thing had better mean it. Stepping
       BACK from the password screen is a different act and has its own
       button. */
    var cancelBtn = document.getElementById('hw-catalogue-cancel');
    if (cancelBtn) cancelBtn.addEventListener('click', close);

    /* ---------- a click outside closes it ----------
       It must be a click that BEGAN outside. Selecting a line of the
       description and letting go past the edge of the panel is one gesture
       that ends on the scrim, and closing the modal underneath someone who
       was only highlighting a sentence is a small, infuriating thing. So the
       press is remembered and only a press and release both on the scrim
       count. */
    if (scrim) {
      var downOnScrim = false;
      scrim.addEventListener('pointerdown', function () { downOnScrim = true; });
      document.addEventListener('pointerdown', function (e) {
        if (e.target !== scrim) downOnScrim = false;
      }, true);
      scrim.addEventListener('click', function () {
        if (downOnScrim) close();
        downOnScrim = false;
      });
    }
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (!document.body.classList.contains('hw-catalogue-open')) return;
      /* Escape on the password screen steps BACK to the catalogue rather
         than throwing you out of the modal altogether - one press, one step. */
      if (root.getAttribute('data-hw-state') === 'gate') {
        chosen = null;
        state('company');
        return;
      }
      close();
    });

    return { open: function () { opener = null; open(); }, close: close };
  };
})(window.HW);

