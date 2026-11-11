/* ============================================================================
   landing-copy.js — EVERY WORD ON THE LANDING PAGE, IN ONE PLACE.

   This is the file to open when you want to change what the landing page
   SAYS. Nothing in here affects how anything is laid out or how big it is;
   this file is only the words, the addresses they point at, and which way a
   diagrammatic label sits.

   WHERE THE SIZES ARE, SO YOU ARE NOT LEFT HUNTING. Every piece of writing
   named below also has a TYPE ROLE - which typeface it is set in, how big it
   is on a desk, how big it is on a phone - and those live in one block of
   common/type-scale.css, marked "2e - THE LANDING PAGE". The role has the
   same name as the thing here: `masthead.name` is set by
   `--t-hw-wordmark-*`, `panels.*.title` by `--t-hw-panel-title-*`, and so
   on. Words here, sizes there, and neither file has to know about the other.

   THE PAGE STILL READS IF THIS FILE NEVER ARRIVES. index.html carries the
   same words written into it, and this file replaces them at start-up. So a
   missing or broken copy file leaves a page with the old wording on it
   rather than a page of empty boxes - and a search engine or a reader with
   no JavaScript sees real writing either way.

   WHAT IS NOT IN HERE. The case study catalogue has its own file
   (common/catalogue.js) and so do the sliding panels (common/drawers.js).
   Where each planet is, what is standing on it and how big those things are
   is js/hw-config.js - that is the SHAPE of the worlds, and this is only
   what they say.
   ========================================================================= */
window.SITE = window.SITE || {};

SITE.LANDING = {

  /* ---------------------------------------------------------------------
     THE BROWSER TAB
     ---------------------------------------------------------------------
     What is written on the tab itself, and what a search result or a link
     preview shows underneath it. The tab is also what a bookmark is called
     and what shows in somebody's history, which is why it is worth being a
     name rather than a sentence. */
  tab: `Shobhit Kenath Portfolio 2026`,
  description: 'A design portfolio you travel through: four hand-drawn ' +
               'low-poly planets, one traveller, and a jump between each.',

  /* ---------------------------------------------------------------------
     THE HEADER, TOP LEFT
     ---------------------------------------------------------------------
     `name` is the line you press to go home. `subtext` is the smaller line
     under it. Leave either as an empty string and that line is simply not
     drawn - the one above it closes up rather than leaving a gap. */
  masthead: {
    name:    `Shobhit Kenath`,
    subtext: `Interaction Designer | AI-Native`
  },

  /* ---------------------------------------------------------------------
     THE FOUR WORLDS, AND WHAT EACH ONE SAYS
     ---------------------------------------------------------------------
     The key is the world's id, the same one used in js/hw-config.js:

         home    About Me          Home Hollow
         work    Case Studies      The Drafting Fields
         play    Experiments       The Tinker Belt
         signal  Get In Touch      Signal Point

     `body` IS A LIST, one entry per paragraph. One sentence, three
     sentences, or none at all - the page draws exactly as many paragraphs
     as there are entries, so adding a line here is the whole of adding a
     line to the page. An apostrophe is written as an ordinary ' in here;
     the page turns it into a proper one. */
  panels: {
    home: {
      title: 'About Me',
      body: [
        `Hi! I’m a senior product designer, an experienced illustrator, and a novice worldbuilder/fantasy enthusiast.`,
        `Scroll down to visit the other planets!`
      ]
    },
    work: {
      title: 'Case Studies',
      body: [
        `Click on the pantheon to view design case studies from my time with J.P. Morgan Chase & Co.`
      ]
    },
    play: {
      title: `Leisure`,
      body: [
        `When I have time on my hands, I like to sketch characters, watch animal documentaries and build fantasy worlds.`
      ]
    },
    signal: {
      title: `Get in touch with me`,
      body: [
        `Click on the social media icons to reach out. We could discuss design ideas, philosophy or work on cool projects together!`
      ]
    }
  },

  /* ---------------------------------------------------------------------
     THE LITTLE CONTROL UNDER THE PLANETS
     ---------------------------------------------------------------------
     `label` is the line above the pill. The three buttons are named below.
     HOW FAST EACH ONE ACTUALLY SPINS IS NOT HERE - that is a number rather
     than a word, and it lives on the buttons in index.html as
     `data-hw-spin`. Renaming "Fast" to "Zoom" here does not change how fast
     it goes, which is the right way round: this file cannot break the page. */
  spin: {
    label:  'Speed of spin',
    slow:   'Slow',
    normal: 'Normal',
    fast:   'Fast'
  },

  /* ---------------------------------------------------------------------
     THE LINE THAT TELLS YOU TO SCROLL
     ---------------------------------------------------------------------
     TWO DIFFERENT LINES, BECAUSE THEY DO TWO DIFFERENT JOBS. On a desk the
     tabs along the bottom are right there, so the hint is a quiet aside
     beside a planet - "scroll to travel" - and it fades once you have.

     ON A PHONE THERE ARE NO TABS ANY MORE. They have been taken off: four
     targets along the bottom edge of a small screen were eating the room
     the planet wanted, and the thumb is already scrolling. So on a phone
     this line is not an aside, it is THE instruction, and it says where
     scrolling gets you rather than just that you can. */
  scroll: {
    desktop: 'scroll to travel',
    phone:   'scroll down to visit other planets'
  },

  /* ---------------------------------------------------------------------
     WHERE THE THINGS ON SIGNAL POINT GO
     ---------------------------------------------------------------------
     Put your real addresses in. Anything left as '#' is a tile that can be
     pressed and goes nowhere, which is fine while you are still deciding
     and wrong the day the page is public.

         linkedin   https://www.linkedin.com/in/your-name
         instagram  https://www.instagram.com/your-name
         email      mailto:you@example.com

     THE RESUME IS A FILE RATHER THAN A PLACE, and it is the one entry here
     that points at something inside this project instead of out at the
     world. Put the PDF at:

         assets/docs/resume.pdf

     ...making the `docs` folder if it is not there yet. Pressing the resume
     on Signal Point then downloads it rather than opening it in a tab -
     see `download` below. Rename the file if you like, as long as this
     line and the file agree; and if you would rather it OPENED instead of
     downloading, set `download` to false. */
  links: {
    linkedin:  'https://www.linkedin.com/in/shobhit-kenath-b53392145/',
    instagram: 'https://www.instagram.com/shobhit_kenath/',
    email:     'shobhitkenath17@gmail.com',
    resume:    'assets/docs/resume.pdf',
    download:  true
  },

  /* ---------------------------------------------------------------------
     WHAT THE THINGS ON THE PLANETS SAY
     ---------------------------------------------------------------------
     Every object on every planet can carry two completely different pieces
     of writing, and it is worth being clear about which is which:

       hover   THE NAME THAT APPEARS WHEN YOU POINT AT IT. It is there and
               gone; it answers "what is this?" for the one object the
               cursor is on. Only doors - things that actually go somewhere
               when pressed - show one.

       label   A DIAGRAMMATIC LABEL, which is the opposite: it is always
               there, for as long as the object itself is in view, the way
               a label on a drawing in a sketchbook is. It is for saying
               something ABOUT the thing rather than naming it.

     THE KEY IS THE OBJECT'S `id`, which is given to it in js/hw-config.js.
     An object with no id cannot be written about here, which is deliberate:
     it means a label can never silently attach itself to the wrong tree
     after you reorder a planet.

     A LABEL TAKES A PLACE, one of eight, and it means the compass direction
     FROM THE OBJECT - not from the planet:

             north-west     north      north-east
                       \      |      /
             west  ----  the object  ----  east
                       /      |      \
             south-west     south      south-east

     HOW FAR AWAY IS WORKED OUT RATHER THAN SET. The label is pushed along
     that direction until it is clear of the planet's edge, with a little
     air beyond it, and a line is drawn back to the object it belongs to. So
     "south-west" on an object near the top of a planet means a longer line
     than "south-west" on one near the bottom - the DIRECTION is yours, the
     DISTANCE is whatever it takes to get the words off the planet and onto
     open sky where they can be read.

     `lean` is optional and nudges that distance: 1 is as close as it is
     allowed to sit, 1.4 pushes it further out. Leave it out and you get 1. */
  objects: {

    /* ---- Home Hollow ---- */
    'home-house':    { },
    'home-cola':     {
      label: {
        text: `I love diet coke`,
        place: `east` 
      }
    },

    /* ---- The Drafting Fields ---- */
    /* NO `hover` LINE HERE ANY MORE, and that now means what it looks like
       it means: the pantheon says nothing when you point at it, because the
       label beside it is already saying it permanently. Saying the same
       thing twice, once for ever and once on hover, is one thing too many. */
    'work-pantheon': {
      label: {
        text: `Click to view the case studies`,
        place: `south-east`
      }
    },
    'work-sword':    { },

    /* ---- The Tinker Belt ---- */
    'play-snow-leopard': {
      label: {
        text: `I’m obsessed with snow leopard documentaries`,
        place: `west`
      }
    },
    'play-controller':   {
      label: {
        text: `EAFC26 | Elden Ring`,
      place: `east`
      }
      
    },

    /* ---- Signal Point ---- */
    'signal-linkedin':  { hover: 'LinkedIn' },
    'signal-instagram': { hover: 'Instagram' },
    'signal-email':     { hover: 'Email' },
    'signal-resume':    { hover: 'Download my resume' }
  },

  /* ---------------------------------------------------------------------
     THE SNACKS
     ---------------------------------------------------------------------
     The handwritten note beside the first snack on a planet, until one gets
     eaten. Set it to an empty string and no note is written at all. */
  snackHint: 'he is always hungry'
};
