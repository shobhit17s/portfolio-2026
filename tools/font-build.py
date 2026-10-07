"""font-build.py — fold harvested characters into the display face.

   Each harvested PNG is ink at a known number of pixels per font unit, at a
   known height above the baseline, so placing it needs no judgement: the
   drawing goes in exactly where it was drawn on the sheet.

   Sidebearings are the one thing the sheet cannot tell us, because a box has
   no opinion about spacing. The existing font is remarkably even - every
   letter has about 55 units of air on each side - so new characters get the
   same, and they sit in a line of text at the same rhythm as the old ones.

   Run:  python3 tools/font-build.py <harvest-dir> [<harvest-dir> ...] <out.ttf>
"""
import sys, os, json
import numpy as np
from PIL import Image
from fontTools.ttLib import TTFont
from fontTools.pens.boundsPen import BoundsPen

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import importlib.util
_s = importlib.util.spec_from_file_location('fonttrace', os.path.join(HERE, 'font-trace.py'))
TR = importlib.util.module_from_spec(_s); _s.loader.exec_module(TR)

SIDE = 55          # units of air either side, matching the existing letters
STEP = 12          # how often the tracer drops a point, in pixels

# Adobe glyph names, so other software recognises what these are.
NAME = {
    0x30: 'zero', 0x31: 'one', 0x32: 'two', 0x33: 'three', 0x34: 'four',
    0x35: 'five', 0x36: 'six', 0x37: 'seven', 0x38: 'eight', 0x39: 'nine',
    0x23: 'numbersign', 0x24: 'dollar', 0x25: 'percent', 0x26: 'ampersand',
    0x28: 'parenleft', 0x29: 'parenright', 0x2A: 'asterisk', 0x2B: 'plus',
    0x2D: 'hyphen', 0x2F: 'slash', 0x3D: 'equal', 0x40: 'at',
    0x5B: 'bracketleft', 0x5C: 'backslash', 0x5D: 'bracketright',
    0x5F: 'underscore', 0x7B: 'braceleft', 0x7C: 'bar', 0x7D: 'braceright',
    0xA3: 'sterling', 0x20AC: 'Euro', 0x2013: 'endash', 0x2014: 'emdash',
    0x2026: 'ellipsis', 0x2018: 'quoteleft', 0x2019: 'quoteright',
    0x201C: 'quotedblleft', 0x201D: 'quotedblright',
}


def setcmap(f, cp, gname):
    """Point a character at a glyph in every subtable that can hold it.
       The old Macintosh subtable only understands the first 256 codes, so
       writing a euro sign into it is what makes the whole file fail to save."""
    for t in f['cmap'].tables:
        if t.format == 0 and cp > 255:
            continue
        t.cmap[cp] = gname


def build(src, harvests, out):
    f = TTFont(src)
    glyf, hmtx, cmap = f['glyf'], f['hmtx'], f.getBestCmap()
    order = f.getGlyphOrder()
    added, replaced = [], []

    for d in harvests:
        idx = json.load(open(os.path.join(d, 'index.json')))
        for key in sorted(idx):
            m = idx[key]
            cp = ord(m['char'])
            gname = NAME.get(cp) or ('uni%04X' % cp)
            ppu, ox, oy = m['ppu'], m['ox'], m['oy']

            gray = np.asarray(Image.open(os.path.join(d, key + '.png')).convert('L'))
            h, w = gray.shape

            def xf(px, py, ppu=ppu, oy=oy):
                return (SIDE + px / ppu, oy - py / ppu)

            g, _ = TR.glyph_from_image(gray, xf, step=STEP)
            if g is None:
                print('  !! nothing traced for', gname); continue

            was = gname in order and cp in cmap and cmap[cp] == gname
            if gname not in order:
                f.setGlyphOrder(order + [gname]); order = f.getGlyphOrder()
            glyf[gname] = g
            adv = int(round(SIDE + w / ppu + SIDE))
            hmtx[gname] = (adv, SIDE)

            setcmap(f, cp, gname)
            (replaced if was else added).append((m['char'], gname, adv))

    # the two split quote pairs: a font that uses one shape for open and close
    # cannot show a corrected opening mark, so give each its own glyph
    for cp, gname in [(0x2019, 'quoteright'), (0x201C, 'quotedblleft')]:
        old = cmap.get(cp)
        if old and old not in ('quoteright', 'quotedblleft') and gname not in order:
            f.setGlyphOrder(f.getGlyphOrder() + [gname]); order = f.getGlyphOrder()
            glyf[gname] = glyf[old]
            hmtx[gname] = hmtx[old]
            setcmap(f, cp, gname)
            print('  kept the old shape as', gname, 'for U+%04X' % cp)

    f['maxp'].numGlyphs = len(f.getGlyphOrder())
    f['hmtx'].metrics = {k: v for k, v in hmtx.metrics.items() if k in set(f.getGlyphOrder())}
    f.save(out)
    return added, replaced


if __name__ == '__main__':
    *dirs, out = sys.argv[1:]
    src = os.path.join(os.path.dirname(HERE), 'common/fonts/shobhit-regal.ttf')
    if not os.path.exists(src):
        src = 'common/fonts/shobhit-regal.ttf'
    added, replaced = build(src, dirs, out)
    print('added   ', ' '.join('%s(%s)' % (c, n) for c, n, _ in added))
    print('replaced', ' '.join('%s(%s)' % (c, n) for c, n, _ in replaced))
    print('wrote', out, os.path.getsize(out), 'bytes')


