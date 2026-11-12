/* lofi-tabs.js — makes any tab row work, with no configuration.

   =========================================================================
   HOW IT FINDS ITS WORK
   =========================================================================

   It does not. You mark up a tab row the way the browser already expects a
   tab row to be marked up, and this file reads that:

       <div class="lofi-tabs" role="tablist">
         <button class="lofi-tab" role="tab" aria-controls="pane-a"
                 aria-selected="true">Latest projection</button>
         <button class="lofi-tab" role="tab" aria-controls="pane-b"
                 aria-selected="false">Projection inventory</button>
       </div>
       <div id="pane-a" class="lofi-pane" role="tabpanel">…</div>
       <div id="pane-b" class="lofi-pane" role="tabpanel" hidden>…</div>

   `aria-controls` IS THE WIRING. There is no separate list of panes to
   keep in step with the list of tabs, because the tab already has to name
   its pane for a screen reader to work - so that one attribute is made to
   do both jobs. A tab with no `aria-controls` still highlights; it simply
   has nothing to show, which is right for a tab that only filters a chart.

   This works the same for `.lofi-tabs` and `.lofi-ptabs`: they look
   different and behave identically, which is why there is one file. */
window.LOFI = window.LOFI || {};
(function (LOFI) {
  'use strict';

  function tabsIn(row) {
    return [].slice.call(row.querySelectorAll('[role="tab"]'));
  }

  function show(row, tab) {
    tabsIn(row).forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      var paneId = t.getAttribute('aria-controls');
      if (!paneId) return;
      var pane = document.getElementById(paneId);
      if (pane) pane.hidden = !on;
    });

    /* ANYTHING THAT MEASURED ITSELF WHILE HIDDEN MEASURED ZERO. A chart or
       a table inside a pane that was `hidden` has no width until the moment
       it is shown, so the page is told to re-measure - the same event a
       window resize sends, because it is the same problem. */
    window.dispatchEvent(new Event('resize'));

    row.dispatchEvent(new CustomEvent('lofi:tab', {
      bubbles: true,
      detail: { tab: tab, value: tab.dataset.lofiValue || tab.textContent.trim() }
    }));
  }

  function wire(row) {
    if (row.dataset.lofiTabsWired) return;
    row.dataset.lofiTabsWired = '1';
    var tabs = tabsIn(row);
    if (!tabs.length) return;

    row.addEventListener('click', function (e) {
      /* THE ✕ IS CHECKED FIRST, because it sits inside the tab and a click
         on it is a click on the tab too. Closing wins: a reader who aimed
         at the cross meant the cross. */
      var close = e.target.closest ? e.target.closest('.lofi-tab-close') : null;
      if (close && row.contains(close)) {
        e.stopPropagation();
        var owner = close.closest('[role="tab"]');
        row.dispatchEvent(new CustomEvent('lofi:tab-close', {
          bubbles: true, detail: { tab: owner }
        }));
        return;
      }
      var tab = e.target.closest ? e.target.closest('[role="tab"]') : null;
      if (tab && row.contains(tab)) show(row, tab);
    });

    /* ARROW KEYS WALK THE ROW, which is what a tablist is supposed to do
       and what a reader who is not using a mouse will try. */
    row.addEventListener('keydown', function (e) {
      var i = tabs.indexOf(document.activeElement);
      if (i === -1) return;
      var to = null;
      if (e.key === 'ArrowRight') to = tabs[i + 1] || tabs[0];
      if (e.key === 'ArrowLeft')  to = tabs[i - 1] || tabs[tabs.length - 1];
      if (e.key === 'Home') to = tabs[0];
      if (e.key === 'End')  to = tabs[tabs.length - 1];
      if (!to) return;
      e.preventDefault();
      to.focus();
      show(row, to);
    });

    /* whichever tab the markup says is chosen, or the first one */
    var start = tabs.filter(function (t) {
      return t.getAttribute('aria-selected') === 'true';
    })[0] || tabs[0];
    show(row, start);
  }

  LOFI.initTabs = function (root) {
    var rows = (root || document).querySelectorAll('.lofi-tabs, .lofi-ptabs');
    for (var i = 0; i < rows.length; i++) wire(rows[i]);
  };

  /* A prototype can also drive a row itself, e.g. from a keyboard shortcut
     or after loading data. */
  LOFI.showTab = function (tab) {
    var row = tab.closest('.lofi-tabs, .lofi-ptabs');
    if (row) show(row, tab);
  };

  /* =====================================================================
     TAKING A TAB AWAY, WHICH IS NOT THE SAME AS TAKING THE TAB AWAY
     =====================================================================

     A tab and its pane are two separate elements joined only by
     `aria-controls`. Remove the tab on its own and the PANE IS STILL
     THERE AND STILL SHOWING - it just has nothing left pointing at it.
     What you see is the closed tab's contents sitting underneath whatever
     tab is open, which is exactly the bug this function exists to stop.

     And it cannot be fixed by showing another tab afterwards, which was
     the obvious thing to try: `show()` only hides the panes of tabs it can
     still FIND in the row, and the one being removed is no longer in it.
     The pane has to be put away first, while the two are still joined.

     So: hide the pane, then remove the tab, then choose a neighbour -
     preferring the one to the left, because a reader who closes something
     is going back rather than onward. */
  LOFI.closeTab = function (tab, alsoRemovePane) {
    if (!tab) return;
    var row = tab.closest('.lofi-tabs, .lofi-ptabs');
    if (!row) return;

    var paneId = tab.getAttribute('aria-controls');
    var pane = paneId ? document.getElementById(paneId) : null;
    if (pane) {
      pane.hidden = true;
      if (alsoRemovePane && pane.parentNode) pane.parentNode.removeChild(pane);
    }

    var all = tabsIn(row);
    var i = all.indexOf(tab);
    var next = all[i - 1] || all[i + 1] || null;

    tab.remove();

    if (next) show(row, next);
    row.dispatchEvent(new CustomEvent('lofi:tab-removed', {
      bubbles: true, detail: { pane: pane, showing: next }
    }));
  };
})(window.LOFI);
