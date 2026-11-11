/* lofi-menu.js — SURFACE. Opening and closing an actions menu.

       <div class="lofi-menu" data-lofi-menu>
         <button class="lofi-btn lofi-menu-trigger">Actions</button>
         <div class="lofi-menu-panel" role="menu" hidden>
           <p class="lofi-menu-group">Export</p>
           <button class="lofi-menu-item" role="menuitem"
                   data-lofi-value="export-standard">Standard export</button>
         </div>
       </div>

   PRESSING AN ITEM DOES NOT DO ANYTHING. It closes the menu and announces
   `lofi:menu` with the item's value, and the prototype decides what that
   means. A kit that performed the action would have to know what
   "Standard export" IS, which it cannot and should not. */
window.LOFI = window.LOFI || {};
(function (LOFI) {
  'use strict';

  var open = null;   /* only one menu at a time, like every real menu */

  function close(menu) {
    if (!menu) return;
    var t = menu.querySelector('.lofi-menu-trigger');
    var p = menu.querySelector('.lofi-menu-panel');
    if (p) {
      p.hidden = true;
      p.style.position = ''; p.style.top = ''; p.style.left = ''; p.style.right = '';
    }
    if (t) { t.classList.remove('is-open'); t.setAttribute('aria-expanded', 'false'); }
    window.removeEventListener('scroll', onScroll, true);
    window.removeEventListener('resize', onScroll);
    if (open === menu) open = null;
  }

  /* =====================================================================
     A MENU INSIDE SOMETHING THAT CLIPS
     =====================================================================

     A kebab at the end of a table row is the common case and the awkward
     one. The table sits in a wrap that can scroll sideways, and a box that
     can scroll also CUTS OFF anything hanging out of it - which a menu on
     the last row does by definition. The menu opens, and half of it is
     simply not there.

     So before showing, we look up the tree for an ancestor that clips. If
     there is one, the panel is switched to `position: fixed` and placed
     from the trigger's position on screen. A fixed box is measured against
     the window rather than against its parent, so nothing can clip it.

     IT IS ONLY DONE WHEN NEEDED. A fixed panel does not move when the page
     scrolls underneath it, so the menu closes on scroll in that case -
     which is what every menu does anyway, and is less wrong than a panel
     left floating over the wrong row. */
  function clipper(el) {
    var n = el.parentNode;
    while (n && n !== document.body && n.nodeType === 1) {
      var o = getComputedStyle(n);
      if (o.overflow !== 'visible' || o.overflowX !== 'visible' || o.overflowY !== 'visible') return n;
      n = n.parentNode;
    }
    return null;
  }

  /* =====================================================================
     "ON SCREEN" MEANS SOMETHING DIFFERENT INSIDE A SCALED CANVAS
     =====================================================================

     A prototype on a lofi-stage is drawn at 1440 x 1024 and then scaled by
     a CSS transform. Two things follow, and both bite here:

       1  getBoundingClientRect() answers in SCREEN pixels, which are the
          canvas's own pixels multiplied by the scale. Placing a panel with
          those numbers puts it in roughly the right place at scale 1 and
          nowhere near it at scale 0.6.

       2  a `position: fixed` box inside a transformed ancestor is NOT
          fixed to the window at all - a transform makes its ancestor the
          thing it measures against. Which is lucky, because that ancestor
          is the canvas, and the canvas is exactly where we want it.

     So when there is a stage, everything is done in the canvas's own
     coordinates: divide the measured rectangle by the scale, and treat the
     canvas rather than the window as the edge to stay inside. Without a
     stage, the window IS the canvas and the same code runs with a scale of
     one. */
  function stageOf(el) {
    return el.closest ? el.closest('[data-lofi-stage]') : null;
  }

  function frame(el) {
    var stage = stageOf(el);
    if (!stage) {
      return { left: 0, top: 0, scale: 1,
               width: window.innerWidth, height: window.innerHeight };
    }
    var r = stage.getBoundingClientRect();
    var scale = r.width / (stage.offsetWidth || 1);
    return { left: r.left, top: r.top, scale: scale || 1,
             width: stage.offsetWidth, height: stage.offsetHeight };
  }

  function place(trigger, panel) {
    panel.style.position = '';
    panel.style.top = '';
    panel.style.left = '';
    panel.style.right = '';

    var f = frame(panel);
    var raw = trigger.getBoundingClientRect();
    /* the trigger, in the canvas's own units */
    var r = {
      left:   (raw.left   - f.left) / f.scale,
      right:  (raw.right  - f.left) / f.scale,
      top:    (raw.top    - f.top)  / f.scale,
      bottom: (raw.bottom - f.top)  / f.scale
    };

    panel.hidden = false;                           /* must be laid out to measure */
    var w = panel.offsetWidth;
    var h = panel.offsetHeight;

    /* TWO SEPARATE REASONS TO LIFT IT OUT, and the first one is easy to
       forget: something between here and the page may CLIP it, or there
       may simply be no room left below it. The last row of a long list
       hits the second one even when nothing clips at all. */
    var clipped = !!clipper(panel);
    var noRoomBelow = r.bottom + h + 8 > f.height;
    if (!clipped && !noRoomBelow) return false;     /* leave it where it is */

    panel.style.position = 'fixed';

    /* hang it from the trigger's right edge, and flip above if there is
       no room below - the last row of a long table is exactly where a
       menu would otherwise run off the bottom of the window */
    var left = Math.max(8, Math.min(r.right - w, f.width - w - 8));
    var top = (r.bottom + h + 8 > f.height && r.top - h - 8 > 0)
            ? r.top - h - 8
            : r.bottom + 8;
    panel.style.left = left + 'px';
    panel.style.top = top + 'px';
    panel.style.right = 'auto';
    return true;
  }

  function show(menu) {
    if (open && open !== menu) close(open);
    var t = menu.querySelector('.lofi-menu-trigger');
    var p = menu.querySelector('.lofi-menu-panel');
    if (!t || !p) return;
    p.hidden = false;
    var lifted = place(t, p);
    t.classList.add('is-open');
    t.setAttribute('aria-expanded', 'true');
    open = menu;
    if (lifted) {
      /* a fixed panel cannot follow the thing it belongs to */
      window.addEventListener('scroll', onScroll, true);
      window.addEventListener('resize', onScroll);
    }
    var first = p.querySelector('.lofi-menu-item:not([disabled])');
    if (first) first.focus();
  }

  function onScroll() { close(open); }

  function items(menu) {
    return [].slice.call(menu.querySelectorAll('.lofi-menu-item:not([disabled])'));
  }

  function wire(menu) {
    if (menu.dataset.lofiMenuWired) return;
    menu.dataset.lofiMenuWired = '1';
    var trigger = menu.querySelector('.lofi-menu-trigger');
    var panel = menu.querySelector('.lofi-menu-panel');
    if (!trigger || !panel) return;

    trigger.setAttribute('aria-haspopup', 'menu');
    trigger.setAttribute('aria-expanded', 'false');

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      if (panel.hidden) show(menu); else close(menu);
    });

    panel.addEventListener('click', function (e) {
      var item = e.target.closest ? e.target.closest('.lofi-menu-item') : null;
      if (!item || item.disabled) return;
      close(menu);
      /* FOCUS GOES BACK TO THE TRIGGER. Without this, a keyboard reader is
         left standing on an element that has just been hidden, and the
         next Tab starts again from the top of the page. */
      trigger.focus();
      menu.dispatchEvent(new CustomEvent('lofi:menu', {
        bubbles: true,
        detail: { value: item.dataset.lofiValue || item.textContent.trim(), item: item }
      }));
    });

    menu.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { close(menu); trigger.focus(); return; }
      var list = items(menu);
      var i = list.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); (list[i + 1] || list[0]).focus(); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); (list[i - 1] || list[list.length - 1]).focus(); }
      if (e.key === 'Home')      { e.preventDefault(); list[0] && list[0].focus(); }
      if (e.key === 'End')       { e.preventDefault(); list[list.length - 1].focus(); }
    });
  }

  /* ONE LISTENER ON THE DOCUMENT, not one per menu. A click anywhere that
     is not inside the open menu closes it - which is what every menu
     everywhere does, and what a reader will try first. */
  document.addEventListener('click', function (e) {
    if (!open) return;
    if (e.target.closest && e.target.closest('.lofi-menu') === open) return;
    close(open);
  });

  LOFI.initMenus = function (root) {
    var all = (root || document).querySelectorAll('[data-lofi-menu]');
    for (var i = 0; i < all.length; i++) wire(all[i]);
  };
  LOFI.closeMenus = function () { close(open); };
})(window.LOFI);

