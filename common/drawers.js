/* common/drawers.js — the panels that BOTH the landing page and the case
   studies can open.

   WHY THIS FILE EXISTS

   A drawer usually belongs to one case study: it explains something in that
   study's own story, and it lives in that study's content.js. But a few
   things are not any one study's - what an industry Subject Matter Expert
   actually does, for instance, is background that the landing page leans on
   as much as the case study does.

   Putting that text in two places would mean it drifts apart the first time
   it is edited. So it lives here, once, and two different drawers read it:

     the case study    system/js/cs-drawer.js  - slides in over the slides
     the landing page  js/hw-drawer.js         - slides in over the worlds

   Neither knows about the other. Both look in their own drawers first and
   fall back to this file, so a study can still override one of these by
   using the same name in its own `drawers` block.

   HOW TO WRITE ONE
       <name>: { title: '…', body: ['…', '…'], note: '…' }
   `body` is a list of paragraphs, written the same way every other line of
   copy on this site is - with entities like &mdash; spelled out. `note` is
   optional and is set small, under the text. */
window.SITE = window.SITE || {};

SITE.DRAWERS = {

  /* Opened from two places:
       - the words "industry Subject Matter Expert's (SME)" on slide 2 of
         the KIMs case study
       - the pantheon on the yellow planet, on the landing page */
  sme: {
    title: 'What an industry SME actually does',
    body: [
      'PLACEHOLDER &mdash; this is where the short explanation of the role goes, in your words. Two or three paragraphs is plenty: enough that a reader who has never met one can follow the rest of the case study.',
      'A subject matter expert holds the knowledge of an industry that does not live in any system: which numbers move together, which movements are ordinary and which are worth a phone call, and what a change in one industry means for the companies sitting downstream of it.',
      'The case study is about giving that judgement somewhere to stand &mdash; not replacing it.'
    ],
    note: 'Send me the real copy and this becomes it. The longer version of the same ground is the primer, "How an analyst typically works".'
  }
};


