/* sheet-gen.js — build the drawing sheets for the things on the planets.

   THE LIST IS NOT TYPED HERE. It is read out of js/hw-config.js, so the
   filename, the world, how many of each and how tall they are can never drift
   away from what the page actually asks for. Only the human bits - a note
   here and there - live in this file, looked up by filename.

   Every box is ruled from those real numbers, so a drawing made between the
   lines comes back the right size and standing in the right place. And the
   sheet can be REDRAWN BYTE FOR BYTE later, which is how
   tools/sprite-harvest.py takes the sheet away again and leaves only ink.

   Run:  node tools/sheet-gen.js <outdir>      (needs playwright, and the site
                                                served at $SHEET_BASE)
*/
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');

const BASE = process.env.SHEET_BASE || 'http://localhost:8777';
const root = path.join(__dirname, '..');
const win = {};
new Function('window', fs.readFileSync(path.join(root, 'js/hw-config.js'), 'utf8'))(win);
const HW = win.HW;
const HERO = HW.CHARACTER.size;

/* Only the words. Everything else comes from the configuration. */
const NOTE = {
  'home-pine': 'YOUR DRAWING, already in. Redraw only if you want to.',
  'home-rammed-earth': 'ONE of them, in the northern half of the planet.',
  'home-snow-leopard': 'TALLER THAN HE IS, and this box is PORTRAIT — draw it upright. The only living thing anywhere on the site apart from him.',
  'play-controller': 'took the windmill\'s place. A hand-held thing, so it sits low on the ground.',
  'work-pantheon': 'THE LANDMARK. Stands on the pole so it never turns out of sight, is lit from behind, and is a BUTTON — pressing it opens the SME panel.',
  'work-greatsword': 'PLANTED BLADE-DOWN. The hilt is the top of the drawing; the POINT must reach the very bottom edge, because that edge is what meets the ground.',
  'play-basketball': 'resting on the ground. If you want it mid-bounce, leave empty space below it.',
  'play-balloon': 'to make it float, leave empty space BELOW it in the file — that empty space stands on the ground.',
  'signal-round-table': 'a round table with chairs — an invitation, next to the ways of reaching you.',
  'signal-linkedin': 'A BUTTON. Opens your LinkedIn. Draw the tile, not just the glyph.',
  'signal-instagram': 'A BUTTON. Opens your Instagram.',
  'signal-email': 'A BUTTON. Opens a mail window.'
};

/* A stand-in is only worth PRINTING as a ghost when it is a picture of the
   same thing. The pine stands in for the sweetgums on the live page, which is
   right - a tree is better than a gap - but printing a pine inside the
   sweetgum box would be telling you to draw the wrong tree. So a ghost is
   shown only when the stand-in is genuinely that object, plus the one case
   below where the new drawing REPLACES the old one. */
const GHOST_OK = {};   // every stand-in left is a different object
const bare = f => f.replace(/^.*\//, '').replace(/\.[a-z0-9]+$/i, '');
function ghostFor(r) {
  if (r.file && fs.existsSync(path.join(root, 'assets', r.file))) return r.file;
  if (r.stand && bare(r.stand) === bare(r.file)) return r.stand;
  return GHOST_OK[r.name] || '';
}

/* ---------- read the worlds ---------- */
function collect(kind) {
  const byFile = new Map();
  HW.WORLDS.forEach(w => (w[kind] || []).forEach(p => {
    const want = Array.isArray(p.src) ? p.src : [p.src];
    const file = want[0];
    if (!byFile.has(file)) byFile.set(file, { file, worlds: new Set(), sizes: [], stand: want[1] || '' });
    const e = byFile.get(file);
    e.worlds.add(w.nav);
    e.sizes.push(p.size);
  }));
  return [...byFile.values()].map(e => {
    const name = e.file.replace(/^.*\//, '').replace(/\.png$/, '');
    return { name, file: e.file, worlds: [...e.worlds].join(' + '), count: e.sizes.length,
             size: Math.max(...e.sizes), sizes: e.sizes, stand: e.stand, note: NOTE[name] || '' };
  }).sort((a, b) => b.size - a.size);
}

const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
body{background:#fff;font:15px/1.45 -apple-system,Segoe UI,Roboto,sans-serif;color:#222;width:2760px;padding:60px}
h1{font-size:44px;margin-bottom:10px}
.sub{font-size:23px;color:#555;margin-bottom:26px}
.hand{border:3px solid #1d4f3f;border-radius:12px;padding:26px 30px;margin-bottom:30px;background:#f3f8f6}
.hand h2{font-size:22px;color:#1d4f3f;margin-bottom:12px;letter-spacing:.02em}
.hand ol{margin:0 0 0 26px;font-size:18px;line-height:1.75;color:#234}
.hand b{color:#0f3a2d}
.rule{font-size:18px;color:#777;max-width:2100px;margin-bottom:34px;line-height:1.6}
.rule b{color:#444}
.scale{border:2px solid #e3e3e3;border-radius:10px;padding:26px 30px 18px;margin-bottom:46px;background:#fbfbfb}
.scale h2{font-size:19px;letter-spacing:.12em;text-transform:uppercase;color:#888;margin-bottom:6px}
.scale p{font-size:16px;color:#777;margin-bottom:20px}
.scalerow{display:flex;align-items:flex-end;gap:28px;flex-wrap:nowrap}
.scaleitem{display:flex;flex-direction:column;align-items:center;min-width:62px}
.scaleitem .bar{border-bottom:3px solid #999;width:100%;display:flex;align-items:flex-end;justify-content:center}
.scaleitem img{display:block}
.scaleitem .stub{border:2px dashed #d8d8d8;border-bottom:0;width:70%}
.scaleitem b{font-weight:400;font-size:13px;color:#999;margin-top:9px;text-align:center;line-height:1.3}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:36px}
.cell{border:2px solid #dcdcdc;border-radius:10px;display:flex;flex-direction:column;overflow:hidden;height:100%}
.head{padding:18px 24px 16px;border-bottom:2px solid #eee;background:#fafafa}
.fn{font-family:ui-monospace,Menlo,monospace;font-size:24px;color:#111}
.tags{display:flex;gap:10px;align-items:center;margin-top:9px;flex-wrap:wrap}
.pill{font-size:16px;padding:4px 12px 5px;border-radius:20px;background:#eceff0;color:#4a5a5f}
.pill.count{background:#2f3b3f;color:#fff;font-weight:600}
.note{font-size:15px;color:#a06a20;margin-top:9px;line-height:1.4;min-height:21px}
.art{position:relative;flex:1}
.mid{position:absolute;left:50%;top:14px;bottom:76px;width:0;border-left:2px dashed #ededed}
.ground{position:absolute;left:16px;right:16px;bottom:74px;height:0;border-top:5px solid #444}
.gl{position:absolute;right:18px;bottom:80px;font-size:14px;color:#999;letter-spacing:.12em}
.top{position:absolute;left:16px;right:16px;height:0;border-top:2px dashed #c9a94f}
.tl{position:absolute;right:18px;font-size:14px;color:#c9a94f;letter-spacing:.06em}
.ghost{position:absolute;left:50%;transform:translateX(-50%);bottom:74px;filter:grayscale(1);opacity:.26}
.hero{position:absolute;left:28px;bottom:74px;filter:grayscale(1);opacity:.15}
.hcap{position:absolute;left:28px;bottom:44px;font-size:14px;color:#bbb}
.sz{position:absolute;left:50%;transform:translateX(-50%);bottom:26px;font-size:15px;color:#aaa}
`;

const HANDOVER = `<div class="hand">
  <h2>HOW TO SEND THIS BACK — please read, it saves us both a round trip</h2>
  <ol>
    <li>Draw on <b>your own layer(s)</b>, on top of this sheet.</li>
    <li>When you export, <b>turn this printed sheet OFF</b> — the boxes, the lines, the labels, the pale grey drawings. None of it should be in the file you send.</li>
    <li>Export as <b>PNG with transparency</b>. Every pixel you painted is opaque; everything else is empty. In Procreate: Share &rarr; PNG, with the background layer toggled off.</li>
    <li><b>Do not crop, resize or move anything.</b> Keep the exact canvas size. I find each drawing by where its box is, so a crop loses that.</li>
    <li>Send it as a file, not pasted into a message, so nothing re-compresses it.</li>
  </ol>
  <p style="margin-top:14px;font-size:17px;color:#2a4a40"><b>Why it matters:</b> if the sheet is still in the picture I have to subtract it, and subtraction has to guess at the soft edge of every stroke — which is how a bit of the old grey pine ended up inside your tree last time. With transparency there is nothing to guess: the empty pixels <i>are</i> the answer.</p>
</div>`;

function cell(r, k, heroPx, i) {
  const pct = Math.round(r.size / HERO * 100);
  const topPx = Math.round(r.size * k);
  const ghost = ghostFor(r);
  return `<div class="cell" data-i="${i}" data-name="${r.name}">
    <div class="head">
      <div class="fn">${r.name}.png</div>
      <div class="tags"><span class="pill count">&times;${r.count}</span><span class="pill">${r.worlds}</span></div>
      <div class="note">${r.note || '&nbsp;'}</div>
    </div>
    <div class="art" style="min-height:${topPx + 210}px">
      <div class="mid"></div>
      ${heroPx ? `<img class="hero" src="${BASE}/assets/character/hero-ink.png" style="height:${heroPx}px">
      <div class="hcap">him, to scale</div>` : ''}
      ${ghost ? `<img class="ghost" src="${BASE}/assets/${ghost}" style="height:${topPx}px">` : ''}
      <div class="top" style="bottom:${74 + topPx}px"></div>
      <div class="tl" style="bottom:${74 + topPx + 8}px">TOP — draw up to about here</div>
      <div class="ground"></div>
      <div class="gl">GROUND</div>
      <div class="sz">${pct}% of his height &nbsp;·&nbsp; ${r.count > 1 ? 'heights ' + r.sizes.join(', ') : 'height ' + r.size}</div>
    </div>
  </div>`;
}

function strip(list, unit, withHero) {
  const items = (withHero ? [{ name: 'him', size: HERO, file: 'character/hero-ink.png', stand: '' }] : [])
    .concat(list);
  return `<div class="scale">
    <h2>Everything at its true size, side by side</h2>
    <p>A reference, not something to draw on. A dashed outline is a slot with nothing in it yet — that is how tall it will be.</p>
    <div class="scalerow">${items.map(r => {
      const h = Math.round(r.size * unit);
      const f = r.name === 'him' ? r.file : ghostFor(r);
      return `<div class="scaleitem"><div class="bar" style="height:${h}px">${
        f ? `<img src="${BASE}/assets/${f}" style="height:${h}px">` : `<div class="stub" style="height:${h}px"></div>`
      }</div><b>${r.name.replace(/^(home|work|play|signal)-/, '')}</b></div>`;
    }).join('')}</div>
  </div>`;
}

const RULE = `One object per box, drawn in <b>full colour with its own outline</b> — an open line drawing disappears against a coloured planet.
  Stand it on the thick <b>GROUND</b> line, centre it on the dashed line, and take it up to about the gold <b>TOP</b> line.
  The dark pill in each header is <b>how many of that object go on a planet</b>; the pale one is which planet.
  <br><br><b>The bottom edge is everything.</b> The page plants a drawing by the bottom edge of its file, so whatever should touch the ground must sit on the GROUND line. Anything meant to float — a balloon, a ball mid-bounce — just leaves empty space below it.`;

function page(title, sub, extra, list, unit, artH, withHero) {
  const maxSize = Math.max(...list.map(r => r.size), withHero ? HERO : 0);
  const k = artH / maxSize;
  return `<!doctype html><meta charset="utf-8"><style>${CSS}</style><body>
  <h1>${title}</h1><div class="sub">${sub}</div>
  ${HANDOVER}
  <div class="rule">${RULE}${extra}</div>
  ${strip(list, unit, withHero)}
  <div class="grid">${list.map((r, i) => cell(r, k, withHero ? Math.round(HERO * k) : 0, i)).join('')}</div>
  </body>`;
}

(async () => {
  const outdir = process.argv[2] || '.';
  fs.mkdirSync(outdir, { recursive: true });
  const props = collect('props'), food = collect('food');
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 2760, height: 1200 } });
  const jobs = [
    ['props', page('SHEET A — THE THINGS ON THE PLANETS',
      `${props.length} drawings. ${props.reduce((n, r) => n + r.count, 0)} objects across the four worlds.`,
      '', props, 250, 820, true)],
    ['food', page('SHEET B — THE SNACKS',
      `${food.length} drawings. Press one on a planet and the traveller eats it.`,
      '<br><br>He is not in these boxes: at true scale he would be twice the height of one. The strip below has him.',
      food, 250, 620, false)],
  ];
  for (const [name, html] of jobs) {
    await p.setContent(html);
    await p.waitForTimeout(1600);
    await p.screenshot({ path: `${outdir}/sheet-${name}.png`, fullPage: true });
    const boxes = await p.evaluate(() => [...document.querySelectorAll('.cell')].map(c => {
      const a = c.querySelector('.art').getBoundingClientRect();
      const g = c.querySelector('.ground').getBoundingClientRect();
      return { name: c.dataset.name,
               art: { x: a.x + scrollX, y: a.y + scrollY, w: a.width, h: a.height },
               ground: { y: g.y + scrollY, x: g.x + scrollX, w: g.width } };
    }));
    fs.writeFileSync(`${outdir}/boxes-${name}.json`, JSON.stringify(boxes, null, 1));
    console.log('wrote sheet-' + name + '.png');
  }
  await b.close();
})();


