/* ===========================================================================
   phase-01/copy.js — THE WORDS FOR THE PHASE 1 TAB

   Every block this phase's slides ask for, by the name on their `copy:`
   line in phase-01/content.js.

   ITS NAMES ARE ITS OWN. `slide-01` here is phase 1's first slide and has
   nothing to do with `slide-01` in phase-03/copy.js or in the study's own
   copy.js - a phase's slides are looked up here FIRST.

   A key this file does not have is looked for in the study's copy.js, so
   shared things still work without being copied in.

   NOTHING IS NEEDED YET, because the slides in this phase are placeholders
   and a placeholder reads nothing from this file. Write blocks here as the
   real slides go in.
   =========================================================================== */
window.CS = window.CS || {};
CS.TAB_COPY = CS.TAB_COPY || {};

CS.TAB_COPY['phase-01'] = {
  'slide-01': {
    label: 'The 2 UX problems',
    title: 'The UX problems that needed solving',
    body: [
      `For phase 1:`,
      {
        kind: 'points',
        items: [
          `How might we help them generate & effectively comprehend case comparisons for a given projection?`,
          `How might we help them monitor a client’s performance to plan, and effortlessly spot material deviations?`,
        ],
      },
    ],
  },

  'slide-02': {
    label: `Team & Role`,
    title: `My design team`,
    body: [
      {
        kind: 'points',
        items: [
          `Multiple designers assigned to other apps/modules in the ecosystem`,
          `A design lead who defined strategy`,
        ],
      },
    ],
    title2: `Stakeholders I worked with`,
    body2: [
      {
        kind: 'points',
        items: [
          `1 SME for guidance`,
          `1 product owner`,
          `2 developers`,
          `A focus group comprising of 7 credit officers`,
        ],
      },
    ],
  },

  'slide-03': {
    label: 'slide-03: Old workflows',
    title: `The old workflows for both use-cases`,
  },

  'slide-04': {
    label: `slide-04: Proposed Workflow`,
    title: `The proposed workflows (aligned with the new product strategy)`,
  },

  'slide-05': {
    label: `What had already been built as part of the new ecosystem`,
    title: `What had already been built as part of the new ecosystem`,
  },

  'slide-06': {
    label: `Deciding on Touch Points`,
    title: `Deciding on Touch Points`,
    viewTitles: [
      `Touch Points in the new ecosystem (for both use-cases)`,
      `How the Touch Points are connected`,
    ],
  },

  'slide-07': {
    label: `slide-07`,
    impact: `Now that the Touch Points had been decided, I focused on the ideation of the actual wireframes for each use-case`,
  },

  'slide-08': {
    label: `slide-08`,
    title: `Use-Case #1: Performance to Plan`,
  },

  'slide-09': {
    label: `Some early lo-fi concepts`,
    title: `Some early lo-fi concepts`,
    groupsCaption: `For the junior credit officer`,
    sections: [
      {
        heading: `Problem Statement`,
        body: `How might we help them monitor a client’s performance to plan, and effortlessly spot material deviations?`,
      },
      {
        heading: `Scenario`,
        body: `It is Q3 2025, and the client has recently published their financials. An assessment has to be made of how the client’s performance has changed over the course of the year and whether they’re straying far from projected values.`,
      },
      {heading: 'User', picture: true},
      {
        heading: `What they want to ASSESS`,
        body: [
          {
            kind: `points`,
            items: [
              `Compare client’s performance against cases within an approved projection`,
              `Flag any significant deviations`,
            ],
          },
        ],
      },
      {
        heading: `What they want to AVOID`,
        body: [
          {
            kind: `points`,
            items: [
              `Having to access multiple touch-points to make the comparison`,
              `Manually flag problematic areas`,
            ],
          },
        ],
      },
    ],
    viewTitles: [
      `Typical structure of a widget on client dashboard`,
      `Concept #1: A grid with grouped columns`,
      `Concept #2: Data visualization`,
      `Concept #3: A visually continuous grid`,
      `Where it would live on the client dashboard`,
    ],
  },

  'slide-10': {
    label: 'slide-10: Plotting feasibility VS impact',
    title: `Plotting feasibility VS impact for each concept`,
  },

  'slide-11': {
    label: `slide-11`,
    title: `2 High fidelity concepts (tested with focus group)`,
    viewTitles: [
      `Concept #1: A grid with grouped columns`,
      `Concept #3: A visually continuous grid`,
    ],
  },

  'slide-12': {
    label: `slide-12: Feedback on hifi concepts`,
    title: `What the focus group had to say about the designs`,
    items: [
      {
        sections: [
          {
            heading: `What they liked about Concept #1`,
            body: [
              {
                kind: 'points',
                items: [
                  `Clearly separated Q1 and Q2 reporting.`,
                  `Made it easy to compare projected vs actual financials at each reporting date.`,
                  `Highlighted the variance for each period.`,
                ],
              },
            ],
          },
          {
            heading: `Limitation(s)`,
            body: `Users had to mentally compare Q1 and Q2 to understand the trajectory of deterioration`,
          },
        ],
      },
      {
        sections: [
          {
            heading: `What they liked about Concept #3`,
            body: [
              {
                kind: 'points',
                items: [
                  `Made it easier to identify when a significant deviation first occurred.`,
                  `Provided a consolidated view of the entire financial year.`,
                ],
              },
            ],
          },
          {
            heading: `Limitation(s)`,
            body: `Showed only significant variances. This would required a way for users to define what “significant” meant.`,
          },
        ],
      },
    ],
    marks: 'letters',
  },

  'slide-13': {
    label: `slide-13: Final Prototype`,
    title: `What was finally built`,
    prototypeTitle: `Click on the "Client Health" tab to view the widget`,
  },

  'slide-14': {
    label: `slide-14: Business impact`,
    title: `Business impact`,
    items: [
      `Saved 50% of the manual efforts through automation.`,
      `Created an essential widget that would automatically detect and generate action items for phase 3 (continuous monitoring framework).`,
    ],
  },

  'slide-15': {
    label: `transition from problem statement #1 to problem statement #2`,
    from: {
      date: `Jun-2024May-2024 to Jun-2024`,
      name: `Use-Case #1: Performance to Plan`,
    },
    to: {
      date: `Aug-2024 to Nov-2024`,
      name: `Use-Case #2: Case Comparison`,
    },
  },

  'slide-16': {
    label: ``,
    title: `Problem #2: Case Comparison`,
  },

  'slide-17': {
    label: `Some early lo-fi concepts`,
    title: `Some early lo-fi concepts`,
    groupsCaption: `For the junior credit officer`,
    sections: [
      {
        heading: `Problem Statement`,
        body: `How might we help them generate & effectively comprehend case comparisons for a given projection?`,
      },
      {
        heading: `Scenario`,
        body: `A client comes in, asking for a new facility, let’s say worth 100 million dollars. The junior credit officer has to now assess how sensitive this client would be to different scenarios.`,
      },
      {heading: 'User', picture: true},
      {
        heading: `What they want to ASSESS`,
        body: `How sensitive would this client be to the three standard cases?`,
      },
      {
        heading: `What they want to AVOID`,
        body: `Having to spend hours on this task.`,
      },
    ],
    viewTitles: [
      `Concept #2A: Results in the form of a grid`,
      `Concept #2B: Results in the form of an interactive chart`,
      `Concept #2C: Results in the form of insights`,
      `Controls they must have`,
      `Concept #3A: Exporting a modular template to convey a custom narrative`,
      `Concept #3B: Exporting a standard template`,
    ],
  },

  'slide-18': {
    label: `slide-18: Plotting feasibility VS impact`,
    title: `Plotting feasibility VS impact`,
  },

  'slide-19': {
    label: `slide-19: Concepts tested with focus group`,
    title: `2 concepts that were tested with the focus group`,
    prototypeTitles: [
      `Approach 1: Generate first, configure afterwards`,
      `Approach 2: Configure first, generate afterwards`,
    ],
  },

  'slide-20': {
    label: `slide-20: Feedback on hifi concepts`,
    title: `What the focus group had to say about the designs`,
    items: [
      {
        sections: [
          {
            heading: `What they liked`,
            body: [
              {
                kind: 'points',
                items: [
                  `Ability to select the base case`,
                  `Ability to select attributes of choice`,
                  `The interactive data visualization`,
                ],
              },
            ],
          },
        ],
      },
      {
        sections: [
          {
            heading: `What they felt was lacking`,
            body: [
              {
                kind: 'points',
                items: [
                  `Ability to show/hide deltas (reduce visual clutter)`,
                  `Ability to select the projection period`,
                  `Ability to set the unit for measuring the variance (percentages VS absolute values)`,
                  `Group the cases by selected attributes, rather than showing them as tabs`,
                ],
              },
            ],
          },
        ],
      },
      `Majority of the focus group preferred the second approach: Configure first, generate afterwards`,
    ],
    marks: `none`,
  },

  'slide-21': {
    label: `slide-21: Final Prototype`,
    title: `What was finally built`,
  },

  'slide-22': {
    label: `slide-22: Business impact`,
    title: `Business impact`,
    items: [
      `Significantly reduced time to insight for all users, by being able to generate them with just a click of a button.`,
      `Created a standardized template of results for everyone, thus reducing the cognitive burden of comprehending results.`,
      `Significantly increased ease of access to case comparison results (and other forms of projection-based analysis in the future).`,
    ],
  },
};
