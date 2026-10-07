/* ===========================================================================
   catalogue.js — THE CASE STUDIES, AND EVERY WORD OF THE MODAL THEY LIVE IN.

   This is the one file to open when you want to:

       * change any wording in the modal that opens from the pantheon
       * name a case study
       * say which card opens which case study page
       * add a case study, remove one, or change their order

   It is read by TWO places, and that is the point of it sitting in common/
   rather than with the landing page's own code:

       the landing page    builds the modal and its cards from this file
       a case study page   takes its own NAME from this file

   So a study is named once. Rename it here and the card, the password
   screen and the browser tab all follow, with nothing left behind to go
   stale.

   WHAT IS NOT HERE: the words inside a case study. Those are in that
   study's own copy.js, as they always were. This file is the outside of a
   case study - what it is called and how you get to it. copy.js is the
   inside.
   =========================================================================== */
window.SITE = window.SITE || {};

SITE.CATALOGUE = {

  /* =======================================================================
     1 - THE COMPANY
     =======================================================================
     The small line at the top of both states of the modal. */
  company: 'JP Morgan Chase',


  /* =======================================================================
     2 - THE TWO TABS
     =======================================================================
     `opensOn` decides which one is showing when the modal first appears.
     It is 'catalogue' because that is what a visitor came to see; the
     overview is there for the one who wants the background first. */
  opensOn: 'catalogue',

  tabs: {
    overview: 'Overview',
    catalogue: 'Case study catalogue'
  },


  /* =======================================================================
     3 - THE OVERVIEW TAB
     =======================================================================
     Its own writing, independent of everything else. One string is one
     paragraph; add or remove strings to add or remove paragraphs. */
  overview: {
    body: [
      'This is the high-volume lending division that handles sums of money at a scale which a layman would find astonishing.' +
      'Naturally, such lending carries an outrageous amount of risk. Hence the bank employs professionals called Credit Officers, who assess the risk involved in lending at a client level.',
      'With experience, few rise up to leadership positions, commanding approval authority over a larger number of clients. At such levels, they want to look at and compare aggregate figures. Some specialize in specific portfolios while others deal with more general usecases.',
      'If you had to take one thing away from this, it is that anyone working in the credit risk department is in some way helping minimize the chances of losing money to corporate borrowers.'
    ]
  },


  /* =======================================================================
     4 - THE CASE STUDY CATALOGUE TAB
     =======================================================================
     The line above the cards. The cards themselves are section 6. */
  catalogue: {
    intro: 'Here are some projects that I am proud to have worked on.'
  },


  /* =======================================================================
     5 - THE PASSWORD SCREEN
     =======================================================================
     The modal's other state. It is the SAME modal - it does not close and
     reopen - and which case study you picked decides the name at the top.

     ONE PASSWORD OPENS EVERY CASE STUDY. The password itself is not here:
     it lives, as a one-way fingerprint, in common/access.js. */
  /* =======================================================================
     THE WORDS A CARD WEARS
     =======================================================================
     Only one so far: the badge on a case study that is not finished. */
  labels: {
    /* the badge on the card */
    comingSoon: 'In progress',
    /* and what a screen reader is told instead of reading the card out. It
       is joined to the study's name, so it reads "Project Name - this case
       study will be uploaded soon". */
    comingSoonSays: 'this case study will be uploaded soon'
  },


  password: {
    lead: 'Enter the password to view the work.',
    note: 'Please note that no internal client data has been shown in this ' +
      'case study. The work you will see is a representation of the ' +
      'actual product, intended to illustrate the story of how we ' +
      'solved the business problem, and no more than that.',
    placeholder: 'Password',
    submit: 'Unlock &amp; view',
    back: 'Back to case study catalogue',
    wrong: 'That password does not open this one.',
    /* Shown only if the browser will not do the password check at all -
       see the note at the foot of js/hw-catalogue.js. */
    unavailable: 'This browser will not check the password from a file ' +
      'opened off the disk. Open the case study page directly.'
  },


  /* =======================================================================
     6 - THE CASE STUDIES THEMSELVES
     =======================================================================
     The order of this list is the order of the cards.

     EVERY FIELD, AND WHAT IT DOES

       id            matches `meta.id` in that study's content.js. It is how
                     the study page knows which of these entries is its own,
                     and therefore what it is called.

       name          WHAT THE CASE STUDY IS CALLED. It appears on the card,
                     as the heading of the password screen, in the strip
                     along the top of the study itself, and in the browser
                     tab. The big hero title on slide 1 is NOT this - that
                     one stays in the study's own copy.js, so it can be
                     longer or phrased differently.

       href          WHICH PAGE THIS CARD OPENS. A path from the landing
                     page. This is the whole of "which card opens what".

       description   the sentence under the name on the card. The height of
                     this text decides the height of the whole card.

       image         the name of the drawing on the card. Save the file as
                     assets/<that name>.png beside the landing page and it
                     appears; until then the card shows a named empty box
                     telling you exactly which file it is waiting for.

       locked        true  - the password screen comes first
                     false - the card opens the page straight away

       state         'available'   the default, and what you get if you
                                   leave this line out entirely. The card is
                                   a control: it can be pressed and it opens
                                   the study.
                     'coming-soon' the work is not up yet. The card cannot be
                                   pressed, is not reachable by keyboard, and
                                   wears the same hatching an unarrived
                                   drawing wears everywhere else on this site
                                   - plus the badge from `labels` above. It
                                   still shows its name and its description,
                                   so it reads as a thing that is being made
                                   rather than a thing that is broken.

       metrics       up to two. Each is a label and a line under it.
                     LEAVE THE WHOLE `metrics` LINE OUT and that card simply
                     has no metrics panel - the name and description then use
                     the full width. `showMetrics: false` does the same thing
                     while keeping the writing in place for later.
     ======================================================================= */

  /* The default for every card that does not say otherwise. Set this to
     false to switch the metrics off everywhere at once. */
  showMetrics: true,

  studies: [
    {
      id: 'industry-dashboard',
      name: 'Key Industry Metrics {KIMs}',
      href: 'case-studies/industry-dashboard/index.html',
      description: 'Filtering industry signals from noise',
      image: 'case-study-card-img-01',
      locked: true,
      state: 'available',
      metrics: [
        { label: 'Adoption', value: '68%' },
        { label: 'Rating', value: '4.3 out of 5' }
      ]
    },

    {
      id: 'case-study-two',
      name: 'Project Name',
      href: 'case-studies/case-study-two/index.html',
      description: 'To be added by me.',
      image: 'case-study-card-img-02',
      locked: true,
      /* Change this one word to 'available' and the card becomes a door. */
      state: 'coming-soon',
      metrics: [
        { label: 'Metric #1', value: 'Description' },
        { label: 'Metric #2', value: 'Description' }
      ]
    }

    /* A THIRD CARD, AS AN EXAMPLE. The primer - "How an analyst typically
       works" - is shared background rather than client work, so it would
       open with no password and it has no metrics to show. Uncomment it and
       it is a card like any other.

    ,{
      id:          'analyst-primer',
      name:        'How an analyst typically works',
      href:        'case-studies/analyst-primer/index.html',
      description: 'The shared background both case studies lean on.',
      image:       'case-study-card-img-03',
      locked:      false
    }
    */
  ]
};


/* ---------------------------------------------------------------------------
   A CASE STUDY PAGE ASKS THIS, to find out what it is called.
   It is here rather than in the engine so that the lookup and the list it
   looks in cannot end up in two different files.
   --------------------------------------------------------------------------- */
SITE.studyNamed = function (id) {
  var list = (SITE.CATALOGUE && SITE.CATALOGUE.studies) || [];
  for (var i = 0; i < list.length; i++) {
    if (list[i].id === id) return list[i];
  }
  return null;
};


