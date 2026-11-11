/* cs-templates.js — the slide templates, as components.

   Every template from the layout specs is a function here. It is handed a
   slide's DATA and returns a finished slide. It knows the shape of that
   template and nothing else: not what this case study is about, not what its
   pictures are called, not a single word of its copy.

   A case study's content.js says, for each slide, which template to use and
   what goes in its slots. Add a template here and every case study can use
   it; write a slide there and no code changes at all.

   THE SLOTS A TEMPLATE CAN ASK FOR
     title / title2      a section title, with an optional eyebrow above it
     body / body2        running copy: a string, or a list of strings
     media / media2      a named media slot — see cs-prototype.js
     caption             the line under a picture
     impact              a large statement
     stage               tiles, a flow, or anything else built by a helper
   A template uses the ones it needs and ignores the rest. */
window.CS = window.CS || {};
(function (CS) {
  'use strict';

  /* ---------- small builders ---------- */

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.innerHTML = text;
    return n;
  }

  /* THE NAME OF A SLIDE'S COPY BLOCK, AS SOMEBODY HAS TO TYPE IT.

     `slide-03` on its own was a complete answer while a study had one
     copy.js. A phase has its own, so the page says which file as well -
     `phase-01/slide-03` - and the reader can go straight there instead of
     looking in two. `copyIn` is put on the slide by cs-content.js. */
  function copyKey(d) {
    if (!d || !d.copy) return 'this slide';
    return d.copyIn ? d.copyIn + '/' + d.copy : d.copy;
  }

  function title(text, opts) {
    opts = opts || {};
    var h = el('h2', 'cs-section-title ' + (opts.slot || 'cs-sec-1-title'));
    if (opts.eyebrow) {
      h.appendChild(el('span', 'cs-meta cs-eyebrow', opts.eyebrow));
    }
    /* A HEADING NOBODY HAS WRITTEN YET SAYS SO, and says which block it is
       waiting for - the same rule every empty picture slot and every empty
       panel on this site already follows.

       It used to print the word `undefined`, which is the browser saying
       "there was nothing here" in a language that looks like a heading. A
       slide that is quietly wrong is worse than one that is loudly empty:
       `undefined` tells you something broke but not WHERE, while
       `title -> slide-19` tells you exactly which block to go and write.

       `opts.key` is the slide's copy key, handed in by every template that
       calls this - see the `key: d.copy` on each call below. */
    if (text === undefined || text === null || text === '') {
      h.appendChild(el('span', 'cs-meta cs-slot-waiting',
                       'title \u2192 ' + (opts.key || 'this slide')));
      return h;
    }
    h.insertAdjacentHTML('beforeend', text);
    return h;
  }

  /* Copy arrives as one string or as several paragraphs. Either way it comes
     out as a block that can be placed. */
  /* `ctx` IS OPTIONAL AND ALMOST NOBODY PASSES IT. It exists for one piece:
     a drawing standing between two paragraphs, which has to know what it is
     called and nothing in the piece itself says. The accordion slide hands
     over a small object that can name the next one; every other caller
     leaves it out and every other piece ignores it. */
  function body(content, slotClass, extraClass, ctx) {
    var wrap = el('div', 'cs-body ' + slotClass + (extraClass ? ' ' + extraClass : ''));
    (Array.isArray(content) ? content : [content]).forEach(function (part) {
      if (part && part.kind) { wrap.appendChild(piece(part, ctx)); return; }
      wrap.appendChild(el('p', null, part));
    });
    return wrap;
  }

  /* the few richer things a body can hold */
  function piece(p, ctx) {
    /* A QUOTE AND AN IMPACT LINE ARE THE SAME THING SET THE SAME WAY.
       They were two treatments - an impact line large in the display face,
       a quote noticeably smaller - and on a page where one slide holds the
       brief and the next holds the north star, the reader has no way to
       know why one statement is shouted and the next is murmured. So a
       quote carries the impact class itself; .cs-quote only centres it and
       gives it the space a statement wants around it. */
    if (p.kind === 'quote') return el('p', 'cs-impact cs-quote', p.text);
    if (p.kind === 'drawer') {
      var b = el('button', 'cs-dig', p.text);
      b.type = 'button';
      b.dataset.csDrawer = p.drawer;
      return b;
    }
    /* Two lists, same shape, different mark in front of each line:
         questions  opens each line with a ?, for things not yet answered
         points     opens each line with a small dash, for things settled -
                    a learning is a conclusion, not an open question, and a
                    row of question marks in front of them says the opposite */
    if (p.kind === 'questions' || p.kind === 'points' || p.kind === 'numbers') {
      /* 'numbers' is the third of the same list: a sequence, where the order
         is part of the meaning. It is the only one drawn as an <ol>, because
         a screen reader should announce "one of two" rather than read a
         bullet that happens to look like a digit. */
      var ordered = p.kind === 'numbers';
      /* `cards: true` draws each line as its own card, with the same drawn
         outline the figure tiles on the results slide have. It is for a list
         that IS the slide - seven open questions with nothing else on the
         page - where a plain column leaves the bottom two thirds empty and
         the list reads as an afterthought rather than the point. */
      var cards = !!p.cards;
      var ul = el(ordered ? 'ol' : 'ul', 'cs-questions' +
        (p.kind === 'points' ? ' cs-questions--points' : '') +
        (ordered ? ' cs-questions--numbers' : '') +
        (cards ? ' cs-questions--cards' : '') +
        (p.wide && !cards ? ' cs-questions--wide' : ''));
      p.items.forEach(function (q) {
        var li = el('li', null, q);
        /* the outline is drawn by cs-strokes.js, the same way a tile's is */
        if (cards) li.setAttribute('data-cs-stroke', '24');
        ul.appendChild(li);
      });
      return ul;
    }
    /* =====================================================================
       TWO THINGS THAT SHAPE A BODY OF WRITING
       =====================================================================

       A body is already a list of paragraphs - `body: ['one', 'two']` gives
       two of them. These two add the rest of what prose needs: a heading
       part-way down, and an indented first line.

           body: [
             'An ordinary paragraph.',
             'Another one.',

             { kind: 'heading', text: 'What changed' },

             'The first paragraph under that heading.',

             { kind: 'indent', text: 'One paragraph, first line indented.' },
             { kind: 'indent', items: ['Several,', 'all indented.'] }
           ]

       They work wherever a body does - a slide, a person's panel, the
       writing beside a stepped diagram - because they go through this one
       function.

       A HEADING is a sub-heading INSIDE the writing. It is not the slide's
       own title, which is `title` in the same copy block and is set larger.
       Both are yours to word. */
    if (p.kind === 'heading') {
      return el(p.tag || 'h3', 'cs-body-heading', p.text);
    }

    /* AN INDENTED PARAGRAPH, ASKED FOR BY HAND.

       INDENTATION IS AUTOMATIC NOW. A paragraph that follows another
       paragraph is indented, and nothing else is - not the first of a body,
       not the first after a heading or a list, and never a bullet point.
       That rule is three words of CSS in cs-base.css and it is worth
       reading once.

       So this is only for the exception: step a paragraph the automatic
       rule would leave flush. `{ kind: 'flush' }` above is the other
       exception, in the other direction. */
    /* SEVERAL COLUMNS OF WRITING, SIDE BY SIDE. The sheet's third drawing:
       two or three on a desktop, one on a phone.

           { kind: 'columns', count: 2, items: ['...', '...', '...'] }

       You do NOT say which paragraph goes in which column - the browser
       balances them, so adding a sentence does not mean re-dealing the
       writing by hand. Each column's text is left-aligned, and the group
       sits centred in its space, like every other body. */
    if (p.kind === 'columns') {
      var n = p.count === 3 ? 3 : 2;
      var box = el('div', 'cs-columns cs-columns--' + n);
      (p.items || []).forEach(function (t) {
        if (t && t.kind) { box.appendChild(piece(t, ctx)); return; }
        box.appendChild(el('p', null, t));
      });
      return box;
    }

    /* A PARAGRAPH THAT SHOULD STAY FLUSH where the automatic indent would
       step it - the one under a heading you want to read as a continuation
       rather than a fresh start. */
    if (p.kind === 'flush') {
      return el('p', 'cs-flush', p.text);
    }

    if (p.kind === 'indent') {
      var list = Array.isArray(p.items) ? p.items
               : (p.text !== undefined ? [p.text] : []);
      var frag = document.createDocumentFragment();
      list.forEach(function (t) {
        frag.appendChild(el('p', 'cs-indent', t));
      });
      return frag;
    }

    /* =====================================================================
       A DRAWING STANDING BETWEEN TWO PARAGRAPHS
       =====================================================================

           body: [ `a paragraph`, { kind: 'image' }, `another` ]

       WHICH drawing is not written here. It follows from where the piece
       stands - first image in this accordion, second, third - exactly the
       way `views: 5` names five drawings nobody has to list. The naming
       rule is CS.fancySlot in cs-content.js, and the slide map asks the
       same function, so the two can never disagree.

       `{ kind: 'image', media: 'whatever_img-01' }` names one by hand, and
       a hand-written name is never touched.

       WITH NO CONTEXT AND NO NAME it draws the ordinary waiting box, which
       says which drawing it wanted - rather than nothing at all. That is
       the case where this piece has been dropped into a body on some other
       slide, which is allowed and simply has no automatic name to give. */
    if (p.kind === 'image') {
      var box = el('figure', 'cs-fancy-figure');
      var picked = p.media || (ctx && ctx.nextImage && ctx.nextImage());
      box.appendChild(slot(picked, 'cs-fancy-shot'));
      if (p.caption) box.appendChild(el('figcaption', 'cs-caption', p.caption));
      return box;
    }

    if (p.kind === 'flow') return flow(p);
    if (p.kind === 'tiles') return tiles(p);
    if (p.kind === 'surface') return surface(p);
    if (p.kind === 'note') return el('p', 'cs-meta', p.text);
    return el('p', null, String(p));
  }

  /* =======================================================================
     THE SURFACE - a raised panel of writing, in two states
     =======================================================================

     It began as the golden half of slide 2's band and was written into that
     one template. It is now a PIECE like a list or a quote, which means it
     can be dropped into any slide whose body goes through piece() - in
     copy.js, with no new template and no change to the engine:

         body: [{ kind: 'surface', title: '...', body: ['...','...','...'] }]

     TWO STATES, and the difference is one line of writing rather than a
     flag you have to remember:

       NAMING NO DRAWER         a surface. Fill, drawn outline, a heading and
                                its paragraphs. Nothing to press, nothing
                                that looks pressable, and it is a <section>.

       NAMING A DRAWER          a door. Everything above, plus the small
                                hand-written line at the foot saying where it
                                goes, and it becomes a <button> that opens
                                that drawer.

     So the line in Caveat and the drawer arrive together, always. A surface
     that invites a press and does nothing, or one that opens a panel without
     saying it will, are the two ways this component could lie - and neither
     is reachable, because the same word decides both.

         { kind: 'surface',
           title:  'How the scope widened',
           body:   ['first paragraph', 'second', 'third'],
           drawer: 'detail',                  <- makes it a door
           action: 'Read the full story' }    <- the words on that line

     THE OUTLINE IS DRAWN IN THE PRIMARY ACCENT, the colour the case study's
     own title is set in, so the panel belongs to this study rather than to
     the engine. That is in cs-slides.css, one rule. */
  function surface(p) {
    var isDoor = !!p.drawer;
    var box = el(isDoor ? 'button' : 'section', 'cs-surface' +
      (isDoor ? ' cs-surface--door' : ''));
    if (isDoor) {
      box.type = 'button';
      box.dataset.csDrawer = p.drawer;
    }
    box.setAttribute('data-cs-stroke', '26');

    if (p.title) box.appendChild(el('p', 'cs-surface-title', p.title));
    (Array.isArray(p.body) ? p.body : [p.body || '']).forEach(function (t) {
      if (t) box.appendChild(el('p', 'cs-surface-body', t));
    });
    if (isDoor) {
      box.appendChild(el('span', 'cs-surface-mark',
        (p.action || 'Read more') +
        ' <span class="cs-surface-arrow" aria-hidden="true">&rarr;</span>'));
    }
    return box;
  }
  CS.surface = surface;

  /* =======================================================================
     WHEN A CHAPTER'S LETTERS NEED AN OUTLINE
     =======================================================================

     The chapter-name-graphics slide paints its letters with whatever is
     moving behind them. A letter has no colour of its own, so how readable
     it is depends on what happens to be passing through it at that moment
     - and a pale colour drifting across a pale band makes that letter
     briefly not there.

     THE OBVIOUS ANSWER IS TO WATCH EACH LETTER AND DRAW AN OUTLINE WHEN IT
     FADES. It is also the wrong one, in two ways.

     It cannot be done. The letters are filled by a CSS background, and
     there is no way to ask the page what colour a background happens to be
     at a point - you would have to redraw the whole thing into a canvas,
     every frame, to read pixels back out of it.

     And it would flicker. An outline that arrives as a colour drifts past
     and leaves as it moves on is a line switching on and off under the
     reader's eyes, which is worse than either state.

     SO THE COLOURS ARE MEASURED INSTEAD OF THE PIXELS. Every colour this
     slide can be filled with is written down - that is what `graphics:`
     is - and so is the band behind them. Measure each against the band
     once, and if ANY of them is too faint the letters keep a thin outline
     for good. The protection is the same, it is decided before anything
     moves, and nothing switches on and off.

     IT IS ALSO LOUDER THAN A CLASS. The console says which colour was the
     problem and what it measured, so the answer is "mist is 2.4 on this
     band" rather than "the outline is on and I do not know why".

     3.0 TO 1 IS THE BAR, because these are large letters - the same
     threshold tools/contrast-check.js holds everything over 24px to.

     AND IT IS RE-DONE WHEN THE MODE CHANGES, because a colour that clears
     the band in the dark may not in the light. One observer for the whole
     page, watching the one attribute that says which mode is on.

     WHY THIS LIVES IN cs-templates.js, next to the template that needs it,
     rather than in a file of its own: a file of its own is a line in every
     study's index.html, and a slide that silently loses its outline
     because somebody forgot that line is exactly the failure this is here
     to prevent. */
  function luminance(c) {
    var v = [c[0], c[1], c[2]].map(function (n) {
      n = n / 255;
      return n <= 0.03928 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  }

  /* Browsers hand a colour back in two shapes, and reading one as the
     other is a convincing kind of wrong: `rgb(r g b)` counts 0-255, and
     `color(srgb r g b)` - which is what a color-mix resolves to - counts
     0-1. The same trap is written up in tools/contrast-check.js. */
  function rgb(str) {
    str = String(str).trim();
    if (!str) return null;
    /* TWO SHAPES THIS CAN READ ITSELF, and only two. `rgb(r g b)` counts
       0-255 and `color(srgb r g b)` counts 0-1. Anything else - and a
       colour mixed in another space comes back as `oklab(...)` - is handed
       to the browser below, because guessing at the numbers in a shape this
       function does not know is how the last three colour bugs happened. */
    if (/^rgba?\(/i.test(str)) {
      var m = str.replace(/^[a-z]*\(/i, '').match(/[\d.]+(?:e-?\d+)?/gi);
      return (m && m.length >= 3) ? [+m[0], +m[1], +m[2]] : null;
    }
    if (/^color\(\s*srgb[\s(]/i.test(str)) {
      var c = str.replace(/^color\(\s*srgb/i, '').match(/[\d.]+(?:e-?\d+)?/gi);
      return (c && c.length >= 3) ? [+c[0] * 255, +c[1] * 255, +c[2] * 255] : null;
    }
    return viaCanvas(str);
  }

  /* =======================================================================
     ASK THE BROWSER TO CONVERT A COLOUR IT INVENTED
     =======================================================================

     `color-mix(in oklab, ...)` computes to `oklab(0.877 0.024 0.066)`, and
     those three numbers are NOT red, green and blue - they are a lightness
     and two opponent axes. Read as rgb they give a near-black, so a bright
     colour measures as unreadable and the letters get an outline they do
     not need. That is the same trap as the `#8A92A0` one above, wearing a
     different hat: every number is present, every number is wrong, and
     nothing looks broken.

     I COULD DO THE MATHS. oklab to sRGB is a known conversion and about
     fifteen lines. But then the next motion mixes `in lch` or `in display-p3`
     and those fifteen lines are wrong again, silently, in exactly this way.

     SO THE BROWSER CONVERTS IT. A canvas fill accepts any CSS colour and
     hands back plain sRGB bytes, which makes the browser the authority for
     every colour space it supports, including the ones that do not exist
     yet. Costs one 1x1 canvas, made once.

     AND IT CHECKS ITSELF FIRST. If this browser's canvas does not know the
     colour space, `fillStyle` silently keeps whatever it had rather than
     throwing - so a wrong answer would look like a right one. Three colours
     with known answers are put through it once; if any comes back wrong,
     the conversion is not trusted at all and the caller is told there is no
     answer, which it treats as "not measurable" rather than as "too faint".
     A check that cannot see is better off saying so. */
  var canvasCtx;          /* made on first use, kept */
  var canvasOk;           /* undefined until tested, then true or false */

  function canvasReady() {
    if (canvasOk !== undefined) return canvasOk;
    canvasOk = false;
    try {
      var cv = document.createElement('canvas');
      cv.width = cv.height = 1;
      var ctx = cv.getContext('2d', { willReadFrequently: true });
      if (!ctx) return canvasOk;

      function read(colour) {
        ctx.fillStyle = '#000';            /* a known start, so a fillStyle
                                              the browser ignores shows up */
        ctx.fillStyle = colour;
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillRect(0, 0, 1, 1);
        var d = ctx.getImageData(0, 0, 1, 1).data;
        return [d[0], d[1], d[2]];
      }
      function near(got, want) {
        return Math.abs(got[0] - want[0]) <= 2 &&
               Math.abs(got[1] - want[1]) <= 2 &&
               Math.abs(got[2] - want[2]) <= 2;
      }
      /* white, a mid colour and the space in question - the third is the
         one that matters, the first two catch a canvas that is not
         painting at all */
      if (!near(read('#ffffff'), [255, 255, 255])) return canvasOk;
      if (!near(read('rgb(64, 128, 192)'), [64, 128, 192])) return canvasOk;
      if (!near(read('oklab(1 0 0)'), [255, 255, 255])) return canvasOk;

      canvasCtx = ctx;
      canvasOk = true;
    } catch (e) { canvasOk = false; }
    return canvasOk;
  }

  function viaCanvas(value) {
    if (!canvasReady()) return null;
    try {
      canvasCtx.fillStyle = '#000';
      canvasCtx.fillStyle = value;
      /* THE COLOUR WAS REFUSED if fillStyle is still the black we just set
         - a value the browser cannot parse is ignored rather than reported.
           Without this, an unreadable colour would measure as black, which
           is the darkest possible answer and would outline every letter. */
      if (canvasCtx.fillStyle === '#000000') {
        canvasCtx.fillStyle = '#fff';
        canvasCtx.fillStyle = value;
        if (canvasCtx.fillStyle === '#ffffff') return null;   /* refused both */
        canvasCtx.fillStyle = value;
      }
      canvasCtx.clearRect(0, 0, 1, 1);
      canvasCtx.fillRect(0, 0, 1, 1);
      var d = canvasCtx.getImageData(0, 0, 1, 1).data;
      /* FULLY TRANSPARENT IS NOT A COLOUR to measure. A gradient stop can
         be `transparent`; measuring it as black would be a lie. */
      if (d[3] === 0) return null;
      return [d[0], d[1], d[2]];
    } catch (e) { return null; }
  }

  /* ASK THE BROWSER WHAT A CUSTOM PROPERTY ACTUALLY IS, rather than
     reading the text of it.

     This one cost me an hour and it is worth writing down. A custom
     property hands back whatever was written into it - `#849E59`, or
     `color-mix(...)`, or a plain word - and NOT a colour the parser above
     can read. Handed `#8A92A0` it found the digit runs 8, 92 and 0 and
     reported a dark green, so a colour measuring 5.65 against the band
     was declared to be 2.14 and the letters were given an outline they
     did not need. Every number was wrong and every number looked real.

     So the value is put on a real element as its `color` and read back.
     A computed `color` is always normalised to rgb(), whatever shape it
     went in as - which makes the browser the parser and leaves nothing
     to guess.

     AND THE PROBE GOES ON THE BODY, NOT INSIDE THE BAND, which is the
     second half of the same hour. Put inside the band, the probe has to
     inherit the band's own --cs-chap-N - and a value inherited into an
     element created a moment after the mode changed can still be the
     colour from before it. It is right most of the time, which is the
     worst way for a thing to be wrong: the outline came back on when you
     switched to light and back to dark, and only when some other code
     had read that property first.

     The palette tokens live on :root and nothing stands between them and
     the body, so a probe there reads the colour that is true now. Which
     means the caller hands over the TOKEN - var(--cs-sun-on-bg) - rather
     than the band's copy of it. */
  function resolve(value) {
    var probe = document.createElement('span');
    probe.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;';
    probe.style.color = value;
    document.body.appendChild(probe);
    var got = window.getComputedStyle(probe).color;
    document.body.removeChild(probe);
    return rgb(got);
  }

  /* THE WORD A SLIDE WROTE, AS THE TOKEN THE TEMPLATE SET. One function so
     the check and the template cannot disagree about what "sun" means. */
  function chapToken(word) {
    if (word === 'accent-1' || word === 'accent-2') return 'var(--cs-' + word + ')';
    return 'var(--cs-' + word + '-on-bg)';
  }

  function ratio(a, b) {
    var la = luminance(a), lb = luminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  }

  /* THE VERDICT, AND WHAT IS DONE WITH IT.

     IT SAYS SO; IT NO LONGER FIXES IT. This used to put an outline round
     the letters when the paint was too faint. The outline has gone - the
     letters are lit and nothing else - so the only thing left to do with
     the answer is tell somebody. That is not a smaller job than it sounds:
     a silent fix hides a bad colour choice for ever, and a warning puts it
     in front of the person who can change it.

     The band is marked either way, so a stylesheet or a test can read the
     verdict without reading the console. */
  function report(band, worst) {
    if (!worst) return;

    var faint = worst.got < 3.0;
    band.dataset.csChapFaint = faint ? 'true' : 'false';

    /* SAID ONCE PER STATE, not on every mode change, so a reader of the
       console is told something new rather than the same thing four
       times. */
    var said = band.dataset.csChapSaid || '';
    var now = faint ? 'faint:' + worst.name : 'clear';
    if (faint && said !== now && window.console && console.warn) {
      console.warn('[case study] chapter-name-graphics: ' + worst.name +
        ' measures ' + worst.got.toFixed(2) + ' against the page, under the ' +
        '3.0 that text this size needs. The letters have no outline to fall ' +
        'back on, so this chapter name will be hard to read - most of all ' +
        'for a reader who has asked for less motion and sees one frame. ' +
        'Pick a stronger colour, or use graphics-none for this one.');
    }
    band.dataset.csChapSaid = now;
  }

  CS.initChapterGraphics = function (root) {
    var bands = (root || document).querySelectorAll('.cs-chap-band');

    for (var i = 0; i < bands.length; i++) {
      (function (band) {
        /* THIS CHECK IS FOR THE `graphics-inside` VARIANT ONLY.

           It asks one question: are the colours the clouds are painted in
           readable against the ONE FLAT COLOUR behind the letters? In
           graphics-outside there is no such colour - the letters sit on
           the drifting clouds themselves - so the question has no answer
           and the honest thing is not to pretend it does. That variant
           carries its ink outline always instead, which is the same
           protection arrived at without a measurement that cannot be
           made. */
        /* graphics-none paints nothing, so there is nothing to measure. */
        if (band.dataset.csChapVariant !== 'inside') return;

        /* WHAT THE LETTERS ARE SITTING ON, asked of the token rather than
           of the element - see the note by --cs-chap-band in
           cs-slides.css for the hour that bought this line. */
        var behind = resolve('var(--cs-chap-band)');
        if (!behind) return;

        var names = (band.dataset.csChapColours || '').split(' ');
        var worst = null;

        /* DOES THIS MOTION HAVE ONE COLOUR UNDER EVERYTHING?

           If it declares `--cs-chap-ground`, that is the colour a letter
           IS wherever the motion is not lighting it, and it is the only
           thing that decides whether the name can be read. Everything else
           the motion paints is a highlight on top of it.

           If it does not - a motion with no single ground, the clouds for
           instance - the check falls back to weighing every colour, which
           is what it always did. */
        var ground = resolve('var(--cs-chap-ground)');
        if (ground) {
          weigh(ground, 'the ground the letters are painted on');
          report(band, worst);
          return;
        }

        function weigh(colour, label) {
          if (!colour) return;
          var got = ratio(colour, behind);
          if (!worst || got < worst.got) worst = { got: got, name: label };
        }

        /* ---- THE COLOURS THE SLIDE NAMED ---- */
        for (var k = 0; k < names.length; k++) {
          if (!names[k]) continue;
          weigh(resolve(chapToken(names[k])), names[k]);
        }

        /* =================================================================
           AND THE COLOURS THE MOTION MIXED FOR ITSELF
           =================================================================

           THE SLIDE'S LIST IS NOT THE WHOLE LIST. The clouds take the two
           colours the slide named and mix four more out of them - a lit rim,
           two shaded undersides, a faded distance - and those four are on
           the screen just as much as the two. A check that measured only
           the named ones would be measuring one thing while the page showed
           another, which is worse than having no check at all.

           SO THE MOTION DECLARES WHAT IT MIXED. `--cs-chap-extra-1` upwards
           on the band, in order from 1, and this reads until there are no
           more. That is the whole of the contract between the fenced motion
           block in cs-slides.css and this check: paint with the named
           colours, and declare anything else you mix.

           READ OFF THE BAND, NOT OUT OF A CHILD. By the time a custom
           property is read from an element it already has its var()s
           substituted - so what comes back is the finished mix with real
           colours in it, which a probe on the body can then resolve. That
           is what makes this safe where reading the band's own --cs-chap-N
           through a freshly made child was not: there is no inheritance
           step to be stale. Measured across eight mode switches, 96 reads,
           no disagreement with a fresh load in either mode.

           A NUMBER THAT IS NOT THERE ENDS THE LIST, so the series must have
           no gaps. Twelve is a ceiling rather than a limit anybody should
           reach - it stops a typo from turning into a loop with no end. */
        var style = window.getComputedStyle(band);
        for (var e = 1; e <= 12; e++) {
          var written = style.getPropertyValue('--cs-chap-extra-' + e).trim();
          if (!written) break;
          /* A MIX THAT CANNOT BE READ IS NOT COUNTED AS DARK. resolve()
             hands back nothing when the colour is transparent, or in a
             space this browser cannot convert. Treating that as a failing
             contrast would outline every letter on a browser whose only
             fault is being unusual. */
          weigh(resolve(written), 'a colour the motion mixed (extra-' + e + ')');
        }

        report(band, worst);
      })(bands[i]);
    }

    /* ONE OBSERVER FOR THE WHOLE PAGE, set up the first time this runs.
       The mode is one attribute on <html>, and every colour on the page
       hangs off it - so when it changes, every chapter band has to ask
       again. A band checked in the dark and never checked again would
       keep a dark-mode answer in the light. */
    if (!CS._chapWatch && window.MutationObserver) {
      CS._chapWatch = new MutationObserver(function () {
        /* AFTER THE PAINT, not during it. The attribute changes before the
           new colours are resolved, and a colour read in between is the
           old one. */
        window.requestAnimationFrame(function () {
          CS.initChapterGraphics();
        });
      });
      CS._chapWatch.observe(document.documentElement,
        { attributes: true, attributeFilter: ['data-cs-mode'] });
    }
  };

  /* =======================================================================
     THE EXPLAINS PANEL - a scrolling column of short sections
     =======================================================================

     It was built for ONE slide: the people. A tall surface beside the
     portrait, holding everything about that person at once, scrolled rather
     than clicked through. Case study 2 asks for the same panel beside an
     IDEA rather than a person - four sections, one of which is a drawing -
     so it stops belonging to the persona slide and becomes a part like the
     surface above it.

     TWO HALVES, and the split is deliberate (see the long note in
     cs-slides.css): `explainsBox` is the OUTER surface, which has the
     colour, the corner and the fixed height and does NOT scroll;
     `explainsPaint` fills the INNER box, which does.

     A SECTION IS WRITTEN THE WAY YOU WOULD SAY IT:

         sections: [
           { heading: 'Scenario',      body: 'one paragraph' },
           { heading: 'User',          picture: true },
           { heading: 'JTBD',          body: ['first', 'second'] },
           { heading: 'What to avoid', body: [{ kind: 'points', items: [...] }] }
         ]

     `picture: true` is the whole of what makes a section a drawing, and
     WHICH drawing it shows is the caller's business - the persona slide
     hands over that person's `media2`, an ideation slide hands over the
     slide's own. That is why the drawing is not named here: one panel, two
     slides, and neither has to know how the other finds its picture. */
  /* ONE CELL OF A GRID SLIDE.

     A cell is whatever the author wrote, read in the one order that cannot
     be ambiguous: a bare string is writing, and anything else is an object
     that may carry writing, drawings, or a tint.

     THE STACKING IS ALWAYS VERTICAL when a cell holds more than one kind
     of thing - the sheet asks for it and it is the only arrangement that
     survives a narrow column. */
  function gridCell(spec, groupEnd) {
    var cell = el('div', 'cs-grid-cell' + (groupEnd ? ' is-group-end' : ''));
    if (spec === undefined || spec === null) return cell;

    if (typeof spec === 'string') {
      if (spec !== '') cell.appendChild(el('p', 'cs-grid-value', spec));
      return cell;
    }

    if (spec.mark) cell.dataset.csMark = String(spec.mark);

    /* A DRAWING FILLING THE WHOLE CELL. It is its own kind rather than "a
       picture with no writing", because the two look nothing alike: this
       one goes edge to edge with no padding, and the row grows to hold it. */
    if (spec.fill) {
      cell.classList.add('is-filled');
      cell.appendChild(slot(spec.fill, 'cs-grid-fill'));
      return cell;
    }

    if (spec.value !== undefined && spec.value !== '') {
      var v = el('p', 'cs-grid-value');
      v.innerHTML = spec.value;          /* copy is written with entities */
      cell.appendChild(v);
    }

    var medias = spec.medias || (spec.media ? [spec.media] : []);
    if (medias.length) {
      var strip = el('div', 'cs-grid-thumbs');
      medias.forEach(function (name) {
        var t = slot(name, 'cs-grid-thumb');
        /* the box is too small to print the name it wants (see
           .cs-grid-thumb in cs-slides.css), so it carries it instead */
        t.title = name;
        strip.appendChild(t);
      });
      cell.appendChild(strip);
    }
    return cell;
  }

  function explainsBox(label) {
    var panel = el('div', 'cs-persona-explains');
    panel.setAttribute('data-cs-stroke', '');
    var scroll = el('div', 'cs-persona-explains-scroll dc-scroll');
    scroll.setAttribute('tabindex', '0');            /* keyboard-scrollable */
    scroll.setAttribute('role', 'region');
    scroll.setAttribute('aria-label', label || 'More about this');
    panel.appendChild(scroll);
    /* the caller paints into this, and should not have to go looking for it */
    panel.scroller = scroll;
    return panel;
  }

  /* `figureFor(section, index)` returns the node that goes where a picture
     section's drawing goes. It is handed in rather than looked up, for the
     reason above. */
  function explainsPaint(scroller, sections, figureFor) {
    if (!scroller) return;
    scroller.textContent = '';
    (sections || []).forEach(function (sec, i) {
      var box = el('section', 'cs-persona-sec');

      if (sec.heading) {
        var h = el('h3', 'cs-persona-sec-title');
        h.innerHTML = sec.heading;
        box.appendChild(h);
      }

      if (sec.picture) {
        /* `figureFor` returning nothing means THIS PANEL SHOWS ITS DRAWING
           SOMEWHERE ELSE - at the head of the panel rather than as a
           section of it. The section is then dropped whole, heading and
           all, because a heading with nothing under it is worse than no
           heading: its content has moved, it has not gone missing. */
        var fig = figureFor && figureFor(sec, i);
        if (!fig) return;
        box.appendChild(fig);
        scroller.appendChild(box);
        return;
      }

      if (sec.body !== undefined && sec.body !== '') {
        var b = el('div', 'cs-body cs-persona-sec-body');
        /* A SECTION'S BODY IS WRITTEN THE SAME WAY AS ANY OTHER BODY on the
           site - a string, a list of strings, or anything with a `kind` -
           so there is one vocabulary to learn rather than two. */
        (Array.isArray(sec.body) ? sec.body : [sec.body]).forEach(function (part) {
          if (part && part.kind) { b.appendChild(piece(part)); return; }
          var para = document.createElement('p');
          /* innerHTML, not textContent: copy is written with entities like
             &mdash; spelled out */
          para.innerHTML = part;
          b.appendChild(para);
        });
        box.appendChild(b);
      }

      scroller.appendChild(box);
    });

    /* THE PANEL'S CONTENTS JUST CHANGED - a different person, a different
       idea - so whether it needs a scrollbar may have changed too. See
       cs-scrollers.js for why this cannot be left to CSS. */
    if (CS.remeasureScrollers) CS.remeasureScrollers(scroller.parentNode || scroller);
  }

  /* =======================================================================
     THE HEAD OF A PANEL - who this idea is for
     =======================================================================

     A row of small square drawings, one per USER GROUP the idea is for,
     with a line of writing beside them.

     TWO NUMBERS, AND THE SHEET IS RIGHT THAT THEY ARE DIFFERENT NUMBERS:

         n   HOW MANY USER GROUPS THE WHOLE CASE STUDY HAS. Written once,
             at the foot of content.js, as `userGroups` - a list of groups
             with a drawing each.

         x   HOW MANY OF THEM THIS SLIDE SHOWS. Written on the slide's own
             line as `groups`, naming the ones it is for. Anywhere from one
             to all of them.

     So adding a fifth group to the study is one line in one place, and it
     does not touch a single slide; and changing which groups an idea was
     drawn for is changing the names on that slide and nothing else.

     THE LINE BESIDE THEM is `groupsCaption` in that slide's copy block. It
     has its own word rather than borrowing `captions`, because it no longer
     belongs to ONE picture - there may be three up there. */
  function explainsHead(medias, text, missingKey) {
    var head = el('div', 'cs-explains-head');
    var figs = el('div', 'cs-explains-head-figures');
    (medias || []).forEach(function (m) {
      figs.appendChild(slot(m, 'cs-explains-head-figure'));
    });
    head.appendChild(figs);
    if (text) {
      head.appendChild(el('p', 'cs-explains-head-text', text));
    } else {
      /* the same habit the empty picture boxes have: say what is missing
         rather than leaving a gap nobody can account for */
      head.appendChild(el('p', 'cs-meta cs-explains-head-text',
        missingKey || 'no caption written'));
    }
    return head;
  }

  /* THE GROUPS A SLIDE SHOWS, resolved from the names on its own line
     against the study's own list. A name that matches nothing is reported
     rather than silently dropped - a missing face on a slide is exactly the
     kind of thing you do not notice until someone else does. */
  function groupsFor(d) {
    /* ASKED OF THE SLIDE, NOT OF THE STUDY. A slide carries the phase it
       was read from (`copyIn`, put there by cs-content.js), so a phase's
       own `userGroups` is what its slides see. See CS.pool. */
    var all = (CS.pool ? CS.pool('userGroups', d)
                       : (CS.CASE_STUDY && CS.CASE_STUDY.userGroups)) || [];
    var want = d.groups;
    /* saying nothing shows every group the study has, which is the sensible
       reading of "this idea is for everyone" */
    if (!Array.isArray(want)) want = all.map(function (g) { return g.id; });
    var out = [];
    want.forEach(function (id) {
      for (var i = 0; i < all.length; i++) {
        if (all[i].id === id) { out.push(all[i]); return; }
      }
      console.warn('[case study] no user group called "' + id +
                   '" - the list is `userGroups` in ' +
                   (d.copyIn ? d.copyIn + '/content.js' : 'content.js'));
    });
    return out;
  }

  /* =======================================================================
     THE IMPACT AND FEASIBILITY CARDS
     =======================================================================

     Two small cards under the panel, side by side. Each is a CAPTION naming
     what is being judged and a VALUE saying how it was judged:

         impact:      'high'
         feasibility: 'medium'

     on the slide's own line in content.js, so every idea can be rated
     differently and the ratings sit beside each other in the file where you
     can compare them at a glance.

     FIVE VALUES AND ONLY FIVE - very low, low, medium, high, very high. A
     fixed scale is the whole point of a rating: four ideas rated on four
     different scales cannot be compared, which is the one thing a reader
     will want to do with them. Anything else is drawn as written and said
     out loud in the console, rather than quietly accepted.

     The words "Impact" and "Feasibility" are the engine's, and can be
     overridden per study under `labels` in copy.js. */
  var RATINGS = {
    'very low':  'Very low',
    'low':       'Low',
    'medium':    'Medium',
    'high':      'High',
    'very high': 'Very high'
  };

  /* THE STUDY-WIDE SWITCH. Left out entirely, the cards show - which is
     what every study that has never heard of this flag expects. Only the
     word `false` turns them off. */
  /* =======================================================================
     WHETHER THE TWO ASSESSMENT CARDS APPEAR, ASKED AT THREE LEVELS
     =======================================================================

     The strip under a use-case panel says how much an idea would do and how
     easily it could be done. Not every study wants it, not every slide in a
     study that does wants it, and sometimes only one of the two is a
     question worth answering. So there are three ways to say no, from
     widest to narrowest, and the narrowest wins:

         meta: { showRatings: false }     THE WHOLE STUDY. No use-case slide
                                          anywhere gets the strip.

         ratings: false                   ONE SLIDE, on its own line in
                                          content.js. No strip on this one.

         feasibility: false               ONE CARD. The strip is still there
         impact: false                    with the other card in it.

     ALL THREE ARE A DELIBERATE NO, never an omission - the same distinction
     `title: null` makes. A rating LEFT OUT still draws its card, with a dash
     in it, because the strip is part of the shape of this slide and a
     missing value should read as "not rated yet" rather than making one
     panel a different shape from its neighbours. `false` is you saying
     there is nothing to rate.

     AND NOTHING IS RETYPED TO UNDO ANY OF THEM. The ratings stay written on
     each slide's line whichever switch is off, so turning them back on is
     removing one word. */
  function ratingsShown(d) {
    var meta = (CS.CASE_STUDY && CS.CASE_STUDY.meta) || {};
    if (meta.showRatings === false) return false;
    if (d && d.ratings === false) return false;
    /* both cards turned off one at a time is the same as no strip */
    if (d && d.impact === false && d.feasibility === false) return false;
    return true;
  }

  function ratingCard(labelKey, fallback, value) {
    var labels = (CS.COPY && CS.COPY.labels) || {};
    var card = el('div', 'cs-rating');
    card.setAttribute('data-cs-stroke', '24');

    var key = String(value || '').toLowerCase().replace(/[-_]+/g, ' ').trim();
    var shown = RATINGS[key];
    if (!shown) {
      shown = value || '—';
      if (value) {
        console.warn('[case study] "' + value + '" is not one of the five ' +
          'ratings (very low, low, medium, high, very high) - ' + labelKey);
      }
    }
    card.dataset.csRating = RATINGS[key] ? key.replace(/ /g, '-') : 'unknown';

    card.appendChild(el('p', 'cs-rating-label',
      labels[labelKey] !== undefined ? labels[labelKey] : fallback));
    card.appendChild(el('p', 'cs-rating-value', shown));
    return card;
  }

  CS.explains = { box: explainsBox, paint: explainsPaint, head: explainsHead };

  function flow(p) {
    var wrap = el('div', 'cs-flow' + (p.stacked ? ' cs-flow--stacked' : ''));
    p.steps.forEach(function (step, i) {
      if (i) wrap.appendChild(el('span', 'cs-flow-arrow'));
      var box = el('div', 'cs-flow-step' + (step.quiet ? ' cs-flow-step--quiet' : ''));
      box.setAttribute('data-cs-stroke', '24');
      if (step.label) box.appendChild(el('p', 'cs-meta', step.label));
      box.appendChild(el('p', 'cs-body', step.text));
      if (step.note) box.appendChild(el('p', 'cs-meta', step.note));
      wrap.appendChild(box);
    });
    return wrap;
  }

  /* A row of tiles. Two shapes come out of the same function:

       no `value`  the tile opens with an empty drawn circle - a placeholder
                   mark, used where the tile names a force or a theme
       a `value`   the circle is replaced by the figure itself, set large,
                   because on a results slide the number IS the point

     A tile with figures also gets a `unit` under the number (per month, out
     of 5) so the figure can stay short. */
  function tiles(p) {
    var hasFigures = p.items.some(function (t) { return t.value; });
    var ul = el('ul', 'cs-tiles cs-tiles--static' +
      (hasFigures ? ' cs-tiles--figures' : ''));
    p.items.forEach(function (t) {
      var li = el('li', 'cs-tile');
      li.setAttribute('data-cs-stroke', '24');
      if (t.value) {
        var fig = el('span', 'cs-tile-figure');
        fig.appendChild(el('span', 'cs-tile-value', t.value));
        if (t.unit) fig.appendChild(el('span', 'cs-tile-unit', t.unit));
        li.appendChild(fig);
      } else {
        li.appendChild(el('span', 'cs-tile-mark'));
      }
      li.appendChild(el('span', 'cs-tile-label', t.label));
      if (t.note) li.appendChild(el('span', 'cs-tile-note', t.note));
      ul.appendChild(li);
    });
    return ul;
  }

  /* A media slot. What fills it is the case study's business, not the
     template's — the template only decides where it sits. */
  function slot(name, extraClass) {
    /* A template can have a place for a picture on a slide that was never
       given one. Before, that drew a box labelled "undefined", which looks
       like a fault rather than a gap. It now says what it is, and the
       console check (CS.PrototypeEmbed.empty()) leaves it out, because a
       slide with no picture named is a decision, not an oversight. */
    if (!name) name = 'no-picture-named';
    var node = CS.PrototypeEmbed.create(name, CS.PrototypeEmbed.lookup(name));
    if (extraClass) node.className += ' ' + extraClass;

    /* SOME SLOTS WANT NO DRAWN OUTLINE.

       Every embed asks for one by default, because a photograph or a video
       dropped on the page has no edge of its own and the drawn line is what
       makes it a thing on a sheet rather than a hole in it.

       A PROTOTYPE IS NOT THAT. It is a screen - it already has a border, a
       background and corners of its own, drawn inside it by its own CSS. A
       second line round the outside reads as a frame round a frame, and on
       a prototype slide, where the window is the whole point of the slide,
       that doubled edge is the first thing the eye lands on.

       The slot is marked rather than the embed inside it, so the rule holds
       for whatever the slot holds later - a poster now, a running prototype
       after the first click, a second prototype after an arrow press. See
       `data-cs-no-stroke` in cs-strokes.js.

       Add a class to NO_STROKE and that slot joins it. */
    var NO_STROKE = ['cs-proto-window', 'cs-numbered-icon'];
    if (NO_STROKE.some(function (c) { return node.classList.contains(c); })) {
      node.setAttribute('data-cs-no-stroke', '');
      node.querySelectorAll('[data-cs-stroke]').forEach(function (n) {
        var drawn = n.querySelector(':scope > .cs-stroke');
        if (drawn) drawn.remove();
      });
    }
    return node;
  }

  function stage(content, extraClass) {
    var s = el('div', 'cs-stage' + (extraClass ? ' ' + extraClass : ''));
    s.appendChild(content);
    return s;
  }

  /* ---------- WHICH VERSION A CHAPTER MARK USES ----------

     THE ANSWER CAN COME FROM A STYLESHEET, and that is the point of this
     function. You asked to be able to switch versions without touching
     content.js, so the question is asked in this order:

       1  `variant:` on the slide's own line, if it has one
       2  `--cs-chap-version` on the page - set it in the study's theme.css
          and every chapter mark follows
       3  `graphics-inside`, which is what the slide has always been

     The three versions are spelled `graphics-inside`, `graphics-outside`
     and `graphics-none`, and the bare words `inside` / `outside` / `none`
     are accepted too because that is what somebody writing CSS will type.

     ANYTHING ELSE FALLS BACK TO INSIDE rather than drawing nothing. A typo
     should cost you the version you wanted, not the slide. */
  function chapterVariant(d) {
    var want = d && d.variant;

    if (!want) {
      /* READ ONCE, FROM THE PAGE. getComputedStyle on <html> is the only
         way to see a custom property's VALUE; a stylesheet cannot branch on
         one by itself. It is read per slide rather than cached because a
         study can change the value between two chapter marks if it wants
         to, and because this runs a handful of times on a page, not a
         thousand. */
      try {
        want = getComputedStyle(document.documentElement)
                 .getPropertyValue('--cs-chap-version');
      } catch (e) { want = ''; }
    }

    /* TIDIED BEFORE IT IS MATCHED, in this order:
         - the quotes a custom property's value arrives wrapped in
         - the spaces around it
         - the `graphics-` in front, which is optional
         - the case, because `Graphics-None` is you typing the name the way
           it reads in a sentence, and losing the version you asked for over
           one capital letter is the sort of thing nobody ever debugs */
    want = String(want || '')
             .trim()
             .replace(/^['"]|['"]$/g, '')
             .trim()
             .toLowerCase()
             .replace(/^graphics-/, '');

    return (want === 'outside' || want === 'none') ? want : 'inside';
  }

  function caption(text) { return el('p', 'cs-caption', text); }

  function draftMark(d) {
    var n = el('p', 'cs-meta cs-draft', typeof d === 'string' ? d : 'draft copy');
    return n;
  }

  /* ---------- WHAT GOES IN FRONT OF A CARD ----------

     The numbered grid used to have one answer: 01, 02, 03. A card's mark is
     not always a number, though - sometimes it is a letter, sometimes it is
     just a dot holding the place, and sometimes it is a little drawing - so
     the slide now says which kind it wants:

         marks: 'numbers'        01  02  03     (the default; nothing to write)
         marks: 'letters'        A   B   C
         marks: 'letters-lower'  a   b   c
         marks: 'roman'          i   ii  iii
         marks: 'bullets'        a drawn dot, the same size as the writing
         marks: 'none'           nothing at all

     and ANY CARD CAN OVERRULE THE SLIDE:

         { n: '1a', body: ... }                    whatever you type
         { icon: 'slide-14_mark-01', body: ... }   a drawing instead

     `n` has always worked and still does, so nothing written already
     changes. A slide with no `marks` is numbered exactly as it was.

     WHY THE LIST ELEMENT CHANGES WITH THE MARK. Numbers, letters and roman
     numerals say "these have an order, and the third one is the third one".
     Dots and drawings do not - they say "these are a set". That is `<ol>`
     and `<ul>`, and a screen reader tells its listener which one it has
     found, so getting it right is not a detail. */

  var MARK_TEXT = {
    numbers: function (i) { return ('0' + (i + 1)).slice(-2); },

    /* PAST Z IT GOES AA, AB, AC - the spreadsheet column rule, because it is
       the one everybody has already seen. A grid of 27 cards is not likely,
       but a template that breaks on one is. */
    letters: function (i) {
      var out = '';
      var n = i;
      do { out = String.fromCharCode(65 + (n % 26)) + out; n = Math.floor(n / 26) - 1; }
      while (n >= 0);
      return out;
    },

    roman: function (i) {
      var V = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
      var S = ['m', 'cm', 'd', 'cd', 'c', 'xc', 'l', 'xl', 'x', 'ix', 'v', 'iv', 'i'];
      var n = i + 1, out = '';
      for (var k = 0; k < V.length; k++) { while (n >= V[k]) { out += S[k]; n -= V[k]; } }
      return out;
    }
  };
  MARK_TEXT['letters-lower'] = function (i) {
    return MARK_TEXT.letters(i).toLowerCase();
  };

  /* the kinds that carry an order, and therefore belong in an <ol> */
  var MARK_ORDERED = {
    numbers: true, letters: true, 'letters-lower': true, roman: true
  };

  /* ---------- the templates ---------- */
  /* Each returns an array of children; the renderer puts them in the slide. */

  var T = {

    /* #1 — hero */
    'hero': function (d) {
      var out = [];
      var h1 = el('h1', 'cs-hero-title', d.title);
      if (d.subtitle) h1.appendChild(el('span', 'cs-hero-sub', d.subtitle));
      out.push(h1);
      /* Spec #1 puts a long horizontal illustration here, between the title
         and the body, as an ornamental separator. It is OUT for now: without
         a real drawing to cut it from, the stencil showed as a flat grey
         slab. Put a drawn separator in assets.css and this line comes back. */
      /* ---- THE LEAD, AS ONE SENTENCE OR AS A ROW OF PIECES ----
         Write it as a line and it is a line, exactly as before. Write it
         as a LIST and each entry becomes a piece of a single row with a
         thin rule standing between them - a handful of figures or short
         phrases that read as separate things and as one statement at the
         same time.

             lead: `One sentence, as it has always been.`
             lead: [ `12 weeks`, `4 teams`, `1 shipped product` ]

         EVERY PIECE IS A SPAN, EVEN WHEN THERE IS ONLY ONE, so the two
         shapes are the same markup and nothing in the CSS has to ask which
         it is looking at. The rules between them are drawn by the CSS from
         the pieces' own edges, not written into the words - so nothing
         reads "pipe" out loud, and a piece that wraps onto a second line
         does not take half a rule with it. */
      var leadParts = Array.isArray(d.lead) ? d.lead : (d.lead ? [d.lead] : []);
      if (leadParts.length) {
        var lead = el('p', 'cs-lead cs-hero-lead' +
                           (leadParts.length > 1 ? ' cs-hero-lead--row' : ''));
        leadParts.forEach(function (t) {
          lead.appendChild(el('span', 'cs-hero-lead-part', t));
        });
        out.push(lead);
      }
      if (d.tags) {
        var ul = el('ul', 'cs-hero-tags');
        d.tags.forEach(function (t) {
          /* A SURFACE, SO IT GETS A SURFACE'S EDGE. The pen is tinted to
             `--cs-surface-edge` rather than to the words - see the note
             by `.cs-tile > .cs-stroke` in cs-components.css, which is
             where every surface on the site gets the same treatment. */
          var li = el('li', 'cs-tag', t);
          li.setAttribute('data-cs-stroke', '');
          ul.appendChild(li);
        });
        out.push(ul);
      }
      if (d.artwork) out.push(el('div', 'cs-hero-image cs-art ' + d.artwork));
      else if (d.media) out.push(slot(d.media, 'cs-hero-image'));
      /* The long horizontal drawing along the bottom of the slide, which
         spec #1 uses as an ornamental separator between the title block and
         everything that follows. It was taken out once because it had no
         drawing behind it and showed as a flat grey slab; it is back as a
         proper named slot, so with no drawing it is a labelled placeholder
         and with one it is the drawing. Leave `separator` out and the row
         simply stands empty. */
      if (d.separator) out.push(slot(d.separator, 'cs-hero-rule-slot'));
      return out;
    },

    /* #2.1 — a picture, two sections beside it
       #2.3 — the same, with a picture where the second body would be */
    'context-2': function (d) {
      /* THE WRITING IS ONE BLOCK, NOT FOUR PIECES.

         It used to be four separate grid items pinned to four separate
         rows of the slide, which meant the picture's height decided where
         each of them sat: a tall picture pushed the second section most of
         a slide below the first, with nothing between them. Two sections
         that belong to one slide have to read as two sections of one
         slide.

         As one column they sit at their own natural distance from each
         other, the column sits centred against the picture, and every line
         in it starts on the same left edge. The CSS for all three of those
         is in one short block in cs-slides.css. */
      var col = el('div', 'cs-context-col');
      col.appendChild(title(d.title, { eyebrow: d.eyebrow, key: copyKey(d) }));
      col.appendChild(body(d.body, 'cs-sec-1-body'));
      col.appendChild(title(d.title2, { slot: 'cs-sec-2-title' }));
      col.appendChild(d.media2 ? slot(d.media2, 'cs-sec-2-body')
                               : body(d.body2, 'cs-sec-2-body'));
      return [slot(d.media, 'cs-context-figure'), col];
    },

    /* #2.2 — a picture, one section beside it */
    'context-1': function (d) {
      /* The same column as #2.1 with one section in it, so the two
         templates cannot drift apart. */
      var col = el('div', 'cs-context-col');
      col.appendChild(title(d.title, { eyebrow: d.eyebrow, key: copyKey(d) }));
      col.appendChild(body(d.body, 'cs-sec-1-body'));
      return [slot(d.media, 'cs-context-figure'), col];
    },

    /* #3.1 — section title, picture, caption */
    'title-figure-caption': function (d) {
      return [
        title(d.title, { eyebrow: d.eyebrow, key: copyKey(d) }),
        stage(d.stage ? piece(d.stage) : slot(d.media), d.band ? 'cs-stage--band' : ''),
        caption(d.caption || '')
      ];
    },

    /* #3.2 — picture and caption, no title */
    'figure': function (d) {
      return [slot(d.media), caption(d.caption || '')];
    },

    /* #3.3 — section title and picture, no caption */
    'title-figure': function (d) {
      return [
        title(d.title, { eyebrow: d.eyebrow, key: copyKey(d) }),
        stage(d.stage ? piece(d.stage) : slot(d.media), d.band ? 'cs-stage--band' : '')
      ];
    },

    /* #3.4 — section title, then a statement, then a picture.
       Three bands down the slide: the title on one row, the statement across
       two (centred in its own space, as the spec asks), and the picture on
       the remaining five. Use it where a single sentence is the finding and
       the picture is the evidence for it. */
    'title-impact-figure': function (d) {
      return [
        title(d.title, { eyebrow: d.eyebrow, key: copyKey(d) }),
        el('p', 'cs-impact', d.impact),
        stage(d.stage ? piece(d.stage) : slot(d.media), d.band ? 'cs-stage--band' : '')
      ];
    },

    /* #4.1 and #4.2 — two sections, stacked, nothing else. The second
       section is optional: leave `title2` out and the slide is one section
       with the whole height to itself, rather than one section and an empty
       space where the other one would have been. */
    'sections': function (d) {
      var out = [
        title(d.title, { eyebrow: d.eyebrow, key: copyKey(d) }),
        d.media ? slot(d.media, 'cs-sec-1-body')
                : body(d.body, 'cs-sec-1-body', d.split ? 'cs-split' : '')
      ];
      if (d.title2 || d.body2 || d.media2) {
        out.push(title(d.title2, { slot: 'cs-sec-2-title' }));
        out.push(d.media2 ? slot(d.media2, 'cs-sec-2-body')
                          : body(d.body2, 'cs-sec-2-body', d.split2 ? 'cs-split' : ''));
      }
      return out;
    },

    /* #5.1 — impact text with a small mark */
    'impact-text': function (d) {
      var out = [];
      if (d.media) out.push(slot(d.media, 'cs-impact-mark'));
      out.push(el('p', 'cs-impact', d.impact));
      if (d.caption) out.push(caption(d.caption));
      return out;
    },

    /* #5.2 — impact text over a picture */
    'impact-bg': function (d) {
      return [slot(d.media), el('p', 'cs-impact', d.impact)];
    },

    /* #10.1 — slide strip: picture and caption */
    'strip-figure': function (d) {
      return [slot(d.media), caption(d.caption || '')];
    },

    /* #10.2 — slide strip: a heading with either one statement under it, or
       a diagram. The statement is the usual case; `stage` is for a short
       chain or a row of tiles that reads better as a band across the page
       than as a full slide. */
    /* #7 on the structure sheet - A STRIP WITH TWO BANDS.

       Not the same thing as `strip-text`, which carries one statement and
       nothing else. This one is a short slide with a TITLE and a PARAGRAPH
       under it: the same height as a strip, the same business as a full
       slide. The sheet draws it as two stacked bands, the title band about a
       fifth of the height and the writing filling the rest. */
    'strip-section': function (d) {
      return [
        title(d.title, { slot: 'cs-sec-1-title' }),
        body(d.body, 'cs-sec-1-body')
      ];
    },

    'strip-text': function (d) {
      var out = [];
      if (d.title) out.push(title(d.title));
      out.push(d.stage ? stage(piece(d.stage)) : el('p', 'cs-impact', d.impact));
      return out;
    },

    /* =====================================================================
       #10.4 strip-transition — THE HANDOVER FROM ONE USE CASE TO THE NEXT
       =====================================================================
       From the sheet "Slide-Strip-Transitionary".

       THE SHAPE, measured off the drawing:

           ┌──────────────────────────────────────────────────────────┐
           │  MMM-YYYY                                                │
           │  Use-Case #2: Name of Use-Case                           │
           │ ──────────────────────────────────────────────────────── │ <- the
           │                           Use-Case #3: Name of Use-Case  │    rule,
           │                                            MMM-YYYY      │    centred
           └──────────────────────────────────────────────────────────┘

       1920 x 570, which is the strip height this site already has, and 40
       units of padding, which is the slide padding it already has. Nothing
       new had to be invented for the box.

       THE RULE IS EXACTLY HALFWAY DOWN - 285 of 570 in the drawing - and it
       is the hinge the whole slide turns on. What is ABOVE it is the use
       case you are leaving, written from the left. What is BELOW it is the
       one you are entering, written from the right. The eye travels down
       and across, which is the movement the slide is describing.

       THE NAMES HUG THE LINE AND THE DATES SIT OUTSIDE THEM. Above the
       rule the order is date then name; below it, name then date. So the
       two blocks are mirror images, and the two things the line actually
       joins - the names - are the two things nearest it. That is the
       drawing's own arrangement and it is worth keeping: read it the other
       way round and the line appears to join two dates.

       =====================================================================
       WHAT TO WRITE
       =====================================================================

           content.js   { template: 'strip-transition', copy: 'slide-12' }

           copy.js      'slide-12': {
                          from: { date: `Aug-2026`,
                                  name: `Use-Case #2: Checking a covenant` },
                          to:   { date: `Nov-2026`,
                                  name: `Use-Case #3: Building a projection` }
                        }

       `from` and `to` rather than four flat keys, because this slide IS a
       handover and the two halves are the two sides of it. Either may be
       left out: the first transition in a study has nothing to come from,
       and the rule simply has one side.

       Either half may also carry a name without a date, or the other way
       round. Nothing is required except that there be something - a slide
       with neither half is the one case that says what to write instead.

       THE COLOURS ARE THE STUDY'S OWN TWO, and which gets which is not
       arbitrary: the NAMES take accent 1 and so does the rule, because the
       rule and the names are one thought; the DATES take accent 2, because
       they are a second kind of label running alongside. It is the same
       division the grid slide makes - one accent per direction of
       labelling. */
    /* =====================================================================
       #22 strip-fancy-accordion - A STACK OF ACCORDIONS
       =====================================================================
       From the three sheets of 6 November. A square drawing at the head of
       a panel, and under it a column of accordions: each one a title you
       press, opening on a body of writing with drawings standing between
       its paragraphs.

           ┌──────────────────────────────────┐
           │ [img]                            │   the head drawing
           ├──────────────────────────────────┤
           │ (+)  Accordion #1                │   closed: the title only
           ├──────────────────────────────────┤
           │ (−)  Accordion #2                │   open
           │      a paragraph                 │
           │           [ a drawing ]          │
           │      another paragraph           │
           ├──────────────────────────────────┤
           │ (+)  Accordion #3                │
           └──────────────────────────────────┘

       =====================================================================
       WHAT TO WRITE
       =====================================================================

           content.js
             { template: 'strip-fancy-accordion', copy: 'slide-05',
               title: null,
               media: 'slide-05_img-01',
               accordions: [ 'intake', 'triage', 'draft' ] }

           copy.js
             'slide-05': {
               accordionWords: {
                 intake: { label: `How a case arrives`, body: [
                   `The first paragraph.`,
                   { kind: 'image' },
                   `The one after the drawing.`
                 ] },
                 triage: { label: `Who picks it up`, body: [ `...` ] }
               }
             }

       `accordions` IS THE SHAPE AND LIVES IN content.js; `accordionWords`
       IS THE WORDS AND LIVES IN copy.js. Two names rather than one for the
       same reason `steps` and `stepWords` are two on the flow chart: one
       name in both files would collide in fill() and the loser would
       vanish with nothing said.

       `title: null` IS THE SHEET AS DRAWN - no heading above the panel.
       Leaving `title` OUT is different and still asks for one, saying
       which block it is waiting for; one is a decision and the other is a
       to-do, and they should not look the same. The same goes for `media`.

       =====================================================================
       THE SLIDE IS AS TALL AS IT NEEDS TO BE
       =====================================================================
       Every other slide here is 1080 design units, or 570 for a strip.
       This one has no height of its own at all, because it cannot: four
       closed accordions are short and one open accordion is not, and a
       fixed height would mean either a crowded stack or a lake of empty
       space under it depending on what the reader just pressed. So the
       slide is exactly as tall as what is in it, and the page grows and
       shrinks as it is read. That is in cs-slides.css under
       `.t-strip-fancy-accordion`, which is also the only slide on this
       site that says `min-height: 0`.

       =====================================================================
       EACH ACCORDION IS A REAL <details>, WHICH IS WHY IT NEEDS SO LITTLE
       =====================================================================
       A <details> with a <summary> inside it, not a div and a button. That
       buys three things that would otherwise all be code to write and to
       get wrong: opening and closing, the keyboard, and what a screen
       reader announces.

       It also means the slide survives a file that did not arrive.
       cs-fancy.js adds the things <details> has no opinion about - one
       open at a time, remembering which, and re-measuring the page after
       the height changes - and if it never loads, every accordion still
       opens and closes on its own.

       (To be exact about it: the whole page is drawn by JavaScript, so
       this is not a slide that works with scripting off. It is a slide
       that works when ONE of the engine's files is missing, which is the
       failure that actually happens - a study whose index.html has not
       been given the new script line yet.) */
    /* =====================================================================
       #23 chapter-name-graphics - A CHAPTER MARK WITH MOTION IN THE LETTERS
       =====================================================================
       From the sheet of 6 November. A strip: one filled band across the
       content area with the chapter's name in the middle of it - and the
       letters are a WINDOW rather than a colour. Something moves behind
       them and you see it only through the shapes of the words.

           ┌────────────────────────────────────────────────┐
           │                                                │
           │        C h a p t e r   N a m e                 │   1840 x 490
           │        ^ the letters are a hole                │
           └────────────────────────────────────────────────┘

       YOUR SHEET'S NUMBERS ARE THE HOUSE NUMBERS, which is worth saying:
       1844 x 489 drawn is 1840 x 490 built - the content width this site
       has always used, inside the 40 of slide padding, at exactly the 570
       of every other strip. Nothing new had to be invented to fit it.

       =====================================================================
       WHAT TO WRITE
       =====================================================================

           content.js
             { template: 'chapter-name-graphics', copy: 'slide-04',
               graphics: [ 'sun', 'mist', 'water' ] }

           copy.js
             'slide-04': { title: `Chapter Title With Motion Graphics` }

       `graphics` IS A LIST OF PALETTE WORDS, as many as you like, from the
       seven: sun, fire, water, forest, stone, mist, moon. Two makes a
       quiet piece and five a busy one. Leave it out and the study's own
       two accents are used, so the slide still has colours without
       anybody choosing any.

       A WORD THAT IS NOT ONE OF THE SEVEN is dropped and says so. The
       accent picker on <html> cannot complain - a stylesheet has no way to
       - but this list is read by code, so it can.

       THE BAND IS THE PAGE'S OWN RAISED SURFACE, not an accent. The moving
       colours inside the letters are the loud thing on this slide, and a
       bright band would be competing with the one thing it is there to
       show off.

       =====================================================================
       HOW THE COLOURS REACH THE MOTION
       =====================================================================
       Each word becomes a numbered custom property on the band, and the
       count beside them:

           --cs-chap-1: var(--cs-sun-on-bg);
           --cs-chap-2: var(--cs-mist-on-bg);
           --cs-chap-3: var(--cs-water-on-bg);
           --cs-chap-n: 3;

       So whatever is drawn in cs-slides.css asks for --cs-chap-1 and gets
       whichever colour this slide named, and a slide with four colours
       does not need a different piece of CSS from a slide with two.

       `-on-bg` AND NOT THE RAW COLOUR. Every one of the seven exists in
       three strengths and the middle one is the safe default - it is
       levelled to stay visible against the page. A motion graphic that
       wants the raw colour can ask for --cs-chap-N-vivid, which is set
       beside each one.

       =====================================================================
       WHEN THE LETTERS NEED AN OUTLINE, AND HOW THAT IS DECIDED
       =====================================================================
       A letter filled with a moving colour has no colour of its own, so
       how readable it is depends on what happens to be passing through it.
       Pale colour on a pale band and that letter is briefly not there.

       SO THE COLOURS ARE MEASURED AGAINST THE BAND, once, and the letters
       are given a thin outline if any of them is too faint. Not per letter
       and not per frame: see the long note on CS.initChapterGraphics
       below for why that is the better answer rather than the cheaper one.

       =====================================================================
       THE MOTION ITSELF IS ONE FENCED BLOCK IN cs-slides.css
       =====================================================================
       Everything in this file is the stage: the strip, the band, the
       letters-as-a-window, the colours, the outline. WHAT MOVES is a
       single block of CSS under `THE MOTION` in cs-slides.css, marked at
       both ends, and replacing it replaces the whole effect without
       touching a line of anything else.

       What is in there today is a stand-in, and it says so. */
    'chapter-name-graphics': function (d) {
      var key = copyKey(d);

      /* ---- WHICH OF THE TWO VARIANTS ----

             graphics-inside    the clouds are inside the letters, and
                                nothing else is painted. THE DEFAULT, and
                                what this slide has always been, so every
                                slide already written keeps exactly what it
                                had.
             graphics-outside   the clouds fill the band and the letters are
                                cut out of them, with the left and right
                                edges fading into the page.

         Write it on the slide's line:  variant: 'graphics-outside'
         Or write the variant's name as the template:  template:
         'graphics-outside' - the two spellings do the same thing, because
         you named them as variants and will reach for whichever reads
         better on the day.

         ANYTHING ELSE FALLS BACK TO INSIDE rather than drawing nothing. A
         typo should cost you the variant you wanted, not the slide. */
      var variant = chapterVariant(d);

      var band = el('div', 'cs-chap-band cs-chap-band--' + variant);
      band.dataset.csChapVariant = variant;

      /* ---- THE FADED EDGES, ON OR OFF ----

             fade: false      hard edges and rounded corners: a card of sky
             anything else    the edges melt into the page (the default)

         Written on the slide's own line, beside `variant`. It only means
         anything in graphics-outside, because it is the only version with
         a band to fade - the CSS simply has nothing to switch in the other
         two, so writing it there is harmless rather than confusing.

         `=== false` RATHER THAN `!d.fade`, because leaving the key out and
         writing `fade: false` have to mean different things: out means
         "no opinion, use the default", false means "I have an opinion and
         it is off". */
      if (d.fade === false) band.dataset.csChapFade = 'off';

      /* ---- the colours, from words to tokens ----
         CSS cannot build a name out of a word - there is no way to write
         "use whichever colour is called sun" - which is why the accent
         picker on <html> has to match a word instead. Here the list is
         read by code, so it can simply build the name. */
      var PALETTE = ['sun', 'fire', 'water', 'forest', 'stone', 'mist', 'moon'];
      var words = d.graphics;
      if (!Array.isArray(words) || !words.length) {
        /* NO LIST IS NOT AN ERROR. A chapter mark with no colours named
           uses the study's own two, so the slide has colours without
           anybody having chosen any - and it changes with the study. */
        words = null;
      }

      var picked = [];
      if (words) {
        words.forEach(function (w) {
          if (PALETTE.indexOf(w) > -1) { picked.push(w); return; }
          if (window.console && console.warn) {
            console.warn('[case study] chapter-name-graphics: "' + w +
              '" is not one of the seven colours (' + PALETTE.join(', ') +
              '), so it was left out of ' + key);
          }
        });
      }

      if (picked.length) {
        picked.forEach(function (w, i) {
          band.style.setProperty('--cs-chap-' + (i + 1), 'var(--cs-' + w + '-on-bg)');
          band.style.setProperty('--cs-chap-' + (i + 1) + '-vivid', 'var(--cs-' + w + ')');
        });
        band.style.setProperty('--cs-chap-n', picked.length);
        band.dataset.csChapColours = picked.join(' ');
      } else {
        /* NOTHING IS WRITTEN ONTO THE BAND WHEN THE SLIDE NAMES NOTHING,
           and that is deliberate.

           An inline style beats a stylesheet, so writing the accents on
           here would make it impossible to set the lights anywhere else -
           and you asked to be able to set the colours without touching
           content.js. Leaving the band silent lets the chain in
           cs-slides.css do the work instead: it asks for
           `--cs-chap-1-vivid` and falls back to the study's first accent,
           so putting that name in a stylesheet now actually decides the
           colour.

           The check is told what it is looking at all the same. */
        band.dataset.csChapColours = 'accent-1 accent-2';
      }

      /* ---- the name ----
         It is an <h2> like every other slide's heading, so the page still
         has one heading per slide for anybody reading it with their ears.
         What is different is only how it is painted. */
      /* ---- the sky ----
         IT CARRIES NO WORDS AND IS HIDDEN FROM SCREEN READERS, so the
         slide still has exactly one heading and nothing else to anybody
         reading the page with their ears. It is a picture, and it says so.

         IT IS BUILT FOR ALL THREE VERSIONS and shown in only one. That is
         what lets the version be chosen in a stylesheet: there is nothing
         to add or remove when you switch, only something to show. The cost
         is one empty div on two of the three, which paints nothing and
         measures nothing.

         It goes in BEFORE the heading so the heading paints over it
         without anything having to be lifted; the stacking order is in the
         CSS as well, because a fade sits between the two. */
      var sky = el('div', 'cs-chap-sky cs-chap-paint');
      sky.setAttribute('aria-hidden', 'true');
      band.appendChild(sky);

      var h = el('h2', 'cs-chap-title');
      /* THE PAINT GOES ON THE LETTERS ONLY IN THE INSIDE VARIANT. In the
         other one it is on the sky behind them and the letters are a flat
         fill, so putting it here too would paint the same clouds twice at
         two different scales. */
      if (variant === 'inside') h.className += ' cs-chap-paint';
      if (d.title === undefined || d.title === null || d.title === '') {
        h.className += ' cs-slot-waiting';
        h.textContent = 'title → ' + key;
        /* A WAITING TITLE IS NOT A WINDOW. There is nothing to read
           through the letters yet, and a message painted in drifting
           colour is a message nobody can read - so it is printed plainly
           until the real words arrive. */
        h.classList.add('cs-chap-title--plain');
      } else {
        h.innerHTML = d.title;
      }
      band.appendChild(h);

      return [band];
    },

    'strip-fancy-accordion': function (d) {
      var out = [];
      var key = copyKey(d);
      if (d.title !== null) out.push(title(d.title, { key: key, eyebrow: d.eyebrow }));

      var items = CS.fancyItems(d.accordions);
      var words = d.accordionWords || {};
      var base = d.slotBase || d.copy || '';

      /* A STACK WITH NO ACCORDIONS IN IT IS NEVER A DECISION, so it says
         what to write rather than drawing an empty panel - the same rule
         as the flow chart with no steps. */
      if (!items.length) {
        var note = el('div', 'cs-fancy-missing');
        note.appendChild(el('p', 'cs-meta cs-slot-waiting',
          'this slide has no accordions'));
        note.appendChild(el('p', 'cs-meta',
          'on its line in content.js, add  accordions: [ ‘first’, ‘second’ ]'));
        out.push(note);
        return out;
      }

      var stack = el('div', 'cs-fancy-stack');

      /* ---- WHICH KIND OF HEADER THIS STACK USES ----
         `headFill: false` on the slide's own line gives the plain header -
         the circle and the title and nothing behind them. Left out, the
         header carries a faint wash of the chapter's second colour.

         A study that wants one or the other everywhere sets it once in its
         own theme.css instead:  :root { --cs-fancy-fill: off; }
         The slide's own line always wins over that. */
      var fill = d.headFill;
      if (fill === undefined) {
        try {
          fill = String(getComputedStyle(document.documentElement)
                   .getPropertyValue('--cs-fancy-fill') || '')
                   .trim().replace(/^['"]|['"]$/g, '').toLowerCase() !== 'off';
        } catch (e) { fill = true; }
      }
      stack.dataset.csFancyFill = fill === false ? 'off' : 'on';

      /* ---- THE HEAD ROW: the square, and the line of writing beside it ----
         The sheet puts them side by side rather than stacked, so the note
         reads as a caption for the whole panel rather than as the first
         thing in it.

         Either half can be left out. `media: null` drops the square,
         `headNote: null` drops the writing, and with both gone there is no
         row at all. Leaving a key OUT is different from writing `null`:
         out means "not written yet" and says which block to go and fill,
         null means "there is deliberately none here". */
      var wantsArt = d.media !== null;
      var wantsNote = d.headNote !== null;
      if (wantsArt || wantsNote) {
        var headRow = el('div', 'cs-fancy-head-row');
        if (wantsArt) {
          var head = el('div', 'cs-fancy-head-art');
          head.appendChild(slot(d.media, 'cs-fancy-head-shot'));
          headRow.appendChild(head);
        }
        if (wantsNote) {
          if (d.headNote === undefined || d.headNote === '') {
            var waiting = el('div', 'cs-body cs-fancy-note');
            waiting.appendChild(el('p', 'cs-meta cs-slot-waiting',
              'headNote \u2192 ' + key));
            headRow.appendChild(waiting);
          } else {
            headRow.appendChild(body(d.headNote, 'cs-fancy-note'));
          }
        }
        stack.appendChild(headRow);
      }

      var list = el('div', 'cs-fancy-list');

      items.forEach(function (a, i) {
        var w = words[a.id] || {};

        var item = el('details', 'cs-fancy-item');
        item.dataset.csFancy = a.id;
        /* NO DRAWN EDGE ROUND THE ROW ANY MORE. It was there to outline a
           filled panel; with the fill moved to the header it was drawing
           a pen line around a paragraph, which on a row with no fill came
           out as four stray ticks hanging in the dark. The header's own
           wash is what gives a closed row its shape now. */
        /* THE FIRST ONE ARRIVES OPEN. A stack of closed bars tells a reader
           nothing about what is inside any of them; one already open shows
           the shape of the content without anybody having to press
           anything. Written into the markup rather than switched on by
           script, so it is true before a single line of JavaScript runs. */
        if (i === 0) item.open = true;

        var summary = el('summary', 'cs-fancy-head');

        /* THE MARK IS DRAWN, NOT TYPED. Two bars in a circle: the upright
           one turns and fades as the panel opens, so a + becomes a − by
           moving rather than by being swapped for a different character.
           No glyph means no font to be missing and nothing to read out
           loud to somebody who cannot see it - hence aria-hidden. */
        var mark = el('span', 'cs-fancy-mark');
        mark.setAttribute('aria-hidden', 'true');
        mark.appendChild(el('span', 'cs-fancy-bar cs-fancy-bar--h'));
        mark.appendChild(el('span', 'cs-fancy-bar cs-fancy-bar--v'));
        summary.appendChild(mark);

        var label = el('span', 'cs-fancy-label');
        if (w.label === undefined || w.label === null || w.label === '') {
          label.className += ' cs-slot-waiting';
          label.textContent = 'accordionWords → ' + key + ' → ' + a.id + '.label';
        } else {
          label.textContent = w.label;
        }
        summary.appendChild(label);
        item.appendChild(summary);

        /* THE PANEL THAT OPENS, in two boxes rather than one. The outer one
           is a grid whose single row goes from 0fr to 1fr, which is what
           animates; the inner one holds the writing and is what gets
           clipped while that happens. One box cannot do both jobs - a box
           animating its own height cannot also be the box that decides what
           that height is. */
        var reveal = el('div', 'cs-fancy-reveal');
        var inner = el('div', 'cs-fancy-inner');

        var shot = 0;
        var ctx = { nextImage: function () {
          return CS.fancySlot(base, a.id, shot++);
        } };

        if (w.body === undefined || w.body === null || w.body === '') {
          inner.appendChild(el('p', 'cs-meta cs-slot-waiting',
            'accordionWords → ' + key + ' → ' + a.id + '.body'));
        } else {
          inner.appendChild(body(w.body, 'cs-fancy-body', null, ctx));
        }

        reveal.appendChild(inner);
        item.appendChild(reveal);
        list.appendChild(item);
      });

      stack.appendChild(list);
      out.push(stack);
      return out;
    },

    'strip-transition': function (d) {
      var out = [];

      function half(side, data, dateFirst) {
        var box = el('div', 'cs-handover cs-handover--' + side);
        var date = data && data.date
          ? el('p', 'cs-handover-date', data.date) : null;
        var name = data && data.name
          ? el('p', 'cs-handover-name', data.name) : null;
        /* the dates sit outside, the names hug the rule */
        (dateFirst ? [date, name] : [name, date]).forEach(function (n) {
          if (n) box.appendChild(n);
        });
        return box;
      }

      /* BOTH HALVES ARE ALWAYS BUILT, even an empty one. The rule is held
         halfway down by the two rows either side of it being equal, and a
         row that is not there is not equal to anything - leave one out and
         the rule slides to whichever end still has weight. */
      out.push(half('from', d.from, true));
      out.push(el('div', 'cs-handover-rule'));
      out.push(half('to', d.to, false));

      if (!d.from && !d.to) {
        var note = el('div', 'cs-handover-missing');
        note.appendChild(el('p', 'cs-meta cs-slot-waiting',
          'this transition has no use cases on either side of it'));
        note.appendChild(el('p', 'cs-meta',
          'in ' + copyKey(d) + ', add  from: { date, name }  and  to: { date, name }'));
        out.push(note);
      }

      return out;
    },

    /* #10.3 — the way back. A strip at the very end of a case study: one
       drawing, and the whole thing is the control. Pressing anywhere on it
       returns the reader to the worlds, landing on the planet the case
       studies belong to rather than at the top of the page.

       It is an <a>, not a strip with a button somewhere inside it, for two
       reasons: the whole band is the target, which is the easiest thing in
       the world to hit; and it goes somewhere, so it should behave like
       every other link - open in a new tab on a middle click, show its
       destination in the status bar, be reachable by keyboard without
       anything being wired up. */
    'strip-back': function (d) {
      var a = el('a', 'cs-strip-back');
      a.href = d.href || '../../index.html#hw-world-work';
      a.setAttribute('aria-label', d.label || 'Back to the worlds');
      a.appendChild(slot(d.media));
      /* THE WORDS ARE OPTIONAL. `text: ''` in copy.js leaves the drawing to
         be the whole of it, which is what slide 30 does now - the picture is
         the door back and does not need a caption telling you so.

         An empty string had to be made to mean "nothing" rather than falling
         through to the default, so this tests for a value rather than using
         `||`. The link still carries its aria-label, so a screen reader is
         told where it goes even with no words on screen. */
      if (d.text) {
        var lab = el('span', 'cs-strip-back-label');
        lab.innerHTML = d.text +
          ' <span class="cs-strip-back-arrow" aria-hidden="true">&rarr;</span>';
        a.appendChild(lab);
      }
      return [a];
    },

    /* #6 — the interactive persona slide. Built empty here; cs-carousels.js
       fills it from the study's people. */
    'persona': function (d) {
      var carousel = el('div', 'cs-persona-carousel');
      carousel.appendChild(arrowButton('prev', 'Previous person', 'cs-persona-step cs-persona-step--prev'));
      var stageEl = el('div', 'cs-persona-stage');
      stageEl.appendChild(el('p', 'cs-persona-name'));
      carousel.appendChild(stageEl);
      carousel.appendChild(arrowButton('next', 'Next person', 'cs-persona-step cs-persona-step--next'));
      /* THE COUNTER SITS UNDER THE PICTURE, not under the whole left half -
         the sheet draws it exactly as wide as the image. So it goes inside
         the stage rather than spanning all three columns.

         The two arrows are BUILT but not SHOWN on a desktop: see the note by
         `.cs-pager > .cs-arrow` in cs-components.css. They are the only way
         through on a phone, where the side strips have no room, so they are
         made here either way and the stylesheet decides. */
      var pager = el('div', 'cs-pager cs-pager--persona');
      pager.appendChild(arrowButton('prev', 'Previous person'));
      pager.appendChild(el('span', 'cs-pager-label', '1 / 1'));
      pager.appendChild(arrowButton('next', 'Next person'));
      stageEl.appendChild(pager);

      /* ---- THE EXPLAINS PANEL ----

         What used to be a row of tabs and one panel of writing at a time is
         now a single surface holding all three sections at once, scrolled
         rather than clicked through. Naming the sections after the tabs is
         what made the tabs redundant: if the heading already says "Jobs to
         be done", a button that also says it is saying it twice.

         The sections themselves are built in cs-carousels.js, because what
         is in them changes with the person. This is only the box. */
      var explains = explainsBox('About this person');

      /* The slide's question runs along the top, full width, above both
         halves - the sheet of 6 October draws it as its own band. It was not
         drawn at all before, so the copy in slide-03 had nowhere to go. */
      return [title(d.title || '', { slot: 'cs-persona-head' }), carousel, explains];
    },

    /* #7 — the app logo slide */
    'logo': function (d) {
      var out = [el('div', 'cs-logo-flow')];
      out[0].setAttribute('aria-hidden', 'true');
      (d.tiles || ['START tile', 'AUTH tile']).forEach(function (t, i) {
        var tile = el('p', 'cs-flow-tile cs-flow-tile--' + (i === 0 ? 'start' : 'auth'), t);
        tile.setAttribute('data-cs-stroke', '28');
        out.push(tile);
      });
      var row = el('div', 'cs-logo-row');
      row.appendChild(arrowButton('prev', 'Previous app', 'cs-logo-step--prev'));
      var box = slot(d.media, 'cs-logo-box');
      box.setAttribute('data-cs-stroke', '48');
      row.appendChild(box);
      row.appendChild(arrowButton('next', 'Next app', 'cs-logo-step--next'));
      out.push(row);
      return out;
    },

    /* #8 — the wireframe slide. Empty; cs-carousels.js fills it.

       A case study can have more than one of these, so each names the set of
       workflows it shows. `flows: 'ideation'` picks the set called ideation
       out of `workflowSets` in content.js; saying nothing picks the study's
       plain `workflows` list. The name is written onto the tab panel, which
       is where cs-carousels.js looks for it. */
    'wireframe': function (d) {
      return wireframeSlide(d, controlPanel(true));
    },

    /* #3.5 — the same carousel, with a section title where the tab panel
       would be. Use it where the slide shows ONE set of screens: a row of a
       single tab says less than a heading does. */
    'title-wireframe': function (d) {
      return wireframeSlide(d, title((d && d.title) || '', { eyebrow: d && d.eyebrow }));
    },

    /* #11 — NEW. A switchable diagram on the left, a section on the right.

       WHY THIS IS NOT ONE OF THE EXISTING TEMPLATES

       The spec sheet for this slide asks for two things at once that no
       existing template puts together: the tab-and-stage mechanism of the
       backend slide (#9), which is full-width, and the writing column of the
       context templates (#2.x), which have a still picture on the left. It
       is #9 squeezed into seven columns with #2.2's section beside it.

       Rather than bolt a right-hand column onto #9 and have every other
       backend slide inherit it, this is its own template. It reuses #9's
       PARTS - the same tab panel, the same diagram stage, the same caption -
       so cs-carousels.js fills it with the same code, and the study names
       its pair of diagrams the same way it names a set of wireframes. */
    'toggle-figure-section': function (d) {
      var panel = el('div', 'cs-control-panel');
      var tabs = el('div', 'cs-tab-panel');
      tabs.setAttribute('role', 'tablist');
      tabs.setAttribute('aria-label', d.tabsLabel || 'Diagrams');
      panel.appendChild(tabs);

      var stageEl = el('div', 'cs-diagram-stage');
      /* which set of diagrams this slide shows; empty means the study's
         plain `diagrams` list, exactly as with wireframe sets */
      stageEl.dataset.csDiagrams = d.diagrams || '';

      return [
        panel,
        stageEl,
        caption(d.caption || ''),
        title(d.title, { eyebrow: d.eyebrow, key: copyKey(d) }),
        body(d.body, 'cs-sec-1-body')
      ];
    },

    /* ====================================================================
       THE THREE TEMPLATES THE 6 OCTOBER STRUCTURE ASKED FOR
       ================================================================== */

    /* #12 — a band holding two pictures side by side, then a section.

       The structure sheet opens the second slide with a small square and a
       wide box sitting together in one container, and a heading and a
       paragraph underneath. The two pictures belong together - they are one
       statement across the top of the slide - so they share a band rather
       than being two slots that happen to be next to each other. */
    'pair-section': function (d) {
      var band = el('div', 'cs-pair');
      band.appendChild(slot(d.media, 'cs-pair-small'));

      /* THE WIDE HALF IS THE SURFACE COMPONENT, nothing more.

         It used to be written out here, which meant it existed on this one
         template and nowhere else. It is now built by surface() above, so
         the same panel can be dropped into any slide - and this template
         simply asks for one.

         `drawer` is what decides which of its two states this is. Leave it
         out of slide 2 in content.js and the band's wide half becomes a
         plain surface with no invitation on it. */
      var door = surface({
        kind: 'surface',
        title:  d.doorTitle,
        body:   d.doorBody,
        drawer: d.drawer,
        action: d.doorAction
      });
      door.classList.add('cs-surface--fill');
      band.appendChild(door);

      return [
        band,
        title(d.title, { eyebrow: d.eyebrow, key: copyKey(d) }),
        body(d.body, 'cs-sec-1-body')
      ];
    },

    /* #13 — a heading, a question, and a run of diagrams you step through.

       It is the wireframe carousel with one row added: the QUESTION the
       diagram under it answers. The question changes with the diagram, so it
       is written per step in copy.js (under the picture's own name, like any
       other caption) and the band below the picture counts where you are. */
    'title-steps': function (d) {
      var head = el('div', 'cs-steps-head');
      head.appendChild(title(d.title, { eyebrow: d.eyebrow, key: copyKey(d) }));
      var q = el('p', 'cs-steps-question');
      q.setAttribute('data-cs-question', '');
      head.appendChild(q);
      return wireframeSlide(d, head);
    },

    /* #14 — a heading and a grid of numbered findings.

       Four of them on the sheet, two by two, each a number and a short
       piece of writing. The number is not decoration: these are the things
       that did not work, or the enhancements that followed, and a reader
       refers to them by number. Any count works - they lay themselves out. */
    'numbered-grid': function (d) {
      /* WHICH MARK THIS SLIDE USES. See the note on MARK_TEXT above for the
         whole list. An unknown word falls back to numbers rather than
         drawing nothing - a typo should cost you the mark you wanted, not
         every mark on the slide. */
      var marks = (d.marks && (MARK_TEXT[d.marks] || d.marks === 'bullets'
                               || d.marks === 'none')) ? d.marks : 'numbers';

      var ul = el(MARK_ORDERED[marks] ? 'ol' : 'ul',
                  'cs-numbered cs-numbered--' + marks);

      (d.items || []).forEach(function (item, i) {
        var li = el('li', 'cs-numbered-item');
        li.setAttribute('data-cs-stroke', '24');

        /* THE CARD HAS THE LAST WORD ON ITS OWN MARK, in this order: a
           drawing it names, then any text it types, then whatever the slide
           said. So one card in a lettered grid can carry a little icon, and
           the other five stay B, C, D, E, F. */
        if (item && item.icon) {
          li.appendChild(slot(item.icon, 'cs-numbered-icon'));
        } else if (item && item.n) {
          li.appendChild(el('span', 'cs-numbered-mark', item.n));
        } else if (marks === 'bullets') {
          /* A DRAWN DOT, NOT A TYPED ONE. A "\u2022" is a character, so its
             size and its weight are whatever the font felt like; this one is
             set in the same units as the writing beside it and looks the
             same in every face. */
          var dot = el('span', 'cs-numbered-mark cs-numbered-dot');
          dot.setAttribute('aria-hidden', 'true');
          li.appendChild(dot);
        } else if (marks !== 'none') {
          li.appendChild(el('span', 'cs-numbered-mark', MARK_TEXT[marks](i)));
        }
        /* A CARD'S WRITING IS A BODY LIKE ANY OTHER BODY ON THE SITE.

           It used to make plain paragraphs and nothing else, so a card
           could hold sentences and only sentences. Ask it for a list and
           you got the word [object Object] - the card had no idea what you
           had handed it.

           It now goes through the same `body()` every other slide uses, so
           everything the rest of the site can write, a card can write:

               items: [
                 { body: [
                     `A sentence to open with.`,
                     { kind: 'points', items: [
                       `the first point`,
                       `the second point` ] }
                 ] }
               ]

           A plain string still works exactly as before - `{ body: 'one
           line' }`, or even the bare string on its own - because a body of
           one paragraph is what it always was. Nothing written already has
           to change. */

        /* A CARD CAN NOW BE BROKEN INTO SECTIONS.

           A body is one continuous piece of writing. Some cards are not:
           they hold two or three separate little things - what happened,
           what we did about it, what it cost - and a reader needs to see
           where one ends and the next begins.

           `sections` is that, and it is written in the SAME WORDS the rest
           of the site already uses for a section - `heading` and `body` -
           so there is one vocabulary to learn rather than two:

               items: [
                 { n: '01',
                   sections: [
                     { heading: `What we saw`,
                       body: `One short paragraph.` },
                     { heading: `What we changed`,
                       body: [{ kind: 'points', items: [
                         `the first point`,
                         `the second point` ] }] }
                   ] }
               ]

           A SECTION'S BODY IS A FULL BODY. Anything a body can hold -
           paragraphs, points, a quote, a drawing - a section can hold,
           because it goes through the very same `body()`.

           `body` AND `sections` TOGETHER are allowed and mean what they
           look like: the body is an opening line, before the first
           heading. Either on its own is fine too.

           NOTHING ALREADY WRITTEN CHANGES. A card with no `sections` takes
           the old path below, untouched. */
        var secs = item && item.sections;

        if (secs && secs.length) {
          var col = el('div', 'cs-numbered-secs');

          if (item.body !== undefined && item.body !== '') {
            col.appendChild(body(item.body, '', 'cs-numbered-text'));
          }

          secs.forEach(function (sec) {
            if (!sec) return;
            var box = el('section', 'cs-numbered-sec');

            /* THE SAME SUB-HEADING THE WHOLE SITE USES (`.cs-body-heading`),
               so a heading inside a card and a heading part-way down a slide
               are one thing rather than two that nearly match. The card only
               takes its centring away, further down in the CSS - a card is
               left-aligned and so is everything in it. */
            if (sec.heading) {
              box.appendChild(el('h3', 'cs-body-heading', sec.heading));
            }

            if (sec.body !== undefined && sec.body !== '') {
              box.appendChild(body(sec.body, '',
                                   'cs-numbered-text cs-numbered-sec-body'));
            }

            /* A HEADING WITH NOTHING UNDER IT STILL GOES IN, because the
               author asked for it; an entirely empty section does not,
               because nobody asked for a gap. */
            if (box.childNodes.length) col.appendChild(box);
          });

          li.appendChild(col);
        } else {
          var text = body(item.body !== undefined ? item.body : item,
                          'cs-numbered-text');
          li.appendChild(text);
        }

        ul.appendChild(li);
      });
      return [title(d.title, { eyebrow: d.eyebrow, key: copyKey(d) }), ul];
    },

    /* =====================================================================
       THE SHAPES CASE STUDY 2 ADDED
       =====================================================================
       Five layouts, none of which existed before. Every one of them is open
       to any case study: a template belongs to the engine, not to the study
       that happened to need it first. */

    /* #15 — A HEADING ACROSS THE TOP, A DRAWING ON THE LEFT, WRITING ON THE
       RIGHT. The commonest slide in case study 2's deck: a question as the
       heading and the answer beside the evidence for it.

       It is NOT `context-1` with the rows moved about. There the heading
       sits in the writing column, beside the drawing; here it spans the
       whole slide, which is what makes a run of these read as a sequence of
       questions rather than a sequence of pictures. */
    'title-split': function (d) {
      return [
        title(d.title, { eyebrow: d.eyebrow, key: copyKey(d) }),
        slot(d.media, 'cs-split-figure'),
        body(d.body, 'cs-sec-1-body')
      ];
    },

    /* #16 — THE PAIR BAND, THEN A HEADING, THEN A DRAWING AND WRITING SIDE
       BY SIDE. Slide 2 of case study 2.

       It is `pair-section` with one row added, and it is built by CALLING
       pair-section rather than by copying it, so the band and its surface
       can only ever behave one way. The only new piece is `media2`: the
       drawing that goes beside the writing underneath. */
    'pair-split': function (d) {
      var parts = T['pair-section'](d);      /* band, heading, writing */
      parts.splice(2, 0, slot(d.media2, 'cs-split-figure'));
      return parts;
    },

    /* #17 — A SLIDE STRIP LED BY A THIN DRAWN BAND.

       The chapter headings in case study 2: a long low drawing across the
       top, the chapter name under it, and - on the one that needs it - a
       line of subtext below that. The band is a picture slot like any
       other, so a chapter with no drawing yet shows a labelled empty band
       rather than a gap. */
    'rule-title': function (d) {
      /* THE BAND IS OPTIONAL. Write `media: null` and the slide is the
         heading alone - which is what slide 7 of case study 2 is, a
         statement standing on the page with nothing drawn above it. Leaving
         `media` out ALTOGETHER is different and still asks for a band: it
         means "I have not named the drawing yet", and the empty box says
         which one it is waiting for. One is a decision, the other is a
         to-do, and they should not look the same. */
      var out = [];
      if (d.media !== null) out.push(slot(d.media, 'cs-rule-slot'));
      out.push(title(d.title, { eyebrow: d.eyebrow, key: copyKey(d) }));
      if (d.subtitle) out.push(el('p', 'cs-strip-sub', d.subtitle));
      /* AND IT CAN CARRY A FULL BODY, not only a line of subtext. Slide 6
         of case study 2 is this: the band across the top, the heading under
         it, and the problem statements under that. A chapter heading simply
         writes no `body` and is unchanged. */
      if (d.body) out.push(body(d.body, 'cs-sec-1-body'));
      return out;
    },

    /* #18 — A HEADING, WRITING, AND A THIN DRAWN BAND CLOSING THE SLIDE.
       The same band as #17, at the other end. Used where the writing is the
       slide and the drawing is a flourish under it. */
    'title-body-rule': function (d) {
      return [
        title(d.title, { eyebrow: d.eyebrow, key: copyKey(d) }),
        body(d.body, 'cs-sec-1-body'),
        slot(d.media, 'cs-rule-slot')
      ];
    },

    /* #19 — THE IDEATION SLIDE: a heading, a big drawing, the explains panel
       beside it, and a verdict card under the panel.

       THE EXPLAINS PANEL is the people slide's panel, shared (see
       explainsBox above). Its sections are written in copy.js under this
       slide, exactly as a person's are written under theirs.

       WHO IT IS FOR SITS AT THE HEAD OF IT - a row of small square
       drawings, one per user group, with a line of writing beside them.
       See explainsHead above for the two numbers that decide how many.

       UNDER THE PANEL, TWO CARDS: how much this idea would do, and how
       easily it could be done. `impact` and `feasibility` on this slide's
       own line, one of five ratings each. See ratingCard above.

       A section still marked `picture: true` in copy.js is DROPPED WHOLE
       rather than drawn empty, because its drawing has moved up rather than
       gone missing. Those entries can come out of copy.js whenever it is
       next open; nothing waits on them.

       THE VERDICT CARD - a drawing saying what became of the idea - used to
       sit where the two rating cards sit now, and the sheet of 26 October
       replaced it. It still works for a slide that names a `verdict` and no
       ratings:

           verdict: 'taken-forward'      ->  slot  verdict_taken-forward

       so nothing was thrown away; it is simply not what these four slides
       do any more. */
    /* THE USE-CASE SLIDE. It was called the idea slide until the sheet of
       27 October renamed it, and `title-explains` still works as a name for
       it - see `aliases` at the foot of this file - so nothing written
       before that date has to be touched. */
    'use-case': function (d) {
      var panel = explainsBox(d.panelLabel || 'About this idea');
      /* THE SECTIONS ARE PAINTED FIRST and the head put in front of them
         afterwards, because painting EMPTIES the panel - it has to, since
         the people's slide repaints it for each person. Appending the head
         first simply had it wiped a line later, with nothing to show for
         it and nothing in the console to say why. */
      explainsPaint(panel.scroller, d.sections, function (sec) {
        /* the drawings are at the head now, so a picture section has nothing
           of its own to show and is dropped - unless it names a DIFFERENT
           drawing, which is a deliberate second picture and is drawn. */
        return sec.media ? slot(sec.media, 'cs-persona-sec-figure') : null;
      });

      /* WHO IT IS FOR, at the top of the panel. `media2` is still read, so a
         slide written before user groups existed shows its one drawing. */
      var groups = groupsFor(d);
      var faces = groups.length ? groups.map(function (g) { return g.media; })
                : (d.media2 ? [d.media2] : []);
      if (faces.length) {
        panel.scroller.insertBefore(
          explainsHead(faces, d.groupsCaption || d.caption2,
                       'groupsCaption \u2192 ' + copyKey(d)),
          panel.scroller.firstChild);
      }

      /* THE DRAWING, OR A RUN OF THEM.

         ONE NUMBER DECIDES, on the slide's own line in content.js:

             views: 1   or nothing     one still drawing
             views: 5                  five, with click areas and a counter

         and the drawings are named from that number - slide-11_img-01 up
         to slide-11_img-05 - so the count and the names cannot disagree.
         See CS.viewSlots in cs-content.js.

         `flows` still works, for a slide that wants to share a set of
         diagrams written out by hand in `workflowSets` the way slides 4, 8
         and 9 do. It wins if both are given.

         THE PANEL AND THE CARDS DO NOT MOVE WHEN YOU STEP. They belong to
         the IDEA; the diagrams are views of it. Two independent things
         sharing a slide, which is why the carousel is built here and the
         panel above knows nothing about it. */
      var views = d.views > 1 ? d.views : 0;
      var left;
      if (d.flows || views) {
        left = el('div', 'cs-uc-carousel');
        left.appendChild(arrowButton('prev', 'Previous diagram', 'cs-step cs-step--prev'));
        var stepStage = wireStage();
        stepStage.dataset.csFlows = d.flows || '';
        if (!d.flows) {
          /* the carousel works the names out for itself from these two */
          stepStage.dataset.csViews = views;
          stepStage.dataset.csBase = d.slotBase || d.copy || '';
        }

        /* THE NAME OF THE DRAWING YOU ARE LOOKING AT, from the sheet of
           29 October. It sits between the drawing and the counter and it
           changes as you step, because it belongs to the DRAWING and not
           to the slide - the slide's own title is the band at the top.

               viewTitles: ['The empty state', 'Picking a case', ... ]

           one for each view, in copy.js under the slide's key. They travel
           to the carousel on the element itself rather than in an
           attribute, for the same reason the feedback slide's tabs do:
           they are a list, and an attribute is a string. */
        stepStage.csViewTitles = d.viewTitles || [];
        stepStage.dataset.csTitlesKey = copyKey(d);

        /* BUILT EMPTY and filled per step by cs-carousels.js. It takes the
           ordinary `cs-caption` class, which is what that file looks for,
           plus one of its own for the dress the sheet asks for - the drawn
           face, centred, above the counter. */
        stepStage.insertBefore(el('p', 'cs-caption cs-uc-view-title'),
                               stepStage.querySelector('.cs-pager'));

        left.appendChild(stepStage);
        left.appendChild(arrowButton('next', 'Next diagram', 'cs-step cs-step--next'));
      } else {
        /* one drawing: `media` if the line names one, otherwise the first
           of the same numbered series, so the naming rule holds either way */
        left = slot(d.media ||
                    CS.viewSlots(d.slotBase || d.copy || '', 1)[0],
                    'cs-explains-figure');
      }

      /* ===================================================================
         THE PANEL AND ITS RAIL - the sheet of 27 October
         ===================================================================

         The panel can be PUT AWAY. A narrow upright strip stands against
         its outer edge, and pressing anywhere on that strip slides the
         panel out of sight and lets the drawing have the whole slide.
         Pressing it again brings the panel back.

         THREE BOXES, and each one is doing a job that cannot be given to
         either of the others:

             .cs-uc-aside    holds the two side by side
             .cs-uc-panel    the window the panel slides behind. THIS is
                             what narrows to nothing; it clips rather than
                             squashes, so the writing inside keeps its line
                             breaks the whole way and the panel looks like
                             it is leaving rather than being crushed.
             .cs-uc-rail     the strip. It is a real <button>, so the
                             keyboard reaches it, a screen reader is told
                             what it does, and it says out loud whether the
                             panel is currently open.

         THE WHOLE STRIP IS THE TARGET, not the little mark on it - the
         sheet asks for that, and it is the right call anyway: a tall thin
         target is easy to hit without looking, which a 24-unit icon is
         not. The mark inside is drawn by CSS and flips with the state. */
      var aside  = el('div', 'cs-uc-aside');
      var window_ = el('div', 'cs-uc-panel');
      window_.appendChild(panel);

      var rail = el('button', 'cs-uc-rail');
      rail.type = 'button';
      rail.setAttribute('aria-expanded', 'true');
      /* The button CONTROLS the panel, so it has to name it - that is the
         whole of what makes this announce properly rather than as a bare
         "button". The id is per slide, because there are four of these. */
      var panelId = 'cs-uc-panel-' + (d.copy || Math.random().toString(36).slice(2, 8));
      panel.id = panelId;
      rail.setAttribute('aria-controls', panelId);
      rail.setAttribute('aria-label', d.panelLabel || 'About this use case');
      rail.appendChild(el('span', 'cs-uc-rail-mark'));
      /* the words a screen reader reads, which change with the state */
      var says = el('span', 'cs-uc-rail-says');
      says.textContent = 'Hide';
      rail.appendChild(says);

      aside.appendChild(window_);
      aside.appendChild(rail);

      var out = [
        title(d.title, { eyebrow: d.eyebrow, key: copyKey(d) }),
        left,
        aside
      ];

      /* THE TWO CARDS, or the older single verdict drawing if that is what
         this slide names. Never both: they want the same corner.

         ONE SWITCH TURNS THE CARDS OFF FOR THE WHOLE STUDY -
         `showRatings: false` under `meta` in content.js. The ratings stay
         written on every slide's own line, so turning them back on is the
         same one word and nothing has to be retyped. See `showRatings`
         there for the reasoning. */
      if (ratingsShown(d)) {
        /* IT LIVES INSIDE THE DETAILS PANEL NOW, pinned to the bottom of
           it, which is what the sheet of 29 October draws. It used to be a
           separate row sitting UNDER the panel, and that was a different
           thing: two boxes, so the reader had to work out that the second
           belonged to the first. One box with a strip pinned at its foot
           says it on its own.

           PINNED means the writing above it scrolls and this does not.
           See `.cs-uc-assess` in cs-slides.css - the panel is a column, the
           writing takes what is left, and this sits at the end of it.

           A SLIDE WITH NO RATINGS WRITTEN still gets the strip, with a dash
           in each card. That is deliberate: the strip is part of the shape
           of this slide, so a missing value should read as "not rated yet"
           rather than making the panel a different shape from its
           neighbours. Write them on the slide's own line in content.js:

               impact: 'high', feasibility: 'medium'  */
        var cards = el('div', 'cs-ratings cs-uc-assess');
        /* `impact: false` or `feasibility: false` drops that ONE card and
           leaves the other. The strip then holds one card and says so by
           being half as wide, rather than pretending the missing one is
           simply unanswered. */
        if (d.impact !== false) {
          cards.appendChild(ratingCard('impact', 'Impact', d.impact));
        }
        if (d.feasibility !== false) {
          cards.appendChild(ratingCard('feasibility', 'Feasibility', d.feasibility));
        }
        cards.dataset.csCount = cards.children.length;
        panel.appendChild(cards);
      } else if (d.verdict) {
        out.push(slot('verdict_' + d.verdict, 'cs-verdict-card'));
      }
      return out;
    },

    /* =====================================================================
       #24 placeholder — A SLIDE WHOSE SHAPE IS NOT DECIDED YET
       =====================================================================
       A slide that says, on the page, that it is a slide and that nothing
       has been settled about it. It exists so a running order can be put in
       place before every slide in it has been designed.

       It is DELIBERATELY PLAIN. A placeholder that looks finished is a trap:
       it gets left in, and three weeks later nobody can tell which slides
       were decided and which were scaffolding. This one cannot be mistaken
       for anything.

           { template: 'placeholder', title: 'Tab 1 · slide 01',
             note: 'structure to come' }

       `title` is what it calls itself; `note` is the line under it and
       defaults to saying it is waiting. Replace the whole line with a real
       template when the structure arrives - there is nothing here to
       migrate. */
    /* =====================================================================
       #19 flow-chart — A DIAGRAM OF STEPS, AND A PICTURE OF EACH
       =====================================================================
       Rebuilt 5 November from "Updated Flow Chart Template (with image
       carousel)". The first version drew a LINE of steps; this one draws a
       DIAGRAM, which is a different thing in four ways:

           it can loop back on itself
           a step can lead to more than one other step
           every join has a direction, and shows it
           a step can be a COLLECTIVE - a box of smaller steps

       and underneath, a fifth: a step can have one picture or a CAROUSEL
       of them, with the click areas, the title and the counter that every
       other carousel on this site has.

       WHAT MADE ALL FOUR POSSIBLE IS ONE CHANGE: the joins are written
       down now instead of being inferred from the reading order. A line
       can be read off an order because there is only one thing a step can
       join. A diagram cannot. See the long note on CS.flowPlan in
       cs-content.js, and the router in cs-flowchart.js for how a join is
       drawn.

       =====================================================================
       WHAT TO WRITE
       =====================================================================

           content.js
             { template: 'flow-chart', copy: 'slide-07',
               steps: [
                 [ 'intake', 'triage', 'draft', 'review', 'approve', 'publish' ],
                 [ null, 'archive', null, 'rework',
                   { id: 'checks', collective: [ 'legal', 'risk', 'credit' ] } ],
                 [ null, null, null, 'reject' ]
               ],
               links: [
                 [ 'publish', 'rework' ],
                 { from: 'publish', to: 'checks', out: 'right' },
                 [ 'checks', 'rework' ],
                 [ 'checks', 'reject' ],
                 [ 'rework', 'reject' ],
                 [ 'rework', 'archive' ],
                 [ 'archive', 'intake' ]
               ] }

           copy.js
             'slide-07': {
               title: `How a case gets opened`,
               stepWords: {
                 intake: { label: `Request`, title: `The empty queue` },
                 checks: { label: `Checks` },
                 legal:  { label: `Legal`,  title: `The legal review` }
               }
             }

       A CAROUSEL is a count on the step, in content.js, beside the step
       rather than in its words - it is a fact about how many drawings
       there are, which is the same kind of fact as `views:` on every other
       stepped thing here:

           { id: 'draft', shots: 3 }

       and the three drawings are then `…_draft_img-01`, `-02`, `-03`. A
       step with no count keeps the single `…_draft_img` it already had, so
       nothing has to be renamed to upgrade the rest of the slide.

       ONE ROW IS STILL A ROW. `steps: [ 'a', 'b', 'c' ]` works exactly as
       it did, joins itself up left to right, and needs no `links`.

       =====================================================================
       WHY `steps` IS IN content.js AND `stepWords` IS IN copy.js
       =====================================================================
       The same name in both files would collide in fill(), and the loser
       would vanish with nothing said. Shape in one file, words in the
       other, and the two can never fight. */
    'flow-chart': function (d) {
      var out = [];
      var key = copyKey(d);
      if (d.title !== null) out.push(title(d.title, { key: key, eyebrow: d.eyebrow }));

      var plan = CS.flowPlan(d.steps, d.links);
      var steps = CS.flowSteps(d.steps);

      /* A FLOW WITH NO STEPS IS NEVER A DECISION, so it says what to write
         rather than drawing an empty diagram - the same rule as the
         prototype slide with no prototype named. */
      if (!steps.length) {
        var note = el('div', 'cs-flow-missing');
        note.appendChild(el('p', 'cs-meta cs-slot-waiting', 'this flow chart has no steps'));
        note.appendChild(el('p', 'cs-meta',
          'on its line in content.js, add  steps: [ ‘step-1’, ‘step-2’ ]'));
        out.push(note);
        return out;
      }

      var words = d.stepWords || {};
      var base = d.slotBase || d.copy || '';

      /* NO DRAWN FRAME AROUND THE DIAGRAM. The sheet shows it floating on
         the slide, and the picture below it already has an outline - two
         boxes stacked is one box too many. */
      var chart = el('div', 'cs-flow-chart');

      var rail = el('div', 'cs-flow-rail');
      rail.style.setProperty('--cs-flow-cols', plan.cols);
      rail.style.setProperty('--cs-flow-rows', plan.rows);
      rail.style.setProperty('--cs-flow-seqs', plan.count);
      rail.style.setProperty('--cs-flow-depth', plan.depth);

      /* The lines between the steps are an SVG laid under them and drawn
         once everything has been measured. It carries no path yet: a path
         typed in here would be a guess at where things landed, and the
         sheet is explicit that a line's length is whatever it takes to
         reach. */
      var line = el('div', 'cs-flow-line');
      line.innerHTML = '<svg aria-hidden="true" focusable="false"></svg>';
      rail.appendChild(line);

      /* WHICH JOINS THERE ARE, handed to the drawing module through the
         element rather than through a second call to the planner. Two
         calls would be two chances to disagree. */
      rail.csLinks = plan.links;

      /* ---- one pressable step, wherever it lives ---- */
      function stepButton(n, cls) {
        var w = words[n.id] || {};
        var btn = el('button', 'cs-flow-step' + (cls ? ' ' + cls : ''));
        btn.type = 'button';
        btn.dataset.csRow = n.row;
        btn.dataset.csSeq = n.seq;
        btn.dataset.csDepth = n.depth;
        btn.dataset.csStep = n.id;
        btn.dataset.csShots = n.shots || 1;
        btn.dataset.csSlots = CS.flowShots(base, n.id, n.shots).join(' ');
        btn.setAttribute('role', 'tab');
        btn.setAttribute('aria-selected', 'false');
        btn.tabIndex = -1;

        btn.appendChild(el('span', 'cs-flow-dot'));

        var label = n.label !== undefined ? n.label : w.label;
        var text = el('span', 'cs-flow-label');
        if (label === undefined || label === null || label === '') {
          /* A WAITING LABEL HAS TO FIT UNDER ITS OWN DOT. Everywhere else
             an empty thing prints the whole key it is waiting for; a label
             has the width of one step and nothing more, and two missing
             ones in a row printed the full path twice and shouldered the
             dots out of true. So the dot shows the short form, which still
             names the key, and the full path is on the hover. */
          text.className += ' cs-slot-waiting';
          text.textContent = n.id + '.label';
          btn.title = 'stepWords → ' + key + ' → ' + n.id + '.label';
          if (window.console && console.warn) {
            console.warn('[case study] stepWords → ' + key + ' → ' +
                         n.id + '.label is not written yet');
          }
        } else {
          text.textContent = label;
        }
        btn.appendChild(text);
        return btn;
      }

      plan.nodes.forEach(function (n) {
        if (n.kind === 'fork') return;          /* legacy: drawn, not placed */

        if (n.kind === 'separator') {
          var sep = el('div', 'cs-flow-sep');
          sep.style.setProperty('--cs-flow-col', n.col + 1);
          sep.style.setProperty('--cs-flow-row', n.row + 1);
          sep.style.setProperty('--cs-flow-seq', n.seq);
          sep.style.setProperty('--cs-flow-depth', n.depth);
          sep.setAttribute('role', 'separator');
          if (n.label) sep.appendChild(el('span', 'cs-meta cs-flow-sep-label', n.label));
          rail.appendChild(sep);
          return;
        }

        /* ---- A COLLECTIVE ----
           A box with a name above it and smaller steps stacked inside. The
           BOX IS NOT A BUTTON: a reader presses a sub-step, because a
           sub-step is the thing that has a drawing. Lines join the box,
           though, not the steps inside it - which is what the sheet draws
           and what makes it a collective rather than three loose steps. */
        if (n.kind === 'collective') {
          var cell = el('div', 'cs-flow-cell cs-flow-cell--collective');
          cell.style.setProperty('--cs-flow-col', n.col + 1);
          cell.style.setProperty('--cs-flow-row', n.row + 1);
          cell.style.setProperty('--cs-flow-seq', n.seq);
          cell.style.setProperty('--cs-flow-depth', n.depth);

          var cw = words[n.id] || {};
          var cname = (n.label !== undefined ? n.label : cw.label);
          var head = el('p', 'cs-flow-collective-name');
          if (cname === undefined || cname === null || cname === '') {
            head.className += ' cs-slot-waiting';
            head.textContent = n.id + '.label';
            head.title = 'stepWords → ' + key + ' → ' + n.id + '.label';
          } else {
            head.textContent = cname;
          }
          cell.appendChild(head);

          var box = el('div', 'cs-flow-collective');
          box.setAttribute('data-cs-stroke', '');
          box.dataset.csNode = n.id;
          (n.subs || []).forEach(function (s) {
            box.appendChild(stepButton(s, 'cs-flow-step--sub'));
          });
          cell.appendChild(box);
          rail.appendChild(cell);
          return;
        }

        var holder = el('div', 'cs-flow-cell');
        holder.style.setProperty('--cs-flow-col', n.col + 1);
        holder.style.setProperty('--cs-flow-row', n.row + 1);
        holder.style.setProperty('--cs-flow-seq', n.seq);
        holder.style.setProperty('--cs-flow-depth', n.depth);
        var b = stepButton(n);
        b.dataset.csNode = n.id;
        holder.appendChild(b);
        rail.appendChild(holder);
      });

      rail.setAttribute('role', 'tablist');
      rail.setAttribute('aria-label', 'The steps in this flow');
      chart.appendChild(rail);
      out.push(chart);

      /* =================================================================
         THE PICTURE, AND THE WAY THROUGH IT
         =================================================================
         The sheet puts a click area either side of the picture, the
         diagram's own title under it and a counter under that - which is
         the same furniture the prototype slide and every other carousel
         here already use, so they are the same components and not
         lookalikes.

         THE CLICK AREAS AND THE COUNTER ARE ALWAYS BUILT, and hidden when
         the step showing has one drawing. Building them on demand would
         mean the stage changing size as a reader steps from a step with
         three pictures to one with a single picture, and a picture that
         moves when you press "next" is a picture you have lost your place
         in. */
      var stageBox = el('div', 'cs-flow-stage');
      stageBox.dataset.csBase = base;
      stageBox.dataset.csTitlesKey = key;
      stageBox.csStepWords = words;

      stageBox.appendChild(arrowButton('prev', 'Previous drawing',
                                       'cs-step cs-step--prev cs-flow-step-prev'));

      var column = el('div', 'cs-flow-column');
      var shot = el('div', 'cs-flow-shots');
      shot.appendChild(slot(CS.flowSlot(base, steps[0].id), 'cs-flow-shot'));
      column.appendChild(shot);

      var cap = el('p', 'cs-caption cs-flow-title');
      var first = words[steps[0].id] || {};
      if (first.title === undefined || first.title === null || first.title === '') {
        cap.className += ' cs-slot-waiting';
        cap.textContent = 'stepWords → ' + key + ' → ' + steps[0].id + '.title';
      } else {
        cap.textContent = first.title;
      }
      column.appendChild(cap);

      column.appendChild(el('p', 'cs-pager-label cs-flow-count', ''));
      stageBox.appendChild(column);

      stageBox.appendChild(arrowButton('next', 'Next drawing',
                                       'cs-step cs-step--next cs-flow-step-next'));
      out.push(stageBox);

      return out;
    },

    'placeholder': function (d) {
      var box = el('div', 'cs-placeholder');
      box.setAttribute('data-cs-stroke', '30');
      var h = el('p', 'cs-placeholder-name');
      h.textContent = d.title || d.label || 'a slide';
      box.appendChild(h);
      box.appendChild(el('p', 'cs-meta cs-placeholder-note',
                         d.note || 'structure to come'));
      return [box];
    },

    /* =====================================================================
       #20 grid — A TABLE OF THINGS COMPARED
       =====================================================================
       From the sheet of 28 October. Everything you need to build one is in
       this comment; nothing about a grid lives anywhere else.

       WHAT IT IS FOR. "Here are the options, and here is how each one does
       on the things that matter." A table, but not a table of numbers: a
       cell can hold writing, a run of small drawings, one big drawing
       filling it, or writing with drawings under it.

       THE SHAPE, left to right:

           ┌─────────┬────────╥──────────────┬───────────┬──────────┐
           │ PHASE   │ ITEMS  ║ UX PROBLEM…  │ AFFECTED… │ TIMELINE │  <- headers
           ├─────────┼────────╫──────────────┼───────────┼──────────┤
           │         │ Item 01║ A sentence.  │ Both      │ Phase 2  │  <- an item
           │ Phase 2 │        ║              │           │          │
           ├─────────┼────────╫──────────────┼───────────┼──────────┤
           │         │ Item 02║ A sentence.  │ Group one │ Phase 3  │
           │ Phase 3 │ Item 03║ …            │ …         │ …        │
           └─────────┴────────╨──────────────┴───────────┴──────────┘
             the         the      the attributes - as many as you like,
             grouping    items    and the half that scrolls sideways
             column      column
                      ║
                      the thick rule. Everything LEFT of it stays put when
                      you scroll sideways. The header row stays put when you
                      scroll down. Both happen on their own.


       =====================================================================
       WHERE TO WRITE IT
       =====================================================================

       IN copy.js, under this slide's key, because it is almost all WORDS.
       content.js only needs the one line that puts the slide in the order:

           content.js    { template: 'grid', copy: 'slide-23' }

           copy.js       'slide-23': {
                           headers: [ … ],
                           groups:  [ … ],
                           legend:  [ … ]
                         }

       You CAN write the same keys in content.js instead and it will work -
       but if you ever write them in both, THE ONE IN content.js WINS AND
       THE ONE IN copy.js IS IGNORED WITHOUT A WORD. That is the single
       easiest way to lose an afternoon with this template. Pick copy.js and
       keep everything there.


       =====================================================================
       1 - THE COLUMNS
       =====================================================================

           headers: ['Phase', 'Items', 'UX Problem Statement',
                     'Affected User(s)', 'Timeline']

       THE FIRST TWO ARE SPECIAL and the rest are ordinary:

           headers[0]   the GROUPING column   (leave it out - see part 2)
           headers[1]   the ITEMS column
           the rest     one ATTRIBUTE each

       TO ADD A COLUMN: add its name to the end of `headers`, and add one
       more cell to the end of EVERY item's `cells` list.

       TO REMOVE ONE: take its name out of `headers`, and take the cell at
       that same position out of every item.

       THE POSITIONS LINE UP BY COUNTING, and nothing checks it for you:

           headers:  ['Phase', 'Items', 'Problem', 'Users', 'Timeline']
                                           ↓         ↓         ↓
           cells:                        [ '…',     '…',      '…'      ]

       A cell list that is SHORT leaves empty cells at the end, which is
       harmless and sometimes what you want. A cell list that is LONG has
       its extra cells quietly dropped, because there is no column for them
       to go in. If a value you wrote is not on the screen, count.

       TO REORDER COLUMNS: move the name in `headers` and move that same
       position in every item's `cells`. There is no shortcut for this; it
       is a column at a time.


       =====================================================================
       2 - THE GROUPING COLUMN, AND HOW GROUPS WORK
       =====================================================================

       A GROUP IS A HEADING THAT STANDS BESIDE SEVERAL ROWS AT ONCE. Its
       cell is automatically as tall as all of its items added together -
       you never say how tall, and you never repeat the name.

           groups: [
             { name: 'Phase 2', items: [ …one item… ] },
             { name: 'Phase 3', items: [ …three items… ] }
           ]

       TO CREATE A NEW GROUP: add another { name, items } to `groups`. The
       order of the list is the order down the slide.

       TO MOVE AN ITEM BETWEEN GROUPS: cut its { name, cells } out of one
       group's `items` and paste it into another's. Nothing else changes.

       TO SPLIT ONE GROUP INTO TWO: make a second { name, items } and move
       the items you want into it.

       TO MERGE TWO: move all the items into one and delete the other.

       AN EMPTY GROUP still draws its name beside one blank row, rather than
       disappearing - a group you meant to fill and have not yet is a thing
       you should be able to see.

       -------------------------------------------------------------------
       NO GROUPING AT ALL
       -------------------------------------------------------------------
       Write a flat `items` list instead of `groups`, and make the FIRST
       header the items column:

           headers: ['Items', 'Problem', 'Users', 'Timeline'],
           items: [
             { name: 'Item 01', cells: ['…', '…', '…'] },
             { name: 'Item 02', cells: ['…', '…', '…'] }
           ]

       The grouping column is then not drawn, and only ONE column stays put
       when you scroll sideways instead of two. Nothing else differs.

       `grouped: false` forces that off even when `groups` is written -
       useful for seeing a grid both ways without rewriting it.


       =====================================================================
       3 - THE ITEMS
       =====================================================================

           { name: 'Item 01', cells: [ …one per attribute… ] }

       `name` is what shows in the items column. It is author's writing, so
       it is set as you write it - not forced into capitals.

       TO ADD A ROW: add another { name, cells } to that group's `items`.
       TO REMOVE ONE: delete it. Its group gets shorter on its own.
       TO REORDER: move the line.


       =====================================================================
       4 - WHAT A CELL CAN BE, AND HOW TO CHANGE ONE INTO ANOTHER
       =====================================================================

       There are five kinds. Changing a cell from one kind to another is
       rewriting that one cell; nothing around it is affected.

       (a) WRITING - the plain case, and most cells

               `A problem statement, one line.`

           A bare string. Written with backticks so apostrophes and quotes
           inside it need no escaping.

       (b) THE SAME THING SPELLED OUT - when you want to add something else

               { value: `A problem statement.` }

           Identical to (a). It exists so that (c) and (e) have somewhere to
           attach.

       (c) WRITING WITH SMALL DRAWINGS UNDER IT

               { value: `Both groups`,
                 medias: ['user-group_user-1', 'user-group_user-2'] }

           The drawings are square and sit in a row under the writing. Name
           them the way every drawing on this site is named; describe them
           in media.js. One drawing on its own can use `media:` instead of
           `medias:`.

           STACKING IS ALWAYS DOWNWARDS when a cell holds more than one kind
           of thing. That is not a setting; it is the only arrangement that
           survives a narrow column.

       (d) ONE DRAWING FILLING THE CELL, edge to edge

               { fill: 'slide-23_img-01' }

           No padding, no writing, no rounded corner - the drawing is the
           cell. The row grows to hold it. Use it for a swatch, a texture, a
           small chart; not for something that has to be looked at closely,
           because it is cropped to fit rather than shown whole.

       (e) DELIBERATELY EMPTY

               {}

           An empty string `` does the same. Worth preferring {} when the
           blank is a decision rather than something you have not written
           yet, because the two look identical on the screen and only one of
           them is finished.

       TURNING ONE INTO ANOTHER:

           writing -> writing with drawings    wrap it in { value: … } and
                                               add `medias`
           writing -> a filling drawing        replace the whole cell with
                                               { fill: 'name' }
           anything -> empty                   replace it with {}


       =====================================================================
       5 - THE TINTS AND THE LEGEND
       =====================================================================

       Any cell of any kind may carry a tint:

               { value: `Not scheduled`, mark: 2 }
               { fill: 'slide-23_img-01', mark: 1 }

           mark: 1    the first legend colour
           mark: 2    the second

       AND THE LEGEND NAMES WHAT THEY MEAN:

           legend: ['Carried into the build', 'Parked for later']

       The chips appear along the bottom in that order - the first entry is
       what `mark: 1` means. LEAVE `legend` OUT and there is no legend row
       at all, which is right when nothing is tinted.

       A TINT IS A WASH, NOT A HIGHLIGHTER. It is mixed from this study's
       own two accent colours rather than being a colour of its own, so a
       study that picks a different pair gets tints that belong to it - and
       a tint can never be mistaken for a third accent. It is deliberately
       weak enough to read the writing through.

       TINTING SEVERAL CELLS IN A ROW OR COLUMN is just marking each of
       them; neighbours with the same mark run together into one shape,
       which is how the sheet draws it.


       =====================================================================
       6 - WHAT HAPPENS WITHOUT YOU ASKING
       =====================================================================

           THE HEADER ROW STAYS at the top while you scroll down.
           THE FIRST COLUMNS STAY at the left while you scroll sideways -
               the grouping column and the items column, or just the items
               column when there is no grouping.
           THE THICK RULE after them is where the staying-put stops. It is
               drawn thicker on purpose: it is the only clue a reader gets
               about why two columns are not moving.
           WRITING WRAPS and is never cut short with a row of dots. A value
               you cannot read in full is worse than a row that got taller.
           ROW HEIGHTS follow their contents.
           THE GRID FILLS THE SLIDE and scrolls inside it if there is more
               than fits. It does not make the slide taller.
           ON A PHONE it keeps its shape and scrolls sideways rather than
               stacking into a column - stacking a comparison destroys the
               one thing a comparison is for.


       =====================================================================
       7 - A TITLE, IF YOU WANT ONE
       =====================================================================

       There is none by default, because the header row is already saying
       what every column is, and the sheet gives the grid the whole slide.

           title: `How the phases compare`

       in copy.js gives it a row at the top and the grid takes what is left.


       =====================================================================
       8 - A WHOLE ONE, TO COPY
       =====================================================================

       content.js:

           { template: 'grid', copy: 'slide-23', id: 'cs-slide-phases' },

       copy.js:

           'slide-23': {
             headers: ['Phase', 'Items', 'UX Problem Statement',
                       'Affected User(s)', 'Timeline'],
             legend:  ['Carried into the build', 'Parked for later'],
             groups: [
               { name: 'Phase 2', items: [
                 { name: 'Item 01', cells: [
                   `A problem statement is a sentence, not a label.`,
                   { value: `Both groups`,
                     medias: ['user-group_user-1', 'user-group_user-2'] },
                   `Phase 2`
                 ]}
               ]},
               { name: 'Phase 3', items: [
                 { name: 'Item 02', cells: [
                   `A problem statement, one line.`,
                   { value: `Group one`, medias: ['user-group_user-1'] },
                   { value: `Phase 3`, mark: 1 }
                 ]},
                 { name: 'Item 03', cells: [
                   { value: `Looked at and put down again.`, mark: 2 },
                   { value: `Group two`, medias: ['user-group_user-2'],
                     mark: 2 },
                   { value: `Not scheduled`, mark: 2 }
                 ]}
               ]}
             ]
           }


       =====================================================================
       9 - WHEN IT DOES NOT LOOK RIGHT
       =====================================================================

       A VALUE IS MISSING. Count the columns. `headers` has one entry per
       column including the first two; every `cells` list has one entry per
       ATTRIBUTE, so it is always two shorter than `headers` (or one
       shorter, with no grouping).

       THE WHOLE SLIDE IS EMPTY. `headers` is missing, or `groups`/`items`
       is. Open the console; the engine says which copy block it could not
       find.

       EVERYTHING YOU WROTE IN copy.js IS IGNORED. The same keys are also in
       content.js, and content.js wins. Delete them from content.js.

       A DRAWING IS A HATCHED BOX. That is the box telling you its name and
       waiting. Save a file of that name in the study's assets folder and it
       appears. A SMALL one does not print its name - there is no room for
       three lines in an 84-unit square - so hover it to see the name, or
       read it off media.js.

       THE COLUMNS ARE TOO NARROW. There are too many for the width. They
       never go below a readable minimum; past that the grid scrolls
       sideways, which is the intended answer rather than a fault.


       =====================================================================
       WHERE THE LOOK OF IT LIVES
       =====================================================================

           system/css/cs-slides.css    everything under `#20 grid`
                                       - the type, the colours, the rules,
                                         the tints, the phone layout
           system/js/cs-grid.js        one measurement the pinning needs

       The type, in case you are changing it:

           headers       the drawn face, the PRIMARY accent, capitals
           group names   the drawn face, the SECONDARY accent, as written
           item names    the drawn face, the SECONDARY accent, as written
           cell values   the reading face, ordinary text, as written
     ======================================================================= */
    'grid': function (d) {
      var out = [];
      /* A TITLE IS OPTIONAL and the sheet does not draw one - the grid is
         meant to fill the slide. Writing a `title` into copy.js gives it a
         row at the top and the grid takes what is left. */
      if (d.title) out.push(title(d.title, { eyebrow: d.eyebrow, key: copyKey(d) }));
      out.push(gridBox(d));
      return out;
    },

    /* =====================================================================
       #24 impact-grid — A STATEMENT, AND THE TABLE BEHIND IT
       =====================================================================
       From the sheet "Impact + Grid Slide Template".

       THE SHAPE, measured off the drawing rather than guessed:

           ┌────────────────────────────────────────────┐ 40u padding
           │                                            │
           │              Impact text                   │ 1840 x 365
           │                                            │
           ├────────────────────────────────────────────┤ 16u gap
           │  Phase │ Item │ Problem │ Timeline         │
           │  ──────┼──────┼─────────┼──────────        │ 1840 x up to 619
           │   …    │  …   │   …     │   …              │
           └────────────────────────────────────────────┘ 40u padding

       40 + 365 + 16 + 619 + 40 comes to exactly 1080, which is the slide.

       WHY THE TWO BOXES ARE THE SAME WIDTH even though the sheet labels
       them 1844 and 1840. Both are 1840 of content - measured off the
       drawing, both run from x 212 to x 2051. The extra four is the
       statement band's drawn outline, which this site always strokes
       OUTSIDE the box it belongs to, two units a side. Nothing has to be
       built differently; the number was already telling the truth.

       =====================================================================
       THE ONE THING THAT IS NOT LIKE THE PLAIN GRID SLIDE
       =====================================================================

       The sheet says the grid's height should HUG ITS CONTENTS, and the
       plain `grid` slide does the opposite: it hands the grid a fixed box
       and lets it scroll inside. Both are right, for different reasons.

       HUGGING IS RIGHT WHEN THE GRID IS SHORT. Three rows in a box built
       for twelve leaves a hole under them, and a hole under a table reads
       as a table that is missing something.

       A FIXED BOX IS RIGHT WHEN IT IS LONG, and not as a preference: the
       header row and the first columns stay put by being STUCK inside a
       box, and a box that grows to fit whatever is in it never has an
       inside for anything to be stuck in. Let it hug without a ceiling and
       the pinning quietly stops working - the long note on `.t-grid` in
       cs-slides.css is the first time we learned that.

       SO IT DOES BOTH. The grid is as tall as its rows up to 619 units,
       and at 619 it stops growing and starts scrolling. Short grids hug;
       long ones pin. Nothing has to be chosen per slide.

       (What it does NOT do is make the slide taller. Every slide on this
       site is 1920 x 1080 and the tab machinery, the parallax and the
       scroller all count on it. A slide that grew would be a different
       and much larger change.)

       =====================================================================
       WHAT TO WRITE
       =====================================================================

           content.js   { template: 'impact-grid', copy: 'slide-11' }

           copy.js      'slide-11': {
                          impact: `One sentence worth the top of a slide.`,
                          headers: ['Phase', 'Items', 'Problem', 'Timeline'],
                          legend:  ['Carried into the build', 'Parked'],
                          groups: [
                            { name: `Phase 2`, items: [
                              { name: `Item 01`,
                                cells: [`A sentence.`, `Phase 2`] }
                            ]}
                          ]
                        }

       THE GRID HALF IS THE GRID SLIDE'S, unchanged and undiluted: the same
       `headers` / `groups` / `items` / `legend`, the same cell shapes, the
       same `mark: 1` tints, the same pinning. One builder draws both - see
       gridBox() further down - so a change to one is a change to the other
       and they cannot drift apart.

       NO TITLE. The statement is the title; a heading above a statement is
       the same job twice. Write `title` on this slide and it is ignored,
       deliberately, rather than quietly squeezing the grid. */
    'impact-grid': function (d) {
      var out = [];

      /* THE STATEMENT. A slide of this template with nothing written in
         the band is always a mistake rather than a decision - the band is
         a fixed 365 units whether or not there is a sentence in it, so an
         empty one is 365 units of nothing with a table underneath. It says
         what to write instead of sitting there blank, the same way the
         prototype slide does when no prototype is named. */
      if (d.impact) {
        out.push(el('p', 'cs-impact', d.impact));
      } else {
        var note = el('div', 'cs-impact-missing');
        note.appendChild(el('p', 'cs-meta cs-slot-waiting',
          'this slide has no impact line'));
        note.appendChild(el('p', 'cs-meta',
          'in ' + copyKey(d) + ', add  impact: \u2018\u2026\u2019'));
        out.push(note);
      }

      out.push(gridBox(d));
      return out;
    },

    /* =====================================================================
       #21 feedback — WHAT PEOPLE SAID, UNDER TABS
       =====================================================================
       From the sheet of 28 October.

       THE SHAPE:

           ┌──────────────────────────────────────────────────────┐
           │  [ Theme one ] [ Theme two ] [ Theme three ]         │ <- tabs
           ├──────────────────────────────────────────────────────┤
           │ ┌──────────────────────┐ ┌──────────────────────┐    │
           │ │ ⓵ │ what they said   │ │ ⓶ │ what they said   │    │ <- a card row
           │ └──────────────────────┘ └──────────────────────┘    │
           │ ┌──────────────────────┐ ┌──────────────────────┐    │
           │ │ ⓷ │ …                │ │ ⓸ │ …                │    │ <- another
           │ └──────────────────────┘ └──────────────────────┘    │
           └──────────────────────────────────────────────────────┘
                   the body, which scrolls if there is more than fits

       THREE WORDS FOR THREE THINGS, and they are the sheet's own:

           a NUMBERED CARD   a small bubble with a number in it, and a
                             larger area of writing beside it. A fancy
                             bullet point. The number is yours to choose.
           a CARD ROW        the cards that sit side by side. The sheet
                             says usually not more than two.
           the BODY          every card row for the chosen tab, stacked.
                             It scrolls - but only when there is more than
                             fits, and otherwise not at all.

       THE TAB DECIDES WHICH BODY IS LOADED. Each tab carries its own cards;
       pressing one swaps the whole body for that tab's.

       =====================================================================
       WHAT TO WRITE, in copy.js under this slide's key
       =====================================================================

           tabs: [
             { label: `Theme one`,
               cards: [
                 { number: `01`, body: `What somebody said.` },
                 { number: `02`, body: `What somebody else said.` }
               ]
             },
             { label: `Theme two`, cards: [ … ] }
           ]

       AS MANY TABS AS YOU LIKE. If they do not fit across the slide the
       extra ones move into a "+2" button that opens a small menu, and on a
       phone the whole row becomes a dropdown. That is the same tab bar the
       rest of the site uses; you do not have to do anything to get it.

       HOW MANY CARDS SIT SIDE BY SIDE is `perRow`, on the tab:

           { label: `Theme one`, perRow: 2, cards: [ … ] }

       Two is the default, which is what the sheet asks for. `perRow: 1`
       gives a single column of full-width cards - the right answer when
       the writing on each is long.

       FOR A ROW THAT BREAKS THE PATTERN - two cards, then one wide one -
       write the rows out instead of the cards:

           rows: [
             [ { number: `01`, body: `…` }, { number: `02`, body: `…` } ],
             [ { number: `03`, body: `…` } ]
           ]

       `rows` wins if both are written. Prefer `cards`: adding one to a
       `rows` list means rebalancing brackets, and adding one to `cards`
       does not.

       A CARD'S `body` IS WRITTEN LIKE ANY OTHER BODY on this site - one
       string, several strings for several paragraphs, or the pieces with a
       `kind`, so a heading or a list works inside a card.

       THE NUMBER IS A STRING, not a count. `01`, `3a`, `Q4` - whatever you
       refer to it by. Leave it out and the card has no bubble, which is a
       perfectly good plain card.

       A TITLE IS OPTIONAL. Write `title` and it takes a row above the tabs.

       -------------------------------------------------------------------
       THE SAME WARNING AS EVERY OTHER TEMPLATE: these keys may be written
       in copy.js or in content.js, and if they are in both, CONTENT.JS WINS
       AND COPY.JS IS IGNORED WITHOUT A WORD. Keep them in copy.js.
       ======================================================================= */
    'feedback': function (d) {
      var out = [];
      if (d.title) out.push(title(d.title, { eyebrow: d.eyebrow, key: copyKey(d) }));

      /* THE TAB BAR IS THE SITE'S OWN, not a new one. It brings the
         overflow menu and the phone dropdown with it, and it is wired by
         cs-feedback.js once the slide exists - see that file. */
      var panel = controlPanel();
      panel.classList.add('cs-control-panel--quiet');
      var tabs = panel.querySelector('.cs-tab-panel');
      if (tabs) {
        tabs.setAttribute('aria-label', d.tabsLabel || 'Feedback themes');
        /* THE TABS SHARE THE WHOLE WIDTH rather than each being as wide as
           its own words. See the note in cs-panels.js for the one thing
           that has to know about this. */
        tabs.classList.add('cs-tab-panel--fill');
      }
      out.push(panel);

      /* THE BODY IS BUILT EMPTY. Which tab's cards go in it is not a
         decision this function can make - it changes every time somebody
         presses a tab - so the filling is one job in one place, in
         cs-feedback.js, rather than once here and again on every press. */
      var body = el('div', 'cs-feedback-body dc-scroll');
      /* THE TABS ARE HANDED OVER ON THE ELEMENT ITSELF rather than written
         into an attribute, because a tab carries whole paragraphs and lists
         and those are not strings. It is the same trick explainsBox uses to
         hand its scroller over, and it saves cs-feedback.js from hunting
         through the running order for a slide that looks like this one -
         which would pick the wrong slide the moment there were two. */
      body.csTabs = d.tabs || [];
      body.csCopyKey = copyKey(d);
      out.push(body);
      return out;
    },

    /* =====================================================================
       #22 feedback-detail — ONE THEME AT A TIME, WITH ITS DRAWING
       =====================================================================
       From the sheet of 28 October. The companion to #21: where that one
       lays every theme's points out under tabs, this one takes the themes
       one at a time and gives each a drawing.

       THE SHAPE:

           ┌───┬────────────────────────────────────────────┬───┐
           │   │              Feedback theme                │   │
           │ ◀ ├──────────────────────────┬─────────────────┤ ▶ │
           │   │                          │                 │   │
           │   │      the drawing         │  EXPLAINS,      │   │
           │   │      912 x 809           │  602 wide,      │   │
           │   │                          │  scrolls inside │   │
           │   ├──────────────────────────┴─────────────────┤   │
           │   │        COUNTER: 1 out of n                 │   │
           └───┴────────────────────────────────────────────┴───┘
             the click areas, full height, at the slide's own edges

       EVERYTHING CHANGES TOGETHER. Step to the next theme and the band, the
       drawing AND the writing beside it all change - they are three parts
       of one theme. That is the difference from the use-case slide, where
       the panel deliberately stays put while the drawings step.

       =====================================================================
       WHAT TO WRITE
       =====================================================================

       It is a STEPPED SLIDE, so it reads a named set of steps from
       `workflowSets` in content.js, the same way slides 4, 8 and 9 do:

           content.js   { template: 'feedback-detail', copy: 'slide-25',
                          flows: 'feedback-themes' }

                        workflowSets: {
                          'feedback-themes': [{ id: 'feedback-themes', shots: [
                            { media: 'slide-25_img-01' },
                            { media: 'slide-25_img-02' }
                          ]}]
                        }

       AND EACH STEP'S WORDS COME FROM copy.js, filed by the drawing's name:

           copy.js      questions: {
                          'slide-25_img-01': `The theme's name`
                        },
                        bodies: {
                          'slide-25_img-01': [
                            { heading: `What they said` },
                            `The writing in the panel.`
                          ]
                        }

           questions -> the band across the top, the theme's name
           bodies    -> the EXPLAINS panel beside the drawing

       THE COUNTER COUNTS ITSELF. It says "1 / 4" from the number of steps;
       there is nothing to keep in step with anything.

       THE DRAWINGS ARE 912 x 809 - taller than the 912 x 682 the use-case
       slides use, because this one has no rating cards under the panel and
       can give the height to the drawing instead. */
    'feedback-detail': function (d) {
      /* The band across the top is the same per-step line the stepped
         slides already have - `data-cs-question` is what cs-carousels.js
         looks for when it repaints. Calling it a theme here and a question
         on slide 4 is a difference of words, not of machinery. */
      var band = el('div', 'cs-fb-theme');
      band.setAttribute('data-cs-question', '');

      var st = wireStage('panel');
      st.dataset.csFlows = d.flows || '';

      return [
        band,
        arrowButton('prev', 'Previous theme', 'cs-step cs-step--prev'),
        st,
        arrowButton('next', 'Next theme', 'cs-step cs-step--next')
      ];
    },

    /* =====================================================================
       #23 prototype — THE THING THAT ACTUALLY RUNS
       =====================================================================
       From the sheet of 28 October. It replaces the plain picture slide
       that slide 19 used to be.

       THE SHAPE:

           ┌──────────────────────────────────────────────────┐
           │              What we finally built               │ <- the band
           ├──────────────────────────────────────────────────┤
           │        ┌────────────────────────────┐            │
           │        │                            │            │
           │        │    the prototype window    │            │ <- the window
           │        │       1440 x 1024          │            │    inside the
           │        │                            │            │    container
           │        └────────────────────────────┘            │
           │                 The comparison view               │ <- prototypeTitle
           │          1 out of 2 prototypes   ⟳ Reload         │ <- the foot
           └──────────────────────────────────────────────────┘

       TWO BOXES, AND THE DIFFERENCE MATTERS:

           THE CONTAINER is everything under the band. It is where a
           LOADING ANIMATION belongs - the sheet is specific about this:
           anything played while the prototype is arriving is scaled to the
           extents of the container, not of the window.

           THE WINDOW is where the prototype itself lives, centred in the
           container, always 1440 x 1024 in shape, and as large as that
           shape fits. A prototype is a screen, and a screen that has been
           squashed to fit a hole is no longer showing you what was built.

       =====================================================================
       WHAT TO WRITE
       =====================================================================

           content.js   { template: 'prototype', copy: 'slide-19',
                          media: 'slide-19_prototype-01' }

           copy.js      'slide-19': {
                          title: `What we finally built`,
                          prototypeTitle: `The comparison view`
                        }

       TWO LINES OF WRITING, AND THEY ARE DIFFERENT THINGS. `title` is the
       band across the top of the slide and says what the section is
       about. `prototypeTitle` is the line directly under the window and
       names the thing in the window - which is the one that changes when
       the reader steps to the next prototype. With more than one, write
       `prototypeTitle` as a list in the order the windows step. See the
       note on protoNames() further down this file.

       UNDER THAT IS THE FOOT: the counter, when there is more than one
       prototype, and a RELOAD button, always. Reload plays the loader
       again and builds the prototype fresh - back to its first screen,
       which is the way out of a prototype a reader has poked into a
       state nobody meant. It acts only on the prototype being shown.

       AND WHAT GOES IN THE WINDOW is media.js's business, exactly as
       before - name a `kind` and a `src` and the resting panel becomes the
       door to it:

           'slide-19_prototype-01': { kind: 'figma',  src: '<share link>' }
           'slide-19_prototype-01': { kind: 'local',  src: '../../prototypes/…' }
           'slide-19_prototype-01': { kind: 'video',  src: 'assets/walk.mp4' }

       Until something is named there it is a resting panel saying "run
       prototype", which is the same as it has always been.

       A LOADING ANIMATION, when you have one, is named on the slide's line
       rather than in the window, because it belongs to the container:

           { template: 'prototype', copy: 'slide-19',
             media: 'slide-19_prototype-01',
             loading: 'slide-19_loading-01' }

       It fills the container and is covered by the window as soon as the
       prototype is ready. Leave it out and there is simply nothing there
       while the window waits. */
    'prototype': function (d) {
      var out = [];
      /* THE BAND IS A TITLE, and an optional one - a prototype that needs
         no introduction can have the whole slide. */
      if (d.title) out.push(title(d.title, { eyebrow: d.eyebrow, key: copyKey(d) }));

      var box = el('div', 'cs-proto-container');

      /* THE LOADING VISUAL GOES IN FIRST so the window lies over it rather
         than beside it. It fills the container, which is what the sheet
         asks for and also the only sensible reading: a thing played while
         you wait should use the room the waiting is happening in. */
      if (d.loading) {
        box.appendChild(slot(d.loading, 'cs-proto-loading'));
      }

      /* =================================================================
         MORE THAN ONE PROTOTYPE ON ONE SLIDE - the sheet of 29 October
         =================================================================

             views: 2

         and the slide grows a click area on each side and a counter
         underneath, exactly as every other stepped thing on this site
         does. The windows are named from the count, so the number and
         the names cannot disagree:

             slide-04_prototype-01
             slide-04_prototype-02

         `_prototype-`, NOT `_img-`, because that is what a thing that RUNS
         has always been called here. See CS.viewKind in cs-content.js -
         the template, the module that steps it and the map that counts the
         slots all ask the same function.

         EVERY WINDOW IS BUILT NOW AND KEPT, rather than one window whose
         contents are swapped as you step. That is the opposite of what the
         drawings do, and deliberately: a drawing is a picture and can be
         replaced for nothing, while a prototype is a RUNNING THING. Swap
         what is inside its window and you have reloaded it - back to its
         first screen, whatever the reader had done in it thrown away. Kept
         side by side, stepping away and back returns you to a prototype
         exactly as you left it.

         AND IT COSTS ALMOST NOTHING: a window rests as a panel with "Run
         the prototype" on it, and the iframe is not made until somebody
         presses it. Two windows built is two buttons. See the long note
         on CS.initProtoSteps in cs-prototype.js. */
      var views = d.views > 1 ? d.views : 0;

      /* A PROTOTYPE SLIDE THAT NAMES NO PROTOTYPE IS ALWAYS A MISTAKE, and
         it used to be a silent one. The empty box fell back to the slot
         called `no-picture-named` - which is the engine saying "nobody
         asked me for anything", in words that read like a missing file.

         SO IT SAYS WHAT TO WRITE INSTEAD. The two ways are both offered,
         because which one is right depends on how many there are and this
         file cannot know that.

         WHY IT MATTERS MORE HERE than on a slide with a picture: a picture
         slot with nothing in it is often a decision - the drawing has not
         been made yet - so the engine must not nag. A prototype window with
         no prototype named is never a decision. There is no version of this
         slide that is finished and empty. */
      if (!views && !d.media) {
        var note = el('div', 'cs-proto-missing');
        note.appendChild(el('p', 'cs-meta cs-slot-waiting',
          'this slide names no prototype'));
        note.appendChild(el('p', 'cs-meta',
          'on its line in content.js, add  media: \u2018\u2026_prototype-01\u2019' +
          '  for one, or  views: 2  for two'));
        box.appendChild(note);
        out.push(box);
        return out;
      }

      if (!views) {
        box.appendChild(slot(d.media, 'cs-proto-window'));
        /* THE COLUMN IS THE SAME OBJECT WITH ONE PROTOTYPE AND WITH SIX -
           window, name, foot - and only the carousel below puts click
           strips either side of it. That is the whole difference between
           the two sheets of 3 November, and it falls out for free rather
           than being two layouts kept in step by hand. */
        var one = el('div', 'cs-proto-column');
        one.appendChild(box);
        one.appendChild(el('p', 'cs-proto-name', protoNames(d)[0] || ''));
        /* no counter - there is nothing to count - but the reload button
           is here, because one prototype can be got into a muddle just
           as easily as two */
        one.appendChild(protoFoot(0));
        out.push(one);
        return out;
      }

      var names = CS.viewSlots(d.slotBase || d.copy || '', views, 'prototype');
      names.forEach(function (name, i) {
        var w = slot(name, 'cs-proto-window');
        w.dataset.csProtoView = i;
        box.appendChild(w);
      });

      /* THE MIDDLE COLUMN IS A STACK, NOT JUST THE STAGE.
         The sheet of 3 November runs the two click areas from under the
         slide's title all the way to the bottom of the frame - past the
         prototype, past its name, past the counter. So the name and the
         counter belong INSIDE the column the stage is in, not under the
         whole carousel. Put them under the carousel and the strips stop
         short at the stage, which is both wrong to the drawing and worse
         to use: the easiest place to aim for "next" is the big empty
         rectangle beside the prototype, and it should not run out
         halfway down. */
      var column = el('div', 'cs-proto-column');
      column.appendChild(box);

      /* THE NAME OF THE PROTOTYPE BEING SHOWN. One element the stepper
         rewrites, not one per view - the same decision the counter made,
         and for the same reason: two of them could disagree. */
      var written = protoNames(d);
      column.appendChild(el('p', 'cs-proto-name', written[0] || ''));

      /* and under it the counter and the reload button, together on one
         line, exactly as the sheet draws them */
      column.appendChild(protoFoot(views));

      /* the names travel to the stepper on the carousel, joined by a
         character that cannot occur in a title, so the stepper does not
         have to reach back into content.js to find them */
      var reel = el('div', 'cs-proto-carousel');
      if (written.length) reel.dataset.csProtoNames = written.join('\u0000');
      reel.appendChild(arrowButton('prev', 'Previous prototype',
                                   'cs-step cs-step--prev'));
      reel.appendChild(column);
      reel.appendChild(arrowButton('next', 'Next prototype',
                                   'cs-step cs-step--next'));
      out.push(reel);

      return out;

    },

    /* #9 — the backend diagram slide. Empty; cs-carousels.js fills it. */
    'backend': function () {
      var panel = el('div', 'cs-control-panel');
      panel.appendChild(el('div', 'cs-toggle-panel'));
      var stageEl = el('div', 'cs-diagram-stage');
      stageEl.dataset.csDiagrams = '';      // the study's plain `diagrams` list
      return [panel, stageEl, caption('')];
    }
  };

  /* =====================================================================
     THE GRID ITSELF, AS A PIECE RATHER THAN A SLIDE
     =====================================================================
     Two templates draw this now: `grid`, which hands it the whole slide,
     and `impact-grid`, which stands a statement over it. So it is built
     here once and each template decides only how much room it gets.

     IT RETURNS THE BOX, not a list of slide children. The box is the thing
     that has a height, and a height is the only thing the two templates
     disagree about - everything inside is identical, down to the pinning.
     ===================================================================== */
  function gridBox(d) {

      var heads = d.headers || [];
      /* `grouped` is only ever a deliberate NO. Left unsaid, a slide that
         supplies `groups` is grouped and one that supplies a flat `items`
         is not, which is the answer the content already gave. */
      var grouped = d.grouped === false ? false : !!(d.groups && d.groups.length);

      /* THE ROWS, FLATTENED. The grouping column is drawn as one tall cell
         beside the first item of its group, so the rows have to be walked
         once in advance to know how many items each group has. */
      var rows = [];
      if (grouped) {
        (d.groups || []).forEach(function (g) {
          var items = g.items || [];
          if (!items.length) items = [{}];
          items.forEach(function (item, i) {
            rows.push({ item: item,
                        group: i === 0 ? g : null,
                        span: i === 0 ? items.length : 0,
                        first: i === 0 });
          });
        });
      } else {
        (d.items || []).forEach(function (item) {
          rows.push({ item: item, group: null, span: 0, first: true });
        });
      }

      var frozen = grouped ? 2 : 1;        /* columns that stay put */
      var cols = Math.max(heads.length, frozen + 1);

      var scroller = el('div', 'cs-grid-scroll dc-scroll');
      var table = el('div', 'cs-grid');
      table.style.setProperty('--cs-grid-cols', cols);
      table.style.setProperty('--cs-grid-frozen', frozen);
      if (grouped) table.classList.add('is-grouped');

      /* ---- the header row ---- */
      heads.forEach(function (h, i) {
        /* `is-pin-a` is the column that stops on the left edge, `is-pin-b`
           the one that stops where the first ends. Naming them by the job
           rather than by what they contain means the stylesheet does not
           have to know whether this grid has a grouping column. */
        var cls = 'cs-grid-head';
        if (i < frozen) cls += ' is-frozen is-pin-' + (i === 0 ? 'a' : 'b');
        if (i === frozen - 1) cls += ' is-edge';
        var cell = el('div', cls);
        cell.innerHTML = h;
        table.appendChild(cell);
      });
      /* a slide that names fewer headers than it has columns still rules
         off every column, rather than leaving a ragged top edge */
      for (var h = heads.length; h < cols; h++) {
        table.appendChild(el('div', 'cs-grid-head'));
      }

      /* ---- the body ---- */
      rows.forEach(function (row, r) {
        var lastOfGroup = grouped &&
          (r === rows.length - 1 || rows[r + 1].first);

        if (grouped) {
          if (row.group) {
            var gcell = el('div', 'cs-grid-group is-frozen is-pin-a');
            gcell.style.gridRow = 'span ' + row.span;
            gcell.innerHTML = row.group.name || '';
            table.appendChild(gcell);
          }
          /* rows after the first in a group append nothing here - the tall
             cell above is already standing beside them */
        }

        var name = el('div', 'cs-grid-item is-frozen is-edge is-pin-' +
                             (grouped ? 'b' : 'a') +
                             (lastOfGroup ? ' is-group-end' : ''));
        name.innerHTML = (row.item && row.item.name) || '';
        table.appendChild(name);

        var cells = (row.item && row.item.cells) || [];
        for (var c = frozen; c < cols; c++) {
          table.appendChild(gridCell(cells[c - frozen],
                                     lastOfGroup || (!grouped && false)));
        }
      });

      scroller.appendChild(table);
      var box = el('div', 'cs-grid-box');
      box.appendChild(scroller);

      if (d.legend && d.legend.length) {
        var leg = el('div', 'cs-grid-legend');
        d.legend.forEach(function (text, i) {
          var chip = el('div', 'cs-grid-legend-item');
          var sw = el('span', 'cs-grid-swatch');
          sw.dataset.csMark = String(i + 1);
          chip.appendChild(sw);
          var lab = el('span', 'cs-grid-legend-label');
          lab.innerHTML = text;
          chip.appendChild(lab);
          leg.appendChild(chip);
        });
        box.appendChild(leg);
      }

    return box;
  }

  /* ---------- pieces the templates share ---------- */

  /* =====================================================================
     THE NAME OF THE PROTOTYPE, AND WHERE IT IS WRITTEN
     =====================================================================

     The sheets of 3 November label the line under the window
     `prototypeTitle`, and say it is something YOU specify in copy.js -
     so that is the word the engine reads. It lives in the slide's own
     copy block, beside the title:

         'slide-06': { title: `What we finally built`,
                       prototypeTitle: `The comparison view` }

     WHEN THERE ARE TWO PROTOTYPES, write a list, in the order the
     windows step:

         'slide-06': { title: `What we finally built`,
                       prototypeTitle: [`The comparison view`,
                                        `Setting the parameters`] }

     ONE PROPERTY FOR BOTH CASES, rather than a singular and a plural
     that can disagree with each other and with `views:`. A list where
     the slide holds one prototype simply uses its first entry.

     `prototypeTitles` and the older `titles` are still read, so nothing
     written before this stops working, but `prototypeTitle` is the name
     to use. Leave it out entirely and the line is not drawn - see
     `.cs-proto-name:empty` in cs-slides.css. */
  function protoNames(d) {
    var raw = d.prototypeTitle;
    if (raw === undefined || raw === null) raw = d.prototypeTitles;
    if (raw === undefined || raw === null) raw = d.titles;
    if (raw === undefined || raw === null) return [];
    return Array.isArray(raw) ? raw.slice() : [String(raw)];
  }

  /* =====================================================================
     THE FOOT OF A PROTOTYPE SLIDE - the counter and the reload button
     =====================================================================

     THE COUNTER SAYS IT IN WORDS. `1 / 2` is a fraction and reads as
     one; "1 out of 2 prototypes" reads as a position in a set, which is
     what it is. It is only drawn when there is more than one, because
     "1 out of 1" is not an address, it is a shrug.

     THE RELOAD BUTTON IS ALWAYS THERE, with one or with six. What it
     does is the whole prototype again from the top: the loader plays a
     second time and the prototype behind it is built fresh, back at its
     first screen with whatever the reader had typed or opened in it
     thrown away. That is the point of it - a prototype is a thing you
     poke at until it is in a state you did not mean, and without this
     the only way back was to reload the whole case study.

     IT ACTS ON THE PROTOTYPE BEING SHOWN, not on all of them, so on a
     slide with two the other one is left exactly as the reader left it.
     The wiring is in cs-loader.js, because replaying the loader is that
     file's job and it would only have had to be written twice here. */
  function protoFoot(views) {
    var foot = el('div', 'cs-proto-foot');

    if (views > 1) {
      foot.appendChild(el('p', 'cs-pager-label cs-proto-count',
        '1 out of ' + views + ' prototypes'));
    }

    var b = el('button', 'cs-proto-reload');
    b.type = 'button';
    b.dataset.csProtoReload = '';
    b.setAttribute('aria-label', 'Reload the prototype');
    b.appendChild(reloadMark());
    b.appendChild(el('span', 'cs-proto-reload-label', 'Reload'));
    foot.appendChild(b);

    return foot;
  }

  /* The mark on the button: a circle that does not quite close, with an
     arrowhead on the open end. Drawn with the same deliberate wobble as
     everything else here - a perfect circle would be the one machined
     object on the page. Two strokes, no fill, so it takes its colour
     from the button and nothing has to be restated for dark mode. */
  var SVGNS = 'http://www.w3.org/2000/svg';
  function reloadMark() {
    var s = document.createElementNS(SVGNS, 'svg');
    s.setAttribute('class', 'cs-proto-reload-mark');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('aria-hidden', 'true');
    s.setAttribute('focusable', 'false');

    var arc = document.createElementNS(SVGNS, 'path');
    arc.setAttribute('class', 'cs-proto-reload-arc');
    arc.setAttribute('d', 'M 20.2 9.4 C 18.7 5.3, 14.3 2.8, 10.3 3.9 ' +
                          'C 6.1 5.1, 3.2 9.2, 3.8 13.6 ' +
                          'C 4.4 18.1, 8.6 21.3, 13 20.8 ' +
                          'C 16.4 20.4, 19.4 17.9, 20.4 14.6');
    s.appendChild(arc);

    var head = document.createElementNS(SVGNS, 'path');
    head.setAttribute('class', 'cs-proto-reload-head');
    head.setAttribute('d', 'M 14.3 10.2 L 20.5 9.5 L 19.6 3.4');
    s.appendChild(head);

    return s;
  }

  function arrowButton(dir, label, extra) {
    var b = el('button', 'cs-arrow cs-arrow--' + dir + (extra ? ' ' + extra : ''));
    b.type = 'button';
    b.setAttribute('aria-label', label);
    var mark = el('span', 'cs-arrow-mark');
    mark.setAttribute('aria-hidden', 'true');
    mark.setAttribute('data-cs-stroke', '');

    /* THE HEAD IS AN SVG, NOT A CLIPPED BOX, and the reason is the
       corners. A `clip-path` polygon cuts a shape out with a knife: its
       three points are as sharp as geometry can make them, and there is
       no CSS property that softens them. Nothing else on this site has a
       corner like that.

       A POLYGON THAT IS STROKED IN ITS OWN COLOUR WITH A ROUND JOIN is
       the whole trick: the stroke follows the outline and the join
       rounds every turn, so the triangle comes out with three soft
       corners and no second colour. The points are pulled in by half the
       stroke so the rounded shape ends up the size the sharp one was. */
    var head = document.createElementNS(SVGNS, 'svg');
    head.setAttribute('class', 'cs-arrow-head');
    head.setAttribute('viewBox', '0 0 30 34');
    head.setAttribute('aria-hidden', 'true');
    head.setAttribute('focusable', 'false');
    var tri = document.createElementNS(SVGNS, 'polygon');
    tri.setAttribute('points', '4.5,5 26,17 4.5,29');
    head.appendChild(tri);
    mark.appendChild(head);

    b.appendChild(mark);
    return b;
  }

  function controlPanel(withSecondary) {
    var panel = el('div', 'cs-control-panel');
    var tabs = el('div', 'cs-tab-panel');
    tabs.setAttribute('role', 'tablist');
    tabs.setAttribute('aria-label', 'Workflows');
    panel.appendChild(tabs);
    if (withSecondary) {
      panel.appendChild(el('div', 'cs-separator'));
      var right = el('div', 'cs-right-controls');
      panel.appendChild(right);
    }
    return panel;
  }

  /* #8 and #3.5 differ in one row and nothing else, so they are built by one
     function that is handed whatever goes in that row. */
  function wireframeSlide(d, topRow) {
    d = d || {};
    /* `split: true` on the slide's line in content.js puts a column of
       WRITING beside the diagram, and the writing changes with the diagram
       the way the question above it does. Case study 2's slide 4 is the one
       that asked for it; every stepped slide can have it. */
    var st = wireStage(d.split);
    /* Which set of screens this slide shows. It is written on the stage
       rather than on the tab panel, because #3.5 has no tab panel. */
    st.dataset.csFlows = d.flows || '';

    /* `question: false` ON THE SLIDE'S LINE means this stepped slide
       deliberately has no question above its diagram - the same idiom as
       `title: null` and `media: null`. Without it the band names the block
       it is waiting for, as every other empty thing on this site does.

       SINGULAR, AND THAT IS NOT A TYPO. `questions` with an s is the block
       in copy.js holding every question on the site, filed by drawing. One
       word for two unrelated things - a map of words in one file, a yes/no
       on a slide in another - is how somebody ends up writing the wrong
       one in the wrong place and getting silence. */
    if (d.question === false) st.dataset.csNoQuestions = '1';

    /* =====================================================================
       OR, MUCH MORE OFTEN: JUST SAY HOW MANY
       =====================================================================

           { template: 'title-steps', copy: 'slide-05', views: 4 }

       and the four drawings are `slide-05_img-01` to `_img-04`. There is
       nothing to look up and nothing to keep in step, because THE COUNT IS
       THE LIST - add a fifth drawing by changing one digit.

       THIS IS THE SAME `views` THE USE-CASE SLIDE AND THE PROTOTYPE SLIDE
       TAKE, and it should always have worked here too. It did not, for no
       better reason than that this function was written before `views`
       existed and nobody came back to it: a stepped slide that said
       `views: 4` set nothing on the stage, so the carousel found no
       screens and drew an empty slide with a counter reading 1 of 1. No
       error, because as far as the engine was concerned the slide had not
       asked for anything.

       WHEN TO USE WHICH, now that both work here:

         views: 4            four drawings that are views of ONE thing.
                             This is almost always what a stepped slide is.

         flows: 'name'       SEVERAL named runs of drawings, with a tab for
                             each - "the analyst's path", "the reviewer's
                             path" - or one run whose shots need captions
                             and questions written per shot rather than
                             filed by the drawing's name. The list lives in
                             `workflowSets` in content.js.

       `flows` wins if a slide somehow says both, because a written-out list
       is a more specific instruction than a count. */
    var views = d.views > 1 ? d.views : 0;
    if (!d.flows && views) {
      st.dataset.csViews = views;
      st.dataset.csBase = d.slotBase || d.copy || '';
    }

    /* The name under each drawing, IF THE SLIDE WRITES THEM - the same
       `viewTitles` list the use-case slide takes, travelling on the element
       because it is a list and an attribute is a string.

       THE KEY IS ONLY SET WHEN THE LIST IS THERE, and that is the whole of
       the difference between a to-do and a blank. Every empty thing on this
       site names the block it is waiting for, which is right when the slide
       ASKED for something and has not written it yet. Set unconditionally,
       it put `viewTitles -> slide-05` under a stepped slide that never
       wanted titles at all - a to-do for a job nobody has. These slides
       caption their drawings through `captions` and `questions`, filed by
       the drawing's name; a title under each one is a thing you opt into. */
    if (d.viewTitles) {
      st.csViewTitles = d.viewTitles;
      st.dataset.csTitlesKey = copyKey(d);
    }

    return [
      topRow,
      arrowButton('prev', 'Previous screen', 'cs-step cs-step--prev'),
      st,
      arrowButton('next', 'Next screen', 'cs-step cs-step--next'),
      caption('')
    ];
  }

  function wireStage(withBody) {
    var s = el('div', 'cs-wire-stage' + (withBody ? ' cs-wire-stage--split' : ''));
    var pager = el('div', 'cs-pager');
    pager.appendChild(arrowButton('prev', 'Previous screen', 'cs-pager-prev'));
    pager.appendChild(el('span', 'cs-pager-label', '1 / 1'));
    pager.appendChild(arrowButton('next', 'Next screen', 'cs-pager-next'));
    s.appendChild(pager);
    /* THE WRITING BESIDE THE DIAGRAM, in one of two dresses. It is built
       EMPTY here and refilled by cs-carousels.js on every step, because what
       it says belongs to the diagram rather than to the slide. A slide built
       without it never has one, and a `body` written on a step that has
       nowhere to put it is ignored rather than breaking anything.

           split: true        A PLAIN COLUMN. Writing on the page beside the
                              picture, with nothing drawn around it.

           split: 'panel'     THE EXPLAINS PANEL - the filled, rounded,
                              internally scrolling surface the people's slide
                              uses. The sheet for slide 8 asks for this one
                              by name.

       The difference is only the box. What goes IN it is written the same
       way either way: the step's own entry under `bodies` in copy.js, in the
       ordinary body vocabulary, so headings and lists work in both. */
    if (withBody) {
      var b;
      if (withBody === 'panel') {
        var panel = explainsBox('About this diagram');
        /* the writing goes in a .cs-body INSIDE the scroller rather than
           straight into it: the scroller is a spaced-out flex column built
           for the people's sections, and body copy wants body spacing. */
        b = el('div', 'cs-body cs-steps-panel-body');
        panel.scroller.appendChild(b);
        s.appendChild(panel);
      } else {
        b = el('div', 'cs-body cs-steps-body dc-scroll');
        s.appendChild(b);
      }
      b.setAttribute('data-cs-step-body', '');
    }
    return s;
  }

  /* =======================================================================
     OLD NAMES FOR TEMPLATES THAT HAVE BEEN RENAMED
     =======================================================================

     A template gets renamed when what it is FOR becomes clearer than the
     shape it happens to make - `title-explains` described the arrangement,
     `use-case` describes the job. Renaming it would quietly break any
     content.js still using the old word, and "quietly" is the part that
     matters: the slide would simply vanish from the running order.

     So the old word keeps working, for ever, and costs one line. Both the
     builder and the slide's own class come from the NEW name, so there is
     still only one of everything to style and to think about. */
  var ALIASES = {
    'title-explains': 'use-case'
  };

  /* ---------- THE TWO CHAPTER VARIANTS, ALSO AS TEMPLATE NAMES ----------

     You named them `graphics-inside` and `graphics-outside`, so those are
     spellable as templates as well as as a `variant:` on the slide's line.
     Both land in the same function with the same argument; there is no
     second copy of anything.

     The slide's own object is NOT changed - it is copied first. A template
     that edits the thing it was handed is a template that changes
     content.js from underneath you, and the whole point of that file is
     that nothing but you writes it. */
  function asVariant(name) {
    return function (d) {
      var copy = {};
      for (var k in d) { if (Object.prototype.hasOwnProperty.call(d, k)) copy[k] = d[k]; }
      copy.variant = name;
      return T['chapter-name-graphics'](copy);
    };
  }
  T['graphics-inside']  = asVariant('graphics-inside');
  T['graphics-outside'] = asVariant('graphics-outside');
  T['graphics-none']    = asVariant('graphics-none');

  CS.templates = {
    /* every template the system knows, by name */
    registry: T,
    /* old name -> current name; see the note above */
    aliases: ALIASES,
    realName: function (name) { return ALIASES[name] || name; },
    /* the helpers a case study's content can reach through `stage` */
    piece: piece,
    slot: slot,
    explainsBox: explainsBox,
    explainsPaint: explainsPaint,
    arrowButton: arrowButton,
    controlPanel: controlPanel,
    names: function () { return Object.keys(T); }
  };
})(window.CS);

