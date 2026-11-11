/* slide-map.js — print a case study's structure, without a browser.

   Reads a study's three content files and prints, in order: every slide,
   what it is called, which layout it uses, and which picture slots sit on
   it. It is the same map CS.slideMap() prints in the browser console, and
   it is generated from the files rather than written down anywhere, so it
   cannot drift out of date.

       node tools/slide-map.js industry-dashboard
       node tools/slide-map.js industry-dashboard --plain   (no box drawing)

   The change notes that come with each bundle paste this straight in. */
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const study = process.argv[2] || 'industry-dashboard';
const plain = process.argv.includes('--plain');
const dir = path.join(__dirname, '..', 'case-studies', study);

/* Load the three files into one shared scope, exactly as a browser would. */
const ctx = { console };
ctx.window = ctx;
vm.createContext(ctx);
for (const f of ['copy.js', 'media.js', 'content.js']) {
  const p = path.join(dir, f);
  if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, 'utf8'), ctx, { filename: f });
}

/* AND EVERY FOLDER BESIDE THEM THAT HOLDS A content.js - the tab series
   keeps each of its editions in one of these. The page loads them with
   <script> tags in its index.html; here we simply look for them, so a new
   phase appears in the map the moment its folder exists and does not have
   to be named in two places. */
for (const name of fs.readdirSync(dir)) {
  const sub = path.join(dir, name);
  if (!fs.statSync(sub).isDirectory()) continue;
  for (const f of ['content.js', 'copy.js', 'media.js']) {
    const p = path.join(sub, f);
    if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, 'utf8'), ctx, { filename: name + '/' + f });
  }
}
/* AND THEN THE ENGINE'S OWN ASSEMBLER RUNS OVER THEM.

   This used to work the content out for itself, and for a while that was
   harmless. It stopped being harmless when a phase started putting its own
   name in front of the drawings it works out - because this file did not
   know that rule, and so it printed `slide-03_img-01` while the page asked
   for `phase-01_slide-03_img-01`.

   A map that disagrees with the thing it is a map of is worse than no map:
   you name the file after what it says, nothing appears, and the one tool
   you would use to find out why is the tool that lied to you.

   So the rule is not copied here. cs-content.js is loaded and run, exactly
   as the page runs it, and what is printed below is what the page sees -
   copy folded in, phases resolved, prefixes applied. Any rule added there
   from now on is in this map the same day, without anybody remembering. */
vm.runInContext(
  fs.readFileSync(path.join(__dirname, '..', 'system', 'js', 'cs-content.js'), 'utf8'),
  ctx, { filename: 'cs-content.js' });
ctx.CS.assembleContent();

const data = ctx.CS.CASE_STUDY;
const copy = ctx.CS.COPY || {};
/* EVERY DRAWING THE STUDY KNOWS ABOUT, the phases' included. The
   assembler folds each phase's media.js into this one map (the keys are
   slot names and a phase's slots carry the phase's name, so they cannot
   collide) - so this is the map, and CS.MEDIA alone would miss a phase's
   drawings and report every one of them as unused. */
const media = (data && data.media) || ctx.CS.MEDIA || {};

function slotsOf(node, out, seen) {
  if (!node || typeof node !== 'object') return out;
  if (seen.includes(node)) return out;
  seen.push(node);
  for (const k of ['media', 'media2'])
    if (typeof node[k] === 'string' && !out.includes(node[k])) out.push(node[k]);
  /* A GRID CELL NAMES ITS DRAWINGS AS A LIST, not one at a time - `medias`
     for a row of faces, `fill` for one filling the cell. Without these the
     map reports a drawing used only inside a grid as UNUSED, which is the
     opposite of true and the kind of wrong answer that gets a file deleted. */
  if (Array.isArray(node.medias))
    for (const m of node.medias)
      if (typeof m === 'string' && !out.includes(m)) out.push(m);
  if (typeof node.fill === 'string' && !out.includes(node.fill)) out.push(node.fill);
  /* A VERDICT IS A STATE, NOT A FILENAME - the slide says 'scrapped' and the
     engine reaches for the drawing called verdict_scrapped. The map has to
     make the same translation, or those two drawings look unused. */
  if (typeof node.verdict === 'string' && !out.includes('verdict_' + node.verdict))
    out.push('verdict_' + node.verdict);
  if (typeof node.separator === 'string' && /_img-|_prototype-/.test(node.separator)
      && !out.includes(node.separator)) out.push(node.separator);
  for (const k of Object.keys(node)) slotsOf(node[k], out, seen);
  return out;
}

/* A slide can point at a named set of wireframes or diagrams kept elsewhere
   in content.js, so its slots are not all written on its own line. */
/* THE USE-CASE SLIDE GOES BY TWO NAMES. It was the idea slide until
   27 October and `title-explains` still works, so anything asking
   "is this one of those" has to accept both words. */
function isUseCase(item) {
  return item.template === 'use-case' || item.template === 'title-explains';
}

function expand(item) {
  const parts = [item];
  /* THE LISTS A SLIDE NAMES BELONG TO ITS PHASE where it is in one, so
     they are asked for the way the page asks - through the engine's own
     CS.pool, which knows whose list a slide is entitled to read. Reaching
     into the study's lists from here would report a phase slide's diagrams
     as the outer story's, or as missing. */
  const pool = name => ctx.CS.pool(name, item);
  if (item.flows) parts.push((pool('workflowSets') || {})[item.flows] || pool('workflows'));
  else if (item.template === 'wireframe') parts.push(pool('workflows'));
  if (item.diagrams) parts.push((pool('diagramSets') || {})[item.diagrams] || pool('diagrams'));
  else if (item.template === 'backend') parts.push(pool('diagrams'));
  /* `views: 5` means five slots whose names follow from the count rather
     than being written down.

     THE RULE IS ASKED FOR, NOT COPIED. It used to be written out again
     here - and then the prototype slide learned to step, its slots became
     `_prototype-01` rather than `_img-01`, and this file went on reporting
     the old names. The engine is loaded above precisely so that cannot
     happen; this is the last place that was still guessing. */
  if (item.views > 1 || (item.views === 1 && !item.media)) {
    ctx.CS.viewSlots(item.slotBase || item.copy || '', item.views,
                     ctx.CS.viewKind(item.template))
      .forEach(name => parts.push({ media: name }));
  }
  /* A flow chart names one drawing per step, after the step - worked out
     by the same CS.flowSlots the slide itself uses, so the map and the
     page cannot disagree about what is missing. */
  if (item.steps && item.template === 'flow-chart') {
    ctx.CS.flowSlots(item.slotBase || item.copy || '', item.steps)
      .forEach(name => parts.push({ media: name }));
  }

  /* AN ACCORDION NAMES ITS DRAWINGS BY WHERE THEY STAND - between which
     two paragraphs - and the paragraphs are in copy.js, so the count can
     only be read off the words. By the time this runs assembleContent has
     folded the copy block onto the slide, so `accordionWords` is here. It
     asks CS.fancySlots, the same function the slide itself asks, so the
     map and the page cannot disagree about what is missing. */
  if (item.accordions && ctx.CS.fancySlots) {
    ctx.CS.fancySlots(item.slotBase || item.copy || '',
                      item.accordions, item.accordionWords)
      .forEach(name => parts.push({ media: name }));
  }

  /* A slide names its user groups; the drawings live on the study's
     `userGroups` list rather than on the slide, so follow the names. */
  if (item.groups || isUseCase(item)) {
    const all = pool('userGroups') || [];
    const want = Array.isArray(item.groups) ? item.groups : all.map(g => g.id);
    for (const id of want) for (const g of all) if (g.id === id) parts.push(g);
  }
  if (item.template === 'persona') parts.push(pool('personas'));
  return parts;
}

/* The App Landscape is ONE scrolling section made of several slides. Each of
   those pieces is a slide in its own right and is numbered as one, because
   that is what its pictures are named after - a picture inside the second
   piece is nutshell-03_…, not nutshell-02_…. Flattening it here is what
   keeps the map and the file names telling the same story. */
function flatten(list) {
  const out = [];
  (list || []).forEach(item => {
    if (!item.group) { out.push(item); return; }
    if (item.logo) out.push(Object.assign({}, item.logo, { label: item.label || 'The app landscape' }));
    (item.kingdom || []).forEach(k => { if (!k.separator) out.push(k); });
  });
  return out;
}

const rows = [];
function row(name, item, label) {
  rows.push({
    slide: name,
    what: label || item.label || (copy[item.copy] && copy[item.copy].label) || '—',
    layout: item.template || (item.group ? 'group: ' + item.group : '—'),
    slots: slotsOf(expand(item), [], []).sort()
  });
}

/* A TAB SERIES IS NOT A SLIDE, it is a run of them that swaps for another
   run - so it is not counted as one and not given a number in the outer
   order. Each edition numbers its own slides, because that is what the
   reader of that edition can count against what they can see. */
function add(prefix, list) {
  let n = 0;
  (list || []).forEach(item => {
    if (item.group === 'tab-series') {
      rows.push({ slide: '', what: '', layout: '', slots: [] });
      /* A TAB IS USUALLY JUST A NAME HERE - the edition itself lives in a
         folder of its own and registers under that name. An unregistered
         name means the folder's content.js did not load. */
      (item.tabs || []).forEach((t0, t) => {
        const tab = typeof t0 === 'string'
          ? ((ctx.CS.TABS || {})[t0] || { label: t0 + '  (its content.js did not load)', slides: [] })
          : t0;
        const name = tab.label || ('tab ' + (t + 1));
        rows.push({ slide: '  ' + name, what: '(' + (tab.slides || []).length +
                    ' slides, one edition of this chapter)', layout: '', slots: [] });
        (tab.slides || []).forEach((sl, i) => {
          row('    ' + String(i + 1).padStart(2, '0'), sl);
        });
      });
      rows.push({ slide: '', what: '', layout: '', slots: [] });
      return;
    }
    n++;
    row(prefix + ' ' + String(n).padStart(2, '0'), item);
  });
}
add('story', data.story);
add('nutshell', flatten(data.nutshell));
Object.keys(data.drawers || {}).forEach((k, i) => {
  rows.push({
    slide: 'drawer ' + String(i + 1).padStart(2, '0'),
    what: (copy[data.drawers[k].copy] && copy[data.drawers[k].copy].title) || k,
    layout: 'drawer',
    slots: slotsOf(data.drawers[k], [], []).sort()
  });
});

const W = { slide: 13, what: 38, layout: 23 };
const pad = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s.padEnd(n));
const line = plain ? '' : '  ' + '-'.repeat(W.slide + W.what + W.layout + 24);

console.log('');
console.log('  ' + pad('SLIDE', W.slide) + pad('WHAT IT IS', W.what) +
            pad('LAYOUT', W.layout) + 'PICTURE SLOTS ON IT');
if (line) console.log(line);
for (const r of rows) {
  /* a spacer or a tab's own heading line has no slots to report, and
     printing "(none)" against it reads as a fault rather than as a gap */
  if (!r.layout && !r.slots.length) {
    console.log(r.slide.trim() ? '  ' + pad(r.slide, W.slide) + r.what : '');
    continue;
  }
  const first = r.slots[0] || '(none)';
  console.log('  ' + pad(r.slide, W.slide) + pad(r.what, W.what) +
              pad(r.layout, W.layout) + first);
  for (const s of r.slots.slice(1)) {
    console.log('  ' + ' '.repeat(W.slide + W.what + W.layout) + s);
  }
}
if (line) console.log(line);

const used = new Set(rows.flatMap(r => r.slots));
const listed = Object.keys(media);
const unlisted = [...used].filter(s => !listed.includes(s));
/* A SLOT NAMED `parked-` BELONGS TO A SLIDE THAT IS NOT IN THE ORDER right
   now - see the `parked` list at the foot of content.js. It is deliberately
   on no slide, so reporting it as unused would be reporting a decision as a
   fault, and the one thing a check like this must never do is cry wolf. */
const parked = listed.filter(s => /^parked-/.test(s));
const unused = listed.filter(s => !used.has(s) && !/^parked-/.test(s));
const slides = rows.filter(r => r.slide.trim() && !/slides, one edition/.test(r.what));
console.log('');
const outer = rows.filter(r => /^(story|nutshell|drawer) /.test(r.slide)).length;
const inTabs = slides.length - outer;
console.log('  ' + outer + ' slides in the order' +
            (inTabs ? ', plus ' + inTabs + ' inside the tab series' : '') +
            ', ' + used.size + ' picture slots');
if (unlisted.length) console.log('  slots on a slide but not in media.js: ' + unlisted.join(', '));
if (unused.length) console.log('  in media.js but on no slide: ' + unused.join(', '));
if (parked.length) console.log('  parked (deliberately on no slide): ' + parked.length + ' slots');
console.log('');

