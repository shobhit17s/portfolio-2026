/* lofi-stage.js — SHELL. Scaling the fixed canvas to whatever it is in.

       <body class="lofi-stage-host">
         <div class="lofi-stage-fit">
           <div class="lofi-stage" data-lofi-stage>
             …the whole prototype, written at 1440 x 1024…
           </div>
         </div>
       </body>

   ONE SCALE FOR BOTH AXES - `Math.min` of the two ratios - so the drawing
   is never stretched. If the window is a different shape from the canvas,
   the spare room goes round the outside as an even margin rather than into
   the design.

   IT SCALES UP AS WELL AS DOWN. A prototype on a big monitor should fill
   it, not sit as a small rectangle in the corner, because what is being
   judged is the composition and the composition reads better large.

   CLICKS STILL LAND IN THE RIGHT PLACE. A CSS transform moves what the
   browser draws AND what it hit-tests, so a button at the bottom of a
   canvas scaled to 0.6 is still a button - nothing has to map coordinates
   back and forth. That is the whole reason this is done with `transform`
   rather than by rewriting every size. */
window.LOFI = window.LOFI || {};
(function (LOFI) {
  'use strict';

  var W = 1440, H = 1024;

  function fit(stage) {
    var fitter = stage.parentNode;
    var box = fitter.getBoundingClientRect();
    if (!box.width || !box.height) return;

    var w = parseFloat(stage.dataset.lofiStageW) || W;
    var h = parseFloat(stage.dataset.lofiStageH) || H;
    stage.style.setProperty('--lofi-stage-w', w + 'px');
    stage.style.setProperty('--lofi-stage-h', h + 'px');

    var scale = Math.min(box.width / w, box.height / h);
    var left = (box.width - w * scale) / 2;
    var top = (box.height - h * scale) / 2;

    stage.style.transform =
      'translate(' + left.toFixed(2) + 'px, ' + top.toFixed(2) + 'px) ' +
      'scale(' + scale.toFixed(5) + ')';

    stage.dispatchEvent(new CustomEvent('lofi:stage', {
      bubbles: true, detail: { scale: scale, width: w, height: h }
    }));
  }

  LOFI.initStage = function (root) {
    var all = (root || document).querySelectorAll('[data-lofi-stage]');
    for (var i = 0; i < all.length; i++) {
      (function (stage) {
        fit(stage);
        if (stage.dataset.lofiStageWired) return;
        stage.dataset.lofiStageWired = '1';

        /* THE WINDOW IS NOT THE ONLY THING THAT CHANGES SIZE. Inside a
           case-study slide this page sits in an iframe whose box can be
           re-laid-out without the window moving at all - a tab opening, a
           panel sliding away. ResizeObserver hears that; `resize` does
           not. Both are watched, because the older browsers that have no
           observer still have the event. */
        if (window.ResizeObserver) {
          new ResizeObserver(function () { fit(stage); }).observe(stage.parentNode);
        }
        window.addEventListener('resize', function () { fit(stage); });
      })(all[i]);
    }
  };

  LOFI.refitStage = function (root) {
    var all = (root || document).querySelectorAll('[data-lofi-stage]');
    for (var i = 0; i < all.length; i++) fit(all[i]);
  };
})(window.LOFI);
