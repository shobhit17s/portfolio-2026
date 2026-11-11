/* password.mjs — set the password for the private case studies.

     node tools/password.mjs "your password here"

   Prints the line to paste into common/access.js. The password is stored as a
   SHA-256 hash so it is not sitting in the source in plain sight; that is
   tidiness rather than security, and system/js/cs-gate.js explains why. */
import { webcrypto as crypto } from 'node:crypto';

const pw = process.argv[2];
if (!pw) {
  console.error('usage: node tools/password.mjs "your password here"');
  process.exit(1);
}

const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw));
const hash = [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');

console.log('\nPaste this into common/access.js:\n');
console.log("  hash: '" + hash + "',\n");
