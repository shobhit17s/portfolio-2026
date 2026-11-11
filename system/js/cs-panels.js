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

  /* A BAR THAT STAYS A BAR ON A PHONE.

     Every tab bar on this site collapses into a dropdown below 820, and for
     most of them that is right: a row of six world names has nowhere to go
     on a phone, so it becomes one control that opens.

     The tab series is different. It has two tabs with short names, they fit
     side by side on the narrowest phone, and - this is the part that
     decides it - the bar FOLLOWS THE READER DOWN the whole chapter. A
     choice that is already in front of you should not have to be opened to
     be seen.

     So a bar can say "keep me". It is one class, set by whoever builds the
     bar, and it changes nothing for any bar that does not ask. */
  function keepsItsShape(panel) {
    return panel.classList.contains('cs-tab-panel--keep');
  }

  /* `start` is which tab is open when the bar is first drawn. It defaults
     to the first, which is what every caller wanted until the tab series
     came along and had to be able to reopen on the one the reader chose
     earlier in the visit. It is selected QUIETLY - `onChange` is not
     called for it - because the caller that asked for it is about to draw
     that tab's contents itself, and calling it would draw them twice. */
  CS.makeTabs = function (panel, items, onChange, start) {
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
        if (isNarrow() && !keepsItsShape(panel) &&
            !panel.classList.contains('is-open') && i === active) {
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
      var narrow = isNarrow() && !keepsItsShape(panel);
      panel.classList.toggle('is-dropdown', narrow);
      asDropdown(panel, buttons, active, narrow, overflow);

      /* A PANEL THAT FILLS ITS CONTAINER HAS NO OVERFLOW TO WORK OUT, and
         must not try. The sums below measure each tab and park the ones
         that do not fit in a "+2" menu - which assumes a tab is as wide as
         its words. Filling tabs are as wide as the room divided between
         them, so the measurement comes out as "they only just fit" at any
         number of them, and the last one gets hidden for no reason. I
         watched it hide the second of two.

         Filling tabs cannot overflow by definition: more of them means
         each is narrower, and a long label trims itself with an ellipsis.
         Past five or six that gets tight, which is a reason to use a
         filling bar only where the tabs are few - not a reason for this
         file to guess. */
      if (panel.classList.contains('cs-tab-panel--fill')) {
        overflow.style.display = 'none';
        buttons.forEach(function (b) { b.style.display = ''; });
        return;
      }

      if (narrow) {
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
    var first = parseInt(start, 10);
    if (!(first >= 0 && first < items.length)) first = 0;
    select(first, true);
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


