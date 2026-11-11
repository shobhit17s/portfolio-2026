/* ===========================================================================
   content.js — THE RUNNING ORDER. What comes after what, and in what shape.

   Built 20 October from the slide-structure sheet
   "case-study-2-slide-structure-version-1".

   TWENTY-TWO SLIDES. The sheet numbers its last two pages both #21; this
   file numbers straight through, so its slide 22 is the sheet's second #21.

   There are no paragraphs in this file and no filenames. Those live next
   door:

       copy.js     what it says      open it to change a heading
       media.js    what pictures     open it to describe a new drawing
       content.js  what order        open it to move, add or remove a slide

   ---------------------------------------------------------------------------
   HOW TO READ A LINE IN HERE
   ---------------------------------------------------------------------------
       { template: 'title-split', copy: 'slide-03', media: 'slide-03_img-01' }
         |                          |                 |
         |                          |                 the picture it shows
         |                          the block of words in copy.js
         the layout it uses (system/js/cs-templates.js has the list)

   ---------------------------------------------------------------------------
   HOW TO HIDE A SLIDE WITHOUT DELETING IT
   ---------------------------------------------------------------------------
   Add `hidden: true` to its line. It is not drawn and not counted.
   =========================================================================== */
window.CS = window.CS || {};

CS.CASE_STUDY = {

  /* anything shared across the study - see `study` in copy.js */
  copy: 'study',

  meta: {
    id: 'case-study-two',
    backHref: '../../index.html',

    /* =====================================================================
       THE IMPACT AND FEASIBILITY CARDS - ON OR OFF FOR THE WHOLE STUDY
       =====================================================================

           showRatings: true      the assessment strip is pinned at the foot
                                  of every use-case slide's details panel.
                                  This is the state right now, and it is
                                  what the sheets of 29 October draw.
           showRatings: false     no strip on any use-case slide.

       IT WAS false FOR A WHILE, which was a deliberate "not yet" rather
       than a change of mind - the judgements were not settled. The sheets
       of 29 October bring it back and give it a proper home: the foot of
       the details panel rather than a loose row underneath.

       A SLIDE WITH NO RATINGS WRITTEN still gets the strip, with a dash in
       each card, because the strip is part of the shape of the slide. Write
       them on the slide's own line below:

           impact: 'high', feasibility: 'medium'

       and the five words it understands are very low, low, medium, high and
       very high. Anything else still shows, in the quiet colour, and the
       console says so - a typo should not get to look like a judgement. */
    showRatings: true
  },

  /* NO `nutshell` LIST, so this is a single read with no tab bar - the same
     decision the industry dashboard made. */
  /* =====================================================================
     THE RUNNING ORDER - the overall sheet of 29 October
     =====================================================================
     ELEVEN SLIDES, with a chapter in the middle that comes in TWO EDITIONS.

     This list IS the structure: move a line and the slide moves, delete one
     and it is gone, and the numbering in the drawing names follows the
     position. Nothing else has to be told.

     THE SHAPE OF THE STORY:

         1 - 3     who, what and why
         4 - 6     how the understanding was built, and who it was for
         7 - 8     the five problems, and the grid that compares them
         --------  THE TAB SERIES: phase 1 or phase 3, the reader chooses
         9 - 11    what was learned, and the way back

     THE TAB SERIES is the one entry here that is not a slide. It is a RUN
     of slides that swaps for another run - see the long note on its own
     entry below, and cs-tabseries.js for how it works.
     ===================================================================== */
  story: [

    /* 1 - THE TITLE. */
    { template: 'hero', copy: 'slide-01',
      media: 'slide-01_img-01', separator: 'slide-01_img-02' },

    /* 2 - THE ACCORDION STACK. */
    { template: 'strip-fancy-accordion', copy: 'slide-02',
      title: null, media: 'slide-02_img-01',
      accordions: [ 'acc-01', 'acc-02', 'acc-03'] },

    /* 3 - A SECTION. */
    { template: 'sections', copy: 'slide-03' },

    /* 4 - THE QUESTIONS, STEPPED. */
    { template: 'title-steps', copy: 'slide-04',
      id: 'cs-slide-understanding', views:3, split: 'panel' },

    /* 5 - AFFECTED USERS. */
    { template: 'persona', copy: 'slide-05', id: 'cs-slide-persona'},

    /* THE TAB SERIES - tab 2 parked */
    { group: 'tab-series', id: 'cs-phases', label: 'Which phase to read',
      tabs: [ 'phase-01' ] },

    /* 6 - CHAPTER. */
    { template: 'rule-title', copy: 'slide-06', media: 'slide-06_img-01' },

    /* 7 - THE NUMBERED POINTS. */
    { template: 'numbered-grid', copy: 'slide-07' },

    /* 8 - THE WAY BACK. */
    { template: 'strip-back', copy: 'slide-08',
      media: 'slide-08_img-01',
      href: '../../index.html#hw-world-work' }
  ],

  /* ==================================================================== */
  /*  THE PEOPLE - slide 5                                                */
  /*                                                                       */
  /*  THIS LIST IS THE RUNNING ORDER and nothing else. Each line says:     */
  /*                                                                       */
  /*      copy     which block in copy.js holds this person's words        */
  /*      media    their portrait, in the picture area on the left         */
  /*      media2   the drawing inside their panel's picture section        */
  /*      ink      the colour their NAME is set in                        */
  /*                                                                       */
  /*  `ink` NAMES AN ACCENT - sun, fire, water, forest, stone, mist or      */
  /*  moon - and sets their name in the levelled strength of it. Leave it   */
  /*  out and the name takes the ordinary text colour.                      */
  /*                                                                       */
  /*  THERE USED TO BE A COLOURED LIGHT TOO, laid over the drawing. It has  */
  /*  been taken out; the portraits read as drawn. The old key name `glow`  */
  /*  still works, so nothing has to be edited in a hurry.                  */
  /*                                                                       */
  /*  THESE TWO ARE THE STUDY'S OWN COLOURS - sun and forest, the pair on   */
  /*  the <html> line of index.html - so the people belong to the study     */
  /*  rather than to the engine.                                            */
  /*                                                                       */
  /*  TWO PEOPLE, because the sheet's counter says "1 out of 2 images".     */
  /*  Adding a third is adding a line here and a block in copy.js; the      */
  /*  counter reads the length of this list.                                */
  /* ==================================================================== */
  personas: [
    { copy: 'user-1', ink: 'sun',    media: 'slide-05_user-1_portrait'}
  ],

  /* ==================================================================== */
  /*  THE USER GROUPS - the faces at the head of every use-case panel     */
  /*                                                                       */
  /*  THIS IS "n": every group the case study has, written ONCE. Adding a  */
  /*  fifth is one line here and one drawing, and it touches no slide.     */
  /*                                                                       */
  /*  "x" - how many a given slide SHOWS - is the `groups` line on that    */
  /*  slide, up in the story above. Anywhere from one of these to all of   */
  /*  them, and a slide that says nothing shows them all.                   */
  /*                                                                       */
  /*      id      the short name a slide uses to ask for this group        */
  /*      media   its drawing. Shared across every slide that shows it, so */
  /*              it is saved ONCE under this name rather than per slide.  */
  /*      name    what it is called, for anyone reading this file. The     */
  /*              line a READER sees is `groupsCaption` in copy.js.        */
  /*                                                                       */
  /*  THEY ARE THE SAME TWO PEOPLE AS SLIDE 5 here, which is why the ids   */
  /*  match their copy blocks - but they need not be. A user group is a    */
  /*  group; a persona is a person. A study can have more groups than it   */
  /*  has personas, or none in common at all.                              */
  /* ==================================================================== */
  userGroups: [
    { id: 'user-1', media: 'user-group_user-1', name: 'The first group' },
    { id: 'user-2', media: 'user-group_user-2', name: 'The second group' }
  ],


  /* NO `drawers` YET. Slide 2's surface is in its plain state. When there is
     a longer story behind it, add

         drawers: { detail: { copy: 'drawer-01', media: 'drawer-01_img-01' } }

     here and `drawer: 'detail'` to slide 2's line above. */
};

