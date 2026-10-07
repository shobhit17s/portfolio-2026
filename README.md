# Four Small Worlds — a case study presentation system

```
handdrawn-worlds/
│
├── index.html                  the landing page: four planets you travel between
├── css/  js/  assets/          everything that page needs
│
├── common/
│   └── type.css                ONE typographic system, read by every surface
│
├── system/                     THE ENGINE — no case study content lives here
│   ├── css/                    tokens, layout, the slide templates, components,
│   │                           the stroke layer, the prototype component
│   └── js/                     the renderer, the templates, PrototypeEmbed,
│                               the carousels, the drawer, the views
│
├── case-studies/
│   ├── analyst-primer/         the OPEN page behind the pantheon
│   ├── industry-dashboard/     case study #1  — behind the password
│   └── case-study-two/         case study #2  — behind it too, still to write
│       ├── index.html          a thin shell — it holds no content at all
│       ├── content.js          every word, every slide, every slot  ← the study
│       ├── theme.css           its two accent colours
│       ├── assets.css          where its drawings are
│       └── assets/             its drawings
│
├── prototypes/
│   ├── README.md               how to put a prototype into a slot
│   ├── _template/              a skeleton to copy
│   └── industry-dashboard/     this study's prototypes
│
├── tools/
│   ├── README.md               what the password does, and does not, protect
│   └── password.mjs            sets it
│
└── common/access.js            the password itself (hashed)
```

## The idea

A case study is **data**, not markup. `content.js` says which template each
slide uses and what goes in it; the engine builds the page. Two case studies
can tell completely different stories, in a different order, with a different
number of slides — and run on the same engine with no code change at all.

**To add a case study:** copy `case-studies/industry-dashboard/`, empty out
`content.js`, and write the new story. Nothing in `system/` is touched.

## The four separations

| what | where | why |
| --- | --- | --- |
| content | `case-studies/<study>/content.js` | the words change per study |
| styling | `system/css/` + the study's `theme.css` | the look is shared; two accents are not |
| layout | `system/js/cs-templates.js` | a template is a template everywhere |
| prototypes | `prototypes/<study>/` | they run in their own frame, isolated |

## The slide templates

Named after the layout spec sheets. Every one is a function in
`system/js/cs-templates.js` that is handed a slide's data.

`hero` · `context-1` · `context-2` · `title-figure` · `title-figure-caption` ·
`figure` · `sections` · `impact-text` · `impact-bg` · `persona` · `logo` ·
`wireframe` · `backend` · `strip-figure` · `strip-text`

Add one there and every case study can use it.

## Pictures and prototypes

Every picture, video and prototype is a **named slot**. The slide says where
it sits; the `media` map at the bottom of `content.js` says what fills it.
Leave a slot out of the map and it renders as the drawn placeholder.

Swapping a placeholder for a real Figma prototype is one entry in one file.
See `prototypes/README.md`.

## The work planet, and the catalogue

The Drafting Fields is the way in to the work, and **there is exactly one way
in**: the pantheon on its north pole. Pressing it opens the case study modal.

Its dashed ring **stays on**, unhovered — `ring: 'always'` on that prop in
`js/hw-config.js`. Every other door on the site shows its ring only when you
point at it, which is right for a planet with several things on it: the ring
answers "is this one of them?". This planet has exactly one, and it is the
whole of what the Work world does, so a ring that waits to be discovered is
telling you something you have just worked out for yourself. It is quieter
when nothing is pointing at it and brightens on hover, and it fades with the
planet as you travel past rather than hanging in empty space.

The moons that used to orbit this planet have gone. They were a second list of
the case studies — one in `js/hw-config.js`, one in your head — and a second
list is a second thing to keep up to date. The planet now carries no doors to
anything.

### One panel, two states

| state | what it holds |
| --- | --- |
| **company** | the company's name, two tabs — an overview, and the catalogue of cards |
| **gate** | the password for whichever card was pressed |

They are states of one panel rather than two panels, because that is what they
are to a reader: you press a card and the thing you are already looking at
becomes the thing that asks for the password. "Back to case study catalogue"
returns you to exactly where you were.

**While it is open, the worlds hold still.** The journey is not a scrollbar —
a wheel turn is read as "go to the next world" and the page is moved
programmatically — so the freeze lives in `js/hw-scroll.js`, where the travel
is, rather than as a second handler fighting the first. A wheel, a finger or a
page-down key outside the panel does nothing at all; inside it, the list of
cards scrolls as you would expect, and Page Down pages that list.

**Clicking outside closes it** — a click that *began* outside. Selecting a
line of a description and letting go past the edge of the panel is one gesture
that ends on the scrim, and closing the modal underneath someone who was only
highlighting a sentence is a small, infuriating thing. Escape closes it too,
one step at a time: from the password screen back to the catalogue, and from
the catalogue out.

### `common/catalogue.js` — the one file

Open it to change **any** of this:

| you want to | the field |
| --- | --- |
| rename a case study | `name` |
| say which card opens which page | `href` |
| mark one as not up yet | `state: 'coming-soon'` |
| change a card's sentence | `description` |
| name a card's drawing | `image` |
| show or hide a card's metrics | `metrics`, or `showMetrics: false` |
| put a card behind the password, or not | `locked` |
| reorder the cards | move the entries |
| change any wording in the modal | `overview`, `catalogue`, `password` |

**A case study is named once.** `name` is what appears on the card, as the
heading of the password screen, in the strip along the top of the study, and
in the browser tab — because the study page reads this same file and matches
itself by `id`. The big hero title on slide 1 is deliberately *not* this: it
stays in that study's own `copy.js`, so it can be longer or phrased
differently.

### Two states a card can be in

`state: 'available'` is the default and what you get by leaving the line out:
the card is a control, it can be pressed, and it opens the study.

`state: 'coming-soon'` means the work is not up yet. The card is **faded, not
disabled**, and that distinction is deliberate: a `disabled` button is removed
from the page as far as a keyboard and a screen reader are concerned, which is
a strange way to treat a case study whose only news is that it is coming. It
stays a button, stays reachable, stays announced, and carries `aria-disabled`
plus a label of its own — "Project Name — this case study will be uploaded
soon" (the wording is `labels.comingSoonSays`). The press is simply not wired
up.

Its badge sits in the **right-hand column**, in the room the metrics take on
a card that is up. Two reasons, and the second is the one that matters:
metrics on a case study nobody can open yet are numbers about nothing, and a
badge underneath the description made the card taller than its neighbour — two
states of one component at different sizes, which reads as a layout fault
rather than a difference in status. Same column, same width, same height, same
right edge.

The fade is spent where it costs nothing. A blanket opacity on the card fades
the words too, and the words still have to be read; measured, the name drops
to 4.34 in light mode at 0.9 opacity and 3.56 at 0.8, against a 4.5 bar. So
the picture is dimmed by a **wash laid over it** rather than by opacity, the
name and the metric labels step back by changing **colour** rather than
fading, and the card loses its fill and takes a dashed border. It reads as
held back; every word in it still clears 4.5 to 1.

A card's drawing works the way every picture on this site works: name the file
after the slot and drop it in `assets/`. Until it arrives the card shows a box
printing the exact file name it is waiting for, so a misspelling is visible
rather than silent.

## The password

The case studies sit behind a password screen. It is asked for in **two
places** and they are the same check: the modal on the landing page, and the
study's own page for anyone arriving by a direct link. Getting through either
one opens the other for as long as the tab is open.

```bash
node tools/password.mjs "your password"     # paste the result into common/access.js
```

One password opens them all. **It keeps casual visitors out and nothing more** —
the content is an ordinary file, readable by anyone who opens developer tools.
That is a fair trade for stand-in content and not a fair one for real client
work; `tools/README.md` says what to do when that changes.

## Keyboard

`s` drawn lines on or off · `g` the slide grid · `w` the window grid


