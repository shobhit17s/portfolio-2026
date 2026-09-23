/* hw-main.js — load the drawings, start the sky, hand the page to the scroller. */
window.HW = window.HW || {};
(function (HW) {
  'use strict';

  function load(src) {
    var img = new Image();
    img.decoding = 'async';
    img.src = HW.SETTINGS.assetBase + src;
    return img;
  }

  HW.boot = function () {
    var canvas = document.getElementById('hw-sky');
    if (!canvas) return;

    /* ---------- the sky's colour comes from the stylesheet ----------

       The planets, the stars and the sky itself are painted onto a canvas,
       and a canvas is not styled by CSS: it is a picture, and the page has to
       be told what colour to paint. So before anything is drawn the scene
       ASKS the stylesheet what light and dark currently mean, and it has to
       ask again every time that changes - otherwise the writing and the
       buttons switch over and the sky stays where it was.

       It is asked in two ways on purpose, because one of them is a safety
       net rather than a duplicate:

         the event      the switch announces a change the moment it makes one
         the watcher    something is WATCHING the <html> element's
                        data-cs-mode attribute, so the sky follows even when
                        the change came from somewhere that sends no event -
                        another tab, a stored choice being applied on load,
                        or anything added later.

       The watcher is the one that matters. An event can be forgotten by
       whoever should have sent it; the attribute cannot lie, because it is
       the same attribute every stylesheet on the site is reading. */
    HW.readPalette();
    window.addEventListener('hw:mode', function () { HW.readPalette(); });

    if (window.MutationObserver) {
      new MutationObserver(function () { HW.readPalette(); })
        .observe(document.documentElement, {
          attributes: true, attributeFilter: ['data-cs-mode']
        });
    }

    var scene = HW.createScene(canvas, HW.WORLDS);

    // every drawing is an ordinary file — swap the file, swap the world
    var cache = {};
    scene.planets.forEach(function (planet) {
      planet.props.concat(planet.food).forEach(function (prop) {
        if (!cache[prop.src]) cache[prop.src] = load(prop.src);
        prop.img = cache[prop.src];
      });
    });
    /* The traveller. If a hop sheet is named in hw-config.js, that is the
       whole of him and the single standing drawing is not even fetched; take
       the sheet away and the old drawing comes back, with the jump faked out
       of it as it was before. Two ways to be right, never both at once. */
    var hop = HW.CHARACTER.sprite && HW.CHARACTER.sprite.src;
    if (hop) scene.character.setSheet(load(HW.CHARACTER.sprite.src));
    else scene.character.setImage(load(HW.CHARACTER.src));

    // The objects on a planet are drawn into the canvas, so they cannot be
    // reached with a keyboard. Build the same doors as real links, hidden
    // until something inside them takes focus.
    var doors = document.getElementById('hw-doors');
    if (doors) {
      var list = doors.querySelector('ul');
      HW.WORLDS.forEach(function (w) {
        /* Both the objects standing on a planet and the moons going round it
           are links; the keyboard route has to offer all of them. */
        (w.props || []).concat(w.moons || []).forEach(function (prop) {
          if (!prop.href && !prop.drawer) return;
          var li = document.createElement('li');
          /* Two kinds of door need two kinds of control: one goes somewhere,
             so it is a link; the other opens a panel on this page, so it is
             a button. Writing a button as a link would tell a screen reader
             the page is about to change when it is not. */
          var node;
          if (prop.drawer) {
            node = document.createElement('button');
            node.type = 'button';
            node.dataset.hwDrawer = prop.drawer;
          } else {
            node = document.createElement('a');
            node.href = prop.href;
            if (/^https?:/i.test(prop.href)) { node.target = '_blank'; node.rel = 'noopener'; }
          }
          node.textContent = prop.label || w.name;
          li.appendChild(node);
          list.appendChild(li);
        });
      });
      if (list.children.length) doors.hidden = false;
    }

    /* The panel that slides in over the worlds, and the one thing on a
       planet that opens it. */
    HW.drawer = HW.createDrawer();
    scene.onDrawer(function (id) { HW.drawer.open(id); });

    scene.begin();
    HW.ui = HW.createTravelUI(scene, HW.WORLDS);
    HW.scene = scene;
    document.body.classList.add('hw-ready');
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', HW.boot);
  } else {
    HW.boot();
  }
})(window.HW);


