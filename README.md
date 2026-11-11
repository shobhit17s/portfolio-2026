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

## Every word on the landing page: `common/landing-copy.js`

One file holds what the landing page **says** — the browser tab's name, the
header, what each world says, the spin control, the line along the foot of a
phone, where the tiles on Signal Point go, and what the objects on the planets
say. Nothing in it affects layout or size.

| you want to change | the key |
| --- | --- |
| the browser tab, and the link preview | `tab`, `description` |
| the name top left and the line under it | `masthead.name`, `.subtext` |
| a world's heading and paragraphs | `panels.<id>.title`, `.body` |
| "Speed of spin", "Slow", "Normal", "Fast" | `spin.*` |
| "scroll to travel" / the phone line | `scroll.desktop`, `scroll.phone` |
| where a tile on Signal Point goes | `links.*` |
| what an object says on hover | `objects.<id>.hover` |
| a label that is always there | `objects.<id>.label` |
| the note beside the first snack | `snackHint` |

**`body` is a list, one entry per paragraph** — adding a line here is the whole
of adding a line to the page.

**The page still reads if the file never arrives.** `index.html` carries the
same words written into it and `js/hw-copy.js` replaces them at start-up, so a
missing or broken copy file leaves slightly out-of-date wording rather than
empty boxes. Nothing in that script throws: a copy file is the kind of file
that gets a comma deleted at eleven at night, and it should never be able to
take the planets down with it.

**The sizes are somewhere else on purpose.** Every piece of writing named above
also has a type role — which face, how big on a desk, how big on a phone — in
block 2e of `common/type-scale.css`, under the matching name. Words in one
file, sizes in another, and neither needs to know about the other.

Two of those roles — the hover name and the diagrammatic label — are painted
onto the canvas rather than set on an element. A canvas cannot read a
stylesheet, so `HW.readPalette` asks the browser what they resolve to and
assembles the one string a canvas wants. They change from the same place as
everything else; they just go the long way round.

## Things on planets: ids, labels and flags

An object in `js/hw-config.js` can carry an **`id`**, and the id is what the
copy file looks it up by. An object with no id simply says nothing — which is
the right failure, because it means a label can never silently attach itself to
the wrong tree after a planet is reordered.

**If the copy file mentions an id, the copy file is the whole truth for that
object, including its silences.** Delete a `hover` line and the object says
nothing when you point at it. Only an object the copy file has never heard of
falls back to anything written in `hw-config.js` — which is what keeps a
half-finished copy file from emptying the page. Without that rule there was no
way to *remove* a hover name: deleting it fell back to the old wording and the
name you had just deleted carried on appearing.

An object can carry both a `hover` and a `label`, or either on its own. The
pantheon now has only a label: saying the same thing twice, once permanently
and once on hover, is one thing too many. When a door has no hover name, the
hidden keyboard list uses its permanent label rather than the world's name, so
the eye and the keyboard are told the same thing.

| flag | what it does |
| --- | --- |
| `pole: true` | stands on the spin axis — never turns away, always lit |
| `upright: true` | keeps its place and keeps travelling, but stays vertical on screen |
| `download: true` | hands over a file instead of going somewhere |
| `ring: 'always'` | shows its door ring without being pointed at |
| `glow: true` | carries a lamp |

### Standing up from the ground, and what `upright` is for

Every prop is drawn **standing up from the ground beneath it** — a tree on the
left edge leans left, one on the right leans right, exactly as they would on a
real small world. That lean is what makes the planet read as curved rather than
as a flat picture of one, so it is the behaviour to keep.

Its cost is that the ground turns. A prop carried from one side to the other
appears to **rotate about the point it is pinned at**, like a hand sweeping
round a clock face — and the effect is strongest at the equator, where a point
travels the full width of the planet.

**Latitude is the gentle dial.** Nearer the pole, the circle a prop travels is
smaller and there is less sweep to see. The snow leopard sits at **58° north**
for this reason: measured over a full rotation she never drops below 0.63 of
the planet's radius above its middle — the upper hemisphere throughout — and
she drifts rather than sweeps.

**`upright: true` is the blunt one**, and it stops the rotation dead while
keeping the place and the travel. Useful when something must never tip, but it
gives up the lean that tells you the thing is on a sphere, so reach for
latitude first. Only the spin axis itself (`pole: true`) removes the motion
entirely — that is where the pantheon sits.

### Diagrammatic labels

A label that is **always there**, for as long as its object is in view, with a
line drawn back to it — the way a label on a sketchbook drawing is. Different
from a hover name, which comes and goes with the cursor and answers "what is
this?"; this one says something *about* the thing.

```js
'play-snow-leopard': {
  label: { text: 'she naps all day', place: 'north-west' }
}
```

`place` is one of eight compass points and means the direction **from the
object**, not from the planet.

**The rule it keeps: the words never sit within the width of the planet.**
Picture two vertical lines, one touching each end of the equator — the planet
lives between them and a label never does. Not merely outside the circle, but
outside that whole vertical strip, so a label can never find itself over the
top or bottom of a world where the ground is lit, textured and turning.

That changes what two directions mean. East, west and the four diagonals say
exactly what they say; **north and south become "up and out" and "down and
out"**, going above or below the object and then sliding to whichever side the
label sits on. The direction is a lean rather than a bearing, and that is the
price of the words always being readable.

**On a phone the rule cannot be kept, and it says so rather than pretending.**
A planet is 330 pixels wide in a 390 pixel window; the strip either side is
thirty pixels, and nothing readable fits there. Below a usable width the label
goes **above or below the planet** instead — still clear of the ball, still
never over the drawing, simply not outside its width, because on that screen
nothing can be.

**Text that will not fit wraps**, breaking between words only. `lean` stretches
how far out it sits. A label **fades with its own object**, so it is never left
pointing at something that has turned away.

#### Why it used to jump, and what stops it now

Four separate causes, each needing its own fix:

| it jumped because | the fix |
| --- | --- |
| the side was recomputed every frame, so an object near the middle flipped the label back and forth | the side is **decided once and kept**; it changes only when that side has no window left, and then it **snaps** rather than walking across the planet |
| the window clamp pulled a label back on screen — and back onto the planet | the side is chosen so there *is* room, and the clamp can no longer pull into the strip |
| easing was done in screen coordinates, so the label lagged behind a travelling planet | easing is done **relative to the planet's centre**, so the label rides with it rigidly |
| a planet *grows* as you approach, so a gap that cleared the edge stopped clearing it | the offset is held **in units of the planet's radius**, not pixels |

After all of that, the rule is **enforced on the position actually drawn**, not
only on the one aimed at — the difference between a rule and a hope. Two things
the canvas cannot see for itself are handed to it: where the page's header ends
(`HW.SETTINGS.safeTop`), and that a pole object only blocks the direction it
actually stands in.

Measured over a thousand-odd frames at every placement on both screens: never
within the planet's width on a desktop, never over the ball on either, never
off the screen, and no side changes at all.

`HW.DEBUG = true` in the console makes every drawn label record its box in
`HW.DEBUG_NOTES`, which is how all of that was measured rather than eyeballed.

### Snacks carry labels too

Every snack has an id now — `home-cola`, `home-egg-puff`, `work-sandwich`,
`work-protein-bar`, `play-ramen`, `play-egg-puff`, `signal-protein-bar`,
`signal-cola` — and takes a `label` exactly as any other object does.

The old `snackHint` has gone. It was one line of words drawn beside whichever
snack happened to be **first on each planet**, which is why the same sentence
kept appearing on the egg puff after a label had been written for the cola. A
note now belongs to the snack it is about and appears beside that one snack.

### The resume

A fourth tile on Signal Point, and the only one that hands you a file. Put the
PDF at:

```
assets/docs/resume.pdf
```

making the `docs` folder if it is not there. The path is `links.resume` in the
copy file, so rename it if you like as long as the two agree; `links.download:
false` makes it open in a tab instead of saving.

**Why saving works here and would not from someone else's site.** A browser
only honours a download request for a file served from the *same site* as the
page asking for it. That is a security rule, not a quirk — without it any page
could quietly drop files from anywhere into your downloads folder. The resume
lives in this project's own `assets/`, so the rule is satisfied. Point
`links.resume` at a PDF on another domain and the browser will ignore the
request and open it instead, which is the safe thing for it to do.

**The tile will not appear until you draw it.** Like its three neighbours it
names one file and no stand-in: draw `props/signal-resume.png`, square like the
others, and it joins them.

## On a phone, nothing is anchored to the bottom

The four tabs went first; then the line that replaced them. Both were welded to
the bottom edge, and both cost the planet a strip of screen it could not get
back — which showed worst on the work planet, where the pantheon stands proud
of the ball and was being cut off at the top.

Now there is **one note, the same on both screens** — `scroll` in the copy file
— sitting in the stack with everything else rather than pinned to an edge. It
takes the world's own accent colour, so it belongs to the planet rather than
shouting over it, and it changes as you travel. `--hw-stack-rail` came down
from 96px to 34px: about sixty pixels of screen handed back.

**It fades on a desktop and stays on a phone.** Not an inconsistency — the same
decision read twice. On a desktop the four tabs go on saying it for ever, so
once you have scrolled the note is clutter. On a phone those tabs are gone, so
this line is the only thing saying you can travel at all; fading it would leave
a reader on world two with nothing telling them there is a world three.

**The nav tabs have their own type role** now too: `--t-hw-nav-*` in block 2e.
Desktop-only, since the rail is not drawn on a phone.

### The pantheon was cropped because the camera could not see it

The camera framed each world **by its ball alone**. Fine for a planet with
trees on it — a tree on the side is inside the silhouette the ball already
makes — but a thing pinned to the **pole** stands straight up out of the top,
and nothing told the camera it existed. The pantheon is 1.655 tall on a planet
of radius 1.7, so it nearly doubled that world's real height.

The fit now includes the tallest pole object, **for the top edge only** — that
being the only direction a pole prop reaches past the ball. Widening all four
would have stepped the camera back on every side for a building that is only
ever at the top. Anything tall you pin to a pole later is covered by the same
fix.

## Every door is an anchor, including the ones that open a new tab

`openDoor` in `js/hw-scene.js` builds an `<a>`, clicks it and throws it away —
for an external link, a download and a page of our own alike. That looks
roundabout when `window.open` exists, and there is a reason.

**The bug it fixes: a social link that opened twice**, once in a new tab and
once in the current one.

```js
var win = window.open(href, '_blank', 'noopener');
if (!win) window.location.href = href;      // <- wrong
```

That reads as "open a new tab; if the browser blocked it, go there in this one
instead". It is wrong in a way that looks fine until you watch the screen:
**`window.open` with `noopener` returns null even when it worked.** It has to —
`noopener` means the new tab gets no reference back to the page that opened it,
which is the whole point of it, and the handle is severed in both directions.
So null does not mean "blocked", it means "you asked not to be given a handle".
The code read that as failure and navigated this tab as well.

An anchor has no return value to misread. `rel="noopener noreferrer"` keeps the
protection the flag was there for. Verified: one new tab and the current tab
untouched, both by clicking a tile and through the keyboard list; a download
still downloads with no tab and no navigation; an internal page still opens in
this tab; and a `'#'` placeholder still does nothing.

## The email copies instead of opening a mail program

Pressing it puts the address on the clipboard and shows a short note.
`links.email` is now a **plain address**, no `mailto:`, and `links.emailCopied`
is what the note says.

**Why not a `mailto:` link.** It hands the address to whatever the machine
thinks is its mail program — which on a great many machines is nothing at all,
or something nobody has signed in to. The press appears to do nothing, or opens
a window they close immediately, and the address is never seen. They came to
write to you and left without it.

**Why there are two ways of copying in the code.** The modern clipboard is
deliberately fenced off: a page that could write to it whenever it liked could
quietly replace a bank account number you had copied a moment earlier. So
browsers only allow it on **https or localhost**, from a real press, in the
front tab. A page opened straight off the disk as a `file://` address is not
https, and there it is refused outright — not a bug to fix, the browser being
careful, and it goes away the day the site is on a real address. Underneath is
the older method — an invisible box, selected and copied — which works from a
file on disk. If both are refused the note shows the address itself, so it can
still be read and typed. Nothing silently fails.

The note sits at the **top** of the screen, because the bottom of a phone is
now deliberately empty and a floating note down there would undo that.
Contrast measured 9.84 in dark and 6.38 in light.

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
| **company** | the company's name, the words "Case Study Catalogue" under it, and one row of cards that scrolls sideways |
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

### The panel's proportions are the sheet's, named once

The modal is drawn to the reference sheet, and every number on that sheet is
a **named knob at the top of `css/hw-catalogue.css`** rather than a figure
buried in a rule somewhere. Change one and the whole panel follows.

| the sheet says | the knob |
| --- | --- |
| panel 934 × 656 | `--hwc-w`, `--hwc-h` |
| a 104px band at the top, a 105px one at the foot | `--hwc-band`, `--hwc-foot` |
| cards 410 square, 28px apart | `--hwc-card`, `--hwc-gut` |
| the drawing 181 wide inside a 15px margin | `--hwc-fig`, `--hwc-card-pad` |

Three things are worth knowing about how it behaves rather than how it is
drawn:

**The cards are one row that scrolls sideways.** The sheet shows two side by
side and the panel is a fixed width, so a third card has to go somewhere; it
goes to the right, and the row scrolls. A grid that wrapped would have made
the panel grow downwards past the height the sheet gives it.

**The line between two cards is a border on the second one**, not a drawn
divider — so the first card never carries one and the last never has a line
hanging off its right edge, whatever the number of cards.

**The impact text is clamped to five lines, and the clamp is said twice.**
Once as a line clamp and once as a height in `em` (`--hwc-lines`). A clamp on
its own puts the ellipsis at the end of line five and then lets line six paint
underneath it, because a clamp is not a crop — it is the height that actually
stops the paint. If you lengthen the impact sentences and the text starts
bleeding out of its panel, that pair of numbers is the place to look.

### Whether an impact is labelled

`labels.impact` in `common/catalogue.js` decides what goes in front of each
impact sentence, and it says three different things:

| it is set to | you get |
| --- | --- |
| `''` (what it is now) | just the sentence — no label, no number, no colon |
| `'Impact#'` | a bold **Impact#1:** and **Impact#2:** |
| `'Outcome '` | a bold **Outcome 1:** and **Outcome 2:** (mind the space) |
| the line left out entirely | falls back to `'Impact#'` |

**The number comes from the position in the list**, never from anything you
write, which is why `impacts` is a plain list of sentences: two cards cannot
disagree about how the label is written, because nobody writes it twice. The
weight the label is set in is `--t-catalogue-impact-lead-w`.

An empty string had to be *made* to mean something here. Before, it produced a
bare `": "` — the word gone but the number and colon still being added — which
is the kind of half-removal that looks like a bug rather than a setting. When
there is no label, the leading space goes too: a space at the front of a line is
invisible until the line wraps, and then one sentence starts a notch further in
than the one beside it.

### The header panel, and the fill that moves

**`#hw-catalogue-header-panel` holds exactly two things**: `#hw-catalogue-title-and-subtext`
(the company's name and "Case Study Catalogue", two pixels apart —
`--hwc-title-gap`) and the close button. The space between them is literally
`auto`: the close button is told to take all the room on its left, so it sits
against the right edge whatever the company is called. The writing block is
`align-self: center`, so the pair sits on the band's centre line and stays
there when the second line swaps for a case study name on the password screen.

**The card has no fill at rest.** The only filled thing inside it is the
Business Impact panel, which now carries the fill the card used to have
(`--cs-bg-2`) — so what you see is a drawing, a name and one block of colour,
rather than a box inside a box. **On hover the card takes that same fill**, over
about a quarter of a second, and the edge between card and panel stops being an
edge: the whole thing reads as one object lighting up.

### The focus ring that waits to be asked for

Something has to hold focus when the modal opens, or the keyboard is still out
on the page behind it and Tab walks off into the worlds. Focus now goes to the
**first case study** — the thing you came here to press — rather than to Close,
which reads as the panel offering you the way out before it has offered you
anything else.

But a dashed ring drawn around it straight away answers a question nobody
asked: someone who opened this with a mouse is not navigating by keyboard, and
the outline just makes the card look stuck. So the script sets
`data-hw-quiet-focus` on the panel when **it** moved focus, and removes it on
the first keypress. While that attribute is there the ring is suppressed and a
focused card does not light up; the moment a key is pressed, both start
behaving normally for the rest of the visit. Nothing is taken away from anyone
navigating by keyboard — it is only not volunteered to someone who isn't.

The focus call passes `preventScroll`, because the body of the panel is a
scroll container and a browser asked to focus something inside one will scroll
it into view — a sideways jolt on a row that was already showing the card.

**Both halves of the hover — the fill and the two-pixel lift — are held back
the same way.** Each names `:hover` on its own line and `:focus-visible` only
under `#hw-catalogue:not([data-hw-quiet-focus])`. Keyed to a bare
`:focus-visible`, the first card arrives already lifted and already filled, and
hovering it then does nothing at all — not because the movement is broken, but
because it was spent before anyone got there. That is the trap to remember if a
third hover effect is ever added here.

### How big the card drawings should be

The box is square and the picture fills it with `object-fit: cover`, so **a
source that is not square will be cropped**. Measured across every width:

| where | the drawing is drawn at |
| --- | --- |
| desktop, the sheet's own size | 181 × 181 |
| a phone upright (390 wide) | 326 × 326 |
| a tablet, or a window just under 820 | **420 × 420** — the largest it ever gets |

420 is the ceiling (`--hwc-fig` caps it), so on a 3× screen the most the
browser can ever use is 1260 real pixels. **Export square at 1280 × 1280 and
nothing will ever be soft**; 840 × 840 is the sensible floor if file size
matters, and covers everything except a 3× tablet. Anything under about 400 ×
400 will look soft on a retina desktop, where 181 CSS pixels means 362 real
ones.

`.png` is tried first, then `.jpg`, `.jpeg`, `.webp`, `.svg`. **If a drawing is
vector, export the `.svg`** — it cannot pixelate at any size and the question
goes away. PNG with transparency now sits directly on the card, since the box
has no fill behind it.

### The card's drawing, and the bar along the bottom

**The drawing box is bare** — no fill, no stroke. A drawn picture arrives with
its own edges, and a frame painted around it is a second edge the drawing did
not ask for. The rounded corner stays, because that is the shape the drawing is
cut to rather than a line around it. The one exception is a slot still **waiting
for its file**: with nothing in it and nothing around it there would be no box
at all, only a file name adrift in a card, so an empty slot keeps a faint wash
and a dashed edge in the page's own line colour. The moment the drawing loads,
`is-empty` comes off the box and both disappear.

**There used to be a scrollbar along the bottom with nothing to scroll.** Two
cards, the gutter and the air at either side came to three pixels more than the
panel's inside — and a browser answers a three-pixel overflow with the same
full-width bar it would give a three-hundred-pixel one. It is the sheet's own
arithmetic: 44 + 410 + 28 + 410 + 42 is 934, and 934 is the panel's *outside*.
So `--hwc-body-pad` came down from 44 to 41. Three pixels of air is invisible; a
bar across the bottom of a sheet is not.

When the bar *is* earned — a third and fourth case study genuinely do not fit —
it is the site's own bar. `#hw-catalogue-body` wears `dc-scroll`, the class the
drawers and the explains panel wear: transparent track, thin thumb in the
accent the panel sets (`--dc-accent`, here the same green as the rule between
two cards, at its `-ink` strength so it deepens on the pale page). That class
only ever named a `width`, which is a bar down the side; it now names a `height`
too, so a sideways scroller gets the same bar instead of the browser's grey one.

### Changing a diagrammatic label's font and size

Both live in **`common/type-scale.css`, block 2e**, under `--t-hw-diagram-*`:

```css
--t-hw-diagram-hand:  var(--t-hand-face);   /* which typeface */
--t-hw-diagram:       23px;                 /* on a desk */
--t-hw-diagram-phone: 19px;                 /* below 820px */
```

The hand can be any of the four in block 1 — `--t-display-face` (Shobhit
Regal), `--t-body-face` (Varela Round), `--t-hand-face` (Caveat) or
`--t-kk-face`. One role sets *every* diagrammatic label on the site, so they
cannot drift apart.

**These two are in plain pixels, not scale units, and that is not an
oversight.** Every other role on the site is a number multiplied by a design
pixel, because it is set on an element that scales with the window. A label is
*painted onto the drawing*, and a drawing has no element to scale against — so
the size is real pixels, and the phone size is a second value rather than a
clamp. `HW.readPalette` in `js/hw-config.js` reads both and assembles the one
string a canvas wants.

### Adding a hover label

A hover label is the name that appears beside something when you point at it.
In `common/landing-copy.js`, under `objects`:

```js
'play-controller': { hover: 'my ancient console' },
```

That is the whole of it — as long as the object already has an `id` in
`js/hw-config.js`. If it does not, add one first; see the table above.

**It takes the same face and size as a diagrammatic label** (`--t-hw-hover-*`
is its own role but sits beside `--t-hw-diagram-*` in the same block, so they
are set together), **and it follows none of the spacing rules**. A hover name
appears for the half-second your cursor is on one object: it sits close beside
that object, flips to the other side near the edge of the window, and that is
all. It has no business being pushed clear of the planet, because nothing else
is on screen competing with it.

**Only a door shows one** — something that goes somewhere, opens a panel,
copies an address or hands over a file. A hover name on a tree would be a name
that appears when you point at something you cannot press, which reads as a
broken button. An object can carry both a `hover` and a `label`; the pantheon
carries only a label, because saying the same thing permanently and again on
hover is one thing too many.

### The seven type knobs

Every piece of writing in the modal is a **named role**, and all seven live in
one block of `common/type-scale.css` (block 2c). The stylesheet invents no font
size of its own any more.

| what you see | the role |
| --- | --- |
| the company's name | `--t-catalogue-company` |
| "Case Study Catalogue" | `--t-catalogue-subtitle` |
| a case study's name | `--t-catalogue-name` |
| the sentence under it | `--t-catalogue-desc` |
| "Business Impact" | `--t-catalogue-impact-title` |
| the two impact sentences | `--t-catalogue-impact` |
| CANCEL, BACK, UNLOCK & VIEW | `--t-catalogue-action` |

Each role is a complete setting on one line — `-hand` (which typeface),
the size, `-phone` (the size below 820px), `-lh`, `-ls`, `-w`. A hand can be
pointed at any of the four faces in block 1: `--t-display-face` (Shobhit
Regal), `--t-body-face` (Varela Round), `--t-hand-face` (Caveat) or
`--t-kk-face` (the second drawn face).

Two things worth knowing. **These roles carry their own line height and
tracking**, where every other role keeps those in `type.css` — because the
catalogue is a sheet drawn at a fixed 934 × 656 rather than a page that scales
with the window, so its type is in real pixels rather than scale units, and
splitting it across two files would be two places to look. **A phone size is a
step, not a slide**: the scaling roles clamp smoothly between a ceiling and a
floor; these simply swap value below 820px.

The sizes were measured off the reference, not chosen: the PDF was rendered at
one point to one pixel and the ink of each line measured against the same words
set in the browser.

How many lines each piece of writing gets before it ellipses is separate, in
`css/hw-catalogue.css`: `--hwc-name-lines` (2), `--hwc-desc-lines` (3, and 2 on
a phone) and `--hwc-lines` (5 impact lines, 4 on a phone).

### On a phone it is a column, not a row

Below 820px the cards **stack and the panel scrolls downwards**. A sideways
scroll is the right answer on a wide sheet and the wrong one in a hand: the
thumb's natural stroke is up and down, and a row that has to be flicked across
is a row most people never reach the end of. The dividing rule turns with it —
same line, same place in the gap, horizontal instead of vertical — and it is
still carried by every card but the first, so there is never one at either end.

The card **stops being square** there and takes whatever height its writing
needs. That is the one proportion from the sheet a narrow screen cannot keep,
and the alternative — holding the square — cut the impact sentences off half
way down a line, which reads as broken rather than as deliberate.

**The drawing stays square everywhere**, because it is the one shape a reader
compares between the phone and the desk; square in one place and letterboxed in
the other is two different crops of the same artwork. On a phone it takes
whichever is smallest of the room it has, 420px, and 62% of the screen's
height — the last of those so that a small phone turned on its side does not
produce a square taller than the screen, which would bury the words beneath a
picture.

### `common/catalogue.js` — the one file

Open it to change **any** of this:

| you want to | the field |
| --- | --- |
| rename a case study | `name` |
| say which card opens which page | `href` |
| mark one as not up yet | `state: 'coming-soon'` |
| change a card's sentence | `description` |
| name a card's drawing | `image` |
| change a card's business-impact lines | `impacts`, or `showImpacts: false` |
| label each impact, or not | `labels.impact` |
| put a card behind the password, or not | `locked` |
| reorder the cards | move the entries |
| change any wording in the modal | `title`, `labels`, `password` |

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

Its badge sits **in the room the Business Impact panel takes** on a card that
is up — same width, same height, same edges. Two reasons, and the second is
the one that matters: impact lines about a case study nobody can open yet are
sentences about nothing, and a badge tucked underneath the description made
the card taller than its neighbour — two states of one component at different
sizes, which reads as a layout fault rather than as a difference in status.

The fade is spent where it costs nothing. A blanket opacity on the card fades
the words too, and the words still have to be read; measured, the name drops
to 4.34 in light mode at 0.9 opacity and 3.56 at 0.8, against a 4.5 bar. So
the picture is dimmed by a **wash laid over it** rather than by opacity, the
name and the badge step back by changing **colour** rather than fading, and
the card loses its fill and takes a dashed border. It reads as held back;
every word in it still clears 4.5 to 1.

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
