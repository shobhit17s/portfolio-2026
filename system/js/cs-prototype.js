/* cs-prototype.js — the PrototypeEmbed component.

   ONE component handles every kind of thing that can sit in a media slot on a
   case study, and the surrounding layout never knows or cares which kind it
   is. That is the whole point: swapping a placeholder for a real Figma
   prototype is a change to a case study's own media map, and nothing else
   moves.

   THE KINDS
     placeholder   nothing supplied yet — the drawn, labelled, hatched box
     image         a still: a photograph, a screenshot, a diagram
     video         an mp4/webm, or a gif, with an optional poster frame
     figma         a Figma prototype, by its share link or embed URL
     local         an HTML prototype living in /prototypes/<study>/...
     external      a prototype hosted anywhere else

   ISOLATION
   Everything but `placeholder`, `image` and `video` is rendered inside an
   <iframe>. That is not laziness — an iframe is a separate document with its
   own stylesheet and its own scripts, so a prototype physically cannot reach
   into the portfolio's CSS or JavaScript, and the portfolio cannot reach into
   it. Requirement met by the browser itself rather than by convention.

   WEIGHT
   An iframe is expensive, and a case study can hold several. None of them
   load until the reader asks: a prototype shows its poster (or its drawn
   placeholder) with a "run the prototype" button, and the iframe is created
   on the first click. A study can override this with `autoload: true`.

   SHAPE
   Every embed keeps the aspect ratio it was given, at any width. */
window.CS = window.CS || {};
(function (CS) {
  'use strict';

  var DEFAULT_RATIO = '16 / 9';

  /* A Figma share link works as an embed once it is wrapped. Given either
     form, return something an iframe can load. */
  function figmaUrl(src) {
    if (!src) return '';
    if (src.indexOf('figma.com/embed') !== -1) return src;
    if (src.indexOf('embed.figma.com') !== -1) return src;
    return 'https://www.figma.com/embed?embed_host=share&url=' +
           encodeURIComponent(src);
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* ---------- the drawn placeholder ----------
     What a slot looks like before anything has been supplied: the hatched
     box, the kind of thing wanted, the exact file name to give it, and a
     line saying what belongs there. */
  function placeholder(slot, media) {
    var kindWord = (media && media.wants === 'video') ? 'video or prototype' : 'image';
    var box = el('div', 'cs-media cs-media--' +
      ((media && media.wants === 'video') ? 'video' : 'image'));
    box.setAttribute('data-cs-stroke', '22');
    box.setAttribute('role', 'img');
    box.setAttribute('aria-label', 'Empty slot: ' + slot);
    box.appendChild(el('span', 'cs-media-kind', kindWord));
    box.appendChild(el('span', 'cs-media-name', slot));
    if (media && media.note) box.appendChild(el('span', 'cs-media-note', media.note));
    return box;
  }

  function stillImage(slot, media) {
    /* Two kinds of still end up here and they want opposite treatment.

       A DRAWING or diagram has to be seen whole - cropping one loses the
       part of the argument that got cut off - and it usually arrives on
       nothing, so it needs no frame around it either. That is the default:
       the picture is fitted inside the slot, and the slot itself draws
       nothing. No hand-drawn outline is added, because the drawing already
       has its own edges.

       A SCREENSHOT or photograph is a texture rather than an argument, and
       looks better filling its area with the spare edges trimmed off. Ask
       for that with `fit: 'cover'` in the media map, and it gets the
       rounded card as well. */
    var cover = media.fit === 'cover';
    var box = el('div', 'cs-embed cs-embed--image' +
      (cover ? '' : ' cs-embed--bare'));
    var img = el('img');
    img.src = media.src;
    img.alt = media.alt || media.note || '';
    img.loading = 'lazy';
    box.appendChild(img);

    /* ---- SAY WHEN THE DRAWING IS ACTUALLY HERE ----

       Anything laid OVER a picture - the persona light is the one doing it
       today - has to wait for the picture, and for a reason that is easy to
       miss: that treatment uses the same file as a stencil, and a stencil is
       a SECOND request for it, made by the stylesheet rather than by this
       line. Asked for before the drawing has arrived, a stencil with no
       image hides everything it is applied to, and once the browser has
       composited the layer that way nothing necessarily makes it paint
       again. The symptom was a persona whose light only appeared after you
       had changed persona and come back.

       `is-ready` is the picture saying it has landed. By the time it is set
       the file is in the browser's cache, so a stencil asking for it is
       answered immediately. `decode()` is used where it exists because it
       waits for the picture to be USABLE rather than merely downloaded;
       `load` is the same promise in older browsers. */
    function ready() { box.classList.add('is-ready'); }
    if (img.complete && img.naturalWidth) ready();
    else {
      img.addEventListener('load', function () {
        if (img.decode) img.decode().then(ready, ready);
        else ready();
      });
      /* a drawing that never arrives must not leave the overlay switched off
         forever - there is nothing to mask, so there is nothing to hide */
      img.addEventListener('error', ready);
    }

    /* AN EMPTY LAYER OVER THE DRAWING, for a template that wants to put
       something on it - a coloured light, a tint, a texture. It draws
       absolutely nothing on its own; it is only here so that a stylesheet
       has somewhere to paint without the picture having to be rebuilt
       differently for each case. The persona slide is the only thing using
       it today. */
    box.appendChild(el('i', 'cs-embed-wash'));

    /* NO EXPAND BUTTON. There was one here - a small control in the corner
       that opened the drawing as large as the window allowed - and it is
       gone at Shobhit's request. A diagram on these slides is meant to be
       read at the size the slide gives it; if one cannot be, the answer is a
       bigger picture area rather than a second way of looking at the same
       small one.

       The overlay itself is still here and still used by the PROTOTYPE,
       which has its own "Open full size" - a running page genuinely does
       need a window of its own. expandImage() below is what a still picture
       would use if this ever comes back. */
    return box;
  }

  /* ---------- the box a moving thing sits in ----------
     Two nested elements, always, and it is worth saying why.

     The OUTER one carries the hand-drawn outline and does not clip: the
     drawn line is deliberately a few pixels OUTSIDE the box it belongs to,
     the way a line drawn round a shape by hand overshoots it, and a box that
     clips its own contents would cut that line off.

     The INNER one clips. It has the rounded corner and it holds everything
     that must not spill: a scaled-down prototype, a poster, a video.

     Before this, both jobs were on one element, `overflow: hidden` won, and
     the drawn outline was invisible on every prototype on the site. */
  function framed(cls) {
    var box = el('div', 'cs-embed ' + cls);
    box.setAttribute('data-cs-stroke', '22');
    var clip = el('div', 'cs-embed-clip');
    box.appendChild(clip);
    return { box: box, clip: clip };
  }

  function movie(slot, media) {
    var made = framed('cs-embed--video');
    var box = made.box, clip = made.clip;
    if (/\.gif($|\?)/i.test(media.src)) {
      var gif = el('img');
      gif.src = media.src;
      gif.alt = media.alt || media.note || '';
      gif.loading = 'lazy';
      clip.appendChild(gif);
      return box;
    }
    var v = document.createElement('video');
    v.src = media.src;
    if (media.poster) v.poster = media.poster;
    v.controls = media.controls !== false;
    v.playsInline = true;
    v.preload = 'none';
    if (media.loop) { v.loop = true; v.muted = true; v.autoplay = true; v.controls = false; }
    clip.appendChild(v);
    return box;
  }

  /* ---------- showing a wide prototype in a small slot ----------
     A dashboard drawn for a 1600px screen, squeezed into a slot 800px wide,
     stops being the thing it is: the sidebar eats half of it and the reader
     sees two cards. `renderWidth` says how wide the prototype expects to be.
     The frame is then given exactly that width and shrunk to fit, so the
     reader sees the whole composition — small, but the real arrangement.
     Clicks and hovers still land where they should; the browser maps them
     through the scale for us. */
  function ratioNumber(ratio) {
    var parts = String(ratio || DEFAULT_RATIO).split('/');
    var w = parseFloat(parts[0]), h = parseFloat(parts[1]);
    return (w && h) ? (w / h) : (16 / 9);
  }

  function scaleToFit(box, frameEl, media) {
    var wide = parseFloat(media.renderWidth);
    if (!wide) return;
    var tall = Math.round(wide / ratioNumber(media.ratio));
    frameEl.style.width = wide + 'px';
    frameEl.style.height = tall + 'px';
    frameEl.style.transformOrigin = 'top left';
    box.classList.add('is-scaled');

    function fit() {
      var w = box.clientWidth;
      if (!w) return;
      frameEl.style.transform = 'scale(' + (w / wide) + ')';
    }
    fit();
    if (window.ResizeObserver) new ResizeObserver(fit).observe(box);
    else window.addEventListener('resize', fit);
  }

  /* One iframe, built the same way wherever it appears — in a slide, or in
     the overlay. A prototype is a guest: it may run its own scripts and open
     links, and nothing else. It cannot reach this document, and this document
     does not reach into it. */
  function makeFrame(url, media, slot) {
    var f = document.createElement('iframe');
    f.title = (media && media.title) || ('Prototype: ' + slot);
    f.loading = 'lazy';
    f.allowFullscreen = true;

    f.setAttribute('sandbox',
      'allow-scripts allow-same-origin allow-popups allow-forms allow-downloads');
    f.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
    f.src = url;
    return f;
  }

  /* ---------- seeing a prototype properly ----------
     Not a new tab. A page hosted alongside the portfolio may refuse to open
     as a tab of its own (the host can send headers that only allow it to be
     framed), and a reader would get a browser error instead of the work. So
     "full size" happens here: the prototype is rebuilt in an overlay that
     fills the window, at the largest size its own shape allows.

     The overlay builds a FRESH iframe rather than moving the existing one.
     Moving an iframe in the DOM reloads it anyway, and a new tab would have
     started the prototype from the beginning too. */
  /* THE SHELL, shared by both kinds of full-size view.

     It takes a function that builds whatever goes inside, and a function
     that resizes it, because those are the only two things a prototype and a
     drawing disagree about. Everything else - the scrim, the close button,
     Escape, clicking outside, where the focus goes and where it comes back
     to - is the same, and was worth having in one place rather than two. */
  function overlay(opts) {
    var prevFocus = document.activeElement;
    var over = el('div', 'cs-overlay');
    over.setAttribute('role', 'dialog');
    over.setAttribute('aria-modal', 'true');
    over.setAttribute('aria-label', opts.label);

    var stage = el('div', 'cs-overlay-stage' + (opts.stageClass ? ' ' + opts.stageClass : ''));
    opts.build(stage);

    var shut = el('button', 'cs-overlay-close', 'Close');
    shut.type = 'button';

    over.appendChild(stage);
    if (opts.caption) {
      var cap = el('p', 'cs-overlay-caption');
      cap.innerHTML = opts.caption;
      over.appendChild(cap);
    }
    over.appendChild(shut);
    document.body.appendChild(over);
    document.body.classList.add('cs-overlay-open');

    function fit() { if (opts.fit) opts.fit(stage); }
    fit();
    window.addEventListener('resize', fit);

    function close() {
      window.removeEventListener('resize', fit);
      document.removeEventListener('keydown', onKey);
      over.remove();
      document.body.classList.remove('cs-overlay-open');
      if (prevFocus && prevFocus.focus) prevFocus.focus();
    }
    function onKey(e) { if (e.key === 'Escape') { e.stopPropagation(); close(); } }

    shut.addEventListener('click', close);
    over.addEventListener('click', function (e) { if (e.target === over) close(); });
    document.addEventListener('keydown', onKey);
    shut.focus();
    return close;
  }

  /* ---------- a drawing, as large as the window allows ----------
     No arithmetic here at all: the picture is told it may be up to 94% of the
     window wide and 82% tall and to keep its own proportions, and the browser
     works out which of the two it runs into first. A drawing's shape is its
     own business and nothing here should have an opinion about it. */
  function expandImage(media, slot) {
    overlay({
      label: media.alt || media.note || ('Picture: ' + slot),
      stageClass: 'cs-overlay-stage--image',
      caption: media.caption || '',
      build: function (stage) {
        var img = el('img');
        img.src = media.src;
        img.alt = media.alt || media.note || '';
        stage.appendChild(img);
      }
    });
  }

  function expand(url, media, slot) {
    var prevFocus = document.activeElement;
    var over = el('div', 'cs-overlay');
    over.setAttribute('role', 'dialog');
    over.setAttribute('aria-modal', 'true');
    over.setAttribute('aria-label', (media && media.title) || ('Prototype: ' + slot));

    var stage = el('div', 'cs-overlay-stage');
    var f = makeFrame(url, media, slot);
    stage.appendChild(f);

    var shut = el('button', 'cs-overlay-close', 'Close');
    shut.type = 'button';

    over.appendChild(stage);
    over.appendChild(shut);
    document.body.appendChild(over);
    document.body.classList.add('cs-overlay-open');

    var ratio = ratioNumber(media && media.ratio);
    function fit() {
      /* as big as the window allows, without changing the prototype's shape */
      var mw = window.innerWidth * 0.94, mh = window.innerHeight * 0.88;
      var w = Math.min(mw, mh * ratio);
      stage.style.width = Math.round(w) + 'px';
      stage.style.height = Math.round(w / ratio) + 'px';
      var wide = parseFloat(media && media.renderWidth);
      if (wide) {
        f.style.width = wide + 'px';
        f.style.height = Math.round(wide / ratio) + 'px';
        f.style.transformOrigin = 'top left';
        f.style.transform = 'scale(' + (w / wide) + ')';
        stage.classList.add('is-scaled');
      }
    }
    fit();
    window.addEventListener('resize', fit);

    function close() {
      window.removeEventListener('resize', fit);
      document.removeEventListener('keydown', onKey);
      over.remove();
      document.body.classList.remove('cs-overlay-open');
      if (prevFocus && prevFocus.focus) prevFocus.focus();
    }
    function onKey(e) { if (e.key === 'Escape') { e.stopPropagation(); close(); } }

    shut.addEventListener('click', close);
    over.addEventListener('click', function (e) { if (e.target === over) close(); });
    document.addEventListener('keydown', onKey);
    shut.focus();
  }

  /* ---------- anything that runs: figma, local, external ---------- */
  function frame(slot, media) {
    var url = media.kind === 'figma' ? figmaUrl(media.src) : media.src;
    var made = framed('cs-embed--frame');
    var box = made.box, clip = made.clip;

    function load() {
      clip.textContent = '';
      /* `is-running` recolours the drawn outline: the accent while the box is
         an invitation, the reading colour once it holds the real thing, so
         the frame stops competing with what is inside it. */
      box.classList.add('is-running');
      var f = makeFrame(url, media, slot);
      clip.appendChild(f);
      if (media.renderWidth) scaleToFit(clip, f, media);

      /* A scaled-down prototype is for looking at. This is the way to
         actually use it. */
      var out = el('button', 'cs-embed-open', 'Open full size');
      out.type = 'button';
      out.addEventListener('click', function () { expand(url, media, slot); });
      clip.appendChild(out);
    }

    if (media.autoload) { load(); return box; }


    /* the resting state: a poster if there is one, and a way in */
    var cover = el('div', 'cs-embed-cover');
    if (media.poster) {
      cover.style.backgroundImage = 'url("' + media.poster + '")';
      cover.classList.add('has-poster');
    }
    var start = el('button', 'cs-embed-start');
    start.type = 'button';
    start.appendChild(el('span', 'cs-embed-start-mark'));
    start.appendChild(el('span', 'cs-embed-start-label',
      media.startLabel || 'Run the prototype'));
    start.addEventListener('click', load);
    cover.appendChild(start);

    /* The line under the button is OPT-IN: `coverNote: true` in the media
       map. A slide with a real title above it has already said what the
       prototype is, and repeating it under the button just crowds the frame.
       `note` itself is still used - it is what an empty slot says about what
       belongs there, and what the picture's alt text falls back to. */
    if (media.coverNote && media.note) {
      cover.appendChild(el('span', 'cs-embed-cover-note', media.note));
    }
    clip.appendChild(cover);
    return box;
  }

  var BUILDERS = {
    image: stillImage,
    video: movie,
    figma: frame,
    local: frame,
    external: frame
  };

  /* ---------- DROP A DRAWING IN AND IT APPEARS ----------

     WHAT THIS IS FOR

     Filling a slot used to mean two jobs: put the file in assets/, then open
     content.js and write three lines saying what kind of thing it is, where
     it lives, and what shape it is. The second job is the one that goes
     wrong - a missing comma in a JavaScript file takes the whole page down,
     and you would be doing it thirty-odd times.

     So the file itself can now be the instruction. Name a drawing after the
     slot it belongs in, drop it in assets/, and it is on the page. No code
     is edited, and nothing can be mistyped, because the only thing you write
     is a filename - and the empty box on screen is already printing the
     exact name it wants.

         the box says       img-06-product-strategy
         you save           assets/img-06-product-strategy.png
         that is all

     THE SHAPE COMES FROM THE FILE TOO. The page asks the drawing how wide
     and how tall it is once it has loaded, and gives the slot that shape. So
     there is no ratio to measure and type in, and no way to get it wrong.

     WHAT STILL WINS. An entry in the `media` map with a `kind` or a `src` is
     an explicit instruction and beats this every time. That is what the
     prototype uses, and the drawings that arrived before this existed, and
     anything that needs `fit: 'cover'` or a filename that is not the slot
     name. Nothing that worked before changes.

     TO TURN IT OFF for one slot, put `auto: false` on its entry.

     ONE THING TO EXPECT: a slot with no drawing yet quietly tries for one
     and does not find it, and the browser notes that in its console. Those
     are not errors in the page - they are the page looking. */
  var AUTO_DIR = 'assets/';
  var AUTO_EXT = ['.png', '.jpg'];

  function autoName(slot, i) { return AUTO_DIR + slot + AUTO_EXT[i]; }

  function autoFill(wrap, slot, media) {
    /* the map has spoken, or this slot is waiting for something that will
       never be a still picture */
    if (media && (media.kind || media.src)) return;
    if (media && media.auto === false) return;
    if (media && media.wants === 'video') return;
    if (/^vid-/.test(slot)) return;

    /* A carousel keeps ONE slot and changes what is in it, so a search
       started for the screen you were looking at a moment ago can finish
       after you have moved on. The stamp is what the answer is checked
       against before it is allowed to appear. */
    wrap.dataset.csAuto = slot;

    var i = 0;
    (function look() {
      if (i >= AUTO_EXT.length) return;
      var url = autoName(slot, i++);
      var probe = new Image();
      probe.onerror = look;
      probe.onload = function () {
        if (wrap.dataset.csAuto !== slot) return;      // moved on; drop it
        put(wrap, slot, {
          kind: 'image',
          src: url,
          /* the drawing's own shape, measured rather than typed */
          ratio: probe.naturalWidth + ' / ' + probe.naturalHeight,
          alt: (media && media.alt) || (media && media.note) || '',
          fit: media && media.fit,
          note: media && media.note
        });
      };
      probe.src = url;
    })();
  }

  /* Put something in a slot that is already on the page. Used both by the
     search above and by the carousels. */
  /* A RELATIVE PATH IS NOT ENOUGH HERE, and the reason is worth a line.
     A `url(...)` written into a custom property is resolved against the
     STYLESHEET THAT USES IT, not against the page - so `assets/x.png` set
     from here came out as `system/css/assets/x.png` and the stencil silently
     masked the light away to nothing. Nothing is logged when a mask image
     fails; the effect just does not appear. Made absolute against the page,
     it is right from wherever it is read. */
  function embedSrcVar(media) {
    if (!media || media.kind !== 'image' || !media.src) return 'none';
    var abs = media.src;
    try { abs = new URL(media.src, document.baseURI).href; } catch (e) {}
    return 'url("' + abs + '")';
  }

  function put(node, slot, media) {
    node.textContent = '';
    node.dataset.csSlot = slot;
    var build = media && BUILDERS[media.kind];
    node.style.setProperty('--cs-embed-ratio',
      (media && media.ratio) || DEFAULT_RATIO);
    /* THE DRAWING'S OWN FILE, handed to CSS.
       Some treatments need the picture itself and not just its box - the
       persona light uses the drawing as a stencil, so the colour it lays on
       lands on the figure and not on the empty space around it. CSS cannot
       reach into the <img> to find out what it is showing, so the slot says
       so here, once, at the moment it puts the drawing in. Anything that
       does not want it simply never reads it. */
    node.style.setProperty('--cs-embed-src', embedSrcVar(media));
    node.classList.toggle('cs-slot--ratio', !!(media && media.ratio));
    node.appendChild(build ? build(slot, media) : placeholder(slot, media));
    if (CS.strokes) CS.strokes.apply(node);
    return node;
  }

  /* ---------- the component ---------- */
  CS.PrototypeEmbed = {
    /* open one picture full size, from anywhere */
    expandImage: expandImage,

    /* Build the thing that fills one named slot.
       `slot`  the slot's name, e.g. vid-17-prototype-option-a
       `media` what the case study says fills it, or nothing at all */
    create: function (slot, media) {
      var wrap = el('div', 'cs-slot');
      wrap.dataset.csSlot = slot;

      var build = media && BUILDERS[media.kind];
      var inner = build ? build(slot, media) : placeholder(slot, media);

      /* By default the shape is the slot's, not the content's, so a
         placeholder and the prototype that replaces it occupy exactly the
         same room. When a case study names a ratio, that ratio wins and the
         embed sits centred in the room it was given. */
      var ratio = (media && media.ratio) || null;
      if (ratio) {
        wrap.style.setProperty('--cs-embed-ratio', ratio);
        wrap.classList.add('cs-slot--ratio');
      }

      wrap.appendChild(inner);
      /* and, if nothing was named for this slot, go and look for a drawing
         that has been left in assets/ under the slot's own name */
      autoFill(wrap, slot, media);
      return wrap;
    },

    /* Fill a slot that is already on the page — used by the carousels, which
       keep one slot and change what is in it. */
    fill: function (node, slot, media) {
      put(node, slot, media);
      autoFill(node, slot, media);
      return node;
    },

    /* What a case study says fills a slot. Nothing means "not supplied yet",
       which is a placeholder, which is a perfectly good answer. */
    lookup: function (slot) {
      var m = CS.CASE_STUDY && CS.CASE_STUDY.media;
      return (m && m[slot]) || null;
    },

    /* ---------- a way to check your own work ----------
       Open the browser console on the case study and type

           CS.PrototypeEmbed.empty()

       and it lists every slot still showing a placeholder, with the exact
       filename each one is waiting for. Useful for "did my drawing land, or
       did I misspell it?" - which is the only mistake this scheme leaves
       room for.

       It reports what is ON THE PAGE. A carousel holds one slot and changes
       what is in it, so only the screen you are looking at is counted -
       step through the tabs, or read the full list in the study's own
       content.js, to see the rest. */
    empty: function () {
      var out = [];
      document.querySelectorAll('.cs-slot').forEach(function (n) {
        if (!n.querySelector('.cs-media')) return;          // filled
        var slot = n.dataset.csSlot;
        if (!slot || slot === 'no-picture-named') return;
        if (out.indexOf(slot) === -1) out.push(slot);
      });
      out.sort();
      if (window.console && console.table) {
        console.table(out.map(function (s) {
          return { slot: s, 'save it as': AUTO_DIR + s + AUTO_EXT[0] };
        }));
      }
      return out;
    }
  };
})(window.CS);


