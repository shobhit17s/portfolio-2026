"""contrast-derive.py — work out the readable strengths of each palette colour.

       python3 tools/contrast-derive.py

   WHAT IT IS FOR

   The palette in system/css/cs-tokens.css carries each colour at three
   strengths: the colour itself, a version levelled for large text and drawn
   lines, and a version levelled for text at reading size. This is what works
   those out. Change a background, add a seventh accent, swap fire for
   something else - run this, and paste the block it prints.

   HOW IT DOES IT

   Lightness only. The colour is converted to OKLab, which separates how
   light something is from what colour it is, and only the lightness is
   moved - as little as it takes to clear the ratio against the WORST of the
   three backgrounds in that mode. Hue and chroma are left exactly where the
   spec sheet put them, so what comes out is recognisably the same colour,
   not a different one that happens to pass.

   Working in OKLab rather than straight RGB matters: darkening in RGB
   desaturates as it goes, and an accent that has been quietly drained of its
   colour on the way to being readable is not the accent any more.

   THE TARGETS carry a little headroom above the standard's 3.0 and 4.5,
   because a browser's own rounding can move the last hundredth and a value
   that passes at exactly 3.00 is a value that fails somewhere.
"""
TARGET_GRAPHIC = 3.2     # standard says 3.0 - large text, borders, marks
TARGET_TEXT    = 4.7     # standard says 4.5 - text at reading size

PALETTE = {
    'moon':   '#E4E4A6',
    'sun':    '#E49204',
    'fire':   '#D3644A',
    'water':  '#3A768B',
    'forest': '#849E59',
    'stone':  '#8A92A0',
    'mist':   '#8F4471',
}
BACKGROUNDS = {
    'dark':  ['#0A0D0A', '#0D1B18', '#18241F'],
    'light': ['#FCF9D9', '#E3EDCF', '#CBE2CA'],
}


def srgb_lin(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def lin_srgb(c):
    c = max(0.0, min(1.0, c))
    return 12.92 * c if c <= 0.0031308 else 1.055 * (c ** (1 / 2.4)) - 0.055


def hex2rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


def rgb2hex(r):
    return '#%02X%02X%02X' % tuple(round(max(0, min(1, c)) * 255) for c in r)


def rgb2oklab(rgb):
    r, g, b = [srgb_lin(c) for c in rgb]
    l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
    m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
    s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b
    l_, m_, s_ = l ** (1 / 3), m ** (1 / 3), s ** (1 / 3)
    return (0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
            1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
            0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_)


def oklab2rgb(lab):
    L, a, b = lab
    l_ = L + 0.3963377774 * a + 0.2158037573 * b
    m_ = L - 0.1055613458 * a - 0.0638541728 * b
    s_ = L - 0.0894841775 * a - 1.2914855480 * b
    l, m, s = l_ ** 3, m_ ** 3, s_ ** 3
    return tuple(lin_srgb(c) for c in (
        4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
        -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
        -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s))


def lum(rgb):
    r, g, b = [srgb_lin(c) for c in rgb]
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def ratio(a, b):
    x, y = lum(a), lum(b)
    hi, lo = max(x, y), min(x, y)
    return (hi + 0.05) / (lo + 0.05)


def level(hexc, bgs, darken, target):
    """The nearest version of this colour, by lightness alone, that clears
       `target` against every one of `bgs`. None if no such colour exists."""
    L0, a, b = rgb2oklab(hex2rgb(hexc))
    lo, hi = (0.0, L0) if darken else (L0, 1.0)
    best = None
    for i in range(800):
        L = lo + (hi - lo) * (i / 799)
        rgb = oklab2rgb((L, a, b))
        if any(c < -0.002 or c > 1.002 for c in rgb):
            continue
        if min(ratio(rgb, hex2rgb(bg)) for bg in bgs) >= target:
            best = rgb
            if not darken:          # lightening: the first one that passes
                break               # darkening: keep going for the lightest
    if best is None:
        return None
    return rgb2hex(best), round(min(ratio(best, hex2rgb(bg)) for bg in bgs), 2)


def on_fill(fill_hex, extremes):
    """What to WRITE on a fill of this colour: whichever of the page's two
       extremes reads better on it."""
    best = max(extremes, key=lambda e: ratio(hex2rgb(e), hex2rgb(fill_hex)))
    return best, round(ratio(hex2rgb(best), hex2rgb(fill_hex)), 2)


for mode, bgs in BACKGROUNDS.items():
    darken = (mode == 'light')
    extremes = [BACKGROUNDS['dark'][0], BACKGROUNDS['light'][0]]
    print('/* ---- %s mode ---- */' % mode)
    for name, raw in PALETTE.items():
        g = level(raw, bgs, darken, TARGET_GRAPHIC)
        t = level(raw, bgs, darken, TARGET_TEXT)
        if not g or not t:
            print('  /* %-7s CANNOT be levelled to pass - pick another */' % name)
            continue
        same_g = 'var(--cs-%s)' % name if g[0] == raw.upper() else g[0]
        o = on_fill(g[0], extremes)
        print('  --cs-%s-on-bg: %-22s --cs-%s-ink: %-9s  /* %.2f / %.2f, words on it: %s %.2f */'
              % (name, same_g + ';', name, t[0] + ';', g[1], t[1], o[0], o[1]))
    print('')


