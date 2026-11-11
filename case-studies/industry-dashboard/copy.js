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
    lead: `Streamlined industry research by transforming fragmented data-gathering and manual analysis into an automated intelligence platform, enabling faster signal identification, deeper historical analysis, and more productive research workflows.`,
    /* The sheet writes these with semicolons; they are four separate things,
       so each gets its own drawn chip. */
    tags: ['Duration: Four Months', 'AGILE Framework', 'Information Design',
      'Data Visualization', 'Product Thinking', 'AI-Native']
  },

  'slide-02': {
    label: 'Basics of Credit Risk',
    headNote: `Hello visitor! This case study is centred around the domain of CreditRisk. If you’re not already familiar with the basics, I suggest you take the next 5 mins to read through this section.`,
    accordionWords: {
      'acc-01': {
        label: `What is CreditRisk?`,
        body: [
          `CreditRisk is the department where I worked for almost 4 years during my time at JP Morgan Chase & Co. In a nutshell, this is the high-volume (and high-risk) lending division of the bank tasked with helping out businesses in need of loans. Naturally, any bank wants to lend money to only those borrowers with whom the likelihood of default is minimal. Hence, CreditRisk employs several analysts (called “Credit Officers”) whose job is exactly that — to assess the risk in lending money to a given client.`,
          `There is also a social hierarchy in place. As Credit Officers gain more experience, they take on more senior/leadership roles. Typically at senior levels, the number of clients in a Credit Officer’s portfolio increases, which is to say that their “coverage” grows. Hence senior Credit Officers are more interested in looking at (and comparing) aggregated data, and not so much the client-level numbers. Some specialize in portfolios pertaining to a specific industry (such as automotive portfolios) while others handle a more diverse mix of clients. Their ultimate responsibility is to “grade” the client(s) in their coverage, which is a technical way of saying, “assess how risky the client is.”`,
          `In any case, if you must take one thing away from this write-up, it is that anyone working in CreditRisk is in some way helping the bank minimize the chances of losing money to corporate borrowers.`,
        ],
      },
      'acc-02': {
        label: `Tech Adoption in CreditRisk`,
        body: [
          `A broad issue at the time was that while trying to assess a client’s credit-worthiness, a Credit Officer would require bits and pieces of information that were scattered across multiple channels and repositories. This friction in the older op-model had to be addressed in order to move towards a more proactive vision.`,
          `As a result, post 2020-2021, CreditRisk JPMC made considerable investments into building a new ecosystem of products that spoke to and worked smoothly in tandem with one another, thus enabling Credit Officers to make sound assessments at lightning speeds. The bedrock of this vision was made possible by frontier AI models that allowed automation of mundane tasks such as surveillance, data-gathering and some basic level of analysis.`,
        ],
      },
      'acc-03': {
        label: `The plan for a new product ecosystem`,
        body: [
          `PHASE ONE was centered around gathering data from scattered sources and publishing it on a centralized interface for client-level risk assessment. This was called the Client Dashboard. As a parallel effort, our design team also worked on modules that fed data into the Client Dashboard. Some examples that I worked on include Market Indicators, Key Industry Metrics and Projections.`,
          `PHASE TWO focused on portfolio-level risk assessment. There were two key products that we designed in this phase:`,
          {
            kind: 'points',
            items: [
              `A Portfolio Builder, which allowed Credit Officers to actually build out a portfolio to begin their assessment.`,
              `A Portfolio Dashboard which served Credit Officers with aggregated data relevant to assessing portfolio-level risks.`,
            ],
          },
          `PHASE THREE was about enabling continuous surveillance & proactive risk management. The centerpiece of this phase was the Surveillance Dashboard which surfaced flagged items that either required an action by the Credit Officer or were simply alerts/notifications meant to aid investigation. This is when our team also designed system-level patterns that directed a Credit Officer through various downstream services such as grading/limit management.`,
          `Overall, this framework served as a recursive loop meant to continuously assess credit risk.`,
        ],
      },
    },
  },

  'slide-03': {
    label: 'slide-03: Business Problem',
    title: 'What problem was the business trying to solve?',
    body: 'How might we simplify the cumbersome process of integrating industry insights into client & portfolio level risk analysis?'
  },

  'slide-04': {
    label: 'Which stakeholders were affected',
    title: 'Which stakeholders were effected?'
  },

  /* ----------------------------------------------------------------------------------------------------------------------------- */
  /* ----------------------------------------------------------------------------------------------------------------------------- */

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

  /* ----------------------------------------------------------------------------------------------------------------------------- */
  /* ----------------------------------------------------------------------------------------------------------------------------- */

  'slide-05': {
    label: 'Additional context, and what a win looked like',
    title: 'Additional context',
    body: 'Modern surveillance could automate pieces of the workflow that previously had to be repeatedly performed by humans. Our design team was tasked with envisioning a new ecosystem of products that kept automation at its core.',
    title2: 'What did a win look like for the business?',
    body2: 'More time in the hands of analysts while maintaining the quality of analysis, if not improving it.'
  },

  'slide-06': {
    label: 'My understanding of the situation',
    impact: 'My understanding of the situation'
  },

  'slide-07': {
    label: 'How I adjusted my approach',
    title: 'A few questions that needed answering',
    viewTitles: [
    'What is required for an industry expert to  conduct analysis?',
    'What is required for an industry expert to  conduct analysis?',
    'What is required for an industry expert to  conduct analysis?',
    'What does the output of his analysis look like?',
    'How does a credit officer use this output to assess clients?',
    'What is the relation between a client, a portfolio and an industry?',
    'Where do the points of friction lie in the current process of forming an industry outlook?'
  ],
    /* the question above each diagram is in `questions` below;
       the counter under it is drawn by the page */
  },

  /* ----------------------------------------------------------------------------------------------------------------------------- */
  /* ----------------------------------------------------------------------------------------------------------------------------- */

  /* =======================================================================
     SLIDE 7 ONLY - THE QUESTION ABOVE EACH DIAGRAM

     Filed under the picture's own name, for the same reason captions are:
     the question belongs to the diagram that answers it, so moving the
     diagram moves the question with it.
     ===================================================================== */
  
    
  

  /* ----------------------------------------------------------------------------------------------------------------------------- */
  /* ----------------------------------------------------------------------------------------------------------------------------- */

  /* A TWO-BAND STRIP: the heading, and the writing under it. Short like the
     strips on slides 5, 9, 15 and 22, but it carries a paragraph rather than
     a single statement - so it has both a `title` and a `body`. */
  'slide-08': {
    label: 'slide-08: Defining the UX problem statement(s)',
    title: 'Defining the UX problem statement(s)',
    body: 'How might we filter out important industry signals from all the noise?'
  },

  'slide-09': {
    label: 'How I approached the solution',
    title: 'How I approached the solution'
  },

  'slide-10': {
    label: 'Initial low fidelity concepts',
    impact: 'Initial low fidelity concepts'
  },

  'slide-11': { label: 'Initial ideas, diagram 1' },
  'slide-12': { label: 'Initial ideas, diagram 2' },
  'slide-13': { label: 'Initial ideas, diagram 3' },
  'slide-14': { label: 'Initial ideas, diagram 4' },
  'slide-15': { label: 'Initial ideas, diagram 5' },

  'slide-16': {
    label: 'The concepts were then reviewed with the SME and focus group',
    impact: 'The concepts were then reviewed with the SME and focus group'
  },

  'slide-17': {
    label: 'What was lacking in the designs',
    title: 'What was lacking in the designs',
    items: [
      { n: '01', body: 'Impacts were a better signal to show. These upward and downward trends in green and red can be a bit misleading up might mean bad sometimes.' },
      { n: '02', body: 'The layout should align to match that of the client dashboard because this would eventually evolve into a more complex industry dashboard.' },
      { n: '03', body: 'A detailed heatmap would better enable them to compare long spanning trends. 20+ years of data can be included.' },
      { n: '04', body: 'Users wanted to see a cumulative view of all the material moves across industries. High level summary page.' }
    ]
  },

  'slide-18': { label: 'What didn’t work, diagram 1' },
  'slide-19': { label: 'What didn’t work, diagram 2' },
  'slide-20': { label: 'What didn’t work, diagram 3' },
  'slide-21': { label: 'What didn’t work, diagram 4' },

  'slide-22': {
    label: 'A last few enhancements',
    title: 'A last few enhancements',
    items: [
      { n: '01', body: 'One of the iterations heavily relied on AI to formulate insights. However, the risk associated with the possibility of the model hallucinating were too high. Hence we wanted to take a more "human in the loop" approach.' },
      { n: '02', body: 'Users wanted to have a view where they could look at one driver and all its correlated/impacted sub-industries.' },
      { n: '03', body: 'Something wrong with the summary view. Just show sub-industries as cards, the ones that have been impacted as highlighted.' },]
  },

  'slide-23': {
    label: 'What we finally built for phase 1',
    impact: 'What we finally built for phase 1'
  },

  'slide-24': { label: 'What we built, diagram 1' },
  'slide-25': { label: 'What we built, diagram 2' },
  'slide-26': { label: 'What we built, diagram 3' },
  'slide-27': { label: 'What we built, diagram 4' },

  'slide-28': { label: 'The prototype' },

  /* RESTORED from the old "Performance / Success Metrics" slide, which is
     where these four numbers were written. Each tile is a value, the unit
     under it, what it is called, and a line saying what it means.

     THE FIGURES ARE ILLUSTRATIVE - they were marked as such when they were
     first written, and nothing has replaced them yet. Swap them for the real
     ones here and nothing else changes. */
  'slide-29': {
    label: 'Business Impact',
    title: `Business Impact`,
    marks: `letters`,
    items: [
      {
        sections: [
          {
            heading: `Improved analyst productivity and operational efficiency`,
            body: `Instead of spending hours retrieving, consolidating, organising, and preparing datasets, analysts could access pre-aggregated, structured information through a single interface.`,
          },
        ],
      },
      {
        sections: [
          {
            heading: `Faster identification of industry signals`,
            body: `Reduced time to identify potentially material industry developments, enabling analysts to respond to emerging trends more quickly.`,
          },
        ],
      },
      {
        sections: [
          {
            heading: `Improved analytical depth and historical context`,
            body: `Enabled more comprehensive, historically informed industry analysis without proportionately increasing the effort required from analysts.`
          }
        ]
      },
      {
        sections: [
          {
            heading: `Greater consistency and standardisation of analysis`,
            body: `Improved consistency and standardisation of analytical workflows, creating a more unified foundation for industry research.`
          }
        ]
      }
    ],
  },

  'slide-30': {
    label: 'What I took away from this experience',
    title: 'What I took away from this experience',
    items: [
      { n: '01', body: 'Most analysts are basically credit officers and that their specializations can result in the creation of niche products.' },
      { n: '02', body: 'Providing a quick means of trend comparison can be valuable if the goal is to formulate a plausible hypothesis of emerging risks.' },
      { n: '03', body: 'Leveraging existing patterns of UI layout are a must for bridging the gap between current state & strategic state.' },
      { n: '04', body: 'Heatmaps are a great way of showing how badly a driver has affected an industry over a long period of time. They combine the familiarity of grids with the visualization of essential signals.' }
    ]
  },

  /* The drawing is the whole of it. No words: `text: ''` removes the line
     that used to sit beside it, and the picture alone is the way back. */
  'slide-31': {
    label: 'Back to case studies',
    text: ''
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

  /* no tabbed sets left in this study, so nothing to name */
  labels: {}
};


