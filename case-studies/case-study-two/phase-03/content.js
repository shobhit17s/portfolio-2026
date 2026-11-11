/* ===========================================================================
   phase-03/content.js — THE RUNNING ORDER FOR THE PHASE 3 TAB

   One of the two editions of the chapter in the middle of this case study.
   The study's own content.js names it and nothing else:

       { group: 'tab-series', tabs: ['phase-03', 'phase-03'] }

   ---------------------------------------------------------------------------
   THIS FOLDER IS A LITTLE CASE STUDY OF ITS OWN
   ---------------------------------------------------------------------------
       phase-03/content.js    this file - the running order
       phase-03/copy.js       the words for these slides

   AND IT HAS ITS OWN NUMBERS. `slide-01` here and `slide-01` in
   phase-01/copy.js are two different blocks: a phase's slides are looked up
   in that phase's copy FIRST. So each phase counts from 01, and adding a
   slide to one phase renumbers nothing in the other.

   THE STUDY'S OWN copy.js IS STILL UNDERNEATH. Anything this file's copy.js
   does not have is looked for there - so shared things (`labels`,
   `captions`, a block you would rather keep central) go on working.

   ---------------------------------------------------------------------------
   THE DRAWINGS ARE NAMED AFTER THIS PHASE, AUTOMATICALLY
   ---------------------------------------------------------------------------
   A slide that says `views: 5` never names its five drawings: the names
   FOLLOW from the slide, so the count and the list cannot disagree.

   Each phase numbers its slides from 01, so without help phase 1's third
   slide and phase 3's third slide would both ask for `slide-03_img-01` -
   one name, two different drawings, and whichever file is in assets/ would
   win for both. Nothing would say so.

   So the phase's name goes in front:

       phase-03_slide-03_img-01

   TO USE A SHORTER ONE, say so below with `slotPrefix` - `slotPrefix: 'p3'`
   gives `p3_slide-03_img-01`. `slotPrefix: ''` turns it off entirely, which
   is only safe while one phase has drawings.

   THE EMPTY BOX ON THE PAGE PRINTS THE WHOLE NAME it is waiting for, so
   what to call the file is never a guess: copy what the box says, put the
   file in the study's assets/ folder under exactly that name.

   A DRAWING YOU NAME YOURSELF on a slide's line - `media: 'whatever'` - is
   left exactly as you typed it. The prefix only fixes the names you cannot
   see. The study's one media.js still describes every drawing in the study,
   so "have I drawn that already" has one place to be answered.

   ---------------------------------------------------------------------------
   TO ADD A SLIDE
   ---------------------------------------------------------------------------
   Write a line in the list below, exactly as you would write a slide
   anywhere else in this study. There is nothing special about being inside
   a tab - every template works here.
   =========================================================================== */
window.CS = window.CS || {};
CS.TABS = CS.TABS || {};

CS.TABS['phase-03'] = {

  /* what the tab says on the bar */
  label: 'Phase 3',

  /* THE NAME IN FRONT OF EVERY DRAWING THIS PHASE WORKS OUT FOR ITSELF.
     Leave it out and it is this phase's own name, 'phase-03', which is
     what you want unless you have already named files something else. */
  slotPrefix: 'phase-03',

  slides: [
    /* PLACEHOLDERS until the structure for this phase arrives. Replace a
       whole line with a real slide when it does; there is nothing in a
       placeholder to carry across. */
    { template: 'rule-title', copy: `slide-01`, media: `phase-03_slide-01_img-01`},

    {template: 'figure', copy: `slide-02`, media: `phase-03_slide-02_img-01`},

    {template: 'flow-chart', copy: `slide-03`, steps: [
      'step-1',
      'step-2',
      'step-3',
      {separator: true},
      'step-4',
      {branch: [['step-5'], ['step-6']]}
    ]}
  ]
};

