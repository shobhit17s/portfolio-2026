/* content-reference.js — build case-studies/CONTENT-REFERENCE.md.

       node tools/content-reference.js            print it
       node tools/content-reference.js --write    write the file

   The companion to copy-reference.js. That one answers "what WORDS does
   this template read"; this one answers "what can I put on the slide's own
   line, and what else is in content.js".

   SAME RULE: the key list is read out of cs-templates.js so it cannot go
   stale, the MEANING of each key is written down here, and the tool REFUSES
   TO RUN if a key has no meaning written for it. A reference that can
   quietly leave a row out is the only kind that is worth less than none. */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'system/js/cs-templates.js'), 'utf8');

function registryEnd(lastAt) {
  const m = /^  \};$/m.exec(src.slice(lastAt));
  return m ? lastAt + m.index : src.length;
}

const START = /^    '([a-z0-9-]+)': function \([^)]*\) \{$/gm;
const marks = [];
let m;
while ((m = START.exec(src))) marks.push({ name: m[1], at: m.index });

/* the keys that live on the SLIDE'S LINE rather than in copy.js */
const ONLINE = new Set([
  'id', 'hidden', 'draft', 'media', 'media2', 'separator', 'flows', 'slotBase',
  'views', 'split', 'href', 'groups', 'verdict', 'loading', 'steps', 'links',
  'shots', 'accordions', 'graphics', 'question', 'ratings', 'impact', 'variant', 'fade',
  'headFill',
  'feasibility', 'diagrams', 'n'
]);

/* ====================================================================
   A TEMPLATE'S KEYS INCLUDE THE ONES ITS HELPERS READ
   ====================================================================

   Reading only `d.something` inside the template's own body misses a whole
   class of key, and the miss is invisible. The use-case slide does not
   mention `ratings` or `groups` anywhere in its own lines: it calls
   `ratingsShown(d)` and `groupsFor(d)`, and those read them. So the first
   version of this reference listed eight keys for that slide and left out
   the two he had actually asked about.

   SO A CALL THAT HANDS THE SLIDE OVER IS FOLLOWED. `helper(d)` or
   `helper(d, ...)` inside a template means that helper's keys are this
   template's keys too. One level deep is enough today and the guard below
   says so if it ever is not: a helper that passes `d` on again would need
   this to recurse. */
const HELPER = /^  function ([A-Za-z_][A-Za-z0-9_]*)\s*\(/gm;
const helpers = {};
{
  const hm = [];
  let h;
  while ((h = HELPER.exec(src))) hm.push({ name: h[1], at: h.index });
  hm.forEach((x, i) => {
    const end = i + 1 < hm.length ? hm[i + 1].at : src.length;
    helpers[x.name] = src.slice(x.at, end);
  });
}

function keysIn(body, out, depth) {
  let k;
  const RE = /\bd\.([A-Za-z_][A-Za-z0-9_]*)/g;
  while ((k = RE.exec(body))) if (ONLINE.has(k[1])) out.add(k[1]);
  if (depth <= 0) return out;
  const CALL = /\b([A-Za-z_][A-Za-z0-9_]*)\s*\(\s*d\s*[,)]/g;
  let c;
  while ((c = CALL.exec(body))) {
    const h = helpers[c[1]];
    if (h) keysIn(h, out, depth - 1);
  }
  return out;
}

const tpl = {};
marks.forEach((mk, i) => {
  const end = i + 1 < marks.length ? marks[i + 1].at : registryEnd(mk.at);
  tpl[mk.name] = [...keysIn(src.slice(mk.at, end), new Set(), 2)].sort();
});

/* ==================================================================== */
const MEANS = {
  id:        'the name a deep link points at — `#cs-slide-persona`. Left out, a slide gets a counted one',
  hidden:    '`hidden: true` skips the slide completely: not drawn, not counted, nothing renumbered. One word to put it back',
  draft:     'marks a slide as not finished',
  media:     'the drawing this slide shows. `media: null` is a DECISION — no drawing, deliberately. Leaving it out still asks for one',
  media2:    'the second drawing, where a template has two',
  separator: 'the small drawing between this slide and the next',
  flows:     'the name of a set in `workflowSets`. Prefer `views:` — see the note below',
  views:     '`views: 4` — four drawings, named from the slide. The count IS the list',
  slotBase:  'the stem for drawings this slide works out, when it should not be the slide’s own copy key',
  split:     '`split: true` puts a column of writing beside the diagram; `split: ‘panel’` puts the explains panel there',
  href:      'where the link at the end of a strip goes',
  groups:    'which user groups this slide shows, by id, out of `userGroups`. Left out, it shows them all',
  verdict:   'the older single verdict drawing: `verdict: ‘scrapped’` asks for `verdict_scrapped`',
  loading:   'how the prototype window behaves while it loads',
  steps:     'the flow chart’s shape — its steps, in order',
  links:     'the joins between those steps',
  shots:     'drawings written out by hand for one step',
  accordions:'how many accordions and what they are called: `[‘acc-01’, ‘acc-02’]`. Their WORDS are `accordionWords` in copy.js',
  graphics:  'which palette colours light a chapter mark: `[‘sun’, ‘mist’]`. Every name is a light, and the first is also the ground the others move across. One to four',
  variant:   'which variant of a chapter mark: `‘graphics-inside’` (the default — the lights inside the letters, nothing else painted), `‘graphics-outside’` (the lights fill the band, the letters cut out of them, the edges faded) or `‘graphics-none’` (no lights at all — the name set like every other heading). Writing the variant’s name as the `template` does the same thing',
  headFill:  '`headFill: false` — an accordion stack’s titles sit with nothing behind them, the circle and the words and no more. Left out, each title carries a faint wash of the study’s second colour. A study-wide default goes in theme.css as `--cs-fancy-fill: off`',
  fade:      '`fade: false` — a `graphics-outside` chapter band keeps its own hard edges and rounded corners instead of melting into the page. Left out, the edges fade',
  question:  '`question: false` — this stepped slide deliberately has no question above its diagram. SINGULAR; `questions` with an s is the copy block',
  ratings:   '`ratings: false` — no assessment strip on this slide',
  impact:    'one of `very low` `low` `medium` `high` `very high`. `impact: false` drops just this card',
  feasibility:'the same five. `feasibility: false` drops just this card',
  diagrams:  'which named set out of `diagramSets` this slide shows',
  n:         'overrides one card’s number in a numbered grid: `n: ‘Q4’`'
};

/* What a template takes that is not a key on its own line. */
const NOTES = {
  persona: 'The people are `personas` in content.js, not on this slide\u2019s line \u2014 each entry is `{ name, description, media, media2, ink, sections }`. **One person and the carousel turns itself off**: no arrows, no counter, no swipe, and the portrait takes the full width (slightly wider than on a two-person slide).',
  'use-case': '`groups` picks from `userGroups` in content.js. All three assessment switches live here: `ratings: false` for the whole strip, `impact: false` or `feasibility: false` for one card, and `meta.showRatings: false` for every use-case slide in the study.',
  backend: 'Shows the study\u2019s plain `diagrams` list. With no such list the slide is empty.',
  grid: 'Rows come from `items` in copy.js OR from `groups` here \u2014 `groups` is the version with a grouping column down the left.',
  'impact-grid': 'As `grid`, with a statement over it.',
  'strip-fancy-accordion': '`accordions` names them; `accordionWords` in copy.js holds their words under those same names.',
  'flow-chart': '`steps` and `links` are the diagram\u2019s shape; `stepWords` in copy.js holds the words.',
  'chapter-name-graphics': '`graphics: [\u2018sun\u2019, \u2018mist\u2019]` \u2014 every name is a light, and the first is also the ground. `variant:` picks ‘graphics-inside’, ‘graphics-outside’ or ‘graphics-none’; `fade: false` stops an outside band melting into the page. The CSS knobs are in the README.',
  prototype: 'A prototype folder named after the slot needs no entry anywhere.',
  'title-steps': 'The question above the diagram and the writing beside it are in the top-level `questions` and `bodies` in copy.js, filed by the drawing\u2019s name \u2014 not here.',
  wireframe: 'As `title-steps`.',
  'title-wireframe': 'As `title-steps`.'
};

const missing = [];
Object.keys(tpl).forEach(t => tpl[t].forEach(k => { if (!MEANS[k]) missing.push(t + ' → ' + k); }));
if (missing.length) {
  console.error('STOPPED: no meaning written for these keys. Add them to MEANS\n  in tools/content-reference.js:\n');
  missing.forEach(x => console.error('   ' + x));
  process.exit(1);
}

const L = [];
const p = s => L.push(s);

p('# What you can write on a slide’s line, and everything else in content.js');
p('');
p('**Generated from the engine.** `node tools/content-reference.js --write`');
p('rebuilds it by reading `system/js/cs-templates.js`, so it cannot drift.');
p('Do not edit by hand — the next rebuild overwrites it.');
p('');
p('Its companion is **[COPY-REFERENCE.md](COPY-REFERENCE.md)**, which covers');
p('the WORDS. The split is the same one the files make: **copy.js holds what');
p('it says, content.js holds what it is.**');
p('');
p('---');
p('');
p('## The shape of content.js');
p('');
p('```js');
p('CS.CASE_STUDY = {');
p('  copy: \'study\',            // fold the `study` block of copy.js onto this');
p('  meta: { … },              // the page title, the back link, study-wide switches');
p('');
p('  story:    [ … ],          // THE RUNNING ORDER — the slides, in order');
p('  nutshell: [ … ],          // an optional short version; with none, no "in a nutshell" switch');
p('  parked:   [ … ],          // slides deliberately not in the order. Not drawn, not warned about');
p('');
p('  personas:   [ … ],        // the people on the persona slide');
p('  userGroups: [ … ],        // the faces a use-case slide shows');
p('  drawers:    { … },        // the panels a word can open');
p('');
p('  workflowSets: { … },      // named runs of diagrams. Usually unnecessary — see below');
p('  diagramSets:  { … },      // the same for the backend slide');
p('  diagrams:     [ … ],      // the study’s one plain list, for `backend`');
p('  workflows:    [ … ]       // the study’s one plain list, for `wireframe`');
p('};');
p('```');
p('');
p('### `meta`');
p('');
p('| | |');
p('|---|---|');
p('| `id` | the study’s folder name. Prototypes are found under it |');
p('| `title` | the page title |');
p('| `backHref` / `backLabel` | where "back" goes and what it says |');
p('| `storyNote` / `nutshellNote` | the line under each view’s tab |');
p('| `showRatings: false` | **no assessment strip on any use-case slide in this study** |');
p('');
p('---');
p('');
p('## Switches: how to turn a thing OFF');
p('');
p('The whole site uses one idiom for this, and it is worth learning once:');
p('**leaving a key out means "not written yet", and a value means "no, on');
p('purpose".** The first draws a placeholder naming what it wants; the second');
p('draws nothing and says nothing.');
p('');
p('| To turn off | Write | Where |');
p('|---|---|---|');
p('| the heading on a slide | `title: null` | the slide’s line |');
p('| the drawing on a slide | `media: null` | the slide’s line |');
p('| a whole slide | `hidden: true` | the slide’s line |');
p('| the assessment strip, this slide | `ratings: false` | the slide’s line |');
p('| the assessment strip, whole study | `showRatings: false` | `meta` |');
p('| just the feasibility card | `feasibility: false` | the slide’s line |');
p('| just the impact card | `impact: false` | the slide’s line |');
p('| the question above a stepped diagram | `question: false` | the slide’s line |');
p('| a grid’s grouping column | `grouped: false` | copy.js |');
p('| the drawing prefix inside a phase | `slotPrefix: \'\'` | the phase’s `CS.TABS` entry |');
p('');
p('### And three that turn themselves off');
p('');
p('Nothing to write — the engine drops a control when there is nothing to');
p('choose between, because a control offering one option asks you to choose');
p('between one thing:');
p('');
p('| | |');
p('|---|---|');
p('| **one persona** | no arrows, no counter, no swipe. The portrait takes the full width, so it is slightly wider than on a two-person slide |');
p('| **one tab in a tab series** | no tab bar; the phase’s slides carry on down the page |');
p('| **no `nutshell` list** | no "In a nutshell / The detailed story" switch |');
p('');
p('---');
p('');
p('## `views:` or `flows:`');
p('');
p('**`views: 4` is almost always the one you want.** Four drawings that are');
p('views of one thing, named from the slide — `slide-04_img-01` to `-04`.');
p('There is no list to keep in step, because the count IS the list.');
p('');
p('`flows: \'name\'` is for a slide offering a CHOICE between several named runs');
p('of drawings, each with its own tab. If the set you are pointing at holds one');
p('run whose drawings are named after the slide, `views:` says the same thing');
p('and the set can be deleted.');
p('');
p('---');
p('');
p('## Inside a phase folder');
p('');
p('```js');
p('CS.TABS[\'phase-01\'] = {');
p('  label: \'Phase 1\',          // what the tab says');
p('  slotPrefix: \'phase-01\',    // goes in front of every drawing this phase works out');
p('  slides: [ … ],             // written exactly as any slide anywhere');
p('');
p('  workflowSets: { … },       // a phase may own any of the study’s lists');
p('  userGroups:   [ … ],');
p('  personas:     [ … ],');
p('  drawers:      { … },');
p('');
p('  shares: [\'userGroups\']     // … or borrow the study’s, by name');
p('};');
p('```');
p('');
p('A phase reads its OWN lists. If it declares one, the study’s of that name is');
p('invisible to it; if it declares neither that list nor `shares`, the console');
p('says so rather than silently borrowing. `shares: true` takes the lot.');
p('');
p('**A drawing you name by hand inside a phase needs the prefix yourself** —');
p('`media: \'phase-01_slide-03_img-01\'`. The engine only prefixes the names it');
p('works out, because those are the ones you cannot see.');
p('');
p('---');
p('');
p('## Every template');
p('');

Object.keys(tpl).sort().forEach(name => {
  p('### `' + name + '`');
  p('');
  if (!tpl[name].length) {
    p('Nothing but `template` and `copy`.');
  } else {
    p('| on the slide’s line | |');
    p('|---|---|');
    tpl[name].forEach(k => p('| `' + k + '` | ' + MEANS[k] + ' |'));
  }
  if (NOTES[name]) { p(''); p('> ' + NOTES[name]); }
  p('');
});

p('---');
p('');
p('Every slide also takes `template`, `copy`, `id`, `hidden` and `title: null`,');
p('whatever the table above says — those belong to slides rather than to any');
p('one template.');
p('');
p('*' + Object.keys(tpl).length + ' templates. Generated by `tools/content-reference.js`.*');

const out = L.join('\n') + '\n';
if (process.argv.includes('--write')) {
  fs.writeFileSync(path.join(ROOT, 'case-studies/CONTENT-REFERENCE.md'), out);
  console.log('wrote case-studies/CONTENT-REFERENCE.md — ' +
              Object.keys(tpl).length + ' templates, ' + out.split('\n').length + ' lines');
} else process.stdout.write(out);
