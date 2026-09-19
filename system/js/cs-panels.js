/* cs-panels.js — tabs and toggles, including what happens when there are more
   of them than there is room for.

   Desktop: extra tabs move into a "+n" button that opens a small menu, rather
   than squashing every tab until none of them can be read.
   Phone: the whole panel collapses into a dropdown showing only the selected
   item, which opens to reveal the rest. */
window.CS = window.CS || {};
(function (CS) {
  'use strict';

  /* A tab's words live in their own span. The tab itself must not clip, or it
     would cut off the drawn outline that now sits just outside its edge — so
     the trimming of a long label happens on the span instead. */
  function label(text) {
    var span = document.createElement('span');
    span.className = 'cs-control-label';
    span.textContent = text;
    return span;
  }


  /* On a phone a panel becomes a dropdown: the chosen one stays put as the
     trigger, and the rest move into a sheet that opens over the page. The
     sheet is a real element so it can carry the border and the hairlines
     between choices that the reference shows. */
  function sheetFor(panel) {
    var sheet = panel.querySelector(':scope > .cs-menu-sheet');
    if (!sheet) {
      sheet = document.createElement('div');
      sheet.className = 'cs-menu-sheet';
      sheet.setAttribute('data-cs-stroke', '20');
      panel.appendChild(sheet);
    }
    return sheet;
  }

  function asDropdown(panel, buttons, active, narrow, tail) {
    var sheet = sheetFor(panel);
    if (!narrow) {
      buttons.forEach(function (b) {
        if (b.parentNode === sheet) panel.insertBefore(b, tail || sheet);
      });
      sheet.remove();
      return;
    }
    if (sheet.parentNode !== panel) panel.appendChild(sheet);
    buttons.forEach(function (b, i) {
      if (i === active) {
        if (b.parentNode !== panel) panel.insertBefore(b, sheet);
        else panel.insertBefore(b, panel.firstChild);
      } else if (b.parentNode !== sheet) {
        sheet.appendChild(b);
      }
    });
    /* keep the sheet in the order the items were given */
    buttons.forEach(function (b, i) { if (i !== active) sheet.appendChild(b); });
  }

  function isNarrow() { return window.matchMedia('(max-width: 820px)').matches; }

  CS.makeTabs = function (panel, items, onChange) {
    var buttons = [];
    var overflow = document.createElement('div');
    overflow.className = 'cs-tab-overflow';
    var more = document.createElement('button');
    more.type = 'button';
    more.className = 'cs-tab';
    more.setAttribute('data-cs-stroke', '');
    var menu = document.createElement('div');
    menu.className = 'cs-overflow-menu';
    overflow.append(more, menu);

    var active = 0;

    function select(i, quiet) {
      active = i;
      buttons.forEach(function (b, j) { b.setAttribute('aria-selected', j === i ? 'true' : 'false'); });
      panel.classList.remove('is-open');
      overflow.classList.remove('is-open');
      if (!quiet && onChange) onChange(items[i], i);
      layout();
    }

    items.forEach(function (item, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'cs-tab';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      b.setAttribute('data-cs-stroke', '');
      b.appendChild(label(item.label));
      b.addEventListener('click', function () {
        if (isNarrow() && !panel.classList.contains('is-open') && i === active) {
          panel.classList.add('is-open');
          return;
        }
        select(i);
      });
      buttons.push(b);
      panel.appendChild(b);
    });
    panel.appendChild(overflow);

    more.addEventListener('click', function (e) {
      e.stopPropagation();
      overflow.classList.toggle('is-open');
    });
    document.addEventListener('click', function (e) {
      overflow.classList.remove('is-open');
      if (!panel.contains(e.target)) panel.classList.remove('is-open');
    });

    /* Work out how many tabs actually fit, and park the rest in the menu. */
    function layout() {
      panel.classList.toggle('is-dropdown', isNarrow());
      asDropdown(panel, buttons, active, isNarrow(), overflow);
      if (isNarrow()) {
        overflow.style.display = 'none';
        buttons.forEach(function (b) { b.style.display = ''; });
        return;
      }
      overflow.style.display = '';
      buttons.forEach(function (b) { b.style.display = ''; });
      menu.textContent = '';
      var room = panel.clientWidth;
      if (!room) return;
      var widths = buttons.map(function (b) { return b.offsetWidth; });
      var gap = 4;
      var used = 0, fits = buttons.length;
      for (var i = 0; i < buttons.length; i++) {
        used += widths[i] + gap;
        if (used > room - 90) { fits = i; break; }
      }
      if (fits >= buttons.length) {
        overflow.style.display = 'none';
        return;
      }
      if (active >= fits) {                 // always keep the selected tab visible
        var swap = buttons[active];
        panel.insertBefore(swap, buttons[fits - 1]);
      }
      var hidden = 0;
      buttons.forEach(function (b, i) {
        var visible = Array.prototype.indexOf.call(panel.children, b) < fits;
        b.style.display = visible ? '' : 'none';
        if (!visible) {
          hidden++;
          var m = document.createElement('button');
          m.type = 'button';
          m.textContent = items[i].label;
          m.addEventListener('click', function () { select(i); });
          menu.appendChild(m);
        }
      });
      more.textContent = '+' + hidden;
      overflow.style.display = hidden ? '' : 'none';
    }

    window.addEventListener('resize', layout);
    requestAnimationFrame(layout);
    select(0, true);
    return { select: select, layout: layout, buttons: buttons };
  };

  CS.makeToggles = function (panel, items, onChange) {
    var buttons = [];
    var active = 0;

    function select(i, quiet) {
      active = i;
      buttons.forEach(function (b, j) { b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); });
      panel.classList.remove('is-open');
      asDropdown(panel, buttons, active, isNarrow());
      if (!quiet && onChange) onChange(items[i], i);
    }

    items.forEach(function (item, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'cs-toggle';
      b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
      b.setAttribute('data-cs-stroke', '');
      b.appendChild(label(item.label));
      b.addEventListener('click', function () {
        if (isNarrow() && !panel.classList.contains('is-open') && i === active) {
          panel.classList.add('is-open');
          return;
        }
        select(i);
      });
      buttons.push(b);
      panel.appendChild(b);
    });

    function layout() {
      panel.classList.toggle('is-dropdown', isNarrow());
      asDropdown(panel, buttons, active, isNarrow());
    }
    window.addEventListener('resize', layout);
    layout();
    select(0, true);
    return { select: select };
  };
})(window.CS);

