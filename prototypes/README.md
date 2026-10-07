# Prototypes

Every prototype in the portfolio lives in this folder, under the case study it
belongs to:

```
prototypes/
  industry-dashboard/
    kids-page/
      index.html        ← a self-contained HTML prototype
      app.css
      app.js
    option-a.mp4        ← or just a recording
    option-a-poster.png
  <another-case-study>/
    …
```

Nothing outside this folder needs to change when you add one.

---

## How a picture slot works

Every picture, video and prototype on a case study is a **slot with a name**.
The slide says *where* the slot sits. A single map at the bottom of that case
study's `content.js` says *what fills it*. Nothing else in the project knows
or cares.

Leave a slot out of the map and it renders as the drawn, labelled placeholder
— the hatched box with the file name in it. That is the resting state, and it
is a perfectly good answer while you are still drawing.

**So replacing a placeholder with a real prototype is a change to one entry in
one file.** The slide does not move, the layout does not move, nothing around
it is touched.

---

## The five kinds

Open `case-studies/<study>/content.js` and find the `media` map at the bottom.

### 1. A Figma prototype

```js
'vid-19-final-kids-page': {
  kind: 'figma',
  src: 'https://www.figma.com/proto/<file-id>/<file-name>?node-id=1-2',
  ratio: '16 / 9',
  poster: 'assets/kids-page-poster.png',
  startLabel: 'Open the prototype'
}
```

Paste the ordinary Figma **share link** — the component wraps it into an embed
URL for you. An already-wrapped `figma.com/embed?…` URL works too.

### 2. A prototype you built yourself, hosted here

Put the files in `prototypes/<study>/<name>/`, then:

```js
'vid-19-final-kids-page': {
  kind: 'local',
  src: '../../prototypes/industry-dashboard/final-kids-page/index.html',
  ratio: '16 / 9',
  renderWidth: 1600
}
```

That is a real, working example — see
`prototypes/industry-dashboard/final-kids-page/`.

The path is relative to the case study's `index.html`, which sits two folders
deep — hence the `../../`.

### 3. A prototype hosted somewhere else

```js
'vid-18-prototype-option-b': {
  kind: 'external',
  src: 'https://example.com/my-prototype/',   // ← your real address here
  ratio: '16 / 10'
}
```

Anywhere it is hosted works — Vercel, Netlify, Figma's own publish, your own
server. (`example.com` is a reserved name used here as a stand-in; swap it for
the real one.)

### 4. A video or a GIF

```js
'vid-19-final-kids-page': {
  kind: 'video',
  src: '../../prototypes/industry-dashboard/final.mp4',
  poster: '../../prototypes/industry-dashboard/final-poster.png',
  ratio: '16 / 9',
  loop: true          // silent, looping, no controls — good for a short clip
}
```

A `.gif` works with the same `kind: 'video'`; it is recognised by its
extension and rendered as an image.

### 5. A still image

```js
'img-02-business-problem': { kind: 'image', src: 'assets/business-problem.png' }
```

---

## Every kind takes these

| key | what it does | default |
| --- | --- | --- |
| `ratio` | the shape the embed holds at any width | `16 / 9` |
| `note` | the line shown on the placeholder, and under a resting prototype | — |
| `poster` | a still shown before a prototype is started | — |
| `startLabel` | the words on the button that starts it | `Run the prototype` |
| `autoload` | `true` loads it immediately instead of waiting for a click | `false` |
| `title` | the iframe's accessible name | `Prototype: <slot>` |
| `renderWidth` | the screen width the prototype was drawn for | — |

**A note on `renderWidth`.** A dashboard drawn for a 1600px screen, squeezed
into a slot 800px wide, stops being the thing it is — the sidebar eats half of
it and the reader sees two cards instead of ten. Set `renderWidth: 1600` and
the frame is given exactly that width and then shrunk to fit, so the reader
sees the whole composition: small, but the real arrangement. Clicking and
hovering still land where they should. Leave it out for anything already built
to fill its frame.

Every running prototype also gets an **Open full size** button in its corner,
so a reader can use it properly rather than squinting at it. It opens the
prototype in an overlay that fills the window — deliberately *not* a new tab.
A prototype hosted alongside the portfolio can be refused by the browser when
asked to load as a page of its own (`ERR_BLOCKED_BY_RESPONSE`), and a reader
would get an error screen instead of the work. The overlay always works. Esc,
the Close button, or a click outside dismisses it.

**A note on `ratio`.** Leave it out and the embed fills whatever picture
area the slide template gave it — right for a still image, which was
cropped to fit anyway. Name a ratio and the embed keeps *that* shape
instead, sitting centred in the room it was given, letterboxed the way a
film is. Prototypes should almost always name one, so they are never
squashed to fit a slide.

---

## Why a prototype cannot break the portfolio

Anything that *runs* — Figma, local, external — is rendered inside an
`<iframe>`. An iframe is a separate document with its own stylesheet and its
own scripts. A prototype physically cannot reach the portfolio's CSS or
JavaScript, and the portfolio cannot reach into it. That is not a convention
anyone has to remember; it is the browser refusing.

The iframe is also sandboxed: a prototype may run its own scripts, open links
and submit its own forms, and nothing else.

**Nothing loads until asked.** A case study can hold several prototypes, and
several iframes would make the page heavy. Each one rests as its poster (or
its drawn placeholder) with a button, and the iframe is created on the first
click. Set `autoload: true` if you want one to load straight away.

---

## Writing a local prototype

It is an ordinary web page. Two things worth knowing:

1. **It is completely on its own.** It does not inherit the portfolio's type,
   colours or reset. If you want them, link `common/type.css` yourself.
2. **Build it to fill its frame**, not to a fixed size: `html, body { margin: 0;
   height: 100% }`. The slot decides how big it is; the prototype fills it.

A skeleton is in `prototypes/_template/`.

---

## If your prototype is a React / Vite project

Exports from Figma Make, Bolt, v0, Lovable and the like arrive looking like
this:

```
src/components/   src/imports/   src/App.tsx   src/main.tsx
index.html   package.json   tsconfig.json   vite.config.ts
```

**Do not copy that folder in. It will not load, and it is not your fault —
that is source code, not a website.** Three separate reasons:

1. **`.tsx` is not something a browser can run.** It is TypeScript with JSX
   inside it. A browser only understands plain JavaScript. Vite translates it
   while you develop; nothing translates it once it is sitting on a server.
2. **`import React from 'react'`** names a package, not a file. The bundler
   knows where `react` lives. A browser does not, and `node_modules` is not in
   that folder anyway.
3. **Vite's `index.html` points at `/src/main.tsx`** — a leading slash, meaning
   "from the top of the site". Inside a prototype folder that points at the
   wrong place entirely.

### The fix: build it first

```bash
cd <the exported project>
npm install
npm run build
```

Before you build, open `vite.config.ts` and set the base path to relative:

```ts
export default defineConfig({
  base: './',          // ← this line
  plugins: [react()],
})
```

Without `base: './'` the built page asks for `/assets/index-a1b2c3.js` — again
from the top of the site — and you get a blank screen with 404s in the
console. With it, the page asks for `./assets/…`, which works anywhere.

`npm run build` produces a **`dist/`** folder holding a real `index.html`, a
bundled `.js` and a `.css`. Copy the *contents* of `dist/` into
`prototypes/<study>/<name>/`, then point the slot at it as a `local` kind:

```js
'vid-17-prototype-option-a': {
  kind: 'local',
  src: '../../prototypes/industry-dashboard/<name>/index.html',
  ratio: '16 / 9'
}
```

Rebuild and re-copy whenever the prototype changes. The case study never
changes.

### How to tell this is what went wrong

Open the hosted page, start the prototype, then open the browser console
inside the frame. A blank white frame with `Failed to load module script` or
a 404 on a `.tsx` file means the project was copied in unbuilt.

---

## A built bundle can be flagged as a virus

`prototypes/industry-dashboard/final-kids-page/app.js` is a 222 KB minified
React bundle, and **Windows Defender flags it.** It is a false positive and a
well-known one: a minified bundle is machine-generated, dense and unreadable,
which is also what deliberately obfuscated malware looks like.

So it is left out of the project zip. It is a **build artifact, not source** —
one `npm run build` from the Figma Make export puts it back, and that folder's
own README says how.

Worth remembering for any future prototype: keep the export, ship the source,
build at the other end. A `dist/` folder is not something to carry around.

The live site is unaffected. It serves the bundle as an ordinary script to a
browser rather than as a file saved to disk, which is not what download
scanning inspects.

---

## A prototype inside a private case study

Nothing special is needed. The case studies behind the password screen load
their prototypes exactly like any other — as a `local` kind pointing at a file
in this folder. The password screen sits in front of the page; it does not
change how anything inside it loads.

Worth knowing, since the README used to say otherwise: this project briefly
encrypted the prototype along with the case study. That was dropped. It made
every prototype change need a rebuild step, and the encrypted file was flagged
as a virus by Windows Defender. `tools/README.md` explains what the password
screen is and is not.

