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

## The work planet

The Drafting Fields is the way in to everything:

| what you click | where it goes |
| --- | --- |
| the **pantheon** on the north pole | `case-studies/analyst-primer/` — open to everyone |
| the **blue landmass** | case study #1 — asks for the password |
| the **red landmass** | case study #2 — asks for the password |

A landmass is not an object sitting on the planet: it is the planet's own
corners, pushed outward, so the facets stretch into cliffs and the shape stays
folded paper. Add a third by adding a third entry to `continents` in
`js/hw-config.js`.

Each landmass also keeps a small pin on screen — over the land while the land
faces you, parked at the planet's edge while it does not — so a visitor never
has to wait for the planet to turn before they can open a case study.

## The password

The two case studies sit behind a password screen; the primer behind the
pantheon is open to everyone.

```bash
node tools/password.mjs "your password"     # paste the result into common/access.js
```

One password opens both. **It keeps casual visitors out and nothing more** —
the content is an ordinary file, readable by anyone who opens developer tools.
That is a fair trade for stand-in content and not a fair one for real client
work; `tools/README.md` says what to do when that changes.

## Keyboard

`s` drawn lines on or off · `g` the slide grid · `w` the window grid


