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

    var scene = HW.createScene(canvas, HW.WORLDS);

    // every drawing is an ordinary file — swap the file, swap the world
    var cache = {};
    scene.planets.forEach(function (planet) {
      planet.props.concat(planet.food).forEach(function (prop) {
        if (!cache[prop.src]) cache[prop.src] = load(prop.src);
        prop.img = cache[prop.src];
      });
    });
    scene.character.setImage(load(HW.CHARACTER.src));

    // The objects on a planet are drawn into the canvas, so they cannot be
    // reached with a keyboard. Build the same doors as real links, hidden
    // until something inside them takes focus.
    var doors = document.getElementById('hw-doors');
    if (doors) {
      var list = doors.querySelector('ul');
      HW.WORLDS.forEach(function (w) {
        (w.props || []).forEach(function (prop) {
          if (!prop.href) return;
          var li = document.createElement('li');
          var a = document.createElement('a');
          a.href = prop.href;
          a.textContent = prop.label || w.name;
          if (/^https?:/i.test(prop.href)) { a.target = '_blank'; a.rel = 'noopener'; }
          li.appendChild(a);
          list.appendChild(li);
        });
      });
      if (list.children.length) doors.hidden = false;
    }

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

