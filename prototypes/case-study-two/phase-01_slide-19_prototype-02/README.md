# CASE COMPARISON — PROTOTYPE 02
## Ask first, then answer

Choosing **Case comparison** from the Actions menu opens **Setup parameters**
before anything is generated: base case, what to compare it to, which
attributes. Apply runs it. **Adjust parameters** on the results tab reopens the
same modal.

**This is the half of the argument that says: make them say what they are
asking.** Prototype 01 is the other half — it runs on a default and lets you
tune it after. The two differ in exactly one thing, *when* the question gets
asked, which is the point of putting them side by side.

---

## 1. HOW TO USE IT

**Rename this folder to whatever the slot is called, drop it in, and point an
`<iframe>` at its `index.html`.** Nothing inside reaches outside the folder, so
the name is yours and moving it breaks nothing.

```html
<iframe src="phase-01/assets/<this folder>/index.html"
        title="Case comparison prototype"
        loading="lazy"
        style="width:100%; aspect-ratio:1440/1024; border:0; display:block"></iframe>
```

The prototype is drawn at 1440 x 1024 and **scales itself to whatever room it
is given**, keeping its shape. Give the iframe the 1440:1024 shape and any
width you like. Opening `index.html` straight in a browser works too.

---

## 2. WHAT IS IN THE FOLDER

```
index.html        the structure
app.css           the few rules that are true of THIS prototype only
app.js            everything on the page that moves
data/
  projections.js  the figures, generated from the workbook you supplied
kit/
  css/  (21 files)   the lofi design system, exactly as it is in the repo
  js/   (13 files)
```

**The `kit/` folder is a COPY of `lofi-ds-1/`, not a link to it.** That is the
price of a folder you can rename and move: the moment one file reached back out
to `../../../lofi-ds-1/`, moving the folder would break it. The cost is that
changing the kit in the repo does not change this copy. If that becomes
annoying, say so and I will go back to one shared kit — but then neither
prototype can be moved on its own, which is the thing you asked for.

The hand-drawn font is **inside `kit/css/lofi-face.css`** as data, so it works
with no network at all. The only thing fetched from outside is the Google Fonts
line in `index.html`, which is a fallback stack; offline the page still works
and still looks hand-drawn.

---

## 3. WHAT IT DOES

**Only "Case comparison" is live** in the Actions menu on the Latest projection
tab. Both exports and both other analyses are greyed — still there, because a
reader has to see what is being passed over, and that is what makes finding the
right item a design problem at all.

**A two-step nudge points the way.** An orange bubble says *"Start here — open
Actions"* and rings the button; open the menu and it moves to *"Now choose Case
comparison"* and rings the item. Pick it, or press Skip on either bubble, and
the tour ends for the life of the page and does not come back. A nudge that
reappears after you have done what it asked is not help, it is nagging.

**The base case is greyed out of "Compare to"**, and the grey moves when you
change the base. If the case you are making the base was already being compared
against, its pill is taken out of the field at the same moment — a list saying
one thing and a field saying another is the two halves of one control
disagreeing in front of the reader.

**The grid follows what you picked.** The attribute tabs are the attributes you
chose; the rows are the cases you chose, in your order, with your base on top.
Leave one attribute selected and the tab strip hides itself, because one tab is
not a choice.

**Export is gone** — the button on the results tab, the preview behind it, and
the export items in every menu.

---

## 4. THE NAMES — PLEASE APPROVE OR CHANGE THESE

Everything is `cc-` for "case comparison".

**The shell** `cc-app` · `cc-nav` · `cc-module` · `cc-page` · `cc-panel` ·
`cc-tabs`

**Latest projection** `cc-view-latest` · `cc-case` · `cc-actions` ·
`cc-actions-btn` · `cc-cmp-item` · `cc-coach-1` · `cc-coach-2` · `cc-ledger`

**Inventory** `cc-view-inventory` · `cc-inventory` · `cc-inventory-rows`

**Results** `cc-view-results` · `cc-result-controls` · `cc-adjust` ·
`cc-loading` · `cc-loader-says` · `cc-result` · `cc-attrs` · `cc-lens-table` ·
`cc-table` · `cc-table-head` · `cc-table-body` · `cc-lens-trend` · `cc-chart` ·
`cc-readout` · `cc-chart-legend` · `cc-scrub-says` · `cc-lens-insights` ·
`cc-ins-insights` · `cc-ins-trends` · `cc-ins-details`

**The modal** `cc-setup` · `cc-setup-title` · `cc-base` · `cc-base-label` ·
`cc-against` · `cc-against-label` · `cc-attr-pick` · `cc-attrs-label` ·
`cc-apply`

---

## 5. WHAT I CHECKED

Run from a renamed copy of this folder, in a browser, measured rather than
eyeballed:

- **not one missing file** — every stylesheet, script and the font all load
  from inside the folder
- the coach appears on load, moves when the menu opens, and ends on the choice
- only Case comparison is clickable in that menu
- the modal opens over the scrim and the **whole** of the attribute list fits
  on screen when opened
- Escape closes the open dropdown and **keeps the modal**
- the base case is greyed out of Compare to, and the grey moves with the base
- the grid's rows and attribute tabs follow the selection
- no Export anywhere
- no console errors

---

## 6. OPEN QUESTIONS FOR YOU

1. **The inventory kebabs' "Export projection" is greyed too.** You asked only
   for the *comparison results* export to go, but it opened the same preview
   that is now gone, so it had nowhere to lead. If you want it live it needs a
   modal of its own — say the word.
2. **The nudge's wording is mine** — "Start here — open Actions" and "Now
   choose Case comparison". Tell me what it should say.
3. **Should the nudge come back on a reload?** It does now. If the slide loops
   or auto-replays, you may want it shown once and then never.
4. **Significant deviation is fixed at 10%.** The old drawer had a 5/10/15
   picker and it went with the drawer. Should it come back into the modal?
