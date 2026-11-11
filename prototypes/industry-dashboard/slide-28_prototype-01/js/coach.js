/* ===========================================================================
   coach.js — the four-step nudge.

       1  change the grouping in the view selector
       2  open a sub-industry card to see its heatmap
       3  open the trend drawer from a sparkline in the grid
       4  search for a KIM to see what it drives

   THREE RULES IT KEEPS
   --------------------
   IT ONLY EVER ADVANCES ON THE REAL ACTION. There is no "Next" button
   walking ahead of the page, because the thing each step points at does
   not exist until the one before it has happened: the grid has no
   sparklines until a sub-industry is open. Each step therefore waits for
   its own event on the bus — and the files that raise those events know
   nothing about this one.

   IT CAN BE LEFT. Four steps across three screens is a tour rather than a
   hint, and a reader who already knows the product must be able to get out
   of one. Every bubble carries a Skip and says how far along it is. Skip
   ends it for good.

   IT NEVER COMES BACK. A nudge that reappears after you have done what it
   asked is not help, it is nagging.
   =========================================================================== */
window.KIM = window.KIM || {};

(function (KIM) {
  'use strict';

  var $ = KIM.$, el = KIM.el;

  /* STEP 2 AND 3 ARE AIMED, not placed: `find` is run on every frame while
     that step is showing, because the card deck and the grid are both
     rebuilt from scratch whenever anything changes. */
  var STEPS = [
    {
      id: 'kim-coach-1',
      ring: function () { return $('kim-groupby'); },
      done: 'group-change'
    },
    {
      float: 'below',
      says: 'Open a sub-industry to see the heatmap of everything driving it.',
      find: function () { return document.querySelector('.kim-card-item'); },
      done: 'sub-open'
    },
    {
      float: 'leftof',
      says: 'Open the trend chart for any KIM from its sparkline.',
      find: function () { return document.querySelector('.kim-trendbtn'); },
      done: 'trend-open'
    },
    {
      id: 'kim-coach-4',
      ring: function () { return $('kim-kimsearch'); },
      done: 'metric-open'
    }
  ];

  var at = -1;
  var over = false;
  var bubble = null;      /* the one floating bubble, reused by steps 2 and 3 */
  var ringed = null;
  var frame = 0;

  function makeBubble() {
    var b = el('div', 'kim-coach kim-coach--float');
    b.setAttribute('role', 'status');
    b.appendChild(el('p', 'kim-coach-step'));
    b.appendChild(el('p', 'kim-coach-says'));
    var skip = el('button', 'kim-coach-skip', 'Skip');
    skip.type = 'button';
    skip.setAttribute('data-kim-skip', '');
    b.appendChild(skip);
    b.hidden = true;
    $('kim-view').appendChild(b);
    return b;
  }

  function unring() {
    if (ringed) ringed.classList.remove('is-coached');
    ringed = null;
  }

  function ring(node) {
    if (ringed === node) return;
    unring();
    if (node) { node.classList.add('is-coached'); ringed = node; }
  }

  function hideAll() {
    STEPS.forEach(function (s) { if (s.id) $(s.id).hidden = true; });
    if (bubble) bubble.hidden = true;
    unring();
  }

  /* HOW FAR DOWN AND ACROSS, IN THE LAYOUT'S OWN PIXELS.
     Everything on this screen is inside a canvas that has been scaled to
     fit the window, so a measured rectangle is in SCREEN pixels. Dividing
     by the scale turns it back into the units the design is drawn in,
     which are the units a stylesheet writes. Skip that step and the
     bubble drifts further from its target the smaller the window gets. */
  function place(target, how) {
    var stage = $('kim-stage');
    var k = Number(getComputedStyle(stage).getPropertyValue('--fit-k')) || 1;
    var view = $('kim-view').getBoundingClientRect();
    var box = target.getBoundingClientRect();

    var x = (box.left - view.left) / k;
    var y = (box.top - view.top) / k;
    var w = box.width / k, h = box.height / k;

    bubble.classList.toggle('kim-coach--below', how === 'below');
    bubble.classList.toggle('kim-coach--leftof', how === 'leftof');

    if (how === 'below') {
      bubble.style.setProperty('--kim-x', x + 'px');
      bubble.style.setProperty('--kim-y', (y + h + 12) + 'px');
    } else {
      bubble.style.setProperty('--kim-x', (x - bubble.offsetWidth - 14) + 'px');
      bubble.style.setProperty('--kim-y', (y + h / 2 - bubble.offsetHeight / 2) + 'px');
    }

    /* A TARGET THAT HAS SCROLLED OUT OF ITS PANE takes its bubble with it.
       Left on screen, the bubble would be pointing at nothing. */
    var pane = $('kim-view').getBoundingClientRect();
    var off = box.bottom < pane.top + 4 || box.top > pane.bottom - 4;
    bubble.hidden = off;
  }

  function paint() {
    if (over || at < 0 || at >= STEPS.length) { hideAll(); return; }
    var step = STEPS[at];

    STEPS.forEach(function (s) { if (s.id) $(s.id).hidden = (s !== step); });

    if (step.id) {
      if (bubble) bubble.hidden = true;
      ring(step.ring());
      return;
    }

    if (!bubble) bubble = makeBubble();
    var target = step.find();
    if (!target) { bubble.hidden = true; unring(); return; }

    bubble.children[0].textContent = (at + 1) + ' of ' + STEPS.length;
    bubble.children[1].textContent = step.says;
    bubble.hidden = false;
    ring(target.closest('.kim-card-item') || target);
    place(target, step.float);
  }

  /* ONE FRAME LOOP WHILE THE TOUR IS RUNNING, and none at all once it has
     ended. The deck and the grid are rebuilt on almost every interaction,
     and the pane they sit in scrolls — so the alternative is a redraw hook
     in five different places, all of which would have to remember to call
     back here. */
  function loop() {
    if (over) return;
    var step = STEPS[at];
    if (step && !step.id) paint();
    frame = window.requestAnimationFrame(loop);
  }

  function advance() {
    at += 1;
    if (at >= STEPS.length) { finish(); return; }
    paint();
  }

  function finish() {
    over = true;
    at = -1;
    hideAll();
    window.cancelAnimationFrame(frame);
  }

  var coach = {};

  coach.init = function () {
    /* every Skip, including the two in the HTML and the one in the
       bubble built here */
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-kim-skip]')) finish();
    });

    STEPS.forEach(function (s, i) {
      KIM.on(s.done, function () {
        if (over) return;
        if (i === at) advance();
      });
    });

    at = 0;
    paint();
    loop();
  };

  coach.end = finish;
  KIM.coach = coach;

})(window.KIM);
