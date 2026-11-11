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

    /* 1 - THE TITLE. */
    { template: 'hero', copy: 'slide-01',
      media: 'slide-01_img-01', separator: 'slide-01_img-02' },

    /* 2 - THE ACCORDION STACK. */
    { template: 'strip-fancy-accordion', copy: 'slide-02',
      title: null, media: 'slide-02_img-01',
      accordions: [ 'acc-01', 'acc-02', 'acc-03'] },

    /* 3 - THE BUSINESS PROBLEM */
    { template: 'rule-title',
      copy: 'slide-03',
      media: null
    },

    /* 4 — the people. Three of them, stepped through with the click areas
       either side; the three tabs beside them are `study.tiles` in copy.js
       and the writing behind each tab is in the persona blocks. */
    { template: 'persona',          copy: 'slide-04', id: 'cs-slide-persona' },

    /* 5 — two sections: the context, and what a win looked like. */
    { template: 'sections',         copy: 'slide-05' },

    /* 6 — a strip: one statement across the page. */
    { template: 'strip-text',       copy: 'slide-06' },

    /* 7 — seven diagrams in one run, each with the question it answers
       above it and the counter below. */
    { template: 'title-wireframe',      copy: 'slide-07',
      id: 'cs-slide-approach', views:7},

    /* 8 — a strip with two bands: the heading, and the statement under it.
       Short like a strip, but it carries a paragraph rather than one line. */
    { template: 'strip-section',    copy: 'slide-08' },

    /* 9 — one diagram, under a heading. */
    { template: 'title-figure',     copy: 'slide-09', media: 'slide-09_img-01' },

    /* 10 — a strip. */
    { template: 'strip-text',       copy: 'slide-10' },

    /* 11 to 15 — five diagrams, each filling its own slide. */
    { template: 'figure',           copy: 'slide-11', media: 'slide-11_img-01' },
    { template: 'figure',           copy: 'slide-12', media: 'slide-12_img-01' },
    { template: 'figure',           copy: 'slide-13', media: 'slide-13_img-01' },
    { template: 'figure',           copy: 'slide-14', media: 'slide-14_img-01' },
    { template: 'figure',           copy: 'slide-15', media: 'slide-15_img-01' },

    /* 16 — a strip. */
    { template: 'strip-text',       copy: 'slide-16' },

    /* 17 — four numbered findings. */
    { template: 'numbered-grid',    copy: 'slide-17' },

    /* 18 to 21 — four diagrams. */
    { template: 'figure',           copy: 'slide-18', media: 'slide-18_img-01' },
    { template: 'figure',           copy: 'slide-19', media: 'slide-19_img-01' },
    { template: 'figure',           copy: 'slide-20', media: 'slide-20_img-01' },
    { template: 'figure',           copy: 'slide-21', media: 'slide-21_img-01' },

    /* 22 — four numbered enhancements. */
    { template: 'numbered-grid',    copy: 'slide-22' },

    /* 23 — a strip. */
    { template: 'strip-text',       copy: 'slide-23' },

    /* 24 to 27 — four diagrams. */
    { template: 'figure',           copy: 'slide-24', media: 'slide-24_img-01' },
    { template: 'figure',           copy: 'slide-25', media: 'slide-25_img-01' },
    { template: 'figure',           copy: 'slide-26', media: 'slide-26_img-01' },
    { template: 'figure',           copy: 'slide-27', media: 'slide-27_img-01' },

    /* 28 — the running prototype. */
    { template: 'prototype',           copy: 'slide-28', media: 'slide-28_prototype-01' },

    /* 29 — the impact of the phase 1 launch, as four measured tiles. The
       numbers live in copy.js under slide-28, because they are words. */
    { template: 'numbered-grid',     copy: 'slide-29'},

    /* 30 — four numbered takeaways. */
    { template: 'numbered-grid',    copy: 'slide-30' },

    /* 31 — THE WAY BACK. One drawing, and the whole band is the control. It
       returns to the worlds and lands on the yellow planet - the one the
       case studies live on - rather than at the top of the page. The
       #hw-world-work on the end is what says which planet; js/hw-scroll.js
       reads it on arrival. */
    { template: 'strip-back',       copy: 'slide-31',
      media: 'slide-31_img-01',
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
  /*      glow     the colour their NAME is set in (now called `ink`)      */
  /*                                                                       */
  /*  SO SWAPPING TWO PEOPLE ROUND is swapping two lines here - their      */
  /*  writing does not move, and neither do their drawings. And putting    */
  /*  a different person in the first slot is changing one word: the       */
  /*  `copy` name on that line.                                           */
  /*                                                                       */
  /*  IT NAMES AN ACCENT - sun, fire, water, forest, stone, mist or moon -  */
  /*  and sets their NAME underneath in the levelled strength of it. Leave  */
  /*  it out and the name takes the ordinary text colour.                   */
  /*                                                                       */
  /*  THERE USED TO BE A COLOURED LIGHT TOO. The same accent was laid over  */
  /*  the drawing as a soft light, stencilled by the drawing itself, coming */
  /*  up to a hard light under the cursor. It has been taken out at         */
  /*  Shobhit's request; the portraits now read as drawn. `ink` is the      */
  /*  clearer name for what is left, and `glow` still works, which is why   */
  /*  these three lines have not been rewritten.                            */
  /* ==================================================================== */
  personas: [
    { copy: 'user-1', glow: 'forest', media: 'slide-04_img-01',
      media2: 'slide-04_user-1_collaboration-model' },
    { copy: 'user-2', glow: 'mist',   media: 'slide-04_img-02',
      media2: 'slide-04_user-2_collaboration-model' },
    { copy: 'user-3', glow: 'fire',   media: 'slide-04_img-03',
      media2: 'slide-04_user-3_collaboration-model' }
  ],

  /* ==================================================================== */
  /*  SLIDE 6 - the run of diagrams                                       */
  /*                                                                       */
  /*  One flow, seven screens. Each screen's QUESTION is in copy.js under  */
  /*  `questions`, filed under the picture's own name, so moving a diagram */
  /*  moves its question with it. Add an eighth and nothing else changes:  */
  /*  the counter reads the length of this list.                           */
  /* ==================================================================== */
  
  /*
  workflowSets: {
    approach: [
      { id: 'approach', shots: [
        { media: 'slide-07_img-01' },
        { media: 'slide-07_img-02' },
        { media: 'slide-07_img-03' },
        { media: 'slide-07_img-04' },
        { media: 'slide-07_img-05' },
        { media: 'slide-07_img-06' },
        { media: 'slide-07_img-07' } ] }
    ]
  },
  */

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

