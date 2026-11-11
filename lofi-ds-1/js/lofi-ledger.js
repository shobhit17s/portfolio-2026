/* lofi-ledger.js — CONTENT. Drawing a model out of its data.

       LOFI.drawLedger(el, {
         years:    [2026, … ],
         sections: [ { id, no, name, rows: [ {key,label,format,sub,rule} ] } ],
         values:   { 'financial-summary': { revenue: [ … ] } }
       });

   THE SHAPE AND THE FIGURES ARE SEPARATE ARGUMENTS, and that is the whole
   idea. `sections` says what the document IS - which sections, which rows,
   in what order, read how. `values` is one case's numbers. Switching the
   case hands the same shape a different set of figures, so there is only
   ever one description of the document and no chance of two cases quietly
   disagreeing about what rows exist.

   NOTHING IS HIGHLIGHTED HERE. See the note at the top of
   lofi-ledger.css: a ledger is looked things up in, not read for a
   finding, so no cell is washed and no row is marked. The comparison
   table is where colour belongs. */
window.LOFI = window.LOFI || {};
(function (LOFI) {
  'use strict';

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* ---------- HOW A FIGURE IS WRITTEN ----------

     One decimal everywhere except a multiple, which gets two, because the
     difference between 3.74x and 3.7x of leverage is the difference
     between two covenant answers.

     A MINUS SIGN, NOT BRACKETS. Accounting brackets are correct and most
     readers of a credit model know them, but this is a lo-fi prototype
     being read by designers and stakeholders as often as by analysts, and
     a minus is the version nobody has to be taught. */
  var WRITE = {
    num:  function (v) { return v.toFixed(1); },
    pct:  function (v) { return v.toFixed(1) + '%'; },
    x:    function (v) { return v.toFixed(2) + 'x'; },
    days: function (v) { return v.toFixed(1); }
  };

  function cell(v, format) {
    if (v === null || v === undefined) {
      return '<td class="lofi-ledger-none">&mdash;</td>';
    }
    var write = WRITE[format] || WRITE.num;
    var cls = v < 0 ? ' class="lofi-ledger-neg"' : '';
    return '<td' + cls + '>' + esc(write(v)) + '</td>';
  }

  function section(sec, values, years) {
    var vals = values[sec.id] || {};
    var out = [];
    out.push('<section class="lofi-ledger-section" data-lofi-section="' +
             esc(sec.id) + '">');
    out.push('<h3 class="lofi-ledger-head">' +
             (sec.no ? '<span class="lofi-ledger-no">Section #' + sec.no +
                       ':</span> ' : '') +
             esc(sec.name) + '</h3>');

    out.push('<table class="lofi-ledger-table">');
    /* the spine is declared as a column so every section measures the same
       and the uprights line up down the page */
    out.push('<colgroup><col class="lofi-ledger-spine">' +
             new Array(years.length + 1).join('<col>') + '</colgroup>');
    out.push('<caption class="lofi-sr">' + esc(sec.name) + '</caption>');

    out.push('<thead><tr><th scope="col" class="lofi-ledger-metric">Metric</th>');
    years.forEach(function (y) {
      out.push('<th scope="col">' + esc(y) + '</th>');
    });
    out.push('</tr></thead><tbody>');

    sec.rows.forEach(function (row) {
      var series = vals[row.key] || [];
      var cls = [];
      if (row.sub)  cls.push('lofi-ledger-row--sub');
      if (row.rule) cls.push('lofi-ledger-row--rule');
      out.push('<tr' + (cls.length ? ' class="' + cls.join(' ') + '"' : '') + '>');
      out.push('<th scope="row" class="lofi-ledger-metric' +
               (row.sub ? ' lofi-ledger-metric--sub' : '') + '">' +
               esc(row.label) + '</th>');
      years.forEach(function (y, i) { out.push(cell(series[i], row.format)); });
      out.push('</tr>');
    });

    out.push('</tbody></table></section>');
    return out.join('');
  }

  LOFI.drawLedger = function (el, cfg) {
    if (!el || !cfg || !cfg.sections) return;
    /* kept on the element so a later swap needs only the new figures */
    el._lofiLedger = cfg;
    var years = cfg.years || [];
    var values = cfg.values || {};
    el.classList.add('lofi-ledger');
    el.innerHTML = cfg.sections.map(function (s) {
      return section(s, values, years);
    }).join('');
    el.dispatchEvent(new CustomEvent('lofi:ledger', {
      bubbles: true,
      detail: { sections: cfg.sections.length, years: years.length }
    }));
  };

  /* SWAPPING ONE CASE FOR ANOTHER keeps the scroll position, because the
     reader is almost always comparing the same row under two cases and
     being thrown back to the top each time would make that impossible.
     The short fade is there so the figures are visibly replaced rather
     than appearing to have been wrong a moment ago. */
  LOFI.swapLedger = function (el, values) {
    if (!el || !el._lofiLedger) return;
    var top = el.scrollTop;
    el.classList.add('is-swapping');
    el._lofiLedger.values = values;
    window.setTimeout(function () {
      LOFI.drawLedger(el, el._lofiLedger);
      el.scrollTop = top;
      el.classList.remove('is-swapping');
    }, 120);
  };
})(window.LOFI);

