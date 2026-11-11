/* ===========================================================================
   panel.js — the View Selector on the left.

   IT IS THE SAME LIST THE CARD DECK SHOWS, in a different shape. Both read
   `KIM.groups()` below, so the panel and the deck can never disagree about
   what is in a group or how many groups there are — which is the bug that
   would otherwise appear the first time the grouping changes.
   =========================================================================== */
window.KIM = window.KIM || {};

(function (KIM) {
  'use strict';

  var $ = KIM.$, el = KIM.el;
  var D = window.KIM_DATA;

  /* ---------------------------------------------------------------------
     THE GROUPING, IN ONE PLACE
     ---------------------------------------------------------------------
     Returns [{ key, name, subs }] for whichever grouping is current.
     Favourites is two groups rather than many, which is why it cannot just
     be "group by a field". */
  KIM.groups = function () {
    var g = KIM.state.group;
    var subs = D.subs;

    if (g === 'favorites') {
      return [
        { key: 'fav', name: 'Favorites', subs: subs.filter(function (s) { return s.favourite; }) },
        { key: 'other', name: 'Other Sub-Industries', subs: subs.filter(function (s) { return !s.favourite; }) }
      ];
    }
    var field = g === 'industry' ? 'industry' : 'country';
    var order = g === 'industry' ? D.industries : D.countries;
    return order.map(function (name) {
      return {
        key: name, name: name,
        subs: subs.filter(function (s) { return s[field] === name; })
      };
    }).filter(function (grp) { return grp.subs.length; });
  };

  /* Which sub-industries are shown at all, once the "material moves only"
     switch has had its say. ONE ANSWER FOR THE WHOLE SCREEN: the panel, the
     deck and the counts all ask this. */
  KIM.visibleSubs = function (list) {
    if (!KIM.state.matOnly) return list;
    return list.filter(function (s) { return s.material > 0; });
  };

  function matchSearch(s, q) {
    if (!q) return true;
    return (s.name + ' ' + s.industry + ' ' + s.country).toLowerCase().indexOf(q) > -1;
  }

  /* WHICH ONE IS CHOSEN, SAID IN THE MENU. A tick plus bold, because a
     tint alone says nothing in light mode — Salt's selected background and
     its overlay background are both white there. */
  function markChosen(value) {
    [].forEach.call($('kim-groupby-menu').children, function (it) {
      var on = it.dataset.kimValue === value;
      it.setAttribute('aria-checked', String(on));
      var tick = it.querySelector('svg');
      if (!tick) { tick = KIM.icon('check'); it.insertBefore(tick, it.firstChild); }
      tick.style.visibility = on ? 'visible' : 'hidden';
    });
  }

  var panel = {};

  panel.draw = function () {
    var host = KIM.clear($('kim-grouplist'));
    var q = ($('kim-subsearch-input').value || '').trim().toLowerCase();
    var state = KIM.state;

    KIM.groups().forEach(function (grp) {
      /* THE SELECTOR LISTS EVERYTHING, ALWAYS. "Show only material moves"
         belongs to the deck on the right — it is next to it, in the same
         header — and this side is a way of GETTING somewhere. Filtering
         it too had two bad effects: a name you knew existed could not be
         found, and every row that was left carried a Material Move tag,
         which made the list look as though everything was moving when in
         fact only fourteen of a hundred and twenty are.

         So the tag means something here: it is on the rows that have one
         and off the rows that do not, which is what the sheets draw. */
      var subs = grp.subs.filter(function (s) { return matchSearch(s, q); });
      /* A SEARCH THAT EMPTIES A GROUP TAKES THE GROUP WITH IT. Leaving the
         heading behind with nothing under it reads as a fault. */
      if (!subs.length && q) return;

      /* A SEARCH OPENS WHAT IT FINDS. Typing and then having to open each
         group by hand to see the matches is the commonest way a filtered
         tree wastes somebody's time. */
      var open = q ? true : !!state.openGroups[grp.key];

      var row = el('button', 'kim-grouprow');
      row.type = 'button';
      row.setAttribute('aria-expanded', open ? 'true' : 'false');
      row.appendChild(el('span', 'kim-rowname', grp.name));
      if (subs.some(function (s) { return s.material > 0; })) {
        row.appendChild(el('span', 'kim-tag', 'Material Move'));
      }
      row.appendChild(KIM.icon(open ? 'chev' : 'right', open ? 'kim-chev' : ''));
      row.addEventListener('click', function () {
        state.openGroups[grp.key] = !open;
        panel.draw();
      });
      host.appendChild(row);

      if (!open) return;

      subs.forEach(function (s) {
        var sub = el('button', 'kim-subrow');
        sub.type = 'button';
        sub.dataset.kimSub = s.id;
        if (state.subId === s.id) sub.setAttribute('aria-current', 'true');
        sub.appendChild(el('span', 'kim-rowname', s.name));
        if (s.material > 0) sub.appendChild(el('span', 'kim-tag', 'Material Move'));
        sub.addEventListener('click', function () { KIM.views.openSub(s.id); });
        host.appendChild(sub);
      });
    });

    if (!host.firstChild) {
      host.appendChild(el('p', 'kim-empty', 'Nothing matches that.'));
    }
  };

  panel.init = function () {
    /* ---- GROUP BY ---- */
    var btn = $('kim-groupby');
    KIM.wireMenu(btn, $('kim-groupby-menu'), function (value) {
      if (!value) return;
      KIM.state.group = value;
      KIM.state.openGroups = {};
      /* THE BUTTON KEEPS SAYING "GROUP BY" whatever is chosen. A control
         that renames itself to its own answer stops being findable: the
         reader looking for the grouping sees a button called "Country of
         Assets" and has to work out that it is the thing they want. What
         is chosen is said inside the menu instead, where it is read at
         the moment it matters — ticked, and in bold. */
      markChosen(value);
      panel.draw();
      KIM.views.draw();
      KIM.emit('group-change', value);
    });

    markChosen(KIM.state.group);
    $('kim-subsearch-input').addEventListener('input', panel.draw);

    /* ---- OVERVIEW, which is also the way back ---- */
    $('kim-overview-item').addEventListener('click', function () { KIM.views.openOverview(); });

    /* ---- COLLAPSE ---- */
    $('kim-panel-collapse').addEventListener('click', function () { panel.setOpen(false); });
    $('kim-panel-expand').addEventListener('click', function () { panel.setOpen(true); });

    panel.draw();
  };

  panel.setOpen = function (open) {
    $('kim-frame').dataset.panel = open ? 'open' : 'closed';
    $('kim-panel-collapse').setAttribute('aria-expanded', String(open));
    /* A CLOSED PANEL IS STILL ON THE PAGE — it is faded out and clipped,
       not removed, so that it can slide. `inert` is what keeps the Tab key
       and the screen reader out of it meanwhile; without it a reader would
       be tabbing through a list nobody can see. */
    $('kim-panel').toggleAttribute('inert', !open);
    $('kim-panel').setAttribute('aria-hidden', String(!open));
    /* THE DRAWER'S CHARTS ARE DRAWN AT A MEASURED WIDTH, and this changes
       every width on the screen. Anything open has to be told — once the
       slide has finished, or it measures a width that is still moving. */
    window.setTimeout(function () { KIM.emit('layout-change'); }, 320);
  };

  KIM.panel = panel;

})(window.KIM);
