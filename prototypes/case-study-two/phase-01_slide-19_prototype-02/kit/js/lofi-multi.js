/* lofi-multi.js — SURFACE. Choosing several things, shown as pills.

   See css/lofi-multi.css for the markup and for why the pills are mist.

   WHAT IT ANNOUNCES. Every change fires `lofi:multi` on the element, with
   `detail.values` (an array of the chosen values, in list order) and
   `detail.reason` - 'pick', 'unpick', 'remove' or 'set'. The kit never
   decides what a choice MEANS; the prototype listens and decides.

   WHAT A PROTOTYPE CAN CALL:

       LOFI.multiValues(el)            -> ['management','downside']
       LOFI.multiSet(el, [...])        set the selection outright
       LOFI.multiDisable(el, v, true)  grey one option out, and drop it
                                       from the selection if it was in it

   THE LAST ONE IS THE WHOLE REASON THIS FILE HAS AN API at all. In the
   reference, picking a base case greys that case out of "compare to" -
   two fields that have to know about each other. The kit will not guess
   that relationship, so it exposes the lever and the prototype pulls it.
   =========================================================================== */
window.LOFI = window.LOFI || {};
(function (LOFI) {
  'use strict';

  var open = null;

  function items(el) {
    return [].slice.call(el.querySelectorAll('.lofi-multi-item'));
  }
  function chosen(el) {
    return items(el).filter(function (i) {
      return i.getAttribute('aria-selected') === 'true' &&
             i.getAttribute('aria-disabled') !== 'true';
    });
  }
  function valueOf(item) {
    return item.dataset.lofiValue || item.textContent.trim();
  }
  function tagOf(item) {
    return item.dataset.lofiTag || item.textContent.trim();
  }

  function say(el, reason) {
    el.dispatchEvent(new CustomEvent('lofi:multi', {
      bubbles: true,
      detail: { values: chosen(el).map(valueOf), reason: reason }
    }));
  }

  /* ---------- the pills in the field ---------- */
  function paint(el) {
    var tags = el.querySelector('.lofi-multi-tags');
    if (!tags) return;
    var on = chosen(el);
    if (!on.length) {
      tags.innerHTML = '<span class="lofi-multi-empty">' +
        (el.dataset.lofiEmpty || 'None selected') + '</span>';
      return;
    }
    tags.innerHTML = on.map(function (i) {
      var v = valueOf(i);
      return '<span class="lofi-tag" data-tag="' + v + '">' + tagOf(i) +
        '<span class="lofi-tag-x" role="button" tabindex="0" data-remove="' + v + '"' +
        ' aria-label="Remove ' + tagOf(i) + '">✕</span></span>';
    }).join('');
  }

  function close(el) {
    if (!el) return;
    var t = el.querySelector('.lofi-multi-trigger');
    var p = el.querySelector('.lofi-multi-panel');
    if (p) p.hidden = true;
    if (t) { t.classList.remove('is-open'); t.setAttribute('aria-expanded', 'false'); }
    if (open === el) open = null;
  }

  function show(el) {
    if (open && open !== el) close(open);
    var t = el.querySelector('.lofi-multi-trigger');
    var p = el.querySelector('.lofi-multi-panel');
    if (!t || !p) return;
    p.hidden = false;
    t.classList.add('is-open');
    t.setAttribute('aria-expanded', 'true');
    open = el;
    var first = p.querySelector('.lofi-multi-item:not([aria-disabled="true"])');
    if (first) first.focus();
  }

  /* ---------- turning one option on or off ----------
     THE PANEL STAYS OPEN. A single-choice list closes when you pick,
     because picking is the end of the job; here it is one step of it, and
     a list that shut after every tick would need reopening four times to
     choose four things. */
  function toggle(el, item) {
    if (!item || item.getAttribute('aria-disabled') === 'true') return;
    var on = item.getAttribute('aria-selected') === 'true';
    item.setAttribute('aria-selected', on ? 'false' : 'true');
    paint(el);
    say(el, on ? 'unpick' : 'pick');
  }

  function wire(el) {
    if (el.dataset.lofiMultiWired) return;
    el.dataset.lofiMultiWired = '1';
    var trigger = el.querySelector('.lofi-multi-trigger');
    var panel = el.querySelector('.lofi-multi-panel');
    if (!trigger || !panel) return;

    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    paint(el);

    trigger.addEventListener('click', function (e) {
      /* A PRESS ON A CROSS IS NOT A PRESS ON THE FIELD. Without this the
         field would open its list every time somebody removed a pill,
         which is the opposite of what they just asked for. */
      var x = e.target.closest && e.target.closest('.lofi-tag-x');
      if (x) {
        e.preventDefault();
        e.stopPropagation();
        remove(el, x.dataset.remove);
        return;
      }
      e.stopPropagation();
      if (panel.hidden) show(el); else close(el);
    });

    trigger.addEventListener('keydown', function (e) {
      var x = e.target.closest && e.target.closest('.lofi-tag-x');
      if (x && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        e.stopPropagation();
        remove(el, x.dataset.remove);
      }
    });

    panel.addEventListener('click', function (e) {
      var item = e.target.closest ? e.target.closest('.lofi-multi-item') : null;
      if (item) toggle(el, item);
    });

    el.addEventListener('keydown', function (e) {
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
        close(el); trigger.focus(); return;
      }
      var list = items(el).filter(function (i) {
        return i.getAttribute('aria-disabled') !== 'true';
      });
      var i = list.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); (list[i + 1] || list[0]).focus(); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); (list[i - 1] || list[list.length - 1]).focus(); }
      if ((e.key === 'Enter' || e.key === ' ') && i > -1) {
        e.preventDefault();
        toggle(el, list[i]);
      }
    });

    /* EVERY OPTION NEEDS ITS BOX, and writing twenty of them into the
       markup is twenty chances to forget one. The kit draws them. */
    items(el).forEach(function (it) {
      if (it.querySelector('.lofi-multi-box')) return;
      var box = document.createElement('span');
      box.className = 'lofi-multi-box';
      box.setAttribute('aria-hidden', 'true');
      it.insertBefore(box, it.firstChild);
    });
    paint(el);
  }

  function remove(el, value) {
    var hit = items(el).filter(function (i) { return valueOf(i) === value; })[0];
    if (!hit) return;
    hit.setAttribute('aria-selected', 'false');
    paint(el);
    say(el, 'remove');
  }

  document.addEventListener('click', function (e) {
    if (!open) return;
    if (e.target.closest && e.target.closest('.lofi-multi') === open) return;
    close(open);
  });

  /* ---------- the API ---------- */
  LOFI.multiValues = function (el) {
    el = typeof el === 'string' ? document.getElementById(el) : el;
    return el ? chosen(el).map(valueOf) : [];
  };

  LOFI.multiSet = function (el, values) {
    el = typeof el === 'string' ? document.getElementById(el) : el;
    if (!el) return;
    items(el).forEach(function (i) {
      i.setAttribute('aria-selected', values.indexOf(valueOf(i)) > -1 ? 'true' : 'false');
    });
    paint(el);
    say(el, 'set');
  };

  /* GREY ONE OPTION OUT. If it was chosen, it is also un-chosen - leaving
     a pill in the field for an option the list says is unavailable is the
     two halves of one control disagreeing in front of the reader. */
  LOFI.multiDisable = function (el, value, off) {
    el = typeof el === 'string' ? document.getElementById(el) : el;
    if (!el) return;
    items(el).forEach(function (i) {
      if (valueOf(i) !== value) return;
      if (off) {
        i.setAttribute('aria-disabled', 'true');
        i.setAttribute('aria-selected', 'false');
      } else {
        i.removeAttribute('aria-disabled');
      }
    });
    paint(el);
    say(el, 'set');
  };

  LOFI.initMulti = function (root) {
    var all = (root || document).querySelectorAll('[data-lofi-multi]');
    for (var i = 0; i < all.length; i++) wire(all[i]);
  };
})(window.LOFI);
