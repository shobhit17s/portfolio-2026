/* cs-grid.js — the one measurement a pinned grid cannot do without.

   =========================================================================
   WHAT THIS IS FOR
   =========================================================================

   The grid slide pins its first two columns so they stay put while the
   attributes scroll sideways underneath. Pinning in CSS means saying HOW
   FAR FROM THE LEFT EDGE each pinned thing should stop:

       the grouping column    0 - it sits on the edge
       the items column       exactly where the grouping column ends

   And that second number cannot be written down. The grouping column is as
   wide as the longest group name in it, which depends on the words, the
   typeface, and how wide the screen is. A guess that is a few units out
   does not look slightly wrong - it leaves a gap the attributes slide
   through, or it covers the first letters of every item name.

   So this file asks the browser for the number after it has laid the grid
   out, and writes it back as a custom property the stylesheet reads. That
   is the whole job.

   =========================================================================
   WHEN IT HAS TO ASK AGAIN
   =========================================================================

       the window is resized, or a phone is turned
       the handwriting font arrives and every name re-measures

   Both change the answer and neither is something the reader did. A
   ResizeObserver covers the first; document.fonts.ready the second.

   IF THIS NEVER RUNS the grid still works: the property falls back to 0,
   which puts the items column hard against the left edge. It is wrong
   sideways-scrolled and perfectly fine not scrolled, which is the right way
   round for something to fail. */
window.CS = window.CS || {};
(function (CS) {
  'use strict';

  function measure(grid) {
    if (!grid || !grid.classList.contains('is-grouped')) return;

    /* The first cell of the grouping column. Its width is the distance the
       items column has to stand off by. Reading the grid's own computed
       column list would work too, and is worse: it gives the TRACK sizes,
       and a track is not where a cell starts once a gap is involved. */
    var first = grid.querySelector('.cs-grid-group, .cs-grid-head.is-frozen');
    if (!first) return;
    var w = first.getBoundingClientRect().width;
    if (!w) return;                       /* not laid out yet; try later */
    grid.style.setProperty('--cs-grid-split', w.toFixed(2) + 'px');
  }

  function measureAll(root) {
    var list = (root || document).querySelectorAll('.cs-grid');
    for (var i = 0; i < list.length; i++) measure(list[i]);
  }

  CS.initGrids = function (root) {
    measureAll(root || document);

    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
          var g = entries[i].target.closest ? entries[i].target.closest('.cs-grid') : null;
          measure(g || entries[i].target);
        }
      });
      var grids = document.querySelectorAll('.cs-grid');
      for (var i = 0; i < grids.length; i++) {
        ro.observe(grids[i]);
        /* the grouping cell too: the grid's own width can stay the same
           while the column inside it changes, which is exactly what
           happens when a longer group name is written */
        var g = grids[i].querySelector('.cs-grid-group');
        if (g) ro.observe(g);
      }
      CS._gridRO = ro;
    } else {
      window.addEventListener('resize', function () { measureAll(document); });
    }

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { measureAll(document); });
    }

    CS.remeasureGrids = measureAll;
  };

  CS.remeasureGrids = measureAll;
})(window.CS);

