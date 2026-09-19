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

