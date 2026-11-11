/* ===========================================================================
   fit.js — make a fixed-size design fill whatever window it is given,
            without ever changing its shape.

   >>> THIS FILE IS MEANT TO BE COPIED INTO EVERY 1440 x 1024 PROTOTYPE. <<<
   It knows nothing about this dashboard. Drop it in, wrap the frame, done.

   ---------------------------------------------------------------------------
   THE IDEA, IN ONE PICTURE
   ---------------------------------------------------------------------------
   Think of the prototype as a printed poster and the window as a picture
   frame. We do not redraw the poster to fit the frame - we shrink or
   enlarge the whole poster until it just fits inside, and we centre it.
   Whatever is left over is mount board.

       +----------------------------+     +----------------+
       |  . . . . . . . . . . . . . |     |. . . . . . . . |
       |  .                       . |     |.              .|
       |  .   1440 x 1024 poster  . |     |.   poster     .|   <- same shape,
       |  .                       . |     |.              .|      different size
       |  . . . . . . . . . . . . . |     |. . . . . . . . |
       +----------------------------+     +----------------+
          wide window                        narrow window

   WHY THIS AND NOT A RESPONSIVE LAYOUT. A responsive layout re-flows: the
   columns stack, the type reflows, things move. That is right for a real
   product and wrong for a prototype of a screen, because the thing being
   judged IS the arrangement at 1440 x 1024. Scaling keeps every proportion,
   every gap and every line length exactly as drawn.

   ---------------------------------------------------------------------------
   HOW TO USE IT
   ---------------------------------------------------------------------------
       <div class="fit-stage" id="whatever" data-fit-w="1440" data-fit-h="1024">
         <div class="fit-frame"> ... the design, at its true size ... </div>
       </div>

   The stage fills its parent. The frame is drawn at its true size and then
   scaled. Nothing inside the frame needs to know any of this has happened.

   ---------------------------------------------------------------------------
   THE ONE THING TO KNOW
   ---------------------------------------------------------------------------
   A scaled page is still 1440 wide as far as the browser is concerned -
   clicks, focus and scrolling all land correctly, because the browser
   accounts for the scale. The only visible cost is that at awkward
   fractions (say 0.83) text is resampled and can look a touch soft. That
   is the trade for keeping the design exactly as drawn.
   =========================================================================== */
(function (global) {
  'use strict';

  function fitOne(stage) {
    var w = Number(stage.dataset.fitW) || 1440;
    var h = Number(stage.dataset.fitH) || 1024;
    var box = stage.getBoundingClientRect();
    if (!box.width || !box.height) return;

    /* THE WHOLE CALCULATION IS THIS ONE LINE: take the smaller of "how many
       times does the design's width go into the window" and the same for
       height. The smaller one is the one that just fits; the other
       direction then has room to spare, which becomes the mount board. */
    var k = Math.min(box.width / w, box.height / h);

    var max = Number(stage.dataset.fitMax);          /* optional ceiling */
    if (max && k > max) k = max;

    stage.style.setProperty('--fit-k', k);
    stage.style.setProperty('--fit-x', ((box.width  - w * k) / 2) + 'px');
    stage.style.setProperty('--fit-y', ((box.height - h * k) / 2) + 'px');
  }

  function fitAll() {
    [].slice.call(document.querySelectorAll('.fit-stage')).forEach(fitOne);
  }

  /* A ResizeObserver watches the STAGE, not the window, which matters: in
     an <iframe> the window never resizes when the host page does, but the
     stage does. Falling back to the window event covers old browsers. */
  function start() {
    fitAll();
    if (global.ResizeObserver) {
      var ro = new global.ResizeObserver(function (entries) {
        entries.forEach(function (e) { fitOne(e.target); });
      });
      [].slice.call(document.querySelectorAll('.fit-stage')).forEach(function (s) {
        ro.observe(s);
      });
    }
    global.addEventListener('resize', fitAll);
    /* fonts land after first paint and can change nothing here, but a
       late layout pass can - one more measure costs nothing */
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  global.Fit = { all: fitAll, one: fitOne };
})(window);
