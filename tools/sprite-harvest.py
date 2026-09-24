"""sprite-harvest.py — lift a drawn sprite off a returned drawing sheet.

   TWO WAYS IN, AND THE FIRST ONE IS BETTER

   LAYER MODE. If the returned sheet is a PNG with real transparency - your
   drawing layer alone, exported at the sheet's own size with the printed
   sheet hidden - then there is nothing to work out. The transparency IS the
   answer: every pixel you painted is opaque, everything else is not. No
   subtraction, no thresholds, no chance of the ghost coming along. Send the
   sheets back this way whenever you can.

   SUBTRACTION MODE, for a flattened sheet. Described below. It works, but it
   has to guess at the edges, and a drawing painted thinly over the ghost can
   drag some of the ghost with it.

   THE SAME TRICK AS THE FONT SHEETS

   The sheet was generated here, so the generator can redraw it byte for byte
   and that redraw is the template. Everything printed on it - the box, the
   guide lines, the labels, the pale ghost of the sprite being replaced, the
   traveller standing to scale - is mine, and cancels out. What survives the
   subtraction is ink.

   The subtraction has to survive a round trip through an image pipeline that
   may re-encode the picture, so it is done in two passes:

     CORE    pixels that differ from the template by a lot. Re-encoding never
             moves a pixel this far, so anything here is certainly a stroke.
     EDGE    pixels that differ only a little, but are CONNECTED to a core.
             That recovers the soft edge of every stroke without letting a
             field of compression speckle in.

   Then the holes are filled, so a white highlight drawn inside a shape stays
   white instead of becoming a hole punched through it.

   THE BOTTOM EDGE IS THE GROUND LINE, not the lowest ink. The engine stands
   a sprite on the bottom edge of its file, so cropping at the ink would make
   anything drawn a little past the line hover above the planet instead.

   Run:  python3 tools/sprite-harvest.py <returned-sheet.png> <sheet-key> <outdir>
"""
import sys, os, json
import numpy as np
from PIL import Image
from scipy.ndimage import binary_fill_holes, binary_closing, binary_dilation, label

CORE, EDGE = 95, 40        # how far from the template a pixel has to be
# where the generated sheet and its box map live; regenerate with
#   node tools/sheet-gen.js <dir>
SHEETS = os.environ.get('SHEET_DIR', '/tmp/claude-0/sheets3')
BOXES = SHEETS + '/boxes-%s.json'
TMPL  = SHEETS + '/sheet-%s.png'


def layer_mask(path, size):
    """If the file is a real drawing layer, return its own transparency."""
    im = Image.open(path)
    if im.mode not in ('RGBA', 'LA'):
        return None
    if im.size != size:
        im = im.resize(size, Image.LANCZOS)
    im = im.convert('RGBA')
    a = np.asarray(im)[:, :, 3]
    # A flattened screenshot saved as RGBA has an alpha channel that is
    # opaque everywhere. A drawing layer is mostly empty.
    if (a < 8).mean() < 0.30:
        return None
    return np.asarray(im).astype(int)


def flat(path):
    im = Image.open(path)
    if im.mode in ('RGBA', 'LA', 'P'):
        im = im.convert('RGBA')
        bg = Image.new('RGB', im.size, 'white')
        bg.paste(im, mask=im.split()[-1])
        return bg
    return im.convert('RGB')


def fill_pinholes(mask, maxarea):
    """Close the specks a soft pen leaves inside a stroke - and ONLY those.

       Filling every enclosed region would be wrong: the gaps between a
       pine's branches are enclosed too, and they are meant to be holes you
       can see the planet through. So a region is filled only if it is small."""
    lab, n = label(~mask)
    if n == 0:
        return mask
    out = mask.copy()
    sizes = np.bincount(lab.ravel())
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])))
    for i in range(1, n + 1):
        if i in border or sizes[i] > maxarea:
            continue
        out[lab == i] = True
    return out


def grow(core, soft):
    """Everything in `soft` that can be reached from `core`."""
    lab, n = label(soft)
    keep = np.unique(lab[core & (lab > 0)])
    return np.isin(lab, keep[keep > 0])


def harvest(sheet_png, key, outdir):
    up = flat(sheet_png)
    tm = Image.open(TMPL % key).convert('RGB')
    if up.size != tm.size:
        up = up.resize(tm.size, Image.LANCZOS)
    u = np.asarray(up).astype(int)
    t = np.asarray(tm).astype(int)
    diff = np.abs(u - t).max(2)

    layer = layer_mask(sheet_png, tm.size)
    if layer is not None:
        print('   (layer mode - using your own transparency)')
        u = layer[:, :, :3]
        diff = np.where(layer[:, :, 3] > 8, 255, 0)

    # In subtraction mode the template is entirely grey inside a box, and your
    # ink is not. Requiring colour at the soft edges is what stops the ghost
    # being dragged in: a re-encoded picture wobbles every pixel a little, and
    # a wobbling ghost pixel next to a real stroke would otherwise be adopted.
    coloured = (u.max(2) - u.min(2)) > 22 if layer is None else np.ones(diff.shape, bool)

    os.makedirs(outdir, exist_ok=True)
    out = []
    for b in json.load(open(BOXES % key)):
        a = b['art']
        x0, y0 = int(a['x']), int(a['y'])
        x1 = int(a['x'] + a['w'])
        gy = int(round(b['ground']['y']))            # the bottom edge
        d = diff[y0:gy, x0:x1]
        core = d > CORE
        if core.sum() < 800:
            out.append((b['name'], 0)); continue

        m = grow(core, (d > EDGE) & coloured[y0:gy, x0:x1])
        m = binary_closing(m, np.ones((5, 5), bool))
        m = fill_pinholes(m, 600)

        ys, xs = np.where(m)
        cx0, cx1 = xs.min(), xs.max() + 1
        cy0 = ys.min()                                # top from the ink...
        crop = m[cy0:, cx0:cx1]                       # ...bottom from the line
        rgb = u[y0 + cy0:gy, x0 + cx0:x0 + cx1]

        # A soft edge. Inside a stroke the difference from the blank sheet is
        # large, so this is 1; it only ramps down over the couple of pixels
        # the pen itself faded over. No floor: a floor would paint a ghost of
        # the white paper around everything.
        soft = np.clip((d[cy0:, cx0:cx1] - 25) / 25.0, 0, 1)
        px = np.dstack([rgb, (np.where(crop, soft, 0) * 255).astype(int)]).astype('uint8')
        img = Image.fromarray(px, 'RGBA')
        img.save(os.path.join(outdir, b['name'] + '.png'))
        out.append((b['name'], int(m.sum()), img.size))
    return out


if __name__ == '__main__':
    sheet, key, outdir = sys.argv[1], sys.argv[2], sys.argv[3]
    for r in harvest(sheet, key, outdir):
        print(r[0].ljust(20), 'nothing drawn' if r[1] == 0 else '%7d px  %s' % r[1:])


