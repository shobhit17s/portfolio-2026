/* hw-config.js — the only file you need to touch to change the story.
   Worlds, their colours, what lives on them, and where the camera stands.
   Swap any `src` for a Procreate export at the same viewBox and it just works. */
window.HW = window.HW || {};
(function (HW) {
  'use strict';

  HW.PALETTE = {
    ink:      '#0B0F1C',   // the darkest line
    sky:      '#131829',   // toned paper we are drawing on
    chalk:    '#F2EDE1',   // white pencil
    chalkDim: '#8E98B4'
  };

  HW.SETTINGS = {
    fov: 40,               // degrees
    lightDir: { x: -0.42, y: 0.72, z: 0.55 },
    boilFps: 9,            // how often the hand-drawn line re-wobbles
    spinScale: 1,          // set by the spin control under each planet
    starCount: 150,
    assetBase: 'assets/'
  };

  /* The case study these objects open. Each object adds its own anchor, so a
     visitor lands on the part of the story that object stands for. A full web
     address opens in a new tab; a path like this one opens in place, and the
     case study has a link back to the worlds. */
  HW.CASE_STUDY_URL = 'case-studies/industry-dashboard/index.html';

  /* The pantheon on the north pole. This one is open to everybody: shared
     background that both case studies lean on, and no password in front of
     it. */
  HW.OPEN_PAGE_URL = 'case-studies/analyst-primer/index.html';

  /* The second case study. Its folder exists and its continent is on the
     planet; the writing is still to come. */
  HW.CASE_STUDY_2_URL = 'case-studies/case-study-two/index.html';

  /* Each world is a planet AND a page. The words live in index.html (so the
     page reads without JavaScript); this file holds only what the renderer
     needs. `href` is what the planet links to — point these at your real
     case-study pages when the site is assembled. */
  HW.WORLDS = [
    {
      id: 'home',
      nav: 'About',
      name: 'Home Hollow',
      href: '#hw-world-home',
      side: 'left',         // which side of the screen the writing sits on
      pin: true,            // the opening panel stays in the left margin
      lift: 0.06,           // nudge the planet down-screen
      color: { h: 132, s: 26, l: 56, drift: 10 },
      radius: 1.4,
      detail: 1,
      pos: { x: 0, y: 0, z: 0 },
      tilt: { x: -0.22, z: 0.12 },
      spin: 0.085,
      props: [
        { src: 'props/home-hut.svg',      lat: 26,  lon: 0,   size: 0.62 },
        { src: 'props/home-pine.svg',     lat: 6,   lon: 51,  size: 0.55 },
        { src: 'props/home-pine.svg',     lat: 44,  lon: 103, size: 0.45 },
        { src: 'props/home-pine.svg',     lat: -16, lon: 154, size: 0.48 },
        { src: 'props/home-pine.svg',     lat: 30,  lon: 206, size: 0.4 },
        { src: 'props/home-campfire.svg', lat: 4,   lon: 257, size: 0.3 },
        { src: 'props/home-hut.svg',      lat: -30, lon: 309, size: 0.45 }
      ],
      food: [
        { src: 'food/apple.svg',   lat: 10,  lon: 26,  size: 0.3 },
        { src: 'food/berries.svg', lat: -12, lon: 180, size: 0.28 }
      ]
    },
    {
      id: 'work',
      nav: 'Work',
      name: 'The Drafting Fields',
      href: '#hw-world-work',
      side: 'right',
      lift: 0.02,
      color: { h: 36, s: 58, l: 58, drift: 12 },
      radius: 2.1,
      detail: 2,
      pos: { x: 4.98, y: 3.54, z: -18.32 },
      tilt: { x: 0.18, z: -0.16 },
      spin: 0.17,

      /* Two continents, each one a case study. The password screen is
         currently OFF, so they open straight away — see common/access.js.
         Add a third by adding a third entry; nothing else needs to change.

         A continent is a SHEET OF FOAM: a separate piece of material, cut to
         shape and laid on the planet, the way the parts of an architectural
         model are made of different things. The planet underneath is whole and
         untouched. `rise` is the thickness of the sheet. */
      continents: [
        {
          id: 'cs-industry-dashboard',
          lat: -8, lon: 22,
          spread: 46,          // roughly how wide the piece is cut, in degrees
          rise: 0.034,         // how thick the foam sheet is
          color: { h: 192, s: 40, l: 60, drift: 8 },
          href: HW.CASE_STUDY_URL,
          locked: false,   // the password screen is off — see common/access.js
          label: 'Case study #1 \u2014 the industry dashboard'
        },
        {
          id: 'cs-two',
          lat: 14, lon: 132,
          spread: 38,
          rise: 0.03,
          color: { h: 12, s: 62, l: 60, drift: 8 },
          href: HW.CASE_STUDY_2_URL,
          locked: false,   // the password screen is off — see common/access.js
          label: 'Case study #2'
        }
      ],

      props: [
        /* The pantheon. `pole: true` puts it on the axis the planet turns
           around, so it never rotates out of sight, and keeps it lit. */
        { src: 'props/work-pantheon.svg', lat: 90, lon: 0, size: 1.15,
          pole: true, glow: true,
          href: HW.OPEN_PAGE_URL,
          label: 'How an analyst typically works' },
        { src: 'props/work-easel.svg',     lat: -4,  lon: 300, size: 0.44 },
        { src: 'props/work-flagstack.svg', lat: 30,  lon: 258, size: 0.4 }
      ],
      food: [
        { src: 'food/bun.svg',  lat: 8,   lon: 128, size: 0.44 },
        { src: 'food/cone.svg', lat: -14, lon: 282, size: 0.42 }
      ]
    },
    {
      id: 'play',
      nav: 'Play',
      name: 'The Tinker Belt',
      href: '#hw-world-play',
      side: 'left',
      lift: 0,
      color: { h: 248, s: 42, l: 60, drift: 14 },
      radius: 1.25,
      detail: 1,
      pos: { x: 6.97, y: -8.1, z: -25.2 },
      tilt: { x: 0.4, z: 0.3 },
      spin: 0.15,
      ring: true,
      props: [
        { src: 'props/play-balloon.svg',  lat: 32,  lon: 0,   size: 0.6 },
        { src: 'props/play-arch.svg',     lat: -6,  lon: 72,  size: 0.5 },
        { src: 'props/play-windmill.svg', lat: 16,  lon: 144, size: 0.46 },
        { src: 'props/play-arch.svg',     lat: 40,  lon: 216, size: 0.34 },
        { src: 'props/play-balloon.svg',  lat: -22, lon: 288, size: 0.4 }
      ],
      food: [
        { src: 'food/mushroom.svg', lat: 22,  lon: 36,  size: 0.3 },
        { src: 'food/melon.svg',    lat: -10, lon: 190, size: 0.28 }
      ]
    },
    {
      id: 'signal',
      nav: 'Contact',
      name: 'Signal Point',
      href: '#hw-world-signal',
      side: 'right',
      lift: 0.02,
      color: { h: 10, s: 50, l: 57, drift: 10 },
      radius: 1.45,
      detail: 1,
      pos: { x: -14.17, y: -11.5, z: -35.36 },
      tilt: { x: -0.3, z: 0.2 },
      spin: 0.1,
      props: [
        { src: 'props/signal-lighthouse.svg', lat: 36,  lon: 0,   size: 0.86 },
        { src: 'props/signal-antenna.svg',    lat: -2,  lon: 72,  size: 0.55 },
        { src: 'props/signal-buoy.svg',       lat: 8,   lon: 144, size: 0.32 },
        { src: 'props/signal-buoy.svg',       lat: -20, lon: 216, size: 0.3 },
        { src: 'props/signal-antenna.svg',    lat: 30,  lon: 288, size: 0.38 }
      ],
      food: [
        { src: 'food/cone.svg',    lat: 12, lon: 40,  size: 0.32 },
        { src: 'food/berries.svg', lat: -8, lon: 200, size: 0.3 }
      ]
    }
  ];

  /* Snacks. Every world grows a couple; click one and the traveller eats it.
     Purely for fun — nothing on the page depends on them. */
  HW.SNACKS = {
    fly: 0.62,      // seconds for a snack to sail over to him
    chew: 0.8,      // seconds of chewing
    regrow: 15      // seconds before the snack grows back
  };

  HW.CHARACTER = {
    // The traveller, drawn by hand. Three versions of the same strokes live in
    // assets/character/: 'hero-filled.png' is the drawing with its inside
    // filled in like paper, 'hero-ink.png' is exactly as drawn (open, no fill),
    // 'hero-chalk.png' is the same lines in white pencil. Swap the filename.
    src: 'character/hero-filled.png',
    size: 0.78,       // world units tall
    hover: -0.1,      // sink the feet slightly, so they meet the flat facets
    arc: 0.075,       // jump height, as a fraction of the distance travelled
    legTop: 0.466,    // where the legs meet the body, measured up from the soles
    bend: 0.62        // how far the knees fold when loading a jump
  };
})(window.HW);

