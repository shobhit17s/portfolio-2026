/* access.js — the password for the private case studies.

   ONE password opens all of them. To change it:

       node tools/password.mjs "your new password"

   and paste the line it prints over the one below.

   What this does and does not do is explained at the top of
   system/js/cs-gate.js, and it is worth reading before you put real client
   work behind it. The short version: this keeps casual visitors out. It does
   not hide the case study from anyone who opens the browser's developer
   tools, because the content is an ordinary file like any other. That is a
   fair trade while the case studies hold stand-in content, and not a fair one
   afterwards. */
window.CS = window.CS || {};

CS.ACCESS = {
  /* THE PASSWORD SCREEN IS ON. The hash below is `drafting-fields-2026`.
     To change it, run

         node tools/password.mjs "your new password"

     and paste the line it prints over this one. To turn the screen off
     again, put `hash: null` here - and unset `locked: true` on the two
     case-study moons in js/hw-config.js, or their pins keep showing a
     keyhole for a door that is no longer shut.

     One password opens both private studies. The primer - "How an analyst
     typically works", the pantheon on the yellow planet - is deliberately
     NOT behind it: it is shared background rather than client work, and it
     is what the pantheon and the SME drawer both lean on. */
  hash: '77d00ec61bd82e30b08ce9d807b31ba0b959c0f78b57aa27e7192019cf70a003',

  /* The line shown under the heading on the password screen. */
  note: 'The work behind this page was done for a client, so it travels with ' +
        'a password. If you were sent one, it goes here.'
};


