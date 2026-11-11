"""font-sheet.py — build the drawing sheets for the display face.

   WHAT MAKES THESE SHEETS WORTH USING

   Every guide line on them is measured out of the font itself - the baseline
   the existing letters actually sit on, their cap height, their x-height,
   how far the descenders drop. So a character drawn between the lines comes
   back the right size and on the right baseline, and neither of us has to
   make a judgement about scale afterwards.

   Characters the font already has are printed into their box as a pale
   ghost. Draw over it, or ignore it and draw your own. It cannot end up in
   the font either way: the sheet is generated here, so the same sheet is
   subtracted from whatever comes back before anything is traced.

   Run:  python3 tools/font-sheet.py <outdir>
"""
import sys, os
from PIL import Image, ImageDraw, ImageFont

FONT = 'common/fonts/shobhit-regal.ttf'
UPEM, EM = 1000, 700.0
def u(v): return v * EM / UPEM

# measured off the font, once, and true for every sheet
BASE_U, CAP_U, XH_U, DESC_U = 105, 567, 468, -92

HEADROOM, FOOTROOM, LABEL_H = 50, 50, 58
CELL_W = int(EM * 1.02)
CELL_H = int(LABEL_H + HEADROOM + u(CAP_U - DESC_U) + FOOTROOM)
BASE_IN_CELL = int(LABEL_H + HEADROOM + u(CAP_U - BASE_U))
COLS, PAD, TOP = 6, 60, 206
GHOST = 214          # how pale the existing letter is printed

DEJA = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
DEJB = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'


def build(path, title, sub, items, font_path, have):
    L  = ImageFont.truetype(DEJA, 25)
    LS = ImageFont.truetype(DEJA, 19)
    HD = ImageFont.truetype(DEJB, 38)
    REF = ImageFont.truetype(font_path, int(EM))

    rows = (len(items) + COLS - 1) // COLS
    W = PAD * 2 + COLS * CELL_W
    foot = int(EM * 0.86)
    im = Image.new('L', (W, TOP + rows * CELL_H + 150 + foot), 255)
    d = ImageDraw.Draw(im)

    d.text((PAD, 48), title, font=HD, fill=0)
    d.text((PAD, 106), sub, font=L, fill=95)
    d.text((PAD, 146), 'One character per box, black, sitting on the SOLID line.  '
                       'Pale letters are what the font has already — draw over them or ignore '
                       'them; they are removed automatically.  Keep the boxes and the dashed '
                       'lines exactly where they are.', font=LS, fill=135)

    for i, (ch, nm) in enumerate(items):
        r, c = divmod(i, COLS)
        x0, y0 = PAD + c * CELL_W, TOP + r * CELL_H
        x1, y1 = x0 + CELL_W - 18, y0 + CELL_H - 18
        baseY = y0 + BASE_IN_CELL

        d.rectangle([x0, y0, x1, y1], outline=224, width=2)
        d.text((x0 + 11, y0 + 15), nm, font=L, fill=130)
        if ch not in have:
            d.text((x1 - 11, y0 + 15), 'NEW', font=LS, fill=190, anchor='ra')

        for val, lab in [(CAP_U, 'cap'), (XH_U, 'x'), (DESC_U, 'desc')]:
            yy = baseY - u(val - BASE_U)
            for xx in range(x0 + 8, x1 - 4, 20):
                d.line([(xx, yy), (xx + 9, yy)], fill=216, width=2)
            d.text((x1 - 9, yy - 20), lab, font=LS, fill=200, anchor='ra')
        d.line([(x0 + 8, baseY), (x1 - 4, baseY)], fill=125, width=3)

        # the existing drawing, pale, centred in the box
        if ch in have:
            g = Image.new('L', (int(CELL_W), int(CELL_H)), 255)
            gd = ImageDraw.Draw(g)
            gd.text((CELL_W / 2, BASE_IN_CELL + u(BASE_U)), ch, font=REF, fill=GHOST, anchor='ms')
            im.paste(Image.composite(g, im.crop((x0, y0, x0 + CELL_W, y0 + CELL_H)),
                                     g.point(lambda v: 255 if v < 250 else 0)), (x0, y0))

    y = TOP + rows * CELL_H + 54
    d.text((PAD, y), 'YOUR EXISTING LETTERS AT THIS EXACT SIZE — match the weight of your '
                     'strokes to these:', font=LS, fill=135)
    d.text((PAD, y + 76 + u(CAP_U)), 'HOxop', font=REF, fill=0, anchor='ls')
    im.save(path)
    return im.size


def named(chars, names=None):
    NAME = {
        '.': 'full stop', ',': 'comma', ':': 'colon', ';': 'semicolon',
        '!': 'exclamation', '?': 'question', "'": 'apostrophe', '"': 'quote',
        '‘': 'open single', '’': 'close single / apostrophe',
        '“': 'open double', '”': 'close double',
        '(': 'open bracket', ')': 'close bracket',
        '[': 'open square', ']': 'close square',
        '{': 'open brace', '}': 'close brace',
        '-': 'hyphen', '–': 'en dash', '—': 'em dash', '_': 'underscore',
        '/': 'slash', '\\': 'backslash', '|': 'pipe',
        '&': 'ampersand', '@': 'at', '#': 'hash', '%': 'per cent',
        '*': 'asterisk', '+': 'plus', '=': 'equals', '…': 'ellipsis',
        '$': 'dollar', '£': 'pound', '€': 'euro',
        '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four',
        '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine',
    }
    out = []
    for ch in chars:
        out.append((ch, NAME.get(ch, ('capital ' + ch) if ch.isupper() else ch)))
    return out


if __name__ == '__main__':
    outdir = sys.argv[1] if len(sys.argv) > 1 else '.'
    os.makedirs(outdir, exist_ok=True)
    from fontTools.ttLib import TTFont
    have = {chr(c) for c in TTFont(FONT).getBestCmap()}

    sheets = [
        ('sheet-1-capitals.png', 'SHEET 1 — CAPITALS',
         'All twenty-six. The pale letters are the ones already drawn.',
         named('ABCDEFGHIJKLMNOPQRSTUVWXYZ')),
        ('sheet-2-lowercase.png', 'SHEET 2 — LOWERCASE',
         'All twenty-six. The pale letters are the ones already drawn.',
         named('abcdefghijklmnopqrstuvwxyz')),
        ('sheet-3-numbers-and-punctuation.png', 'SHEET 3 — NUMBERS AND EVERYDAY PUNCTUATION',
         'The digits are all NEW — the font has none of them.',
         named('0123456789.,:;!?\'"‘’“”')),
        ('sheet-4-signs-and-brackets.png', 'SHEET 4 — SIGNS, DASHES AND BRACKETS',
         'Every one of these is NEW. The first six are the ones breaking headings today.',
         named('()&/-#…–—[]{}_\\|@%*+=$£€')),
    ]
    for fn, title, sub, items in sheets:
        size = build(os.path.join(outdir, fn), title, sub, items, FONT, have)
        newn = sum(1 for ch, _ in items if ch not in have)
        print('%-42s %s   %d boxes, %d new' % (fn, size, len(items), newn))


