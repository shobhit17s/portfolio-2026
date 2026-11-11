/* lofi-table.js — selecting a cell, and washing cells from a threshold.

   =========================================================================
   TWO SMALL JOBS, DELIBERATELY SEPARATE
   =========================================================================

   1  SELECTION. One cell in a table can be the chosen one, outlined. The
      reference shows it on the +14.5% in 2030. Purely a display state;
      the table does not care what it means.

   2  THE WASH. A cell can be marked significantly good or bad. In a real
      product a server decides that. In a prototype you want to say "wash
      anything more than 15% off plan" once and have the table do it, so
      that changing the threshold changes the screen - which is the thing
      the prototype exists to demonstrate.

   The wash can also simply be written into the markup as a class. That is
   the right answer for a screen where the point is the layout rather than
   the rule; this file is for when the rule is the point. */
window.LOFI = window.LOFI || {};
(function (LOFI) {
  'use strict';

  var SELECTED = 'is-selected';

  /* ---------------------------------------------------------------------
     SELECTION
     --------------------------------------------------------------------- */
  function wire(table) {
    if (table.dataset.lofiTableWired) return;
    table.dataset.lofiTableWired = '1';

    /* ONLY CELLS THAT SAY THEY ARE CLICKABLE. A table where every cell
       lights up on hover reads as a spreadsheet; one where only the
       meaningful cells do reads as a tool. The markup decides, with
       `.is-clickable`. */
    table.addEventListener('click', function (e) {
      var cell = e.target.closest ? e.target.closest('td.is-clickable') : null;
      if (!cell || !table.contains(cell)) return;
      select(table, cell);
    });

    table.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var cell = document.activeElement;
      if (!cell || !cell.matches || !cell.matches('td.is-clickable')) return;
      e.preventDefault();
      select(table, cell);
    });

    /* a clickable cell has to be reachable without a mouse */
    [].forEach.call(table.querySelectorAll('td.is-clickable'), function (c) {
      if (!c.hasAttribute('tabindex')) c.tabIndex = 0;
    });
  }

  function select(table, cell) {
    [].forEach.call(table.querySelectorAll('td.' + SELECTED), function (c) {
      c.classList.remove(SELECTED);
      c.removeAttribute('aria-current');
    });
    cell.classList.add(SELECTED);
    cell.setAttribute('aria-current', 'true');
    table.dispatchEvent(new CustomEvent('lofi:cell', {
      bubbles: true,
      detail: {
        cell: cell,
        value: cell.dataset.lofiValue !== undefined
             ? cell.dataset.lofiValue : cell.textContent.trim(),
        row: cell.closest('tr'),
        column: [].indexOf.call(cell.parentNode.children, cell)
      }
    }));
  }

  /* ---------------------------------------------------------------------
     THE WASH
     ---------------------------------------------------------------------

     Every cell that should be judged carries its number as data:

         <td data-lofi-delta="-80">-80</td>

     and the table says what counts as significant:

         <table class="lofi-table" data-lofi-threshold="15">

     A POSITIVE DELTA IS NOT ALWAYS GOOD NEWS. Leverage going up is bad;
     revenue going up is good. So a row can turn the meaning over with
     `data-lofi-invert` on its row head, and the wash follows the meaning
     rather than the sign. Getting this wrong is the classic dashboard
     mistake - a sea of green on the page while the business is on fire. */
  LOFI.washTable = function (table) {
    var limit = parseFloat(table.dataset.lofiThreshold);
    if (isNaN(limit)) return;

    [].forEach.call(table.querySelectorAll('td[data-lofi-delta]'), function (td) {
      var v = parseFloat(td.dataset.lofiDelta);
      td.classList.remove('lofi-cell--pos', 'lofi-cell--neg');
      if (isNaN(v)) return;
      if (Math.abs(v) < limit) return;

      var row = td.closest('tr');
      var invert = row && row.querySelector('[data-lofi-invert]') !== null;
      var good = invert ? v < 0 : v > 0;

      td.classList.add(good ? 'lofi-cell--pos' : 'lofi-cell--neg');
      /* SAID IN WORDS AS WELL AS IN COLOUR. A wash a reader cannot see is
         a wash that means nothing to them, and `title` costs one line. */
      td.title = good ? 'Significant positive deviation'
                      : 'Significant negative deviation';
    });
  };

  LOFI.initTables = function (root) {
    var tables = (root || document).querySelectorAll('.lofi-table');
    for (var i = 0; i < tables.length; i++) {
      wire(tables[i]);
      LOFI.washTable(tables[i]);
    }
  };

  LOFI.selectCell = function (cell) {
    var t = cell.closest('.lofi-table');
    if (t) select(t, cell);
  };
})(window.LOFI);
