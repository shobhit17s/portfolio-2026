"""font-sheet-blank.py — character sheets for a face that does not exist yet.

   `font-sheet.py` rules its guides by measuring an existing font and ghosts
   the characters that font already has. For a NEW face there is neither, so
   this one takes the measurements from a JSON file written by reading the
   metrics sheet, and ghosts nothing.

   WHY THE BOXES ARE THE SIZE THEY ARE, which is the whole point of this
   script. A pen does not shrink. The same nib drawn at paragraph size is
   nearly twice as heavy, relative to the letter, as it is drawn at heading
   size - measured on the metrics sheet at 0.27 of the x-height against 0.17.
   0.17 is where a reading face wants its stems; 0.27 closes the counters up
   and turns a paragraph into mud.

   So the cells are sized so that drawing a letter to fill its box puts the
   pen at the weight the large band was drawn at. Draw inside the lines and
   the weight comes out right on its own, with nobody having to think about
   it. That is the same bargain the guide lines make about height.

   Run:  python3 tools/font-sheet-blank.py <metrics.json> <outdir>
"""
import sys, os, json
from PIL import Image, ImageDraw, ImageFont

EM    = 640.0          # px per 1000 units - set so a filled box is drawn at
                       # the size the metrics sheet's LARGE band was drawn at
COLS  = 6
PAD   = 60
LABEL_H, HEAD, FOOT = 58, 46, 46
INK, LABEL, GUIDE, FAINT = 125, 150, 178, 212

DEJA = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
DEJB = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'

NAMES = {
 ' ': 'space', '!': 'exclam', '"': 'quotedbl', '#': 'numbersign',
 '$': 'dollar', '%': 'percent', '&': 'ampersand', "'": 'quotesingle',
 '(': 'parenleft', ')': 'parenright', '*': 'asterisk', '+': 'plus',
 ',': 'comma', '-': 'hyphen', '.': 'period', '/': 'slash',
 ':': 'colon', ';': 'semicolon', '<': 'less', '=': 'equal', '>': 'greater',
 '?': 'question', '@': 'at', '[': 'bracketleft', '\\': 'backslash',
 ']': 'bracketright', '^': 'asciicircum', '_': 'underscore',
 '`': 'grave', '{': 'braceleft', '|': 'bar', '}': 'braceright',
 '~': 'asciitilde', '£': 'sterling', '€': 'euro',
 '–': 'en dash', '—': 'em dash', '‘': 'open single',
 '’': 'close single', '‚': 'low single', '“': 'open double',
 '”': 'close double', '„': 'low double', '…': 'ellipsis',
}


def sheet(path, title, sub, chars, M, ref=None, ref_base=0):
    u = lambda v: v * EM / 1000.0
    cap, xh, desc = M['cap'], M['xh'], M['g_desc']

    CELL_W = int(EM * 1.02)
    CELL_H = int(LABEL_H + HEAD + u(cap + desc) + FOOT)
    BASE   = int(LABEL_H + HEAD + u(cap))          # baseline inside a cell

    rows = (len(chars) + COLS - 1) // COLS
    W = PAD * 2 + COLS * CELL_W
    TOP = 206
    # room at the foot for the reference strip: its caption, the whole
    # drawing (which hangs below its own baseline) and a margin
    FOOTER = (90 + ref.height + 70) if ref is not None else 0
    H = TOP + rows * CELL_H + PAD + FOOTER

    im = Image.new('L', (W, H), 255)
    d  = ImageDraw.Draw(im)
    T  = ImageFont.truetype(DEJB, 54)
    S  = ImageFont.truetype(DEJA, 30)
    L  = ImageFont.truetype(DEJA, 25)

    d.text((PAD, 56), title, font=T, fill=40)
    d.text((PAD, 126), sub,  font=S, fill=LABEL)

    for i, ch in enumerate(chars):
        r, c = divmod(i, COLS)
        x = PAD + c * CELL_W
        y = TOP + r * CELL_H
        d.rectangle([x, y, x + CELL_W - 2, y + CELL_H - 2], outline=FAINT, width=2)
        name = NAMES.get(ch, ch)
        d.text((x + 16, y + 14), name, font=L, fill=LABEL)

        b = y + BASE
        # the four guides. The baseline is the dark one; the rest are faint,
        # because they are advice and the baseline is not.
        d.line([x + 8, b, x + CELL_W - 10, b], fill=INK, width=4)
        for off, lab in ((cap, 'cap'), (xh, 'x'), (-desc, 'desc')):
            yy = b - u(off)
            d.line([x + 8, yy, x + CELL_W - 10, yy], fill=GUIDE, width=2)
            d.text((x + CELL_W - 72, yy - 30), lab, font=L, fill=GUIDE)

    if ref is not None:
        top = H - FOOTER + 90
        d.text((PAD, H - FOOTER + 14),
               'YOUR OWN HAND, from the metrics sheet, at this sheet\u2019s size. '
               'Match this stroke weight \u2014 it is what the box sizes are for.',
               font=S, fill=LABEL)
        # the strip's own baseline, so the ruled line runs through these
        # letters exactly as it does inside every cell above
        d.line([PAD, top + ref_base, W - PAD, top + ref_base], fill=INK, width=4)
        # PASTED THROUGH A MASK, so the ruled line shows between the letters.
        # Pasted flat, the strip's white background painted the line out and
        # the only part of it left was the inch sticking out at either end.
        mask = ref.point(lambda v: 255 if v < 160 else 0)
        im.paste(ref, (PAD + 20, top), mask)

    im.convert('RGB').save(path)
    return im.size


def reference(M, ink_npy='/tmp/claude-0/font/measure/ink.npy'):
    """The H O n o p g off the metrics sheet, scaled so its cap height is
    this sheet's cap height. Returns the image AND where its baseline sits
    inside it, so the caller can rule a line through it rather than guess.

    The first version returned a fudge instead of the baseline and pasted
    the strip by eye; it came out clipped off the bottom of the page."""
    import numpy as np
    if not os.path.exists(ink_npy):
        return None, 0
    ink = np.load(ink_npy)
    S = 1131 / 4404
    base = 1176 * S                      # the metrics sheet's first baseline
    UP, DOWN = 150, 90
    sub = ink[int(base - UP):int(base + DOWN), :]
    xs = np.where(sub.any(axis=0))[0]
    ys = np.where(sub.any(axis=1))[0]
    piece = sub[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    a = np.full(piece.shape + (3,), 255, np.uint8)
    a[piece] = [30, 30, 30]
    img = Image.fromarray(a).convert('L')
    k = (M['cap'] * EM / 1000.0) / 115.0         # 115px was the drawn cap
    img = img.resize((max(1, int(img.width * k)), max(1, int(img.height * k))),
                     Image.LANCZOS)
    # the baseline sat UP px below the crop window's top; the crop was then
    # trimmed by ys.min() and the whole thing scaled by k
    return img, int((UP - ys.min()) * k)


if __name__ == '__main__':
    M = json.load(open(sys.argv[1]))
    out = sys.argv[2]
    os.makedirs(out, exist_ok=True)
    ref, ref_base = reference(M)

    SHEETS = [
        ('sheet-1-capitals.png', 'SHEET 1 — CAPITALS',
         'All twenty-six. Fill the box: the cap line is where the letter stops.',
         'ABCDEFGHIJKLMNOPQRSTUVWXYZ'),
        ('sheet-2-lowercase.png', 'SHEET 2 — LOWERCASE',
         'All twenty-six. Sit on the baseline, stop at the x line, drop to the desc line.',
         'abcdefghijklmnopqrstuvwxyz'),
        ('sheet-3-numbers-and-punctuation.png',
         'SHEET 3 — NUMBERS AND EVERYDAY PUNCTUATION',
         'The digits sit between baseline and cap, like capitals.',
         '0123456789.,:;!?\'"‘’“”‚„…'),
        ('sheet-4-signs-and-brackets.png',
         'SHEET 4 — SIGNS, BRACKETS AND DASHES',
         'Brackets run from a little above the cap line to a little below the baseline.',
         '()[]{}&@#%*+-=/\\|_<>^~`$£€–—'),
    ]
    total = 0
    for fn, title, sub, chars in SHEETS:
        size = sheet(os.path.join(out, fn), title, sub, chars, M, ref, ref_base)
        total += len(chars)
        print('%-42s %s   %d boxes' % (fn, size, len(chars)))
    print('%d characters over %d sheets' % (total, len(SHEETS)))

