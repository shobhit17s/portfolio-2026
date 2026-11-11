# CLIENT DASHBOARD — an embeddable prototype

A working picture of the CreditRisk client dashboard, drawn at 1440 × 1024 and
**scaled to fit whatever space you give it**. Everything in it is a placeholder
except the **Performance to Plan** widget, which is the real Concept 1 you
approved. It lives in the CLIENT HEALTH tab.

---

## 1. HOW TO EMBED IT

Rename this folder to whatever the slot is called, drop it in, and point an
`<iframe>` at its `index.html`. Nothing inside refers to anything outside the
folder, so the name is yours and moving it breaks nothing.

```html
<iframe src="phase-02/assets/client-dashboard/index.html"
        title="CreditRisk client dashboard"
        loading="lazy"
        style="width:100%; aspect-ratio:1440/1024; border:0; display:block"></iframe>
```

**You no longer scale it yourself.** Give the iframe the 1440 ∶ 1024 shape and
any width you like; the prototype measures the room it has been given and sizes
itself. If you give it a box of a different shape it still keeps its own, and
the leftover shows as mount board around it.

---

## 2. THE SCALING RULE — `js/fit.js`

> **Standing rule from here on: every 1440 × 1024 prototype uses this file.**

Think of the prototype as a printed poster and the window as a picture frame.
We do not redraw the poster to fit — we shrink or enlarge the whole poster
until it just fits, and centre it.

A responsive layout would re-flow: columns stack, type reflows, things move.
That is right for a real product and wrong for a prototype of a screen, because
the thing being judged **is** the arrangement at 1440 × 1024.

Using it in a new prototype is three lines:

```html
<div class="fit-stage" data-fit-w="1440" data-fit-h="1024">
  <div class="fit-frame"> …the design, at its true size… </div>
</div>
<script src="js/fit.js"></script>
```

`fit.js` knows nothing about this dashboard — copy it as it is. The matching
`.fit-stage` / `.fit-frame` rules are the first block of `css/dashboard.css`.

**The one cost.** A scaled page is still 1440 wide as far as the browser is
concerned, so clicks, focus and scrolling all land correctly. At awkward
fractions (0.83, say) text is resampled and can look a touch soft. That is the
trade for keeping every proportion exactly as drawn.

---

## 3. WHAT IS IN THE FILES

| file | what it holds |
| --- | --- |
| `index.html` | the structure, and nothing else |
| `data/widgets.js` | **what is in each tab, and what each menu says** |
| `data/ptp.js` | the Performance to Plan numbers |
| `css/salt-theme-caraxes.css` | every colour, size and font, as Salt tokens, light and dark |
| `css/widget.css` | the Performance to Plan widget's look |
| `css/dashboard.css` | the shell's look — stage, bar, band, rail, panel, deck |
| `js/fit.js` | the scaling, and nothing else |
| `js/widget.js` | builds the Performance to Plan widget |
| `js/dashboard.js` | the shell's behaviour, the two screens, and the nudge |
| `data/clients.js` | the projections module's client book |
| `data/projections.js` | the projections module's figures |
| `css/projections.css` | the projections module's look |
| `js/projections.js` | the projections module's behaviour |

**The last four are the case-comparison prototype's own files, carried here
unchanged.** `css/projections.css` is byte-identical to that folder's
`css/app.css`, `js/projections.js` to its `js/app.js`, and the two data files
are the same files again — checked with a byte compare before shipping, not
assumed. Nothing about that screen was re-drawn for this prototype.

### The file you will actually edit

`data/widgets.js`. To move a widget between tabs, cut its line and paste it
into another list — that is the whole operation. To add one, add a line. To
change what the ACTIONS menu says, edit three labels at the bottom.

```js
'cd-pane-health': [
  { id: 'cd-w-health-1', name: 'Widget name' },
  { id: 'ptp-c1', name: 'Performance to plan', wide: true, type: 'ptp' },
  …
]
```

`wide: true` spans both columns · `body: 160` sets the grey block's height ·
`type: 'ptp'` means the real widget instead of a placeholder.

A tab whose list is empty shows **"No widgets available in this view yet."**

`dashboard.css` names **no colour and no font**; every value is a Salt token.
The only raw numbers are the frame's 1440 × 1024, the rail's two widths
(272 / 52), the 16px gap and the rail's 12px gutter — all of which you set.

---

## 3b. THE SECOND SCREEN, AND HOW YOU GET THERE

The widget's footer now says **View latest projection**. Pressing it shows a
loader for a moment and lands you in the **projections module** — the same
screen as the case-comparison prototype, under the **Analyze** tab. The nav
item for **Clients** brings you back, and **Analyze** takes you there again.

Three decisions worth knowing:

**The two screens share one grid row.** The app bar and the page band stay
put; only the row underneath swaps, so nothing on the page moves as you go
from one to the other. Every child of the frame names its own row, because a
grid places what you placed by hand first and flows the rest around it — one
explicit placement and they all have to be explicit.

**The page band's title changes before the veil lifts**, so what comes back
is already labelled. The other order leaves you looking at a new screen under
the old screen's name.

**No comparison can be generated here.** One line in `index.html` —
`window.CC_ALLOW_COMPARISON = false` — is read by `js/projections.js` in two
places: the Actions menu, and whether that screen's own tour runs at all. The
menu still opens and still lists what it lists, drawn and inert, exactly as
Export is. The alternative was a second, trimmed copy of that script, and two
copies of anything drift the moment one of them is touched.

---

## 3c. THE NUDGE

Two steps, the same bubble and ring the projections module uses — it is
literally that screen's `.cc-coach`, since its stylesheet is on this page
already, so there is one tooltip on the project rather than two that nearly
match.

```
1  under the tab strip, pointing up:   "Start here — open Client health."
2  over the widget's footer, pointing
   down at the button:                 "Now open the latest projection."
```

The second step cannot exist until the first has happened, because the thing
it points at is inside a tab that is not showing yet. Both bubbles are
centred on their target by one measured number, taken from `offsetLeft` — the
layout's own unscaled pixels, so the aim holds at any scale of the canvas.
Step two scrolls the widget into view, because a tooltip pointing at
something below the fold is worse than no tooltip. It ends the moment you
open the projection — by the button or by the nav — and never comes back.

---

## 3d. THE THREE CASES NOW DIFFER

The case dropdown used to change the label and nothing else. Each case now
carries its own **plan**, in `data/ptp.js`.

**The case changes the plan, not the actuals.** The actuals are what the
company did; there is only one past. The case is what you said *would*
happen. Everything else follows on its own: the deltas are actual minus plan,
so they all move, and a cell is washed when the gap passes that attribute's
threshold, so the washed cells move with them. Nothing in the widget had to
be told about cases.

| case | what it is | what you see |
| --- | --- | --- |
| Credit | the bank's own line | 9 cells washed, all negative |
| Management | the company's more ambitious line | 12 cells, all negative |
| Downside | the stress line | 6 cells, **a mix of green and red** |

That third one is the reason to have cases at all: the same client reads as a
problem or as a near miss depending on what you measured them against, and
the screen has to be able to say so.

---

## 4. WHAT IT DOES

**It fits the window.** Any size, same shape, centred.

**The rail collapses.** Click the `«`. The rail goes 272 → 52px and the panel
and the widgets widen into that space *together* — they share one `1fr` column,
so neither can take it without the other. Measured: both go 1338 → 1354px.

**Only the widget deck scrolls.** The app bar, the page band, the rail and the
SUBSIDIARY ONE panel never move.

**The panel is anchored to the band above it** — no gap, and its top two
corners are square, so the two read as one piece of chrome rather than a card
that happens to be near the top. The grey rule along the bottom of the band is
also the panel's top edge: one line doing both jobs, because two there would
read as a double border.

**The widgets' right edge lands on the panel's right edge**, on every machine.
See §6 — the scrollbar makes this harder than it sounds.

**ACTIONS is a menu.** Three placeholder items; Escape or a click outside
closes it, arrow keys walk it.

**The "…" on Performance to Plan opens one item: Export widget data.** Clicking
it closes the menu and returns focus, which is the honest behaviour for an
action that has not been designed yet.

**The expand icon opens a widget in its own closable tab**, added at the end
of the strip — to the right of CLIENT EXPOSURE — so the three permanent tabs
never shuffle sideways while you are using them. Closing it returns you to
whichever tab you opened the widget from. This works on the grey placeholders
too: each opens as itself, not as a copy of Performance to Plan.

**Clicking a subsidiary re-titles the panel**, so the rail and the panel
heading can never disagree about whose figures are on screen.

**The moon switches light and dark.**

---

## 5. THE NAMES — PLEASE APPROVE OR CHANGE THESE

`cd-` is the dashboard shell, `ptp-` is the widget (those names come from the
standalone build).

**Stage, bar and band**
`cd-stage` · `cd-frame` · `cd-appbar` · `cd-brand` · `cd-nav` ·
`cd-nav-surveillance` · `cd-nav-clients` · `cd-nav-portfolios` ·
`cd-nav-create` · `cd-nav-analyze` · `cd-appbar-right` · `cd-globalsearch` ·
`cd-globalsearch-input` · `cd-mode` · `cd-account` · `cd-pageband` ·
`cd-pagetitle` · `cd-body`

**View selector**
`cd-rail` · `cd-rail-head` · `cd-rail-title` · `cd-rail-toggle` ·
`cd-rail-open` · `cd-groupby` · `cd-railsearch` · `cd-railsearch-input` ·
`cd-listwrap` · `cd-listlabel` · `cd-clients` · `cd-family-1` … `cd-family-5` ·
`cd-family-2-subs` · `cd-sub-1` … `cd-sub-4`

**Panel and tabs**
`cd-main` · `cd-panel` · `cd-panel-top` · `cd-subject` · `cd-parent` ·
`cd-actions` · `cd-summary` · `cd-tabs` · `cd-tab-profile` · `cd-tab-health` ·
`cd-tab-exposure`

**Deck**
`cd-deck` · `cd-pane-profile` · `cd-pane-health` · `cd-pane-exposure`

**The second screen, the veil and the nudge** — new
`cd-proj` · `cd-veil` · `cd-veil-says` · `cd-coach-1` · `cd-coach-2`

Everything inside `cd-proj` keeps the `cc-` names it has in the
case-comparison folder, listed in that folder's README — they are the same
elements, carried, not copies.

**Built at runtime, named in `data/widgets.js`**
`cd-w-profile-1…5` · `cd-w-health-1…4` · `cd-w-exposure-1…4` · `ptp-c1`
Each placeholder also gets `-name`, `-expand`, `-more`, `-body`, `-cta`.
Each menu gets `<button id>-menu`; the items are named in `widgets.js`.
An expanded widget gets `<id>-tab`, `<id>-tab-close`, `<id>-pane`,
`<id>-expanded`.

**Two names exist only to hold something**: `ptp-c1-slot` spans the widget
across both columns, because the widget's own builder rewrites the class list
of the element it is handed and would wipe a span written there; and
`cd-menuwrap` positions a menu beside its button, because a `<button>` may not
contain other buttons.

---

## 6. WHAT I CHECKED

Measured, not eyeballed, at four window sizes and in both modes:

- the shape is **1.4063 at every size** — 1440 × 1024, 900 × 640, 1688 × 1200,
  600 × 427 — and the page never overflows in either direction
- the nav's centre and the bar's centre are **both at 720**
- the panel's top edge and the band's bottom edge are **both at 111** — flush
- every gap between widgets, and between the panel and the deck, and between
  the rail and the panel, is **16px**
- every rail item leaves **12px** at each edge
- the widgets' right edge and the panel's right edge are **both at 1423**, in
  all three tabs, with the scrollbar both absent and present
- the frozen column's edge is a **2px `#C6D4DC` rule with no blur** — the same
  grey as every other divider in the table, and no drop shadow anywhere on it
- `cd-deck` is the only scrolling thing on the page
- the expanded tab lands **between CLIENT HEALTH and CLIENT EXPOSURE**, closes
  cleanly, and leaves no orphan panel behind
- every piece of text passes WCAG AA against its real background, in all three
  tabs, in both light and dark
- no console errors

**Two bugs this caught.**

*The expand icon on a grey placeholder was building a full Performance to Plan
table inside it*, because the expand handler always called the PTP builder. The
expanded copy is now built from the same entry in `data/widgets.js` that the
original was.

*The widgets stopped 10px short of the panel's right edge, and it was the
scrollbar.* Worth understanding, because it will come back.

A scrollbar comes in two kinds. On a Mac it floats over the content like a
sticker on a window — it costs nothing and nothing moves. On Windows and Linux
it is a solid strip cut out of the inside of the box, so everything in that box
is squeezed left by about 15px. The deck's own outline still lines up with the
panel; its *contents* do not.

The fix is two lines that cancel each other out:

```css
.cd-deck {
  scrollbar-gutter: stable;                        /* always leave the strip */
  margin-inline-end: calc(-1 * var(--cd-sbw, 0px)); /* grow by exactly that */
}
```

`scrollbar-gutter: stable` holds the strip open whether the bar is showing or
not, so the inset is a constant rather than something that jumps when you
change tab. The negative margin then makes the deck that much wider to the
right, so the content box ends on the panel's edge and the strip sits out in
the 16px margin where there was nothing anyway.

`--cd-sbw` is **measured from the deck itself** at runtime, in `dashboard.js`.
My first attempt measured a throwaway test `<div>` instead, and got 0 — because
the browser's *default* bar floats, while the deck, having asked for a stable
gutter, is given a real 10px strip. The test div and the deck disagreed, and
the widgets stayed misaligned. Asking the element you actually care about
(`offsetWidth - clientWidth`) is right on every platform, and is 0 on a Mac,
where both lines then do nothing.

---

## 7. OPEN QUESTIONS FOR YOU

1. **The three ACTIONS labels are my invention** — "Add to watchlist",
   "Request update", "Download summary". The reference only says ACTIONS. Tell
   me the real ones and I will swap them in `data/widgets.js`.
2. **The collapsed rail is blank below the button.** Keep anything there — the
   words turned on their side, small icons for the families — or leave it?
3. **The fonts come from Google.** Offline the page still works but falls back
   to the system font. I can bundle the font files (~120 KB) and make the
   folder fully self-contained.
4. **The nav pills, both search boxes and GROUP BY FAMILY are drawn, not
   wired.** Which of them should do something?
5. **The widget's numbers and the thresholds that turn cells pink are
   placeholders** — a starting position, not a finding.
6. **The expanded tab is quite tall and empty below the table.** Should the
   expanded widget hug its content instead of filling the pane?
7. **The PTP widget's HEADER is still shorter than the plain widgets' —
   45px against 61px.** You asked me to even up the footers and I have, to
   the pixel; the headers have the same mismatch and I have left them alone
   because you did not ask. Say the word and it is one line.
8. **The three new plans are mine.** 540 / 78 / 14.5 / 3.2 / 48 for
   Management and 450 / 52 / 11.0 / 4.9 / 18 for Downside, chosen so the
   three cases tell three different stories. Real numbers would be better.
9. **The projections module's Actions menu still lists Case comparison**,
   drawn and inert. Should it be greyed out instead, so it is plain that it
   is off here rather than broken?
