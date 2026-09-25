/* drawer-content.js — one kind of drawer contents, for every drawer.

   WHAT THIS IS

   A drawer used to be a title and some paragraphs. It is now a CONTAINER
   that takes a list of blocks and builds them, so any drawer anywhere on the
   site can hold any combination of six things:

       text       paragraphs, in two columns when there is width for two
       image      one drawing, with an optional caption
       carousel   two kinds, and the difference is the whole point - see below
       marquee    a 240px band whose contents drift endlessly one way
       mascot     a small character that wanders about over the top

   The landing page and the case studies both call SITE.drawerContent(), so
   there is one implementation and one set of rules. What varies per drawer is
   only the list.

   HOW TO WRITE ONE  (common/drawers.js, or a study's own `drawers` block)

       sme: {
         title: 'What an industry SME actually does',
         content: [
           { type: 'text',   body: ['…', '…'] },
           { type: 'image',  src: 'props/work-pantheon.png', caption: '…' },
           { type: 'carousel', mode: 'fixed', slides: [ … ] },
           { type: 'carousel', mode: 'push',  slides: [ … ] },
           { type: 'marquee', images: [ … ], direction: 'left', speed: 34 },
           { type: 'mascot', src: '…', size: 'medium' }
         ],
         note: 'small print, under everything'
       }

   A drawer written the OLD way - `body` and `note` and nothing else - still
   works untouched. It is quietly turned into one text block.

   THE TWO CAROUSELS, AND WHY BOTH EXIST

       mode: 'fixed'   the frame keeps ONE height, whatever is in it. Slides
                       change inside a box that never moves, so nothing below
                       it ever shifts. Use it in the middle of a long read,
                       where a paragraph jumping down the screen as somebody
                       presses "next" is a small betrayal.

       mode: 'push'    the frame takes the height of whatever slide is showing
                       and everything below moves with it, on a transition so
                       the movement is legible rather than a jolt. Use it when
                       the pictures are the point and their real proportions
                       matter more than the stillness of the page.

   Neither is the right default. They are two different promises to the
   reader, and the drawer's author picks which one to make. */
window.SITE = window.SITE || {};

(function (SITE) {
  'use strict';

  var ASSETS = 'assets/';          // overridden per page; see SITE.assetBase

  /* TWO PLACES A PICTURE CAN LIVE, AND WHY THAT MATTERS

     A drawer written inside a case study names pictures that belong to that
     case study, and they sit in its own assets folder. A drawer written in
     common/drawers.js is shared by every surface, so the pictures it names
     cannot live in any one study's folder - they live in the site's own
     assets folder at the root.

     Those two folders are in different places depending on which page is
     open, so the renderer keeps both:

       SITE.assetBase   this page's own pictures   'assets/'  |  '../../assets/'
       SITE.sharedBase  the site's pictures        'assets/'  |  '../../assets/'

     and a drawer says which one it means by how it writes the name:

       'diagram.png'    this page's own assets folder
       '~/props/x.png'  the site's assets folder - what a SHARED drawer uses

     Get this wrong and the picture simply does not appear, which is why the
     shared drawers are all written with the tilde. */
  function base() { return SITE.assetBase || ASSETS; }
  function shared() { return SITE.sharedBase || base(); }

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function src(s) {
    if (!s) return '';
    if (s.slice(0, 2) === '~/') return shared() + s.slice(2);
    return /^(https?:|data:|\.|\/)/.test(s) ? s : base() + s;
  }

  /* ---------------------------------------------------------------- text */
  function text(b) {
    var n = el('div', 'dc-block dc-text');
    /* Two columns when the drawer is wide enough, one when it is not. It is
       CSS `columns`, not a grid: the browser balances the text itself and
       the count can change with the width without anything being re-laid out
       in script. `columns: false` opts a block out - a short lead-in reads
       badly split down the middle. */
    if (b.columns === false) n.classList.add('dc-text--single');
    (b.body || []).forEach(function (p) { n.appendChild(el('p', null, p)); });
    return n;
  }

  /* --------------------------------------------------------------- image */
  function figure(item, cls) {
    var fig = el('figure', 'dc-figure' + (cls ? ' ' + cls : ''));
    var img = el('img');
    img.src = src(item.src);
    img.alt = item.alt || '';
    img.loading = 'lazy';
    if (item.ratio) fig.style.setProperty('--dc-ratio', item.ratio);
    fig.appendChild(img);
    if (item.caption) fig.appendChild(el('figcaption', null, item.caption));
    return fig;
  }

  function image(b) {
    /* `tall: true` lets a deliberately long drawing - a tall diagram, a
       scroll of a screen - keep its full height. Everything else is capped
       so one picture cannot swallow the whole panel. */
    var n = el('div', 'dc-block dc-image' + (b.tall ? ' dc-image--tall' : ''));
    n.appendChild(figure(b));
    return n;
  }

  /* ------------------------------------------------------------ carousel */
  var carouselCount = 0;

  function carousel(b) {
    var push = b.mode === 'push';
    var n = el('div', 'dc-block dc-carousel' + (push ? ' dc-carousel--push' : ' dc-carousel--fixed'));
    var id = 'dc-carousel-' + (++carouselCount);
    n.id = id;

    var track = el('div', 'dc-carousel-track');
    var slides = (b.slides || []).map(function (s, i) {
      var fig = figure(typeof s === 'string' ? { src: s } : s, 'dc-slide');
      fig.dataset.i = i;
      if (i === 0) fig.classList.add('is-on');
      track.appendChild(fig);
      return fig;
    });
    if (!slides.length) return n;

    /* A FIXED carousel needs a height before its pictures have loaded, or
       the page settles twice. The author can say `ratio`; otherwise the
       first slide's own proportions are used as soon as it arrives. */
    if (!push) {
      if (b.ratio) n.style.setProperty('--dc-ratio', b.ratio);
      else {
        var first = slides[0].querySelector('img');
        var take = function () {
          if (first.naturalWidth) {
            n.style.setProperty('--dc-ratio', first.naturalWidth + ' / ' + first.naturalHeight);
          }
        };
        first.complete ? take() : first.addEventListener('load', take);
      }
    }

    n.appendChild(track);

    var at = 0;
    var dots = el('div', 'dc-carousel-dots');
    var prev = el('button', 'dc-carousel-arrow dc-carousel-arrow--prev', '&#8249;');
    var next = el('button', 'dc-carousel-arrow dc-carousel-arrow--next', '&#8250;');
    prev.type = next.type = 'button';
    prev.setAttribute('aria-label', 'Previous picture');
    next.setAttribute('aria-label', 'Next picture');

    var marks = slides.map(function (_, i) {
      var d = el('button', 'dc-carousel-dot' + (i ? '' : ' is-on'));
      d.type = 'button';
      d.setAttribute('aria-label', 'Picture ' + (i + 1) + ' of ' + slides.length);
      d.addEventListener('click', function () { show(i); });
      dots.appendChild(d);
      return d;
    });

    /* A PUSH carousel measures the slide it is going to and sets the track's
       height to it, so the transition has two numbers to move between. Left
       on `auto` there is nothing to animate and the page would jump. */
    function measure() {
      if (!push) return;
      var h = slides[at].offsetHeight;
      if (h) track.style.height = h + 'px';
    }

    function show(i) {
      at = (i + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle('is-on', k === at); });
      marks.forEach(function (d, k) { d.classList.toggle('is-on', k === at); });
      measure();
    }

    prev.addEventListener('click', function () { show(at - 1); });
    next.addEventListener('click', function () { show(at + 1); });

    if (slides.length > 1) {
      n.appendChild(prev); n.appendChild(next); n.appendChild(dots);
    }

    /* Height has to be taken again once the pictures are in, and again if
       the drawer is resized - a two-column drawer becoming one column
       changes every slide's height at once. */
    if (push) {
      track.querySelectorAll('img').forEach(function (img) {
        img.complete ? measure() : img.addEventListener('load', measure);
      });
      if (window.ResizeObserver) new ResizeObserver(measure).observe(n);
      setTimeout(measure, 60);
    }
    return n;
  }

  /* -------------------------------------------------------------- marquee
     A band of pictures drifting one way, forever.

     The loop is seamless because the strip is built TWICE and slid by
     exactly half its own width: at the moment the animation restarts, the
     second copy is sitting precisely where the first one began, so there is
     nothing to see. Duration comes from the width rather than being a fixed
     number of seconds, so a long strip and a short one drift at the same
     SPEED rather than taking the same time. */
  function marquee(b) {
    var n = el('div', 'dc-block dc-marquee');
    if (b.height) n.style.setProperty('--dc-marquee-h', b.height + 'px');
    if (b.direction === 'right') n.classList.add('dc-marquee--right');

    var strip = el('div', 'dc-marquee-strip');
    var items = b.images || [];
    if (!items.length) return n;

    function fill() {
      items.forEach(function (s) {
        var item = typeof s === 'string' ? { src: s } : s;
        var box = el('div', 'dc-marquee-item');
        var img = el('img');
        img.src = src(item.src);
        img.alt = '';
        box.appendChild(img);
        strip.appendChild(box);
      });
    }
    fill(); fill();                       // two copies: see above
    n.appendChild(strip);

    function pace() {
      var w = strip.scrollWidth / 2;
      if (!w) return;
      strip.style.setProperty('--dc-marquee-shift', w + 'px');
      strip.style.animationDuration = (w / (b.speed || 34)) + 's';
    }
    strip.querySelectorAll('img').forEach(function (img) {
      img.complete ? pace() : img.addEventListener('load', pace);
    });
    setTimeout(pace, 60);
    if (window.ResizeObserver) new ResizeObserver(pace).observe(n);
    return n;
  }

  /* --------------------------------------------------------------- mascot
     A character that wanders over the top of everything and reacts to
     nothing. It is decoration, so it is `pointer-events: none` and hidden
     from screen readers entirely - a reader being told "image" every time a
     drawing strolls past would be a worse experience, not a better one.

     It moves by picking a spot, walking there, pausing, and picking another.
     A fixed path would be a loop you notice on the second viewing; a random
     walk never quite repeats. It also FLIPS to face the way it is going,
     which is the whole difference between a character and a sticker.

     If `sprite` is given, the drawing is a strip of frames and the animation
     is CSS `steps()` over the background position - the same idea as the
     traveller's hop sheet. Without it, a single picture just bobs. */
  function mascot(b) {
    var n = el('div', 'dc-mascot dc-mascot--' + (b.size || 'medium'));
    n.setAttribute('aria-hidden', 'true');

    var art = el('div', 'dc-mascot-art');
    art.style.backgroundImage = 'url("' + src(b.src) + '")';
    if (b.sprite) {
      n.classList.add('dc-mascot--sprite');
      art.style.setProperty('--dc-frames', b.sprite.frames);
      art.style.backgroundSize = (b.sprite.frames * 100) + '% 100%';
      art.style.animationDuration = (b.sprite.seconds || 0.9) + 's';
    }
    n.appendChild(art);

    var stopped = false;
    function wander() {
      if (stopped || !n.parentNode) return;
      /* It roams the part of the panel you can SEE, not the whole length of
         the scroll. The layer it sits in is pinned to the top of the visible
         area and has no height of its own, so the box to wander inside is
         the scrolling container's visible box. */
      var scroller = (n.closest && n.closest('.dc-content')) || n.parentNode;
      var w = n.offsetWidth, h = n.offsetHeight;
      var x = Math.random() * Math.max(0, scroller.clientWidth - w);
      var y = Math.random() * Math.max(0, scroller.clientHeight - h);
      var was = parseFloat(n.dataset.x || '0');
      n.dataset.x = x;
      n.classList.toggle('is-facing-left', x < was);
      var far = Math.hypot(x - was, y - parseFloat(n.dataset.y || '0'));
      n.dataset.y = y;
      n.style.transitionDuration = Math.max(1.6, far / 90) + 's';
      n.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      setTimeout(wander, Math.max(1600, far / 90 * 1000) + 700 + Math.random() * 1400);
    }
    setTimeout(wander, 400);
    n.stop = function () { stopped = true; };
    return n;
  }

  var MAKERS = {
    text: text, image: image, carousel: carousel,
    marquee: marquee, mascot: mascot
  };

  /* ------------------------------------------------------------- the API
     Fill a container with a drawer's contents. Returns nothing useful: the
     container is the product. */
  SITE.drawerContent = function (host, d) {
    if (!host) return;
    host.innerHTML = '';
    host.scrollTop = 0;

    /* The old shape - body/note and nothing else - is a text block and a
       note. Written this way rather than special-cased later, so everything
       downstream only ever sees the list. */
    var list = d.content;
    if (!list) {
      list = [];
      if (d.media) list.push({ type: 'image', src: d.media.src || d.media, caption: d.caption });
      if (d.body) list.push({ type: 'text', body: d.body });
    }

    var inner = el('div', 'dc-flow');
    var floats = [];

    list.forEach(function (raw) {
      /* carouselA and carouselB are the friendlier names for the two modes.
         Normalise first, so everything below this line deals with one word. */
      var b = raw;
      if (raw.type === 'carouselA') b = Object.assign({}, raw, { type: 'carousel', mode: 'fixed' });
      if (raw.type === 'carouselB') b = Object.assign({}, raw, { type: 'carousel', mode: 'push' });

      var make = MAKERS[b.type];
      if (!make) return;
      var node = make(b);

      /* A mascot is not part of the flow - it floats over all of it - so it
         is hung on the scrolling container rather than on the column. */
      if (b.type === 'mascot') floats.push(node);
      else inner.appendChild(node);
    });

    /* THE MASCOT LAYER, AND WHY IT IS FIRST

       A mascot is meant to be a companion while you read, which means it has
       to stay on screen while the words go past it. If it were simply
       dropped into the scrolling box it would be pinned to one spot in the
       text and scroll away, never to be seen again.

       So the mascots live in their own layer: a strip with no height of its
       own, stuck to the top of the visible area (`position: sticky`). As you
       scroll, the layer stays put, and the mascots wandering inside it stay
       with you. It is first in the box only because that is where a sticky
       element has to start. */
    if (floats.length) {
      var layer = el('div', 'dc-mascot-layer');
      layer.setAttribute('aria-hidden', 'true');
      floats.forEach(function (f) { layer.appendChild(f); });
      host.appendChild(layer);
    }
    host.appendChild(inner);

    if (d.note) {
      var note = el('p', 'dc-note', d.note);
      inner.appendChild(note);
    }
  };
})(window.SITE);


