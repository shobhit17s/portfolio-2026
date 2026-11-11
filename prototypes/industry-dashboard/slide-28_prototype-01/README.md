# Key Industry Metrics (KIMs) — Salt prototype

Built from your reference sheets of 10 November (00–08). One screen of the
CreditRisk product: the overview of sub-industries, one sub-industry's heat
grid, the trend drawer, and one KIM with everything it drives.

**Open `index.html`.** Nothing to install, nothing to build, no server needed.

---

## The second round, in one list

1. **The charts answer on hover** — a dated readout, a guide line and a dot.
2. **The trend is named after its metric**: "Capacity Utilisation Trend",
   not "Metric Trend".
3. **The line of actual values runs in mist**, your plum; the percent-change
   chart keeps the teal.
4. **The grid**: the category names and the column-group names stay put while
   you scroll sideways; Quarterly Data and Annual Data fold to their latest
   column and back; a material move is now anything past ±35% and wears a
   filled pill in the legend's own colour; the frozen headers sit above the
   group headers again; the drawer shows its own loader; it eases in from the
   right; and "No Material Movement" has gone from the legend.
5. **Far fewer material moves** — 14 sub-industries out of 120 rather than a
   hundred-odd — and the selector now lists them all rather than only the
   moving ones, so a "Material Move" tag is on some rows and not others.
6. **The GROUP BY button keeps its name** whatever is chosen.
7. **The selector eases open and closed** instead of snapping.

## The third round

1. **GROUP BY no longer wraps** — the button keeps its words on one line
   whatever font it is rendered in.
2. **The drawer really does come from the right.** It was sliding correctly;
   what moved was everything *behind* it. See `overflow: clip` below.
3. **The column-group arrow points left when the group is open.**
4. **The selector's head is two things**: the name on the left, a
   `right-controls` box holding GROUP BY and the collapse on the right, and
   `auto` between them. 12px of padding round the whole panel.
5. **The loader is visible.** It was always being shown; it was being drawn
   at twelve pixels across.

---

## What it is made of

```
index.html                     the markup for all four screens
css/salt-theme-caraxes.css     EVERY colour and size — a copy of the case comparison's
css/shell.css                  the frame, the app bar, the page band, the selector
css/views.css                  the card deck, the heat grid, the KIM results
css/drawer.css                 the trend panel and its two charts
css/coach.css                  the nudge
js/fit.js                      scales the 1440 x 1024 canvas to any window
js/core.js                     helpers, the one piece of state, the message bus
js/charts.js                   two inline SVG charts that know nothing about KIMs
js/panel.js                    the View Selector
js/views.js                    the three screens
js/drawer.js                   the trend panel
js/coach.js                    the four-step nudge
js/app.js                      wires it together and starts it
data/kims.js                   >>> ALL THE CONTENT. The file to edit. <<<
```

**The theme is a copy, not a link.** `salt-theme-caraxes.css` and `fit.js` are
byte-for-byte the case comparison's. They are copied so this folder can be
renamed and moved on its own — a folder you can drag anywhere cannot contain a
`../case-comparison/` path. The cost is that a change to the original does not
follow; re-copy those two files when it changes.

---

## The three things you asked for

### 1 · The app bar is the case comparison's

Same markup, same tokens, same three-column grid (`1fr auto 1fr`), so the nav
sits in the true centre of the bar whatever the brand and the account tools
weigh. **PORTFOLIOS carries `aria-current="page"`** instead of ANALYZE, which
is the only difference. On the teal bar the current item is *cut out* of the
bar — a white fill with the bar's own teal in it — rather than washed onto it;
a 22% white wash measured 3.16:1 against a white label, and this way round it
is 4.59.

The page band under it is the product's own: the title on the left, Home and
Support on the right, as your sheets draw them.

### 2 · It scales to the window, keeping 1440 × 1024

`js/fit.js`, unchanged from the other prototypes. Think of the screen as a
printed poster and the window as a picture frame: the poster is never redrawn,
it is shrunk or enlarged whole and centred, and whatever is left over is mount
board. Measured at five window sizes from 900 × 620 to 2560 × 1300 — the design
is drawn at 1440 × 1024 every time, scaling from 0.61 to 1.27, with no
sideways scroll anywhere.

### 3 · The nudge, in four steps

1. change the grouping in the View Selector
2. open a sub-industry card to see its heatmap
3. open the trend drawer from a sparkline
4. search for a KIM to see what it drives

**It only ever advances on the real action.** There is no Next button walking
ahead of the page, because the thing each step points at does not exist until
the step before it has happened — the grid has no sparklines until a
sub-industry is open. Each step waits for its own event on the bus in
`core.js`, and the files that raise those events know nothing about the nudge.

**Every bubble says "n of 4" and carries a Skip,** which ends the tour for
good. Four steps across three screens is a tour rather than a hint, and a
reader who already knows the product has to be able to leave one. The bubble
and the ring are the case comparison's, so the two prototypes teach in one
voice.

---

## The content is all in one file

`data/kims.js` holds 120 sub-industries across 8 industries and 16 countries,
39 distinct KIMs, and every figure on every screen. Nothing else in the build
names a sub-industry, a metric or a number.

**Every number is generated from its own name.** A small seeded generator turns
the text "Hot Rolled Coil Price" into the same series for ever, on every
machine. A prototype whose numbers change on each reload cannot be
screenshotted, cannot be demoed twice the same way, and makes every reviewer
wonder whether what they are looking at is a bug.

**The names are plausible stand-ins and the only invented content here.** Your
sheets print "Sub-Industry #1" and "Metric Name", which is right for a layout
drawing and impossible for a working search box — you cannot demonstrate
type-ahead against a list of things all called "Metric Name". Say the word and
they go back to the sheet's placeholders, or send me a real list.

**A material move is anything past ±35%, and that number lives in one place**
— `MATERIAL_AT` in `data/kims.js`. Nothing else in the build decides it, so
moving the threshold moves every count, tag, pill and filter on every screen
with it.

**How MANY there are is controlled by the range the change is drawn from, not
by a second rule.** A moving sub-industry's KIMs are drawn from a range that
straddles the threshold; a quiet one's from a range below it. So the threshold
stays honest — the pill, the tag and the count are all reading the same figure
— while the dummy data still has only a handful of moving sub-industries.
About one in ten: 14 of 120. It was one in five, which put a tag against
nearly every country in the selector, and a tag that is on everything has
stopped being a tag.

---

## The heat ramp

The tinted cells and the Positive → Negative scale are **your forest and your
fire**, taken from the two wash tokens the theme already carries:
`--salt-content-positive-background` and `-negative-background`, each 22% of
the colour mixed into the surface.

That 22% was not chosen by eye. `tools/salt-wash-derive.py` in the
performance-to-plan build walked the mix from nothing upward and printed what
each strength did to every piece of text that can sit on it. 22% is the
quietest mix that still steps clearly off a plain row, and it leaves the figure
on the cell at 12.7:1.

**So the strongest step of the ramp is exactly that mix and no more.** The two
lighter steps are made by mixing it *back* toward the surface, which means
every cell in the ramp sits between "no tint" and the one that was measured —
contrast cannot be worse anywhere in the ramp than the figure already checked.
Building the ramp the other way, toward the raw colour, would have put the
darkest cells beyond anything that was tested.

Three steps rather than a continuous ramp, because nobody can tell 0.61 from
0.68 by eye and pretending otherwise only makes the grid noisy.

---

## The region names

Everything is prefixed `kim-`.

| | |
| --- | --- |
| shell | `kim-stage` `kim-frame` `kim-appbar` (`kim-brand` `kim-nav` `kim-nav-portfolios` … `kim-appbar-right` `kim-globalsearch` `kim-mode` `kim-account`) `kim-pageband` (`kim-pagetitle` `kim-pagenav-home` `kim-pagenav-support`) `kim-body` |
| selector | `kim-panel` `kim-panel-head` (`kim-panel-title`, `kim-right-controls` → `kim-groupby` + `kim-groupby-menu`, `kim-panel-collapse`) `kim-rail` `kim-overview-item` `kim-subsearch` `kim-panel-hint` `kim-grouplist` (rows `kim-group-…` / `kim-subrow`) |
| card | `kim-main` `kim-card` `kim-searchrow` `kim-kimsearch` (+ `-input` `-x` `-suggest` `-clear`) `kim-viewhead` (`kim-view-title` `kim-view-count` `kim-matonly` `kim-layout-grid` `kim-layout-list` `kim-download`) |
| screens | `kim-view` → `kim-view-overview` (`kim-cardgroups`, `kim-card-item`, `kim-card-pop`), `kim-view-sub` (`kim-grid` `kim-grid-scroll` `kim-columns-btn` `kim-legend` `kim-impact-scale`), `kim-view-metric` (`kim-metric-row` `kim-corr-neg` `kim-corr-pos`), `kim-loading` |
| drawer | `kim-scrim` `kim-drawer` (`kim-drawer-crumb` `kim-drawer-close` `kim-drawer-body`) |
| nudge | `kim-coach-1` … `kim-coach-4` and `is-coached` on whatever is being pointed at |

---

## Things worth knowing if you change it

**The drawer opens before its figures arrive.** The panel slides in at once
with its own loader, and the charts are drawn a beat later. Two reasons: it is
the honest shape for something that fetches thirty years of a series, and it
keeps the slide from competing with two charts being built. The close button
is live the whole time, because a panel you cannot shut while it loads is a
trap.

**The drawer is inside the scaled canvas; a modal would not be.** A dialog that
belongs to the whole window (the case comparison's setup modal) sits outside
the canvas so it is never shrunk with it. This drawer belongs to the screen it
opens from — it is the metric's own panel — so it scales with everything else.

**Both charts are drawn at their measured width, not stretched.** Stretching a
viewBox stretches the text and the line weights with it, which is the giveaway
of a chart that was scaled rather than drawn. A consequence: a chart host has
to be *on the page* before it is drawn, or it measures nothing.

**An `<svg>` with a viewBox and no width stretches to fill its box.** Every icon
in the build is tied to the size of the text beside it by one rule in
`shell.css`. The charts have to out-weigh that rule, which is why their
selector names the drawer — a plain `.kim-chart` is lighter, and lost. Both
charts came out 12 pixels wide.

**`hidden` is only a default, and `display` beats it.** Every component that
sets its own `display` needs `[hidden] { display: none }` saying out loud, or a
head tool told to hide stays on screen. The Download button was visible on the
overview for exactly this reason.

**A card is a `<button>`, so nothing clickable can go inside one.** That is why
the nudge's bubbles for steps 2 and 3 are children of the view and are
*measured* into place rather than sitting inside their targets — and why they
divide the canvas scale back out before writing a number a stylesheet reads.

**The hover breakdown flips rather than spilling.** It opens to the right of
the movement count, which is right for four columns out of five; on the last
one it ran past the edge of the deck and scrolled the whole pane sideways by a
hundred pixels — moving the very thing the reader was pointing at. Which side
it opens on cannot be written in CSS, because how many cards fit in a row
depends on the width of the window, so `views.js` measures it after the hover
has landed.

**`overflow: hidden` makes a box a scroll container; `overflow: clip` does
not.** A hidden box has no scrollbars, but the browser can still scroll it
itself — and it does, whenever focus lands on something outside it. The trend
drawer starts one panel-width off the right edge and takes focus the moment it
opens, so the whole canvas slid left to meet it, which looked for all the
world like the background sliding in from the left while the drawer sat
still. The frame is `overflow: clip` now, and the one focus call that asked
for it passes `{ preventScroll: true }`.

**`.kim-spinner` is lighter than `.kim-frame svg`.** One rule ties every icon
on the page to the size of the text beside it, which is right for thirty icons
and wrong for the two things that are the point of their own screen. The
loader *was* appearing on every sub-industry you opened — at twelve pixels
across, which is indistinguishable from not appearing. Exactly the same trap
as the charts a round earlier, and the same fix: the selector has to name a
parent to out-weigh it.

**`:first-child` counts as a class when two rules are weighed.** That one fact
is why the frozen header cells were being drawn *under* "Quarterly Data":
`.kim-grid thead tr:first-child th` (two classes, three elements) is heavier
than `.kim-grid thead .kim-col-pin` (two classes, one element), so the row's
z-index of 4 beat the cell's own 6. The rule now names the row as well.

**A row that is as wide as the table cannot stay still, so the thing inside it
does.** Both the category names (Volume Drivers) and the column-group names
(Quarterly Data) are `position: sticky` *buttons* inside scrolling rows —
otherwise scrolling eight quarters sideways leaves bands of columns belonging
to nothing.

**A custom property cannot be animated until it has been declared.** To the
browser `--kim-col` is just text, and "320px" and "44px" are two unrelated
strings with nothing in between to draw. The five lines of `@property` in
`shell.css` are what let the selector slide rather than snap.

**The selector lists every sub-industry, always.** "Show only material moves"
belongs to the deck on the right — it sits in the same header as it — and the
selector is a way of *getting* somewhere. Filtering that too had two bad
effects: a name you knew existed could not be found, and every row that was
left carried a Material Move tag, which made the list look as though
everything was moving when fourteen of a hundred and twenty are. The tag now
means something there, because it is on some rows and not others.

---

## Drawn, not wired

Honest about what does nothing, so nothing on screen is a promise the
prototype cannot keep:

- the five nav items in the app bar, and Home / Support in the page band
- Global search in the app bar (the KIM search in the card is real)
- the Download menu, and the three items in it
- the favourite stars — they show which sub-industries are favourites, but
  pressing one does not change it
- the two info icons in the grid head (the arrow beside them is live — it
  folds the group)

Everything else works: both searches, the grouping, the material-moves switch,
the card/list toggle, the hover breakdown, opening a sub-industry, collapsing
the three driver groups, folding the two column groups, the Columns menu, the
trend drawer with its loader, ranges, range sliders and hover readout, the
correlated sub-industry links, light/dark, and the nudge.

---

## What was measured

- the frame is 1440 × 1024 at five window sizes (900 × 620 → 2560 × 1300),
  scaling 0.61 → 1.27, no sideways scroll, no console errors
- **1,060 pieces of text per mode across the four screens, every
  semi-transparent layer composited down to the colour it really sits on:
  zero contrast failures**, worst 4.58 against a 4.5 bar (light) and 4.64
  (dark), with a three-colour self-test reading 21.00 — the filled material
  pill included, in both modes
- the whole four-step journey driven end to end; each nudge step appears and
  advances only on its own action, and Skip ends it
- the range slider moves the window by keyboard as well as by pointer
  (JUL-2018 → APR-2019 on eight presses), and Escape closes the drawer
- the Columns menu turns a group off and refuses to turn off the last one
- the column groups fold (eight quarters plus a year → one quarter plus a
  year) and open again; the category name stays 16px from the left edge with
  the grid scrolled 420px sideways; the frozen header cells measure z-index 6
  against the group headers' 4
- the drawer's loader is up while the panel is still sliding, the headings
  carry the metric's name, the actual-value line and its legend swatch both
  measure `rgb(143, 68, 113)` (mist) and the percent chart stays teal, and the
  readout answers with a date and a value
- the selector's column measures 141px part-way through its slide — it is
  animating, not jumping

---

## Open questions

1. **The metric and sub-industry names are mine.** Real ones, or back to the
   sheet's placeholders?
2. **The percent-change table's W-O-W column reads N/A**, because the series
   behind it is monthly. Inventing a weekly figure from monthly data would be
   making something up on screen. Should the column go, or should the data
   become weekly?
3. **The second chart is year-on-year change.** Your sheet does not say which
   change it plots; Y-O-Y is the smoothest and the one a credit reader
   usually means. M-O-M is one line if you prefer it.
4. **The favourite star is read-only.** Making it work needs somewhere for the
   choice to live — this prototype has no memory between reloads.
