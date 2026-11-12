# CASE COMPARISON — SALT DS

The flow from `00-high-fidelity-prototype.pdf`, built in Salt. Five screens,
drawn at 1440 × 1024 and scaled to whatever room it is given.

```
0  the client loader band, above the tabs: who the module is pointed at
1  Latest projection   ->  Actions  ->  Case comparison
2  Setup parameters, over a scrim
3  the results tab appears, loading
4  the grid: ONE table, grouped by attribute, cases as rows
   Adjust parameters reopens the same modal
```

---

## 1. HOW TO USE IT

Rename this folder to whatever the slot is called, drop it in, and point an
`<iframe>` at its `index.html`. Nothing inside reaches outside the folder.

```html
<iframe src="phase-01/assets/<this folder>/index.html"
        title="Case comparison prototype"
        loading="lazy"
        style="width:100%; aspect-ratio:1440/1024; border:0; display:block"></iframe>
```

Give the iframe the 1440 ∶ 1024 shape and any width you like; the prototype
measures the room it has and sizes itself. Opening `index.html` straight in a
browser works too.

---

## 2. WHAT IS IN THE FOLDER

| file | what it holds |
| --- | --- |
| `index.html` | the structure, and nothing else |
| `css/salt-theme-caraxes.css` | every colour and size, as Salt tokens, light and dark |
| `css/app.css` | this prototype's own look |
| `js/fit.js` | the scaling, and nothing else |
| `js/app.js` | everything that moves |
| `data/projections.js` | the figures, from the workbook you supplied |
| `data/clients.js` | the client book the loader lists — **the file to edit** |

**Two of these are copies you already have, unchanged.**
`css/salt-theme-caraxes.css` and `js/fit.js` are byte-identical to the ones in
the client-dashboard folder — checked, not assumed. Nothing else about the Salt
kit has moved since you last saw it, so this folder carries no change you did
not ask for.

`app.css` names **no colour and no font**; every value is a Salt token. The only
raw numbers are the frame's 1440 × 1024 and three layout constants at the top
of the file — the card's inset, its padding, and the gap between the bands of a
pane — which the reference sets by eye.

---

## 3. WHAT MATCHES THE REFERENCE, AND WHAT YOU CHOSE

**The results grid is one table grouped by attribute**, as page 5 draws it:
REVENUE, EBITDA, LEVERAGE, CASH FLOW are collapsible headings, and the cases
are the rows under each. The old attribute tab strip is gone. Click a heading
to fold that attribute away.

**No trend chart and no insights panel.** The reference does not draw them, and
you said to drop them.

**Export is drawn and does nothing** — the button on the results toolbar, and
Export projection in both the Actions menu and the inventory kebabs. They are
live to the eye and land nowhere, which is the honest state for an action that
has not been designed.

**All three new controls work:**

| control | what it changes |
| --- | --- |
| Projection period | how many year columns the grid shows — 3, 5 or 10 |
| Show deltas | whether the second line appears under each figure |
| Delta calculation logic | percentage (−22.8%) or absolute (−12.4) |

**The nudge is carried over** from the lofi version, even though this reference
does not draw it. It is now **your tooltip** — a pale card with a hairline
round it and a point aimed at the control it is talking about, so it reads as
help rather than as an advert. It rings the Actions button, then moves to ring
Case comparison once the menu is open, then ends for good.

**There is no Skip any more**, by your instruction. Choosing Case comparison is
the only way out, which is fine while the tour is two steps long and the second
step already sits on the item it is asking for. A longer one would need a way
to leave.

**The base case is greyed out of "Compare to"**, and the grey moves when you
change the base. A case cannot be compared with itself.

---

## 3b. THE COLOUR, WHICH IS NOW THE WHOLE SIGNAL

**The heatmap is gone.** A washed cell colours the figure as well as the gap,
and the figure is not the thing that is good or bad — 844.8 is just a number.
The colour is on the delta alone now, which puts the meaning exactly on the
word that carries it and leaves the grid readable as a grid.

**GREEN MEANS GOOD, NOT UP.** On revenue, EBITDA and cash flow those are the
same thing and the difference never shows. **On leverage they are opposite**:
leverage is debt measured against earnings, so a rise means more borrowed
against the same money, and the grid says that in red even though the number
went up. Which way is good lives with the attribute, in `app.js`:

```js
{ id: 'leverage', name: 'Leverage', …, upIsGood: false }
```

**Every delta is coloured**, however small — the old 10% threshold is gone
entirely, so the grid is no longer telling you which gaps deserve your
attention. **A flat zero keeps the quiet grey**, and is written `0.0%` rather
than `−0.0%`: a minus that rounds away to nothing is a sign that means nothing.

**The two colours are yours** — `#00875D` and `#E52135`. They only just clear
the contrast bar on white (4.54 and 4.56 against the 4.5 small text needs), and
on the dark surface they do not clear it at all, so each has a lightened twin
of the same hue: `#009466` and `#E94152`, measured rather than guessed.

**The legend sits under the grid and does not scroll with it** — a key that
scrolls away is a key you cannot check against the thing it explains. It
disappears when Show deltas is off, because a key to colours nobody can see is
furniture.

---

## 3c. THE CLIENT LOADER

From `fc52e3e4-00-client-loader.pdf`. A band at the very top of the card,
above the tabs, naming whoever the module is pointed at — because the tabs,
the ledger and every comparison below it all describe that one client.

**Closed** it is a pale band that bleeds to the card's edges: an avatar, the
name, the family underneath it, the pills, the org-chart glyph, and a chevron
box at the far right.

**Open** the band fills with the accent and the panel drops out of it, over
the page. Nothing below moves, so your place is still there when you shut it.
The pills and the chevron box invert at the same moment — white fill, accent
text — which is the same trick the selected nav pill uses on the app bar, and
for the same reason: an accent pill on an accent band is an invisible pill.

**What it does**

- **the whole band is the button.** The org-chart glyph sits inside it, drawn
  and inert exactly like Export — so clicking it opens the panel rather than
  landing on a dead patch in the middle of a live band
- **search filters as you type**, across both levels. A family that matches
  brings its whole family with it; a subsidiary that matches brings its
  family's name with it, because "Subsidiary one" on its own, with three
  others like it in the book, does not say which one it is
- **a family is selectable too** — picking one loads the family, consolidated.
  The caption line under the name then disappears, because the big line
  already *is* the family and repeating it reads as a bug
- **picking anyone shows the module reloading**: the header changes first,
  then a veil covers the tabs and the ledger with the same arc the comparison
  uses. Doing it the other way round leaves you looking at a spinner under the
  name of the client you just left
- **the nudge stands down** while the panel is open or the veil is up. Two
  things asking for attention at once is neither of them being read
- **Escape closes the nearest open layer** — a menu or the modal gets the key
  first, and this panel only takes it when nothing is above it
- **the figures that come back are the same ones.** This prototype has one set
  of numbers, and inventing a dozen more would be inventing them. What is
  being prototyped is the *act* of loading a client

**The list's pills are the muted one you sent** — `#DBF5F7` with a `#99ABAC`
hairline, and the accent's own foreground as the text, which measures 5.19 in
light and 4.65 in dark. They are quieter than the band's on purpose: the
band's pills describe the client you *have* loaded, the list's describe eight
you have not, and a filled pill on every row turns the list into a wall of
colour that the loaded row cannot stand out from. Both pills are the same
rule wearing different clothes — two variables, `--cc-pill-bg` and
`--cc-pill-fg`, carry the whole difference.

**The panel shares the band's bottom edge**, pulled up by exactly its own
border width so the two lines land on each other and square top corners stop
the curve drawing a boundary. A gap, however small, is the eye being told
these are two separate things.

**Changing client when results are open asks first.** A comparison belongs to
the client it was run for, so loading someone else makes it meaningless and it
has to go — and taking something away without saying so first is the one thing
a prototype must not teach. The question comes at the **chevron**, before the
panel opens, because that is the last moment nothing has been committed to;
asking after a client has been picked is asking someone to undo a choice they
have already made in their head. Cancel is what holds the focus, so a stray
Enter gives the safe answer, and Escape says the same thing. **The results only
go when a client actually changes** — opening the panel and shutting it again
without picking anybody has changed nothing, so nothing is taken away. With no
results open, the chevron just opens the panel.

**To change the list, edit `data/clients.js` and nothing else.** Families,
subsidiaries, their pills, the extra `review` label the header shows and the
rows do not, and which client is loaded when the page opens — all of it is in
that one file, commented.

---

## 4. TWO THINGS I DECIDED, THAT YOU MAY WANT TO CHANGE

1. **"Custom case" has invented figures, and has to.** Page 5 draws it as a
   row, but it is whatever the reader has just built — the model has never
   heard of it. It is derived from the base by a fixed shape, which keeps it
   consistent with its own row. It is the only row here whose numbers are not
   read from the workbook. It appears only if you pick it in Compare to.
2. **The toolbar shows currency and scale and nothing else**, because that is
   what the reference draws. The older prototype also carried the company name;
   say the word and it comes back.

---

## 5. THE NAMES — PLEASE APPROVE OR CHANGE THESE

Everything is `cc-` for "case comparison".

**Stage, bar and band** `cc-stage` · `cc-frame` · `cc-appbar` · `cc-brand` ·
`cc-nav` · `cc-nav-surveillance` · `cc-nav-clients` · `cc-nav-portfolios` ·
`cc-nav-create` · `cc-nav-analyze` · `cc-appbar-right` · `cc-globalsearch` ·
`cc-globalsearch-input` · `cc-mode` · `cc-account` · `cc-pageband` ·
`cc-pagetitle` · `cc-card`

**The client loader** `cc-client` · `cc-client-head` · `cc-client-avatar` ·
`cc-client-id` · `cc-client-name` · `cc-client-family` · `cc-client-pills` ·
`cc-client-orgchart` · `cc-client-chev` · `cc-client-panel` ·
`cc-client-search` · `cc-client-search-input` · `cc-client-list` ·
`cc-client-none` · `cc-veil` · `cc-veil-says`

**Tabs** `cc-tabs` · `cc-tab-latest` · `cc-tab-inventory` · `cc-tab-results`
(the last is built when the analysis runs)

**Latest projection** `cc-pane-latest` · `cc-latest-toolbar` · `cc-latest-meta` ·
`cc-case` · `cc-actions-wrap` · `cc-actions-btn` · `cc-actions-menu` ·
`cc-cmp-item` · `cc-coach-1` · `cc-coach-2` · `cc-ledger`

**Inventory** `cc-pane-inventory` · `cc-inventory-scroll` · `cc-inventory` ·
`cc-inventory-rows`

**Results** `cc-pane-results` · `cc-results-toolbar` · `cc-results-meta` ·
`cc-adjust` · `cc-export` · `cc-loading` · `cc-loader-says` · `cc-result` ·
`cc-grid` · `cc-grid-head` · `cc-grid-body`

**The "are you sure" dialog** `cc-ask-scrim` · `cc-ask` · `cc-ask-title` ·
`cc-ask-body` · `cc-ask-says` · `cc-ask-no` · `cc-ask-yes`

**The modal** `cc-scrim` · `cc-setup` · `cc-setup-title` · `cc-col-what` ·
`cc-col-how` · `cc-period` · `cc-base` · `cc-against` · `cc-against-label` ·
`cc-attrs` · `cc-attrs-label` · `cc-deltas-head` · `cc-show-deltas` ·
`cc-delta-logic` · `cc-cancel` · `cc-apply`

---

## 6. WHAT I CHECKED

Measured rather than eyeballed:

- the shape holds at **1.4063** at 1440 × 1024, 980 × 620 and 1920 × 1080, and
  the page never overflows in either direction
- **Projection period 5** gives five year columns; **Show deltas off** removes
  every delta line; **Absolute** turns −22.8% into −12.4
- the base case is greyed out of Compare to, and the grey **moves** when the
  base changes, taking that case's pill out of the field with it
- **leverage is coloured the opposite way round**: Downside at +21.1% is red,
  Management at −9.9% is green, while on revenue and EBITDA up stays green
- **no washed cells anywhere** — the heatmap is gone, counted not assumed
- a flat zero reads `0.0%` and takes neither colour
- the name column is **260px whether every group is open or every group is
  shut**, which was the bug
- the far end of a group row is inside its button, so clicking the empty part
  of the row folds it
- the legend disappears when Show deltas is off
- a group heading is **48px, the same as a case row and the column header**
- the second tooltip's point lands on the **centre of Case comparison**,
  measured, not eyeballed — and the first sits under the Actions button with
  its point on it
- a group heading folds its attribute away and back
- a kebab in the inventory opens one menu and **marks the row it came from**,
  because the menu covers that row
- the nudge appears, moves when the menu opens, and ends on the choice
- every piece of text passes WCAG AA against its real background, on every
  screen, in **both light and dark**
- the **client loader**: the band opens and shuts, the chevron turns over,
  the panel overlays the tabs and the ledger without moving them, the list
  scrolls (606px of rows in a 483px window), search narrows to one family and
  to none, picking a family drops the caption line, the veil covers everything
  below the band for 900ms, Escape shuts the panel, a click anywhere else
  shuts it, and **nothing leaks past the panel's edge** — counted in pixels,
  which is how the nudge's outline was caught
- every piece of the loader passes WCAG AA in both light and dark: the name,
  the family line, the pills on the filled band, the search field, the row
  names, the row pills, the empty-result line and the veil's caption
- **every row ends exactly where the panel ends**, measured: family rows and
  subsidiary rows both finish at 1365, and the list's scroll width equals its
  client width, so there is nothing off to the side to scroll to. The last
  pill was being cut off because a row is 100% wide and an indent is a margin
  added *on top of* that width — the width now subtracts what the margin adds
- a long name trims itself with an ellipsis rather than pushing its pills off
  the edge, whatever font the browser falls back to
- **the warning, all five ways through it**: with no results the chevron opens
  the panel straight away; with results it asks and the panel stays shut;
  Cancel and Escape both leave the results and the panel exactly as they were;
  Proceed opens the panel *and the results are still there*; and only picking
  a client takes them away, dropping the tab and returning to Latest projection
- **the legend square is 11px, the same as the legend's own text** — it is set
  in `em`, so the two can never drift apart
- the whole comparison flow still runs end to end afterwards, and the frame is
  still exactly 1440 × 1024
- no console errors anywhere in the flow

---

## 7. OPEN QUESTIONS FOR YOU

1. **The reference's last column is a second "2028"**, after 2035. I read that
   as a slip in the sheet and ran the years straight through. Tell me if it
   means something.
2. **The reference's results toolbar says "ADJUST PARAMETES".** I have spelled
   it "Adjust parameters".
3. **"Correlation" may not be the word you want.** The legend says "positive
   correlation" and "negative correlation" because that is what you wrote, but
   what the colour marks is whether a case is better or worse than the base —
   "impact", or "better/worse than base", might be nearer. Your call; it is one
   line in `index.html`.
4. **Analysis #2 and #3 open the same setup modal** and run the same
   comparison, because nothing says what else they would be. Should they be
   greyed instead?
5. **The reload takes 900ms and the numbers do not change.** Should a
   different client show different figures? I would need a second set from
   you — making them up would put invented numbers next to real ones.
6. **The client list is placeholder.** Three families, eight subsidiaries, all
   graded AA or A, as the reference draws them. Send me a real-shaped list and
   it is one file.
7. **The fonts come from Google.** Offline the page still works but falls back
   to the system font. I can bundle them and make the folder fully
   self-contained.
