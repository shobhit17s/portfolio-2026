/* ===========================================================================
   copy.js — EVERY WORD IN THIS CASE STUDY. Nothing else.

   Built 20 October from the slide-structure sheet.

   ---------------------------------------------------------------------------
   WHAT IS REAL AND WHAT IS A PLACEHOLDER
   ---------------------------------------------------------------------------
   The sheet printed exact words for some slides and said "Copy to be added
   manually by me" for the rest. So:

       HEADINGS the sheet gave     are here word for word
       EVERYTHING ELSE             is a placeholder, and every placeholder
                                   is marked  [TO WRITE]

   Search this file for TO WRITE and you have the complete list of what is
   still owed. Delete the marker as you replace each one.

   Three headings on the sheet are themselves placeholders - "Title",
   "[SLIDE STRIP TITLE] ..." - so those are marked too.

   ---------------------------------------------------------------------------
   THE THREE FILES
   ---------------------------------------------------------------------------
       copy.js     what it says      this file
       media.js    what pictures     next door
       content.js  what order        next door
   =========================================================================== */
window.CS = window.CS || {};

CS.COPY = {
  /* The page's own title bar and the words on the way out. */
  meta: {
    title: 'Case study #2',
    subtitle: '[TO WRITE] one line under the title in the top bar',
    backLabel: 'back to the worlds',
  },

  /* ---------------------------------------------------------------------
     SHARED ACROSS THE STUDY
     ---------------------------------------------------------------------
     `sections` here is the fallback list of headings for the people panel.
     Each person names their own below, so this is only a safety net. */
  study: {
    sections: ['Who they are', 'What they are trying to do', 'In context'],
  },

  /* --- 1 · The title ------------------------------------------------- */
  'slide-01': {
    label: 'Title',
    title: 'PROJECTIONS',
    subtitle: 'Frictionless generation of insights on client performance and sensitivity',
    lead: [
      `Significantly reduced user toil`,
      `Increased access to projection-based insights`,
      `Set the precedence for proactive risk management`],
    tags: [
      `Variance Analysis`,
      `Scenario Comparison`,
      `Credit Risk Monitoring`,
      `Design Refinement`,
      `Concept Exploration & Validation`,
      `Stakeholder Collaboration & Alignment`,
    ],
  },

  /* --- 2 · The business problem --------------------------------------
     THE GOLDEN SURFACE holds a heading and up to three paragraphs. It is
     in its plain state - no line in Caveat, nothing to press - because
     slide 2 in content.js names no drawer. */
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

  /* --- 3 · The stakeholders ------------------------------------------ */
  'slide-03': {
    label: 'The business problem',
    title: 'What problem was the business trying to solve?',
    body: [
      `Projections are used to ascertain 2 things:`,
      {
        kind: 'points',
        items: [
          `Is the client performing as per expectations?`,
          `How sensitive is the client to various scenarios?`,
        ],
      },
      `Before the new ecosystem & op-model were conceived, all this assessment was being done offline, and required manual effort. Hence, the problem to be solved was, “how might we onboard & integrate the entire projections experience into the new product ecosystem, thus saving time & minimizing human efforts?”`,
    ],
  },

  /* --- 4 · How the understanding was built ---------------------------
     Four diagrams. Each one's QUESTION is under `questions` at the foot of
     this file and each one's WRITING is under `bodies`, both filed by the
     picture's own name, so moving a diagram moves its words with it. */
  'slide-04': {
    label: 'Understanding basic concepts',
    title: 'Understanding basic concepts',
  },

  /* --- 5 · Basic Questions I Asked -------------------------------------------- */
  'slide-05': {
    label: 'Affected users',
    title: `Affected users`,
  },

  'user-1': {
    name: `Junior Credit Officer (primary user)`,
    sections: [
      {
        heading: 'Role & Responsibilities',
        body: `They are expected to build projections for their coverage of clients that address a minimum number of required cases. They monitor the ‘performance to plan’ of their client(s) and flag any significant deviations. They also generate case comparisons for conducting a deeper analysis on the client(s).`,
      },
      {
        heading: 'Jobts To Be Done',
        body: [
          {
            kind: 'points',
            items: [
              `Monitor Performance to Plan`,
              `Generate and share case comparison results`,
              `Identify, investigate and take action on material deviations in Performance to Plan`,
            ],
          },
        ],
      },
    ],
  },

  'user-2': {
    name: `Senior Credit Officer (secondary user)`,
    sections: [
      {
        heading: 'Role & Responsibilities',
        body: `He heads one of the teams reporting to leadership and ensures that the projections produced by his crew are robust and defendable. Any grade changes or new uploads need to be reviewed by him.`,
      },
      {
        heading: 'Jobts To Be Done',
        body: [
          {
            kind: 'points',
            items: [
              `Pressure-test, review and approve projections shared by juniors`,
              `Provide other necessary approvals`,
            ],
          },
        ],
      },
    ],
  },

  /* --- 6 · Affected Users --------------------------------- */
  'slide-06': {
    label: 'Learnings',
    title: `Learnings`,
  },

  /* --- 7 · Chapter: the approach -------------------------------------- */
  'slide-07': {
    label: `What I took away from the experience`,
    title: `What I took away from the experience`,
    items: [
      {
        body: 'Working in an environment with limited research and validation reinforced the importance of distinguishing between informed design decisions and assumptions. It also highlighted the need to make uncertainty visible rather than treating unvalidated decisions as established facts.',
      },
      {
        body: 'Although I understood the importance of research-driven design in theory, the experience helped me recognise how easily research can become deprioritised in delivery-focused environments. In retrospect, I would have advocated for smaller, more achievable research initiatives rather than treating research as something that required a dedicated programme or significant resources.',
      },
    ],
  },

  /* --- 8 · Chapter: the approach -------------------------------------- */
  'slide-08': {
    label: 'Grid with UX problem statements',
    title: `Grid with UX problem statements`,
  },

  /* --- 9 · Chapter: Learnings --------------------------------------- */
  'slide-09': {
    label: `Chapter: Learnings`,
    title: `Reflections and Lessons Learnt`,
  },

  /* --- 10 · Learnings: Expanded ----------------------------------------- */

  'slide-10': {
    label: `Learnings: Expanded`,
    title: `What I took away from this project`,
    items: [
      {
        body: [
          `At the beginning of the project, I didn’t really understand the impact projections had on the rest of the CreditRisk process.`,
          `One big lesson I learnt from this project was that while designing for something with such high downstream impact, one should always start by critiquing the op-model/systems strategy.`,
        ],
      },
      {body: [`Placeholder`, `Placeholder`]},
    ],
  },

  'slide-11': {
    label: `Back to the worlds`,
  },

  /* =======================================================================
     THE QUESTION ABOVE A STEPPED DIAGRAM
     =======================================================================
     Filed under the PICTURE's name, not the slide's, so that a question and
     the diagram it belongs to travel together. Slides 4, 8 and 9 use these.
     ===================================================================== */
  questions: {
    'slide-04_img-01': `What are projections?`,
    'slide-04_img-02': `How are they used to determine Performance to Plan?`,
    'slide-04_img-03': `What are case comparisons, and how are projections related to them?`,
  },

  /* =======================================================================
     THE WRITING BESIDE A STEPPED DIAGRAM
     =======================================================================
     Slide 4 only - it is the one with `split: true`. Filed the same way, by
     the picture's name. A string, or a list of paragraphs.
     ===================================================================== */
  bodies: {
    'slide-04_img-01': [
      'Fundamentally, a projection is a quantitative prediction of how the business/client is expected to perform in the next X quarters or years, considering a set of base assumptions (called a “case”). The client’s performance is expressed using standard metrics such as revenue, EBITDA, EBITDA Margin, Cashflow, Net Profit, CAPEX, Leverage Ratio etc.',
      'The user typically makes at least three projections for every client, called the “base case”, the “upside case” and the “downside case”. Each represents expected client performance under distinct scenarios. For example, a downside case represents an unfavorable scenario where the client performance declines over time.',
    ],
    'slide-04_img-02': [
      `Approved projections are used as a benchmark to assess actual client performance. For example, if a client’s actual revenue in FY25 is $50M and the projected number in the base case for the corresponding year is $45M, the client is said to be performing better than expected. This could potentially mean an increase in borrowing power. This kind of assessment is called a “Performance to Plan” analysis.`,
    ],
    'slide-04_img-03': [
      `To understand how sensitive a client would be to various scenarios, Credit Officers compare the different cases within a projection. For example, a client’s projection might look good in a management case but can be severely sensitive to credit & downside cases. Higher sensitivity can imply lesser confidence in lending. This kind of assessment is called a “Case Comparison”.`,
    ],
  },

  /* =======================================================================
     CAPTIONS
     =======================================================================
     Filed by the picture's name. The counter under a stepped diagram is NOT
     a caption - the engine writes that itself from the length of the list.
     ===================================================================== */
  captions: {},

  labels: {},
};
