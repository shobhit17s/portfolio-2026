/* ===========================================================================
   widgets.js — WHAT IS IN EACH TAB.

   This is the file to edit when you want to add, remove, rename or move a
   widget. Nothing else needs to change: the HTML holds the empty tabs, the
   CSS holds the look, and dashboard.js reads this list and builds them.

   Each entry is one widget:

       id     the element's id. Yours to rename - nothing else refers to it.
       name   what the header says.
       wide   true  = spans both columns
              false = one of two side by side        (default)
       type   'placeholder'  a grey block with a SECONDARY label and a CTA
              'ptp'          the real Performance to Plan widget
       body   how tall the grey block is, in pixels. Optional.

   TO MOVE THE PERFORMANCE TO PLAN WIDGET to another tab, cut its line and
   paste it into another list. That is the whole operation.
   =========================================================================== */
window.CD_WIDGETS = {

  /* ---- CLIENT PROFILE — the tab that opens ---- */
  'cd-pane-profile': [
    { id: 'cd-w-profile-1', name: 'Widget name' },
    { id: 'cd-w-profile-2', name: 'Widget name' },
    { id: 'cd-w-profile-3', name: 'Widget name', wide: true, body: 140 },
    { id: 'cd-w-profile-4', name: 'Widget name' },
    { id: 'cd-w-profile-5', name: 'Widget name' }
  ],

  /* ---- CLIENT HEALTH — where Performance to Plan lives ---- */
  'cd-pane-health': [
    { id: 'cd-w-health-1', name: 'Widget name' },
    { id: 'cd-w-health-2', name: 'Widget name' },
    { id: 'ptp-c1',        name: 'Performance to plan', wide: true, type: 'ptp' },
    { id: 'cd-w-health-3', name: 'Widget name' },
    { id: 'cd-w-health-4', name: 'Widget name' }
  ],

  /* ---- CLIENT EXPOSURE ---- */
  'cd-pane-exposure': [
    { id: 'cd-w-exposure-1', name: 'Widget name', wide: true, body: 160 },
    { id: 'cd-w-exposure-2', name: 'Widget name' },
    { id: 'cd-w-exposure-3', name: 'Widget name' },
    { id: 'cd-w-exposure-4', name: 'Widget name' }
  ]
};

/* ===========================================================================
   THE MENUS
   ===========================================================================
   Same idea: the labels live here, not buried in the behaviour.
   =========================================================================== */
window.CD_MENUS = {

  /* the ACTIONS button at the top right of the panel.
     THESE THREE LABELS ARE MY INVENTION - the reference only says
     "ACTIONS". Tell me the real ones and I will swap them. */
  'cd-actions': [
    { id: 'cd-actions-watchlist', label: 'Add to watchlist' },
    { id: 'cd-actions-update',    label: 'Request update' },
    { id: 'cd-actions-download',  label: 'Download summary' }
  ],

  /* the "..." in the Performance to Plan header */
  'ptp-c1-more': [
    { id: 'ptp-c1-export', label: 'Export widget data' }
  ]
};
