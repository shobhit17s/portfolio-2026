/* hw-config.js — the only file you need to touch to change the story.
   Worlds, their colours, what lives on them, and where the camera stands.
   Swap any `src` for a Procreate export at the same viewBox and it just works. */
window.HW = window.HW || {};
(function (HW) {
  'use strict';

  /* THE PALETTE IS READ FROM THE STYLESHEET, not written here.

     The canvas cannot use a CSS variable directly - it wants a colour string
     - so once the page has loaded we ask the browser what those variables
     currently resolve to and copy the answers in here. That way the drawing
     and the writing are the same colours, and switching between light and
     dark changes both at once. The values below are only what stands in for
     the half-second before the first read. */
  HW.PALETTE = {
    ink:      '#0A0D0A',
    sky:      '#0A0D0A',
    chalk:    '#B1C4C6',
    chalkDim: '#57798D'
  };

  HW.readPalette = function () {
    var cs = getComputedStyle(document.documentElement);
    function token(name, fallback) {
      var value = cs.getPropertyValue(name).trim();
      return value || fallback;
    }
    /* The sky is the site's SECONDARY background, not its primary one. The
       primary is the colour a page of writing sits on; out here the writing
       floats over a drawing, and the secondary reads as one step further
       back - which is what deep space should be. One line to change if you
       want them the same again. */
    HW.PALETTE.sky      = token('--cs-bg-2', '#0D1B18');
    HW.PALETTE.ink      = token('--cs-bg-2', '#0D1B18');
    HW.PALETTE.chalk    = token('--cs-text-1', '#B1C4C6');
    HW.PALETTE.chalkDim = token('--cs-text-2', '#57798D');
    /* Canvas cannot read a stylesheet: writing on it needs a font stack
       spelled out in full. These are the same two faces the page itself is
       set in, taken from common/type.css, so a word painted onto a planet is
       in the same hand as the words beside it. */
    HW.PALETTE.bodyFace = token('--t-body-face',
      "'Nunito', 'Trebuchet MS', 'Helvetica Neue', Arial, sans-serif");
    HW.PALETTE.displayFace = token('--t-display-face',
      "'Shantell Sans', 'Bradley Hand', 'Segoe Print', cursive");
    return HW.PALETTE;
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
      color: { h: 83, s: 28, l: 48, drift: 10 },   /* accent: forest */
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
      color: { h: 38, s: 97, l: 45, drift: 12 },   /* accent: sun */
      /* This one was the biggest of the four and crowded its own moons out.
         `zoom` holds the camera where it stood for the old 2.1, so the planet
         genuinely occupies less of the screen instead of the camera quietly
         walking in to compensate. See anchor() in hw-scene.js. */
      radius: 1.7,
      zoom: 1.18,
      detail: 2,
      pos: { x: 4.98, y: 3.54, z: -18.32 },
      tilt: { x: 0.18, z: -0.16 },
      spin: 0.17,

      /* TWO MOONS, each one a case study.

         They used to be continents - pieces cut out of this planet's own
         surface. A moon says something truer: a case study is a whole piece
         of work with its own shape and its own colour, in orbit around the
         body of work rather than carved out of it. It also reads at a glance,
         which a continent only did once it had rotated into view.

         Each moon is a small planet in its own right: same hand-drawn facets,
         same glow, its own accent colour. Add a third by adding a third
         entry; nothing else needs to change.

           orbit   how far out it circles, in world units
           tilt    how far the orbit is tipped away from edge-on, in radians,
                   so the two do not run round the same flat ring
           phase   where on that circle it starts, 0 to 1
           speed   how fast it goes round

         The password screen is off, so they open straight away - see
         common/access.js. */
      moons: [
        {
          id: 'cs-industry-dashboard',
          /* What is written across the moon's face. Two lines, stacked: a
             small one over a big one. The engine shrinks them until the
             whole block fits inside the circle, so a long name is safe -
             it simply arrives smaller. */
          mark: { small: 'case study', big: 'Key Industry Metrics' },
          radius: 0.72,
          orbit: 3.1, tilt: 0.95, phase: 0.06, speed: 0.085,
          spin: 0.24, axis: { x: 0.24, z: -0.12 },
          color: { h: 196, s: 41, l: 39, drift: 8 },   /* accent: water */
          href: HW.CASE_STUDY_URL,
          locked: true,
          label: 'Case study #1 \u2014 the industry dashboard'
        },
        {
          id: 'cs-two',
          /* Placeholder until this one has a name of its own. */
          mark: { small: 'case study', big: 'Number two' },
          radius: 0.58,
          orbit: 3.7, tilt: -0.85, phase: 0.54, speed: 0.062,
          spin: 0.19, axis: { x: -0.18, z: 0.2 },
          color: { h: 11, s: 61, l: 56, drift: 8 },    /* accent: fire */
          href: HW.CASE_STUDY_2_URL,
          locked: true,
          label: 'Case study #2'
        }
      ],

      props: [
        /* The pantheon. `pole: true` puts it on the axis the planet turns
           around, so it never rotates out of sight, and keeps it lit. */
        /* The pantheon stands for the shared background the whole case
           study leans on, so pressing it opens that explanation HERE rather
           than sending the reader off the page for it. The panel's words are
           in common/drawers.js, which the case study reads too - press the
           same idea inside the study and you get the same panel.

           To make it a door to the primer again, swap `drawer` for
           `href: HW.OPEN_PAGE_URL`. Both still work. */
        { src: 'props/work-pantheon.svg', lat: 90, lon: 0, size: 0.98,
          pole: true, glow: true,
          drawer: 'sme',
          label: 'What an industry SME actually does' },
        { src: 'props/work-easel.svg',     lat: -4,  lon: 300, size: 0.37 },
        { src: 'props/work-flagstack.svg', lat: 30,  lon: 258, size: 0.34 }
      ],
      food: [
        { src: 'food/bun.svg',  lat: 8,   lon: 128, size: 0.37 },
        { src: 'food/cone.svg', lat: -14, lon: 282, size: 0.36 }
      ]
    },
    {
      id: 'play',
      nav: 'Play',
      name: 'The Tinker Belt',
      href: '#hw-world-play',
      side: 'left',
      lift: 0,
      color: { h: 324, s: 36, l: 41, drift: 14 },  /* accent: mist */
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
      color: { h: 11, s: 61, l: 56, drift: 10 },   /* accent: fire */
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
    bend: 0.62,       // how far the knees fold when loading a jump

    /* ---------- the hop, drawn out ----------

       Sixteen drawings on one sheet: seven rows, one per state, up to three
       columns each. The numbers below are measured from the sheet itself, so
       if you re-export it, re-measure these three:

         cell     512 x 640, the size of one box in the grid
         ground   562  - how far DOWN from the top of a box the line his feet
                         stand on is. The page plants him by his feet, so this
                         is what stops him sinking into a planet.
         height   483  - from that line up to the top of his head in the FIRST
                         standing drawing. Every other drawing is measured
                         against this one, which is why a crouch reads as a
                         crouch: nothing is rescaled to fit its own box.

       Set src back to null and the whole jump is faked from the single
       standing drawing again, as it was before the sheet existed. */
    sprite: {
      src: 'character/hero-hop.png',
      cell: { w: 512, h: 640 },
      ground: 562,
      height: 483,
      states: {
        stand:  { row: 0, frames: 2, loop: true, fps: 1.6 },  // breathing
        crouch: { row: 1, frames: 3 },   // sinking, gathering
        launch: { row: 2, frames: 2 },   // the push off
        rise:   { row: 3, frames: 2 },   // going up, tucked
        fall:   { row: 4, frames: 2 },   // coming down, arms out
        land:   { row: 5, frames: 3 },   // impact, absorbed
        settle: { row: 6, frames: 2 }    // straightening up
      }
    }
  };
})(window.HW);


