# How a case study is put together

Every case study is a folder. Inside it are six files and a folder of
drawings, and **you only ever need three of them**.

```
case-studies/<your-study>/
    copy.js       every word         ← change a heading here
    media.js      every picture      ← describe a new drawing here
    content.js    the running order  ← move, add or remove a slide here
    assets/       the drawings themselves

    index.html    the page shell     (you will not need to touch this)
    theme.css     the two accents    (one line each)
    assets.css    background art     (rare)
```

The split exists because those are three different jobs, and you almost
never do two of them at once. Fixing a heading should not mean reading past
a list of filenames; dropping in a drawing should not mean reading past a
paragraph of copy.

> ### Two lookup tables, both generated from the engine
>
> **[COPY-REFERENCE.md](COPY-REFERENCE.md)** — every template, every WORD it
> reads in copy.js, and the shape each word wants.
>
> **[CONTENT-REFERENCE.md](CONTENT-REFERENCE.md)** — everything you can put
> on a slide's own line in content.js, the shape of the file around it, and
> every switch for turning a thing off.
>
> Both are rebuilt by reading `system/js/cs-templates.js`
> (`node tools/copy-reference.js --write`,
> `node tools/content-reference.js --write`), so they cannot go stale: if a
> template learns a new word, it appears there. Neither will even build if a
> key has no description written for it.
>
> This README is the one that explains *why* and walks you through a job.
> Those two are the lookup tables.

---

## "I want to change some words"

Open **copy.js**. Everything a reader can read is in that one file, and
nothing else is.

Find the slide by its number — slide 6 of your deck is `slide-06` — and edit
the text between the quote marks.

```js
'slide-06': {
  label: 'Product development strategy',   // the name in the slide list
  title: 'Product development strategy'    // the heading on the slide
},
```

Leave the field names, the quote marks and the commas exactly as they are.
Those are the only things that can break.

**Captions are not filed under slides.** A caption describes a *picture*, so
it lives under that picture's name, in one flat list near the bottom of
copy.js:

```js
captions: {
  'slide-12_img-01': 'The first round of concepts.',
  'slide-13_img-01': 'Four more, the following week.'
}
```

That means a picture carries its caption with it if you move it to another
slide, and when you swap a drawing its words are sitting right next to its
name.

**Tab names work the same way**, filed under the tab's own short name:

```js
labels: {
  'material-moves': 'Identification of material moves',
  trend: 'Trend Analysis'
}
```

### Quotes, apostrophes and other awkward characters

**The one that actually breaks the file is the straight apostrophe.** The
quote marks around a line of copy are fence posts saying where the sentence
starts and stops, so an apostrophe inside ends the sentence early and
everything after it turns to gibberish:

```js
body: 'We didn't know what the analysts wanted.',
              ^ the file thinks the sentence ended here
```

**The fix: wrap copy in backticks** — the key left of the 1, above Tab.
A backtick is a fence post you will never type by accident mid-sentence, so
apostrophes and double quotes both become ordinary characters again:

```js
body: `We didn't know what they wanted — and "obvious" wasn't it.`,
```

Use backticks everywhere in copy.js and you can stop thinking about this.
(The only two things that then need care are a backtick itself and the
sequence `${`.)

Curly quotes and dashes can also be written the long way. Copy is handed to
the page as HTML, which is how `<em>italics</em>` works in a sentence — and
which is why `<` and `&` very occasionally get eaten. Write those two the
long way if a sentence needs them literally.

| you write | you get |
|---|---|
| `&rsquo;` | ’ |
| `&lsquo;` | ‘ |
| `&ldquo;` `&rdquo;` | “ ” |
| `&mdash;` | — |
| `&amp;` | & |
| `&middot;` | · |
| `&lt;` | < |

### A name with a hyphen in it needs quotes

This one is worth knowing before it costs you an evening, because almost
every name on this site has a hyphen in it — `slide-05`, `acc-01`, `user-1`,
`phase-01`.

When a name is a **key** — the thing on the left of a colon — it must be in
quotes:

```js
accordionWords: {
  acc-01: { label: `…` }      // breaks the WHOLE file
  'acc-01': { label: `…` }    // correct
}
```

Without them, JavaScript reads the hyphen as a minus sign and the file has a
syntax error. **A file with one syntax error does not load half of itself — it
loads nothing**, so one stray character makes the whole of `copy.js` vanish
and the page reports it as a file that did not load. It is not missing; it
cannot be read.

You will already have noticed the blocks at the top level are quoted for the
same reason: `'slide-05': { … }`. Anything *inside* them needs the same
treatment, at every depth.

**A name used as a value needs no quotes beyond the ones it already has** —
inside a list, in `media: 'slide-05_img-01'`, in `accordions: ['acc-01']`, it
is already a string and there is nothing more to do. It is only the key
position that bites.

If the page tells you a file did not load, open the console (F12) and scroll
to the top: the browser has already printed the file and the line number in
red. `CS.doctor()` prints the same diagnosis.

### Paragraphs

**One paragraph is a string. Several paragraphs are a list of strings.** That
is the whole rule — square brackets, and a comma between each one:

```js
body: 'Just the one paragraph.'

body: [
  'The first paragraph. It ends where the quote mark ends.',
  'The second. It starts on a new line of its own, with a gap above it.',
  'A third, if you want one.'
]
```

Each string becomes its own paragraph with a line's worth of space above it.
You do **not** put blank lines inside a string to make a gap — a return
inside the quotes is just a space to the browser. The brackets are the gap.

**For a line break *inside* one paragraph** — an address, a line of verse —
use `<br>`:

```js
body: 'The first line.<br>The second, hard against it.'
```

This works the same everywhere body copy appears: on a slide, inside a
person's panel on slide 3, inside a drawer.

### Headings part-way down a body

**To break a long read into chunks, each with its own heading**, put a
heading between the paragraphs. The words are yours:

```js
body: [
  'An ordinary paragraph.',
  'Another one.',

  { kind: 'heading', text: 'What changed' },

  'The first paragraph under that heading.',
  'A second one.',

  { kind: 'heading', text: 'What it cost' },

  'And the writing under that.'
]
```

A heading here is the **small** one that chunks a body. It is not the
slide's own title — that is `title` in the same copy block and is set much
larger. Both are yours to word.

As many as you like, anywhere in the list. The first one in a body takes no
space above it, because there is nothing up there to be separated from.

### How a column of text is set

**Every body of writing is left-aligned**, runs to a comfortable measure of
about 62 characters, and the column itself sits centred in whatever space it
was given. Text left, block centred — the two are not in conflict.

Titles, section headings and the big impact statements stay **centred**.
Only the writing changed.

Nothing to write for any of this; it is how a body is set.

### Indented first lines — automatic

**A paragraph that follows another paragraph is indented. Nothing else is.**

You do not mark anything. The rule falls out of that one sentence:

| | |
|---|---|
| the first paragraph of a body | **flush** — nothing above it |
| the second, third, fourth… | **indented** |
| the first paragraph after a heading | **flush** — a new chunk starts fresh |
| the first paragraph after a list | **flush** |
| **every bullet point** | **never indented** |

So indentation only ever shows up where several paragraphs run together as
one cohesive piece of writing — which is the only place it means anything.
A single paragraph on its own is never indented.

**The two exceptions**, for when you want the opposite of the automatic rule:

```js
{ kind: 'indent', text: '…' }   step this one, though it would be flush
{ kind: 'flush',  text: '…' }   leave this one flush, though it would step
```

### Two or three columns

```js
body: [{ kind: 'columns', count: 2, items: ['…', '…', '…'] }]
body: [{ kind: 'columns', count: 3, items: ['…', '…', '…'] }]
```

You do **not** say which paragraph goes in which column — the browser
balances them, so adding a sentence does not mean re-dealing the writing by
hand. Each column is left-aligned and the group sits centred on the slide.

**On a phone they become one column**, stacked, in the order you wrote them.

A paragraph at the top of a column is never indented: the columns sit side
by side, so none of them is "following" another.

### Writing beside a stepped diagram

A slide that steps through diagrams can carry writing beside each one, and it
changes as you step. Two dresses, set on the slide's line in `content.js`:

```js
split: true       a plain column of writing on the page
split: 'panel'    the EXPLAINS PANEL - filled, rounded, scrolls inside itself
```

What goes in it is written per diagram in `copy.js` under `bodies`, filed by
the **picture's** name — the same way its question already is, so moving a
diagram moves its words with it:

```js
bodies: {
  'slide-08_img-01': [
    { kind: 'heading', text: 'What I found' },
    'A paragraph.',
    { kind: 'points', items: ['A bullet.', 'Another.'] }
  ],
  'slide-08_img-02': 'A single paragraph is fine too.'
}
```

It takes the **ordinary body vocabulary** — headings, paragraphs, lists,
everything above — in either dress.

If a step has no entry yet, the panel says which key it is waiting for
(`bodies → slide-08_img-01`) rather than sitting there empty.

### The drawn band on a strip

A long low drawing across a short slide — the chapter headings, and the
problem-statement slide. It is **111 design-pixels tall wherever it appears**,
not "as tall as the space it was given", so it is the same band on every
slide that uses one. It keeps a clear gap from the writing on the side that
faces it: a band hard against a paragraph reads as a rule *under* that
paragraph rather than as an ornament the eye can skip.

```js
{ template: 'rule-title', copy: 'slide-07', media: 'slide-07_img-01' }
```

- **band, then a heading** — a chapter slide. That is all `rule-title` does
  on its own.
- **band, heading, then a line of subtext** — add `subtitle` to its copy block.
- **band, heading, then writing** — add `body`. That is slide 6.
- **heading, writing, then a band at the foot** — the mirror image, and a
  template of its own: `title-body-rule`.

**The title on a slide strip is the loudest thing on the page.** It is set at
the display size — the same as the case study's own title on slide 1 — and
sits in a block 364 design-pixels tall. A section heading on an ordinary
slide is less than half that: a chapter announcing a whole part of the story
is not the same thing as a heading inside one.

Write these titles in **Title Case** — *Some Interesting Ideas I Explored*,
not *some interesting ideas i explored*. Nothing in the code forces it, on
purpose: a rule that capitalises for you also capitalises the day you want a
lowercase title, and it makes a mess of anything with an acronym in it. It is
a writing habit, and it lives here so it is written down.

### The space between things on a slide

One number, in one place — `--cs-gutter` at the top of
`system/css/cs-tokens.css`. Change it and every slide follows.

It is **32 design-pixels**, and the size is a Gestalt decision rather than a
taste one. The eye groups things by how close they are, so the gap *between*
two components has to beat the gap *inside* one, or the grouping reads
backwards. On these slides:

```
 ~14–20   inside a component — a tile and its label
 ~29      between two paragraphs of one piece of writing
  32      BETWEEN ONE COMPONENT AND THE NEXT   ← --cs-gutter
  40–48   between a picture and the writing beside it
```

It used to be 16, which was *below* the paragraph gap — two things from
different components sat closer together than two lines of the same
sentence. The restraint at 32 is deliberate too: a slide is a fixed
eight-row grid, so every unit of gutter comes out of the rows. At 32 the
seven gaps cost a fifth of the slide's height; doubling again would cost a
third, and the fuller slides would start to squeeze.

Nothing here is in fixed pixels. `--u` is one 1920th of the slide's own
width, so the whole scale grows and shrinks with the slide; on a phone the
gutter is a `clamp()` that moves with the screen.

### The other kinds of body text

```js
body: [{ kind: 'heading',   text: '…' }]            a heading in the writing
body: [{ kind: 'columns',   count: 2, items: […] }] two or three columns
body: [{ kind: 'indent',    text: '…' }]            step a paragraph (rare)
body: [{ kind: 'flush',     text: '…' }]            un-step one (rare)
body: [{ kind: 'points',    items: ['…', '…'] }]   a bulleted list
body: [{ kind: 'numbers',   items: ['…', '…'] }]   a numbered list
body: [{ kind: 'questions', items: ['…', '…'] }]   a list of questions
body: [{ kind: 'quote',     text: '…' }]           a centred statement
body: [{ kind: 'note',      text: '…' }]           small print
body: [{ kind: 'surface',   title: '…', body: […] }]   a raised panel
```

### The surface

A raised panel of writing — the golden one at the top of slide 2. It is a
**piece**, like a list or a quote, so it can go into any slide whose body goes
through the builder, with no new template:

```js
body: [{ kind: 'surface',
         title: 'How the scope widened',
         body:  ['first paragraph', 'second', 'third'] }]
```

**It has two states, and one word decides both of them.**

| you write | you get |
| --- | --- |
| no `drawer` | a surface. Fill, drawn outline, heading and paragraphs. Nothing to press. |
| `drawer: 'detail'` | a door. The same panel, plus the hand-written line at the foot saying where it goes — and pressing it opens that drawer. |

```js
{ kind: 'surface',
  title:  'How the scope widened',
  body:   ['…', '…', '…'],
  drawer: 'detail',                 // makes it a door
  action: 'Read the full story' }   // the words on that line
```

So the line in Caveat and the drawer always arrive together. A surface that
invites a press and does nothing, or one that opens a panel without saying it
will, are the two ways this could lie — and neither is reachable, because the
same word decides both.

**Its outline is drawn in the study's primary accent**, the colour its own
title is set in, so a shared component still belongs to the study it is in.

**It is designed for about three paragraphs.** On slide 2 the band it sits in
is four of the slide's eight rows, which holds a heading, three paragraphs of
roughly two lines each, and the line at the foot — with a little room over at
every desktop width except the narrowest, where it is exact. Longer copy than
that needs the band to be given another row: `grid-row: 1 / 5` on
`.t-pair-section > .cs-pair` in `system/css/cs-slides.css`, and move the two
rules under it down to match.

**They mix with paragraphs**, in whatever order you write them:

```js
body: [
  'A paragraph to set it up.',
  { kind: 'points', items: ['one', 'two', 'three'] },
  'And a paragraph after the list.'
]
```

---

## Setting the type — every size, in one short file

Open **`common/type-scale.css`**. It holds nothing but the knobs, it fits on
one screen, and every page on the site reads it: the landing page, every case
study, the drawer, the password screen.

There is nothing to link. `common/type.css` imports it on its first line, and
every page already links type.css.

### Three kinds of knob

```css
--t-title:       88;                        /* the size on a 1920 slide   */
--t-title-min:   28px;                      /* never smaller than this    */
--t-title-hand:  var(--t-display-face);     /* which of the three hands   */
```

A size is a plain number, not a pixel: a slide is 1920 units wide however
many real pixels it is drawn into, so `88` means *88 on a full-size slide*
and shrinks with the window. The **floor** is where that shrinking stops —
without one, body text on a phone came out at 12 real pixels.

**To make everything a tenth bigger**, multiply every size by 1.1. **To make
one thing bigger**, change one line.

### Three kinds of chapter mark, and how to switch

`chapter-name-graphics` comes in three versions.

| version | what it is |
|---|---|
| `graphics-inside` | the lights are **inside the letters**, and nothing else on the slide is painted. The default |
| `graphics-outside` | the lights fill the **whole band** and the letters are cut out of them, edges faded |
| `graphics-none` | **no lights at all** — the chapter's name set like every other heading, in the same colour, and nothing moves |

#### Switching — on the slide's own line

**This is the one to use.** Write `variant:` beside the template, in
`content.js`, and that slide uses that version:

```js
{ template: 'chapter-name-graphics', copy: 'slide-04',
  variant: 'graphics-outside' }
```

Or write the version's name as the template, which does exactly the same
thing:

```js
{ template: 'graphics-none', copy: 'slide-04' }
```

**The three names** are `graphics-inside`, `graphics-outside` and
`graphics-none`. The `graphics-` in front is optional and the case does not
matter, so `outside`, `Graphics-Outside` and `graphics-outside` are all the
same answer. **Anything it does not recognise falls back to
`graphics-inside`** — a typo should cost you the version you wanted, not the
slide.

#### And a default for a whole study, if you want one

A slide that says nothing asks the page. So one line in the study's own
`theme.css` sets the version for every chapter mark that has not named its
own:

```css
:root { --cs-chap-version: outside; }     /* inside · outside · none */
```

**The slide's line always wins over this.** It is only there so a study with
twenty chapter marks does not need the same word written twenty times. Leave
both out and you get `graphics-inside`, which is what these slides have
always been.

#### The band — how tall it is, and whether its edges melt

Both of these belong to `graphics-outside` and are ignored by the other two.

**How far it spreads above and below the text** is one line in `theme.css`:

```css
:root { --cs-chap-pad: 52px; }     /* 40 to 64 is the range it was drawn for */
```

It is in real pixels rather than design units on purpose — it is a judgement
about how a band looks, not about the 1920-wide grid — so it does not shrink
with the window.

**Whether the left and right edges fade into the page** is on the slide's own
line:

```js
{ template: 'chapter-name-graphics', copy: 'slide-04',
  variant: 'graphics-outside', fade: false }
```

Left out, the edges fade — the band reads as weather passing behind the page.
`fade: false` leaves it with its own hard edges and rounded corners, reading
as a card of sky. The two are different enough to be worth choosing between.

#### Setting the colours, separately

The lights take their colours from the slide's `graphics:` list if it has one.
**If it does not, they come from whatever the page says** — so you can set them
in `theme.css` too, beside the version:

```css
:root {
  --cs-chap-version: inside;

  --cs-chap-1-vivid: var(--cs-sun);      /* first light  */
  --cs-chap-2-vivid: var(--cs-water);    /* second light */
  --cs-chap-3-vivid: var(--cs-forest);   /* third        */
  --cs-chap-4-vivid: var(--cs-moon);     /* fourth       */
}
```

**One to four names.** There are always four lights; with fewer named they
repeat, paired across the orbits so a colour never meets itself in the middle.
Name none at all and you get the study's own two accents.

**The first one is special** — it is also the ground the other three move
across, so it decides the chapter's overall mood as well as being a light.

Any of the seven: `--cs-sun` · `--cs-fire` · `--cs-water` · `--cs-forest` ·
`--cs-stone` · `--cs-mist` · `--cs-moon`. Or any colour at all; they are only
CSS values.

#### The letters have no outline

They did, when a measurement said the colours were too faint. They do not any
more: a chapter name is lit and nothing else. **The measurement still runs** —
it just says so in the console now instead of quietly drawing a line, which is
worth more, because a silent fix hides a bad colour choice for ever.

What it asks is whether **the ground** — the colour a letter is wherever no
light is passing — can be read against the page. The lights themselves are
highlights: a bright spot inside a letter no more stops it being a letter than
a shine on a car stops it being a car. The ground is the one that matters, and
it is what a reader who has asked for less motion sees, frozen.

### The ten named roles — your typography sheet

These are the names on `typography-specs`, and each does exactly what the
sheet says and nothing else. **These are the ones to reach for.**

| role | what it sets | size |
|---|---|---|
| `case-study-title` | the title of the case study. Only that | 132 |
| `case-study-tagline` | the line right under that title | 40 |
| `case-study-pills` | the pills naming a study's characteristics | 24 |
| `accordion-header` | the header of an accordion | 40 |
| `slide-title` | a slide's own heading, full width, every template **except** `rule-title` | 88 |
| `carousel-header` | the line over a carousel that changes with the picture | 40 |
| `explains-section-header` | a section heading **inside** the explains component | 40 |
| `section-header` | a section heading anywhere else: `context-1`, `context-2`, `sections`, numbered-grid cards | 40 |
| `caption` | anything under a picture, a carousel or a prototype | 32 |
| `chapter-name` | a chapter mark: `chapter-name-graphics` **and** `rule-title` | 132 |

**Seven of those numbers are exactly what those elements had**, so nothing
moved. Three are choices:

- **`chapter-name` is 132, not 88.** The `rule-title` dividers keep what they
  had and the `chapter-name-graphics` slides come up to meet them. Those are
  the one heading whose letters have something moving inside them, so the
  extra size is doing a second job: the lights get more room to read.
- **`carousel-header` is the same as `section-header`.** It was body size in
  the body hand, deliberately quietened years ago because a tinted band at
  lead size competed with the diagram under it. The fill and the centring
  stay off; only the size and the hand come back up. If it starts competing
  again, `--t-carousel-header` is the one line to turn down.
- **`case-study-tagline` is split from `lead`.** The two used to share a
  role, so moving the tagline moved every lead paragraph on the site.

**`case-study-pills` keeps the rounded body face**, not the handwritten one
you would guess from their size. They were the only thing on the site asking
a *colour* file for a font instead of asking a role; that happened to resolve
to the body face, and they keep it until you say otherwise.

### The roles still waiting for a name

Everything your sheet does not mention is still wearing the abstract names
the site used before. Five of them want a name from you — `h1` (an impact
line, a quote), `lead` (a lead paragraph on an ordinary slide), `body`,
`body-sm`, `meta` — and two are structural: `h2` (the drawer title, a panel
heading) and `h3` (a tile's name, a grid's column heads).

Four now have no users left at all and are kept only so nothing breaks if
something still asks: `display`, `title`, `chapter`, and the `lead` role's
old job on the hero.

### The eleven older roles

| role | what it sets | size |
|---|---|---|
| `display` | the hero title | 132 |
| `h1` | an impact line, and a quote | 88 |
| `title` | **a slide's own heading, on every template** | 88 |
| `chapter` | **a chapter mark** — the heading on a `chapter-name-graphics` slide | 88 |
| `h2` | the drawer title, the hero's second line, a panel heading | 56 |
| `h3` | a sub-heading, a tile's name, a persona's section titles | 40 |
| `lead` | a lead paragraph | 40 |
| `body` | running text | 30 |
| `body-sm` | dense or secondary text | 25 |
| `caption` | the line under a picture | 32 |
| `meta` | small print, counters, labels | 24 |

**`chapter` is new on 7 November and starts at exactly what it had.** A
chapter mark is the one heading on the site that is not announcing a slide —
it announces a *stretch* of them — and it used to borrow `title`, so making a
chapter louder meant making every slide heading louder too. Now
`--t-chapter` is its own line: take it to 132 and only the chapter marks
grow. Measured: chapter 54.5px → 81.7px in a 1440 window, every other role
unmoved.

It is also the one role whose letters have something moving inside them, so
size is half of how clearly the lights read; the other half is the type
weight, which is not a knob.

**`title` and `h1` hold the same number, and that is a default rather than a
link.** A slide's heading used to borrow the `h2` role, which it shared with
the drawer's title and the hero's second line — so there was no way to move a
slide heading without moving those two with it. Now `--t-title` is its own
line: take it to 56 and only the slide headings come down.

**Caption and meta look big in that table** because both are set in Caveat, a
handwritten face with a small x-height. At the same nominal size it reads
about 15% smaller than the rounded body face beside it, so a 32 caption next
to 30 body reads a shade *smaller* — which is what a caption should do. Move a
role to a different hand and check its size again: the two columns are not
independent.

### What the knobs do not reach

The **hand per role** reaches everything set through a role — every heading,
paragraph, caption and label a template draws. It does *not* reach the page's
own furniture: the password screen, the loader, the light/dark switch, the
prototype frame's chrome. Those ask for one of the three hands directly,
because they are not a role in the story; they are the building. Change a
hand itself and they follow; change a role's hand and they do not.

**Line height, tracking and weight** are still in `type.css`, just below the
import, under *how each role is set*. They are typesetting rather than scale.

**Colour** is in `system/css/cs-tokens.css`, with the study's two accents.

### If the file goes missing

Every size on the site falls back to the browser's 16px, everywhere, at once.
That is deliberate: the alternative was a second copy of every number in
`type.css` as a safety net, and a second copy drifts — you would change a size
and see no effect, with nothing to tell you why. Loudly broken beats quietly
wrong. The two files travel together in every bundle.

---

## The chapter mark with motion in its letters

`template: 'chapter-name-graphics'` — from the sheet of 6 November. One
filled band across a strip, the chapter's name in the middle of it, and the
letters are a **window**: what you see inside them is something moving behind.

```
┌────────────────────────────────────────────────┐
│                                                │
│        C h a p t e r   N a m e                 │   1840 × 490
│        ^ the letters are a hole                │
└────────────────────────────────────────────────┘
```

Your sheet's numbers were already the house numbers: 1844 × 489 drawn is
1840 × 490 built — the content width inside the usual 40 of padding, at
exactly the 570 of every other strip.

### What to write

```js
// content.js
{ template: 'chapter-name-graphics', copy: 'slide-04',
  graphics: [ 'sun', 'mist', 'water' ] }
```

```js
// copy.js
'slide-04': { title: `Chapter Title With Motion Graphics` }
```

`graphics` is a list of palette words — **as many as you like** — from the
seven: `sun`, `fire`, `water`, `forest`, `stone`, `mist`, `moon`. Two makes a
quiet piece and five a busy one.

**Leave `graphics` out** and the study's own two accents are used, so the
slide still has colours without anybody choosing any.

**A word that is not one of the seven** is dropped and the console says so.
The accent picker on `<html>` cannot complain — a stylesheet has no way to —
but this list is read by code, so it can.

### The band

The page's own raised surface, not an accent. That was a decision: the moving
colours inside the letters are the loud thing on this slide, and a bright band
would compete with the one thing the slide exists to show.

### Changing what moves

The motion is **one fenced block** in `system/css/cs-slides.css`, under
`THE MOTION`, marked at both ends. Replace what is between those two lines and
the effect changes completely without another rule being touched.

**What is in there today is the lights** — soft coloured lights drifting and
merging on a dark ground, built from your `tm-glow.css`. Before 9 November it
was the clouds from your `tm-clouds.css`; swapping one for the other touched
nothing outside the fence, which is what the fence is for.

A replacement can count on:

| | |
|---|---|
| `.cs-chap-paint` | the canvas. In `graphics-inside` this IS the letters, and whatever you set as its `background` shows through them; in `graphics-outside` it is a layer filling the band. **Paint this, not the heading** — that is what makes one motion serve both variants |
| `.cs-chap-band` | the box behind them, 1840 × 490 units, `position: relative`, `overflow: hidden` |
| `--cs-chap-1` … `-N` | the colours this slide named, in order |
| `--cs-chap-N-vivid` | the same at full strength |
| `--cs-chap-n` | how many there are |
| `var(--u)` | one design unit, for anything that should scale |

**Two rules a replacement has to keep.** A slide may name two colours or five,
so do not assume a count. And **paint only with the named colours, or declare
what you mixed** — see the next section.

#### The lights, and their knobs

| Knob | Default | What it does |
|---|---|---|
| `--cs-chap-speed` | `1` | `2` is twice as fast, `0.5` half. The loop is **8 seconds** |
| `--cs-chap-light-l` / `-c` | `1.06` / `1.05` dark · `0.50` / `1.25` light | how bright and how colourful the four moving lights are, as a multiple of what the palette draws |
| `--cs-chap-ground-l` / `-c` | `1.10` / `1.05` dark · `0.30` / `1.20` light | the same two numbers for the ground they move across |
| `--cs-chap-pad` | `52px` | `graphics-outside` only — how far the band spreads above and below the text |

**Every colour the slide names is a light.** `graphics: ['sun', 'mist']` gives
two lights that drift and merge; four names give four. There are always four
lights on the canvas — with fewer names they repeat, paired across the orbits
so a colour never meets itself in the middle — which is why two colours still
fill the letters rather than leaving half of them dark.

**The ground is the chapter's first colour**, so a chapter marked `forest`
sits on a deep green and one marked `fire` on a deep red. It is the first
colour rather than a neutral for one reason: the ground *is* the letter
wherever no light is passing, and a neutral ground is a neutral letter.

##### Why there are brightness knobs at all, and why they are not a mix

The same four colours have to do two opposite jobs:

- in `graphics-inside` **on the near-black page** they have to be *bright*,
  because the letters are made of them
- in `graphics-inside` **on the cream page** they have to be *dark*, for
  exactly the same reason
- in `graphics-outside` they have to be dark on **both** pages, because there
  the letters are a near-white shape cut out of them

The obvious way to dim a colour is to mix it with a dark one. That is what
this did for two rounds, and it is what made everything look dull: mixing
lands you somewhere *between* two colours, and a dark navy is very nearly
grey, so every step toward it is also a step toward grey. Four ambers and reds
taken halfway to navy and added together came out **brown**. No amount of
speed or size was ever going to fix that.

The knobs above do something different. `oklch(from <colour> …)` takes a
colour apart into **how bright** it is, **how colourful** it is and **which
colour** it is, and lets each be changed on its own. So a light goes to half
brightness at *more* than its own colourfulness and what comes out is a deep
saturated version of itself — the difference between a dimmed lamp and a grey
one. `1` means "exactly as the palette draws it"; below `1` on the brightness
is darker; above `1` on the colourfulness is what stops a darkened colour
going grey.

Measured, worst of the seven colours in each case, against the 3.0 that text
this size needs:

| | near-black page | cream page |
|---|---|---|
| `graphics-inside` — ground against the page | **3.70** (`mist`) | **13.96** (`moon`) |
| `graphics-outside` — letters against the brightest point of the band | **3.89** (`moon`) | **3.89** (`moon`) |

**`graphics-outside` is a night in both themes**, which is the one place the
two variants disagree about their own colour, and it is not a style choice.
With the band left at full strength the near-white letters measured **1.22**
against a `moon` band and **1.92** against a `sun` one — a white word on a
pale sky, which is no word at all. It happened to look right in the one colour
it had been tested with, `water`, which is mid-toned. A template that works in
one of its seven colours does not work.

**They merge because of `screen`, and because each light is narrower than the
box it is in.** Screen *adds*, so where two lights cross you get the two of
them together rather than the top one hiding the one beneath. The reason it
washed everything to paper on the first attempt was not screen — it was that
each light was wider than the whole box, so all four covered all of it all the
time, and every colour everywhere is pale grey. A light now wants to be
**narrower than its box and taller than it**, and to travel far enough to
leave: that is what makes something arrive and go, which is what reads as
movement. `--tmg-w` / `--tmg-h` and `--tmg-rx` / `--tmg-ry` on `.cs-chap-paint`
are those four numbers, and `graphics-outside` sets its own, because the band
is four times wider than a word and percentages of the two are not comparable.

**The sweep is at a sixth, not a third** (and half that again wherever the
paint has to stay dark). The sheen passing across once a loop is the part of
this that tips into gaudy. At the original strength it reads as a shine effect
going over a logo, which is a louder idea than lights moving behind glass.

**What it looks like, honestly.** These letters are thin — it is a hand-drawn
face, not a poster weight — so in `graphics-inside` what you see is colour
*moving* through them rather than lights you could point at. The
`graphics-outside` variant is where this motion really shows, because there it
has a whole band to be weather in.

**One thing it cannot do.** On a near-black page the ground is the first
colour at full strength, and screen adds, so a *second* colour of a very
different hue reads less as its own hue and more as a brightening — four
lights on an amber ground come out as amber and cream rather than as amber,
red, blue and white. If you want the four hues clearly distinct in
`graphics-inside`, the ground has to stop being one flat colour and start
drifting through all four. Say the word and it is about twenty lines plus a
fresh measurement.

**There is no outline on the letters.** See "The letters have no outline"
above: the measurement still runs, and now it warns rather than drawing.

**Someone who has asked for less movement** gets the lights *still*, not gone
— the first frame, which is a complete picture and a readable heading.

#### If your motion mixes colours of its own

The lights take the colours the slide named and mix three more: the night
they sit on, that night lifted by the sheen, and the first light lifted by the
sheen — between them the darkest and the brightest the letters ever get. Those
are on the screen as much as the named ones, so a check measuring only the
named ones would be measuring one thing while the page showed another.

**So a motion declares what it mixed**, on the band, numbered from 1 with no
gaps:

```css
.cs-chap-band {
  --cs-chap-extra-1: var(--tmg-base);
  --cs-chap-extra-2: color-mix(in oklab, var(--tmg-base) 84%, #fff);
}
```

and the outline check measures those after the named colours. That is the
whole contract: **paint with the named colours, and declare anything else you
mix.** A gap in the numbering ends the list, so number them straight through.

One mechanical trap, because it cost an afternoon: declare these on
`.cs-chap-band`, not on `.cs-chap-title`. A custom property does not flow
*upward*, and one that names nothing reads back as an empty string rather than
complaining — which makes a check that is measuring nothing look like a check
that is passing.

**`background-clip: text` clips a background.** Gradients, animated
background-position, layers — all fine. An SVG, a canvas or moving divs are
*elements*, not a background, and a background clip cannot reach them; showing
those through the letters means masking instead, which is about fifteen more
lines. Ask and it goes in.

### When the letters get an outline

A letter filled with a moving colour has no colour of its own, so the engine
measures **every colour the slide can be filled with** against the band, once,
before anything moves — and gives the letters a thin outline if any of them is
too faint, saying in the console which one and what it measured.

Not per letter and not per frame: the letters are filled by a background, and
there is no way to ask the page what colour a background is at a point without
redrawing the whole thing into a canvas every frame. An outline that came and
went as colours drifted past would also be worse than either state.

**As the palette stands, this never fires** — all seven clear 3.0 against the
band in both modes, measured. It is there for a colour that does not: one of
the `-vivid` strengths, a new palette entry, or a different band.

---

## The hero's opening line, as one sentence or as a row

`lead` in `copy.js`. Write it as a line and it is a line, exactly as before:

```js
'study': { lead: `Both case studies on this planet start from the same day.` }
```

Write it as a **list** and each entry becomes a piece of a single row, with a
thin rule standing between them:

```js
'study': { lead: [ `12 weeks`, `4 teams`, `1 shipped product` ] }
```

Use it for a handful of figures, or for short phrases that should read as
separate things and as one statement at the same time.

**The spacing is what holds them together and the rules are what tell them
apart** — in that order. The gap between pieces is smaller than the band the
hero gives this line, so the row reads as one block before you notice it has
parts. Each rule sits exactly halfway between its two neighbours, because the
gap and the padding are the same number; give it only one of the two and every
rule hugs the piece on its right and looks attached to it.

**The rule is a border, not a typed `|`.** A pipe character in the words is
*read out* by a screen reader, once per gap, which turns a line of figures into
a line of noise. It also sits at whatever height the drawn face happens to put
it, where a border is a line and sits where it is told.

**Where the row sits across the slide** is one line in the study's `theme.css`:

```css
:root { --cs-hero-lead-align: center; }    /* left is the default */
```

**On a phone they stack**, and the rules go with the row — four figures of one
word each with a rule between every pair is more rule than writing. The gap
does the separating on its own there, and it is a tighter gap than the one
above and below the block, so they still read as one thing.

**One thing to know about long pieces.** The row wraps, and a piece that lands
at the start of a second line keeps its rule, which reads as a list continuing.
If that ever looks wrong on a real slide, there are two ways out — let the row
scroll instead of wrapping, or let each piece become its own narrow column —
and both are a few characters. Say which you would rather have.

## One surface, everywhere

A card, a tile, a pill, a person's panel, the circle behind a carousel arrow,
an accordion header — every raised block on the site is now the same colour,
written once:

```css
:root {
  --cs-surface: color-mix(in oklab, var(--cs-accent-2) 11%, transparent);
  --cs-surface-edge: var(--cs-bg-2);
}
```

**They used to be `--cs-bg-3` at full strength**, or two-thirds of it, and at
that strength a page with six of them reads as six boxes before it reads as
anything you have written. This is the accordion header's wash exactly — a
tenth of the study's second colour over whatever is behind it: enough to say
*this is a thing*, not enough to be the first thing you see.

**It follows the study's accent**, which is the one consequence worth knowing:
a study whose second colour is amber gets amber-tinted surfaces, not green
ones. For neutral surfaces whatever the study, that one line becomes
`color-mix(in srgb, var(--cs-bg-3) 55%, transparent)` and nothing else
changes.

### The edge, and why it is not the ink

Every surface carries a hand-drawn edge, and it is drawn in
`--cs-surface-edge` — a step up from the page — rather than in the colour the
words are written in. In the reading colour it is a dark ring the same weight
as the writing inside, so the boxes arrive before the words do. A step up from
the page it is still there, still hand-drawn, and sits behind what it holds.
That rule already governed the tiles and the numbered cards; it now governs
every surface, in one place in `cs-components.css`.

**A small round control gets a finer, steadier pen.** The page's pen wanders
2.5px, which on a card 600px wide is a hand and on a circle 60px across is a
scribble — the same wander is a twentieth of one edge and a tenth of the
other. `.cs-arrow-mark` and `.cs-pager-play` halve it.

### The one surface that clips itself

The explains panel — the scrolling column beside a person on `persona`, and
beside a stepped drawing on `title-steps` — had the attribute and had the
SVG, and showed no edge at all.

**The drawn layer normally hangs three pixels *outside* the element**, so the
whole wavering line clears the box even where the box cuts off what is inside
it. This panel sets `overflow: hidden` — it has to, or the scrolling column
would run past its rounded corners — and `overflow: hidden` cuts off the drawn
layer along with everything else. All four sides were being trimmed away.

**`--cs-stroke-out` is how far out the line sits, and a negative value puts it
that far in.** Four pixels in is enough that the pen's wander never reaches the
edge that clips — and it keeps the line clear of the scrollbar down the
right-hand side, which was the original reason this panel had no outline at
all.

Worth knowing for any future surface that clips its own contents: the symptom
is an element that *has* `data-cs-stroke` and *has* a `.cs-stroke` child and
still shows nothing.

### A drawn edge on a box that positions its own children

Putting `data-cs-stroke` on a container does one thing beyond drawing the
line: `cs-strokes.css` gives **every child** `position: relative; z-index: 1`,
which is how the content is kept above the drawn layer — `z-index` does
nothing to an unpositioned box.

That rule is heavier than a plain class, so **it overrides an `absolute` the
component had set on one of its own children**, silently, with nothing in the
console. The explains panel positions its scroller absolutely on purpose — the
one line that makes the panel a fixed-height window with a scrollbar instead
of a box that grows — and a drawn edge quietly undid it: the writing stopped
scrolling, started being cut off, and the panel went back to growing with its
content.

**Two things now stop it happening again.**

The panel says `position: absolute` a second time with three classes
(`.cs-persona-explains > .cs-persona-explains-scroll.dc-scroll`) so it
outweighs the stroke layer — and the phone block answers at the same weight,
because a media query adds no weight of its own and the phone deliberately
puts the scroller *back* into the flow.

And `cs-scrollers.js` now **says so out loud**: if a watched box has more
content than room and still is not scrolling, it warns with the element. Cut
off writing with no scrollbar is the one failure on these slides that a reader
cannot see is a failure.

### If the scroll watcher never loads

A watched box rests at `overflow: hidden` on purpose — a scroll container with
nothing to scroll swallows the wheel — and that resting state is only safe
because `cs-scrollers.js` is there to lift it. Without that file, `hidden`
crops.

So the script puts `cs-scrollers-on` on `<html>` before it measures anything,
and until it appears every watched box is `overflow: auto`. The failure mode
becomes a scrollbar that did not need to be there, instead of writing nobody
can read.

### What was deliberately left alone

Three kinds of fill still use `--cs-bg-3` at full strength, because they are
not surfaces — they are **states**, and a state has to be able to shout: a
selected tab, a selected tile, a pressed toggle and the rail's hover. The
overflow menu keeps its solid fill too: it floats over other content, and a
faint one would let that content read through it.

### The carousel arrow's triangle

It used to be a box with `clip-path: polygon(...)`, which is a knife — three
points as sharp as geometry can make them, and no CSS property softens them.
Nothing else on this site has a corner like that.

It is now an SVG polygon **stroked in its own colour with a round join**: the
stroke follows the outline and the join rounds every turn, so the triangle has
three soft corners and still only one colour. The points are pulled in by half
the stroke width so the rounded shape comes out the size the sharp one was.

## The hero, as the sheet of 10 November draws it

```
+--------+-------------------------------+
| image  |  the title and its sub-line   |   365 tall
+--------+-------------------------------+
|  the description, the full width       |   240
+----------------------------------------+
|  the tags, the full width              |   240
+----------------------------------------+
|  the long drawn band                   |   111
+----------------------------------------+
```

**What moved.** The picture used to stand on the *right*, three columns wide
and as tall as everything beside it. It is now on the **left** and only as tall
as the title band — and the description and the tags, which used to be squeezed
into the nine columns left over, run the **full width** of the slide.

**The title and its sub-line are left-aligned**, which the sheet asks for in
writing. Centred, the title and the sub-line each find their own middle and the
two left edges disagree; beside a picture with a hard left edge of its own,
that reads as a third edge nobody meant to draw.

**The sheet's pixels are rows and columns, not one-off numbers.** The content
area is 1840 × 1000 with a 32 gutter, so a column is 124 and a row is 97:

| the sheet | on the grid |
|---|---|
| 365 tall | 3 rows — 3 × 97 + 2 × 32 = 355 |
| 240 | 2 rows — 2 × 97 + 32 = 226 |
| 240 | 2 rows |
| 111 | 1 row — 97 |
| 1376 wide | 9 columns — 9 × 124 + 8 × 32 = 1372, leaving 3 for the picture |

**Why the tags' two-row band matters beyond the drawing.** The hero's eight
rows are equal rows, so the tallest decides all eight — which is what makes a
*single*-row band dangerous: anything in it needing more than its share drags
every other row up with it. Two rows and a gutter give the pills about 226px of
band, against 97 when they wrap to a second line and 158 when they wrap to a
third. There is room for four lines of pills before the band is the thing
asking for more, so nothing here has to be made content-sized and the hero
keeps the sheet's proportions whether a study has three tags or nine.

## The hero's pills

### How far apart they sit, and why the two numbers differ

| | |
|---|---|
| across | 28 units, about 17px |
| down | 40 units, about 25px |

They used to be 16 units both ways — about 10px — and **a drawn line sits 3px
outside its own box on every side**, so two stacked rows had four real pixels
between one wavering edge and the next. They were not almost touching; in
places they were touching.

**Across** is clear of the 22 units a pill carries inside itself, so the space
*between* two pills is plainly bigger than the space *inside* one and the eye
has something to divide them by.

**Down is half as much again**, and that is the part it is easy to get wrong by
making the two equal. A row of pills is a *line* of things; for the eye to see
two lines rather than one block, the step down to the next line has to be
unmistakably longer than the step sideways to the next pill — otherwise it
starts reading them in columns, or in no order at all. Equal gaps in a wrapping
row are the classic way to lose the reading order.

**And it is still one group.** 25px is well under the band of air the hero
leaves above and below the whole block, so the pills read as one set rather
than two.

**The tags' row is now as tall as the tags.** The hero's eight rows are equal
rows, so with the pills wrapped to two lines every row became as tall as the
tag block — giving them more air would have grown the title's four rows along
with them, one extra line of pills buying four extra lines of hero. Rows 7 and
8 are their own height now and the six above share what is left
(`--cs-slide-rows` on `.t-hero`). Same fix as the wrapping heading, read from
the other end of the slide.

### A shape with no line round it

A pill is now **the same language as a numbered-grid card** — literally the
same fill, `color-mix(in srgb, var(--cs-bg-3) 65%, transparent)`, so changing
one moves both — **and no outline at all**: no CSS border, and no drawn one
either. The `data-cs-stroke` that used to go on every pill in
`cs-templates.js` is gone with it. The edge of the fill is the edge.

**A pill cannot carry the page's pen.** It is 1.7px wide and goes round twice
at 2.5px of wander; on a box 38px high that is a line as tall as a letter's
stem, and at that size the drawing stops reading as a hand-drawn edge and
becomes the loudest thing in the row. Thinning it and tinting it to the fill
helped and did not fix it — a ring is still a ring, and what the sheet draws is
a block of colour that simply stops.

On the cream page the fill composites to `rgb(220, 234, 207)` against
`rgb(252, 249, 217)`, which is the swatch to within a point on each channel.
The words against it measure **5.16 on the dark page and 5.18 on the cream
one**, at 15px, where small text needs 4.5.

### The band at the foot, and why the drawing came out small

The hero closes on a long low band — the ornamental separator, `separator:` in
content.js — and the same band appears on its own as `rule-title`. The empty
box filled the slide's width; the drawing that replaced it did not. It arrived
smaller, sometimes a third of the width, floating in the middle of the room
the box had been holding.

**A slot letterboxes, and that is usually right.** Once a slot knows the shape
of the drawing in it, it keeps that shape and sits the drawing centred in the
space it was given — exactly the way a film sits on a television. Better a
smaller picture than a squashed one, and the layout never moves when the
picture arrives.

**A separator is not a picture in an area — it is the area.** Its row was one
eighth of a slide, about 58px, so the drawing was being fitted into *58px of
height* and whatever width that left it. A band drawn 1840 × 111 came out 965
wide where there was room for 1188; a band drawn with any air above and below
it — 1840 × 300, say — came out barely 350. The flatter the drawing, the less
wrong it looked, which is why it read as a scaling glitch rather than an
obvious fault.

**So a separator is the one slot that works the other way round.** It fills
the band's **width**, and the band takes the drawing's **height**. The hero's
last row is `auto` so it can do that (`--cs-slide-rows` on `.t-hero`: six
equal rows, then the tags and then the band, each its own height), and
`.cs-rule-slot` drops its fixed 111px the moment it knows its drawing.

**With a cap, so nothing can break.** `--cs-band-max` is 320u, about a fifth
of a slide. A drawing taller than that is fitted inside the cap in the old
way — it stops short rather than eating the slide. A separator exported with a
page of empty space around it will hit this; the fix is to crop the file, and
the cap is only there so a bad export is untidy instead of ruinous.

**The empty box now keeps the sheet's own 1840 × 111 proportion**, so the gap
you see before a drawing exists is the gap the drawing will fill.

## The accordion stack

`template: 'strip-fancy-accordion'` — from the three sheets of 6 November. A
square drawing at the head of a panel, and under it a column of accordions.
Press a title and it opens on a body of writing, with drawings standing
between its paragraphs.

```
[img]   a line of writing beside the square

(+)  Accordion #1                      closed: the title only
(−)  Accordion #2                      open
     a paragraph
          [ a drawing ]
     another paragraph
(+)  Accordion #3
```

**There is no panel around any of it.** There used to be: a filled, rounded,
hand-drawn box holding the whole stack. The sheet draws the pieces sitting on
the slide itself, so the fill, the drawn edge and the padding inside it all
came off together — a box with no fill but an outline and an inset is still
visibly a box, it just looks like an empty one.

### What to write

```js
// content.js — the shape
{ template: 'strip-fancy-accordion', copy: 'slide-05',
  title: null,
  media: 'slide-05_img-01',
  headFill: false,                    // optional — see below
  accordions: [ 'intake', 'triage', 'draft' ] }
```

```js
// copy.js — the words
'slide-05': {
  headNote: `The line of writing beside the square at the head.`,
  accordionWords: {
    intake: { label: `How a case arrives`, body: [
      `The first paragraph.`,
      { kind: 'image' },
      `The one after the drawing.`
    ] },
    triage: { label: `Who picks it up`, body: [ `…` ] },
    draft:  { label: `What gets written`, body: [ `…` ] }
  }
}
```

**The accordion names need quotes in `copy.js`.** `acc-01:` without them is a
syntax error that takes the whole file down — see *A name with a hyphen in it
needs quotes* near the top. `'acc-01':` is correct. In `content.js` they are
already strings inside a list, so nothing to do there.

**`accordions` is the shape and `accordionWords` is the words**, two names on
purpose — one name in both files would collide in `fill()` and the loser would
vanish with nothing said. The same reason `steps` and `stepWords` are two names
on the flow chart.

**`title: null` is the sheet as drawn** — no heading above the panel. Leaving
`title` out is different and still asks for one, naming the block it is waiting
for. One is a decision, the other is a to-do. `media: null` and
`headNote: null` work the same way and remove the square and the note.

### The line of writing beside the square

`headNote` in `copy.js` — body copy, and it takes everything a body takes: one
line, a list of lines, pieces. It sits **to the right of the square**, and its
left edge starts hard against the drawing rather than floating in the middle of
the column (`.cs-body` centres its own measure by default, which is right
across a slide and wrong in a narrow column beside a picture).

**It is anchored to the base of the square**: its last line and the bottom edge
of the drawing sit on one horizontal, and everything above that is air.
Centred — where this started — the note moves up and down as it gets longer or
shorter, so two of these slides side by side would have their writing at two
different heights and neither would line up with anything. On the foot of the
square, a one-line note and a four-line note both end on the same line, and
that line is an edge the drawing already has. A note taller than the square
makes the row taller instead, and the square then sits against its top.

With `media: null` the note has the row to itself; with `headNote: null` the
square does; with both `null` there is no row at all.

### Two kinds of header

| | |
|---|---|
| `headFill` left out | a **faint wash** of the study's second colour behind the whole header row — the circle and the title together, as the first sheet draws it |
| `headFill: false` | **nothing behind them** — the circle and the title on the page, as the second and third sheets draw them |

```css
/* a study that wants one of them everywhere says so once, in theme.css */
:root { --cs-fancy-fill: off; }
```

The slide's own line always wins over that.

**The title is flush left in both**, where it used to be centred in a filled
bar of its own. Centred, a row already carrying a circle at its left end gives
the stack two left edges — the circles on one line and the first letter of
every title on another that moves with the length of the title. Left-aligned,
one vertical edge runs down the whole stack.

**The old fill was the accent at full strength**, which made four closed
accordions read as four buttons shouting at once. At a tenth it marks the row
as pressable and nothing more, and the title can then be the accent colour
itself rather than the colour that survives being printed on it. Measured,
title against the page: 3.91 on the dark page and 4.75 on the cream one, at
24.8px, where text that size needs 3.0.

**The row itself has no fill or drawn edge any more either.** Both belonged to
a filled panel; with the fill moved to the header, the drawn edge was putting a
pen line around a paragraph, and a filled row would have made the two header
versions look identical — the row is already filled whatever the header does.

### Drawings between the paragraphs

Write `{ kind: 'image' }` wherever one should stand. As many as you like, in
any order among the writing — which is the whole of "how many, and where".

**The names follow from where they stand**, so the count and the list cannot
disagree:

```
slide-05_intake_img-01
slide-05_intake_img-02
```

Numbered even when there is only one, the same as `views: 1`. To name one
yourself, `{ kind: 'image', media: 'whatever_img-01' }` — and a name you wrote
is never touched. A `caption:` on the piece puts a line under it.

`node tools/slide-map.js <study>` lists them all.

### How it behaves

| | |
|---|---|
| on arrival | the first one is open, the rest closed |
| press a closed one | it opens and whichever was open closes |
| press the open one | it closes, and none are open |
| scroll away and back | it is as you left it, for this visit only |
| keyboard | Tab to a title, Enter or Space to open, ↑ ↓ Home End between them |

### The slide has no height of its own

It is the only one here that does not. Every other slide is 1080 design units,
or 570 for a strip, because every other slide holds a fixed amount. This one
cannot: four closed accordions are short and one open accordion is not, and a
fixed height would give you a crowded stack or a lake of empty space under it
depending on what the reader last pressed. So the slide is exactly as tall as
what is in it, and the page grows as it is read.

### One line in `index.html`

The behaviour lives in a new engine file, and a study's page has to be told
where it is. Next to the other engine scripts, after `cs-tabseries.js`:

```html
<script src="../../system/js/cs-fancy.js"></script>
```

**It is optional, and the slide is not broken without it.** Each accordion is
a real `<details>`, so opening, closing, the keyboard and what a screen reader
announces are the browser's own and need no script at all. That one file adds
only the three things `<details>` has no opinion about: one open at a time,
remembering which, and re-measuring the page after its height changes. Forget
the line and you get a working stack of accordions that all open independently
and forget themselves — not a blank slide, and not a page that refuses to
start.

---

## Turning a phase off, and putting it back

A chapter that comes in two editions is written as a **tab series** — one
entry in `content.js` that names its phases:

```js
{ group: 'tab-series', id: 'cs-phases', label: 'Which phase to read',
  tabs: [ 'phase-01', 'phase-03' ] }
```

**To take a phase out for now, take its name out of that list:**

```js
  tabs: [ 'phase-01' ]                       // 'phase-03' parked
```

or, so you can see what is waiting to come back:

```js
  tabs: [ 'phase-01' /* , 'phase-03' */ ]
```

That is the whole change. **Nothing else moves.** The phase's folder stays
where it is, its two `<script>` lines stay in `index.html`, its drawings stay
in `assets/`. Putting it back is the same one word in the other direction.

### With one tab there is no bar

A tab bar with a single tab in it asks the reader to choose between one
thing, which reads as something half-built rather than as something
deliberate. So the bar is **not drawn at all**, and the phase's slides simply
carry on down the page as part of the story.

It is the same decision the page already makes at the top: a study with no
`nutshell` list gets no *In a nutshell / The detailed story* bar either.

**The chapter is still there in the markup** — the section, the body and the
pane — which is exactly why putting the second phase back costs one word.

**And no seam shows.** The gap between slides is one token, `--cs-view-gap`,
asked for by the view, by the tab series' body and by its pane. Measured in
both modes at three widths: the same number above the chapter, inside it and
below it.

```
   two tabs                      one tab
   ───────────────               ───────────────
   slide 8                       slide 8
   [ Phase 1 ][ Phase 3 ]  <-    phase 1 · slide 01
   phase 1 · slide 01            phase 1 · slide 02
   phase 1 · slide 02            phase 1 · slide 03
   …                             slide 9
   slide 9
```

### What stays per-phase even with one tab

The phase keeps everything that makes it a phase, so that nothing has to be
renumbered or renamed when the second one returns:

| | |
|---|---|
| its own `copy.js` | `slide-01` in there is still the phase's own block |
| its own drawing names | still `phase-01_slide-03_img-01` — see below |
| its own numbering | its slides count 1…n within the phase |

The numbering is invisible — it is a spoken label for a screen reader, not
something printed on the slide — so a reader never sees the count restart.

---

## Drawings inside a phase

A slide that says `views: 5` never names its five drawings — the names
**follow** from the slide, so the count and the list cannot disagree:

```
slide-03  +  views: 5   ->   slide-03_img-01 … slide-03_img-05
```

Each phase numbers its slides from 01, so without help phase 1's third slide
and phase 3's third slide would both ask for `slide-03_img-01`. One name, two
different drawings, and whichever file is in `assets/` wins for both — with
nothing on the page or in the console to say so.

**So the phase's name goes in front, automatically:**

```
phase-01_slide-03_img-01
phase-03_slide-03_img-01
```

To use a shorter one, say so on the phase in its own `content.js`:

```js
CS.TABS['phase-01'] = {
  label: 'Phase 1',
  slotPrefix: 'p1',        // -> p1_slide-03_img-01
  slides: [ … ]
};
```

Leave `slotPrefix` out and it is the phase's own name. Write `slotPrefix: ''`
and there is no prefix at all — only safe while one phase has drawings.

**Only the names you cannot see are touched.** A drawing you named yourself on
a slide's line — `media: 'whatever_img-01'` — is left exactly as you typed it,
and a slide with its own `slotBase` is left alone too.

### And the files go in the phase's own folder

A phase is meant to be a folder you can open on its own, and pictures were
the last part still landing in the study's one heap:

```
case-studies/<study>/phase-01/assets/phase-01_slide-03_img-01.png
```

Nothing has to be told that. The slot's name already begins with the phase's
prefix, and the prefix **is** the instruction about which folder to look in.

**The study's own `assets/` is still tried afterwards**, and that is
deliberate rather than indecisive: a drawing already sitting there keeps
working exactly as it did, and can be moved into its phase's folder whenever
that is convenient instead of all in one go. A file in the phase's folder
wins, so moving one is a copy and a delete with nothing to re-type.

**Hover an empty box** and it tells you every folder it looked in, in order.
The box itself still prints only the *name*, because a whole path inside a
small square spills out of it on a phone.

### A phase may describe its own drawings too

The study's `media.js` describes the study's drawings. A phase that needs to
say something particular about its own — a ratio, a poster, a link, a note
— may do it beside its own slides:

```js
/* phase-01/media.js */
CS.TAB_MEDIA = CS.TAB_MEDIA || {};
CS.TAB_MEDIA['phase-01'] = {
  'phase-01_slide-06_prototype-01': { kind: 'local', src: '…' }
};
```

loaded in `index.html` right after that phase's `copy.js`:

```html
<script src="phase-01/media.js"></script>
```

**No such file is a perfectly good answer.** A phase whose drawings need
nothing said about them — just a file in a folder — needs no `media.js` at
all, because a drawing left under the slot's own name is found without an
entry.

Unlike every other list a phase owns, these **are** merged into one map, and
that is safe here where it is not safe anywhere else: a media map is keyed by
*slot* names, and a phase's slots already carry the phase's name, so two
phases cannot file anything under one key even by accident. Where both
describe the same slot, the phase's entry wins.

---

## The flow-chart slide

A diagram of steps. Press one and the picture below it changes, with its
own title underneath and — when that step has more than one drawing — a
counter and a click area either side.

Rebuilt 5 November from *Updated Flow Chart Template (with image
carousel)*. It used to be a **line** of steps; it is a **diagram** now,
which is a different thing in five ways: it can loop back on itself, a
step can lead to more than one other step, every join shows its direction,
a step can be a box of smaller steps, and a step can have a carousel of
drawings rather than one.

```
 ●───▶───●───▶───◉───▶───●───▶───●───▶───●──┐
Step 1  Step 2  Step 3  Step 4  Step 5  Step 6
  ▲             ^showing          ┌──────────┤
  │   ┌──────◀──────────┬─────────┘          │   ┌───────────┐
  └───●  Step 10        ▼                    └──▶│  Step 7   │
                        ● Step 8  ◀──────────────│ a         │
                        │                        │ collective│
                        ▼                        │           │
                        ● Step 9  ◀──────────────└───────────┘

  ◀ │ ┌──────────────────────────────┐ │ ▶     the picture, with a click
    │ │   the drawing for Step 3     │ │        area either side
    │ └──────────────────────────────┘ │
          the title that goes with it
          1 out of 3 diagrams
```

### The shape goes in content.js

**One row** — the way it has always been, and still the common case:

```js
{ template: 'flow-chart', copy: 'slide-07',
  steps: [ 'intake', 'triage', 'draft' ] }
```

With one row and no `links`, the steps join up left to right, which is
what a flow chart with one row has always meant.

**Several rows** — a list of lists. `null` leaves a gap, which is how a
step sits under the fourth column rather than the first:

```js
steps: [
  [ 'intake', 'triage', 'draft', 'review', 'approve', 'publish' ],
  [ null, 'archive', null, 'rework',
    { id: 'checks', collective: [ 'legal', 'risk', 'credit' ] } ],
  [ null, null, null, 'reject' ]
]
```

**A collective** is one step that is a box of smaller ones:

```js
{ id: 'checks', collective: [ 'legal', 'risk', 'credit' ] }
```

The **box** is what the lines reach, not the steps inside it — that is
what makes it read as one place in the flow that happens to have parts,
rather than three loose steps that happen to be near each other. What a
reader presses is a step *inside* it, because that is the thing with a
drawing.

**A carousel** is a count on the step:

```js
{ id: 'draft', shots: 3 }
```

### The joins go in `links`

```js
links: [
  [ 'publish', 'rework' ],
  { from: 'publish', to: 'checks', out: 'right', in: 'left' },
  { from: 'checks',  to: 'rework', out: 'left',  in: 'left' },
  { from: 'checks',  to: 'reject', out: 'left',  in: 'left' },
  [ 'rework', 'reject' ],
  [ 'rework', 'archive' ],
  { from: 'archive', to: 'intake', out: 'left', in: 'up' }   // the loop
]
```

A plain `[from, to]` pair is the short form. Leave `links` out entirely
and every row joins itself up left to right, as before.

**Two directions describe a line completely**: the way it **leaves**
(`out`) and the way it **arrives** (`in`). Both are `'up'`, `'down'`,
`'left'` or `'right'`, and both are directions of *travel* — so
`in: 'left'` means the line is still heading leftward when it reaches the
step, and therefore touches that step's right-hand side.

| | |
|---|---|
| same axis both ends | three segments: out to a lane, along it, and in |
| different axes | two segments: along one, then the other |

Left unwritten, `out` is worked out (straight if the two line up,
otherwise toward the other one's row) and `in` copies `out`.

**Why two and not one.** One direction leaves the other end to be
guessed, and the guess is wrong often enough to matter. A join leaving
leftward might want to come *up* into the step from below — which is how
the loop back to the start is drawn — or to come in *from the side*,
which is how the collective reaches the steps beside it. Same `out`, two
different pictures, and nothing in the geometry says which.

**There is no obstacle avoidance, on purpose.** A router clever enough to
find its own way round is a router that quietly re-routes when you add a
step, and a diagram that rearranges itself is worse than one you nudge.
If a line crosses something it should go round, say which way it leaves.

### The words go in copy.js

```js
'slide-07': {
  title: 'How a case gets opened',
  stepWords: {
    intake: { label: 'Request', title: 'The empty queue' },
    checks: { label: 'Checks' },
    legal:  { label: 'Legal',   title: 'The legal review' }
  }
}
```

`label` is the name under the dot; `title` is the line under the picture.
A collective's `label` is the name above its box.

**`steps` in content.js and `stepWords` in copy.js is deliberate.** One
name in both files would collide in `fill()`, and the loser would vanish
with nothing said.

### The drawings

One per step, named from the step's own id:

```
phase-01_slide-07_legal_img
```

A step with `shots: 3` gets numbered ones instead, using the same rule
every other carousel here uses:

```
phase-01_slide-07_draft_img-01
phase-01_slide-07_draft_img-02
phase-01_slide-07_draft_img-03
```

The two are spelled differently on purpose: a step that has always had one
drawing keeps the name that drawing already has on disk, so nothing has to
be renamed to upgrade the rest of the slide.

`node tools/slide-map.js <study>` lists them all, collectives and
carousels included.

### How big the picture is

**1840 × 1000 as a ratio, not as a height.** The sheet says *"keep the
image dimensions as 1840 × 1000 px, keep the ratio consistent"* — and with
a click area either side the drawn picture is narrower than 1840, so a
fixed height would simply be the wrong shape. Make the artwork 1840 × 1000
and the slide keeps that proportion at every width, on a laptop and on a
phone.

The counter and the two click areas are **hidden, not removed**, for a
step with a single drawing. Removing them would mean the stage changing
size as you stepped from a step with three pictures to one with a single
picture — and a picture that moves when you press *next* is a picture you
have lost your place in.

### On a phone

The steps stack down the page in the order they are written, a collective
indents and keeps its box, and the click areas stay — narrower, at 40px,
because there is no pager here and they are the only way through a step's
drawings.

**The joins are not drawn.** A diagram that loops and branches needs two
directions to be read in, and a phone has one. The routes were written for
the wide arrangement — *leave rightward*, *come in from below* — and in a
single column those directions describe nothing; drawn anyway, they come
out as lines straying across the labels, which looks like a fault rather
than a diagram. So there is a **spine** instead: one line down the steps,
broken where a collective sits, because the box is on the line rather than
beside it. The order is honest, every name is there, and the joins that
cannot be shown are not shown rather than shown wrongly.

Nothing is told about this. The dots are measured and asked which way they
spread.

### The lines are drawn, not built

An SVG path per join, laid under the steps after they have been measured.
The first sheet asked for a line with "no predetermined length", and a
border always has one. Add a step, move a row, drag the window narrower:
the steps land somewhere new and the lines are simply drawn again through
them.

**The arrowhead sits at the middle of the last segment**, so it always
points the way the line arrives. On a straight join between two steps that
is the middle of the whole line, which is where the sheet draws it; on a
routed one it is just before the step it reaches, which is also where the
sheet draws it. One rule, both answers.

### The legacy branch shape still works

```js
steps: [ 'p', 'q', { branch: [ [ 'r' ], [ 's' ] ] } ]
```

A fork that keeps its first track on the rail and hangs the rest below.
It now produces **links** like everything else rather than being a shape
the drawing code has to recognise — which is why that code got smaller
when the diagram got bigger.
---

## The transition strip

`template: 'strip-transition'`. The handover from one use case to the next.
From the sheet "Slide-Strip-Transitionary".

```
┌──────────────────────────────────────────────────────────┐
│  MMM-YYYY                                                │
│  Use-Case #2: Name of Use-Case                           │
│ ──────────────────────────────────────────────────────── │  the rule,
│                           Use-Case #3: Name of Use-Case  │  exactly
│                                            MMM-YYYY      │  halfway down
└──────────────────────────────────────────────────────────┘
```

1920 × 570, which is the strip height this site already has, and 40 units
of padding, which is the slide padding it already has. Nothing new had to
be invented for the box.

### What to write

```js
'slide-12': {
  from: { date: `Aug-2026`, name: `Use-Case #2: Checking a covenant` },
  to:   { date: `Nov-2026`, name: `Use-Case #3: Building a projection` }
}
```

`from` and `to` rather than four flat keys, because this slide *is* a
handover and the two halves are the two sides of it.

**Either half may be left out** — the first transition in a study has
nothing to come from, and the rule simply has one side. Either half may
also carry a name without a date, or the other way round. Nothing is
required except that there be something; a slide with neither half says
what to write instead.

### What the arrangement is saying

**Above the rule is what you are leaving, written from the left. Below it
is what you are entering, written from the right.** The eye travels down
and across, which is the movement the slide is describing.

**The names hug the line and the dates sit outside them** — date then name
above, name then date below. The two halves are mirror images, and the two
things the line actually joins are the two nearest it. Read it the other
way round and the line appears to join two dates.

**The colours are the study's own two**, and which gets which is not
arbitrary: the names take accent 1 and so does the rule, because the rule
and the names are one thought; the dates take accent 2, because they are a
second kind of label running alongside. Same division the grid slide
makes — one accent per direction of labelling.

### The rule draws itself in

As the strip arrives, the line grows from left to right: the slide's one
movement, and the thing it is about. **No JavaScript** — it is tied to
where the strip sits in the viewport rather than to a clock
(`animation-timeline: view()`), and a browser without that never enters the
block and simply gets the line already drawn. Switched off entirely under
*reduce motion*.

### Two things that are easy to get wrong here

**The rule is centred by construction, not by luck.** Three rows,
`1fr auto 1fr`, with the top half standing on the rule and the bottom half
hanging from it. A flex column centring the *stack* would only put the rule
in the middle when both halves happened to be the same height — which they
are not the moment one name wraps or one date is missing. Checked with
five variants including one empty: the rule lands at 284 of 570 every time.

**`align-self` changes axis on a phone.** In the three-row grid it is
*vertical* — it is what stands one half on the rule and hangs the other
from it. The moment the container becomes a flex column for the phone, the
same property means *horizontal*: `end` pushed the whole top half over to
the right and shrank it to the width of its own words. Same declaration,
different axis, nothing to say so. It is reset in the phone block.

---

## The impact + grid slide

`template: 'impact-grid'`. A statement across the top, and the `grid` table
under it. From the sheet "Impact + Grid Slide Template".

```
┌────────────────────────────────────────────┐  40 padding
│                                            │
│              Impact text                   │  1840 × 365
│                                            │
├────────────────────────────────────────────┤  16 gap
│  Phase │ Item │ Problem │ Timeline         │
│  ──────┼──────┼─────────┼──────────        │  1840 × up to 619
│   …    │  …   │   …     │   …              │
└────────────────────────────────────────────┘  40 padding
```

40 + 365 + 16 + 619 + 40 is 1080, which is the slide, exactly.

### What to write

```js
'slide-11': {
  impact: `One sentence worth the top of a slide.`,
  headers: ['Phase', 'Items', 'UX Problem Statement', 'Timeline'],
  legend:  ['Carried into the build', 'Parked for later'],
  groups: [ { name: `Phase 2`, items: [ … ] } ]
}
```

**The grid half is the grid slide's, undiluted** — the same `headers`,
`groups`, `items`, `legend`, the same cell shapes, the same `mark: 1` tints,
the same pinning. One builder draws both, so a change to one is a change to
the other and they cannot drift apart.

**No title.** The statement is the title; a heading above a statement is the
same job done twice. Write `title` here and it is ignored, deliberately,
rather than quietly squeezing the table.

**No impact line is always a mistake**, never a decision — the band is 365
units whether or not there is a sentence in it. The slide says what to write
instead of sitting there blank, the same way a prototype slide does when no
prototype is named.

### The grid hugs, but only so far

The sheet asks for a height that hugs its contents, and for a short table
that is right: three rows in a box built for twelve leaves a hole
underneath, and a hole under a table reads as a table that is missing
something.

But a grid that hugs **without a ceiling** is a grid whose header and frozen
columns quietly stop pinning — they stay put by being *stuck inside a box*,
and a box that grows to fit whatever is in it never has an inside. So it
hugs up to 619 units and then stops. Short tables hug; long ones pin;
nothing has to be chosen slide by slide.

What it does *not* do is make the slide taller. Every slide here is
1920 × 1080 and the tabs, the parallax and the scroller all count on it.

### One trap worth knowing about, which is not this slide's fault

`--u` is a **container query unit** and `.cs-slide` is the container — so
inside a slide, `--u` measures the slide *minus its own 40-unit padding*.
Everything written as `calc(N * var(--u))` on a slide's child therefore
comes out 4.3% smaller than N.

Nowhere else does it show, because everywhere else the numbers are relative
to each other and shrink together. Here the three heights have to add up to
the slide exactly, and 4.3% of 1000 units is 43 units of daylight at the
bottom. So the rows are written as **percentages** — 36.5%, 1.6%, 61.9% —
which resolve against the slide's content box and are therefore exact.

The slide's own height and padding stay in `--u`, and correctly: a property
on the container itself measures the container *above* it, which is the full
1920.

---

## A prototype that plugs itself in

A slot whose name ends `_prototype-NN` and that **nothing in `media.js`
mentions** now looks for a folder named after itself:

```
prototypes/<this study>/<the slot's own name>/index.html
```

So a prototype slide printing

```
phase-01_slide-06_prototype-01
```

is filled by putting the page at

```
prototypes/case-study-two/phase-01_slide-06_prototype-01/index.html
```

and **writing nothing anywhere else.** No `media.js` line, no path typed
out twice.

**Why this is the default now.** The commonest entry in `media.js` was
pure bookkeeping — a path spelled out of the slot's own name:

```js
'phase-01_slide-06_prototype-01': {
  kind: 'local',
  src: '../../prototypes/case-study-two/whatever/index.html' }
```

Two names that have to agree, written in two files, with nothing to catch
it when they stop agreeing. That is the hyphen-instead-of-an-underscore
mistake waiting to happen again. The slot already prints the name it
wants, so naming the folder is a copy and a paste.

### What a prototype slide is made of

The sheets of 3 November draw it twice, once with a carousel and once
without, and the two are the same object with one part missing:

```
┌──────────────────────────────────────────┐
│  What we finally built                   │   the slide's title
├────┬────────────────────────────────┬────┤
│ ◀  │                                │ ▶  │   click areas - only when
│    │         the prototype          │    │   there is more than one
│    │                                │    │
├────┼────────────────────────────────┼────┤
│    │  Prototype title               │    │   prototypeTitle
│    │  1 out of 2 prototypes ⟳ Reload│    │   the foot
└────┴────────────────────────────────┴────┘
```

**The click areas run the whole way down**, past the prototype and past
the two lines under it. They used to stop at the stage, because the
counter sat under the carousel rather than inside it. Stopping short is
both wrong to the drawing and worse to use: the easiest thing to aim at
for "next" is the big empty rectangle beside the prototype, and it should
not run out halfway.

**Without a carousel there are no strips and the stage takes the full
width.** That falls out for free - it is the same column either way, and
only the carousel puts anything beside it.

**The window keeps 1440 x 1024** in both, which is what the sheet asks
for. Measured: 1.407 against 1.406.

#### Naming the prototypes — `prototypeTitle`

The line under the window is yours to write, in the slide's own copy
block, under the name the sheet gives it:

```js
'slide-06': {
  title:          'What we finally built',
  prototypeTitle: 'The comparison flow'
}
```

**Two lines of writing, and they are different things.** `title` is the
band across the top and says what the section is about. `prototypeTitle`
is the line directly under the window and names the thing *in* the
window — which is the one that changes as the reader steps.

With more than one prototype, write it as a list, in the order the
windows step:

```js
'slide-06': {
  title:          'What we finally built',
  prototypeTitle: ['The comparison flow', 'Performance to plan']
}
```

One property for both cases, rather than a singular and a plural that
can disagree with each other and with `views:`. A slide holding one
prototype simply uses the first entry. Leave it out and the line does
not appear at all — no gap held open under the window.

*(`prototypeTitles` and the older `titles` are still read, so nothing
written before this stops working. `prototypeTitle` is the name to use.)*

**It is set in `font_kk_version_1`**, not in the display face the rest of
the slide uses — the sheet names the face and the difference is doing
work: the band at the top is the section speaking, and this line is the
prototype itself being labelled, in the same hand the prototypes are
drawn in. The face is carried as text in `common/face-kk.css`, which the
case studies link and the landing page does not, because a font written
into a stylesheet is downloaded whether anything uses it or not.

#### The foot: the counter and the reload button

**The counter says it in words** — "1 out of 2 prototypes" rather than
`1 / 2`. A fraction reads as a fraction; this is a position in a set. It
has no arrows of its own either: the two click areas are the way through,
and a second pair underneath was two controls for one job. It is drawn
only when there is more than one prototype, because "1 out of 1" is not
an address, it is a shrug.

**The reload button is always there**, with one prototype or with six.
What it does is the whole thing again from the top: the loader plays a
second time and the prototype behind it is built fresh — back at its
first screen, with whatever the reader had typed or opened in it thrown
away.

That is the point of it. A prototype is a thing people poke at until it
is in a state nobody meant, and before this the only way back was to
reload the entire case study.

**Why the whole thing and not just a refresh of the frame.** Setting the
iframe's source again reloads the page inside it, but it does not put
the loader back — the reader would be looking at a frozen prototype for
however long it takes, with nothing on screen to say why. Rebuilt from
the resting panel, a reload looks exactly like arriving at the slide for
the first time, which is the only thing it could sensibly look like.

**It acts on the prototype being shown**, so on a slide with two the
other one is left exactly as the reader left it. And a slot with
`loader: false` still resets — it just comes back as the press-to-start
panel it would have been, with no animation over it.

### The loader, and why the button went away

A prototype slide used to sit there showing a button until somebody
pressed it. Now, the moment the slide is **55% on screen**, an orbit
loader starts, the prototype begins loading behind it, and when both are
done the loader wipes away to reveal a running prototype. One movement,
no click.

**It only ever touches prototypes.** The loader looks for
`.cs-proto-window` and nothing else. A drawing, a photograph, a video, a
flow chart — none of them get one, because none of them has anything to
wait for.

**The percentage is a sweep, not a measurement, and that is worth knowing.**
An iframe will not tell you how far through it is; there is no such
number to read anywhere in a browser. So the bar is an eased sweep over
2.8 seconds, exactly as the design mockup drew it. What IS honest is the
leaving: the loader does not go until **both** the sweep has finished and
the prototype has actually fired its `load`. A slow prototype holds the
loader past 100%; an instant one still gets the full play, because a
flash of spinner reads as a glitch where a held beat reads as deliberate.

**The cost, and the off switch.** Loading on scroll means a reader going
through a long case study starts every prototype on the way past, and
each one is a live iframe. Two things hold that down: each starts once
and only once, and only at 55% visible. If that is still too much for a
particular slide:

```js
'phase-01_slide-06_prototype-01': {
  kind: 'local',
  src: '…',
  loader: false          // back to the press-to-start button
}
```

**Someone who has asked for less movement** gets the loader calmed, not
removed — it is the thing saying *wait*, so taking it away would lose the
message. No boil, no spin-away, no hatched wipe; the rings slow to a
crawl, the percentage still counts, and the reveal is a plain fade.

### The window has no drawn outline

A prototype window is the one slot on the whole site that is **not** given
the hand-drawn line.

Everything else on a slide gets one, because a photograph or a diagram
dropped onto the page has no edge of its own, and the drawn line is what
makes it a thing resting on a sheet rather than a hole cut in it.

A prototype is not that. It is a screen — it arrives with its own border,
its own background and its own corners, drawn inside it by its own
stylesheet. A second line round the outside reads as a frame round a
frame, and on a prototype slide, where the window *is* the slide, that
doubled edge is the first thing the eye lands on.

**The slot is marked, not the thing inside it.** The element that would
carry the outline is built deep inside the slot and rebuilt every time the
slot changes what it holds — a poster now, a running prototype after the
first click, the second prototype after an arrow press. Taking the outline
off that element would work once and be undone by the next rebuild.
Marking the slot, which is never rebuilt, holds for everything ever put
inside it.

If you ever want a region of a slide drawn plainly, that is the same one
attribute:

```html
<div data-cs-no-stroke>   <!-- nothing beneath this is drawn -->
```

### media.js still wins

This is a **fallback for slots nobody mentioned, never an override.** An
entry you wrote on purpose can't be quietly replaced by a folder someone
left lying about. Keep using `media.js` whenever the slot needs something
*particular*:

```js
'phase-01_slide-06_prototype-01': {
  kind: 'local',
  src: '../../prototypes/case-study-two/shared-flow/index.html',
  ratio: '1440 / 1024',
  renderWidth: 1440,
  startLabel: 'Run the prototype',
  poster: 'assets/flow-poster.png'
}
```

— a ratio, a poster, a different start label, or **one page shared by two
slides**, which a folder name alone cannot express.

### Paths inside the prototype

The folder sits two deep under `prototypes/`, so the repository root is
`../../../` from its `index.html` — the same depth whatever the folder is
called. A prototype using the lofi-DS-1 kit links it as
`../../../lofi-ds-1/css/…`, and that keeps working when the folder is
renamed to match a different slot.

---

## Words inside a phase

**A phase's slides read only that phase's `copy.js`.** `slide-03` in
`phase-01/copy.js` is phase 1's third slide and has nothing to do with
`slide-03` in `phase-03/copy.js`, or with `slide-03` in the study's own
`copy.js`.

This used to be softer, and it was a bug worth understanding, because it is
the kind that does not announce itself. A block a phase did not have was
looked for in the study's `copy.js` as a fallback — and the study's
`copy.js` has `slide-01` to `slide-22` in it. So a phase slide whose block
had not been written yet did not come up empty. It came up holding a
*completely different slide's* words, and nothing said a thing.

A missing block now comes up **empty**, and the empty thing names the file
and the block it wants:

```
title → phase-01/slide-03
```

with the same sentence in the console:

```
[case study] phase-01/copy.js has no block called "slide-03"
```

### What does still come through from the study's copy.js

Four lists, and only these four:

| List | Keyed by |
|---|---|
| `captions` | the drawing's own name |
| `questions` | the drawing's own name |
| `bodies` | the drawing's own name |
| `labels` | the tab's or section's own id |

Each is a flat map from a **name** to a line of words, and those names are
unique across the whole study — two phases cannot have the same drawing. So
these cannot collide by accident the way slide numbers can. A phase may add
its own entries to any of the four, and where both name the same thing, the
phase's entry wins.

The rule in one line: **shared things are keyed by a name, slides are keyed
by a number, and only the named things cross between files.**

**The empty box always prints the whole name it is waiting for.** Copy what
the box says; that is the filename. Which folder it goes in depends on whose
slide it is — a phase's drawings go in the phase's own `assets/`, see
*Drawings inside a phase* above — and hovering the box tells you. If the box
and your file disagree, the box is right.

---

## Everything a phase slide shows lives in the phase folder

A phase folder held its running order and its words, and that looked like
containment until a phase slide needed a **list**. Several slides do not
carry their contents — they **name** a list that lives somewhere else:

```js
{ template: 'wireframe', flows: 'understanding' }
{ template: 'use-case',  groups: ['analysts'] }
{ template: 'persona' }
```

Every one of those used to be looked up in the **study's** `content.js`,
because that was the only place the engine looked. So a phase slide could not
be written without reaching back into the outer file — which is exactly what
keeping a phase in its own folder was for.

**And it failed quietly.** `flows: 'ideation'` with no such set in the study's
`content.js` did not complain. It fell through to the study's plain
`workflows` list, and if there was not one of those either, the slide drew
itself with one empty diagram and a counter reading **1 of 1**. Nothing on
the page or in the console said the set had never been found.

### Write the lists in the phase

A phase's `content.js` may now carry any of them itself, written exactly the
way the study's `content.js` writes them:

```js
CS.TABS['phase-01'] = {
  label: 'Phase 1',
  slides: [ … ],

  workflowSets: { understanding: [ … ] },
  userGroups:   [ … ],
  personas:     [ … ],
  drawers:      { detail: { … } }
};
```

and a slide inside that phase reads the **phase's** list.

**Not the study's, and not the study's as a fallback either.** If the phase
declares a list at all, the study's list of that name is invisible to it. Two
lists with one name, one of them silently winning, is the mistake this whole
arrangement exists to prevent — it is the same bug the copy blocks had, in a
different coat.

### Which lists

| On a slide | The list it names | What it is |
|---|---|---|
| `flows: 'x'` | `workflowSets` | the diagram carousels |
| `flows: true` | `workflows` | the study-wide set of them |
| `diagrams: 'x'` | `diagramSets` | the backend slide |
| `groups: […]` | `userGroups` | the faces on a use-case slide |
| *(the persona slide)* | `personas` | the people carousel |
| a word that opens a panel | `drawers` | the drawer's contents |

### Nothing crosses over unless the phase asks by name

A phase that **wants** the study's people rather than its own copy of them
says so in one word, where anyone reading the file can see it:

```js
shares: ['personas', 'userGroups']
```

`shares: true` takes the lot, which is how a phase written before any of this
keeps working untouched.

A list the phase neither declares nor shares is a list the phase does not
have, and asking for a set out of it now **says so**:

```
[case study] phase-01 has no `personas`, and the study's is not shared with
it. Either write `personas` into phase-01/content.js, or add
`shares: ['personas']` there to use the study's.
```

### A named set that is not there now says so

The old silence is gone. A slide naming a set nobody wrote gets the name it
was given and the file that should hold it — the **phase's** file, when the
slide is in a phase, which is the only answer that tells you where to go and
type:

```
[case study] no set of diagrams called "ideation" - write
`workflowSets: { 'ideation': [ ... ] }` into phase-01/content.js, or give
the slide `views: <how many>` instead.
```

### The slide map follows the same rule

`node tools/slide-map.js <study>` and `CS.slideMap()` in the console ask for
each slide's lists the way the **page** asks for them. A map that read the
study's list while the slide read the phase's would report drawings that are
not on the page and miss the ones that are — and the map is what "is this
drawing still used?" gets answered with.

---

## How a slide arrives

Scroll down a case study and each slide comes in from a little below,
invisible, at 98.5% of its size, and settles into place over about seven
tenths of a second. Then it stays there. Scroll back up and it does not
replay.

### What it used to do, and why you could not see it

The page has had a parallax since the first build, and it was almost
invisible — deliberately so, and too much so. Every slide was nudged up or
down and faded by how far it sat from the middle of the screen, *continuously
and in both directions*: a slide faded in as it came up and faded back out
again as it left, for ever. Nothing ever announced itself, because nothing
ever finished.

The new one is an **arrival**: it happens once, it completes, and then the
slide is simply part of the page.

### The 1.5% of scale is the whole trick

A slide that only fades reads as a light being switched on. A slide that also
grows from 98.5% to 100% reads as a sheet of paper being laid down. One and a
half per cent is far too small to notice as a zoom and just big enough to turn
an opacity into an object.

The movement curve is a **deceleration** — quick off the mark, slow as it
lands — so the eye follows the slide to a stop rather than being startled by
it. Measured on slide 3 of the KIMs study, at 1440 wide:

| | opacity | offset | scale |
| --- | --- | --- | --- |
| before it crosses the line | 0 | 40px | 0.985 |
| +120ms | 0.48 | 20.7px | 0.992 |
| +300ms | 0.84 | 6.5px | 0.998 |
| +700ms | 1 | 0 | 1 |

### The three rules it keeps

**1 · Nothing fades while it is being read.** The arrival finishes at full
strength and nothing is animated afterwards, so no text is ever sitting at a
lower opacity than the contrast checks were run against. The old continuous
version could not promise that: a slide parked at the edge of the screen stayed
at 0.58 for as long as you left it there.

**2 · Anything you have already scrolled past is simply there.** A deep link
(`#cs-slide-19`), a reload half way down the page, a fast flick — all of them
land on slides that were never hidden in the first place. An entrance that has
already happened must not be sitting there waiting to happen. Checked: opening
`#cs-slide-19` directly gives a visible slide at full opacity, every slide
above it marked as already-arrived, and only the one still below the trigger
line waiting its turn.

**3 · If the script does not run, nothing is hidden.** Every class involved is
written by `cs-parallax.js`. The stylesheet hides a slide only once the script
has said it intends to show it again — so a reader with JavaScript off gets a
plain page rather than thirty invisible slides waiting for an event that is
never coming.

And `prefers-reduced-motion` turns the whole thing off: no classes are written
at all, so there is nothing to hide and nothing to show.

### On a phone, the cards arrive too

A column of four metric tiles is taller than the screen, so the slide's own
arrival happens entirely off screen above them and the cards scroll past flat.
Each card therefore arrives on its own account — a little faster (560ms) and a
little shorter (24px) than a whole slide, so the two read as one idea at two
scales rather than as two different effects.

**Only on a phone.** On a desktop the slide is one wide object and the cards
are part of it. Widening a window back past 820px takes the card classes off
again, which matters more than it sounds: a card marked on a phone and never
scrolled to would otherwise still be at opacity 0 when the window got bigger.

### The one thing to remember if you change the page in code

**Whatever adds slides must say so.** The watcher takes its list of slides
when it runs; a run of slides swapped in afterwards is invisible to it, and
the symptom is a whole set of slides that never appear at all.

```js
if (CS.refreshParallax) CS.refreshParallax();
```

Three places already do this: the tab series (`cs-tabseries.js`), the fancy
accordion (`cs-fancy.js`), and the view tabs (`cs-views.js`). It is a call
rather than a listener because only the thing that changed the page knows that
it changed — watching for it would mean measuring constantly to catch
something that happens twice in a visit.

### The knobs

All of them in `system/css/cs-layout.css`, under *HOW A SLIDE ARRIVES*:

| What | Where | Now |
| --- | --- | --- |
| how far below it starts | `.cs-slide-wrapper.cs-enter` → `translate3d` | 40px |
| how much smaller it starts | the same line → `scale` | 0.985 |
| how long it takes | the same rule → `transition` | 700ms |
| the curve | the same rule | `cubic-bezier(0.22, 0.61, 0.36, 1)` |
| the same four, for a card on a phone | `.cs-card-enter` | 24px, 560ms |
| how far down the screen it triggers | `TRIGGER` in `cs-parallax.js` | 15% up from the bottom |

---

## How tall a slide is, and how close its writing sits to its heading

### A slide is as tall as what is in it

It used to be 16:9 at minimum, and that is what put a slide's worth of empty
space in the middle of the page. Measured on the analyst primer: a `sections`
slide carrying one short paragraph was **710px tall with about 90px of writing
in it**. Six hundred and twenty pixels of empty slide, then the 45px gap, then
the next slide's title — **677px from the last word of one slide to the first
word of the next**, on a page whose slides are 710px tall.

The gap between slides was never the problem. The emptiness was *inside* them,
and that breaks the one rule the eye reads layout by: things that belong
together have to sit closer than things that do not. With 620px of nothing
under a paragraph and 45px between slides, the page was saying the opposite —
every heading looked more closely related to the slide **below** it than to its
own writing.

**Two things were holding a slide open, and removing either one alone does
nothing at all.** The 16:9 minimum height, and `repeat(8, 1fr)` — which are
*equal* rows: the browser sizes every `1fr` row to whatever the tallest one
needs, so a 64px section title made all eight rows 64px and the slide could
not come out shorter than about 710px whatever the minimum said. Both had to
go together.

Now a row holding a title is as tall as the title, a row holding nothing is
nothing, and the slide is the sum of them. `--cs-slide-min` in `cs-tokens.css`
is the floor underneath that, so a slide carrying two words is still a page
rather than a band of text:

```css
:root { --cs-slide-min: calc(440 * var(--u)); }   /* about 290px */
```

Raise it toward `1080` and the page goes back toward uniform 16:9 panels.

Measured after, same page: the `sections` → `title-figure` join went from
**677px to 251px**, and the whole primer went from 7,673px to 5,450px without
a word being cut.

### Picture slides are not in this yet, and why

**A picture slot on this site has no size of its own.** It fills whatever area
the grid hands it — nothing anywhere says how tall a picture is. Take the
grid's height away and those slots collapse: tried and measured, a picture
slide went from 710px to 284px with the picture inside it *gone*.

So the rule asks, with `:has()`, whether a slide contains anything that was
relying on the grid for its height, and leaves those slides exactly as they
were. They were not the ones leaving holes anyway — a picture slide's empty
bottom measured 26–109px against a text slide's 620.

**To shrink those too, every picture slot needs a proportion of its own** — an
`aspect-ratio` saying "this one is 16:9", "this one is 4:5". That is a decision
about how the drawings should look rather than a bug to fix. Say what the
proportions should be and the same treatment extends to every slide on the
site.

### A heading that wraps must not stretch the whole slide

`1fr` rows are *equal* rows: the browser sizes all eight to whatever the
tallest one needs. Row 1 is the heading on most templates, so **a heading that
wrapped onto a second line made every row 129px instead of 64** — and the
slide went from 710px to 1225px. One extra line of heading bought six extra
lines of empty slide, and the picture under it was stretched to match.

Measured, the same slide with a one-line and a two-line heading:

| | one line | two lines |
|---|---|---|
| before | 710px | **1225px** |
| after | 697px | **697px** |

The fix is **one track, not all eight**: row 1 becomes its own height and the
other seven go on sharing what is left.

**It is named template by template rather than set for everything**, because
it is only right where row 1 holds one thing that stops at row 2. Where
something *spans out of* row 1 — the hero's title across rows 1–5, the pair
band, the stepped slide's head — an `auto` first row collapses to nothing and
squeezes that span into fewer tracks, which made two slides **taller**:
measured, `pair-section` 710 → 768 and `title-steps` 697 → 831. Those keep
eight equal rows.

The list lives in `cs-slides.css` as `--cs-slide-rows`. To add a template to
it, check one thing: **does row 1 hold a single item that stops at row 2?**

### Strips, chapter marks and the dead gutters

A strip is a shallow band rather than a page, so it gets its own floor —
`--cs-strip-min`, about 240px — and it **centres** what is in it rather than
starting at the top.

**It used to be pinned to four equal rows**, on the reasoning that a band has
a fixed depth. That was the same arithmetic mistake as the eight-row one: four
*equal* rows are all as tall as the tallest, so a chapter name of two lines
made every row 94px and the band came out **489px deep with the name floating
in the upper third** — 140px of nothing above it and 255 below, on a slide
whose whole job is to say one chapter name. Now: 232px, with the name centred.

**A chapter mark gets no floor and one row.** Its painted band *is* the slide.
The row part matters as much as the floor, and it is a trap worth knowing: an
empty grid row costs nothing, but **the gap on either side of it still costs a
gutter**. A band sitting in row 1 of four was carrying three dead gutters —
63px — underneath it, which is exactly the gap that was appearing between a
chapter mark and the slide after it. Measured now: 26px above the band, 26px
below, and nothing else on the slide.

**Two things that look like pictures and are not asking the grid for a
height**, so they do not hold a slide open:

- `.cs-rule-slot`, the drawn band over a chapter name — it is 111 design
  pixels tall, full stop, and says so itself
- `.cs-stage--band`, a stage that *centres* what is in it instead of
  stretching it, so whatever sits there brought its own height. Leaving it in
  the list cost one slide 496px of nothing: a row of tiles 240px tall sat in
  the middle of a 736px area with its heading a quarter of a slide above it.
  That slide is now 400px with the tiles one gutter under the heading

### A chapter mark is found by its band, not by the template's name

`.t-chapter-name-graphics` was the selector placing the band on the slide, and
that had been quietly wrong since the three versions got names of their own: a
slide written `template: 'graphics-outside'` carries the class
`t-graphics-outside`, never matched the rule, and its band **lost its column —
it came out as a 60px sliver down the left of the slide** instead of a band
across it. Everything now matches `:has(> .cs-chap-band)`, so all three ways of
writing a chapter mark behave the same.

### Writing sits one gutter under its heading

The rule, everywhere: **the body starts one grid gutter (`--cs-gutter`, about
21px) below the bottom edge of its heading, and sits at the TOP of its space,
never centred in it.** Centred, a short paragraph sat halfway down a seven-row
column with its heading three rows above — further from the thing it belongs to
than from the slide below.

Changed to match: `title-split`, `pair-split` and `strip-section`. Left
centred on purpose: the big one-sentence statements (`impact-text`,
`strip-text`), captions, and headings inside their own row — a statement alone
on a quiet slide wants air on both sides, which is what `--cs-slide-fill:
center` on that template says.

### The two-section column beside a picture

`context-1` and `context-2` used to pin their headings and paragraphs to four
separate rows of the slide, which meant **the picture's height decided how far
apart they sat**: a 4:5 drawing on a 1225px slide put the second section most
of a slide below the first, with a hole between them.

They are now one column — `.cs-context-col` — and three things follow from
that:

- the sections sit at a distance they choose: one gutter from a heading to its
  own writing, three between one section and the next, whatever the picture does
- the column is **centred against the picture**, as a block
- **every line starts on the same left edge.** Section titles are centred
  everywhere else on the site, which is right across a slide and wrong over a
  narrow column beside a drawing — a centred heading over left-aligned writing
  gives the block two left edges and no axis at all

Measured: all four pieces at x = 831, column centre offset from the picture's
centre = 0.

## Every template, and what it looks like

Thirty-five of them. A template belongs to the **engine**, not to the study
that happened to need it first — anything here can be used by any case study.

`strip` in the last column means a short slide, about four rows tall, rather
than a full one.

### The opening and the ending

| template | what it looks like | notes |
|---|---|---|
| `hero` | big title, subtext under it, a row of drawn tags, a drawing to the right, and a long low band closing the slide | the first slide of every study. `lead` written as a list becomes a row of figures with rules between them |
| `strip-back` | one wide drawn band; the whole thing is the link back to the worlds | strip. the last slide |

### A heading and a picture

| template | what it looks like | notes |
|---|---|---|
| `figure` | one drawing filling the slide, with a caption under it. No heading | |
| `title-figure` | heading across the top, drawing under it | |
| `title-figure-caption` | heading, drawing, caption | |
| `title-impact-figure` | heading, then one large sentence, then the drawing | for when a single sentence is the finding and the picture is the evidence |
| `title-split` | heading across the top, drawing on the left, writing on the right | the commonest shape in case study 2 |
| `context-1` | drawing on the left, heading and writing beside it | the column is centred against the drawing and everything in it is flush left |
| `context-2` | the same, with a second heading and body under the first | the two sections stay one block whatever the drawing's height. `media2` turns the second body into a drawing |
| `sections` | two headings with writing under each, stacked. Nothing else | the second is optional |

### Chapter marks and short slides

| template | what it looks like | notes |
|---|---|---|
| `rule-title` | a thin drawn band across the top, the chapter name under it, optional subtext and body | strip. `media: null` removes the band |
| `title-body-rule` | heading, writing, and the thin band *closing* the slide | strip. the same band at the other end |
| `strip-section` | a heading and a paragraph, at strip height | strip |
| `strip-text` | one large statement and nothing else | strip |
| `strip-figure` | one drawing and a caption | strip |
| `strip-transition` | a rule across the middle; the use case you are leaving above it on the left, the one you are entering below it on the right | strip. the handover between two use cases |
| `chapter-name-graphics` | one filled band across a strip with the chapter's name in the middle — and the letters are a window onto something moving | strip. you pick which colours move |
| `impact-text` | one large statement, with a small drawn mark above it | |
| `impact-bg` | one large statement over a full-slide drawing | |

### Stepped — you click through them

| template | what it looks like | notes |
|---|---|---|
| `title-steps` | heading, a question band, a drawing you step through, a counter. `split: 'panel'` puts the explains panel beside it | the question changes with the drawing |
| `wireframe` | a row of tabs, a drawing you step through, a caption | each slide names which set of drawings it shows |
| `title-wireframe` | the same, with a heading where the tabs would be | for a slide showing one set |
| `backend` | a toggle, a diagram stage, a caption | |
| `toggle-figure-section` | a switchable diagram on the left, writing on the right | |
| `persona` | click areas either side of a portrait, a counter under it, and the explains panel beside it, one person at a time | the people are listed in content.js |
| `use-case` | a drawing 1376 × 746 with the details panel beside it — faces, writing, and the assessment strip pinned at its foot. A strip on the edge puts the panel away; the drawing grows to fill the slide | the panel starts **closed** |

### Tables, cards and tabs

| template | what it looks like | notes |
|---|---|---|
| `numbered-grid` | a heading and a row of numbered cards | the numbers count themselves |
| `grid` | a table: a grouping column and an items column that stay put, and as many attribute columns as you like, scrolling sideways | cells hold writing, drawings, or both |
| `impact-grid` | one statement across the top in a 365-unit band, and the same table under it, hugging its rows | the statement is the title — `title` is ignored |
| `feedback` | tabs across the top; under them, rows of numbered cards. The tab decides which body loads | |
| `feedback-detail` | one theme at a time: the band, the drawing and the writing all change together as you step | the companion to `feedback` |
| `pair-section` | a small drawing and a wide golden surface side by side, then a heading and writing under them | the surface can open a drawer |
| `pair-split` | the same band, then a heading, then a drawing and writing side by side | `pair-section` with one row added |
| `logo` | a line of flow tiles running down into a box holding an app's logo, with click areas either side | the app landscape |
| `prototype` | a band, then a window at 1440 × 1024 holding something that actually runs. With `views: 2` it grows click areas either side and a counter under it | Figma, a local page, or a video |
| `flow-chart` | a diagram of steps: press one and the picture below it changes, with its own title and, when it has several drawings, a counter and a click area either side. Loops, branches, joins that show their direction, and steps that are boxes of smaller steps | a journey with stages — and the one place a loop can be drawn |
| `strip-fancy-accordion` | a square drawing at the head of a panel, and under it a column of accordions: press a title and it opens on writing, with drawings standing between the paragraphs | one open at a time. The only slide with no height of its own |
| `placeholder` | an empty drawn box with its own name in it and "structure to come" | deliberately plain, so it cannot be mistaken for finished |

### Which study uses what, today

| study | templates in its running order |
|---|---|
| KIMs dashboard | `figure` ×15, `strip-text` ×4, `numbered-grid` ×3, `title-figure` ×2, `hero`, `persona`, `pair-section`, `sections`, `strip-section`, `strip-back`, `title-steps` |
| the primer | `hero`, `context-1`, `context-2`, `figure`, `title-figure`, `title-figure-caption`, `impact-text`, `sections`, `strip-back` |
| case study 2 | `placeholder` ×10, `rule-title` ×7, `use-case` ×5, `prototype` ×3, `title-split` ×2, `figure` ×2, `hero`, `pair-split`, `persona`, `title-steps`, `grid`, `feedback`, `feedback-detail`, `numbered-grid`, `strip-back` |

**Which words each one takes** is the next section, and
`node tools/copy-keys.js` prints it per template.

---

## "Which words does this template know?"

Every template reads a fixed set of words out of its copy block. Write one it
does not know and **nothing happens, and nothing says so** — the engine never
looks for that word, so there is no error to see. That is the single easiest
way to lose an afternoon with this file.

So the list is not kept by hand. Ask the engine:

```
node tools/copy-keys.js                  every template
node tools/copy-keys.js numbered-grid    just one
```

It reads `system/js/cs-templates.js` and prints, for each template, the words
it asks for — split into the ones you write in **copy.js** and the ones that
go on the slide's own line in **content.js**. It cannot go out of date,
because it is not a copy of the answer; it *is* the answer, read out loud.

What it cannot tell you is the **shape** a word wants — that `items` is a list
and `title` is a sentence. The ones worth knowing:

| word | shape |
|---|---|
| `title`, `subtitle`, `label`, `eyebrow`, `caption` | a sentence |
| `body` | a sentence, a list of sentences for several paragraphs, or the richer pieces above |
| `tags` | a list of short strings — one drawn chip each |
| `items` | see **the numbered slide** below, and **the grid** further down |
| `sections` | `[{ heading, body }]` — a person's panel, or a use-case panel |
| `tabs` | `[{ label, cards: [{ number, body }] }]` — the feedback slide |
| `viewTitles` | a list of names, one per view — see **the carousel's titles** below |
| `questions`, `bodies`, `captions` | filed by the **drawing's name**, not by number — see *Writing beside a stepped diagram* |
| `doorTitle`, `doorBody`, `doorAction` | the golden **surface** band at the top of a `pair-split` slide |

And two names that catch people out:

- a person's second line is **`description`**, not `role`;
- the question band on a `pair-split` slide is **`title`**, while the golden
  band above it is **`doorTitle`**.

### When an empty box is not a missing file

The words in the box are the diagnosis, and two of them mean very different
things.

| the box says | what it means | where to look |
|---|---|---|
| `phase-01_slide-02_prototype-01` | the slide **asked** for that, and it isn't there | `assets/`, or the `media.js` entry's name |
| `no-picture-named` | the slide asked for **nothing at all** | the slide's own line in `content.js` |

**`media.js` alone never makes anything appear.** It describes slots; it does
not ask for them. The slide's line in `content.js` is what asks — `media:` for
one, or `views:` for a run of them — and `media.js` only says what the thing it
asked for *is*. An entry nothing asks for is a label on a shelf in a warehouse
nobody has ordered from: the label is perfectly correct, and nothing ships.

A `prototype` slide that names nothing now says so in plain words instead of
falling back to `no-picture-named`, because for that template it is never a
decision — there is no version of that slide that is finished and empty.

### More than one prototype on a slide

```js
// content.js
{ template: 'prototype', copy: 'slide-02', views: 2 }

// copy.js
'slide-02': { title: 'What we finally built' }

// media.js — one entry per prototype
'phase-01_slide-02_prototype-01': { kind: 'figma', src: '<share link>' },
'phase-01_slide-02_prototype-02': { kind: 'local', src: '../../prototypes/…/index.html' }
```

`views: 2` gives the slide a click area on each side and a counter
underneath, and names the windows from the count — so the number and the
names cannot disagree.

**The middle word is `_prototype-`, not `_img-`.** A drawing is `_img-01`; a
thing that *runs* has always been `_prototype-01` here, and a stepped
prototype slide is no exception just because its names are worked out rather
than typed.

**The windows are kept, not swapped.** Every other stepped thing on this site
puts one box on screen and changes the picture inside it — right for drawings,
wrong here. Swap what is inside a prototype's window and you have *reloaded*
it: back to its first screen, and whatever the reader had clicked their way to
is gone. So each prototype gets a window of its own, all stacked in the same
place, and stepping only changes which one you can see. Step away and back and
it is exactly as you left it.

Nothing is fetched until somebody presses **Run the prototype**, so two windows
built is two buttons, not two downloads.

Leave `views` out and the slide is one prototype with no click areas, exactly
as before.

### The carousel's titles

A `use-case` slide steps through several drawings, and each one has its own
name under it — the line between the drawing and the counter. They are
`viewTitles`, one per view, in the order you step through them:

```js
'slide-03': {
  title: 'Use-Case: Case Comparisons',
  viewTitles: [
    'The empty state',
    'Picking the first case',
    'Two cases side by side',
    'The comparison drawer',
    'Saving the comparison'
  ]
}
```

**Five titles because the slide says `views: 5`.** Write fewer and the ones
you missed say which block they are waiting for; write more and the extras are
ignored. Change `views` and the drawings rename themselves to match, so the
count and the names can never disagree.

**For a slide inside a phase, they go in that phase's `copy.js`** — under the
slide's key there, not in the study's file. The waiting message says which:
`viewTitles → phase-01/slide-03` means *that* file, *that* block.

The titles are plain words, not drawings; nothing to name in `media.js`.

### The numbered slide

**`template: 'numbered-grid'`** — a heading across the top and a row of
numbered cards under it. Slide 10 of case study two is one.

```js
'slide-10': {
  title: 'What I would do differently',
  items: [
    { body: 'The first learning.' },
    { body: 'The second one.' },
    { body: ['This one runs to two paragraphs.',
             'Here is the second.'] }
  ]
}
```

**The numbers count themselves** — 01, 02, 03 … in the order you write them.
Adding a fourth learning is adding a fourth entry; nothing is renumbered and
nothing else has to be told.

**`n` overrides one number**, for when it should say something other than its
place in the list:

```js
{ n: 'Q4', body: 'A question rather than a learning.' }
```

It is `n`, not `number`. Anything else is ignored in silence and you get the
count back — which looks right until the day it does not.

**A one-paragraph item can be a bare string:**

```js
items: ['The first learning.', 'The second one.']
```

**A card can hold points.** A card's `body` is a body like any other on the
site, so anything you can write in a body you can write in a card:

```js
items: [
  { body: [
      `The first learning.`,
      { kind: 'points', items: [
        `what made it true`,
        `what I would do again`,
        `the part that surprised me` ] }
  ] },
  { body: [
      `The second one.`,
      { kind: 'points', items: [
        `the constraint I missed`,
        `how I would catch it earlier` ] }
  ] }
]
```

`points` opens each line with a dash, `questions` with a question mark, and
`numbers` draws an ordered list — the same three everywhere else on the site,
and the same reason for choosing between them: a point is settled, a question
is not, and numbers mean the order matters.

This did not work before 7 November — a card made plain paragraphs and
nothing else, so a list came out as `[object Object]`.

**Three of a body's habits are turned off inside a card**, and you may want
to know why in case you were relying on one: no 62-character measure cap (a
card is already narrow), no automatic side margins (they would float the
writing away from its number), and no indent on a second paragraph (inside a
card two paragraphs are two statements, not one continuous piece of writing).

How many cards sit side by side is the slide's own doing: they lay themselves
out, and on a phone they go one to a row.

---

## "I want to add a drawing"

**You do not edit any file.** Export it, name it after the slot, and put it
in the study's `assets/` folder.

```
the empty box on the page says   slide-06_img-01
you export and save              assets/slide-06_img-01.png
that is all
```

### How a slot is named

```
slide-06_img-01
|        |
|        which picture on that slide — 01 is the first
the slide it sits on, numbered as your deck is
```

Two runs of numbers are not story slides, so they carry their own prefix and
the numbering never has to lie:

| prefix | what it is |
|---|---|
| `slide-NN_img-MM` | the detailed story, numbered as your deck is |
| `nutshell-NN_img-MM` | the short view, "in a nutshell" |
| `drawer-NN_img-MM` | the panels that slide in over the slides |

### Where a number would not say enough

A plain `img-04` says only "the fourth picture on this slide", which is all
you need while a slide holds one kind of picture. When it holds two kinds —
slide 3 has a portrait of each person AND a diagram belonging to each person
— the number stops telling you anything, so the name says what the thing is:

```
slide-03_user-2_collaboration-model
|        |      |
|        |      what it is
|        which person, counting the order content.js lists them
the slide it sits on
```

Use this shape whenever a number alone would leave you guessing. The rule is
the same either way: the file is named after the slot, and the empty box on
screen prints the name it wants.

### Slides with tabs

Where a slide has tabs, and each tab loads its own set of pictures, the tab
goes in the middle:

```
slide-19_tab-03_img-02
|        |       |
|        |       which picture inside that tab
|        which tab, counting from the left
the slide it sits on
```

The numbering starts again inside each tab, so the second picture of the
third tab is always `tab-03_img-02` — whatever the tabs either side hold, and
however many pictures they have.

### One scrolling section can be several slides

The App Landscape in the short view is drawn as one long section, but it is
four slides: the mark, the shipped product, how it is put together, and the
wide band. Each is numbered as its own slide — `nutshell-02` to
`nutshell-05` — because that is what a reader sees and what the pictures are
named after. The slide map prints them as four rows for the same reason.

The way back to the worlds is the last slide of the story — so in the
industry dashboard it is `slide-22_img-01` — and the short view points at
that same name, so it is drawn and exported once.

One slot is not a drawing at all: `slide-18_prototype-01` holds the running
dashboard, so it says `prototype` rather than `img`.

### How to see the whole structure at once

```
node tools/slide-map.js industry-dashboard
```

or `CS.slideMap()` in the browser console on the page. It prints every slide
in order, what it is called, which layout it uses, and which slots sit on
it — generated from the three files, so it cannot go out of date.

PNG or JPG. The page asks the drawing itself how wide and how tall it is, so
there is no shape to measure or type in either.

**To find out what a slot is called**, look at the empty box on the page —
it prints its own name and, under it, a line saying what it is waiting for.
Or open the page in a browser, open the console, and type:

```js
CS.PrototypeEmbed.empty()
```

It lists every slot still waiting, with the exact filename each one wants.
A misspelt name is the only mistake this scheme leaves room for, and that
catches it.

### Then what is media.js for?

Words *about* the picture, not the picture itself:

```js
'slide-06_img-01': {
  note: 'The product development strategy.',   // what the empty box says
  alt:  'A four-phase plan, drawn as…'         // what a screen reader says
}
```

If `alt` is missing, `note` is read instead.

The `note` earns its place precisely because the names are pure numbers: it
is the only thing on screen telling you what `slide-19_img-05` is supposed
to be. media.js is also grouped by slide with a heading for each, so reading
down it *is* reading the study's picture list.

### If a drawing has to keep a different filename

Add `src`, and it wins over anything found by name:

```js
'slide-06_img-01': {
  kind: 'image', src: 'assets/whatever-you-called-it.png', note: '…' }
```

### Things that are not still pictures

```js
{ kind: 'video',    src: '…mp4|gif', poster: '…', loop: true }
{ kind: 'figma',    src: '<figma share link or embed url>' }
{ kind: 'local',    src: '../../prototypes/<study>/x/index.html' }
{ kind: 'external', src: 'https://…' }
```

All of them also take `ratio` (`'16 / 9'`), `poster`, `autoload` and
`startLabel`. `prototypes/README.md` is the full walkthrough.

---

## "I want to add, move or remove a slide"

Open **content.js**. Every slide is one line, and the whole grammar is three
names:

```js
{ template: 'context-2', copy: 'slide-02', media: 'slide-02_img-01' }
//           |                  |                  |
//           |                  |                  the picture it shows
//           |                  the block of words in copy.js
//           the layout it uses
```

To **move** a slide, move its line. To **add** one:

1. Add a line here, where you want it in the order.
2. Add a block of the same name to copy.js with its words.
3. Add its picture slot to media.js, and save the drawing under that name.

To **hide** one without deleting it, add `hidden: true`. It is not drawn and
not counted, and the numbering reads straight through as if it were never
written. Removing that one word brings it back.

The list of templates is in `system/js/cs-templates.js`, and
`case-studies/industry-dashboard/` is a worked example of every one of them.

---

## Two rules worth remembering

**A word written in content.js wins.** copy.js fills in what is not there;
it does not overwrite what is. So if you are experimenting and want to type
a heading straight into the running order, nothing stops you — just move it
to copy.js before you forget where you put it.

**Nothing breaks if a file is missing.** A study with no copy.js and no
media.js, keeping everything in content.js the old way, runs exactly as it
did. That is what lets a study be converted one piece at a time.

---

## Naming a case study, and renaming one later

Every case study carries **two names**, and almost everything that goes wrong
here comes from treating them as one thing.

The first is the **name** — the words a human reads. It appears on the card on
the landing page, in the strip along the top of the case study itself, and in
the browser tab. It can be anything you like: capital letters, spaces,
ampersands, a change of mind next Tuesday. Nothing in the code depends on it.

The second is the **id** — the word the machine reads. It is the name of the
folder the case study lives in, it is part of the web address, and it is how
four separate pieces of the site recognise each other. It is lowercase, it is
hyphenated, and changing it means changing it in several places at once.

So the short version: **rename the name freely, rename the id rarely.** The
rest of this section is how to do each one.

---

### Part one — the name, and what the browser tab says

The tab is written by the page itself as it loads, which is why changing the
`<title>` line in `index.html` on its own appears to do nothing: the words you
typed flash past and are then replaced. The page asks three sources in order
and uses the first one that answers.

**1. `common/catalogue.js` — this is the one that wins.**

The catalogue is the list the landing page builds its cards from, and it is the
single place a study is named. Find the entry whose `id` matches your study and
change its `name`:

```js
{
  id:          'industry-dashboard',
  name:        'Key Industry Metrics',          // <- the name, here and nowhere else
  href:        'case-studies/industry-dashboard/index.html',
  description: 'To be added by me.',
  …
}
```

That one line sets **three** things at once: the card on the landing page, the
strip along the top of the case study page, and the browser tab. They cannot
drift apart, because there is only one of them.

**2. `copy.js` → `meta.title` — the fallback.**

```js
meta: {
  title: 'Key Industry Metrics (KIMs) Dashboard',
  subtitle: 'Information Aggregation &amp; Surveillance',
  backLabel: 'back to the worlds'
}
```

This is used only when a study is **not listed in the catalogue at all** — a
draft you are building before it has a card, say. The moment you add it to the
catalogue, the catalogue's `name` takes over and this line goes quiet. It does
no harm to leave it: it is simply the answer to "what is this called if nobody
has said?"

**3. `index.html` → `<title>` — the split second before the JavaScript runs.**

```html
<title>Key Industry Metrics</title>
```

This is what the tab says while the page is still loading, and what it would
say for ever if JavaScript were blocked or broken. It is a small thing, but a
tab that reads "Case study" for half a second before correcting itself looks
careless in a screen recording. Set it to the same words as the catalogue name.

**A third name that is not any of these:** the big headline on slide 1. That
lives in `copy.js` under `'slide-01'` → `title`, and it is deliberately
separate, because a headline wants to be long and a tab wants to be short:

```js
'slide-01': {
  title: 'Key Industry Metrics (KIMs) Dashboard',      // the headline on the page
  subtitle: 'Information Aggregation &amp; Surveillance'
}
```

**In practice,** when you name a study, set the same short name in the
catalogue and in `index.html`, keep it under about forty characters because a
tab shows very little, and let the headline on slide 1 be as long as the slide
needs.

---

### Part two — the id, and renaming a study in the code base

The id is the folder name under `case-studies/`. It is in the web address, so
it is lowercase with hyphens and no spaces, and it should describe the
**subject** rather than the client or the year: `industry-dashboard`,
`analyst-primer`. A name like `case-study-two` tells nobody anything, and is
exactly the kind of id worth changing while the site is still private.

To rename one, there are **four** places to touch, and that really is the whole
list.

**1. Rename the folder.**

```
case-studies/case-study-two/   ->   case-studies/credit-onboarding/
```

Everything inside it — `content.js`, `copy.js`, `media.js`, `theme.css`,
`assets.css` and the whole `assets/` folder — travels with it. There are no
paths inside those files that mention the folder's own name, so there is
nothing to re-type.

**2. `content.js` → `meta.id`.**

```js
meta: {
  id: 'credit-onboarding',          // <- must match the folder exactly
  backHref: '../../index.html'
}
```

**3. `common/catalogue.js` — the `id` *and* the `href`.**

```js
{
  id:   'credit-onboarding',                                  // <- changed
  name: 'Credit onboarding',
  href: 'case-studies/credit-onboarding/index.html',          // <- changed
  …
}
```

Both lines, every time. The `id` is how the case study page finds its own name;
the `href` is how the landing page finds the case study. Changing one and
forgetting the other gives you a card that opens a page that does not exist, or
a page that cannot work out what it is called.

**4. Prototypes, if this study has any.**

A running prototype lives at `prototypes/<study-id>/<slot-name>/index.html`, so
the prototype folder is named after the study too:

```
prototypes/case-study-two/   ->   prototypes/credit-onboarding/
```

and any line in that study's **`media.js`** that spells the path out needs the
new word:

```js
'slide-27_prototype-01': {
  kind: 'local',
  src: '../../prototypes/credit-onboarding/final-kids-page/index.html'
}
```

`media.js` is your file, so this is the one edit nobody can make for you.

---

### The rule that keeps all four in step

**The folder name and `meta.id` must be the same word.** Two different parts of
the engine read them, and they do not check each other:

- the **prototype finder** works the study's name out from the URL — the folder
  it is being served from — so that a prototype dropped into
  `prototypes/<study>/<slot>/` is found with nothing written down anywhere;
- the **name lookup** uses `meta.id` to find the study's entry in the
  catalogue.

If those two words disagree, nothing breaks loudly. You get a prototype that
silently never finds its folder and keeps showing its empty placeholder, or a
page whose top strip and tab quietly fall back to `meta.title`. Both look like
"it just didn't work", with nothing in the console to say why — which is the
most expensive kind of mistake to go looking for.

### What a rename costs

**Links die.** The id is the address, so
`…/case-studies/case-study-two/index.html#cs-slide-19` stops working the moment
the folder is renamed. The landing page's own links are fixed by step 3, and
anything inside the study is unaffected — but a link you have emailed to
somebody, or a bookmark, or a QR code on a printed sheet, points at a folder
that is no longer there.

That is the whole reason to let the **name** carry the words you keep changing
your mind about, and to leave the **id** alone once anything has been shared.

### What a rename does *not* touch

Everything else inside a case study is private to it and never mentions the
study's name:

- slide ids such as `#cs-slide-19` and `#cs-slide-persona`
- copy keys (`'slide-01'`, `'study'`), picture slot names
  (`slide-27_prototype-01`), drawer names and phase prefixes
- `theme.css`, `assets.css` and the contents of `assets/`

So a rename is four edits and a folder move, and nothing else in the study
needs reading.

### The checklist

| Doing what | File | What to change |
| --- | --- | --- |
| Renaming for humans | `common/catalogue.js` | `name` |
| …and the loading flash | `case-studies/<id>/index.html` | `<title>` |
| …and the headline on slide 1 | `case-studies/<id>/copy.js` | `'slide-01'` → `title` |
| Renaming for the machine | the folder | `case-studies/<new-id>/` |
| | `case-studies/<new-id>/content.js` | `meta.id` |
| | `common/catalogue.js` | `id` **and** `href` |
| | `prototypes/<new-id>/` | the folder, if there is one |
| | `case-studies/<new-id>/media.js` | any `../../prototypes/<old-id>/…` path |

---

## Starting a new case study

1. **Copy the `case-study-two` folder** and give the copy its id — lowercase,
   hyphenated, describing the subject. It is the empty shell.
2. **`content.js` → `meta.id`** — set it to the folder's new name. These two
   words must match; see *Naming a case study, and renaming one later* above
   for what goes wrong when they do not.
3. **Add it to `common/catalogue.js`** — an entry with that same `id`, the
   `name` people will read, and an `href` of
   `case-studies/<id>/index.html`. This is what puts a card on the landing
   page and what tells the study its own name. A study with no entry still
   opens; it just falls back to `meta.title` in `copy.js` for its name and
   has no card to open it from.
4. **`index.html` → `<title>`** — the same name again, for the moment before
   the page has loaded.
5. **`theme.css`** — pick this study's two accents from the six in the system
   palette (sun, fire, water, forest, stone, mist). Accent 1 is the hero
   title and the impact lines; accent 2 is the section titles and the
   drawer. Only two per study.
6. **`copy.js`** — the words.
7. **`media.js`** — one entry per picture you intend to draw.
8. **`content.js`** — the running order.

Everything else — the type, the colours, the strokes, the drawers, the
parallax, the light/dark switch — comes from the engine and is the same for
every study.

---

## To check your own work

Open the page in a browser and open the console.

```js
CS.slideMap()              // the whole structure: every slide, its layout,
                           // and the picture slots that sit on it
CS.copyGaps()              // copy keys a slide asks for that copy.js lacks,
                           // and blocks in copy.js nothing asks for
CS.PrototypeEmbed.empty()  // every picture slot still waiting for a drawing
```

From a terminal, without a browser:

```
node tools/slide-map.js <study>
```

Both should come back clean before you call a study finished.


---

## The people on slide 3

Everything about a person is **one block in copy.js**, written the way you
would describe them out loud:

```js
'user-1': {
  /* ---- user name and description ---- */
  name:        'The credit analyst',
  description: 'Primary user · assesses client risk daily',

  /* ---- the explains panel ---- */
  sections: [
    { heading: 'Roles & responsibilities', body: 'What they are accountable for…' },
    { heading: 'Jobs to be done',          body: 'What they are trying to get done…' },
    { heading: 'Collaboration model',      picture: true }
  ]
}
```

**The heading and its writing are written together.** They used to live in two
places — the headings in one shared list, the paragraphs in a `panels` array
matched to them by position — and nothing on the page told you which
paragraph belonged under which heading. Insert a section and every paragraph
below it silently shifted down one.

**The picture section says so.** `picture: true` instead of a body, and the
drawing it shows is that person's `media2` in content.js. It used to be
"whichever section happens to be last", which is a rule you cannot see by
reading the file.

### The grid slide — a table of things compared

**`template: 'grid'`**, and slide 23 of case study two is a working sample
of it. It is the slide for *here are the options, and here is how each one
does on the things that matter*.

```
┌─ the slide ─────────────────────────────────────────────────────┐
│ PHASE   │ ITEMS  ║ UX PROBLEM…  │ AFFECTED USER(S) │ TIMELINE    │
│         ║        ║              │                  │             │
│ Phase 2 ║ Item 01║ A sentence…  │ Both groups ▢▢   │ Phase 2     │
│ ────────║────────║──────────────│──────────────────│──────────── │
│ Phase 3 ║ Item 02║ A sentence.  │ Group one  ▢     │ Phase 3     │
│         ║ Item 03║ …            │ …                │ …           │
│                                      ▢ Legend 1  ▢ Legend 2      │
└─────────────────────────────────────────────────────────────────┘
      ↑ these two stay put when you scroll sideways
```

#### What to write

```js
'slide-23': {
  headers: ['Phase', 'Items',
            'UX Problem Statement', 'Affected User(s)', 'Timeline'],
  legend:  ['Carried into the build', 'Parked for later'],
  groups: [
    { name: 'Phase 2', items: [
      { name: 'Item 01', cells: [ 'A sentence.', 'Both groups', 'Phase 2' ] }
    ]}
  ]
}
```

The first two headers are the **grouping** and **items** columns; everything
after them is an attribute. With nothing to group by, write a flat `items:`
list instead of `groups:` and make the first header the items column — the
grouping column simply isn't drawn.

#### What a cell can be

| written as | what you get |
|---|---|
| `` `A sentence.` `` | writing |
| `{ value: `V` }` | the same thing, spelled out |
| `{ value: `V`, medias: ['a','b'] }` | writing, then small drawings under it |
| `{ fill: 'slide-23_img-01' }` | one drawing filling the cell, edge to edge |
| `{}` | deliberately empty |

Any of them may carry **`mark: 1`** or **`mark: 2`**, which tints the cell in
the first or second legend colour. Leave `legend` out and there is no legend
row — right when nothing is tinted.

When a cell holds more than one kind of thing, they stack **vertically**.

#### What it does on its own

- **The header row stays at the top** and **the first two columns stay at the
  left** while the rest scrolls under them. The thicker rule down the right of
  the items column is where the pinning stops.
- **Writing wraps and is never cut short.** A value you can't read in full is
  worse than a row that got taller.
- **The grid is the whole slide** — no title above it unless you write one,
  because the header row is already saying what every column is.
- **On a phone it keeps its shape and scrolls sideways.** Stacking a
  comparison into a column destroys the thing it is for.

#### How the three kinds of writing are set

| | face | colour | case |
|---|---|---|---|
| column headers | Shobhit Regal | primary accent | capitals |
| group names | Shobhit Regal | secondary accent | as written |
| item names | Shobhit Regal | secondary accent | as written |
| cell values | the reading face | ordinary text | as written |

**One frame, one face.** The headers, the group names and the item names are
all labels — the frame the readings hang on — so they share the drawn face. A
frame made of three different faces is three frames.

**Two accents, doing real work.** The headers run across the top and the
frozen columns run down the side. They meet in the top-left corner, and
without two colours that corner is the one place in the grid where you can't
tell at a glance which way a label is pointing.

**Why the values are not in capitals.** Every cell in the reference says
VALUE in small letterspaced capitals — but that is a placeholder standing in
for the real thing, and the real thing, in a column called *UX Problem
Statement*, is a sentence. Letterspaced capitals stop being readable at about
a line and a half, which is exactly a problem statement's length.

**And why the item names are not either.** The same reason the rest of this
site stopped forcing small capitals on the drawn face: it has no small
capitals to be set in, so it is written as written. An item name is something
you write — forcing it to capitals would mangle a real name.

### The use-case slides (11–14)

**These were the "idea slides" until 27 October.** They are the same slides
with a better name. In content.js they are now:

```js
{ template: 'use-case', copy: 'slide-11', ... }
```

`template: 'title-explains'` still works and always will, so nothing written
before the rename has to be touched — it simply builds a use-case slide.

```
┌─ the slide, panel open ────────────────────────────────┐
│  Use-case name                                         │
│  ┌──────────────┐  ┌──────────────────────────┐ ┌──┐   │
│  │              │  │ ▢ ▢   Caption            │ │  │   │
│  │ the drawing  │  │ Section header           │ │ ‹│   │
│  │ 1376 x 809   │  │ Section body             │ │  │   │
│  │              │  │ …                        │ │  │   │
│  │  1 / 5       │  └──────────────────────────┘ └──┘   │
└────────────────────────────────────────────────────────┘
                        the panel        the strip

┌─ the slide, panel closed ──────────────────────────────┐
│  Use-case name                                         │
│  ┌──────────────────────────────────────────┐    ┌──┐  │
│  │                                          │    │  │  │
│  │          the drawing, 1376 x 809         │    │ ›│  │
│  │                                          │    │  │  │
│  │                 1 / 5                    │    │  │  │
└────────────────────────────────────────────────────────┘
```

#### The strip that puts the panel away

The narrow upright strip against the right-hand edge opens and closes the
panel. **The whole strip is the button**, not the little chevron on it.

- The drawing takes the room the panel gives up, and gives it back.
- Each slide remembers its own answer **for this visit only**. Come back
  tomorrow and every panel is open again, which is the right default for a
  page somebody is reading for the first time.
- **On a phone there is no strip and the panel is always shown.** The
  drawing and the writing are stacked there, so there is no width for one to
  give to the other.

Nothing in copy.js or content.js controls this — it is the reader's choice,
not the author's.

#### The drawing: 1376 × 809

Every drawing on these slides is shown in a box of that shape, as wide as
the room allows and centred in what is left. Export at **1376 × 809** (or
any multiple of it — 2752 × 1618 for a sharp screen) and it will fill the
box exactly. Export a different shape and it still fits, with a margin on
two sides; nothing is ever stretched.

#### Who it is for — two numbers, not one

**`userGroups` at the foot of content.js is every group the study has.**
Call it *n*. Written once; adding a fifth is one line and one drawing, and
it touches no slide:

```js
userGroups: [
  { id: 'analysts',  media: 'user-group_analysts',  name: 'Credit analysts' },
  { id: 'directors', media: 'user-group_directors', name: 'Directors' }
]
```

**`groups` on a slide's own line is how many of them THAT slide shows.**
Call it *x* — anywhere from one to all of them:

```js
{ template: 'use-case', copy: 'slide-11',
  media: 'slide-11_img-01',
  groups: ['analysts', 'directors'],
  impact: 'high', feasibility: 'medium' }
```

Leave `groups` out entirely and the slide shows every group — the sensible
reading of "this idea is for everyone". A name that matches nothing in
`userGroups` is said out loud in the console rather than quietly dropped.

The faces are **saved once and shared**: `user-group_<id>` in media.js, not
named after any slide, because they do not belong to one.

**The line beside the faces** is `groupsCaption` in that slide's copy block.
It has its own word rather than borrowing `captions`, because it no longer
belongs to one picture — there may be three up there.

#### One drawing, or a run of them — `views`

One number on the slide's line decides, and it is the only thing you touch:

```js
{ template: 'title-explains', copy: 'slide-11',
  views: 5,                    // 1 = a still drawing; 2+ = a carousel
  groups: ['user-1'],
  impact: 'high', feasibility: 'medium' }
```

**The drawings are named from the number.** You never list them:

| on slide 11 | it asks for |
|---|---|
| `views: 1` | `slide-11_img-01` |
| `views: 3` | `slide-11_img-01`, `_img-02`, `_img-03` |
| `views: 5` | `slide-11_img-01` … `slide-11_img-05` |

So turning a slide into a carousel of three is changing one number, and the
three slots it then asks for follow the rule every other drawing on the site
already uses. Going back down is the same — drop it to 2 and it stops asking
for the rest. There is no list to keep in step, because there is no list.

The empty box always prints the exact name it wants, so you never have to
count in your head. `media.js` notes for the extra drawings are optional.

**The panel and the two cards do not change as you step.** They belong to
the *idea*; the drawings are views of it. Two independent things sharing a
slide — which is why one can gain a carousel without the other knowing.

#### `views` or `flows`?

Both say "this slide steps through several drawings", and **`views` is the
one you almost always want**. It works on every stepped slide now — the
use-case slides, the prototype slide, and the stepped ones (4, 8, 9), which
could not take it until 6 November for no better reason than that the
function behind them predated `views` and nobody went back to it.

| | |
|---|---|
| `views: 4` | four drawings that are **views of one thing**, named from the slide. The count *is* the list |
| `flows: 'name'` | **several named runs** of drawings, each with its own tab — "the analyst's path", "the reviewer's path" — or one run whose shots carry captions and questions written per shot. The runs live in `workflowSets` in `content.js` |

`flows` wins if a slide somehow says both, because a written-out list is a
more specific instruction than a count.

**Slide 4 is a good example of using the wrong one.** It says
`flows: 'understanding'`, and that set turns out to contain exactly
`slide-05_img-01` to `_img-04` — which is precisely what `views: 4` would
have produced. The two render identically; the only difference anywhere in
the slide is which attribute the stage carries. It is written the long way
because the short way did not work on that template, not because it needed
to be.

So on any stepped slide whose set is one run of drawings numbered from the
slide, you can replace the `flows:` line with `views: <how many>` and delete
the set. Nothing else changes — `captions`, `questions` and `bodies` are
filed under the drawing's name either way, and the names do not change.

#### If the pictures appear but the words do not

**Check the names match, exactly.** The question above a stepped diagram and
the writing beside it are filed under **the drawing's own name**, not the
slide's:

```js
questions: { 'slide-05_img-01': `…` },
bodies:    { 'slide-05_img-01': `…` }
```

A drawing called `slide-05_img-01` with its question filed under
`slide-04_img-01` shows the picture and nothing else — the file is found by
its filename and the words are found by their key, and those are two separate
lookups that can disagree.

**The slide now tells you which key it is waiting for**, the same way an
empty picture box names its file:

```
questions → slide-05_img-01
bodies → slide-05_img-01
```

The question band used to go silently blank instead, which made a question
filed under the wrong name look exactly like a slide that never wanted one.

**A stepped slide that deliberately has no question** says so, in the same
idiom as `title: null` — note the SINGULAR, because `questions` with an s is
the copy block and the two are unrelated:

```js
{ template: 'title-steps', copy: 'slide-05', views: 4, question: false }
```

and the band stays empty with nothing asked for.

#### How tall the drawing and the writing are

On the split stepped slides — 4 and 9, the ones with a diagram on the left
and writing on the right — both are a fixed size:

```
the drawing   912 x 682
the writing   682 tall, whatever width is left
```

They are the same height on purpose, so they read as a pair rather than as
two things that happen to be near each other. Both numbers are one place —
`--cs-explains-pic-w` and `--cs-explains-h` in `system/css/cs-tokens.css`.

**The writing never makes the slide taller.** Write a long passage and the
column scrolls inside its 682; the drawing beside it does not move and the
slide stays the height of its neighbours. That is the point of the fixed
height: a drawing you exported at one size is shown at that size, always.

A scrollbar appears **only when there is more writing than room**. When it
fits, the column is not a scroller at all, so the wheel passes straight
through to the page. When it does scroll and you reach the bottom, the page
carries on from there — no wall.

The same is true of the explains panel wherever it appears.

#### Impact and feasibility

Two cards under the panel, set per slide in content.js:

```js
impact: 'high',   feasibility: 'medium'
```

**Five values, and only five:**

```
'very low'   'low'   'medium'   'high'   'very high'
```

A fixed scale is the whole point of a rating — four ideas measured four
different ways cannot be compared, which is the one thing a reader wants to
do with them. Anything else is still drawn, but in the quiet colour rather
than the accent, and said out loud in the console.

The words *Impact* and *Feasibility* are the engine's; override them per
study under `labels` in copy.js.

**Turning both cards off for the whole study.** One line under `meta` in
content.js:

```js
meta: {
  id: 'case-study-two',
  showRatings: false      // no cards on any use-case slide
}
```

Leave the line out and the cards show — that is the default, and every
study written before this line existed keeps behaving the way it did.

The `impact:` and `feasibility:` values stay written on each slide while
the cards are hidden. Hiding and deleting are different decisions, and only
one of them is undone by a single word. The panel grows to fill the corner
the cards were in, so the slide still finishes level with the drawing.

*Right now case study two has this set to `false`.*

#### Sections

Written the same way a person's are:

| on the sheet | in copy.js |
|---|---|
| Caption | `groupsCaption: '…'` |
| Section header | `{ heading: '…' }` |
| Section body | `{ body: '…' }` |

A section still marked `picture: true` on one of these slides is **dropped
whole**, heading and all — its drawing moved to the head rather than going
missing. Those entries can come out of copy.js whenever it is next open.
A section naming a *different* drawing is still drawn in place.

**Headings in this panel sit left**, flush with the writing under them. The
panel is a narrow strip of prose pinned beside a drawing — there is no
centre line for a heading to sit on, only a left edge every line shares.

### Who comes first

That is content.js's business, not copy.js's:

```js
personas: [
  { copy: 'user-1', glow: 'forest', media: 'slide-03_img-01',
    media2: 'slide-03_user-1_collaboration-model' },
  …
]
```

Each line says which block of words, which portrait, which diagram, and what
colour the light behind them is. So:

- **to reorder the carousel** — swap two lines here. Nobody's writing moves.
- **to put a different person first** — change one word, the `copy` name.
- **to add a fourth person** — a block in copy.js, a line here, two drawings.

### Three things you can do that used to be impossible

- **give one person a section the others do not have** — just add it to their
  list. The panel is built per person, so they need not match.
- **leave a heading out** — write `{ body: '…' }` and it borrows the heading
  in the same position from `study.sections`.
- **put the picture somewhere other than the bottom** — move the
  `picture: true` entry up the list.

### The light falling on a portrait

`glow:` names one of the seven accents — `forest`, `mist`, `fire`, `water`,
`sun`, `stone`, `moon` — and two things follow from that one word: a coloured
light is laid **over** the drawing, and the person's name underneath is set in
the same colour.

The light lands on the figure and nowhere else, because **the drawing is used
as its own stencil**. Your portraits are painted on nothing, so the
transparent surround punches the colour away everywhere the person is not.
Without that it would be a rectangle of colour, not a light.

What it does to the drawing is a blend mode, and they are the two you know
from Procreate:

- **soft light** at rest — it tints, pushing the drawing's own tones towards
  the hue without flattening them, so the strokes stay strokes.
- **hard light** while the cursor is over them — much more hue, much more
  contrast. The lamp turned up.

They are two separate layers fading across each other rather than one layer
changing mode, because a blend mode cannot be animated: it would snap.

Leave `glow` out and that person gets no light, and their name stays the
ordinary text colour.

**How strong** is three numbers per mode in `system/css/cs-slides.css`, under
*HOW STRONG, IN ONE PLACE PER MODE*: `--cs-wash-soft` is the resting tint,
`--cs-wash-soft-up` is what the soft layer drops to as the hard one comes in,
and `--cs-wash-hard` is the hovered lamp. Light mode takes less than dark —
the same wash that is barely visible on the near-black page reads as a stain
on the pale cream one.

**The name takes the levelled strength of that accent**, not the raw one. The
raw colour is for the light, where nothing is read off it. A name is read, so
it uses `-ink`, which clears 4.5 to 1 against the page at any size.
