"""font-new-metrics.py — the first sheet for a face that does not exist yet.

   THE PROBLEM THIS SOLVES. `font-sheet.py` rules its guide lines by measuring
   an existing font - the baseline its letters sit on, their cap height, their
   x-height, how far the descenders drop. For a NEW face there is nothing to
   measure, and ruling the sheet from another font would quietly force the new
   hand into the old one's skeleton.

   So the first sheet carries ONE line and no others. A baseline, because a
   hand needs something to sit on. No cap line, no x-height, no descender
   line, because those four numbers are the thing we are trying to find out.

   WHY IT ASKS FOR WORDS AND NOT JUST LETTERS. A display face needs four
   heights. A READING face needs a fifth thing that isolated letters cannot
   show: rhythm - how much air this hand leaves either side of a letter, and
   whether it leaves the same amount after an `o` as after an `l`.

   Regal was built with a flat 55 units of air on both sides of every glyph.
   That is fine at 48px across three words of a heading. At 17px across a
   paragraph it is the difference between text you read and text you decode,
   because the eye reads the SHAPES BETWEEN letters as much as the letters.
   The words on this sheet are chosen to put every awkward pair in front of
   us - round beside round, upright beside upright, round beside upright.

   Run:  python3 tools/font-new-metrics.py <outdir> [face name]
"""
import sys, os
from PIL import Image, ImageDraw, ImageFont

W       = 4404          # the same width as the character sheets, so one
PAD     = 120           # Procreate canvas setting covers every sheet
INK     = 125           # the grey the harvester knows a printed line by
LABEL   = 150
FAINT   = 205

DEJA = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
DEJB = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'

# THE THREE BANDS, and what each one is for.
BANDS = [
    ('1  HEIGHTS',
     'Six letters, well apart, each sitting ON the line. Draw them the size '
     'you would naturally write a heading.',
     ['H  O  n  o  p  g'],
     560),
    ('2  RHYTHM',
     'The same hand, at the size you would write a PARAGRAPH - smaller. '
     'Do not space them out to be helpful; space them the way you space them.',
     ['handwriting', 'illumination', 'coffee  table'],
     300),
    ('3  READING',
     'One sentence, written straight through without stopping to tidy. '
     'This is the one I will set a real paragraph in to see if it reads.',
     ['Pack my box with', 'five dozen liquor jugs.'],
     300),
]


def main(outdir, face):
    os.makedirs(outdir, exist_ok=True)
    T  = ImageFont.truetype(DEJB, 54)
    S  = ImageFont.truetype(DEJA, 32)
    N  = ImageFont.truetype(DEJB, 38)
    G  = ImageFont.truetype(DEJA, 28)
    P  = ImageFont.truetype(DEJB, 34)

    # ---- lay it out first, so the image can be made the right height ----
    #
    # NOTHING IS PRINTED BELOW A BASELINE. The first version put the prompt
    # there, tucked under the line in small grey type - which is exactly the
    # space a `p` or a `g` needs, and a prompt sitting in the descender well
    # both invites you to avoid it and gets subtracted as furniture later.
    # Every baseline now has clear air under it; the prompt goes above, at
    # the left, where it reads as an instruction rather than as a caption.
    y, rows = PAD + 250, []
    for name, how, lines, band in BANDS:
        y += 100                                   # band title
        y += 90                                    # the how-to
        for text in lines:
            y += 56                                # the prompt
            rows.append((y + band, text))          # the baseline
            y += band + int(band * 0.45) + 60      # drawing + descender well
        y += 80
    H = y + PAD

    im = Image.new('L', (W, H), 255)
    d  = ImageDraw.Draw(im)

    d.rectangle([PAD // 2, PAD // 2, W - PAD // 2, H - PAD // 2],
                outline=FAINT, width=3)
    d.text((PAD, PAD - 10), 'METRICS SHEET  \u00b7  %s' % face, font=T, fill=40)
    for k, line in enumerate([
        'One line only, and it is the BASELINE. Sit every letter on it. There is deliberately no cap line, no x-height and no',
        'descender line - those are the four numbers this sheet exists to find out, and a ruled guide would decide them for you.',
        'Draw in BLACK, and leave the space under each line clear for descenders. Cross mistakes out in GREEN - anything',
        'markedly green is read as a note and thrown away, so a green scribble is how you tell me to ignore something.']):
        d.text((PAD, PAD + 76 + k * 44), line, font=S, fill=LABEL)

    y, i = PAD + 250, 0
    for name, how, lines, band in BANDS:
        d.text((PAD, y), name, font=N, fill=40); y += 100
        d.text((PAD, y), how, font=G, fill=LABEL); y += 90
        for text in lines:
            base, _ = rows[i]; i += 1
            d.text((PAD, y), 'write:   %s' % text, font=P, fill=90)
            y += 56
            d.line([PAD, base, W - PAD, base], fill=INK, width=4)
            # a tick at each end, so the line reads as a ruled baseline and
            # not as a box edge
            for x in (PAD, W - PAD):
                d.line([x, base - 26, x, base + 26], fill=INK, width=4)
            y += band + int(band * 0.45) + 60
        y += 80

    path = os.path.join(outdir, 'metrics-sheet.png')
    im.convert('RGB').save(path)
    print('%s   %s' % (path, im.size))
    for base, text in rows:
        print('   baseline y=%-5d  %s' % (base, text))
    return path


if __name__ == '__main__':
    out  = sys.argv[1] if len(sys.argv) > 1 else '.'
    face = sys.argv[2] if len(sys.argv) > 2 else 'font_kk_version_1'
    main(out, face)

