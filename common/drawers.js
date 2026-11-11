/* common/drawers.js — the panels that BOTH the landing page and the case
   studies can open.

   WHY THIS FILE EXISTS

   A drawer usually belongs to one case study: it explains something in that
   study's own story, and it lives in that study's content.js. But a few
   things are not any one study's - what an industry Subject Matter Expert
   actually does, for instance, is background that the landing page leans on
   as much as the case study does.

   Putting that text in two places would mean it drifts apart the first time
   it is edited. So it lives here, once, and two different drawers read it:

     the case study    system/js/cs-drawer.js  - slides in over the slides
     the landing page  js/hw-drawer.js         - slides in over the worlds

   Neither knows about the other. Both look in their own drawers first and
   fall back to this file, so a study can still override one of these by
   using the same name in its own `drawers` block.

   HOW TO WRITE ONE

   A drawer is a title, a LIST OF BLOCKS, and an optional note. The list is
   built by common/drawer-content.js, which is shared by both surfaces, so
   the same drawer looks and behaves the same in both places.

       <name>: {
         title: '…',
         content: [
           { type: 'text',      body: ['…', '…'], columns: false },
           { type: 'image',     src: '…', caption: '…' },
           { type: 'carouselA', slides: [ { src, caption }, … ] },
           { type: 'carouselB', slides: [ … ] },
           { type: 'marquee',   images: [ … ], direction: 'left', speed: 34 },
           { type: 'mascot',    src: '…', size: 'medium' }
         ],
         note: '…'
       }

   ONE RULE ABOUT PICTURES IN THIS FILE

   A name written plainly - 'diagram.png' - means "this page's own assets
   folder", which is a different folder on the landing page than it is
   inside a case study. That is right for a drawer that belongs to one
   study, and wrong for the drawers in here, which belong to everybody.

   So in THIS file every picture is written with a tilde:

       src: '~/props/home-pine.png'

   The tilde means "the site's own assets folder", the one at the root next
   to index.html. Wherever the drawer is opened from, it resolves to the
   same picture. Leave the tilde off in here and the picture will appear on
   the landing page and quietly fail inside a case study.

   Any number of blocks, in any order, repeated as often as you like: three
   carousels and no text is a perfectly good drawer.

   A AND B ARE TWO DIFFERENT PROMISES. A keeps one shape, so nothing below it
   ever moves. B takes each picture's own height, so everything below it
   does. Neither is the default; the author chooses which promise to make.

   `src` paths are relative to the page's own assets folder, so the same name
   finds the landing page's drawing on the landing page and the study's
   drawing inside a study.

   THE OLD SHAPE STILL WORKS. A drawer written as `body: ['…']` with no
   `content` is quietly turned into one text block, so nothing that already
   existed had to be rewritten.

   Copy is written the same way every other line on this site is, with
   entities like &mdash; spelled out. */
window.SITE = window.SITE || {};

SITE.DRAWERS = {

  /* Opened from two places:
       - the words "industry Subject Matter Expert's (SME)" on slide 2 of
         the KIMs case study
       - the pantheon on the yellow planet, on the landing page

     THIS ONE IS ALSO THE DEMONSTRATION. It holds one of every block the
     container can build, so the six of them can be seen and felt together.
     Cut it back to whatever this drawer really needs - deleting a block is
     deleting one entry from the list, and nothing else changes. */
  sme: {
    title: 'What an industry SME actually does',

    content: [
      /* 1. TEXT. Two columns as soon as the drawer is 620 wide, one below
            that. `columns: false` on a block keeps it single whatever the
            width, which is right for a short lead-in. */
      { type: 'text', columns: false, body: [
        'PLACEHOLDER &mdash; this is where the short explanation of the role goes, in your words.'
      ] },

      /* 2. CAROUSEL A, the one that does NOT move what is under it. The
            frame keeps one shape and the slides change inside it, so the
            paragraph below never jumps as somebody presses next. */
      { type: 'carouselA', slides: [
        { src: '~/props/work-pantheon.png', caption: 'Carousel A &mdash; the frame never changes shape' },
        { src: '~/props/signal-palm.png',   caption: 'so nothing below it ever moves' },
        { src: '~/props/play-baobab.png',   caption: 'however tall or wide the picture is' }
      ] },

      { type: 'text', body: [
        'A subject matter expert holds the knowledge of an industry that does not live in any system: which numbers move together, which movements are ordinary and which are worth a phone call, and what a change in one industry means for the companies sitting downstream of it.',
        'The case study is about giving that judgement somewhere to stand &mdash; not replacing it. That is a harder brief than it sounds, because the moment a tool starts making the call itself, the person stops reading it and starts arguing with it.',
        'This paragraph and the one above it are here to show the two-column setting. Make the drawer narrower and they become one column, without anything being measured or re-laid out.'
      ] },

      /* 3. CAROUSEL B, the one that DOES move what is under it. The frame
            takes each picture's own height and everything below shifts with
            it, on a transition so the movement reads as deliberate. */
      { type: 'carouselB', slides: [
        { src: '~/props/home-rammed-earth.png',  caption: 'Carousel B &mdash; the frame takes the picture\u2019s own height' },
        { src: '~/props/home-snow-leopard.png',  caption: 'so this caption, and everything under it, moves' },
        { src: '~/props/work-greatsword.png',    caption: 'which is the point when the proportions matter' }
      ] },

      /* 4. A STATIC IMAGE. */
      { type: 'image', src: '~/props/work-sweetgum.png',
        caption: 'A static image &mdash; no controls, no behaviour, just a drawing with a caption.' },

      /* 5. THE MOVING BAND. 240px tall by default; `direction` is 'left' or
            'right', and `speed` is pixels per second rather than a duration,
            so a long strip and a short one drift at the same pace. */
      { type: 'marquee', direction: 'left', speed: 34, images: [
        '~/props/home-pine.png', '~/props/play-balloon.png', '~/props/signal-palm.png',
        '~/props/play-controller.png', '~/props/work-greatsword.png',
        '~/props/play-baobab.png', '~/props/home-rammed-earth.png'
      ] },

      { type: 'text', columns: false, body: [
        'Above is the moving band, and over the whole panel there is a mascot wandering about. It catches no clicks and is hidden from screen readers &mdash; a drawing strolling past is a pleasure to see and an interruption to hear.'
      ] },

      /* 6. THE MASCOT. small 64 / medium 120 / large 240. Give it `sprite:
            { frames: n, seconds: s }` and the drawing is read as a strip of
            frames instead of a single picture. */
      { type: 'mascot', src: '~/props/home-snow-leopard.png', size: 'medium' }
    ],

    note: 'Send me the real copy and this becomes it. The longer version of the same ground is the primer, &ldquo;How an analyst typically works&rdquo;.'
  }
};


