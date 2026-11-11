/* copy-reference.js — build case-studies/COPY-REFERENCE.md from the engine.

       node tools/copy-reference.js            print it
       node tools/copy-reference.js --write    write the file

   WHY THIS IS GENERATED. A hand-kept list of "what you can write for each
   template" goes stale the first time a template learns a new word, and a
   stale list is worse than none: you write the key it tells you to, nothing
   appears, and there is no error because the engine never looks for that
   word.

   SO THE LIST OF KEYS IS READ OUT OF cs-templates.js, exactly as
   tools/copy-keys.js reads it. What this adds is the SHAPE of each key -
   whether it wants a sentence, a list, a map - which cannot be read out of
   the code and so is written down in SHAPES below.

   AND IT REFUSES TO RUN IF A KEY HAS NO SHAPE. A template that gains a new
   word makes this tool fail loudly rather than quietly leave that word out
   of the reference, which is the whole reason the reference can be trusted.
   If it stops with "no shape written for X", add X to SHAPES. */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'system/js/cs-templates.js'), 'utf8');

/* ---- the same reading tools/copy-keys.js does ---- */
const START = /^    '([a-z0-9-]+)': function \([^)]*\) \{$/gm;
/* WHERE THE LAST TEMPLATE ENDS, which is not the end of the file.

   The registry is read by slicing from each template's opening line to the
   next one's. For the LAST template that gave "to the end of the file" -
   so it swallowed every helper function written after the registry closes
   and was reported as reading nine words it has never heard of. `backend`
   takes no arguments at all.

   A tool that is wrong about one row in thirty-eight is worse than no tool,
   because the other thirty-seven make you trust the one. So the end of the
   registry is found properly: the first line that is exactly `  };` after
   the last template begins. */
function registryEnd(src, lastAt) {
  const m = /^  \};$/m.exec(src.slice(lastAt));
  return m ? lastAt + m.index : src.length;
}

const marks = [];
let m;
while ((m = START.exec(src))) marks.push({ name: m[1], at: m.index });

const STRUCTURAL = new Set([
  'copy', 'template', 'id', 'hidden', 'draft', 'group',
  'media', 'media2', 'separator', 'flows', 'slotBase', 'views',
  'split', 'href', 'groups', 'verdict', 'loading',
  'steps', 'links', 'shots', 'accordions', 'graphics', 'question', 'variant', 'fade',
  'headFill',
  /* PUT ON THE SLIDE BY THE ENGINE, not by you: which phase it was read
     from, so an empty box can name the right copy.js. */
  'copyIn',
  /* THE ASSESSMENT SWITCHES. All three are a yes/no on the slide's own
     line, not words - see CONTENT-REFERENCE.md. `impact` is also the name
     of a copy key on OTHER templates (the big statement on impact-text),
     which is why it is listed here rather than removed outright: the
     filter below keeps it out of the copy column only where the template
     is the use-case slide. */
  'ratings'
]);

/* A TEMPLATE'S KEYS INCLUDE THE ONES ITS HELPERS READ. See the long note
   on the same thing in tools/content-reference.js: a template that calls
   `helper(d)` is reading whatever that helper reads, and counting only the
   `d.x` written in its own lines leaves those out silently. */
const HELPER = /^  function ([A-Za-z_][A-Za-z0-9_]*)\s*\(/gm;
const helpers = {};
{
  const hm = [];
  let h;
  while ((h = HELPER.exec(src))) hm.push({ name: h[1], at: h.index });
  hm.forEach((x, i) => {
    helpers[x.name] = src.slice(x.at, i + 1 < hm.length ? hm[i + 1].at : src.length);
  });
}
function readsIn(body, out, depth) {
  let k;
  const RE = /\bd\.([A-Za-z_][A-Za-z0-9_]*)/g;
  while ((k = RE.exec(body))) out.add(k[1]);
  if (depth <= 0) return out;
  const CALL = /\b([A-Za-z_][A-Za-z0-9_]*)\s*\(\s*d\s*[,)]/g;
  let c;
  while ((c = CALL.exec(body))) if (helpers[c[1]]) readsIn(helpers[c[1]], out, depth - 1);
  return out;
}

const tpl = {};
marks.forEach((mk, i) => {
  const end = i + 1 < marks.length ? marks[i + 1].at
                                   : registryEnd(src, mk.at);
  const body = src.slice(mk.at, end);
  const all = readsIn(body, new Set(), 2);
  const keys = new Set([...all].filter(x => !STRUCTURAL.has(x)));
  tpl[mk.name] = { copy: [...keys].sort(), slide: [...new Set(
    /* `copyIn` is put there by the engine and `template`/`copy` are how you
       got here, so none of the three is something to write. */
    [...all].filter(s => STRUCTURAL.has(s) &&
                         s !== 'copy' && s !== 'template' && s !== 'copyIn')
  )].sort() };
});

/* ====================================================================
   THE SHAPE OF EVERY WORD. One entry per key name; a key means the same
   thing wherever it appears unless OVERRIDE below says otherwise.
   ==================================================================== */
const SHAPES = {
  title:        ['a line', '`title: `How I framed it``'],
  title2:       ['a line', 'the SECOND section’s heading on a two-part slide'],
  subtitle:     ['a line', 'the smaller line under the title'],
  eyebrow:      ['a line', 'the small label ABOVE the title'],
  label:        ['a line', 'short text, usually on a control or a placeholder'],
  lead:         ['a line OR a list of lines', 'the hero’s opening sentence, larger than body. Written as a LIST it becomes a row of pieces with a thin rule standing between them — figures, or short phrases that read as separate things and as one statement at once'],
  text:         ['a line', 'the words on the link at the end of a strip'],
  caption:      ['a line', 'the line under a drawing'],
  caption2:     ['a line', 'the line beside the SECOND drawing'],
  impact:       ['a line', 'a statement, set large in the drawn face'],
  note:         ['a line', 'a placeholder’s note to self'],
  headNote:     ['a BODY', 'the writing BESIDE the square at the head of an accordion stack. `headNote: null` leaves it out'],
  from:         ['`{ date, name }`', 'the LEFT half of a transition strip \u2014 two lines, not one: `from: { date: `Mar 2024`, name: `Design` }`'],
  to:           ['`{ date, name }`', 'the RIGHT half, same shape. Leave both out and the strip says it is waiting for them'],
  stage:        ['a piece', 'what fills the stage INSTEAD of a drawing — usually `{ kind: … }`'],
  band:         ['yes / no', '`band: true` draws the stage as a thin band'],
  split2:       ['yes / no', '`split2: true` sets the second body in two columns'],
  grouped:      ['yes / no', '`grouped: false` turns off the grouping column'],
  artwork:      ['a class name', 'an extra class on the hero’s picture box'],
  body:         ['a BODY', 'one line, a list of lines, or pieces — see **What a body can hold**'],
  body2:        ['a BODY', 'the SECOND section’s writing'],
  tags:         ['a list of lines', '`tags: [`UX`, `Research`]`'],
  tiles:        ['a list of lines', 'the words in each tile of the logo slide'],
  legend:       ['a list of lines', 'the key under a grid'],
  headers:      ['a list of lines', 'the column headings of a grid'],
  titles:       ['a list of lines', 'one name per prototype, in order'],
  viewTitles:   ['a list of lines', 'one name per drawing, under each as you step'],
  prototypeTitles: ['a list of lines', 'the same thing under its older name'],
  prototypeTitle:  ['a line or a list', 'one name, or one per prototype'],
  questions:    ['a list of lines', 'drawn as a list opening with `?`'],
  tabsLabel:    ['a line', 'what a screen reader calls the row of tabs'],
  panelLabel:   ['a line', 'what a screen reader calls the side panel'],
  groupsCaption:['a line', 'the words beside the row of faces'],
  diagrams:     ['a name', 'which named set of diagrams this slide shows'],
  drawer:       ['a name', 'which drawer the door on this slide opens'],
  doorTitle:    ['a line', 'the heading on the door'],
  doorBody:     ['a line or a list of lines', 'the writing on the door. NOT a full body \u2014 a `{ kind: \u2026 }` piece here comes out as `[object Object]`'],
  doorAction:   ['a line', 'the words on the door’s button'],
  feasibility:  ['a rating', 'one of `low` `medium-low` `medium` `medium-high` `high`'],
  items:        ['a list', 'see the template below — it differs'],
  sections:     ['a list of sections', '`[{ heading, body }, { heading, picture: true }]`'],
  tabs:         ['a list of tabs', '`[{ label, body }]` — one per tab'],
  stepWords:    ['a map', 'keyed by the step’s own id: `{ intake: { label, body } }`'],
  accordionWords: ['a map', 'keyed by the accordion’s own id: `{ ‘acc-01’: { label, body } }`']
};

/* where a key means something different on one template than everywhere else */
const OVERRIDE = {
  'numbered-grid': {
    items: ['a list of cards', '`[{ body }, { n, body }]` — each card’s `body` is a full BODY, so a card can hold points. A card can be broken up instead with `sections: [{ heading, body }]`, and the two can be written together, in which case `body` is the opening line before the first heading. A card may carry `icon: ‘media key’` for a little drawing in place of its mark'],
    marks: ['a word', 'what leads each card: `numbers` (the default) `letters` `letters-lower` `roman` `bullets` `none`. A card’s own `n` or `icon` overrules it']
  },
  'grid':       { items: ['a list of rows', 'each row a list of cells; a cell is a line or `{ value, media, medias, fill, mark }`'] },
  'impact-grid':{ items: ['a list of rows', 'as `grid` above'] },
  'logo':       { tiles: ['a list of lines', 'defaults to `[‘START tile’, ‘AUTH tile’]` if left out'] }
};

/* ====================================================================
   WHAT A TEMPLATE DRAWS THAT IS NOT IN ITS OWN BLOCK. Some templates take
   their contents from a list kept once for the whole study, so "writes
   nothing in copy.js" is true and useless on its own - this says where to
   look instead.
   ==================================================================== */
const NOTES = {
  backend: 'Draws the study’s plain `diagrams` list from content.js. With no such list the slide comes out empty.',
  persona: 'The people come from `personas` in content.js — each names its own copy block, portrait and diagram. Their words live in those blocks, not here.',
  'feedback-detail': 'Takes its drawings from the set named by `flows`, or from `views: N` on its own line.',
  logo: 'With no `tiles` written it shows two placeholder tiles, so the slide is never blank.',
  grid: 'Rows come from `items` here OR from `groups` on the slide’s line — `groups` is for a grid with a grouping column down the left.',
  'impact-grid': 'As `grid`, with a statement standing over it.',
  wireframe: 'The question above each diagram and the writing beside it are NOT here — they are in the top-level `questions` and `bodies`, filed by the drawing’s name.',
  'title-wireframe': 'As `wireframe`.',
  'title-steps': 'As `wireframe`. `question: false` on the slide’s line says this slide deliberately has none (singular — `questions` with an s is the copy block).',
  'use-case': 'The row of faces comes from `userGroups` in content.js, picked by `groups` on the slide’s line.',
  'strip-fancy-accordion': 'How many accordions and what they are called is `accordions` on the slide’s line; their words are `accordionWords` here, keyed by those same names. Two names on purpose — one name in both files would collide.',
  'flow-chart': 'The shape is `steps` and `links` on the slide’s line; the words for each step are `stepWords` here, keyed by the step’s id.',
  'chapter-name-graphics': 'Which colours move is `graphics` on the slide’s line — a list of palette words, not copy — and which of the two variants is `variant` beside it.',
  prototype: 'A prototype folder named after the slot needs no entry anywhere; see the README.'
};

/* ---- refuse to run on a key nobody has described ---- */
const missing = [];
Object.keys(tpl).forEach(t => tpl[t].copy.forEach(k => {
  if (!SHAPES[k] && !(OVERRIDE[t] && OVERRIDE[t][k])) missing.push(t + ' → ' + k);
}));
if (missing.length) {
  console.error('STOPPED: no shape written for these keys. Add them to SHAPES\n  in tools/copy-reference.js, then run again:\n');
  missing.forEach(x => console.error('   ' + x));
  process.exit(1);
}

/* ---- the document ---- */
const L = [];
const p = s => L.push(s);

p('# What you can write for every template');
p('');
p('**Generated from the engine.** `node tools/copy-reference.js --write`');
p('rebuilds this file by reading `system/js/cs-templates.js`, so it cannot');
p('drift out of date. If a template learns a new word, this is where it');
p('appears. Do not edit this file by hand — the next rebuild overwrites it.');
p('');
p('Two columns, and the difference matters:');
p('');
p('- **copy.js** — WORDS. They go inside the block named by the slide’s');
p('  `copy:` key.');
p('- **content.js** — SHAPE. How many, which drawing, which set. They go on');
p('  the slide’s own line.');
p('');
p('Write a word in the wrong file and nothing appears, with no error, because');
p('the engine never looks for it there.');
p('');
p('```js');
p('// content.js — the slide’s line');
p("{ template: 'context-2', copy: 'slide-03', media: 'slide-03_img-01' },");
p('');
p('// copy.js — the block it names');
p("'slide-03': {");
p('  title: `The first heading`,');
p('  body:  `The writing under it.`,');
p('  title2: `The second heading`,');
p('  body2: `The writing under that.`');
p('}');
p('```');
p('');
p('---');
p('');
p('## What a body can hold');
p('');
p('Anywhere the table below says **a BODY**, you can write:');
p('');
p('```js');
p('body: `one paragraph`                       // a line');
p('body: [`first`, `second`]                   // two paragraphs');
p('body: [                                     // or any of these pieces,');
p('  `a paragraph`,                            // mixed in any order');
p("  { kind: 'points',    items: [`a`, `b`] },      // dashes — things settled");
p("  { kind: 'questions', items: [`a`, `b`] },      // ? — things still open");
p("  { kind: 'numbers',   items: [`a`, `b`] },      // 1. 2. — order matters");
p("  { kind: 'heading',   text: `Part way down` },");
p("  { kind: 'quote',     text: `A statement, set large` },");
p("  { kind: 'drawer',    text: `Read more`, drawer: 'drawer-01' },");
p("  { kind: 'image' }                              // a drawing, named from the slide");
p(']');
p('```');
p('');
p('`cards: true` on a `points` / `questions` / `numbers` piece draws each line');
p('as its own outlined card. `wide: true` spreads it across a full-width body.');
p('');
p('---');
p('');
p('## Three lists that are NOT in a slide’s block');
p('');
p('These sit at the TOP LEVEL of copy.js, beside the slide blocks, and are');
p('filed by **the drawing’s own name** rather than by slide:');
p('');
p('```js');
p('captions:  { ‘slide-04_img-01’: `the line under this drawing` },');
p('questions: { ‘slide-04_img-01’: `the question it answers, above it` },');
p('bodies:    { ‘slide-04_img-01’: `the writing beside it` }');
p('```');
p('');
p('They belong to the drawing, so they follow it as you step through a');
p('carousel. `labels` is a fourth, filed by a tab’s or section’s id.');
p('');
p('**A phase reads its own copy.js first**, and these four lists are the only');
p('things that also come through from the study’s.');
p('');
p('---');
p('');
p('## Every template');
p('');

Object.keys(tpl).sort().forEach(name => {
  const t = tpl[name];
  p('### `' + name + '`');
  p('');
  if (!t.copy.length) {
    p('Writes nothing of its own in copy.js.');
  } else {
    p('| in copy.js | shape | |');
    p('|---|---|---|');
    t.copy.forEach(k => {
      const sh = (OVERRIDE[name] && OVERRIDE[name][k]) || SHAPES[k];
      p('| `' + k + '` | ' + sh[0] + ' | ' + sh[1] + ' |');
    });
  }
  p('');
  p(t.slide.length
    ? 'On the slide’s line in content.js: ' + t.slide.map(s => '`' + s + '`').join(', ') + '.'
    : 'Nothing on the slide’s line but `template` and `copy`.');
  if (NOTES[name]) { p(''); p('> ' + NOTES[name]); }
  p('');
});

p('---');
p('');
p('*' + Object.keys(tpl).length + ' templates. Generated by `tools/copy-reference.js`.*');

const out = L.join('\n') + '\n';
if (process.argv.includes('--write')) {
  fs.writeFileSync(path.join(ROOT, 'case-studies/COPY-REFERENCE.md'), out);
  console.log('wrote case-studies/COPY-REFERENCE.md — ' +
              Object.keys(tpl).length + ' templates, ' + out.split('\n').length + ' lines');
} else {
  process.stdout.write(out);
}
