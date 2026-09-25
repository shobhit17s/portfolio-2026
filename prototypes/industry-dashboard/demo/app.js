/* A prototype's own JavaScript. Nothing here can reach the portfolio, and
   nothing in the portfolio can reach in — the iframe sees to that. */
(function () {
  'use strict';
  var n = 0;
  var b = document.getElementById('prototype-demo-button');
  var out = document.getElementById('prototype-demo-count');
  b.addEventListener('click', function () {
    n += 1;
    out.textContent = 'clicked ' + n + (n === 1 ? ' time' : ' times');
  });
}());

