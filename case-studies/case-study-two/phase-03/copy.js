/* ===========================================================================
   phase-03/copy.js — THE WORDS FOR THE PHASE 3 TAB

   Every block this phase's slides ask for, by the name on their `copy:`
   line in phase-03/content.js.

   ITS NAMES ARE ITS OWN. `slide-01` here is phase 3's first slide and has
   nothing to do with `slide-01` in phase-01/copy.js or in the study's own
   copy.js - a phase's slides are looked up here FIRST.

   A key this file does not have is looked for in the study's copy.js, so
   shared things still work without being copied in.

   NOTHING IS NEEDED YET, because the slides in this phase are placeholders
   and a placeholder reads nothing from this file. Write blocks here as the
   real slides go in.
   =========================================================================== */
window.CS = window.CS || {};
CS.TAB_COPY = CS.TAB_COPY || {};

CS.TAB_COPY['phase-03'] = {

  'slide-01': {
       label: 'slide-01',
       title: 'Designing for Phase 03',
       body:  [
        `In phase 3, the ecosystem had become much more complex. I collaborated with several stakeholders to align op-model decisions.`,
        {kind: 'points', items: [
          `Surveillance Dashboard was being built as a touchpoint for users to address pending action items/breaches/requests/approvals.`,
          `Client dashboard, which had already been launched was being used as a place to investigate clients.`,
          `A Grading module had been incorporated into the new ecosystem`,
          `A standard review & approval process was being designed as part of the new op-model.`
        ]}
       ]
     },

     'slide-02': {
      label: 'slide-02',
     },

     'slide-03': {
      label: 'slide-03',
      stepWords: {
        'step-1': {label: `Indicator/Signal`, title: `Indicator/Signal`},
        'step-2': {label: `Investigation`, title: `Investigation`},
        'step-3': {label: `Assessment/Opinion`, title: `Assessment/Opinion`},
        'step-4': {label: `Take Action`, title: `Take Action`},
        'step-5': {label: `Review & Approval`, title: `Review & Approval`},
        'step-6': {label: `Audited`, title: `Audited`}

      }
     }

};