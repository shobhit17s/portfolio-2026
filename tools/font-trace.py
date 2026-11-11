"""PNG -> TrueType glyph outlines.

   ink  ->  contours  ->  corner detection  ->  quadratic outline
"""
import cv2, numpy as np
from fontTools.pens.ttGlyphPen import TTGlyphPen

def contours_from_image(img_gray, thresh=128):
    """Black ink on white. Returns (contours, hierarchy) in image coords."""
    _, bw = cv2.threshold(img_gray, thresh, 255, cv2.THRESH_BINARY_INV)
    cs, hier = cv2.findContours(bw, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    return cs, hier

def resample(pts, step):
    """Walk the closed contour, dropping a point every `step` pixels."""
    out, acc = [pts[0]], 0.0
    for i in range(1, len(pts) + 1):
        a, b = pts[i - 1], pts[i % len(pts)]
        d = float(np.hypot(*(b - a)))
        acc += d
        if acc >= step:
            out.append(b); acc = 0.0
    if len(out) > 2 and np.allclose(out[0], out[-1]):
        out.pop()
    return np.array(out, dtype=float)

def corner_flags(pts, angle_deg=62):
    """A point is a CORNER when the path turns hard there. Corners stay
       on-curve (crisp); everything else becomes off-curve, and TrueType's
       implied midpoints smooth the run into a curve."""
    n = len(pts)
    flags = np.zeros(n, dtype=bool)
    for i in range(n):
        a, b, c = pts[i - 1], pts[i], pts[(i + 1) % n]
        v1, v2 = b - a, c - b
        n1, n2 = np.linalg.norm(v1), np.linalg.norm(v2)
        if n1 < 1e-9 or n2 < 1e-9:
            flags[i] = True; continue
        cosang = float(np.clip(np.dot(v1, v2) / (n1 * n2), -1, 1))
        if np.degrees(np.arccos(cosang)) > angle_deg:
            flags[i] = True
    return flags

def signed_area(pts):
    x, y = pts[:, 0], pts[:, 1]
    return 0.5 * float(np.dot(x, np.roll(y, -1)) - np.dot(np.roll(x, -1), y))

def draw_contour(pen, pts, flags):
    """Emit one closed TrueType contour: on-curve points where flagged,
       off-curve (control) points everywhere else."""
    start = int(np.argmax(flags)) if flags.any() else 0
    order = list(range(start, len(pts))) + list(range(0, start))
    p0 = pts[order[0]]
    pen.moveTo((p0[0], p0[1]))
    i = 1
    while i < len(order):
        k = order[i]
        if flags[k]:
            pen.lineTo((pts[k][0], pts[k][1]))
            i += 1
        else:
            # run of control points; each pair implies an on-curve midpoint
            ctrls = []
            while i < len(order) and not flags[order[i]]:
                ctrls.append(pts[order[i]]); i += 1
            end = pts[order[i % len(order)]] if i < len(order) else pts[order[0]]
            for j, c in enumerate(ctrls):
                if j == len(ctrls) - 1:
                    pen.qCurveTo((c[0], c[1]), (end[0], end[1]))
                else:
                    mid = (c + ctrls[j + 1]) / 2.0
                    pen.qCurveTo((c[0], c[1]), (mid[0], mid[1]))
    pen.closePath()

def glyph_from_image(gray, transform, step=3.0, angle=62, thresh=128):
    """`transform` maps image (x, y) -> font units."""
    cs, hier = contours_from_image(gray, thresh)
    if hier is None: return None, None
    pen = TTGlyphPen(None)
    ink = []
    for idx, c in enumerate(cs):
        pts = c.reshape(-1, 2).astype(float)
        if len(pts) < 8 or cv2.contourArea(c) < 12: continue
        ink.append(pts)
        pts = resample(pts, step)
        if len(pts) < 4: continue
        fpts = np.array([transform(x, y) for x, y in pts])
        outer = hier[0][idx][3] == -1
        # font space is y-up: outer contours clockwise, holes anti-clockwise
        want_neg = outer
        if (signed_area(fpts) < 0) != want_neg:
            fpts = fpts[::-1]
        draw_contour(pen, fpts, corner_flags(fpts, angle))
    if not ink: return None, None
    allpts = np.vstack(ink)
    box = (allpts[:,0].min(), allpts[:,1].min(), allpts[:,0].max(), allpts[:,1].max())
    return pen.glyph(), box


