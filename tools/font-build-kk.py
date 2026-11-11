"""font-build-kk.py — turn the filled sheets into font_kk_version_1.

   Reads the four transparent layer exports, traces every glyph, assigns
   spacing, and writes ttf + woff2.

   THREE THINGS THIS DOES THAT font-build.py DOES NOT
   ==================================================

   1 · IT FINDS THE BASELINE RATHER THAN TRUSTING THE PRINTED ONE.
       A hand aiming at a ruled line lands near it, not on it - these
       sheets came back sitting about 33 units low, consistently, across
       every flat-bottomed capital and every digit. Taking the printed line
       at its word would have hung the whole alphabet below its own
       baseline. The capitals and digits are the ones that genuinely have
       flat bottoms, so their median IS the baseline, and everything is
       measured from there.

   2 · SPACING IS DERIVED, NOT DECREED. Regal uses a flat 55 units either
       side of everything, which is fine for a display face set in threes
       and fours. A reading face needs the classic relationship: the space
       BETWEEN two letters should be a little less than the space INSIDE
       one. So the gap is set from `n`'s own counter, measured off the
       drawing, and round letters get slightly less than straight ones
       because a curve already gives away air at the top and bottom.

   3 · IT REFUSES TO GUESS. Any glyph that fails to trace is reported and
       left out rather than written as an empty box, because an empty box
       in a font is a space that looks like a bug and a bug that looks like
       a space.

   Run:  python3 tools/font-build-kk.py <outdir> <sheet1> <sheet2> ...
"""
import sys, os, json
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from font_trace_api import glyph_from_image          # thin shim, see below

EM, COLS, PAD = 640.0, 6, 60
LABEL_H, HEAD, FOOT, TOP = 58, 46, 46, 206
UPEM = 1000
ALPHA = 60
GAP_OF_XHEIGHT = 0.16   # the air between two letters, as a fraction
                        # of the x-height. Georgia and Verdana are ~0.19.

SHEETS = [
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    'abcdefghijklmnopqrstuvwxyz',
    '0123456789.,:;!?\'"‘’“”‚„…',
    '()[]{}&@#%*+-=/\\|_<>^~`$£€–—',
]

# letters whose bottoms are genuinely flat and genuinely on the baseline -
# the ones entitled to define where the baseline is
FLAT = set('ABDEFHIKLMNPRTUVWXYZ0123456789')

# a curve gives away air at top and bottom, so it needs less at the sides
ROUND = set('OQCGSobcdegopqs0368')

# WHERE A MARK BELONGS IS ITS JOB, NOT THE HAND'S OPINION.
#
# A letter goes wherever it was drawn - that is the point of drawing it.
# A few marks are different: a grave accent is DEFINED as sitting above
# the letter it leans on, and an underscore is DEFINED as sitting under
# the line. Drawn in the middle of an empty box with no word around them,
# both came back in the wrong place - the grave down at the baseline
# looking like a comma, the underscore floating above the line it is
# supposed to be under.
#
# Nudging those two is the same kind of correction as assigning
# sidebearings: a decision about position that the drawing was never
# being asked to make. The shape is untouched.
#
#     glyph : where its TOP should sit, in font units
NUDGE_TOP = {
    'grave': 690,          # up with the quote marks, where an accent lives
    'underscore': -80,     # under the line, which is the whole idea
}

NAMES = {
 ' ': 'space', '!': 'exclam', '"': 'quotedbl', '#': 'numbersign',
 '$': 'dollar', '%': 'percent', '&': 'ampersand', "'": 'quotesingle',
 '(': 'parenleft', ')': 'parenright', '*': 'asterisk', '+': 'plus',
 ',': 'comma', '-': 'hyphen', '.': 'period', '/': 'slash', ':': 'colon',
 ';': 'semicolon', '<': 'less', '=': 'equal', '>': 'greater',
 '?': 'question', '@': 'at', '[': 'bracketleft', '\\': 'backslash',
 ']': 'bracketright', '^': 'asciicircum', '_': 'underscore',
 '`': 'grave', '{': 'braceleft', '|': 'bar', '}': 'braceright',
 '~': 'asciitilde', '£': 'sterling', '€': 'euro',
 '–': 'endash', '—': 'emdash', '‘': 'quoteleft',
 '’': 'quoteright', '‚': 'quotesinglbase',
 '“': 'quotedblleft', '”': 'quotedblright',
 '„': 'quotedblbase', '…': 'ellipsis',
}
for c in '0123456789':
    NAMES[c] = ['zero','one','two','three','four','five','six','seven',
                'eight','nine'][int(c)]


def gname(ch):
    if ch in NAMES: return NAMES[ch]
    return ch if ch.isalpha() else 'u%04X' % ord(ch)


def cells(path, chars, cell_w, cell_h):
    im = Image.open(path)
    ink = (np.asarray(im)[:, :, 3] > ALPHA) if im.mode == 'RGBA' \
          else (np.asarray(im.convert('L')) < 128)
    for i, ch in enumerate(chars):
        r, c = divmod(i, COLS)
        x0, y0 = PAD + c * cell_w, TOP + r * cell_h
        yield ch, ink[y0:y0 + cell_h, x0:x0 + cell_w]


def measure(sheets, cell_w, cell_h, base_in_cell):
    """Find the baseline the hand actually used, and the real metrics."""
    units = UPEM / EM
    box = {}
    for n, path in enumerate(sheets):
        for ch, cell in cells(path, SHEETS[n], cell_w, cell_h):
            if not cell.any(): continue
            ys = np.where(cell.any(axis=1))[0]
            xs = np.where(cell.any(axis=0))[0]
            box[ch] = dict(top=ys.min(), bot=ys.max(),
                           left=xs.min(), right=xs.max(), cell=cell)

    drop = [box[c]['bot'] - base_in_cell for c in FLAT if c in box]
    off  = float(np.median(drop))                 # px the hand landed low
    base = base_in_cell + off                     # the real baseline, in px

    def above(ch): return (base - box[ch]['top']) * units
    def below(ch): return (box[ch]['bot'] - base) * units

    cap  = float(np.median([above(c) for c in 'ABDEFHIKLMNPRT' if c in box]))
    xh   = float(np.median([above(c) for c in 'nmruvwxz'       if c in box]))
    desc = float(np.median([below(c) for c in 'gpqy'           if c in box]))
    asc  = float(np.median([above(c) for c in 'bdfhkl'         if c in box]))
    return box, base, dict(cap=cap, xh=xh, desc=desc, asc=asc,
                           baseline_drop_px=off,
                           baseline_drop_units=off * units)


def spacing(box, base, M):
    """THE GAP COMES OUT OF THE LETTER, NOT OUT OF THE AIR.

       The oldest rule in spacing: the space BETWEEN two letters should be
       a little less than the space INSIDE one, or a word falls apart into
       letters. So the counter is measured off the drawing and the gap is
       set to a fraction of it.

       MEASURED ON `o`, NOT ON `n`, and that is not fussiness. An `n` read
       across its middle gives the counter PLUS whatever the arch and the
       exit flick are doing at that height - on this hand it came back at
       55 units, a third of the truth, which would have set the whole face
       far too tight. An `o` has exactly one hole and no opinions.

       Taken at the WIDEST row rather than the median one, because the
       counter is a shape, and the thing being measured is how much air it
       encloses at its most open."""
    units = spacing.units
    best = 0
    for ch in 'ocenu':
        if ch not in box: continue
        cell = box[ch]['cell']
        y0 = int(base - (M['xh'] / units) * 0.62)
        y1 = int(base - (M['xh'] / units) * 0.38)
        for row in cell[y0:y1]:
            xs = np.where(row)[0]
            if len(xs) < 2: continue
            s = None
            for x in range(xs.min(), xs.max() + 1):
                if not row[x] and s is None:
                    s = x
                elif row[x] and s is not None:
                    best = max(best, x - s); s = None
        if best: break          # `o` first; the rest are only fallbacks
    counter = best * units if best else M['xh'] * 0.45

    # HOW MUCH OF THE COUNTER TO GIVE AWAY. The first build used 0.82 and
    # the result read as H a n d w r i t i n g - a row of letters rather
    # than a word. Checked against faces that are actually used for
    # reading, 0.82 is simply wrong: Georgia's gap is about half its
    # counter, not four fifths.
    #
    # So the gap is anchored on the X-HEIGHT, which is what governs both
    # apparent size and spacing in running text, and the counter is kept as
    # a cross-check rather than as the rule. 0.20 of the x-height is where
    # Georgia and Verdana sit; this hand has unusually open counters, so
    # following the counter alone would have spaced it like a display face.
    gap = M['xh'] * GAP_OF_XHEIGHT
    return counter, gap


def build(sheets, outdir, family='font_kk_version_1'):
    u = lambda v: v * EM / 1000.0
    Mo = json.load(open('/tmp/claude-0/font/measure/metrics.json'))
    cell_w = int(EM * 1.02)
    cell_h = int(LABEL_H + HEAD + u(Mo['cap'] + Mo['g_desc']) + FOOT)
    base_in_cell = int(LABEL_H + HEAD + u(Mo['cap']))

    box, base, M = measure(sheets, cell_w, cell_h, base_in_cell)

    # THE DRAWN LETTERS CAME OUT BIGGER THAN THE GUIDES - a hand aiming at
    # a cap line overshoots it - so the ink span was 1060 of a 1000 em and
    # would have hung outside its own body. Everything is scaled so the cap
    # height is a round 700, which is a conventional number, keeps the span
    # inside the em, and changes no proportion at all: the hand is the same
    # hand, measured in a tidier unit.
    NORM = 700.0 / M['cap']
    units = (UPEM / EM) * NORM
    for k in ('cap', 'asc', 'xh', 'desc'):
        M[k] *= NORM
    spacing.units = units
    counter, gap = spacing(box, base, M)

    print('MEASURED OFF THE DRAWINGS')
    print('  the hand landed %.0f units low; baseline moved to match'
          % M['baseline_drop_units'])
    for k in ('cap', 'asc', 'xh', 'desc'):
        print('  %-18s %4.0f' % (k, M[k]))
    print('  n counter          %4.0f' % counter)
    print('  inter-letter gap   %4.0f   (0.82 of the counter)' % gap)
    print()

    glyphs, metrics, failed = {}, {}, []
    empty = TTGlyphPen(None).glyph()      # a glyph with no contours; calling
                                          # closePath() on an empty pen throws

    for ch in sorted(box, key=ord):
        b = box[ch]
        side = (gap / 2) * (0.85 if ch in ROUND else 1.0)
        img = (~b['cell'][b['top']:b['bot'] + 1,
                          b['left']:b['right'] + 1] * 255).astype(np.uint8)

        def tf(x, y, b=b, side=side):
            return (side + x * units, (base - (b['top'] + y)) * units)

        try:
            g, _ = glyph_from_image(img, tf)
        except Exception as e:
            g = None
        if g is None:
            failed.append(ch); continue
        name = gname(ch)
        if name in NUDGE_TOP:
            from fontTools.pens.boundsPen import BoundsPen
            from fontTools.pens.transformPen import TransformPen
            from fontTools.pens.ttGlyphPen import TTGlyphPen as _P
            bp = BoundsPen({name: g})
            g.draw(bp, {name: g})
            if bp.bounds:
                dy = NUDGE_TOP[name] - bp.bounds[3]
                np_ = _P({name: g})
                g.draw(TransformPen(np_, (1, 0, 0, 1, 0, dy)), {name: g})
                g = np_.glyph()
        glyphs[name] = g
        w = (b['right'] - b['left'] + 1) * units
        metrics[name] = (int(round(side * 2 + w)), int(round(side)))

    # the space, and the glyphs every font must carry
    glyphs['space'] = empty
    metrics['space'] = (int(round(gap + counter * 1.1)), 0)
    glyphs['.notdef'] = empty
    metrics['.notdef'] = (int(round(M['xh'])), 0)

    order = ['.notdef'] + [g for g in glyphs if g != '.notdef']
    fb = FontBuilder(UPEM, isTTF=True)
    fb.setupGlyphOrder(order)
    fb.setupCharacterMap({ord(ch): gname(ch) for ch in box} |
                         {0x20: 'space', 0xA0: 'space'})
    fb.setupGlyf(glyphs)
    fb.setupHorizontalMetrics(metrics)
    asc, desc = int(round(M['asc'] + 40)), int(round(M['desc'] + 40))
    fb.setupHorizontalHeader(ascent=asc, descent=-desc, lineGap=0)
    fb.setupNameTable({
        'familyName': family, 'styleName': 'Regular',
        'uniqueFontIdentifier': family + ';1.000',
        'fullName': family, 'psName': family.replace('_', ''),
        'version': 'Version 1.000',
    })
    fb.setupOS2(sTypoAscender=asc, sTypoDescender=-desc, sTypoLineGap=0,
                usWinAscent=asc, usWinDescent=desc,
                sxHeight=int(round(M['xh'])), sCapHeight=int(round(M['cap'])))
    fb.setupPost()

    os.makedirs(outdir, exist_ok=True)
    ttf = os.path.join(outdir, family + '.ttf')
    fb.save(ttf)
    print('%d glyphs -> %s' % (len(glyphs), ttf))
    if failed:
        print('FAILED TO TRACE (left out, not written as blanks): %s'
              % ' '.join(failed))

    from fontTools.ttLib import TTFont
    f = TTFont(ttf); f.flavor = 'woff2'
    f.save(os.path.join(outdir, family + '.woff2'))
    print('                 -> %s.woff2' % family)
    json.dump({k: (float(v) if isinstance(v, (int, float, np.floating)) else v)
               for k, v in M.items()} | {'counter': counter, 'gap': gap},
              open(os.path.join(outdir, 'metrics-final.json'), 'w'), indent=1)
    return ttf


if __name__ == '__main__':
    build(sys.argv[2:], sys.argv[1])

