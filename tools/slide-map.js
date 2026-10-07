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
const data = ctx.CS.CASE_STUDY;
const copy = ctx.CS.COPY || {};
const media = ctx.CS.MEDIA || {};

function slotsOf(node, out, seen) {
  if (!node || typeof node !== 'object') return out;
  if (seen.includes(node)) return out;
  seen.push(node);
  for (const k of ['media', 'media2'])
    if (typeof node[k] === 'string' && !out.includes(node[k])) out.push(node[k]);
  if (typeof node.separator === 'string' && /_img-|_prototype-/.test(node.separator)
      && !out.includes(node.separator)) out.push(node.separator);
  for (const k of Object.keys(node)) slotsOf(node[k], out, seen);
  return out;
}

/* A slide can point at a named set of wireframes or diagrams kept elsewhere
   in content.js, so its slots are not all written on its own line. */
function expand(item) {
  const parts = [item];
  if (item.flows) parts.push((data.workflowSets || {})[item.flows] || data.workflows);
  else if (item.template === 'wireframe') parts.push(data.workflows);
  if (item.diagrams) parts.push((data.diagramSets || {})[item.diagrams] || data.diagrams);
  else if (item.template === 'backend') parts.push(data.diagrams);
  if (item.template === 'persona') parts.push(data.personas);
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
function add(prefix, list) {
  let n = 0;
  (list || []).forEach(item => {
    n++;
    rows.push({
      slide: prefix + ' ' + String(n).padStart(2, '0'),
      what: item.label || (copy[item.copy] && copy[item.copy].label) || '—',
      layout: item.template || (item.group ? 'group: ' + item.group : '—'),
      slots: slotsOf(expand(item), [], []).sort()
    });
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
const unused = listed.filter(s => !used.has(s));
console.log('');
console.log('  ' + rows.length + ' slides, ' + used.size + ' picture slots');
if (unlisted.length) console.log('  slots on a slide but not in media.js: ' + unlisted.join(', '));
if (unused.length) console.log('  in media.js but on no slide: ' + unused.join(', '));
console.log('');


