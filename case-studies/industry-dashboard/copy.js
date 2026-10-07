/* ===========================================================================
   copy.js — EVERY WORD IN THIS CASE STUDY. Nothing else.

   Rebuilt 6 October to the new slide-structure sheet: THIRTY slides, one
   read, no "in a nutshell" tab. Where the sheet printed exact copy inside a
   box, that copy is here verbatim. Where it said "copy to be added manually
   by me", there is a PLACEHOLDER saying what the slide is for.

   ---------------------------------------------------------------------------
   HOW TO CHANGE A HEADING OR A PARAGRAPH
   ---------------------------------------------------------------------------
   Find the slide by its number. Slide 6 of your deck is 'slide-06' here.
   Change the text between the quote marks. Save. Reload the page.

   Leave the quote marks, the commas and the field names (title, body…)
   exactly as they are. Those are the only things that can break.

   ---------------------------------------------------------------------------
   THE FIVE KINDS OF THING IN HERE
   ---------------------------------------------------------------------------
   meta          the words in the top bar
   slide-NN      one block per slide, numbered as your deck is
   captions      every caption, filed under THE PICTURE IT DESCRIBES
   questions     slide 6 only: the question each diagram answers, filed the
                 same way - under the picture's own name
   the rest      the people, the drawers, and anything shared

   ---------------------------------------------------------------------------
   SPECIAL CHARACTERS
   ---------------------------------------------------------------------------
       &rsquo;  '     &lsquo;  '     &amp;   &
       &ldquo;  "     &rdquo;  "     &mdash; —     &middot; ·

   ---------------------------------------------------------------------------
   A FEW KINDS OF BODY TEXT
   ---------------------------------------------------------------------------
       body: 'One paragraph.'
       body: ['First paragraph.', 'Second paragraph.']
       body: [{ kind: 'points',    items: ['…', '…'] }]   a bulleted list
       body: [{ kind: 'numbers',   items: ['…', '…'] }]   a numbered list
       body: [{ kind: 'questions', items: ['…'], cards: true }]  as cards
       body: [{ kind: 'quote',     text: '…' }]           a centred statement
       body: [{ kind: 'note',      text: '…' }]           small print
   =========================================================================== */
window.CS = window.CS || {};

CS.COPY = {

  /* =======================================================================
     THE TOP BAR
     ===================================================================== */
  meta: {
    title: 'Key Industry Metrics (KIMs) Dashboard',
    subtitle: 'Information Aggregation &amp; Surveillance',
    backLabel: 'back to the worlds'
  },

  /* =======================================================================
     SHARED ACROSS THE WHOLE STUDY
     ===================================================================== */
  study: {
    /* THE DEFAULT SECTION HEADINGS for the panel on slide 3, in order.

       Each person below writes their own headings next to their own writing,
       which is the clearer way round - but a person who leaves a heading out
       takes it from here instead. So if all three people use the same three
       headings, you can change them in this one line and all three follow. */
    sections: ['Roles &amp; responsibilities', 'Jobs to be done', 'Collaboration model']
  },

  /* =======================================================================
     THE STORY - thirty slides, in order
     ===================================================================== */

  'slide-01': {
    label: 'Title',
    title: 'Key Industry Metrics (KIMs) Dashboard',
    subtitle: 'Filtering industry signals from noise',
    /* The sheet writes these with semicolons; they are four separate things,
       so each gets its own drawn chip. */
    tags: ['Duration: Four Months', 'AGILE Framework', 'Information Design',
      'Data Visualization', 'Product Thinking', 'AI-Native']
  },

  'slide-02': {
    label: 'The business problem',

    /* THE GOLDEN PANEL AT THE TOP OF THIS SLIDE IS A DOOR.
       Pressing anywhere on it opens the one drawer this page has. These
       three lines are the words printed on it: a heading, a sentence or
       two, and the little line at the bottom that says where it goes. */
    doorTitle: 'How Credit Risk Works',
    doorBody: 'This is the high-volume lending division that handles sums of money at a scale which a layman would find astonishing. Naturally, such lending carries an outrageous amount of risk. Hence the bank employs professionals called Credit Officers, who assess the risk involved in lending at a client level. With experience, few rise up to leadership positions, commanding approval authority over a larger number of clients. At such levels, they want to look at and compare aggregate figures. Some specialize in specific portfolios while others deal with more general usecases. If you had to take one thing away from this, it is that anyone working in the credit risk department is in some way helping minimize the chances of losing money to corporate borrowers.',
    doorAction: 'View sketchnotes',

    title: 'What problem was the business trying to solve?',
    body: 'How might we simplify the cumbersome process of integrating industry insights into client & portfolio level risk analysis?'
  },

  'slide-03': {
    label: 'Which stakeholders were affected',
    title: 'Which stakeholders were affected?'
  },

  'slide-04': {
    label: 'Additional context, and what a win looked like',
    title: 'Additional context',
    body: 'Modern surveillance could automate pieces of the workflow that previously had to be repeatedly performed by humans. Our design team was tasked with envisioning a new ecosystem of products that kept automation at its core.',
    title2: 'What did a win look like for the business?',
    body2: 'More time in the hands of analysts while maintaining the quality of analysis, if not improving it.'
  },

  'slide-05': {
    label: 'My understanding of the situation',
    impact: 'My understanding of the situation'
  },

  'slide-06': {
    label: 'How I adjusted my approach',
    title: 'A few questions that needed answering'
    /* the question above each diagram is in `questions` below;
       the counter under it is drawn by the page */
  },

  /* A TWO-BAND STRIP: the heading, and the writing under it. Short like the
     strips on slides 5, 9, 15 and 22, but it carries a paragraph rather than
     a single statement - so it has both a `title` and a `body`. */
  'slide-07': {
    label: 'Defining the UX problem statement(s)',
    title: 'Defining the UX problem statement(s)',
    body: 'How might we filter out important industry signals from all the noise?'
  },

  'slide-08': {
    label: 'How I approached the solution',
    title: 'How I approached the solution'
  },

  'slide-09': {
    label: 'Some initial ideas',
    impact: 'Some initial ideas'
  },

  'slide-10': { label: 'Initial ideas, diagram 1' },
  'slide-11': { label: 'Initial ideas, diagram 2' },
  'slide-12': { label: 'Initial ideas, diagram 3' },
  'slide-13': { label: 'Initial ideas, diagram 4' },
  'slide-14': { label: 'Initial ideas, diagram 5' },

  'slide-15': {
    label: 'Some challenges that came up',
    impact: 'Some challenges that came up'
  },

  'slide-16': {
    label: 'What didn’t work and why',
    title: 'What didn&rsquo;t work and why',
    items: [
      { n: '01', body: 'Impacts were a better signal to show. These upward and downward trends in green and red can be a bit misleading up might mean bad sometimes.' },
      { n: '02', body: 'The layout should align to match that of the client dashboard because this would eventually evolve into a more complex industry dashboard.' },
      { n: '03', body: 'A detailed heatmap would better enable them to compare long spanning trends. 20+ years of data can be included.' },
      { n: '04', body: 'Users wanted to see a cumulative view of all the material moves across industries. High level summary page.' }
    ]
  },

  'slide-17': { label: 'What didn’t work, diagram 1' },
  'slide-18': { label: 'What didn’t work, diagram 2' },
  'slide-19': { label: 'What didn’t work, diagram 3' },
  'slide-20': { label: 'What didn’t work, diagram 4' },

  'slide-21': {
    label: 'A last few enhancements',
    title: 'A last few enhancements',
    items: [
      { n: '01', body: 'One of the iterations heavily relied on AI to formulate insights. However, the risk associated with the possibility of the model hallucinating were too high. Hence we wanted to take a more "human in the loop" approach.' },
      { n: '02', body: 'Users wanted to have a view where they could look at one driver and all its correlated/impacted sub-industries.' },
      { n: '03', body: 'Something wrong with the summary view. Just show sub-industries as cards, the ones that have been impacted as highlighted.' },]
  },

  'slide-22': {
    label: 'What we finally built for phase 1',
    impact: 'What we finally built for phase 1'
  },

  'slide-23': { label: 'What we built, diagram 1' },
  'slide-24': { label: 'What we built, diagram 2' },
  'slide-25': { label: 'What we built, diagram 3' },
  'slide-26': { label: 'What we built, diagram 4' },

  'slide-27': { label: 'The prototype' },

  /* RESTORED from the old "Performance / Success Metrics" slide, which is
     where these four numbers were written. Each tile is a value, the unit
     under it, what it is called, and a line saying what it means.

     THE FIGURES ARE ILLUSTRATIVE - they were marked as such when they were
     first written, and nothing has replaced them yet. Swap them for the real
     ones here and nothing else changes. */
  'slide-28': {
    label: 'Impact of phase 1 launch',
    title: 'Performance / success metrics',
    eyebrow: 'Impact of phase 1 launch',
    stage: {
      kind: 'tiles', items: [
        {
          value: '1.2k', unit: 'sessions / month',
          label: 'Monthly usage',
          note: 'Six months after launch, against a page that did not exist the quarter before.'
        },
        {
          value: '4.3', unit: 'out of 5',
          label: 'User feedback &amp; surveys',
          note: 'Average rating across 61 responses in the first post-launch survey.'
        },
        {
          value: '68', unit: 'per cent',
          label: 'Adoption',
          note: 'Of analysts with industry coverage opened the KIDs page at least once a month.'
        },
        {
          value: '6:20', unit: 'median, per visit',
          label: 'General engagement',
          note: 'Long enough to read the drivers, short enough that nobody is hunting.'
        }
      ]
    }
  },

  'slide-29': {
    label: 'What I took away from this experience',
    title: 'What I took away from this experience',
    items: [
      { n: '01', body: 'Most analysts are basically credit officers and that their specializations can result in the creation of niche products.' },
      { n: '02', body: 'Providing a quick means of trend comparison can be valuable if the goal is to formulate a plausible hypothesis of emerging risks.' },
      { n: '03', body: 'Leveraging existing patterns of UI layout can be helpful in bridging the gap between current state & strategic state.' },
      { n: '04', body: 'Heatmaps are a great way of showing how badly a driver has affected an industry over a long period of time. Comparing that driver behaviour with others can really give a full picture of the industry situation.' }
    ]
  },

  /* The drawing is the whole of it. No words: `text: ''` removes the line
     that used to sit beside it, and the picture alone is the way back. */
  'slide-30': {
    label: 'Back to case studies',
    text: ''
  },

  /* =======================================================================
     THE PEOPLE - slide 3

     ONE BLOCK PER PERSON, and each one reads the way you would describe them
     out loud: who they are, then what there is to say about them.

         name          the person, in two or three words
         description   the line under it - their part in the story
         sections      the explains panel, in order. Each one is a HEADING
                       and the WRITING UNDER IT, written together.

     THE PICTURE SECTION says `picture: true` instead of a body. The drawing
     it shows is that person's `media2` in content.js.

     TO LEAVE A HEADING OUT, write `{ body: '…' }` with no heading and it
     takes the one in the SAME POSITION from `study.sections` above - the
     second section borrows the second heading. A section further down the
     list than that has no heading to borrow, and simply has none.

     TO GIVE ONE PERSON A SECTION THE OTHERS DO NOT HAVE, add it to their
     list. The panel is built per person, so they need not match.

     WHICH PERSON COMES FIRST is content.js's business, not this file's - so
     reordering the carousel never touches a word of anybody's writing.
     ===================================================================== */
  'user-1': {
    /* ---- user name and description ---- */
    name: 'The Industry Expert',
    description: 'Primary user &middot; Analyzes Industries Daily',

    /* ---- the explains panel ---- */
    sections: [
      {
        heading: 'Roles &amp; responsibilities',
        body: 'He is expected to have a most robust understanding of the industries he covers. The bank trusts him to be the second line of defense. Conducting nuanced analysis of an industry and relaying his findings to the rest of the credit team are key to his role.'
      },
      /* A BULLETED LIST. `kind: 'points'` is the same list the slides use,
         so it is written the same way here. Add or remove an item and
         nothing else has to change. */
      {
        heading: 'Jobs to be done',
        body: [{
          kind: 'points', items: [
            'Figure out which metrics/drivers are governing a given industry. Identify which of them have changed materially.',
            'Assess whether the trend shows cyclical or structural changes.',
            'Assess and articulate RISKS and STRENGTHS for businesses in that industry.'
          ]
        }]
      },
      {
        heading: 'Collaboration model',
        picture: true
      }
    ]
  },

  'user-2': {
    /* ---- user name and description ---- */
    name: 'The Credit Officer',
    description: 'Peripheral User &middot; Relies on Industry Insight to Assess Client Risk',

    /* ---- the explains panel ---- */
    sections: [
      {
        heading: 'Roles &amp; responsibilities',
        body: 'He is expected to be ready with an exhaustive understanding of the client(s) in his coverage. The bank doesn’t want to lend money to risky clients and his job is to let the bank know which ones are risky. Analyzing client-level risk and proposing grade & limit changes (supported by data) are key to his role. '
      },
      {
        heading: 'Jobs to be done',
        body: [{
          kind: 'points', items: [
            'Conduct risk analysis at the client level',
            'Identify risks & strengths',
            'Propose any changes to grade and/or limit when necessary'
          ]
        }]
      },
      {
        heading: 'Collaboration model',
        picture: true
      }
    ]
  },

  'user-3': {
    /* ---- user name and description ---- */
    name: 'CreditRisk Leadership',
    description: 'Peripheral User &middot; Commands Approval Authority',

    /* ---- the explains panel ---- */
    sections: [
      {
        heading: 'Roles &amp; responsibilities',
        body: 'She leads the credit risk division. Due to the unbelievably large portfolio she covers, she is trusted by the bank to not lose money. Setting long & short term lending strategies, analyzing aggregated data and approving credit decisions are key to her role.'
      },
      {
        heading: 'Jobs to be done',
        body: [{
          kind: 'points', items: [
            'Conduct portfolio level analysis',
            'Identify risks and strengths at the portfolio level',
            'Set long & short term strategies',
            'Approve grade change requests',
            'Approve limit change requests',
            'Other approvals',
            'Define op model'
          ]
        }]
      },
      {
        heading: 'Collaboration model',
        picture: true
      }
    ]
  },

  /* =======================================================================
     THE ONE DRAWER

     This page has a single drawer, and the golden panel at the top of slide
     2 is what opens it. To make a second one: add another block here, add
     it to `drawers` in content.js, and point something at it by name.
     ===================================================================== */
  'drawer-01': {
    title: 'How the scope widened',
    body: [
      'PLACEHOLDER &mdash; the fuller version of the chain on the slide.',
      'The brief asked for a page for monitoring key industry drivers. Research showed that analysts also wanted rating trends, market information, news, emerging themes and SWOT assessments — none of which fit on a drivers page.',
      'Rather than refuse the extra scope or absorb it quietly, we put it to stakeholders as a phased product. The wider dashboard needed more time, but it drew more support, and phasing let the first useful thing ship without waiting for it.'
    ]
  },

  /* =======================================================================
     EVERY CAPTION, FILED UNDER THE PICTURE IT DESCRIBES

     A picture with no entry here simply has no caption, which is the right
     answer for a diagram that fills its slide and speaks for itself.
     ===================================================================== */
  captions: {},

  /* =======================================================================
     SLIDE 6 ONLY - THE QUESTION ABOVE EACH DIAGRAM

     Filed under the picture's own name, for the same reason captions are:
     the question belongs to the diagram that answers it, so moving the
     diagram moves the question with it.
     ===================================================================== */
  questions: {
    'slide-06_img-01': 'What is required for an industry expert to  conduct analysis?',
    'slide-06_img-02': 'What is required for an industry expert to  conduct analysis?',
    'slide-06_img-03': 'What is required for an industry expert to  conduct analysis?',
    'slide-06_img-04': 'What does the output of his analysis look like?',
    'slide-06_img-05': 'How does a credit officer use this output to assess clients?',
    'slide-06_img-06': 'What is the relation between a client, a portfolio and an industry?',
    'slide-06_img-07': 'Where do the points of friction lie in the current process of forming an industry outlook?'
  },

  /* no tabbed sets left in this study, so nothing to name */
  labels: {}
};


