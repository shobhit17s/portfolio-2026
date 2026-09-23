# tools/

## password.mjs — the password on the private case studies

```bash
node tools/password.mjs "your password here"
```

It prints one line. Paste that over the `hash:` line in `common/access.js`.
That is the whole procedure — one password opens both private case studies,
and there is no build step and nothing to regenerate when content changes.

## What this protects, and what it does not

**It keeps casual visitors out. It does not hide anything from someone
determined to look.**

The case studies are ordinary files. A person who opens the browser's
developer tools can read `content.js` whether they know the password or not.
The password screen is a door with a sign on it, not a safe.

That is the right trade while these case studies hold stand-in content — it
costs nothing, it reads correctly to someone you sent a password to, and there
are no moving parts.

**It stops being the right trade the moment real client work goes in.** Two
ways to fix it then, easiest first:

1. **Host it somewhere that does passwords properly.** Vercel and Netlify both
   offer this as a setting rather than as code. The page never reaches a
   browser that has not authenticated, so there is nothing to find. This is the
   one to reach for.
2. **Encrypt the content**, so there is genuinely nothing there without the
   password. This project did that for a while and it worked — but every
   content change needed a rebuild step, and the encrypted file itself was
   flagged as a virus by Windows Defender. A recruiter meeting a malware
   warning is worse than the problem it solves.

The password is stored as a SHA-256 hash so it is not sitting in the source in
plain sight. That is tidiness, not security: what it guards is in the clear
regardless, and it would be dishonest to imply otherwise.

## Where the pieces are

| what | where |
| --- | --- |
| the password (hashed) | `common/access.js` |
| the password screen | `system/js/cs-gate.js` · `system/css/cs-gate.css` |
| which studies ask for it | the two private `index.html` files call `CS.Gate.ask()` |

`case-studies/analyst-primer/` does not call it — that is the open page behind
the pantheon, and it is meant to be readable by everyone.

## Adding characters to the drawn face

`Font_shobhit_regal_1` arrived with 66 glyphs: A–Z, a–z and a little
punctuation. Anything else on a heading falls back to Shantell Sans, one
character at a time, so a heading with one missing character is set in two
faces mid-word. The face now carries 94 glyphs; what is still missing is
listed at the foot of `common/type.css`.

Four scripts take a drawing all the way into the font. They run here, not on
Windows, and need opencv, numpy, fontTools, Pillow and scipy.

**`font-sheet.py`** builds the drawing sheets.

    python3 tools/font-sheet.py <outdir>

It reads the baseline, cap height, x-height and descender out of the font
itself and rules every box to match, so anything drawn between the lines comes
back the right size and on the right baseline — no scaling or aligning by eye
afterwards. Characters the font already has are printed as a pale ghost to
draw over. A row of existing letters at the same size sits at the foot of each
sheet, to match stroke weight against.

**`font-harvest.py`** reads a filled-in sheet back.

    python3 tools/font-harvest.py <filled-sheet.png> <sheet-number> <outdir>

It redraws the template at whatever size came back and subtracts it, so the
box, the guide lines, the labels and the ghosts all disappear and only ink is
left. Ink is judged twice: dark enough to be a stroke, and not markedly green
— a green stroke is a note, which is how a wrong ghost gets crossed off. Each
character is saved cropped tight, alongside the font coordinates of its own
top-left corner.

**`font-trace.py`** turns ink into outlines.

    ink → contours → corner detection → quadratic outlines → glyf table

Corners are found by how hard the path turns; those points stay on-curve and
crisp, and everything between them becomes off-curve, which lets TrueType's
implied midpoints do the smoothing. A round-trip test — render a real glyph,
trace it back, compare — is visually indistinguishable, wobble, broken strokes
and ink blobs included.

**`font-build.py`** puts them in the font.

    python3 tools/font-build.py <harvest-dir> [...] <out.ttf>

Sidebearings are the one thing a sheet cannot tell us, because a box has no
opinion about spacing. The existing letters are remarkably even — 55 units of
air either side, every one of them — so new characters get the same and fall
into the same rhythm.

**`brotli.py`** is not a tool but a stand-in: fontTools needs Brotli to write
woff2, the Python package will not install here, and Node ships one in its
standard library. It shells out to that.

### After a rebuild

The woff2 is written into `common/type.css` as a base64 line, not linked as a
file — see the long note at the top of that stylesheet for why. So a rebuilt
font is not live until that line is replaced:

```python
import base64
b64 = base64.b64encode(open('common/fonts/shobhit-regal.woff2','rb').read()).decode()
# replace the line beginning "  src: url(data:font/woff2" in common/type.css
```

Keep the list at the foot of `common/type.css` honest while you are there.


