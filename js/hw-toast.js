/* ============================================================================
   hw-toast.js — copying an address, and the small note that says you did.

   WHY THE EMAIL COPIES RATHER THAN OPENING A MAIL PROGRAM.

   The ordinary way to put an email address on a page is a `mailto:` link,
   and it has a failure that is invisible to whoever built the page. It hands
   the address to whatever the machine has been told is its mail program -
   which on a great many machines is nothing at all, or is something the
   person has never signed in to. The press then appears to do nothing, or it
   opens a window they immediately close, and the address itself is never
   seen. They came to write to you and they leave without the address.

   Copying cannot fail in that way. The address goes on the clipboard, the
   page says so, and they paste it wherever they actually write mail.

   ---------------------------------------------------------------------------
   WHAT THE BROWSER ALLOWS, AND WHY THERE IS A SECOND WAY OF DOING IT
   ---------------------------------------------------------------------------
   The modern clipboard is deliberately fenced off. A page that could write
   to your clipboard whenever it liked could quietly replace a bank account
   number you had copied a moment earlier, which is a real attack and not a
   hypothetical one. So browsers only hand it over under conditions:

       * the page must be on https, or on localhost
       * the write must happen because somebody pressed something
       * the tab must be the one in front

   OURS MEETS ALL THREE. But a page opened straight off the disk - the way
   you have been opening this one, as a file:// address - is NOT on https,
   and there the modern clipboard is refused outright. That is not something
   to fix in the code; it is the browser being careful, and it goes away the
   day the site is on a real address.

   So there is an older way underneath: put the text in a box nobody can see,
   select it, and ask the browser to copy the selection. It is the method
   every page used before the modern one existed, it works from a file on
   disk, and it is what runs when the first way is refused.

   AND IF BOTH ARE REFUSED, the note says so and shows the address instead,
   so it can still be read off the screen and typed. Nothing silently fails.
   ========================================================================= */
window.HW = window.HW || {};
(function (HW) {
  'use strict';

  var holder = null, timer = null;

  function node() {
    if (holder) return holder;
    holder = document.createElement('div');
    holder.id = 'hw-toast';
    holder.setAttribute('role', 'status');      // read out, without stealing focus
    holder.setAttribute('aria-live', 'polite');
    document.body.appendChild(holder);
    return holder;
  }

  /* THE NOTE. It says one thing and goes. `role="status"` is what tells a
     screen reader to read it without moving the keyboard anywhere - the
     press has already happened, and dragging focus to a message about it
     would be taking the keyboard away from whoever pressed. */
  HW.toast = function (words) {
    if (!words) return;
    var el = node();
    el.textContent = words;
    el.classList.add('is-up');
    window.clearTimeout(timer);
    timer = window.setTimeout(function () { el.classList.remove('is-up'); }, 2600);
  };

  /* THE OLD WAY, kept for pages opened off the disk. The box is put off the
     side of the screen rather than hidden: a browser will not select text in
     something that is `display: none`, because there is nothing there to
     select. */
  function copyTheOldWay(text) {
    var box = document.createElement('textarea');
    box.value = text;
    box.setAttribute('readonly', '');
    box.style.position = 'fixed';
    box.style.top = '-1000px';
    box.style.opacity = '0';
    document.body.appendChild(box);
    var ok = false;
    try {
      box.select();
      box.setSelectionRange(0, text.length);
      ok = document.execCommand('copy');
    } catch (e) { ok = false; }
    document.body.removeChild(box);
    return ok;
  }

  HW.copyToClipboard = function (text) {
    if (!text) return;
    var said = (HW.LINKS && HW.LINKS.emailCopied) || 'copied to clipboard';

    function worked() { HW.toast(said); }
    function failed() {
      /* NOT A SILENT FAILURE. If neither way is allowed, the address is put
         on screen so it can be read and typed - which is worse than copying
         and far better than a press that does nothing. */
      HW.toast(text);
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(worked, function () {
        if (copyTheOldWay(text)) worked(); else failed();
      });
      return;
    }
    if (copyTheOldWay(text)) worked(); else failed();
  };
})(window.HW);
