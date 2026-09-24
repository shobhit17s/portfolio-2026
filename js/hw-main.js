/* hw-main.js — load the drawings, start the sky, hand the page to the scroller. */
window.HW = window.HW || {};
(function (HW) {
  'use strict';

  /* Load a drawing - or a short list of them, best first.

     A slot can name a STAND-IN: the drawing you want, followed by whatever
     should hold the place until it arrives. The browser tells us when a file
     is not there, so the list simply walks along to the next one.

         src: ['props/play-baobab.png', 'props/home-pine.png']

     This is what lets a planet be laid out before its drawings exist. Add a
     file with the right name and it appears on the next reload; nothing in
     the configuration has to change, and nothing looks broken in between. */
  function load(src) {
    var list = Array.isArray(src) ? src.slice() : [src];
    var img = new Image();
    img.decoding = 'async';
    var i = 0;
    img.addEventListener('error', function () {
      if (i < list.length) {
        // the file we wanted is not there; fall back, and say so
        standins.push([list[0], list[i]]);
        img.src = HW.SETTINGS.assetBase + list[i++];
        announce();
        return;
      }
      missing.push(list);           // nothing in the list arrived
      announce();
    });
    img.src = HW.SETTINGS.assetBase + list[i++];
    return img;
  }

  /* ---------- saying so when a drawing does not arrive ----------

     A missing drawing used to fail in SILENCE. The renderer skips any prop
     whose picture has no width, which is right - half a tree is worse than
     no tree - but it meant a file in the wrong folder, or saved by Windows as
     "home-pine (1).png", looked exactly like a planet that was supposed to be
     bare. That is a bad half hour for anybody.

     So now the page says which files it went looking for and did not find.
     Open the browser's console (F12) and it is the first thing there. */
  var missing = [];
  var standins = [];
  var pending = 0;
  function announce() {
    clearTimeout(pending);
    pending = setTimeout(function () {
      if (standins.length) {
        var seen = {};
        console.warn(
          'Some drawings are being STOOD IN FOR. The planet is not bare, but what\n' +
          'you are looking at is not the drawing the page wanted:\n\n' +
          standins.filter(function (s) {
            if (seen[s[0]]) return false; seen[s[0]] = 1; return true;
          }).map(function (s) {
            return '   wanted assets/' + s[0] + '\n   showing assets/' + s[1];
          }).join('\n\n') +
          '\n\nIf one of those is a drawing you have already made, it is not in the\nfolder the page is looking in.');
      }
      if (!missing.length) return;
      var lines = missing.map(function (l) {
        return l.length > 1
          ? '   assets/' + l[0] + '   (nor its stand-in, assets/' + l[l.length - 1] + ')'
          : '   assets/' + l[0];
      });
      console.warn(
        'Some drawings did not arrive, so the things they stand for are not on\n' +
        'their planets. Each line is a file the page looked for and could not find:\n\n' +
        lines.join('\n') +
        '\n\nThree things this usually is:\n' +
        '   the file is not in that folder yet\n' +
        '   Windows saved it as "name (1).png" - rename it\n' +
        '   it is in the wrong folder: props go in assets/props/, snacks in assets/food/');
    }, 500);
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


