/* content.js — case study #2.

   The red landmass on the work planet points here. The structure is in place
   and the page is locked like the first one; the writing is still to come.
   Replace these slides with the real story, then re-run:

       node tools/lock.mjs case-study-two "<password>"

   Any of the fifteen slide templates can be used, in any order — see
   case-studies/industry-dashboard/content.js for a worked example of each. */
window.CS = window.CS || {};

CS.CASE_STUDY = {

  meta: {
    id: 'case-study-two',
    title: 'Case study #2',
    subtitle: 'Still being written',
    backHref: '../../index.html',
    backLabel: 'back to the worlds',
    storyNote: 'A placeholder, for now.'
  },

  story: [
    { template: 'hero', label: 'Title',
      title: 'Case study #2',
      subtitle: 'Still being written',
      lead: 'The planet, the landmass and the lock are all in place. The story ' +
            'goes in this file.',
      tags: ['Placeholder'] },

    { template: 'impact-text', label: 'Placeholder', draft: true,
      text: 'Replace this file with the real case study, then run the lock ' +
            'tool again so the published version matches.' }
,

    /* THE WAY BACK. The last thing in every case study: one drawing, and the
       whole band is the control. It returns to the worlds and lands on the
       yellow planet - the one the case studies live on - rather than at the
       top of the page. The #hw-world-work on the end is what says which
       planet; js/hw-scroll.js reads it on arrival. */
    { template: 'strip-back', label: 'Back to the worlds',
      media: 'img-back-to-worlds',
      href: '../../index.html#hw-world-work',
      text: 'back to the worlds' }
  ],

  media: {
    /* the drawing in the way-back strip at the end of the story */
    'img-back-to-worlds': {
      note: 'The wide band at the very end: the drawing that means \u201cback to the worlds\u201d. Long and low, roughly 16:4.' },
  }
};


