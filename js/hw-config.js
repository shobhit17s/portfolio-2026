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

    /* ---- the two pieces of writing PAINTED ONTO THE DRAWING ----

       The name that appears when you point at a door, and the diagrammatic
       labels that are always there. Both are set by a named role like
       everything else on the site - block 2e of common/type-scale.css - but
       a canvas cannot read a stylesheet, so the browser is asked what those
       roles currently resolve to and the answers are assembled into the one
       string a canvas wants: "<size> <family>".

       THE PHONE SIZE IS CHOSEN HERE rather than by a media query, for the
       same reason: there is no element for a media query to apply to. 820
       is the width the rest of the site changes its mind at, so it is the
       width this changes its mind at too. */
    var narrow = window.innerWidth < 820;
    function painted(role, fallbackSize) {
      var size = token('--t-hw-' + role + (narrow ? '-phone' : ''), '') ||
                 token('--t-hw-' + role, fallbackSize);
      var hand = token('--t-hw-' + role + '-hand', '') ||
                 HW.PALETTE.bodyFace;
      return size + ' ' + hand;
    }
    HW.PALETTE.hoverFace = painted('hover', '21px');
    HW.PALETTE.noteFace  = painted('diagram', '23px');
    return HW.PALETTE;
  };

  /* ---------- WHAT AN OBJECT SAYS, ASKED IN ONE PLACE ----------

     Both the drawing and the hidden keyboard list at the foot of the page
     need the name of a door, and they used to find it two different ways -
     which is how the keyboard list ended up calling all four tiles on
     Signal Point "Signal Point". One answer, one function, both callers.

     It answers '' for an object with no id, an id the copy file does not
     mention, or a copy file that never arrived. The words are a nicety; the
     planet is not. */
  HW.says = function (id, key) {
    if (!id) return '';
    var all = (window.SITE && SITE.LANDING && SITE.LANDING.objects) || null;
    var one = all && all[id];
    return (one && one[key]) || '';
  };

  /* DOES THE COPY FILE KNOW THIS OBJECT AT ALL?

     This is what lets you say NOTHING. Without it, taking a `hover` line
     out of the copy file fell back to whatever was written in this file -
     so the name you had just deleted carried on appearing, and there was
     no way at all to have an object that says nothing on hover.

     The rule now: IF THE COPY FILE MENTIONS AN ID, THE COPY FILE IS THE
     WHOLE TRUTH FOR THAT OBJECT, including its silences. Delete the
     `hover` line and there is no hover name. Only an object the copy file
     has never heard of falls back to anything written here, which is what
     keeps a half-finished copy file from emptying the page. */
  HW.knows = function (id) {
    if (!id) return false;
    var all = (window.SITE && SITE.LANDING && SITE.LANDING.objects) || null;
    return !!(all && Object.prototype.hasOwnProperty.call(all, id));
  };

  /* The always-on label on an object: { text, place, lean } or null. */
  HW.noteFor = function (id) {
    var n = HW.says(id, 'label');
    if (!n || !n.text) return null;
    return { text: n.text, place: n.place || 'north', lean: n.lean || 1 };
  };

  HW.SETTINGS = {
    fov: 40,               // degrees
    lightDir: { x: -0.42, y: 0.72, z: 0.55 },
    boilFps: 9,            // how often the hand-drawn line re-wobbles
    spinScale: 1,          // set by the spin control under each planet
    starCount: 150,
    assetBase: 'assets/'
  };

  /* WHERE THE CASE STUDIES LIVE IS NOT HERE ANY MORE.

     They are in common/catalogue.js, one entry each: what the study is
     called, what its card says, and which page the card opens. The planet
     no longer carries doors to them - the pantheon opens the catalogue, and
     the catalogue is the only list of them there is. One place to rename a
     study, one place to add a third. */

  /* ---------- where the things on Signal Point go ----------

     THE ADDRESSES ARE NOT WRITTEN HERE ANY MORE. They are in
     common/landing-copy.js, under `links`, with every other word and
     address on the page - so there is one file to open when something
     changes and it is never this one.

     What is left here is the FALLBACK, which exists for one reason: this
     file is read before the page is drawn, and if the copy file has not
     arrived the tiles still have to be something rather than undefined. A
     tile pointing at '#' does nothing when pressed, which is honest; a
     tile pointing at `undefined` navigates to a page that does not
     exist. */
  var COPY = (window.SITE && SITE.LANDING) || {};
  var FROM_COPY = COPY.links || {};

  HW.LINKS = {
    linkedin:  FROM_COPY.linkedin  || '#',
    instagram: FROM_COPY.instagram || '#',
    /* AN ADDRESS RATHER THAN A LINK. Pressing the email tile copies it; it
       does not navigate anywhere. See openDoor() in js/hw-scene.js. */
    email:     FROM_COPY.email     || '',
    emailCopied: FROM_COPY.emailCopied || 'email copied to clipboard',
    resume:    FROM_COPY.resume    || '#',
    /* a resume is a file to keep rather than a page to look at, so pressing
       it saves it instead of opening it. Set `links.download` to false in
       the copy file and it opens in a tab like everything else. */
    resumeDownload: FROM_COPY.download !== false
  };

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
      lift: 0.06,           // nudge the planet down-screen
      color: { h: 83, s: 28, l: 48, drift: 10 },   /* accent: forest */
      radius: 1.4,
      detail: 1,
      pos: { x: 0, y: 0, z: 0 },
      tilt: { x: -0.22, z: 0.12 },
      spin: 0.085,
      /* Four pines, two houses and a leopard. Sizes are HEIGHTS IN WORLD
         UNITS - the traveller is 0.98 and this planet's radius is 1.4, so a
         1.25 pine stands a little taller than he does.

         Each `src` may be a LIST: the drawing wanted, then whatever holds
         the place until it arrives - and a list can be as long as it needs
         to be. Every tree on the site ends with the ORIGINAL pine .svg, so
         that if the drawn .png is ever missing from a machine the planets
         still have trees on them instead of quietly losing all of them, so a world is never empty while you are
         still drawing it. A stand-in is only ever a stand-in - it goes the
         moment the real file lands. See load() in hw-main.js.

         Slots with NO stand-in - the snow leopard, and the three tiles on
         Signal Point - simply do not appear yet. Nothing would have read
         right in their place, and a button that is not there is better than
         one that lies about where it goes. */
      props: [
        { src: 'props/home-pine.png',
          lat: 6,   lon: 51,  size: 0.938 },
        { src: 'props/home-pine.png',
          lat: 44,  lon: 103, size: 0.765 },
        { src: 'props/home-pine.png',
          lat: -16, lon: 154, size: 0.81 },
        { src: 'props/home-pine.png',
          lat: 30,  lon: 206, size: 0.675 },
        /* ONE house, in the northern half. Two of the same building on a
           planet this small read as a street rather than a home. */
        { id: 'home-house',
          src: 'props/home-rammed-earth.png',        lat: 34,  lon: 0,   size: 0.70 }
      ],
      /* SNACK SIZES ARE SET BY FOOTPRINT, NOT BY HEIGHT ALONE.

         The page only ever sets a drawing's HEIGHT; its width follows from
         the drawing's own proportions. Two egg puffs side by side are twice
         as wide as they are tall, so giving them the same height as the bowl
         made them twice the bowl's bulk. Each number below is chosen so the
         snack takes up about the same room on the ground as the others -
         roughly two thirds of a world unit across, whatever its shape. */
      food: [
        { id: 'home-cola',    src: 'food/diet-cola.png', lat: 10,  lon: 26,  size: 0.34 },   // 0.16 wide
        { id: 'home-egg-puff', src: 'food/egg-puff.png',  lat: -12, lon: 190, size: 0.289 }   // 0.58 wide
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
      /* THE ZOOM-OUT HAS GONE WITH THE MOONS. `zoom: 1.18` used to hold the
         camera back so that two moons swinging out to either side stayed in
         shot. There are no moons now, so the planet comes forward and reads
         at the same size as the other three - and the pantheon on its pole,
         which is now the one thing you press here, is bigger to aim at. */
      radius: 1.7,
      detail: 2,
      pos: { x: 4.98, y: 3.54, z: -18.32 },
      tilt: { x: 0.18, z: -0.16 },
      spin: 0.17,

      props: [
        /* The pantheon. `pole: true` puts it on the axis the planet turns
           around, so it never rotates out of sight, and keeps it lit.

           IT OPENS THE CASE STUDY CATALOGUE, and it is the only way in to
           the work - there are no moons any more, and no doors cut into the
           planet.

           `modal: 'catalogue'` is the whole of it.

           It used to open the SME panel (`drawer: 'sme'`), and that panel
           has not gone anywhere - it is still written in common/drawers.js
           and still opens from inside the case study. It simply is not what
           this building is for any more.

           Three things a prop on a planet can be, and it is whichever one
           of these it names:
               modal:  'catalogue'   opens the case study modal here
               drawer: '<name>'      opens that sliding panel here
               href:   '<page>'      goes somewhere */
        { id: 'work-pantheon',
          src: ['props/work-pantheon.png', 'props/work-pantheon.svg'],
          lat: 90, lon: 0, size: 1.655,
          pole: true, glow: true,
          modal: 'catalogue',
          /* THE RING STAYS ON HERE. Every other door on the site shows its
             dashed ring only when you point at it, which is right for a
             planet with several things on it - the ring answers "is this
             one of them?". This planet has exactly one, and it is the whole
             of what the Work world does. A ring that waits to be discovered
             is telling you something you have just worked out for yourself.

             Take this line away and the pantheon behaves like every other
             door again. */
          ring: 'always' },
        { src: 'props/work-sweetgum.png',
          lat: -4,  lon: 300, size: 0.9 },
        { src: 'props/work-sweetgum.png',
          lat: 30,  lon: 258, size: 0.788 },
        { src: 'props/work-sweetgum.png',
          lat: 10,  lon: 120, size: 0.69 },
        /* Planted blade-down, so the hilt is the top of the drawing and the
           point is at the very bottom edge of the file - that edge is what
           meets the ground. */
        { id: 'work-sword',
          src: 'props/work-greatsword.png', lat: -18, lon: 40,  size: 0.637 }
      ],
      food: [
        { id: 'work-sandwich',    src: 'food/pbj-sandwich.png', lat: 6,   lon: 172, size: 0.374 },   // 0.44 wide
        { id: 'work-protein-bar', src: 'food/protein-bar.png',  lat: -24, lon: 212, size: 0.255 }   // 0.58 wide
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
        { src: 'props/play-balloon.png',
          lat: -6,  lon: 72,  size: 0.675 },
        { src: 'props/play-balloon.png',
          lat: 24,  lon: 190, size: 0.562 },
        /* The controller took the windmill's place. It is a hand-held thing
           rather than a building, so it stands lower than the windmill did. */
        { id: 'play-controller',
          src: 'props/play-controller.png', lat: 16,  lon: 144, size: 0.375 },
        { src: 'props/play-controller.png', lat: 40,  lon: 216, size: 0.3 },
        { src: 'props/play-baobab.png',
          lat: 32,  lon: 0,   size: 0.788 },
        { src: 'props/play-baobab.png',
          lat: -22, lon: 288, size: 0.66 },
        { src: 'props/play-basketball.png', lat: 6,   lon: 236, size: 0.225 },
        /* THE LEOPARD, AT 60% OF WHAT SHE WAS - 1.30 down to 0.78. She was
           taller than this planet's radius, which made her the biggest
           living thing on the site; at 0.78 she is a little shorter than
           the traveller (he is 1.23) and reads as an animal on a world
           rather than as a monument to one.

           SHE IS PINNED THE ORDINARY WAY, standing up from the ground she
           is on like every tree and house on the site - which is what
           makes a small world read as curved rather than as a flat picture
           of one.

           WHAT MOVING HER UP DOES, AND WHAT IT DOES NOT. The turning that
           reads as a prop being swung about its own feet is strongest at
           the equator, where a point travels the whole width of the planet
           and the ground under it swings through the most angle. The
           nearer the pole, the smaller that circle and the less there is
           to see: at 58 degrees north she drifts rather than sweeps. It is
           not none - near the axis is where it goes away entirely, and the
           axis is where the pantheon sits - but it is the quiet version of
           the same honest behaviour, which is what was wanted.

           (The `upright` flag that stopped it dead is still there and any
           prop can take it. It is simply not what she wanted: standing up
           from her own ground is the thing that tells you she is on a
           sphere.) */
        { id: 'play-snow-leopard',
          src: 'props/home-snow-leopard.png', lat: 58,  lon: 112, size: 0.78 }
      ],
      food: [
        { id: 'play-ramen',    src: 'food/ramen-bowl.png', lat: 22,  lon: 36,  size: 0.391 },   // 0.34 wide
        { id: 'play-egg-puff', src: 'food/egg-puff.png',   lat: -10, lon: 190, size: 0.289 }   // 0.58 wide
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
      /* Three tiles are DOORS: they carry an href, so they get the hover
         ring and the hotspot the pantheon has, and they appear in the hidden
         keyboard list at the foot of the page too. Put the addresses in
         HW.LINKS at the top of this file. */
      props: [
        { src: 'props/signal-palm.png',
          lat: 36,  lon: 0,   size: 0.975 },
        { src: 'props/signal-palm.png',
          lat: -2,  lon: 72,  size: 0.84 },
        { src: 'props/signal-palm.png',
          lat: 30,  lon: 288, size: 0.712 },
        /* Drawn square, so they read as billboards if they are given much
           height. Kept deliberately modest - and still well above the size a
           thumb needs, which matters because all three are buttons. */
        { id: 'signal-linkedin',
          src: 'props/signal-linkedin.png',  lat: 8,   lon: 144, size: 0.36,
          href: HW.LINKS.linkedin },
        { id: 'signal-instagram',
          src: 'props/signal-instagram.png', lat: -14, lon: 180, size: 0.36,
          href: HW.LINKS.instagram },
        /* `copy:` rather than `href:` - pressing it puts the address on the
           clipboard and shows a short note, instead of opening a mail
           program that may not exist. */
        { id: 'signal-email',
          src: 'props/signal-email.png',     lat: 20,  lon: 216, size: 0.36,
          copy: HW.LINKS.email },

        /* THE RESUME. A fourth tile on the same planet as the other three,
           and the only one that hands you a file rather than taking you
           somewhere.

           `download: true` is what makes the difference: the browser saves
           the PDF instead of opening it in a tab. Where the file goes, and
           what it is called, is `links.resume` in common/landing-copy.js -
           by default assets/docs/resume.pdf.

           IT WILL NOT APPEAR UNTIL YOU DRAW IT. Like the other three tiles
           it names one file and no stand-in, because a button that is
           there but unidentifiable is worse than one that is not there
           yet. Draw props/signal-resume.png - square, like its neighbours
           - and it joins them. */
        { id: 'signal-resume',
          src: 'props/signal-resume.png',    lat: -6,  lon: 252, size: 0.36,
          href: HW.LINKS.resume, download: HW.LINKS.resumeDownload },
        /* THE ROUND TABLE IS OUT, for now.

           What was actually on the planet was the BUOY - an old placeholder
           .svg from before any of these props were drawn by hand. The slot
           named two files, the drawing it wanted and a stand-in to hold the
           place until that arrived; the drawing never arrived, so the
           stand-in had been sitting there ever since, looking like a piece
           of furniture nobody could identify.

           To bring it back, draw props/signal-round-table.png and put this
           line back:

             { src: 'props/signal-round-table.png',
               lat: -20, lon: 250, size: 0.45 }

           Note the single file rather than the pair: a stand-in is only
           worth naming while you expect to need it. */
      ],
      food: [
        { id: 'signal-protein-bar', src: 'food/protein-bar.png', lat: 12, lon: 40,  size: 0.255 },   // 0.58 wide
        { id: 'signal-cola',        src: 'food/diet-cola.png',   lat: -8, lon: 200, size: 0.34 }   // 0.16 wide
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
    size: 1.23,       // world units tall - he is the one thing that grew
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

