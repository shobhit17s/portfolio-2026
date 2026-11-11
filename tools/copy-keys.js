/* copy-keys.js — WHAT EACH TEMPLATE READS, taken from the engine itself.

       node tools/copy-keys.js                 every template
       node tools/copy-keys.js numbered-grid   just that one
       node tools/copy-keys.js --plain         no box drawing

   WHY IT IS GENERATED RATHER THAN WRITTEN DOWN. A list of "what to write
   for each template" kept by hand goes stale the first time a template
   learns a new word, and a stale list is worse than none: you write the key
   it tells you to and nothing appears, with no error, because the engine
   never looks for that word.

   This reads cs-templates.js and reports every `d.<something>` each
   template asks for. It cannot drift, because it is not a copy of the
   truth - it IS the truth, read out loud.

   WHAT IT CANNOT TELL YOU is the SHAPE a key wants: that `items` is a list
   and `title` is a sentence. Where that is not obvious from the name, the
   template's own comment in cs-templates.js says so, and the common ones
   are written up in case-studies/README.md. This tool answers "which words
   does this template know", which is the question that actually bites. */
'use strict';
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(
  path.join(__dirname, '..', 'system', 'js', 'cs-templates.js'), 'utf8');

const want = process.argv.slice(2).filter(a => a !== '--plain')[0];
const plain = process.argv.includes('--plain');

/* Every `'name': function (d) {` in the registry, and the text that follows
   it up to the next one. A template is the only thing in this file written
   that way, so nothing else is caught. */
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

/* THE KEYS A TEMPLATE WRITTEN BY SOMEBODY ELSE PUTS IN. `copy` is the name
   of the block, which goes on the slide's line in content.js, not inside
   the block; the rest below are structure rather than words. */
const STRUCTURAL = new Set([
  'copy', 'template', 'id', 'hidden', 'draft', 'group',
  'media', 'media2', 'separator', 'flows', 'slotBase', 'views',
  'split', 'href', 'groups', 'verdict', 'loading',
  /* THE FLOW CHART'S SHAPE. `steps` was always reported as a word to
     write in copy.js, which it has never been - it is the diagram's
     shape and it lives on the slide's line. `links` and `shots` are the
     same kind of thing, and the tool would have gone on quietly putting
     all three in the wrong column. */
  'steps', 'links', 'shots',
  /* THE ACCORDION SLIDE'S SHAPE. `accordions` is how many there are and
     what they are called, which is the slide's business; the words are
     `accordionWords` in copy.js, under a different name on purpose. */
  'accordions',
  /* THE CHAPTER MARK'S COLOURS. A list of palette words - which colours
     move inside the letters - and that is the slide's business, not a
     line of writing in copy.js. */
  'graphics',
  /* PUT ON THE SLIDE BY THE ENGINE, not by you: which phase it was read
     from, so an empty box can name the right copy.js. */
  'copyIn',
  /* `question: false` - a stepped slide saying it deliberately has no
     question above its diagram. A yes/no on the slide, not words. Note the
     SINGULAR: `questions` with an s IS a copy block, and the two are
     unrelated. */
  'question'
]);

/* SET BY THE ENGINE, NEVER BY A PERSON. `copy` is the block's name and
   goes on the slide's line; `copyIn` is which phase file it was found in,
   written on by cs-content.js. Neither is a word anybody types into a copy
   block, so neither belongs in either column. `copyIn` only started
   showing up once this tool learned to follow helpers - copyKey() reads
   it - which is a good sign the following works. */
const ENGINE = new Set(['copy', 'copyIn', 'template']);

const bodies = {};
marks.forEach((mark, i) => {
  bodies[mark.name] = src.slice(mark.at,
    i + 1 < marks.length ? marks[i + 1].at : registryEnd(src, mark.at));
});

/* =======================================================================
   THE HELPERS TEMPLATES HAND WORK TO
   =======================================================================

   A template does not always read its own words. When two templates draw
   the same thing - `grid` and `impact-grid` both draw the table - the
   drawing lives in one helper and both call it. The words that table
   needs are then written in the HELPER, and a tool that only reads the
   template's own lines reports both of them as understanding nothing
   about headers, items or legends.

   Which is the exact failure this file's note about `pair-split` already
   warns against: not a missing answer, a confidently wrong one. The
   handover below follows a plain `helper(d)` call the same way the one
   under it follows `T['name'](d)`.

   Helpers are the file's other top-level functions, two spaces in. */
const HELPER = /^  function ([A-Za-z_$][\w$]*)\s*\(/gm;
const helperAt = [];
let hm;
while ((hm = HELPER.exec(src))) helperAt.push({ name: hm[1], at: hm.index });

const helpers = {};
helperAt.forEach((h, i) => {
  /* to the next top-level function, or to the first template, whichever
     comes first - a helper never contains one */
  const nextFn = i + 1 < helperAt.length ? helperAt[i + 1].at : src.length;
  const nextTpl = marks.reduce((best, mk) =>
    (mk.at > h.at && mk.at < best) ? mk.at : best, src.length);
  helpers[h.name] = src.slice(h.at, Math.min(nextFn, nextTpl));
});

/* ONE TEMPLATE CAN BE ANOTHER WITH A CHANGE. `pair-split` is `pair-section`
   with a drawing pushed into the middle of it, and it asks for every word
   that one asks for - but its own few lines never mention them, so reading
   those lines alone reported it as understanding nothing at all. Following
   the handover is the difference between a true answer and a confidently
   wrong one. */
function keysOf(name, seen) {
  seen = seen || [];
  if (seen.indexOf(name) !== -1 || !bodies[name]) return new Set();
  seen.push(name);
  const body = bodies[name];
  const keys = new Set();
  let k;
  const KEY = /\bd\.([A-Za-z_$][\w$]*)/g;
  while ((k = KEY.exec(body))) keys.add(k[1]);
  let h;
  const HANDOVER = /\bT\['([a-z0-9-]+)'\]\(/g;
  while ((h = HANDOVER.exec(body))) {
    keysOf(h[1], seen).forEach(x => keys.add(x));
  }
  /* and the plain kind: `gridBox(d)`. Only a call that is handed the
     slide's data counts - `el(...)` and the rest take other things and
     have no words of their own to report. */
  let g;
  const TO_HELPER = /\b([A-Za-z_$][\w$]*)\s*\(\s*d\s*[,)]/g;
  while ((g = TO_HELPER.exec(body))) {
    const name = g[1];
    if (!helpers[name] || seen.indexOf('fn:' + name) !== -1) continue;
    seen.push('fn:' + name);
    let hk;
    const K2 = /\bd\.([A-Za-z_$][\w$]*)/g;
    while ((hk = K2.exec(helpers[name]))) keys.add(hk[1]);
  }
  return keys;
}

const rows = marks.map(mark => {
  const all = [...keysOf(mark.name)].sort();
  return {
    name: mark.name,
    copy: all.filter(x => !STRUCTURAL.has(x) && !ENGINE.has(x)),
    other: all.filter(x => STRUCTURAL.has(x) && !ENGINE.has(x))
  };
});

const list = want ? rows.filter(r => r.name === want) : rows;
if (!list.length) {
  console.log('\n  No template called "' + want + '". The ones there are:\n');
  console.log('      ' + rows.map(r => r.name).join(', ') + '\n');
  process.exit(1);
}

const W = 22, C = 46;
const pad = (s, n) => s.padEnd(n);
const rule = plain ? '' : '  ' + '-'.repeat(W + C + 34);

/* WRAPPED, NOT CUT SHORT. A list of words trimmed with a … is the one
   shape this tool must never take: the word you needed is always the one
   that was cut off, and nothing says so. */
function wrap(words, width) {
  const lines = [];
  let line = '';
  (words.length ? words : ['—']).forEach(w => {
    const next = line ? line + ', ' + w : w;
    if (next.length > width - 2 && line) { lines.push(line + ','); line = w; }
    else line = next;
  });
  if (line) lines.push(line);
  return lines;
}

console.log('');
console.log('  ' + pad('TEMPLATE', W) + pad('WRITE THESE IN copy.js', C) +
            'ON THE SLIDE\'S LINE IN content.js');
if (rule) console.log(rule);
for (const r of list) {
  const a = wrap(r.copy, C), b = wrap(r.other, 34);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    console.log('  ' + pad(i ? '' : r.name, W) + pad(a[i] || '', C) + (b[i] || ''));
  }
}
if (rule) console.log(rule);
console.log('');
console.log('  ' + list.length + ' template' + (list.length === 1 ? '' : 's') +
            '. The shape each word wants is in that template\'s own comment in');
console.log('  system/js/cs-templates.js, and the common ones in case-studies/README.md.');
console.log('');
