/* ===========================================================================
   catalogue.js — THE CASE STUDIES, AND EVERY WORD OF THE MODAL THEY LIVE IN.

   This is the one file to open when you want to:

       * change any wording in the modal that opens from the pantheon
       * name a case study
       * write the two business impacts printed on a card
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
     2 - THE LINE UNDER THE COMPANY'S NAME
     =======================================================================
     The sheet of 10 November gives the panel a header band with two lines
     in it: the company, and what you are looking at. This is the second.

     IT CHANGES WITH THE STATE. On the catalogue it says this; on the
     password screen it is replaced by the name of the case study you
     pressed, so the band always says where you are. */
  title: 'Case Study Catalogue',


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
       study will be uploaded soon". It is also the line printed under the
       badge, in the room the impacts would have taken. */
    comingSoonSays: 'this case study will be uploaded soon',

    /* the heading on the panel at the foot of a card */
    impacts: 'Business Impact',

    /* WHAT EACH IMPACT IS CALLED, and the number is added by the position
       in the list - the first is Impact#1, the second Impact#2. That is
       why `impacts` below is a plain list of sentences: there is no way
       for two cards to disagree about how the label is written, because
       nobody writes it twice. */
    impact: '',

    /* the one word in the footer of the catalogue */
    cancel: 'Cancel'
  },


  password: {
    lead: 'Enter the password to view the work.',
    note: 'Please note that no internal client data has been shown in this ' +
          'case study. The work you will see is a representation of the ' +
          'actual product, intended to illustrate the story of how we ' +
          'solved the business problem, and no more than that.',
    placeholder: 'Password',
    submit:      'Unlock &amp; view',
    back:        'Back to case study catalogue',
    wrong:       'That password does not open this one.',
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

       impacts       UP TO TWO SENTENCES, and nothing else. They fill the
                     panel at the foot of the card, side by side, under the
                     heading "Business Impact". The label on each one -
                     Impact#1, Impact#2 - is written for you from its
                     position in this list, so all you supply is the
                     sentence.

                     LEAVE THE WHOLE `impacts` LINE OUT and the card keeps
                     its shape with an empty panel; `showImpacts: false`
                     does the same while keeping the writing in place for
                     later. A third sentence is ignored rather than drawn:
                     the panel the sheet draws has room for two.
     ======================================================================= */

  /* The default for every card that does not say otherwise. Set this to
     false to switch the impact panels off everywhere at once. */
  showImpacts: true,

  studies: [
    {
      id:          'industry-dashboard',
      name:        `KIMs`,
      href:        'case-studies/industry-dashboard/index.html',
      description: `Filtering industry signals from noise`,
      image:       'case-study-card-img-01',
      locked:      true,
      state:       'available',
      impacts: [
        `Improved analyst productivity and operational efficiency`,
        `Faster identification of industry signals`
      ]
    },

    {
      id:          'case-study-two',
      name:        `Projections (Phase 01)`,
      href:        'case-studies/case-study-two/index.html',
      description: `Frictionless generation of insights`,
      image:       'case-study-card-img-02',
      locked:      true,
      /* Change this one word back to 'coming-soon' and the card goes quiet
         again - the writing underneath stays exactly where it is. */
      state:       'available',
      impacts: [
        `Significantly reduced user toil`,
        `Increased access to projection-based insights`
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
      locked:      false,
      impacts:     []
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

