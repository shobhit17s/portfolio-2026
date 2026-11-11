/* cs-tabseries.js — the part of the story that comes in two versions.

   =========================================================================
   WHAT THIS IS
   =========================================================================

   Somewhere in the middle of case study 2 the story forks. The same shape
   of work happened in Phase 1 and again in Phase 3, and rather than telling
   it twice the page lets the reader choose which one to read.

   It is NOT a slide with tabs on it. It is a whole RUN of slides that swaps
   for another whole run - a chapter with two editions. cs-render.js builds
   the places; this file puts the buttons in and does the swapping.

   =========================================================================
   ONLY ONE RUN IS ON THE PAGE AT A TIME, and that is on purpose
   =========================================================================

   The run that is not being read is TAKEN OUT of the page rather than
   hidden behind `display: none`.

   The difference is not visible but it is real. A hidden slide is still a
   slide: it still has drawn outlines that have to be kept in step with the
   window, a parallax position that is recalculated on every scroll, and
   panels that measure themselves. A page quietly doing that work for ten
   slides nobody is looking at gets slow, and nothing on the screen explains
   why. Taking the run out means the page is only ever as big as what is
   being read.

   The cost of that choice is the one thing this file has to handle: when a
   run comes BACK it is new to the page, so everything that measures has to
   be asked to look again. That is what `settle()` below does, and the
   comment there says which things and why.

   =========================================================================
   THE BAR FOLLOWS YOU DOWN
   =========================================================================

   The bar is sticky for as long as you are inside the section and lets go
   at its end. A reader eleven slides into Phase 3 who wants to compare with
   Phase 1 should not have to scroll back up to the top of a chapter to do
   it - the control belongs to the whole chapter, so it stays with the whole
   chapter.

   On a phone it does not stick: the screen is short enough that a bar glued
   to the top is a real slice of what there is to read, and the two phases
   are a scroll apart rather than a screenful apart.
   (All of that is in cs-slides.css; this file sets no positions.)

   =========================================================================
   WHAT IS REMEMBERED
   =========================================================================

   Which tab you chose, per section, for this visit only - the same
   arrangement, and the same reasoning, as the use-case panel in
   cs-usecase.js. Coming back a week later and finding yourself halfway
   into Phase 3 with no memory of having chosen it is a page that looks
   broken; coming back after scrolling away for a minute and finding it as
   you left it is simply correct. */
window.CS = window.CS || {};
(function (CS) {
  'use strict';

  var KEY = 'cs-tab-series';

  function remembered() {
    try { return JSON.parse(sessionStorage.getItem(KEY) || '{}') || {}; }
    catch (e) { return {}; }
  }

  function remember(id, index) {
    try {
      var all = remembered();
      if (index) all[id] = index; else delete all[id];
      sessionStorage.setItem(KEY, JSON.stringify(all));
    } catch (e) { /* storage blocked: the buttons still work */ }
  }

  CS.initTabSeries = function () {
    var was = remembered();
    var sections = document.querySelectorAll('.cs-tab-series');

    for (var s = 0; s < sections.length; s++) {
      (function (section) {
        var panel = section.querySelector('.cs-control-panel');
        var bar   = section.querySelector('.cs-tab-panel');
        var panes = [].slice.call(section.querySelectorAll('.cs-tab-series-pane'));
        var labels = section.csTabLabels || [];

        /* NO BAR MEANS THERE IS NOTHING TO SWAP, and that is a real state
           rather than a failure.

           A CHAPTER WITH ONE TAB draws no bar - cs-render.js leaves it out
           on purpose, the same way the page leaves out the view tabs when
           a study has only one view. There is one run of slides, it is
           already on the page, and this file has nothing to do with it:
           leaving now means that run is never parked, never swapped and
           never re-wired, so it behaves in every way like an ordinary
           stretch of the story. cs-main.js wires and measures the whole
           page a moment from now and it is in there with everything else.

           It also covers the other case: a bar that could not be built
           because a file did not load. Either way the slides are on the
           page and readable, which is the only thing that must never
           depend on this file. */
        if (!bar || !panes.length) return;

        var id = section.id || 'tab-series';
        /* each pane is lifted out and kept here until it is asked for */
        var parked = panes.map(function (pane) {
          var home = document.createComment('tab pane ' + pane.dataset.csTabIndex);
          pane.parentNode.insertBefore(home, pane);
          pane.parentNode.removeChild(pane);
          return { pane: pane, home: home, live: false };
        });

        /* WIRE A RUN THE FIRST TIME IT IS SHOWN, AND NEVER AGAIN.

           The runs that are not being read are kept as real elements,
           detached from the page - so when one comes back it is the SAME
           run, with everything that was wired to it still wired. Doing it
           again would do everything twice: two play buttons in one counter,
           two listeners on one arrow, two panels fighting over one scroll.
           I watched the persona slide grow a second play button and push
           itself 41 pixels off the side of a phone before this was a flag.

           Everything below is given the PANE to work on rather than the
           page, which is what the `root` argument on each of them is for. */
        function wire(pane) {
          if (CS.initWireframes) CS.initWireframes(pane);
          if (CS.initDiagrams)   CS.initDiagrams(pane);
          if (CS.initPersonas)   CS.initPersonas(pane);
          if (CS.initUseCases)   CS.initUseCases(pane);
          if (CS.initGrids)      CS.initGrids(pane);
          if (CS.initFeedback)   CS.initFeedback(pane);
          if (CS.initProtoSteps) CS.initProtoSteps(pane);
          if (CS.initFlowCharts) CS.initFlowCharts(pane);
          if (CS.initFancyAccordions) CS.initFancyAccordions(pane);
          if (CS.initChapterGraphics) CS.initChapterGraphics(pane);
          if (CS.drawArrows)     CS.drawArrows(pane);
        }

        /* AND THESE ARE RE-DONE EVERY TIME, because they are not wiring -
           they are MEASURING, and what there is to measure has just
           changed. Running them again costs nothing and skipping them
           leaves panels that do not know whether they scroll and slides
           that sit still while the page drifts past them. */
        function settle(pane) {
          if (CS.initScrollers)   CS.initScrollers(pane);
          /* A FLOW CHART'S LINE IS MEASURED, NOT WIRED. A parked pane has
             no width, so every dot in it measured zero and the line could
             not be drawn when the pane was built. Now that it is on the
             page it has a width, so it is drawn - and drawn again on every
             later visit, because the window may have changed size while a
             different phase was showing. */
          if (CS.redrawFlowCharts) CS.redrawFlowCharts(pane);
          if (CS.refreshParallax) CS.refreshParallax();
          if (CS.strokes && CS.strokes.apply) CS.strokes.apply(pane);
        }

        function show(i, firstTime) {
          parked.forEach(function (p, j) {
            if (j === i && !p.live) {
              p.home.parentNode.insertBefore(p.pane, p.home);
              p.live = true;
              /* ON THE FIRST DRAW this run is NOT wired here. The page is
                 still being started up and the lines after this one in
                 cs-main.js are about to wire everything on it, this run
                 included - so doing it now would be doing it twice. It is
                 marked as done because, in a moment, it will be. */
              if (firstTime) { p.wired = true; }
              else if (!p.wired) { wire(p.pane); p.wired = true; }
            } else if (j !== i && p.live) {
              p.pane.parentNode.removeChild(p.pane);
              p.live = false;
            }
          });
          /* and nothing is measured on the first draw either, for the same
             reason: cs-main.js measures the whole page a few lines later */
          if (!firstTime) settle(parked[i] && parked[i].pane);

          /* A TAB PRESS MUST NOT MOVE THE PAGE UNDER YOUR FINGER. The two
             runs are different lengths, so swapping them changes how tall
             the page is - and if the swap happens while you are below the
             bar, the ground shifts. Scrolling back to the top of the
             section puts you at the start of what you just asked for,
             which is where you meant to be. Not on the first draw, when
             nobody has pressed anything. */
          if (!firstTime) {
            /* AND IT LANDS BELOW WHATEVER IS PINNED UP THERE. The bar's own
               sticky offset IS that measurement - it is the height it will
               stop at - so asking the bar where it stops needs no second
               number to keep in step, and it is right on a laptop and on a
               phone without this file knowing which it is on. */
            var bar = section.querySelector('.cs-tab-series-bar');
            var clear = bar ? (parseFloat(window.getComputedStyle(bar).top) || 0) : 0;
            var top = section.getBoundingClientRect().top + window.scrollY;
            window.scrollTo({ top: top - clear - 8, behavior: 'smooth' });
          }
        }

        var start = parseInt(was[id], 10) || 0;
        if (start < 0 || start >= parked.length) start = 0;

        if (CS.makeTabs) {
          /* THE TAB PANEL, NOT THE CONTROL PANEL. makeTabs appends its
             buttons to whatever it is handed, and the two are a parent and
             its child. Handing it the outer one put the buttons BESIDE the
             empty tab bar rather than in it - so none of the bar's own
             styling reached them and they huddled against the right-hand
             end, in the loud dress, two centimetres wide. Everything looked
             like a stylesheet problem and nothing was. */
          CS.makeTabs(bar, labels, function (item, index) {
            var i = typeof index === 'number' ? index
                  : labels.indexOf(item);
            if (i < 0) i = 0;
            show(i, false);
            remember(id, i);
          }, start);
          /* NOT DRAWN. Like the feedback slide's tabs, these are a way
             through rather than the thing itself, so they do not wear a
             hand-drawn outline. Taking the attribute off before the
             strokes run means nothing is drawn and then hidden. */
          panel.querySelectorAll('[data-cs-stroke]').forEach(function (n) {
            n.removeAttribute('data-cs-stroke');
          });
        }

        /* drawn whether or not the bar could be built, so a section is
           never blank because one file did not load */
        show(start, true);
      })(sections[s]);
    }
  };
})(window.CS);
