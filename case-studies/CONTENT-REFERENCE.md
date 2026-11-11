# What you can write on a slide’s line, and everything else in content.js

**Generated from the engine.** `node tools/content-reference.js --write`
rebuilds it by reading `system/js/cs-templates.js`, so it cannot drift.
Do not edit by hand — the next rebuild overwrites it.

Its companion is **[COPY-REFERENCE.md](COPY-REFERENCE.md)**, which covers
the WORDS. The split is the same one the files make: **copy.js holds what
it says, content.js holds what it is.**

---

## The shape of content.js

```js
CS.CASE_STUDY = {
  copy: 'study',            // fold the `study` block of copy.js onto this
  meta: { … },              // the page title, the back link, study-wide switches

  story:    [ … ],          // THE RUNNING ORDER — the slides, in order
  nutshell: [ … ],          // an optional short version; with none, no "in a nutshell" switch
  parked:   [ … ],          // slides deliberately not in the order. Not drawn, not warned about

  personas:   [ … ],        // the people on the persona slide
  userGroups: [ … ],        // the faces a use-case slide shows
  drawers:    { … },        // the panels a word can open

  workflowSets: { … },      // named runs of diagrams. Usually unnecessary — see below
  diagramSets:  { … },      // the same for the backend slide
  diagrams:     [ … ],      // the study’s one plain list, for `backend`
  workflows:    [ … ]       // the study’s one plain list, for `wireframe`
};
```

### `meta`

| | |
|---|---|
| `id` | the study’s folder name. Prototypes are found under it |
| `title` | the page title |
| `backHref` / `backLabel` | where "back" goes and what it says |
| `storyNote` / `nutshellNote` | the line under each view’s tab |
| `showRatings: false` | **no assessment strip on any use-case slide in this study** |

---

## Switches: how to turn a thing OFF

The whole site uses one idiom for this, and it is worth learning once:
**leaving a key out means "not written yet", and a value means "no, on
purpose".** The first draws a placeholder naming what it wants; the second
draws nothing and says nothing.

| To turn off | Write | Where |
|---|---|---|
| the heading on a slide | `title: null` | the slide’s line |
| the drawing on a slide | `media: null` | the slide’s line |
| a whole slide | `hidden: true` | the slide’s line |
| the assessment strip, this slide | `ratings: false` | the slide’s line |
| the assessment strip, whole study | `showRatings: false` | `meta` |
| just the feasibility card | `feasibility: false` | the slide’s line |
| just the impact card | `impact: false` | the slide’s line |
| the question above a stepped diagram | `question: false` | the slide’s line |
| a grid’s grouping column | `grouped: false` | copy.js |
| the drawing prefix inside a phase | `slotPrefix: ''` | the phase’s `CS.TABS` entry |

### And three that turn themselves off

Nothing to write — the engine drops a control when there is nothing to
choose between, because a control offering one option asks you to choose
between one thing:

| | |
|---|---|
| **one persona** | no arrows, no counter, no swipe. The portrait takes the full width, so it is slightly wider than on a two-person slide |
| **one tab in a tab series** | no tab bar; the phase’s slides carry on down the page |
| **no `nutshell` list** | no "In a nutshell / The detailed story" switch |

---

## `views:` or `flows:`

**`views: 4` is almost always the one you want.** Four drawings that are
views of one thing, named from the slide — `slide-04_img-01` to `-04`.
There is no list to keep in step, because the count IS the list.

`flows: 'name'` is for a slide offering a CHOICE between several named runs
of drawings, each with its own tab. If the set you are pointing at holds one
run whose drawings are named after the slide, `views:` says the same thing
and the set can be deleted.

---

## Inside a phase folder

```js
CS.TABS['phase-01'] = {
  label: 'Phase 1',          // what the tab says
  slotPrefix: 'phase-01',    // goes in front of every drawing this phase works out
  slides: [ … ],             // written exactly as any slide anywhere

  workflowSets: { … },       // a phase may own any of the study’s lists
  userGroups:   [ … ],
  personas:     [ … ],
  drawers:      { … },

  shares: ['userGroups']     // … or borrow the study’s, by name
};
```

A phase reads its OWN lists. If it declares one, the study’s of that name is
invisible to it; if it declares neither that list nor `shares`, the console
says so rather than silently borrowing. `shares: true` takes the lot.

**A drawing you name by hand inside a phase needs the prefix yourself** —
`media: 'phase-01_slide-03_img-01'`. The engine only prefixes the names it
works out, because those are the ones you cannot see.

---

## Every template

### `backend`

Nothing but `template` and `copy`.

> Shows the study’s plain `diagrams` list. With no such list the slide is empty.

### `chapter-name-graphics`

| on the slide’s line | |
|---|---|
| `fade` | `fade: false` — a `graphics-outside` chapter band keeps its own hard edges and rounded corners instead of melting into the page. Left out, the edges fade |
| `graphics` | which palette colours light a chapter mark: `[‘sun’, ‘mist’]`. Every name is a light, and the first is also the ground the others move across. One to four |
| `variant` | which variant of a chapter mark: `‘graphics-inside’` (the default — the lights inside the letters, nothing else painted), `‘graphics-outside’` (the lights fill the band, the letters cut out of them, the edges faded) or `‘graphics-none’` (no lights at all — the name set like every other heading). Writing the variant’s name as the `template` does the same thing |

> `graphics: [‘sun’, ‘mist’]` — every name is a light, and the first is also the ground. `variant:` picks ‘graphics-inside’, ‘graphics-outside’ or ‘graphics-none’; `fade: false` stops an outside band melting into the page. The CSS knobs are in the README.

### `context-1`

| on the slide’s line | |
|---|---|
| `media` | the drawing this slide shows. `media: null` is a DECISION — no drawing, deliberately. Leaving it out still asks for one |

### `context-2`

| on the slide’s line | |
|---|---|
| `media` | the drawing this slide shows. `media: null` is a DECISION — no drawing, deliberately. Leaving it out still asks for one |
| `media2` | the second drawing, where a template has two |

### `feedback`

Nothing but `template` and `copy`.

### `feedback-detail`

| on the slide’s line | |
|---|---|
| `flows` | the name of a set in `workflowSets`. Prefer `views:` — see the note below |

### `figure`

| on the slide’s line | |
|---|---|
| `media` | the drawing this slide shows. `media: null` is a DECISION — no drawing, deliberately. Leaving it out still asks for one |

### `flow-chart`

| on the slide’s line | |
|---|---|
| `links` | the joins between those steps |
| `slotBase` | the stem for drawings this slide works out, when it should not be the slide’s own copy key |
| `steps` | the flow chart’s shape — its steps, in order |

> `steps` and `links` are the diagram’s shape; `stepWords` in copy.js holds the words.

### `grid`

| on the slide’s line | |
|---|---|
| `groups` | which user groups this slide shows, by id, out of `userGroups`. Left out, it shows them all |

> Rows come from `items` in copy.js OR from `groups` here — `groups` is the version with a grouping column down the left.

### `hero`

| on the slide’s line | |
|---|---|
| `media` | the drawing this slide shows. `media: null` is a DECISION — no drawing, deliberately. Leaving it out still asks for one |
| `separator` | the small drawing between this slide and the next |

### `impact-bg`

| on the slide’s line | |
|---|---|
| `impact` | one of `very low` `low` `medium` `high` `very high`. `impact: false` drops just this card |
| `media` | the drawing this slide shows. `media: null` is a DECISION — no drawing, deliberately. Leaving it out still asks for one |

### `impact-grid`

| on the slide’s line | |
|---|---|
| `groups` | which user groups this slide shows, by id, out of `userGroups`. Left out, it shows them all |
| `impact` | one of `very low` `low` `medium` `high` `very high`. `impact: false` drops just this card |

> As `grid`, with a statement over it.

### `impact-text`

| on the slide’s line | |
|---|---|
| `impact` | one of `very low` `low` `medium` `high` `very high`. `impact: false` drops just this card |
| `media` | the drawing this slide shows. `media: null` is a DECISION — no drawing, deliberately. Leaving it out still asks for one |

### `logo`

| on the slide’s line | |
|---|---|
| `media` | the drawing this slide shows. `media: null` is a DECISION — no drawing, deliberately. Leaving it out still asks for one |

### `numbered-grid`

Nothing but `template` and `copy`.

### `pair-section`

| on the slide’s line | |
|---|---|
| `media` | the drawing this slide shows. `media: null` is a DECISION — no drawing, deliberately. Leaving it out still asks for one |

### `pair-split`

| on the slide’s line | |
|---|---|
| `media2` | the second drawing, where a template has two |

### `persona`

Nothing but `template` and `copy`.

> The people are `personas` in content.js, not on this slide’s line — each entry is `{ name, description, media, media2, ink, sections }`. **One person and the carousel turns itself off**: no arrows, no counter, no swipe, and the portrait takes the full width (slightly wider than on a two-person slide).

### `placeholder`

Nothing but `template` and `copy`.

### `prototype`

| on the slide’s line | |
|---|---|
| `loading` | how the prototype window behaves while it loads |
| `media` | the drawing this slide shows. `media: null` is a DECISION — no drawing, deliberately. Leaving it out still asks for one |
| `slotBase` | the stem for drawings this slide works out, when it should not be the slide’s own copy key |
| `views` | `views: 4` — four drawings, named from the slide. The count IS the list |

> A prototype folder named after the slot needs no entry anywhere.

### `rule-title`

| on the slide’s line | |
|---|---|
| `media` | the drawing this slide shows. `media: null` is a DECISION — no drawing, deliberately. Leaving it out still asks for one |

### `sections`

| on the slide’s line | |
|---|---|
| `media` | the drawing this slide shows. `media: null` is a DECISION — no drawing, deliberately. Leaving it out still asks for one |
| `media2` | the second drawing, where a template has two |
| `split` | `split: true` puts a column of writing beside the diagram; `split: ‘panel’` puts the explains panel there |

### `strip-back`

| on the slide’s line | |
|---|---|
| `href` | where the link at the end of a strip goes |
| `media` | the drawing this slide shows. `media: null` is a DECISION — no drawing, deliberately. Leaving it out still asks for one |

### `strip-fancy-accordion`

| on the slide’s line | |
|---|---|
| `accordions` | how many accordions and what they are called: `[‘acc-01’, ‘acc-02’]`. Their WORDS are `accordionWords` in copy.js |
| `headFill` | `headFill: false` — an accordion stack’s titles sit with nothing behind them, the circle and the words and no more. Left out, each title carries a faint wash of the study’s second colour. A study-wide default goes in theme.css as `--cs-fancy-fill: off` |
| `media` | the drawing this slide shows. `media: null` is a DECISION — no drawing, deliberately. Leaving it out still asks for one |
| `slotBase` | the stem for drawings this slide works out, when it should not be the slide’s own copy key |

> `accordions` names them; `accordionWords` in copy.js holds their words under those same names.

### `strip-figure`

| on the slide’s line | |
|---|---|
| `media` | the drawing this slide shows. `media: null` is a DECISION — no drawing, deliberately. Leaving it out still asks for one |

### `strip-section`

Nothing but `template` and `copy`.

### `strip-text`

| on the slide’s line | |
|---|---|
| `impact` | one of `very low` `low` `medium` `high` `very high`. `impact: false` drops just this card |

### `strip-transition`

Nothing but `template` and `copy`.

### `title-body-rule`

| on the slide’s line | |
|---|---|
| `media` | the drawing this slide shows. `media: null` is a DECISION — no drawing, deliberately. Leaving it out still asks for one |

### `title-figure`

| on the slide’s line | |
|---|---|
| `media` | the drawing this slide shows. `media: null` is a DECISION — no drawing, deliberately. Leaving it out still asks for one |

### `title-figure-caption`

| on the slide’s line | |
|---|---|
| `media` | the drawing this slide shows. `media: null` is a DECISION — no drawing, deliberately. Leaving it out still asks for one |

### `title-impact-figure`

| on the slide’s line | |
|---|---|
| `impact` | one of `very low` `low` `medium` `high` `very high`. `impact: false` drops just this card |
| `media` | the drawing this slide shows. `media: null` is a DECISION — no drawing, deliberately. Leaving it out still asks for one |

### `title-split`

| on the slide’s line | |
|---|---|
| `media` | the drawing this slide shows. `media: null` is a DECISION — no drawing, deliberately. Leaving it out still asks for one |

### `title-steps`

| on the slide’s line | |
|---|---|
| `flows` | the name of a set in `workflowSets`. Prefer `views:` — see the note below |
| `question` | `question: false` — this stepped slide deliberately has no question above its diagram. SINGULAR; `questions` with an s is the copy block |
| `slotBase` | the stem for drawings this slide works out, when it should not be the slide’s own copy key |
| `split` | `split: true` puts a column of writing beside the diagram; `split: ‘panel’` puts the explains panel there |
| `views` | `views: 4` — four drawings, named from the slide. The count IS the list |

> The question above the diagram and the writing beside it are in the top-level `questions` and `bodies` in copy.js, filed by the drawing’s name — not here.

### `title-wireframe`

| on the slide’s line | |
|---|---|
| `flows` | the name of a set in `workflowSets`. Prefer `views:` — see the note below |
| `question` | `question: false` — this stepped slide deliberately has no question above its diagram. SINGULAR; `questions` with an s is the copy block |
| `slotBase` | the stem for drawings this slide works out, when it should not be the slide’s own copy key |
| `split` | `split: true` puts a column of writing beside the diagram; `split: ‘panel’` puts the explains panel there |
| `views` | `views: 4` — four drawings, named from the slide. The count IS the list |

> As `title-steps`.

### `toggle-figure-section`

| on the slide’s line | |
|---|---|
| `diagrams` | which named set out of `diagramSets` this slide shows |

### `use-case`

| on the slide’s line | |
|---|---|
| `feasibility` | the same five. `feasibility: false` drops just this card |
| `flows` | the name of a set in `workflowSets`. Prefer `views:` — see the note below |
| `groups` | which user groups this slide shows, by id, out of `userGroups`. Left out, it shows them all |
| `impact` | one of `very low` `low` `medium` `high` `very high`. `impact: false` drops just this card |
| `media` | the drawing this slide shows. `media: null` is a DECISION — no drawing, deliberately. Leaving it out still asks for one |
| `media2` | the second drawing, where a template has two |
| `ratings` | `ratings: false` — no assessment strip on this slide |
| `slotBase` | the stem for drawings this slide works out, when it should not be the slide’s own copy key |
| `verdict` | the older single verdict drawing: `verdict: ‘scrapped’` asks for `verdict_scrapped` |
| `views` | `views: 4` — four drawings, named from the slide. The count IS the list |

> `groups` picks from `userGroups` in content.js. All three assessment switches live here: `ratings: false` for the whole strip, `impact: false` or `feasibility: false` for one card, and `meta.showRatings: false` for every use-case slide in the study.

### `wireframe`

| on the slide’s line | |
|---|---|
| `flows` | the name of a set in `workflowSets`. Prefer `views:` — see the note below |
| `question` | `question: false` — this stepped slide deliberately has no question above its diagram. SINGULAR; `questions` with an s is the copy block |
| `slotBase` | the stem for drawings this slide works out, when it should not be the slide’s own copy key |
| `split` | `split: true` puts a column of writing beside the diagram; `split: ‘panel’` puts the explains panel there |
| `views` | `views: 4` — four drawings, named from the slide. The count IS the list |

> As `title-steps`.

---

Every slide also takes `template`, `copy`, `id`, `hidden` and `title: null`,
whatever the table above says — those belong to slides rather than to any
one template.

*38 templates. Generated by `tools/content-reference.js`.*
