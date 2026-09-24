"""font-harvest.py — pull the drawn characters back off a filled-in sheet.

   HOW IT KNOWS WHAT IS YOURS AND WHAT IS MINE

   The sheet was generated here, so the same generator can redraw it at
   whatever size came back. That redraw is the template. Anything printed on
   the template - the box, the guide lines, the labels, the pale ghost of an
   existing letter - is mine, and is taken out.

   What is left is ink, and ink is judged twice:

     dark      the template's darkest mark is the baseline at grey 125, and
               the ghosts are 214, so a threshold at 150 keeps drawn strokes
               and drops everything printed.
     neutral   a stroke that is markedly green is a note, not a character -
               that is how a wrong ghost gets crossed off.

   The box's own position then does the rest: the solid line in each box IS
   font y=105, and the sheet was ruled at a known number of pixels per font
   unit, so a drawn character needs no scaling or aligning by eye.

   Run:  python3 tools/font-harvest.py <sheet.png> <sheet-key> <outdir>
"""
import sys, os, json
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import importlib.util
_spec = importlib.util.spec_from_file_location(
    'fontsheet', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'font-sheet.py'))
FS = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(FS)

INK_MAX = 150          # darker than this counts as a drawn stroke
GREEN   = 14           # green by this much above red and blue is a note


def load_flat(path):
    im = Image.open(path)
    if im.mode in ('RGBA', 'LA', 'P'):
        im = im.convert('RGBA')
        bg = Image.new('RGB', im.size, 'white')
        bg.paste(im, mask=im.split()[-1])
        im = bg
    return im.convert('RGB')


def harvest(sheet_png, items, outdir, template_png):
    up = load_flat(sheet_png)
    tm = Image.open(template_png).convert('L').resize(up.size, Image.LANCZOS)
    a = np.asarray(up).astype(int)
    t = np.asarray(tm).astype(int)
    R, G, B = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    mx = a.max(2)
    note = (G > R + GREEN) & (G > B + GREEN)
    ink = (mx < INK_MAX) & ~note

    # take out the printed furniture (baseline, labels, headings), grown a
    # little so its soft edge goes with it
    struct = t < 200
    from scipy.ndimage import binary_dilation, binary_closing
    struct = binary_dilation(struct, np.ones((5, 5), bool))
    ink = ink & ~struct
    # the baseline cut a gap through every stroke that sat on it - close it
    ink = binary_closing(ink, np.ones((13, 13), bool))

    s = up.size[0] / (FS.PAD * 2 + FS.COLS * FS.CELL_W)
    px_per_upem = (FS.EM / FS.UPEM) * s
    out = {}
    os.makedirs(outdir, exist_ok=True)
    report = []

    for i, (ch, nm) in enumerate(items):
        r, c = divmod(i, FS.COLS)
        x0 = (FS.PAD + c * FS.CELL_W) * s
        y0 = (FS.TOP + r * FS.CELL_H) * s
        x1, y1 = x0 + FS.CELL_W * s, y0 + FS.CELL_H * s
        baseY = y0 + FS.BASE_IN_CELL * s

        sub = ink[int(y0) + 4:int(y1) - 4, int(x0) + 4:int(x1) - 4]
        n = int(sub.sum())
        if n < 400:
            report.append((ch, nm, 0, None)); continue

        ys, xs = np.where(sub)
        # crop tight to the ink: the PNG's own top-left corner is then a point
        # we know the font coordinates of, which is what lets the glyph be
        # placed without measuring anything by eye
        crop = sub[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
        img = Image.fromarray(np.where(crop, 0, 255).astype('uint8'), 'L')
        key = 'U%04X' % ord(ch)
        img.save(os.path.join(outdir, key + '.png'))

        left = (int(x0) + 4 + xs.min())
        top = (int(y0) + 4 + ys.min())
        out[key] = {
            'char': ch, 'name': nm, 'px': n,
            # where the crop's top-left sits in font units
            'ox': (left - x0) / px_per_upem,          # from the cell's left edge
            'oy': 105 + (baseY - top) / px_per_upem,  # font y of the crop's top row
            'ppu': px_per_upem,
        }
        report.append((ch, nm, n,
                       (round(out[key]['oy'], 1),
                        round(out[key]['oy'] - crop.shape[0] / px_per_upem, 1))))

    json.dump(out, open(os.path.join(outdir, 'index.json'), 'w'), indent=1)
    return report


if __name__ == '__main__':
    sheet, key, outdir = sys.argv[1], sys.argv[2], sys.argv[3]
    from fontTools.ttLib import TTFont
    have = {chr(c) for c in TTFont(FS.FONT).getBestCmap()}
    SHEETS = {
        '3': FS.named('0123456789.,:;!?\'"‘’“”'),
        '4': FS.named('()&/-#…–—[]{}_\\|@%*+=$£€'),
    }
    items = SHEETS[key]
    tmpl = '/tmp/claude-0/font2/tmpl-%s.png' % key
    FS.build(tmpl, 'x', 'x', items, FS.FONT, have)
    for ch, nm, n, ext in harvest(sheet, items, outdir, tmpl):
        print('%-28s %-3s %8d  %s' % (nm, ch if n else '', n, ext or 'EMPTY'))


