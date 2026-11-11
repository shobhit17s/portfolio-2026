"""font-harvest-blank.py — read filled sheets made by font-sheet-blank.py.

   WHY THIS IS NOT font-harvest.py. That one is built around the geometry of
   the Regal sheets and, because those were photographed with the printed
   furniture showing, it spends most of its effort subtracting the template
   back out and deciding what is ink and what is a ruled line.

   These sheets came back as TRANSPARENT LAYER EXPORTS at exactly the size
   they were generated - the furniture layer simply hidden. So there is
   nothing to subtract and nothing to disentangle: every opaque pixel is
   ink. That makes this the easy case, and the one worth asking for.

   WHAT THE GRID BUYS US. Because the export is pixel-identical to the
   sheet, every cell is where the generator put it, and so is every
   baseline. A glyph's vertical position is therefore not estimated from
   the drawing - it is read off the sheet geometry, which is the whole
   reason the sheets were ruled in the first place.

   Run:  python3 tools/font-harvest-blank.py <metrics.json> <outdir> \\
            <sheet-1.png> <sheet-2.png> ...
"""
import sys, os, json
import numpy as np
from PIL import Image

EM, COLS, PAD = 640.0, 6, 60
LABEL_H, HEAD, FOOT, TOP = 58, 46, 46, 206
ALPHA = 60          # a pixel counts as ink above this opacity

SHEET_CHARS = [
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    'abcdefghijklmnopqrstuvwxyz',
    '0123456789.,:;!?\'"‘’“”‚„…',
    '()[]{}&@#%*+-=/\\|_<>^~`$£€–—',
]

NAMES = {
 '!': 'exclam', '"': 'quotedbl', '#': 'numbersign', '$': 'dollar',
 '%': 'percent', '&': 'ampersand', "'": 'quotesingle', '(': 'parenleft',
 ')': 'parenright', '*': 'asterisk', '+': 'plus', ',': 'comma',
 '-': 'hyphen', '.': 'period', '/': 'slash', ':': 'colon', ';': 'semicolon',
 '<': 'less', '=': 'equal', '>': 'greater', '?': 'question', '@': 'at',
 '[': 'bracketleft', '\\': 'backslash', ']': 'bracketright',
 '^': 'asciicircum', '_': 'underscore', '`': 'grave', '{': 'braceleft',
 '|': 'bar', '}': 'braceright', '~': 'asciitilde',
 '£': 'sterling', '€': 'euro', '–': 'endash',
 '—': 'emdash', '‘': 'quoteleft', '’': 'quoteright',
 '‚': 'quotesinglbase', '“': 'quotedblleft',
 '”': 'quotedblright', '„': 'quotedblbase', '…': 'ellipsis',
}


def geometry(M):
    u = lambda v: v * EM / 1000.0
    cell_w = int(EM * 1.02)
    cell_h = int(LABEL_H + HEAD + u(M['cap'] + M['g_desc']) + FOOT)
    base   = int(LABEL_H + HEAD + u(M['cap']))
    return cell_w, cell_h, base, u


def ink_of(path):
    im = Image.open(path)
    if im.mode == 'RGBA':
        a = np.asarray(im)[:, :, 3]
        return a > ALPHA, 'layer export (transparent)'
    g = np.asarray(im.convert('L'))
    return g < 128, 'flattened (thresholded)'


def harvest(path, chars, M, outdir, sheet_no):
    ink, kind = ink_of(path)
    cell_w, cell_h, base_in_cell, u = geometry(M)
    units = 1000.0 / EM                      # px -> font units
    got, empty = [], []

    for i, ch in enumerate(chars):
        r, c = divmod(i, COLS)
        x0, y0 = PAD + c * cell_w, TOP + r * cell_h
        cell = ink[y0:y0 + cell_h, x0:x0 + cell_w]
        if not cell.any():
            empty.append(ch); continue
        ys = np.where(cell.any(axis=1))[0]
        xs = np.where(cell.any(axis=0))[0]
        top, bot, left, right = ys.min(), ys.max(), xs.min(), xs.max()

        glyph = cell[top:bot + 1, left:right + 1]
        name = NAMES.get(ch, ch if ch.isalnum() else 'u%04X' % ord(ch))
        if ch.isupper(): name = 'cap_' + ch
        out = os.path.join(outdir, '%s.png' % name)
        a = np.full(glyph.shape + (4,), 0, np.uint8)
        a[glyph] = [20, 20, 20, 255]
        Image.fromarray(a, 'RGBA').save(out)

        got.append(dict(
            char=ch, name=name, file=os.path.basename(out),
            # where the glyph sits in FONT UNITS, measured off the sheet's
            # own baseline rather than guessed from the drawing
            left=round((left - 0) * units),
            top_above_base=round((base_in_cell - top) * units),
            bottom_below_base=round((bot - base_in_cell) * units),
            width=round(glyph.shape[1] * units),
            height=round(glyph.shape[0] * units)))

    return got, empty, kind


if __name__ == '__main__':
    M = json.load(open(sys.argv[1]))
    outdir = sys.argv[2]
    os.makedirs(outdir, exist_ok=True)
    allgot, index = [], {}
    for n, path in enumerate(sys.argv[3:]):
        chars = SHEET_CHARS[n]
        got, empty, kind = harvest(path, chars, M, outdir, n + 1)
        print('sheet %d  %-28s  %s' % (n + 1, kind, os.path.basename(path)))
        print('         %d of %d drawn%s'
              % (len(got), len(chars),
                 ('   MISSING: ' + ' '.join(empty)) if empty else ''))
        allgot += got
    for g in allgot:
        index[g['char']] = g
    json.dump(index, open(os.path.join(outdir, 'index.json'), 'w'),
              indent=1, ensure_ascii=False)
    print('\n%d glyphs harvested -> %s' % (len(allgot), outdir))

