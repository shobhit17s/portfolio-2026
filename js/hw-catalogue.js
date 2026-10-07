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
    var tabsBox  = document.getElementById('hw-catalogue-tabs');
    var listBox  = document.getElementById('hw-catalogue-list');
    var opener   = null;
    var chosen   = null;          /* the study whose password we are asking for */

    /* ---------- the fixed words, written once at start-up ---------- */
    function fillText(id, html) {
      var n = document.getElementById(id);
      if (n) n.innerHTML = html || '';
    }
    fillText('hw-catalogue-company', data.company);
    fillText('hw-catalogue-gate-company', data.company);
    fillText('hw-catalogue-intro', (data.catalogue || {}).intro);
    fillText('hw-catalogue-gate-lead', (data.password || {}).lead);
    fillText('hw-catalogue-gate-note', (data.password || {}).note);
    fillText('hw-catalogue-gate-back', '&larr; ' + ((data.password || {}).back || 'Back'));
    fillText('hw-catalogue-gate-go', (data.password || {}).submit);

    var field = document.getElementById('hw-catalogue-gate-input');
    if (field) field.placeholder = (data.password || {}).placeholder || 'Password';

    /* BUILT ONCE, BUT SAFE TO BUILD TWICE. Nothing calls this a second time
       today; a tab row and a card list that APPEND would quietly double if
       anything ever did, and a component that cannot be rebuilt is a trap
       laid for later. Emptying first costs one line each. */
    if (tabsBox) tabsBox.textContent = '';
    if (listBox) listBox.textContent = '';

    var overview = document.getElementById('hw-catalogue-overview');
    if (overview) {
      overview.textContent = '';
      ((data.overview || {}).body || []).forEach(function (para) {
        overview.appendChild(el('p', 'hw-catalogue-para', para));
      });
    }

    /* ---------- the two tabs ---------- */
    var panes = {
      overview:  overview,
      catalogue: document.getElementById('hw-catalogue-studies')
    };
    var tabs = {};

    function showTab(which) {
      Object.keys(panes).forEach(function (k) {
        var on = (k === which);
        if (panes[k]) panes[k].hidden = !on;
        if (tabs[k]) {
          tabs[k].classList.toggle('is-active', on);
          tabs[k].setAttribute('aria-selected', on ? 'true' : 'false');
        }
      });
    }

    if (tabsBox) {
      ['overview', 'catalogue'].forEach(function (k) {
        var b = el('button', 'hw-catalogue-tab', (data.tabs || {})[k] || k);
        b.type = 'button';
        b.id = 'hw-catalogue-tab-' + k;
        b.setAttribute('role', 'tab');
        b.setAttribute('aria-controls', 'hw-catalogue-' +
          (k === 'overview' ? 'overview' : 'studies'));
        b.addEventListener('click', function () { showTab(k); });
        tabs[k] = b;
        tabsBox.appendChild(b);
      });
    }

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
        var says = (data.labels || {}).comingSoonSays || 'will be uploaded soon';
        b.setAttribute('aria-label', (study.name || 'This case study') + ' \u2014 ' + says);
      }

      var fig = el('div', 'hw-case-card-figure is-empty');
      b.appendChild(fig);
      picture(fig, study.image);

      var says = el('div', 'hw-case-card-says');
      says.appendChild(el('p', 'hw-case-card-name', study.name || ''));
      says.appendChild(el('p', 'hw-case-card-desc', study.description || ''));
      b.appendChild(says);

      /* ---- the third column, on the right ----

         A CARD THAT IS NOT UP YET PUTS ITS BADGE HERE, in the room the
         metrics would have taken, rather than underneath the description.

         Two reasons, and the second is the one that matters. A badge under
         the description made the card TALLER than its neighbour, so the two
         states of the same component were different sizes - which reads as a
         layout fault rather than as a difference in status. And metrics on a
         case study nobody can open yet are numbers about nothing. The right
         column is where a card says what it has to offer; for this one, what
         it has to offer is "soon".

         The grid class is the same either way, so the column is the same
         width and the cards line up down their right edge. */
      var wants = (study.showMetrics !== undefined)
        ? study.showMetrics
        : (data.showMetrics !== false);
      var metrics = (!soon && wants) ? (study.metrics || []) : [];

      if (soon) {
        var state = el('div', 'hw-case-card-state');
        state.appendChild(el('span', 'hw-case-card-badge',
          (data.labels || {}).comingSoon || 'In progress'));
        b.appendChild(state);
        b.classList.add('has-metrics');
      } else if (metrics.length) {
        var panel = el('div', 'hw-case-card-metrics');
        metrics.slice(0, 2).forEach(function (m) {
          var cell = el('div', 'hw-case-card-metric');
          cell.appendChild(el('span', 'hw-case-card-metric-label', m.label || ''));
          cell.appendChild(el('span', 'hw-case-card-metric-value', m.value || ''));
          panel.appendChild(cell);
        });
        b.appendChild(panel);
        b.classList.add('has-metrics');
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

    /* ---------- moving between the two states ---------- */
    function state(name) {
      root.setAttribute('data-hw-state', name);
    }

    function choose(study) {
      chosen = study;
      /* Already through the password once in this tab? Then there is nothing
         to ask - go. Closing the tab forgets it. */
      var kept = null;
      try { kept = sessionStorage.getItem(KEEP); } catch (e) {}
      if (!study.locked || kept) { go(study); return; }

      fillText('hw-catalogue-gate-title', study.name || '');
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
      state('company');
      showTab('catalogue');
    });

    /* ---------- opening and closing ---------- */
    function open() {
      state('company');
      showTab(data.opensOn === 'overview' ? 'overview' : 'catalogue');
      document.body.classList.add('hw-catalogue-open');
      root.setAttribute('aria-hidden', 'false');
      setTimeout(function () { if (closeBtn) closeBtn.focus(); }, 320);
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
      if (root.getAttribute('data-hw-state') === 'gate') { state('company'); return; }
      close();
    });

    return { open: function () { opener = null; open(); }, close: close };
  };
})(window.HW);


