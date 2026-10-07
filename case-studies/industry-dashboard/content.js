/* ===========================================================================
   content.js — THE RUNNING ORDER. What comes after what, and in what shape.

   Rebuilt 6 October to the new slide-structure sheet.

   TWO THINGS CHANGED ABOUT THE SHAPE OF THIS STUDY

   1. THE "IN A NUTSHELL" TAB IS GONE. There is no `nutshell` list any more,
      and that one omission is the whole of it: the engine sees a single view
      and takes the tab bar away by itself. Nothing was deleted that cannot
      come back - add a `nutshell` list here and the tab returns.

   2. THIRTY SLIDES, in the order the sheet prints them.

   There are no paragraphs in this file and no filenames. Those live next
   door:

       copy.js     what it says      open it to change a heading
       media.js    what pictures     open it to describe a new drawing
       content.js  what order        open it to move, add or remove a slide

   ---------------------------------------------------------------------------
   HOW TO READ A LINE IN HERE
   ---------------------------------------------------------------------------
       { template: 'figure', copy: 'slide-10', media: 'slide-10_img-01' }
         |                     |                 |
         |                     |                 the picture it shows
         |                     the block of words in copy.js
         the layout it uses (system/js/cs-templates.js has the list)

   ---------------------------------------------------------------------------
   HOW TO HIDE A SLIDE WITHOUT DELETING IT
   ---------------------------------------------------------------------------
   Add `hidden: true` to its line. It is not drawn and not counted, and the
   numbering reads straight through as if it were never written.
   =========================================================================== */
window.CS = window.CS || {};

CS.CASE_STUDY = {

  /* anything shared across the study - see `study` in copy.js */
  copy: 'study',

  meta: {
    id: 'industry-dashboard',
    backHref: '../../index.html'
  },

  /* NO `nutshell` LIST. That is what makes this a single read rather than a
     two-view case study. */

  story: [

    /* 1 — the title. The man at the computer beside it, the long drawn
       separator along the bottom. */
    { template: 'hero',             copy: 'slide-01',
      media: 'slide-01_img-01', separator: 'slide-01_img-02' },

    /* 2 — a drawing beside a door, then the business problem. The golden
       half of the band is a control: `drawer` names what it opens, and the
       words printed on it are in copy.js under slide-02. */
    { template: 'pair-section',     copy: 'slide-02',
      media: 'slide-02_img-01'},

    /* 3 — the people. Three of them, stepped through with the click areas
       either side; the three tabs beside them are `study.tiles` in copy.js
       and the writing behind each tab is in the persona blocks. */
    { template: 'persona',          copy: 'slide-03', id: 'cs-slide-persona' },

    /* 4 — two sections: the context, and what a win looked like. */
    { template: 'sections',         copy: 'slide-04' },

    /* 5 — a strip: one statement across the page. */
    { template: 'strip-text',       copy: 'slide-05' },

    /* 6 — seven diagrams in one run, each with the question it answers
       above it and the counter below. */
    { template: 'title-steps',      copy: 'slide-06',
      id: 'cs-slide-approach', flows: 'approach' },

    /* 7 — a strip with two bands: the heading, and the statement under it.
       Short like a strip, but it carries a paragraph rather than one line. */
    { template: 'strip-section',    copy: 'slide-07' },

    /* 8 — one diagram, under a heading. */
    { template: 'title-figure',     copy: 'slide-08', media: 'slide-08_img-01' },

    /* 9 — a strip. */
    { template: 'strip-text',       copy: 'slide-09' },

    /* 10 to 14 — five diagrams, each filling its own slide. */
    { template: 'figure',           copy: 'slide-10', media: 'slide-10_img-01' },
    { template: 'figure',           copy: 'slide-11', media: 'slide-11_img-01' },
    { template: 'figure',           copy: 'slide-12', media: 'slide-12_img-01' },
    { template: 'figure',           copy: 'slide-13', media: 'slide-13_img-01' },
    { template: 'figure',           copy: 'slide-14', media: 'slide-14_img-01' },

    /* 15 — a strip. */
    { template: 'strip-text',       copy: 'slide-15' },

    /* 16 — four numbered findings. */
    { template: 'numbered-grid',    copy: 'slide-16' },

    /* 17 to 20 — four diagrams. */
    { template: 'figure',           copy: 'slide-17', media: 'slide-17_img-01' },
    { template: 'figure',           copy: 'slide-18', media: 'slide-18_img-01' },
    { template: 'figure',           copy: 'slide-19', media: 'slide-19_img-01' },
    { template: 'figure',           copy: 'slide-20', media: 'slide-20_img-01' },

    /* 21 — four numbered enhancements. */
    { template: 'numbered-grid',    copy: 'slide-21' },

    /* 22 — a strip. */
    { template: 'strip-text',       copy: 'slide-22' },

    /* 23 to 26 — four diagrams. */
    { template: 'figure',           copy: 'slide-23', media: 'slide-23_img-01' },
    { template: 'figure',           copy: 'slide-24', media: 'slide-24_img-01' },
    { template: 'figure',           copy: 'slide-25', media: 'slide-25_img-01' },
    { template: 'figure',           copy: 'slide-26', media: 'slide-26_img-01' },

    /* 27 — the running prototype. */
    { template: 'figure',           copy: 'slide-27', media: 'slide-27_prototype-01' },

    /* 28 — the impact of the phase 1 launch, as four measured tiles. The
       numbers live in copy.js under slide-28, because they are words. */
    { template: 'title-figure',     copy: 'slide-28', band: true },

    /* 29 — four numbered takeaways. */
    { template: 'numbered-grid',    copy: 'slide-29' },

    /* 30 — THE WAY BACK. One drawing, and the whole band is the control. It
       returns to the worlds and lands on the yellow planet - the one the
       case studies live on - rather than at the top of the page. The
       #hw-world-work on the end is what says which planet; js/hw-scroll.js
       reads it on arrival. */
    { template: 'strip-back',       copy: 'slide-30',
      media: 'slide-30_img-01',
      href: '../../index.html#hw-world-work' }
  ],

  /* ==================================================================== */
  /*  THE PEOPLE - slide 3                                                */
  /*                                                                       */
  /*  THIS LIST IS THE RUNNING ORDER and nothing else. Each line says:     */
  /*                                                                       */
  /*      copy     which block in copy.js holds this person's words        */
  /*      media    their portrait, in the picture area on the left         */
  /*      media2   the square diagram at the foot of their panel           */
  /*      glow     the colour of the light on them, and of their name      */
  /*                                                                       */
  /*  SO SWAPPING TWO PEOPLE ROUND is swapping two lines here - their      */
  /*  writing does not move, and neither do their drawings. And putting    */
  /*  a different person in the first slot is changing one word: the       */
  /*  `copy` name on that line.                                           */
  /*                                                                       */
  /*  `glow` NAMES AN ACCENT - forest, mist, fire, water, sun, stone or     */
  /*  moon - and two things follow from that one word: a coloured light is  */
  /*  laid OVER their drawing, stencilled by the drawing itself so it lands */
  /*  on the figure and nowhere else, and their NAME underneath is set in   */
  /*  the same colour. It is soft light at rest and hard light while the    */
  /*  cursor is on them. Leave it out and they have neither. How strong it  */
  /*  is lives in system/css/cs-slides.css, three numbers per mode.         */
  /* ==================================================================== */
  personas: [
    { copy: 'user-1', glow: 'forest', media: 'slide-03_img-01',
      media2: 'slide-03_user-1_collaboration-model' },
    { copy: 'user-2', glow: 'mist',   media: 'slide-03_img-02',
      media2: 'slide-03_user-2_collaboration-model' },
    { copy: 'user-3', glow: 'fire',   media: 'slide-03_img-03',
      media2: 'slide-03_user-3_collaboration-model' }
  ],

  /* ==================================================================== */
  /*  SLIDE 6 - the run of diagrams                                       */
  /*                                                                       */
  /*  One flow, seven screens. Each screen's QUESTION is in copy.js under  */
  /*  `questions`, filed under the picture's own name, so moving a diagram */
  /*  moves its question with it. Add an eighth and nothing else changes:  */
  /*  the counter reads the length of this list.                           */
  /* ==================================================================== */
  workflowSets: {
    approach: [
      { id: 'approach', shots: [
        { media: 'slide-06_img-01' },
        { media: 'slide-06_img-02' },
        { media: 'slide-06_img-03' },
        { media: 'slide-06_img-04' },
        { media: 'slide-06_img-05' },
        { media: 'slide-06_img-06' },
        { media: 'slide-06_img-07' } ] }
    ]
  },

  /* ==================================================================== */
  /*  THE ONE DRAWER - opened by the golden panel on slide 2              */
  /*  Its words are in copy.js. A drawer can hold far more than a picture  */
  /*  and a paragraph; see common/drawer-content.js for the list of parts  */
  /*  one can be built from.                                               */
  /* ==================================================================== */
  drawers: {
    detail: { copy: 'drawer-01', media: 'drawer-01_img-01' }
  }
};


