/* lofi-combo.js — SURFACE. Choosing from a drawn list.

       <div class="lofi-combo" data-lofi-combo>
         <button class="lofi-combo-trigger">
           <span class="lofi-combo-said">Credit case</span>
           <span class="lofi-caret">▾</span>
         </button>
         <div class="lofi-combo-panel" role="listbox" hidden>
           <button class="lofi-combo-item" role="option"
                   aria-selected="true">Credit case</button>
         </div>
       </div>

   The trigger's `.lofi-combo-said` is rewritten to whatever is chosen, so
   a prototype never has to keep the label in step by hand. */
window.LOFI = window.LOFI || {};
(function (LOFI) {
  'use strict';

  var open = null;

  function close(combo) {
    if (!combo) return;
    var t = combo.querySelector('.lofi-combo-trigger');
    var p = combo.querySelector('.lofi-combo-panel');
    if (p) p.hidden = true;
    if (t) { t.classList.remove('is-open'); t.setAttribute('aria-expanded', 'false'); }
    if (open === combo) open = null;
  }

  function show(combo) {
    if (open && open !== combo) close(open);
    var t = combo.querySelector('.lofi-combo-trigger');
    var p = combo.querySelector('.lofi-combo-panel');
    if (!t || !p) return;
    p.hidden = false;
    t.classList.add('is-open');
    t.setAttribute('aria-expanded', 'true');
    open = combo;
    var on = p.querySelector('.lofi-combo-item[aria-selected="true"]') ||
             p.querySelector('.lofi-combo-item');
    if (on) on.focus();
  }

  function choose(combo, item) {
    var items = [].slice.call(combo.querySelectorAll('.lofi-combo-item'));
    items.forEach(function (i) {
      i.setAttribute('aria-selected', i === item ? 'true' : 'false');
    });
    var said = combo.querySelector('.lofi-combo-said');
    if (said) said.textContent = item.textContent.trim();
    close(combo);
    var t = combo.querySelector('.lofi-combo-trigger');
    if (t) t.focus();
    combo.dispatchEvent(new CustomEvent('lofi:combo', {
      bubbles: true,
      detail: { value: item.dataset.lofiValue || item.textContent.trim(), item: item }
    }));
  }

  function wire(combo) {
    if (combo.dataset.lofiComboWired) return;
    combo.dataset.lofiComboWired = '1';
    var trigger = combo.querySelector('.lofi-combo-trigger');
    var panel = combo.querySelector('.lofi-combo-panel');
    if (!trigger || !panel) return;

    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      if (panel.hidden) show(combo); else close(combo);
    });

    panel.addEventListener('click', function (e) {
      var item = e.target.closest ? e.target.closest('.lofi-combo-item') : null;
      if (item) choose(combo, item);
    });

    combo.addEventListener('keydown', function (e) {
      /* ESCAPE CLOSES THE NEAREST THING, NOT THE WHOLE STACK. These
         lists live inside a modal, and the modal also listens for
         Escape on the document. Without `stopPropagation` one press
         shut the list AND the modal behind it, so a reader who opened
         the wrong dropdown lost everything they had set. And the guard
         matters as much as the stop: with the list already shut,
         Escape has to travel on and close the modal, which is what a
         reader means by it the second time. */
      if (e.key === 'Escape') {
        if (panel.hidden) return;
        e.stopPropagation();
        close(combo); trigger.focus(); return;
      }
      var list = [].slice.call(combo.querySelectorAll('.lofi-combo-item'));
      var i = list.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); (list[i + 1] || list[0]).focus(); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); (list[i - 1] || list[list.length - 1]).focus(); }
      if ((e.key === 'Enter' || e.key === ' ') && i > -1) { e.preventDefault(); choose(combo, list[i]); }
    });
  }

  document.addEventListener('click', function (e) {
    if (!open) return;
    if (e.target.closest && e.target.closest('.lofi-combo') === open) return;
    close(open);
  });

  LOFI.initCombos = function (root) {
    var all = (root || document).querySelectorAll('[data-lofi-combo]');
    for (var i = 0; i < all.length; i++) wire(all[i]);
  };
})(window.LOFI);
