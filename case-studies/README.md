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

### Special characters

Curly quotes and dashes are written the long way so they survive every
browser. You can paste the real character instead; the long way is safer.

| you write | you get |
|---|---|
| `&rsquo;` | ’ |
| `&lsquo;` | ‘ |
| `&ldquo;` `&rdquo;` | “ ” |
| `&mdash;` | — |
| `&amp;` | & |
| `&middot;` | · |

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

### The other kinds of body text

```js
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

## What this case study is called

Not in `copy.js`. A study's **name** lives in `common/catalogue.js`, in the
entry whose `id` matches this study's `meta.id` in `content.js`:

```js
{ id: 'industry-dashboard', name: 'Key Industry Metrics', … }
```

That one word sets the card on the landing page, the heading of the password
screen, the strip along the top of this page, and the browser tab. Rename it
there and all four follow.

The **hero title on slide 1** is a different thing and stays here, in
`copy.js`, under `meta.title` — so the headline can be longer or phrased
differently from the name on the card. A study that is not listed in the
catalogue at all simply falls back to `meta.title` everywhere, as before.

---

## Starting a new case study

1. Copy the `case-study-two` folder and rename it. It is the empty shell.
2. `theme.css` — pick this study's two accents from the six in the system
   palette (sun, fire, water, forest, stone, mist). Accent 1 is the hero
   title and the impact lines; accent 2 is the section titles and the
   drawer. Only two per study.
3. `copy.js` — the words.
4. `media.js` — one entry per picture you intend to draw.
5. `content.js` — the running order.
6. Point the landmass on the work planet at it (`js/hw-config.js`).

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


