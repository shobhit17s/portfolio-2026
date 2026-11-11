/* ===========================================================================
   data/ptp.js — the figures behind both Performance to Plan widgets.

   ONE MODEL, TWO SCREENS. Concept 1 and Concept 3 are two arrangements of
   exactly the same numbers, which is the point of comparing them: any
   difference you see is the arrangement, not the data.

   ---------------------------------------------------------------------------
   THE WASHES ARE WORKED OUT, NOT PAINTED ON
   ---------------------------------------------------------------------------
   No cell is marked "highlighted" below. Each attribute carries the size of
   gap that counts as significant FOR IT, and the widget compares. So the
   screen changes when the numbers change, which is usually the thing a
   prototype exists to show: move `significant` and watch which cells light
   up without touching a figure.

   WHY THE THRESHOLD IS PER ATTRIBUTE. A flat 10% marks leverage at Q1
   (+0.4 on 3.5 is 11%) and your reference does not mark it — rightly, since
   leverage drifting a tenth of a turn early in the year is ordinary and
   cashflow missing by a sixth is not. One number cannot say that about five
   different measures. These five reproduce your reference exactly; they are
   a starting position, not a finding.

   `rising` IS WHETHER UP IS GOOD, which is not whether the number went up.
   More revenue is good; more leverage is not. The sentiment follows from
   this and the sign, never from the sign alone.
   =========================================================================== */
window.PTP = {

  meta: {
    title:    'Performance to Plan',
    currency: 'USD ($)',
    scale:    'Millions',
    /* EACH CASE IS A DIFFERENT PLAN, and that is the whole of what the
       dropdown changes. See the long note under `attributes`. */
    cases: [
      { id: 'credit',     name: 'Credit case' },
      { id: 'management', name: 'Management case' },
      { id: 'downside',   name: 'Downside case' }
    ],
    planLabel: 'FYE 2025',
    planShort: 'FYE 25'
  },

  /* The quarters, in order. `actual: false` is a quarter that has not been
     reported yet — drawn as N/A rather than left blank, so an empty cell is
     never mistakable for a zero. */
  quarters: [
    { id: 'q1', label: 'Q1', asOf: 'As of: Q1 2025', actual: true  },
    { id: 'q2', label: 'Q2', asOf: 'As of: Q2 2025', actual: true  },
    { id: 'q3', label: 'Q3', asOf: 'As of: Q3 2025', actual: true  },
    { id: 'q4', label: 'Q4', asOf: 'As of: Q4 2025', actual: false }
  ],

  /* unit:        how the figure is written
     plan:        the projection for the full year, ONE PER CASE
     actuals:     what each quarter came in at
     rising:      is UP good?
     significant: the gap, as a fraction of plan, at which this attribute
                  is worth a second look

     ---------------------------------------------------------------------
     WHY THE CASE CHANGES THE PLAN AND NOT THE ACTUALS
     ---------------------------------------------------------------------
     The actuals are what the company DID. They do not change because you
     looked at a different case - there is only one past. The case is what
     you said WOULD happen, so a case is a plan, and switching case
     switches the line the actuals are being measured against.

     Everything else follows from that on its own: the deltas are actual
     minus plan, so they all move; and a cell is washed when the gap
     passes this attribute's threshold, so the set of washed cells moves
     with them. Nothing in the widget had to be told about cases.

     THE THREE PLANS TELL THREE DIFFERENT STORIES, on purpose:

       Credit       the bank's own line. Nine cells washed, all negative -
                    a client drifting off plan through the year.
       Management   the company's own, more ambitious line. Twelve cells
                    washed, all negative: against what they promised
                    themselves they are further behind still.
       Downside     the stress line. Six cells, and a MIX - ahead of a
                    pessimistic plan early in the year and behind it by
                    Q3, which is the picture that actually matters.

     That third one is the reason to have cases at all: the same client
     reads as a problem or as a near miss depending on what you measured
     them against, and the screen has to be able to say so. */
  attributes: [
    { id: 'revenue', label: 'Revenue', unit: 'plain',
      plan: { credit: 500, management: 540, downside: 450 }, actuals: { q1: 485, q2: 455, q3: 420 },
      rising: true,  significant: 0.12 },

    { id: 'ebitda', label: 'EBITDA', unit: 'plain',
      plan: { credit: 70, management: 78, downside: 52 }, actuals: { q1: 64, q2: 54, q3: 43 },
      rising: true,  significant: 0.12 },

    { id: 'ebitda-margin', label: 'EBITDA Margin', unit: 'pp',
      plan: { credit: 14.0, management: 14.5, downside: 11.0 }, actuals: { q1: 13.2, q2: 11.9, q3: 10.2 },
      rising: true,  significant: 0.12 },

    /* LEVERAGE CARRIES ITS OWN, LOOSER THRESHOLD. At 0.12 a first-quarter
       drift of +0.4x would be marked, and your reference leaves it alone.
       0.35 is the first value that marks nothing in Q1-Q2 and does mark the
       5.8x in Q3, which is the reading the drawing gives. */
    { id: 'leverage', label: 'Leverage', unit: 'x',
      plan: { credit: 3.5, management: 3.2, downside: 4.9 }, actuals: { q1: 3.9, q2: 4.6, q3: 5.8 },
      rising: false, significant: 0.35 },

    { id: 'cashflow', label: 'Cashflow', unit: 'plain',
      plan: { credit: 42, management: 48, downside: 18 }, actuals: { q1: 35, q2: 22, q3: 10 },
      rising: true,  significant: 0.12 }
  ]
};
