/* spacing-check.js — does anything on a planet sit on top of anything else?

   Placing objects by latitude and longitude is easy to get subtly wrong: two
   things eight degrees apart look far apart in the configuration and are
   touching on the planet. Worse, how much room a thing needs depends on how
   WIDE its drawing is and how BIG the planet is, so the same two numbers are
   fine on one world and a collision on another.

   So this works it out rather than leaving it to the eye:

     - a thing's half-width on the ground is size * (its drawing's aspect) / 2
     - seen from the planet's centre, that is an angle: atan(half / radius)
     - two things collide when they are closer together, in degrees, than
       their two angles added up

   Run:  node tools/spacing-check.js
*/
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const win = {};
new Function('window', fs.readFileSync(path.join(root, 'js/hw-config.js'), 'utf8'))(win);
const HW = win.HW;

/* PNG header: width and height are bytes 16-23 of the IHDR chunk. */
function aspect(src) {
  const first = Array.isArray(src) ? src[0] : src;
  const f = path.join(root, 'assets', first);
  if (!fs.existsSync(f) || !f.endsWith('.png')) return 1;
  const b = fs.readFileSync(f).subarray(0, 24);
  return b.readUInt32BE(16) / b.readUInt32BE(20);
}

const rad = d => d * Math.PI / 180;
function dir(lat, lon) {
  const a = rad(lat), b = rad(lon);
  return [Math.cos(a) * Math.cos(b), Math.sin(a), Math.cos(a) * Math.sin(b)];
}
function apart(p, q) {              // degrees between two lat/lon points
  const u = dir(p.lat, p.lon), v = dir(q.lat, q.lon);
  const d = Math.max(-1, Math.min(1, u[0] * v[0] + u[1] * v[1] + u[2] * v[2]));
  return Math.acos(d) * 180 / Math.PI;
}

let clashes = 0;
HW.WORLDS.forEach(w => {
  const items = [].concat(w.props || [], w.food || [])
    .filter(p => !p.pole)           // the pantheon is on the axis; nothing else is
    .map(p => ({
      name: (Array.isArray(p.src) ? p.src[0] : p.src).replace(/^.*\//, '').replace('.png', ''),
      lat: p.lat, lon: p.lon,
      /* half the footprint, as an angle seen from the planet's centre */
      arc: Math.atan((p.size * aspect(p.src) / 2) / w.radius) * 180 / Math.PI
    }));
  const lines = [];
  for (let i = 0; i < items.length; i++)
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i], b = items[j];
      const need = a.arc + b.arc, got = apart(a, b);
      if (got < need) {
        clashes++;
        lines.push(`   ${a.name} and ${b.name}: ${got.toFixed(0)}° apart, need ${need.toFixed(0)}°`);
      }
    }
  console.log(`${w.nav.toUpperCase().padEnd(9)} ${items.length} objects   ${lines.length ? lines.length + ' OVERLAPPING' : 'all clear'}`);
  lines.forEach(l => console.log(l));
});
console.log(clashes ? `\n${clashes} overlap(s).` : '\nNothing is sitting on anything else.');


