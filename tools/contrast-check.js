/* contrast-check.js — read every word on every surface and say whether it
   can actually be read.

       node tools/contrast-check.js            every page, both modes
       node tools/contrast-check.js --verbose  list the passes too

   WHY THIS EXISTS RATHER THAN A SPREADSHEET OF COLOUR PAIRS

   A spreadsheet tells you that fire on bg-3 is 2.08 to 1. It does not tell
   you that the label on the "Open full size" button is fire on bg-3, because
   that fact is spread across a token file, a theme file and a rule in
   cs-prototype.css, and it only becomes true once a browser has put them
   together. So this does not read the CSS. It opens the real pages, in both
   modes, and asks the browser what colour each piece of text ACTUALLY came
   out, and what it is actually sitting on.

   WHAT COUNTS AS A PASS (WCAG 2.1 AA)

       text 24px and over, or 18.66px and bold   3.0 to 1   "large text"
       everything else                           4.5 to 1
       borders, outlines, marks, icons           3.0 to 1   (not checked here;
                                                  this tool only reads text)

   HOW THE BACKGROUND IS WORKED OUT

   An element usually has no background of its own - it is transparent, and
   what you see behind the words belongs to something further up the tree. So
   for each run of text the checker walks upwards until it meets a background
   that is not transparent, blending any partly-transparent layers it passes
   on the way. That is what the eye does, and it is the only way to get the
   true pairing.

   WHAT IT CANNOT SEE: words sitting on a photograph or a drawing. There is no
   single colour behind those, so they are skipped and counted separately.
   Nothing on these pages does that today. */
'use strict';
const { chromium } = require('playwright');
const path = require('path');

const VERBOSE = process.argv.includes('--verbose');

const PAGES = [
  ['landing page',      'index.html'],
  ['KIMs case study',   'case-studies/industry-dashboard/index.html'],
  ['the primer',        'case-studies/analyst-primer/index.html'],
  ['case study two',    'case-studies/case-study-two/index.html'],
];

const IN_PAGE = () => {
  /* Browsers hand back two shapes. `rgb(r g b / a)` counts 0-255, and
     `color(srgb r g b / a)` - which is what a color-mix() resolves to -
     counts 0-1. Reading the second as though it were the first makes every
     surface come out near black, which is a very convincing bug: the numbers
     look real and every answer is wrong. */
  function parse(c) {
    const str = String(c);
    const m = str.replace(/^[a-z-]*\(/i, '').match(/[\d.]+(?:e-?\d+)?/gi);
    if (!m || m.length < 3) return null;
    const unit = /^color\(/i.test(str) ? 255 : 1;
    return { r: +m[0] * unit, g: +m[1] * unit, b: +m[2] * unit,
             a: m.length > 3 ? +m[3] : 1 };
  }
  function over(fg, bg) {               // fg laid over bg
    const a = fg.a;
    return { r: fg.r * a + bg.r * (1 - a),
             g: fg.g * a + bg.g * (1 - a),
             b: fg.b * a + bg.b * (1 - a), a: 1 };
  }
  function lum(c) {
    const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  }
  function ratio(a, b) {
    const x = lum(a), y = lum(b), hi = Math.max(x, y), lo = Math.min(x, y);
    return (hi + 0.05) / (lo + 0.05);
  }
  /* what is actually behind this element */
  function behind(el) {
    const stack = [];
    let n = el;
    while (n && n !== document.documentElement) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') return null;  // a picture: can't say
      const c = parse(cs.backgroundColor);
      if (c && c.a > 0) { stack.push(c); if (c.a >= 0.999) break; }
      n = n.parentElement;
    }
    let base = parse(getComputedStyle(document.documentElement).backgroundColor) || { r: 255, g: 255, b: 255, a: 1 };
    if (base.a < 1) base = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = stack.length - 1; i >= 0; i--) base = over(stack[i], base);
    return base;
  }

  const out = [];
  const seen = new Set();
  document.querySelectorAll('*').forEach(el => {
    /* only elements that render their OWN words */
    let own = '';
    for (const n of el.childNodes) if (n.nodeType === 3) own += n.textContent;
    own = own.trim();
    if (!own) return;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) return;

    /* OPACITY IS CONTRAST. A rule that fades a line to 0.8 to make it "quiet"
       has moved it 20% of the way to its background, and that shows up in the
       measurement even though the colour in the stylesheet never changed.
       Opacity multiplies down the tree, so it is gathered all the way up. */
    let fade = 1;
    for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
      fade *= parseFloat(getComputedStyle(n).opacity);
    }
    if (fade < 0.02) return;

    const size = parseFloat(cs.fontSize);
    const weight = parseInt(cs.fontWeight, 10) || 400;
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    const need = large ? 3.0 : 4.5;

    let fg = parse(cs.color);
    const bg = behind(el);
    if (!fg || !bg) { out.push({ skipped: true, text: own.slice(0, 40) }); return; }
    fg.a *= fade;
    if (fg.a < 1) fg = over(fg, bg);
    const got = ratio(fg, bg);

    const key = [cs.color, cs.backgroundColor, Math.round(size), Math.round(fade * 20), el.className].join('|');
    if (seen.has(key)) return;
    seen.add(key);

    out.push({
      pass: got >= need,
      got: Math.round(got * 100) / 100,
      need,
      size: Math.round(size * 10) / 10,
      large,
      fg: `rgb(${Math.round(fg.r)},${Math.round(fg.g)},${Math.round(fg.b)})`,
      bg: `rgb(${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)})`,
      /* what to call this piece of text in the report. A class first, then
         an id - the modal's parts are identified by id and would otherwise
         all be reported as "p", which names nothing. */
      what: (el.className && String(el.className).split(' ')[0]) ||
            el.id || el.tagName.toLowerCase(),
      text: own.replace(/\s+/g, ' ').slice(0, 44),
    });
  });
  return out;
};

(async () => {
  const browser = await chromium.launch();
  let failures = 0, checked = 0, skipped = 0;

  for (const [label, file] of PAGES) {
    for (const mode of ['dark', 'light']) {
      /* REDUCED MOTION ON PURPOSE. The parallax deliberately dims a slide the
         further it is from the middle of the screen - down to 0.58 - so a
         slide measured while it is drifting past reads as failing when the
         same slide is at full strength by the time anyone is reading it.
         Asking for reduced motion turns that dimming off and leaves the
         colours alone, which is the state this tool is about. (It is also a
         real reader's setting, so it is a state that has to be right.) */
      const page = await browser.newPage({
        viewport: { width: 1440, height: 1000 },
        reducedMotion: 'reduce',
      });
      await page.addInitScript(m => {
        try {
          sessionStorage.setItem('cs-open', '1');
          localStorage.setItem('hw-theme', m);
          localStorage.setItem('cs-theme', m);
        } catch (e) {}
      }, mode);
      await page.goto('file://' + path.resolve(file));
      await page.waitForTimeout(2200);
      /* set the mode the way the switch does, so nothing is left to chance */
      await page.evaluate(m => document.documentElement.setAttribute('data-cs-mode', m), mode);
      /* AND WAIT FOR THE CROSSFADE TO FINISH. Several surfaces transition
         their colour over 420ms when the mode changes. Measured before that
         settles, a light-mode page still reports dark-mode colours on
         light-mode backgrounds, and the tool invents failures that are
         really just a stopwatch started too early. 1200ms clears the
         longest transition on the site with room to spare. */
      await page.waitForTimeout(1200);

      /* THE MODAL HAS TO BE OPEN TO BE READ. It is the only part of the site
         that is in the page but invisible until something opens it, and a
         checker that never opens it would report the landing page clean
         while the catalogue's cards went unmeasured. Both of its states are
         looked at, because they carry different words on different fills. */
      const states = [];
      if (await page.evaluate(() => !!(window.HW && HW.catalogue))) {
        states.push('company', 'gate');
      }

      let rows = await page.evaluate(IN_PAGE);
      for (const st of states) {
        await page.evaluate(s => {
          HW.catalogue.open();
          document.getElementById('hw-catalogue').setAttribute('data-hw-state', s);
          if (s === 'gate') {
            /* the heading is written when a card is pressed, so stand one in */
            var t = document.getElementById('hw-catalogue-gate-title');
            if (t && !t.textContent) t.textContent = 'A case study';
            var say = document.getElementById('hw-catalogue-gate-say');
            if (say) say.textContent = 'That password does not open this one.';
          }
        }, st);
        await page.waitForTimeout(600);
        const extra = await page.evaluate(IN_PAGE);
        rows = rows.concat(extra.filter(r => /hw-catalogue|hw-case-card/.test(r.what || '')));
        await page.evaluate(() => HW.catalogue.close());
        await page.waitForTimeout(400);
      }
      const bad = rows.filter(r => r.pass === false);
      const skip = rows.filter(r => r.skipped);
      checked += rows.length - skip.length;
      skipped += skip.length;
      failures += bad.length;

      const head = (label + ' · ' + mode).padEnd(34);
      if (!bad.length) {
        console.log(head + 'all ' + (rows.length - skip.length) + ' readable' +
                    (skip.length ? '   (' + skip.length + ' on a picture, not checked)' : ''));
      } else {
        console.log(head + bad.length + ' TOO FAINT');
        for (const b of bad) {
          console.log('    ' + String(b.got).padEnd(6) + 'needs ' + b.need +
                      '   ' + String(b.size + 'px').padEnd(8) +
                      b.what.padEnd(26) + b.fg + ' on ' + b.bg);
          console.log('      ' + JSON.stringify(b.text));
        }
      }
      if (VERBOSE) rows.filter(r => r.pass).forEach(r =>
        console.log('    ok   ' + String(r.got).padEnd(6) + r.what.padEnd(26) + JSON.stringify(r.text)));
      await page.close();
    }
  }
  await browser.close();
  console.log('');
  console.log('  ' + checked + ' pieces of text read, ' + failures + ' too faint' +
              (skipped ? ', ' + skipped + ' sitting on a picture (not checkable)' : ''));
  console.log('');
  process.exit(failures ? 1 : 0);
})();


