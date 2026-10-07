/* ===========================================================================
   content.js — THE RUNNING ORDER. What comes after what, and in what shape.

   No paragraphs and no filenames in here: those are in copy.js and media.js
   next door. See case-studies/README.md for the whole arrangement.

   This page has NO `nutshell` key. That one omission is what makes it a
   single read rather than a two-view case study: the engine sees no short
   view and takes the tab bar away by itself.
   =========================================================================== */
window.CS = window.CS || {};

CS.CASE_STUDY = {

  meta: {
    id: 'analyst-primer',
    backHref: '../../index.html'
  },

  story: [

    { template: 'hero',                 copy: 'slide-01' },

    { template: 'context-1',            copy: 'slide-02', draft: true,
      media: 'slide-02_img-01' },

    { template: 'title-figure-caption', copy: 'slide-03', draft: true,
      media: 'slide-03_img-01' },

    { template: 'sections',             copy: 'slide-04', draft: true },

    { template: 'title-figure',         copy: 'slide-05', draft: true,
      media: 'slide-05_img-01' },

    { template: 'impact-text',          copy: 'slide-06', draft: true },

    { template: 'context-2',            copy: 'slide-07', draft: true,
      media: 'slide-07_img-01' },

    { template: 'figure',               copy: 'slide-08', draft: true,
      media: 'slide-08_img-01' },

    /* THE WAY BACK. It returns to the worlds and lands on the yellow planet
       - the one the case studies live on - rather than at the top of the
       page. The #hw-world-work on the end is what says which planet;
       js/hw-scroll.js reads it on arrival. */
    { template: 'strip-back',           copy: 'story-back',
      media: 'slide-09_img-01',
      href: '../../index.html#hw-world-work' }
  ]
};


