/* app.js — the behaviour of THIS prototype.

   THE SCREEN IS BUILT FROM DATA, not written out as markup, because the
   point of a prototype like this is usually the RULE rather than the
   picture: change the threshold and watch which cells light up. A table
   typed out by hand cannot demonstrate that. */
(function () {
  'use strict';

  /* `rising` says which direction is good news. Leverage going up is bad;
     revenue going up is good. Getting this wrong is the classic dashboard
     mistake - a wall of green while the business is on fire. */
  var ATTRIBUTES = [
    { name: 'Revenue',       plan: 500,  rising: 'good', q: [485, 455, 420],    unit: ''   },
    { name: 'EBITDA',        plan: 70,   rising: 'good', q: [64, 54, 43],       unit: ''   },
    { name: 'EBITDA margin', plan: 14.0, rising: 'good', q: [13.2, 11.9, 10.2], unit: '%'  },
    { name: 'Leverage',      plan: 3.5,  rising: 'bad',  q: [3.9, 4.6, 5.8],    unit: 'x'  },
    { name: 'Cashflow',      plan: 42,   rising: 'good', q: [35, 22, 10],       unit: ''   }
  ];

  var body = document.getElementById('ptp-rows');
  var table = document.getElementById('ptp-table');

  function cell(text, cls) {
    var td = document.createElement('td');
    td.textContent = text;
    if (cls) td.className = cls;
    return td;
  }

  function build() {
    body.innerHTML = '';
    ATTRIBUTES.forEach(function (a) {
      var tr = document.createElement('tr');

      var head = cell(a.name, 'lofi-rowhead');
      /* THE ONE ATTRIBUTE THE WASH NEEDS: lofi-table.js reads this off the
         row head to decide whether "up" is good news on this row. */
      if (a.rising === 'bad') head.setAttribute('data-lofi-invert', '');
      tr.appendChild(head);

      tr.appendChild(cell(a.plan + a.unit, 'lofi-divide'));

      a.q.forEach(function (actual) {
        var delta = actual - a.plan;
        var pct = a.plan ? (delta / a.plan) * 100 : 0;

        tr.appendChild(cell(actual + a.unit, 'lofi-divide is-clickable'));

        var d = cell((delta > 0 ? '+' : '') + Math.round(delta * 10) / 10 + a.unit);
        /* the wash is judged on the PERCENTAGE, so one threshold can apply
           to revenue in millions and to leverage in multiples */
        d.dataset.lofiDelta = pct.toFixed(1);
        d.dataset.lofiValue = a.name + ': ' + delta.toFixed(1) + a.unit +
                              ' (' + pct.toFixed(1) + '% off plan)';
        d.classList.add('is-clickable');
        tr.appendChild(d);
      });

      body.appendChild(tr);
    });
    LOFI.initTables(document);
  }

  build();

  /* CHANGING THE THRESHOLD IS THE WHOLE DEMONSTRATION. Nothing is rebuilt:
     the numbers do not change, only which of them the screen thinks are
     worth looking at. */
  var picker = document.getElementById('ptp-threshold');
  picker.addEventListener('change', function () {
    table.dataset.lofiThreshold = picker.value;
    document.getElementById('ptp-threshold-said').textContent = picker.value;
    LOFI.washTable(table);
  });

  document.addEventListener('lofi:cell', function (e) {
    var v = e.detail.value;
    document.getElementById('ptp-readout').innerHTML =
      'You picked <strong>' + v + '</strong>.';
  });

  document.getElementById('ptp-add').addEventListener('click', function () {
    ATTRIBUTES.push({ name: 'New attribute', plan: 100, rising: 'good',
                      q: [96, 88, 71], unit: '' });
    build();
  });
})();

