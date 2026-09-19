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
  /* THE PASSWORD SCREEN IS CURRENTLY OFF. Both case studies open straight
     away. Everything that runs it is still here and untouched — to switch it
     back on, put a hash back on this line:

       hash: '77d00ec61bd82e30b08ce9d807b31ba0b959c0f78b57aa27e7192019cf70a003',

     (that one is `drafting-fields-2026`), or make your own with
     `node tools/password.mjs "..."`. Then set `locked: true` on the two
     continents in js/hw-config.js so their pins show a keyhole again. */
  hash: null,

  /* The line shown under the heading on the password screen. */
  note: 'The work behind this page was done for a client, so it travels with ' +
        'a password. If you were sent one, it goes here.'
};

