/* ===========================================================================
   content.js — THE RUNNING ORDER. What comes after what, and in what shape.

   No paragraphs and no filenames in here: those are in copy.js and media.js
   next door. See case-studies/README.md for the whole arrangement.

   Any of the slide templates can be used, in any order — see
   case-studies/industry-dashboard/content.js for a worked example of each.
   =========================================================================== */
window.CS = window.CS || {};

CS.CASE_STUDY = {

  meta: {
    id: 'case-study-two',
    backHref: '../../index.html'
  },

  story: [

    { template: 'hero',        copy: 'slide-01' },

    { template: 'impact-text', copy: 'slide-02', draft: true },

    /* THE WAY BACK. It returns to the worlds and lands on the yellow planet
       - the one the case studies live on - rather than at the top of the
       page. The #hw-world-work on the end is what says which planet;
       js/hw-scroll.js reads it on arrival. */
    { template: 'strip-back',  copy: 'story-back',
      media: 'slide-03_img-01',
      href: '../../index.html#hw-world-work' }
  ]
};


