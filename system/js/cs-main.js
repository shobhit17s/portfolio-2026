/* cs-main.js — start everything, in the order the page needs it.

   The order matters and is worth stating: the page is EMPTY until the
   renderer runs. Everything after it is wiring up things the renderer has
   just made, so nothing here may run before it. */
window.CS = window.CS || {};
(function (CS) {
  'use strict';

  function boot() {
    /* 0. fold copy.js and media.js into content.js. This must happen before
       anything is drawn, and it is the only place it happens - see
       cs-content.js for what the three files each hold. */
    CS.assembleContent();

    /* 1. build the page out of this study's content */
    CS.render();

    /* 2. everything that needs those slides to exist */
    CS.drawArrows(document);
    CS.initViews();
    CS.initWireframes();
    CS.initDiagrams();
    CS.initPersonas();
    CS.initDrawer();
    CS.initParallax();
    CS.initChrome();

    /* 3. the drawn outlines go on last, once every panel has its real size */
    var draw = function () { CS.strokes.apply(document); };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
    requestAnimationFrame(draw);
    window.addEventListener('resize', function () {
      clearTimeout(CS._t);
      CS._t = setTimeout(function () { CS.strokes.refresh(); }, 180);
    });

    /* arriving from a planet: land on the slide that was clicked */
    if (location.hash && location.hash !== '#nutshell') {
      var target = document.querySelector(location.hash);
      if (target) setTimeout(function () { target.scrollIntoView({ block: 'center' }); }, 80);
    }

    document.body.classList.add('cs-ready');
  }

  /* =======================================================================
     WHEN IT DOES NOT WORK, SAY SO ON THE PAGE
     =======================================================================

     Until now a case study that failed to start looked like a case study
     that had been designed badly. The page's HTML is a SHELL - a top bar,
     a pair of view tabs, two empty containers - and every slide in it is
     built by the renderer. So if the renderer never ran, what you got was
     the shell: a tab bar with nothing behind it, and no hint anywhere that
     something had gone wrong rather than merely looking sparse.

     That is the worst kind of failure, because it is indistinguishable from
     a working page. One missing file out of eighty, one typo in a copy.js,
     and the symptom is "the design has reverted".

     So the page now checks that the pieces it needs are actually here before
     it starts, catches anything thrown while starting, and in either case
     puts a plain panel on the screen naming exactly what is wrong. The
     styling is written inline, deliberately: if the stylesheets are what did
     not arrive, a message that needs them is no message at all. */

  /* Every global the page cannot run without, and the file each one comes
     from. The file name is the useful half - "CS.CASE_STUDY is undefined"
     means nothing to anybody; "content.js did not load" is an instruction. */
  function pieces() {
    return [
      ['copy.js',                         CS.COPY],
      ['media.js',                        CS.MEDIA],
      ['content.js',                      CS.CASE_STUDY],
      ['system/js/cs-content.js',         CS.assembleContent],
      ['system/js/cs-templates.js',       CS.templates],
      ['system/js/cs-render.js',          CS.render],
      ['system/js/cs-prototype.js',       CS.PrototypeEmbed],
      ['system/js/cs-strokes.js',         CS.strokes],
      ['system/js/cs-panels.js',          CS.makeTabs],
      ['system/js/cs-carousels.js',       CS.initPersonas],
      ['system/js/cs-views.js',           CS.initViews],
      ['system/js/cs-drawer.js',          CS.initDrawer],
      ['system/js/cs-parallax.js',        CS.initParallax],
      ['system/js/cs-chrome.js',          CS.initChrome]
    ];
  }

  function missing() {
    return pieces().filter(function (p) { return !p[1]; }).map(function (p) { return p[0]; });
  }

  /* Printable from the console at any time: CS.doctor() */
  CS.doctor = function () {
    var gone = missing();
    if (!gone.length) {
      console.log('Every file this page needs is here. ' +
        ((CS.CASE_STUDY && CS.CASE_STUDY.story) || []).length + ' slides in the running order.');
    } else {
      console.warn('THESE FILES DID NOT LOAD:\n   ' + gone.join('\n   ') +
        '\n\nThe usual cause is a bundle that was extracted somewhere other than\n' +
        'worlds-source, so the page is reading an older copy of itself.');
    }
    return gone;
  };

  function complain(title, lines) {
    var shell = document.getElementById('cs-window');
    if (shell) shell.setAttribute('hidden', '');
    var box = document.createElement('div');
    box.setAttribute('style',
      'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;' +
      'justify-content:center;padding:24px;background:#0A0D0A;color:#B1C4C6;' +
      'font:16px/1.6 system-ui,-apple-system,Segoe UI,sans-serif');
    var card = document.createElement('div');
    card.setAttribute('style', 'max-width:60ch');
    var h = document.createElement('p');
    h.setAttribute('style', 'font-size:1.3em;margin:0 0 .8em;color:#D3644A');
    h.textContent = title;
    card.appendChild(h);
    lines.forEach(function (line) {
      var el = document.createElement(line.code ? 'pre' : 'p');
      el.setAttribute('style', line.code
        ? 'margin:.6em 0;padding:12px 14px;background:#0D1B18;border-radius:10px;' +
          'white-space:pre-wrap;font:13px/1.5 ui-monospace,Menlo,Consolas,monospace;color:#B1C4C6'
        : 'margin:.6em 0');
      el.textContent = line.text !== undefined ? line.text : line;
      card.appendChild(el);
    });
    box.appendChild(card);
    document.body.appendChild(box);
  }

  /* A locked case study has nothing to render until the reader has been let
     in, so the page tells us to wait and calls CS.boot() itself afterwards. */
  CS.boot = function () {
    var gone = missing();
    if (gone.length) {
      console.warn('[case study] these files did not load:\n   ' + gone.join('\n   '));
      complain('This case study could not start.', [
        'These files did not load, so there was nothing to build the page out of:',
        { code: true, text: gone.join('\n') },
        'Almost always this means the newest bundle was extracted somewhere ' +
        'other than your worlds-source folder, so the page is reading an older ' +
        'copy of itself. Check that the .txt file was sitting NEXT TO ' +
        'worlds-source - not inside it - when you ran the install block, and ' +
        'that it reported the number of files the bundle said it would.',
        'Typing CS.doctor() in the browser console prints this same list.'
      ]);
      return;
    }
    try {
      boot();
    } catch (err) {
      console.error('[case study] stopped while building the page:', err);
      complain('This case study stopped while building itself.', [
        'Every file is here, so this is a fault in the content rather than a ' +
        'missing one - usually a stray comma or quote mark in copy.js, media.js ' +
        'or content.js.',
        { code: true, text: String(err && err.message || err) + '\n\n' +
                            String((err && err.stack || '').split('\n')[1] || '').trim() },
        'The browser console has the full trace.'
      ]);
    }
  };

  function start() {
    if (CS.AWAIT_UNLOCK) return;
    CS.boot();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})(window.CS);


