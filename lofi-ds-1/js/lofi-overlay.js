/* lofi-overlay.js — SURFACE. Modals and drawers, which are the same
   problem wearing two coats.

   Both of them: cover the page, dim what is behind, take the keyboard,
   give it back when they close. Only the shape differs, and the shape is
   entirely in CSS - so there is one script rather than two.

       <div class="lofi-scrim" data-lofi-scrim hidden></div>
       <div class="lofi-modal" id="export" data-lofi-overlay hidden
            role="dialog" aria-modal="true" aria-labelledby="export-title">…</div>

       LOFI.openOverlay('export');   LOFI.closeOverlay();

   WHAT "TAKING THE KEYBOARD" MEANS, and why it is worth the thirty lines:
   an overlay that does not trap focus lets Tab walk out of the dialog and
   into the page behind it, which is still there and still focusable. A
   sighted reader sees the dialog; a keyboard reader is typing into a form
   they cannot see. */
window.LOFI = window.LOFI || {};
(function (LOFI) {
  'use strict';

  var CATCHES = 'a[href], button:not([disabled]), input, select, textarea, ' +
                '[tabindex]:not([tabindex="-1"])';
  var current = null;
  var cameFrom = null;

  function scrim() { return document.querySelector('[data-lofi-scrim]'); }

  function focusable(el) {
    return [].slice.call(el.querySelectorAll(CATCHES)).filter(function (n) {
      return n.offsetParent !== null || n === document.activeElement;
    });
  }

  LOFI.openOverlay = function (id) {
    var el = typeof id === 'string' ? document.getElementById(id) : id;
    if (!el) { if (window.console) console.warn('[lofi] no overlay "' + id + '"'); return; }
    if (current) LOFI.closeOverlay();

    cameFrom = document.activeElement;
    var s = scrim();
    if (s) s.hidden = false;
    el.hidden = false;
    current = el;
    document.body.style.overflow = 'hidden';

    var first = focusable(el)[0];
    if (first) first.focus(); else el.focus();

    el.dispatchEvent(new CustomEvent('lofi:overlay-open', { bubbles: true, detail: { el: el } }));
  };

  LOFI.closeOverlay = function () {
    if (!current) return;
    var el = current;
    el.hidden = true;
    var s = scrim();
    if (s) s.hidden = true;
    document.body.style.overflow = '';
    current = null;
    /* BACK WHERE THEY STARTED. The button that opened it is where a
       reader expects to be standing when it shuts. */
    if (cameFrom && cameFrom.focus) cameFrom.focus();
    cameFrom = null;
    el.dispatchEvent(new CustomEvent('lofi:overlay-close', { bubbles: true, detail: { el: el } }));
  };

  document.addEventListener('keydown', function (e) {
    if (!current) return;
    if (e.key === 'Escape') { e.preventDefault(); LOFI.closeOverlay(); return; }
    if (e.key !== 'Tab') return;

    /* the trap: Tab off the end wraps to the start, and back off the
       start wraps to the end */
    var list = focusable(current);
    if (!list.length) return;
    var first = list[0], last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  LOFI.initOverlays = function (root) {
    var where = root || document;

    /* a press on the dimming closes - every dialog does this */
    var s = scrim();
    if (s && !s.dataset.lofiScrimWired) {
      s.dataset.lofiScrimWired = '1';
      s.addEventListener('click', function () { LOFI.closeOverlay(); });
    }

    /* anything that says which overlay it opens or closes is wired here,
       so a prototype usually writes no JavaScript for this at all */
    var openers = where.querySelectorAll('[data-lofi-opens]');
    for (var i = 0; i < openers.length; i++) {
      (function (b) {
        if (b.dataset.lofiOpensWired) return;
        b.dataset.lofiOpensWired = '1';
        b.addEventListener('click', function () { LOFI.openOverlay(b.dataset.lofiOpens); });
      })(openers[i]);
    }
    var closers = where.querySelectorAll('[data-lofi-closes]');
    for (var j = 0; j < closers.length; j++) {
      (function (b) {
        if (b.dataset.lofiClosesWired) return;
        b.dataset.lofiClosesWired = '1';
        b.addEventListener('click', function () { LOFI.closeOverlay(); });
      })(closers[j]);
    }
  };
})(window.LOFI);

