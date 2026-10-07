/* asset-list.js — what the page is looking for, and what it has found.

   Read straight out of js/hw-config.js rather than typed by hand, so it
   cannot drift away from what the page actually asks for.

   Run:  node tools/asset-list.js
*/
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const sandbox = { window: {} };
new Function('window', fs.readFileSync(path.join(root, 'js/hw-config.js'), 'utf8'))(sandbox.window);
const HW = sandbox.window.HW;

const rows = [];
HW.WORLDS.forEach(w => {
  const add = (kind, list) => (list || []).forEach(p => {
    const want = Array.isArray(p.src) ? p.src : [p.src];
    rows.push({ world: w.nav, kind, want, size: p.size });
  });
  add('prop', w.props);
  add('snack', w.food);
});

// one line per FILE, not per instance
const byFile = new Map();
rows.forEach(r => {
  const k = r.want[0];
  if (!byFile.has(k)) byFile.set(k, { file: k, world: new Set(), n: 0, sizes: [], standin: r.want.slice(1) });
  const e = byFile.get(k);
  e.world.add(r.world); e.n++; e.sizes.push(r.size);
});

const here = f => fs.existsSync(path.join(root, 'assets', f));
const out = [];
out.push('EVERY DRAWING THE PAGE IS LOOKING FOR');
out.push('');
out.push('Put the file at exactly the path in the first column, under');
out.push('worlds-source\\assets\\ , and it appears on the next reload.');
out.push('The name has to match exactly - no "(1)", no capitals, no .jpg.');
out.push('');
const pad = (s, n) => (s + ' '.repeat(n + 2)).slice(0, n) + '  ';
out.push(pad('FILE', 30) + pad('STATUS', 13) + pad('HOW MANY', 9) + pad('WHERE', 18) + 'HEIGHTS');
out.push('-'.repeat(92));
[...byFile.values()].forEach(e => {
  const have = here(e.file);
  const status = have ? 'DONE' : (e.standin.some(here) ? 'stood in for' : 'WAITING');
  out.push(pad(e.file, 30) + pad(status, 13) + pad('x' + e.n, 9) +
           pad([...e.world].join(' + '), 18) + e.sizes.join('  '));
});
out.push('');
out.push('DONE          your drawing is in place');
out.push('stood in for  one of my placeholder .svg files is showing instead');
out.push('WAITING       nothing there yet, so nothing is drawn in that spot');
out.push('');
out.push('The mark is separate: assets/logo.png, plus one line in css/hw-layout.css.');
console.log(out.join('\n'));


