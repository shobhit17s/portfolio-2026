# Final KIDs page — built prototype

This folder holds the **built output** of the Figma Make export
`final-prototype-slide-19.zip`. Three files, no dependencies:

```
index.html   the page
app.js       React + every component, bundled (~222 KB)   ← see the note below
app.css      every style the page uses (~12 KB)
```

It fills the `vid-19-final-kids-page` slot; the wiring is the `media` map at
the bottom of `case-studies/industry-dashboard/content.js`.

## `app.js` does not travel in the project zip

**Windows Defender flags it as a virus. It is a false positive, and a common
one.** A minified bundle is machine-generated, dense and unreadable — which is
also exactly what deliberately obfuscated malware looks like, so scanners
distrust the shape. This was confirmed by elimination: a zip of the whole
project minus this folder was clean, and this folder on its own was flagged.

Nothing is wrong with the file. But there is no reason to carry it around,
because **it is a build artifact, not source.** It is regenerated from the
Figma Make export in one command.

If you need it back:

1. Open the Figma Make export (`final-prototype-slide-19.zip`).
2. In `vite.config.ts`, set `base: './'`.
3. `npm install && npm run build`
4. Copy the three files out of `dist/` into this folder.

`../README.md` has the longer version of that, including why an unbuilt export
will not load.

The live site is unaffected either way — it serves `app.js` as an ordinary
script to a browser rather than as a file saved to disk, which is not what
download scanning inspects.

## How this build was made

Bundled with esbuild against React 19. The npm registry was unreachable from
the machine that built it, so Tailwind could not be installed; `app.css` was
generated instead by walking the source, collecting the 249 utility classes it
actually uses, and emitting the matching CSS. The result was checked against
the design frames in the export's `src/imports/` folder and matches them.

It is still a stand-in. A proper `npm run build` replaces all three files and
nothing else changes.

## Fonts

`app.css` pulls Inter and Source Serif 4 from Google Fonts, as the export did.
If those are blocked the page falls back to the system sans and serif.

