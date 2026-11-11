/* lofi-segmented.js — CONTROL. Which lens on the same answer.

       <div class="lofi-segmented" data-lofi-segmented role="tablist">
         <button class="lofi-segmented-btn" role="tab" aria-controls="view-table"
                 aria-selected="true" aria-label="Table"><svg…></button>
       </div>

   Same wiring idea as the tabs: `aria-controls` names the pane, so there
   is no second list. It is a separate block from `tabs` only because it
   LOOKS entirely different and means something different - "same content,
   another lens" rather than "different content". */
window.LOFI = window.LOFI || {};
(function (LOFI) {
  'use strict';

  function btns(group) {
    return [].slice.call(group.querySelectorAll('.lofi-segmented-btn'));
  }

  function show(group, btn) {
    btns(group).forEach(function (b) {
      var on = b === btn;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
      var id = b.getAttribute('aria-controls');
      if (!id) return;
      var pane = document.getElementById(id);
      if (pane) pane.hidden = !on;
    });
    window.dispatchEvent(new Event('resize'));
    group.dispatchEvent(new CustomEvent('lofi:segment', {
      bubbles: true,
      detail: { value: btn.dataset.lofiValue || btn.getAttribute('aria-label') || '', btn: btn }
    }));
  }

  function wire(group) {
    if (group.dataset.lofiSegmentedWired) return;
    group.dataset.lofiSegmentedWired = '1';
    var list = btns(group);
    if (!list.length) return;

    group.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('.lofi-segmented-btn') : null;
      if (b && group.contains(b)) show(group, b);
    });

    group.addEventListener('keydown', function (e) {
      var i = list.indexOf(document.activeElement);
      if (i === -1) return;
      var to = null;
      if (e.key === 'ArrowRight') to = list[i + 1] || list[0];
      if (e.key === 'ArrowLeft')  to = list[i - 1] || list[list.length - 1];
      if (!to) return;
      e.preventDefault();
      to.focus();
      show(group, to);
    });

    var start = list.filter(function (b) {
      return b.getAttribute('aria-selected') === 'true';
    })[0] || list[0];
    show(group, start);
  }

  LOFI.initSegmented = function (root) {
    var all = (root || document).querySelectorAll('[data-lofi-segmented]');
    for (var i = 0; i < all.length; i++) wire(all[i]);
  };
})(window.LOFI);

