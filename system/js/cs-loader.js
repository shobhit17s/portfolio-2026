/* cs-loader.js — the loader that plays over a prototype as you reach it.

   WHAT IT DOES

   A prototype slide used to sit there showing a button until somebody
   pressed it. Now, the moment the slide comes far enough into view, the
   loader starts, the prototype begins loading behind it, and when both
   are done the loader wipes away to reveal a running prototype. One
   movement, no click.

   IT ONLY EVER TOUCHES PROTOTYPES. The selector is `.cs-proto-window` and
   nothing else. A drawing, a photograph, a video, a flow chart - none of
   them get a loader, because none of them has anything to wait for.

   THE PROGRESS BAR IS HONEST-ISH, AND WORTH BEING STRAIGHT ABOUT. An
   iframe will not tell you how far through it is; there is no such number
   to read. So the bar is an eased sweep over a fixed duration, exactly as
   the design mockup drew it, and the loader does not leave until BOTH the
   sweep has finished AND the prototype has actually said `load`. If the
   prototype is slow the loader waits past 100%; if it is instant the
   loader still plays, because a flash of spinner reads as a glitch and a
   held beat reads as deliberate.

   WHY IT STARTS THE PROTOTYPE AT ALL, and the cost of that

   Loading on scroll means a reader who scrolls through a long case study
   starts every prototype on the way past, and each one is a live iframe.
   On a deck with several that is real memory. Two things hold it down:
   each prototype starts once and only once, and only when 55% of it is on
   screen. If that is still too much for a particular slide, put
   `loader: false` in its media entry and it goes back to the button.

   AND THE WAY TO SEE IT AGAIN. The reload button under the window plays
   the whole thing a second time and builds the prototype fresh with it -
   see CS.reloadProto further down. It is the only way back out of a
   prototype a reader has walked into a corner of.

   Run:  CS.initProtoLoaders()  - called by cs-main.js after render.
         CS.initProtoReload()   - same, for the buttons. */
window.CS = window.CS || {};
(function (CS) {
  'use strict';

  var SEEN = 'csLoaderDone';
  var RATIO = 0.55;              /* how much must be on screen to start */
  var SWEEP = 2800;              /* ms for the bar, as the mockup had it */
  var HOLD  = 250;               /* the beat at 100% before it leaves */
  var EXIT  = 1200;              /* shrink + wipe, matching the stylesheet */

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  var SVG = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs) {
    var n = document.createElementNS(SVG, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }
  function g(cls) { return svg('g', { 'class': cls }); }
  function p(cls, d, extra) {
    var a = { 'class': cls, d: d };
    for (var k in (extra || {})) a[k] = extra[k];
    return svg('path', a);
  }

  /* THE RINGS, PATH FOR PATH FROM THE MOCKUP. The wobble in these numbers
     is the whole character of the thing - a circle drawn with four perfect
     arcs looks machined, and the point of this site is that nothing does.
     They are copied exactly rather than regenerated. */
  function rings(size) {
    var s = svg('svg', {
      'class': 'cs-ld', width: size, height: size,
      viewBox: '0 0 100 100', 'aria-hidden': 'true', focusable: 'false'
    });

    var track = g('cs-ld-boil cs-ld-b2');
    track.appendChild(p('cs-ld-track', 'M 50 5.5 C 75 5, 95 24, 94.5 50 C 94 76, 75 95, 49 94.5 C 24 94, 5.5 75, 6 49 C 6.5 25, 26 6, 53 6.8'));
    track.appendChild(p('cs-ld-track', 'M 47 6.5 C 73 6, 93.5 26, 93.8 51 C 94 77, 74 94, 50 93.6 C 25 93.2, 6.5 74, 6.4 50 C 6.3 26, 25 7.5, 51 5.6'));
    s.appendChild(track);

    var outer = g('cs-ld-outer'), ob = g('cs-ld-boil');
    ob.appendChild(p('cs-ld-arc-o', 'M 50 6.3 C 75 5.8, 94.2 25, 94 50.5 C 93.8 76, 74 94.3, 49.5 94 C 33 93.8, 19 85, 12 72.5', { pathLength: '100' }));
    ob.appendChild(p('cs-ld-arc-o2', 'M 51 7.5 C 76 7.5, 92.6 26, 92.8 50 C 93 74, 73 93, 50 92.8', { pathLength: '100' }));
    outer.appendChild(ob); s.appendChild(outer);

    var mid = g('cs-ld-mid'), mb = g('cs-ld-boil cs-ld-b3');
    mb.appendChild(p('cs-ld-arc-m', 'M 50 20 C 66 19.5, 80 32, 80.5 48'));
    mb.appendChild(p('cs-ld-arc-m2', 'M 51.5 21.8 C 66 21.5, 78.5 33, 78.8 50'));
    mid.appendChild(mb); s.appendChild(mid);

    var orbit = g('cs-ld-orbit');
    orbit.appendChild(svg('circle', { 'class': 'cs-ld-dot', cx: 50.5, cy: 34.5, r: 2.4 }));
    orbit.appendChild(p('cs-ld-dot-s', 'M 47 33.5 c 2 -3 6.5 -2 6.5 1 c 0 3.2 -4.5 4 -6.5 1.8 c -1.6 -2 0.5 -4.6 3.5 -3.8'));
    s.appendChild(orbit);

    var core = g('cs-ld-core');
    core.appendChild(p('cs-ld-star', 'M 50 42.5 L 50.6 57.5 M 43.2 46.2 L 57 54 M 57.2 45.6 L 42.8 54.2'));
    s.appendChild(core);
    return s;
  }

  var SQUIGGLE = 'M 2 7 C 20 2, 30 12, 48 7 S 78 2, 96 7 S 126 12, 158 6';

  function build(size, says) {
    var box = el('div', 'cs-loader');
    box.setAttribute('role', 'status');
    box.setAttribute('aria-live', 'polite');
    box.appendChild(el('i', 'cs-ld-hatch'));

    var wrap = el('div', 'cs-loader-wrap');
    wrap.appendChild(rings(size));

    var meta = el('div', 'cs-ld-meta');
    meta.appendChild(el('p', 'cs-ld-says', says));

    var bar = svg('svg', { 'class': 'cs-ld-bar', width: 160, height: 14,
                           viewBox: '0 0 160 14', 'aria-hidden': 'true' });
    bar.appendChild(p('cs-ld-bar-track', SQUIGGLE, { 'stroke-width': 2 }));
    var fill = p('cs-ld-bar-fill', SQUIGGLE,
                 { 'stroke-width': 3, pathLength: '100',
                   'stroke-dasharray': '100 100', 'stroke-dashoffset': '100' });
    bar.appendChild(fill);
    meta.appendChild(bar);

    var pct = el('p', 'cs-ld-pct', '0%');
    meta.appendChild(pct);
    wrap.appendChild(meta);
    box.appendChild(wrap);
    return { box: box, fill: fill, pct: pct };
  }

  /* ---------- one prototype ---------- */
  function attach(slot) {
    if (slot.dataset[SEEN]) return;
    slot.dataset[SEEN] = '1';

    /* the button the engine would have shown; pressing it is what loads
       the prototype, so the loader presses it instead of reaching into
       cs-prototype.js and duplicating what `load()` does */
    var start = slot.querySelector('.cs-embed-start');
    if (!start) return;                       /* nothing to wait for */

    var size = Math.max(64, Math.min(120,
      Math.round(slot.getBoundingClientRect().height * 0.18))) || 104;
    var made = build(size, 'Loading prototype…');
    slot.appendChild(made.box);

    var t0 = Date.now(), tick = null, swept = false, loaded = false, gone = false;

    /* A WAY TO CALL THIS ONE OFF. Pressing reload rebuilds what is inside
       the slot, which throws away the loader that is on screen - but not
       the interval still ticking behind it, which would go on writing
       percentages into an element nobody can see and, worse, would still
       be running when the second loader started. One line here, and the
       reload in CS.reloadProto below can retire the old one cleanly. */
    slot.csLoaderStop = function () {
      if (tick) { window.clearInterval(tick); tick = null; }
      gone = true;
    };

    function finish() {
      if (gone || !swept || !loaded) return;
      gone = true;
      window.setTimeout(function () {
        made.box.classList.add('is-exit');
        window.setTimeout(function () {
          if (made.box.parentNode) made.box.parentNode.removeChild(made.box);
        }, EXIT);
      }, HOLD);
    }

    tick = window.setInterval(function () {
      var t = Math.min(1, (Date.now() - t0) / SWEEP);
      /* the mockup's easing: slow, quick through the middle, slow */
      var e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      var n = Math.round(e * 100);
      made.fill.setAttribute('stroke-dashoffset', String(100 - n));
      made.pct.textContent = n + '%';
      if (t >= 1) { window.clearInterval(tick); swept = true; finish(); }
    }, 40);

    /* start the prototype behind the loader */
    start.click();

    /* AN IFRAME SAYS `load` WHEN IT IS READY; anything else is ready the
       moment it is in the page. The timeout is the backstop for a
       prototype that never fires - better a loader that leaves on its own
       than one that spins for ever over a broken path. */
    var frame = slot.querySelector('iframe');
    if (frame) {
      var done = function () { loaded = true; finish(); };
      frame.addEventListener('load', done, { once: true });
      window.setTimeout(done, 12000);
    } else {
      loaded = true;
    }
    finish();
  }

  /* =====================================================================
     DOING IT ALL AGAIN - the reload button under the window
     =====================================================================

     WHAT PRESSING IT ACTUALLY DOES, in order:

         1  stops the sweep that may still be running
         2  empties the slot and builds its resting panel again, which
            is what throws the old prototype away
         3  forgets that this slot was ever loaded
         4  starts over - loader, press, wait, wipe

     WHY THE WHOLE THING AND NOT JUST `iframe.src = iframe.src`. Setting
     the source again reloads the page inside the frame, but it does not
     put the loader back, and the reader would be looking at a frozen
     prototype for however long it takes with nothing to say why. Rebuilt
     from the resting panel, a reload looks exactly like arriving at the
     slide for the first time, which is the only thing it could sensibly
     look like.

     AND IT IS A REAL RESET, not a refresh. Whatever the reader had typed
     into the prototype, whichever screen they had walked to, is gone -
     that is the point of the button, and it is why it says Reload rather
     than something softer.

     ONE SLOT AT A TIME. On a slide with two prototypes this touches only
     the one on screen; the other goes on running exactly as it was left.

     A SLOT WITH THE LOADER TURNED OFF (`loader: false`) still resets -
     it simply comes back as the press-to-start panel it would have been,
     with no animation over it. */
  CS.reloadProto = function (win) {
    if (!win) return;

    if (typeof win.csLoaderStop === 'function') {
      win.csLoaderStop();
      win.csLoaderStop = null;
    }

    var name = win.dataset.csSlot;
    var embed = CS.PrototypeEmbed;
    if (!embed || !embed.fill || !name) return;
    embed.fill(win, name, embed.lookup ? embed.lookup(name) : null);

    delete win.dataset[SEEN];
    if (win.dataset.csLoader === 'off') return;   /* reset, but no replay */
    attach(win);
  };

  /* The button is built by the prototype template; the wiring is here,
     next to the thing it replays. Which window it acts on is decided at
     the moment of the press rather than when it is wired, because on a
     slide with two the answer changes as the reader steps. */
  CS.initProtoReload = function (root) {
    var btns = (root || document).querySelectorAll('[data-cs-proto-reload]');
    Array.prototype.forEach.call(btns, function (b) {
      if (b.dataset.csReloadWired) return;
      b.dataset.csReloadWired = '1';
      b.addEventListener('click', function () {
        var col = b.closest('.cs-proto-column');
        if (!col) return;
        var win = col.querySelector('.cs-proto-window.is-showing') ||
                  col.querySelector('.cs-proto-window');
        if (!win) return;

        /* the mark turns once, so the press is acknowledged even when the
           prototype behind it comes back instantly */
        b.classList.remove('is-turning');
        void b.offsetWidth;                /* restart the animation */
        b.classList.add('is-turning');

        CS.reloadProto(win);
      });
    });
  };

  /* ---------- watching for them ---------- */
  CS.initProtoLoaders = function (root) {
    var slots = (root || document).querySelectorAll('.cs-proto-window');
    if (!slots.length) return;

    if (!window.IntersectionObserver) {
      /* no observer: fall back to the button, which is what was there
         before. Not loading everything at once is the kinder failure. */
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.intersectionRatio < RATIO) return;
        io.unobserve(e.target);
        attach(e.target);
      });
    }, { threshold: [0, RATIO, 1] });

    slots.forEach(function (s) {
      if (s.dataset.csLoader === 'off') return;   /* `loader: false` */
      io.observe(s);
    });
  };
})(window.CS);
