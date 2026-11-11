/* lofi-coach.js — CONTROL. The tour: which nudge is showing, and when it
   stops showing.

   See css/lofi-coach.css for the bubble itself and for why it is placed
   by its parent rather than by measurement.

   A TOUR IS A LIST OF STEPS, declared in the markup and named here:

       LOFI.coach('setup', [
         { bubble: 'cc-coach-1', ring: 'cc-actions-btn' },
         { bubble: 'cc-coach-2', ring: 'cc-cmp-item' }
       ]);

   `LOFI.coachNext('setup')` moves on; `LOFI.coachEnd('setup')` stops it
   for good. A tour that has ended stays ended for the life of the page.

   WHY IT ENDS FOR GOOD. A nudge that comes back after the reader has done
   the thing is not help, it is nagging - and in a prototype being shown
   to somebody over a shoulder, the second appearance is the one that
   makes them say "is it stuck?". The whole value of the thing is that it
   disappears and does not return.
   =========================================================================== */
window.LOFI = window.LOFI || {};
(function (LOFI) {
  'use strict';

  var tours = {};

  function el(id) { return typeof id === 'string' ? document.getElementById(id) : id; }

  function hideStep(step) {
    if (!step) return;
    var b = el(step.bubble);
    if (b) b.hidden = true;
    var r = el(step.ring);
    if (r) r.classList.remove('is-coached');
  }

  function showStep(step) {
    if (!step) return;
    var b = el(step.bubble);
    if (b) b.hidden = false;
    var r = el(step.ring);
    if (r) r.classList.add('is-coached');
  }

  function paint(t) {
    t.steps.forEach(hideStep);
    if (t.done || t.at < 0 || t.at >= t.steps.length) return;
    showStep(t.steps[t.at]);
  }

  /* START, or restart from the top. Calling it again on a tour that has
     already ended does nothing, which is what lets a prototype call it
     from somewhere that runs more than once without having to remember
     whether the reader has been here before. */
  LOFI.coach = function (name, steps) {
    if (tours[name] && tours[name].done) return;
    tours[name] = tours[name] || { steps: steps || [], at: -1, done: false };
    if (steps) tours[name].steps = steps;
    tours[name].at = 0;
    paint(tours[name]);
  };

  LOFI.coachNext = function (name) {
    var t = tours[name];
    if (!t || t.done) return;
    t.at += 1;
    if (t.at >= t.steps.length) { LOFI.coachEnd(name); return; }
    paint(t);
  };

  /* GO TO A NAMED STEP rather than simply forward. The second step of
     this tour appears when a menu opens, and a menu can be opened,
     closed and opened again - so "show step 2" has to be something the
     prototype can say twice without the tour running off the end. */
  LOFI.coachAt = function (name, i) {
    var t = tours[name];
    if (!t || t.done) return;
    t.at = i;
    paint(t);
  };

  LOFI.coachEnd = function (name) {
    var t = tours[name];
    if (!t) { tours[name] = { steps: [], at: -1, done: true }; return; }
    t.done = true;
    t.at = -1;
    t.steps.forEach(hideStep);
  };

  LOFI.coachRunning = function (name) {
    var t = tours[name];
    return !!(t && !t.done);
  };

  /* ONE LISTENER FOR EVERY SKIP BUTTON. The bubble names its own tour
     with `data-lofi-coach-skip="setup"`, so the markup carries the
     relationship and no prototype has to wire a button by hand. */
  document.addEventListener('click', function (e) {
    var skip = e.target.closest && e.target.closest('[data-lofi-coach-skip]');
    if (!skip) return;
    e.stopPropagation();
    LOFI.coachEnd(skip.dataset.lofiCoachSkip || Object.keys(tours)[0]);
  });

  LOFI.initCoach = function () { /* nothing to wire: the listener is global */ };
})(window.LOFI);
