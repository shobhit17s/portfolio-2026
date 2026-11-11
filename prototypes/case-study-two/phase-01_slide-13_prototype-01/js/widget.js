/* ===========================================================================
   widget.js — builds both Performance to Plan widgets from one model.

   ONE RENDERER, TWO ARRANGEMENTS. Concept 1 and Concept 3 differ only in
   how the quarters are laid out, so they share everything else: the same
   figures, the same significance rule, the same chrome. If a number is
   different between the two screens, it is a bug rather than a design.
   =========================================================================== */
(function () {
  'use strict';

  var P = window.PTP;

  /* ---- how a figure is written ---- */
  function fmt(value, unit) {
    if (value === undefined || value === null) return null;
    if (unit === 'pp') return value.toFixed(1) + '%';
    if (unit === 'x')  return value.toFixed(1) + 'x';
    return String(Math.round(value));
  }

  function fmtDelta(d, unit) {
    var sign = d > 0 ? '+' : '−';            /* a real minus, not a hyphen */
    var n = Math.abs(d);
    if (unit === 'pp') return sign + n.toFixed(1) + ' PP';
    if (unit === 'x')  return sign + n.toFixed(1) + 'x';
    return sign + String(Math.round(n));
  }

  /* ---- WHAT A CELL IS WORTH SAYING ABOUT ----
     Returns the gap, whether it is significant, and - only if it is -
     whether it is welcome. `rising` is whether UP is good for this
     attribute, so leverage going up is negative while revenue going up is
     positive, from the same arithmetic. */
  /* WHICH CASE IS SHOWING. One value for the whole widget, because the
     dropdown is one control and the grid under it is one grid. Everything
     that draws a figure asks `planOf()` rather than reading a number off
     the attribute, so switching case is one assignment and a redraw. */
  var CASE = P.meta.cases[0].id;

  function planOf(attr) { return attr.plan[CASE]; }

  function judge(attr, q) {
    var actual = attr.actuals[q];
    if (actual === undefined) return { reported: false };
    var plan = planOf(attr);
    var delta = actual - plan;
    var frac = Math.abs(delta) / Math.abs(plan);
    var significant = frac >= attr.significant;
    return {
      reported: true,
      actual: actual,
      delta: delta,
      significant: significant,
      good: (delta > 0) === attr.rising
    };
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* the wash class for a cell, or nothing at all */
  function washOf(j) {
    if (!j.reported || !j.significant) return '';
    return j.good ? ' ptp-cell--positive' : ' ptp-cell--negative';
  }

  /* =======================================================================
     CONCEPT 1 — a three-column block per quarter
     =======================================================================
     PROJECTED repeats inside every block, which is the arrangement's whole
     argument: each quarter is a complete comparison you can read without
     looking anywhere else. It is also its whole cost - four quarters is
     twelve columns, which is why this one scrolls.
     ======================================================================= */
  function buildBlocks(root) {
    var table = el('table', 'ptp-grid ptp-grid--blocks');
    table.id = root.id + '-grid';
    table.setAttribute('aria-labelledby', root.id + '-title');

    var thead = el('thead');
    var hr = el('tr');
    hr.appendChild(el('th', null, 'Attributes'));
    P.quarters.forEach(function (q, i) {
      [['Projected', P.meta.planLabel], ['Financials', q.asOf], ['Delta', '']]
        .forEach(function (pair, col) {
          var th = el('th');
          if (col === 0) th.className = 'ptp-block-start';
          th.scope = 'col';
          th.appendChild(document.createTextNode(pair[0]));
          if (pair[1]) th.appendChild(el('span', 'ptp-sub', pair[1]));
          hr.appendChild(th);
        });
    });
    thead.appendChild(hr);
    table.appendChild(thead);

    var tbody = el('tbody');
    P.attributes.forEach(function (a) {
      var tr = el('tr');
      var rh = el('th', null, a.label);
      rh.scope = 'row';
      tr.appendChild(rh);

      P.quarters.forEach(function (q) {
        var j = judge(a, q.id);

        var tdPlan = el('td', 'ptp-block-start', fmt(planOf(a), a.unit));
        tr.appendChild(tdPlan);

        if (!j.reported) {
          tr.appendChild(el('td', 'ptp-na', 'N/A'));
          tr.appendChild(el('td', 'ptp-na', 'N/A'));
          return;
        }
        tr.appendChild(el('td', null, fmt(j.actual, a.unit)));
        tr.appendChild(el('td', 'ptp-delta' + washOf(j), fmtDelta(j.delta, a.unit)));
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    return table;
  }

  /* =======================================================================
     CONCEPT 3 — one projected column, the quarters under one head
     =======================================================================
     PROJECTED IS SAID ONCE, which is the arrangement's argument: the plan
     does not change quarter to quarter, so repeating it is repeating
     yourself. The whole year fits without scrolling.

     THE DELTA APPEARS ONLY WHERE IT MATTERS, beside the figure. A quiet
     quarter is a bare number. That is deliberate: it means a marked cell
     is marked twice over - by the wash and by there being something extra
     in it - so it still reads for somebody who cannot tell the two washes
     apart.
     ======================================================================= */
  function buildQuarters(root) {
    var table = el('table', 'ptp-grid ptp-grid--quarters');
    table.id = root.id + '-grid';
    table.setAttribute('aria-labelledby', root.id + '-title');

    var thead = el('thead');

    /* two header rows: the group, then the quarters under it */
    var top = el('tr');
    var blank = el('th'); blank.rowSpan = 2; blank.scope = 'col';
    blank.appendChild(document.createTextNode('Attributes'));
    top.appendChild(blank);

    var plan = el('th'); plan.rowSpan = 2; plan.scope = 'col';
    plan.className = 'ptp-plan';
    plan.appendChild(document.createTextNode('Projected'));
    plan.appendChild(el('span', 'ptp-sub', P.meta.planShort));
    top.appendChild(plan);

    var group = el('th', null, 'Financials');
    group.colSpan = P.quarters.length;
    group.scope = 'colgroup';
    group.style.textAlign = 'center';
    top.appendChild(group);
    thead.appendChild(top);

    var sub = el('tr');
    P.quarters.forEach(function (q) {
      var th = el('th', null, q.label);
      th.scope = 'col';
      sub.appendChild(th);
    });
    thead.appendChild(sub);
    table.appendChild(thead);

    var tbody = el('tbody');
    P.attributes.forEach(function (a) {
      var tr = el('tr');
      var rh = el('th', null, a.label); rh.scope = 'row';
      tr.appendChild(rh);
      tr.appendChild(el('td', 'ptp-plan', fmt(planOf(a), a.unit)));

      P.quarters.forEach(function (q) {
        var j = judge(a, q.id);
        if (!j.reported) { tr.appendChild(el('td', 'ptp-na', 'N/A')); return; }

        var td = el('td', washOf(j).trim());
        td.appendChild(el('span', 'ptp-value', fmt(j.actual, a.unit)));
        if (j.significant) {
          td.appendChild(el('span', 'ptp-delta', fmtDelta(j.delta, a.unit)));
        }
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    return table;
  }

  /* ---- the chrome both concepts wear ---- */
  var ICON = {
    expand: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M2 5.5V2h3.5M10.5 2H14v3.5M14 10.5V14h-3.5M5.5 14H2v-3.5"/></svg>',
    more:   '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><circle cx="3" cy="8" r="1.3"/><circle cx="8" cy="8" r="1.3"/><circle cx="13" cy="8" r="1.3"/></svg>',
    out:    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M6.5 2H14v7.5M14 2L7 9"/><path d="M12 10.5V14H2V4h3.5"/></svg>',
    up:     '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M8 11V3m0 0L4.5 6.5M8 3l3.5 3.5"/><path d="M2.5 11.5V14h11v-2.5"/></svg>',
    caret:  '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M4 6l4 4 4-4"/></svg>'
  };

  function iconButton(id, label, svg) {
    var b = el('button', 'ptp-icon-button');
    b.type = 'button'; b.id = id;
    b.setAttribute('aria-label', label);
    b.innerHTML = svg;
    return b;
  }

  /* =======================================================================
     THE CASE DROPDOWN
     =======================================================================

     A real listbox, built the way Salt's Dropdown is: a button that owns
     a list, with the keyboard contract that goes with it. It was a button
     that merely looked like one before, and a control that cannot be
     opened is worse than no control - it invites a press and answers with
     nothing.

     WHAT IT ANSWERS TO:

         click the button      opens, or closes
         Down / Up             opens if shut; otherwise moves
         Home / End            first / last
         Enter / Space         takes the one under the marker
         Escape                shuts and gives the button its focus back
         Tab, or a click away  shuts, keeping what was chosen
         a letter              jumps to the next case starting with it

     `aria-activedescendant` IS WHY FOCUS STAYS ON THE BUTTON. A listbox
     can be operated two ways: move real focus onto each option, or keep
     focus on the control and NAME the active option. The second is what
     a combobox does, and it is why Escape has something to return focus
     to and why the page does not lose its place when the list shuts.

     ON CHOOSING, IT TELLS THE WIDGET. `ptp:case` carries the case that
     was chosen; nothing listens yet, because the figures for the other
     two cases do not exist. When they do, that event is the one seam -
     no part of this function needs to change. */
  function dropdown(id) {
    var wrap = el('div', 'ptp-dropdown-wrap');

    var btn = el('button', 'ptp-dropdown');
    btn.type = 'button';
    btn.id = id + '-case';
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', id + '-case-list');
    btn.setAttribute('aria-label', 'Case');

    var label = el('span', null, P.meta.cases[0].name);
    btn.appendChild(label);
    var caret = el('span', 'ptp-dropdown-caret');
    caret.innerHTML = ICON.caret;
    btn.appendChild(caret);

    var list = el('ul', 'ptp-listbox');
    list.id = id + '-case-list';
    list.setAttribute('role', 'listbox');
    list.setAttribute('aria-label', 'Case');
    list.hidden = true;

    var chosen = 0, active = 0;

    P.meta.cases.forEach(function (c, i) {
      var opt = el('li', 'ptp-option', c.name);
      opt.id = id + '-case-opt-' + i;
      opt.setAttribute('role', 'option');
      opt.setAttribute('aria-selected', String(i === 0));
      /* `mousedown` rather than `click`: mousedown fires before the
         button loses focus, so the list cannot shut underneath the
         press and swallow it. */
      opt.addEventListener('mousedown', function (e) { e.preventDefault(); choose(i); });
      list.appendChild(opt);
    });
    var options = [].slice.call(list.children);

    function paint() {
      options.forEach(function (o, i) {
        o.setAttribute('aria-selected', String(i === chosen));
        o.classList.toggle('is-active', i === active);
      });
      btn.setAttribute('aria-activedescendant',
        list.hidden ? '' : options[active].id);
    }

    function open() {
      if (!list.hidden) return;
      active = chosen;
      list.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
      paint();
    }
    function close(giveBackFocus) {
      if (list.hidden) return;
      list.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
      btn.removeAttribute('aria-activedescendant');
      if (giveBackFocus) btn.focus();
    }
    function choose(i) {
      chosen = active = i;
      label.textContent = P.meta.cases[i].name;
      paint();
      close(true);
      /* THE SEAM IS NOW CONNECTED. It carries the case that was chosen;
         `build` listens and redraws the figures. */
      btn.dispatchEvent(new CustomEvent('ptp:case', {
        bubbles: true,
        detail: { index: i, id: P.meta.cases[i].id, name: P.meta.cases[i].name }
      }));
    }
    function move(to) {
      active = Math.max(0, Math.min(options.length - 1, to));
      paint();
      options[active].scrollIntoView({ block: 'nearest' });
    }

    btn.addEventListener('click', function () {
      if (list.hidden) open(); else close(false);
    });

    btn.addEventListener('keydown', function (e) {
      switch (e.key) {
        case 'ArrowDown': e.preventDefault(); list.hidden ? open() : move(active + 1); break;
        case 'ArrowUp':   e.preventDefault(); list.hidden ? open() : move(active - 1); break;
        case 'Home':      if (!list.hidden) { e.preventDefault(); move(0); } break;
        case 'End':       if (!list.hidden) { e.preventDefault(); move(options.length - 1); } break;
        case 'Enter':
        case ' ':         e.preventDefault(); list.hidden ? open() : choose(active); break;
        case 'Escape':    if (!list.hidden) { e.preventDefault(); close(true); } break;
        default:
          /* type-ahead, for a list that will get longer than three */
          if (e.key.length === 1 && /\S/.test(e.key)) {
            var k = e.key.toLowerCase();
            for (var n = 1; n <= options.length; n++) {
              var i = (active + n) % options.length;
              if (P.meta.cases[i].name.toLowerCase().indexOf(k) === 0) {
                if (list.hidden) open();
                move(i);
                break;
              }
            }
          }
      }
    });

    /* SHUT WHEN THE PRESS LANDS ANYWHERE ELSE. Listened for on the way
       DOWN so it runs before anything that press might trigger, and
       checked against the wrapper so a press on the list itself is not
       treated as a press outside it. */
    document.addEventListener('pointerdown', function (e) {
      if (!wrap.contains(e.target)) close(false);
    }, true);
    btn.addEventListener('blur', function () {
      /* a blur that moves inside the control is not leaving it */
      window.setTimeout(function () {
        if (!wrap.contains(document.activeElement)) close(false);
      }, 0);
    });

    wrap.appendChild(btn);
    wrap.appendChild(list);
    return wrap;
  }

  function build(root, kind) {
    var id = root.id;
    root.className = 'ptp-widget';
    root.setAttribute('role', 'region');
    root.setAttribute('aria-labelledby', id + '-title');

    /* head */
    var head = el('div', 'ptp-head'); head.id = id + '-head';
    var h = el('h2', 'ptp-head-title', P.meta.title); h.id = id + '-title';
    head.appendChild(h);
    var tools = el('div', 'ptp-head-tools'); tools.id = id + '-window-tools';
    tools.appendChild(iconButton(id + '-expand', 'Expand widget', ICON.expand));
    tools.appendChild(iconButton(id + '-more', 'More actions', ICON.more));
    head.appendChild(tools);
    root.appendChild(head);

    /* tools */
    var bar = el('div', 'ptp-tools'); bar.id = id + '-tools';
    var meta = el('p', 'ptp-meta'); meta.id = id + '-units';
    meta.appendChild(el('span', 'ptp-meta-part', 'Currency: ' + P.meta.currency));
    meta.appendChild(el('span', 'ptp-meta-part', 'Scale: ' + P.meta.scale));
    bar.appendChild(meta);

    bar.appendChild(dropdown(id));
    root.appendChild(bar);

    /* THE GRID AND ITS LEGEND ARE ONE BLOCK, not two things at opposite
       ends of the widget. The legend explains the washes in the table, so
       it belongs under the table - and the slack below them both then
       reads as room for more attributes rather than as a gap somebody
       forgot to close. */
    var body = el('div', 'ptp-body'); body.id = id + '-body';
    var wrap = el('div', 'ptp-grid-wrap'); wrap.id = id + '-grid-wrap';
    wrap.appendChild(kind === 'blocks' ? buildBlocks(root) : buildQuarters(root));
    body.appendChild(wrap);

    /* CHOOSING A CASE REDRAWS THE GRID AND NOTHING ELSE. The head, the
       units line, the dropdown itself and the legend all say the same
       thing whichever case is showing, so rebuilding them would be work
       nobody can see - and it would throw away the focus the reader has
       just put on the dropdown. */
    root.addEventListener('ptp:case', function (e) {
      CASE = e.detail.id;
      wrap.textContent = '';
      wrap.appendChild(kind === 'blocks' ? buildBlocks(root) : buildQuarters(root));
    });

    /* legend */
    var legend = el('div', 'ptp-legend'); legend.id = id + '-legend';
    [['positive', 'Significant positive deviation'],
     ['negative', 'Significant negative deviation']].forEach(function (p) {
      var item = el('span', 'ptp-legend-item');
      item.appendChild(el('span', 'ptp-swatch ptp-swatch--' + p[0]));
      item.appendChild(document.createTextNode(p[1]));
      legend.appendChild(item);
    });
    body.appendChild(legend);
    root.appendChild(body);

    /* foot */
    var foot = el('div', 'ptp-foot'); foot.id = id + '-foot';
    var visit = el('button', 'ptp-button ptp-button--ghost');
    visit.type = 'button'; visit.id = id + '-visit';
    visit.appendChild(document.createTextNode('View latest projection'));
    var o = el('span'); o.innerHTML = ICON.out; o.style.display = 'inline-grid';
    visit.appendChild(o);
    foot.appendChild(visit);

    var up = el('button', 'ptp-button ptp-button--cta');
    up.type = 'button'; up.id = id + '-upload';
    up.appendChild(document.createTextNode('Upload new projection'));
    var u = el('span'); u.innerHTML = ICON.up; u.style.display = 'inline-grid';
    up.appendChild(u);
    foot.appendChild(up);
    root.appendChild(foot);
  }

  window.PTPWidget = { build: build };
})();
