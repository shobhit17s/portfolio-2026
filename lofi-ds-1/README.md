# lofi-DS-1

A small UI kit for lo-fi prototypes — the ones that demonstrate a UX vision
rather than ship. Built from the reference screens of 2 November.

It is deliberately **not** the case-study engine. That system draws a
portfolio; this one draws a product being proposed. They share a palette so
that a prototype embedded in a case-study slide looks like it belongs there,
and nothing else.

---

## Where everything is

```
lofi-ds-1/
  index.html              the kit itself — every component on one page
  css/
    lofi-face.css         the drawn typeface (font_kk_version_1), carried
                          not fetched, with a size-adjust - see below
    lofi-tokens.css       every colour, size and face. Nothing else holds one.
    lofi-base.css         reset, the page, the two type rules
    lofi-shell.css        nav band, module band, page panel
    lofi-tabs.css         section tabs and panel tabs
    lofi-table.css        the data table — washes, selection, grouped heads
    lofi-ledger.css       the sectioned model — sections, a spine, sub-rows
    lofi-controls.css     buttons, select, search field, badge
    …                     one file per block; the full list is in NAMING.md
  js/
    lofi-tabs.js          makes any tab row work
    lofi-table.js         cell selection, and washing from a threshold
    lofi-ledger.js        draws a ledger from data, and swaps its figures
    lofi-main.js          starts them all, once

prototypes/lofi-ds-1/<name>/
  index.html              links the system, holds the markup
  app.css   app.js        only what is true of that one prototype
  data/                   figures, and the script that generated them
```

**Figures live in `data/`, not in the markup.** A prototype that shows real
numbers keeps them in their own file, generated from whatever source they
came from, with the generating script beside them. Then the numbers can be
checked against the source, the source can be swapped, and no figure is
ever typed twice.

**Link order matters**, because the tokens have to exist before anything
reads them:

```html
<link rel="stylesheet" href="../../../lofi-ds-1/css/lofi-face.css">
<link rel="stylesheet" href="../../../lofi-ds-1/css/lofi-tokens.css">
<link rel="stylesheet" href="../../../lofi-ds-1/css/lofi-base.css">
<link rel="stylesheet" href="../../../lofi-ds-1/css/lofi-shell.css">
<link rel="stylesheet" href="../../../lofi-ds-1/css/lofi-tabs.css">
<link rel="stylesheet" href="../../../lofi-ds-1/css/lofi-table.css">
<link rel="stylesheet" href="../../../lofi-ds-1/css/lofi-ledger.css">
<link rel="stylesheet" href="../../../lofi-ds-1/css/lofi-controls.css">
```

`lofi-face.css` carries the font as text, so a prototype needs no network
for its typeface. Leave it out and Shantell Sans stands in.

**The face is `font_kk_version_1`**, which replaced `Shobhit Regal` here.
The two are built to very different proportions — Regal's capitals are 463
of a 1000-unit em, KK's are 700 — so the same `font-size` would have drawn
KK's caps half again as tall and every one of the kit's size tokens would
have needed re-tuning.

`size-adjust: 66.1%` in `lofi-face.css` scales the em instead, so
`font-size: 15px` goes on meaning exactly what it meant. One line in one
file rather than a change at twenty-eight call sites, and deleting it
shows the face at its own natural size.

The same file also declares **`font_kk_version_1 Text`** — the identical
face with no size-adjust, for setting actual sentences. KK is a reading
face (x-height 449 of the em against Regal's 344), so a paragraph set in
it holds together far smaller than one set in Regal would.

---

## The height rule

Every widget is **given** its height. It is never the sum of what is inside
it. The canvas is 1024 tall, the page is what is left under the two bands,
the widget is the page less its margin — each decided before anything is
drawn.

So the contents divide up a fixed amount. In a column of things, most want
their natural height — a toolbar, a tab row, a legend, a line of small
print. Exactly **one** should swallow what is left, and it says so:

```html
<div class="lofi-panel">
  <div class="lofi-toolbar">…</div>          <!-- its own height -->
  <div class="lofi-table-wrap lofi-fill">…</div>   <!-- the rest -->
</div>
```

Three words run it:

| | |
|---|---|
| `.lofi-col` | "I am a column" — `.lofi-panel`, `.lofi-stack` and a showing `.lofi-pane` are columns already |
| `.lofi-fill` | "I take whatever is left" — one child per column |
| *nothing* | every other child keeps its natural height |

**It is a chain, and it breaks at the first missing link.** For a table at
the bottom of four nested boxes to fill, every box above it must itself be
filling. One ordinary box anywhere in the chain and everything below it
goes back to being as tall as its own contents — which is how content ends
up running off the bottom edge of a widget.

`.lofi-table-wrap`, `.lofi-sheet`, `.lofi-chart`, `.lofi-ledger` and
`.lofi-insights` all declare themselves fillers, so they need no class;
they simply need every ancestor to be a column.

---

## The one rule that makes it look right

**Everything that NAMES something is the drawn face, in capitals.
Everything that is DATA is the rounded sans, mixed case. Sentences are the
handwriting face.**

That single split is most of why the reference screens read the way they
do. Use `.lofi-label` rather than restating it.

The drawn face reads smaller than the sans at the same pixel size — narrow
capitals, thin strokes — so every label in this kit is set one step up from
the data beside it. That is not a fudge; it is what makes two faces look
like one size.

---

**The full link order** (foundation → shell → surface → content → control):

```html
<link rel="stylesheet" href="…/css/lofi-face.css">
<link rel="stylesheet" href="…/css/lofi-tokens.css">
<link rel="stylesheet" href="…/css/lofi-base.css">
<link rel="stylesheet" href="…/css/lofi-shell.css">
<link rel="stylesheet" href="…/css/lofi-toolbar.css">
<link rel="stylesheet" href="…/css/lofi-sheet.css">
<link rel="stylesheet" href="…/css/lofi-scrim.css">
<link rel="stylesheet" href="…/css/lofi-menu.css">
<link rel="stylesheet" href="…/css/lofi-combo.css">
<link rel="stylesheet" href="…/css/lofi-modal.css">
<link rel="stylesheet" href="…/css/lofi-drawer.css">
<link rel="stylesheet" href="…/css/lofi-loader.css">
<link rel="stylesheet" href="…/css/lofi-tabs.css">
<link rel="stylesheet" href="…/css/lofi-table.css">
<link rel="stylesheet" href="…/css/lofi-chart.css">
<link rel="stylesheet" href="…/css/lofi-insights.css">
<link rel="stylesheet" href="…/css/lofi-controls.css">
<link rel="stylesheet" href="…/css/lofi-segmented.css">
```

Scripts, in any order except `lofi-main.js` last:

```html
<script src="…/js/lofi-icons.js"></script>      <script src="…/js/lofi-tabs.js"></script>
<script src="…/js/lofi-segmented.js"></script>  <script src="…/js/lofi-menu.js"></script>
<script src="…/js/lofi-combo.js"></script>      <script src="…/js/lofi-overlay.js"></script>
<script src="…/js/lofi-table.js"></script>      <script src="…/js/lofi-chart.js"></script>
<script src="…/js/lofi-main.js"></script>
```

Link only the blocks a prototype uses. Nothing depends on anything except
the three foundation files.

---

## The naming convention

`NAMING.md` has it in full. In one line:

```
lofi-   BLOCK   -PART   --VARIANT   is-STATE
```

A **variant** never changes what something is; a **state** is temporary and
set by a script; one block means one pair of files, `lofi-<block>.css` and
`lofi-<block>.js`. Behaviour hooks are `data-lofi-<noun>`, starters are
`LOFI.init<Blocks>()`, events are `lofi:<noun>`.

---

## The parts

| Class | What it is |
|---|---|
| `.lofi-app` | the three-band page frame |
| `.lofi-nav` / `.lofi-nav-tab` | the rose band and its folder tabs |
| `.lofi-module` / `.lofi-module-name` | the olive band naming the module |
| `.lofi-page` / `.lofi-panel` | the outlined page panel |
| `.lofi-block` | a pale green block — a page head, a control strip |
| `.lofi-bar` / `.lofi-stack` | a row with ends pushed apart / an even column |
| `.lofi-tabs` / `.lofi-tab` | section tabs, underlined, closable |
| `.lofi-ptabs` / `.lofi-ptab` / `.lofi-ptab-body` | panel tabs joined to their panel |
| `.lofi-table` | the data table — a finding, with washes (see below) |
| `.lofi-ledger` | a sectioned model — a document to look things up in (see below) |
| `.lofi-legend` / `.lofi-swatch` | what the washes mean |
| `.lofi-btn` (`--quiet`, `--link`) | buttons |
| `.lofi-select` / `.lofi-field` / `.lofi-badge` | a dropdown, a search field, a pill |
| `.lofi-toolbar` | meta left, controls right, hairlines between groups |
| `.lofi-sheet` | the big soft block content sits on (`--green`, `--note`) |
| `.lofi-loader` | "we are working on it", with three dots |
| `.lofi-menu` | a list of **verbs** hanging off a button — grouped, closes on press |
| `.lofi-combo` | a list of **nouns** — the trigger shows what is chosen |
| `.lofi-scrim` | the olive dimming behind a modal or drawer |
| `.lofi-modal` | centred dialog: green title bar, body, footer |
| `.lofi-drawer` | edge panel for a form you tune while watching the result |
| `.lofi-segmented` | the same answer, another lens |
| `.lofi-chart` | a multi-series trend line with draggable markers |
| `.lofi-insights` | the written answer — badge, headed prose, a rule |
| `.lofi-field-group` | a caption above any control |

### Menu or combo?

They look alike and are not the same block. A **menu** is a list of verbs:
pressing one *does* something and the menu closes for good. A **combo** is a
list of nouns: pressing one *chooses* something and the trigger then shows
it. Different keyboard behaviour, different markup. Merging them is how you
end up with a component nobody can describe in a sentence.

Prefer the plain `.lofi-select` over `.lofi-combo` unless the **open state**
is part of what you are showing — a native select's open list is drawn by
the operating system and cannot be styled at all.

### Modal or drawer?

Ask whether the reader needs to watch the thing they are changing. The
parameters drawer sits against the edge with the table still visible beside
it; a centred dialog would cover the answer being tuned.

Both use `LOFI.openOverlay(id)` / `LOFI.closeOverlay()`, or no JavaScript at
all via `data-lofi-opens="id"` and `data-lofi-closes`. Both trap the
keyboard, close on Escape and on a press outside, and put focus back where
it came from.

### Icons

`LOFI.icon('export')` returns the SVG, or put `data-lofi-icon="export"` in
the markup and the kit fills it in. One registry in `lofi-icons.js`, so the
export icon can never quietly become three slightly different icons.

### Tabs need no configuration

Mark a row up the way a tab row is already supposed to be marked up and it
works:

```html
<div class="lofi-tabs" role="tablist">
  <button class="lofi-tab" role="tab" aria-controls="pane-a" aria-selected="true">One</button>
  <button class="lofi-tab" role="tab" aria-controls="pane-b" aria-selected="false">Two</button>
</div>
<div id="pane-a" class="lofi-pane" role="tabpanel">…</div>
<div id="pane-b" class="lofi-pane" role="tabpanel" hidden>…</div>
```

`aria-controls` **is** the wiring. There is no second list to keep in step,
because the tab already has to name its pane for a screen reader — so that
one attribute does both jobs. A tab with no `aria-controls` still
highlights, which is right for one that only filters a chart.

### The table

Ordinary `<table>` markup with classes on it:

- `.lofi-rowhead` on the first cell of each row — drawn face, and the thick
  ochre divider. The divider is on the **right** of the name cell, so
  adding a column never moves it.
- `.lofi-divide` for a rule between groups of columns.
- `.lofi-group` for a head spanning several columns; `.lofi-sub` for the
  small second line under a head.
- `.lofi-cell--pos` / `.lofi-cell--neg` for the washes, `.is-selected` for
  the outlined cell, `.is-clickable` to make a cell pressable.

**A wash is a background, never a text colour.** The number keeps reading in
the same ink as every other number, which is what lets a reader compare a
washed cell with an unwashed one.

### The chart's two scales

```js
LOFI.drawChart(el, {
  xLabels: ['2026', … ],
  series:  [ { name: 'Credit', colour: 'sun', values: [ … ] }, … ],
  scale:   'value',     // or leave it out for the banded chart
  unit:    'x',         // optional suffix on the axis numbers
  scrub:   6            // ONE marker, at this x position
});
```

**Banded** (the original) takes values 0–1 and labels the y-axis in words
— v.low, low, medium, high. It is for a chart about *shape*: which line
is above which, and where they cross. Naming the axis in words says "do
not read a number off this", which is honest when the numbers were
invented.

**Value** takes real figures and draws a numbered axis with ticks, chosen
the way a person would — steps of 1, 2 or 5 times a power of ten. It is
for a chart whose numbers mean something. A reader who sees 165 in a
table one click away should be able to find 165 on the chart, and a
banded axis makes that impossible.

**One scrubber, not three.** A single upright with a triangle at each
end, a dot where it crosses every line, and `lofi:scrub` reporting where
it landed. Three markers were three answers to a question nobody asked
twice; one marker is a reader moving through time. `scrubs: [2,3,5]`
still works for the banded chart.

### The readout

```js
LOFI.drawReadout(el, { when: '2032',
  rows: [ { name: 'Credit (base)', value: 165 },
          { name: 'Management', value: 175, delta: 6.06 } ] });
```

What the scrubber is pointing at, in words and figures: the year, then
each case with its value set large and its delta set small beside it.
Same decision the grid cell makes — **the value is what the company
does; the delta is a reading of it against another column** — and making
the two agree is what stops the chart and the table feeling like two
different products.

It draws only. *What* the scrubber is pointing at is the prototype's
business, because only the prototype knows which case is the base.

### The ledger, and why it is not a table

A `table` and a `ledger` are both grids, and the difference between them is
not how they look — it is **what the reader is doing**.

| | `.lofi-table` | `.lofi-ledger` |
|---|---|---|
| the reader is | being shown a **finding** | **looking something up** |
| shape | one head, one body | many sections, each with its own head of years |
| colour | washes carry the meaning | none at all |
| rows | all the same weight | top-level lines, with indented readings under them |

```js
LOFI.drawLedger(el, {
  years:    [2026, 2027, 2028],
  sections: [ { id: 'summary', no: 1, name: 'Financial summary', rows: [
                { key: 'revenue', label: 'Revenue', format: 'num' },
                { key: 'growth',  label: 'Revenue % growth',
                  format: 'pct', sub: true },
                { key: 'ni',      label: 'Net income',
                  format: 'num', rule: true } ] } ],
  values:   { summary: { revenue: [420, 445.2, 472.4],
                         growth:  [null, 6.0, 6.1],
                         ni:      [20.4, 23, 26.5] } }
});
```

**The shape and the figures are separate arguments on purpose.** `sections`
says what the document *is*; `values` is one scenario's numbers. To show a
different scenario, hand the same shape a different set of figures:

```js
LOFI.swapLedger(el, otherValues);   // keeps the reader's scroll position
```

That is what keeps five scenarios from quietly disagreeing about which rows
exist — there is only ever one description of the document.

Three flags on a row do all the formatting work:

- `sub` — indents and quietens it, because it is a *reading* of the row
  above (a margin, a growth rate), not a line of its own
- `rule` — a heavier line above a row that adds its section up
- `format` — `num` (one decimal), `pct`, `x` (two decimals), `days`

A figure that does not exist is written as an em dash, never left blank: a
blank cell reads as a bug, a dash reads as a decision.

### Letting the table judge for itself

For a prototype where the *rule* is the point:

```html
<table class="lofi-table" data-lofi-threshold="15">
  <tr>
    <td class="lofi-rowhead" data-lofi-invert>Leverage</td>
    <td data-lofi-delta="31">+1.1x</td>
  </tr>
</table>
```

Every cell carries its number; the table says what counts as significant;
`LOFI.washTable(table)` does the rest. Change the threshold and the screen
changes without the numbers moving — which is usually the thing the
prototype exists to show.

**`data-lofi-invert` is the attribute worth remembering.** Leverage going up
is bad news; revenue going up is good. Without it you get the classic
dashboard mistake: a wall of green while the business is on fire.

---

## Events

Both scripts announce what happened, so a prototype can react without
reading the DOM:

| Event | Fired when | `detail` |
|---|---|---|
| `lofi:tab` | a tab is chosen | `{ tab, value }` |
| `lofi:tab-close` | a tab's ✕ is pressed | `{ tab }` |
| `lofi:cell` | a clickable cell is chosen | `{ cell, value, row, column }` |
| `lofi:ledger` | a ledger has been drawn | `{ sections, years }` |
| `lofi:combo` | a case or other noun is chosen | `{ value, item }` |
| `lofi:segment` | a lens is switched | `{ value }` |
| `lofi:scrub` | a chart marker is moved | `{ index, at, label }` |

Closing a tab is announced, **not performed** — what a ✕ should do differs
per prototype, and a kit that guessed would be wrong half the time.

---

## What is not built yet

1. the left sidebar — view selector, search, the nested client list
2. widget cards — coloured title bar, body, footer with secondary + CTA
3. the **bar** chart with threshold lines (the line chart is built)
4. a toast / confirmation after something is done

---

## Adding to the kit

Put the colour in `lofi-tokens.css` first. If you find yourself typing a hex
code anywhere else, that is the system failing — say so and it gets a token.

Every outline in this kit is `var(--lofi-stroke)`. That is deliberate: it is
the seam a hand-drawn stroke treatment would be fitted along later, as one
edit rather than ninety.

