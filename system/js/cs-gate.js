/* cs-gate.js — the password screen on a private case study.

   BE CLEAR ABOUT WHAT THIS IS. It asks for a password and will not show the
   page without one. It does NOT hide the case study from anyone determined to
   read it: the words are in `content.js` like any other file, and a person who
   opens the browser's developer tools can read them whether they know the
   password or not.

   That is a deliberate trade, and the right one while the case studies hold
   stand-in content. It keeps casual visitors out, it reads correctly to
   someone you sent a password to, and it costs nothing — no build step, no
   encrypted files, nothing for antivirus software to object to.

   IF REAL CLIENT WORK EVER GOES IN HERE, THIS IS NOT ENOUGH. Two ways to fix
   it at that point, in order of how little work they are:
     1. Host the site somewhere that can do passwords properly. Vercel and
        Netlify both offer it, it is a setting rather than code, and the page
        never reaches a browser that has not authenticated.
     2. Encrypt the content so there is nothing to find without the password.
        This project did that for a while; it works, but every content change
        needs a rebuild step and the encrypted file itself gets flagged by
        virus scanners, which is a poor thing to hand a recruiter.

   The password is stored as a SHA-256 hash in common/access.js, so it is not
   sitting in the source in plain sight. That is tidiness, not security: the
   content it guards is in the clear regardless. */
window.CS = window.CS || {};
(function (CS) {
  'use strict';

  var KEEP = 'cs-open';   // sessionStorage: this tab only, never disk

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function sha256(text) {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
      .then(function (buf) {
        return Array.prototype.map.call(new Uint8Array(buf), function (b) {
          return ('0' + b.toString(16)).slice(-2);
        }).join('');
      });
  }

  /* What the reader sees before they are let in. */
  function gate(onTry, note) {
    var wrap = el('div', 'cs-gate');
    var card = el('form', 'cs-gate-card');
    card.setAttribute('data-cs-stroke', '18');

    card.appendChild(el('p', 'cs-gate-eyebrow', 'This case study is private'));
    card.appendChild(el('h1', 'cs-gate-title', 'Enter the password'));
    card.appendChild(el('p', 'cs-gate-note', note ||
      'The work behind this page was done for a client, so it travels with a ' +
      'password. If you were sent one, it goes here.'));

    var field = el('input', 'cs-gate-input');
    field.type = 'password';
    field.autocomplete = 'current-password';
    field.setAttribute('aria-label', 'Password');
    field.placeholder = 'password';
    card.appendChild(field);

    var go = el('button', 'cs-gate-go', 'Unlock');
    go.type = 'submit';
    card.appendChild(go);

    var say = el('p', 'cs-gate-say');
    say.setAttribute('role', 'status');
    card.appendChild(say);

    var back = el('a', 'cs-gate-back', '← back to the worlds');
    back.href = '../../index.html';
    card.appendChild(back);

    card.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!field.value) { field.focus(); return; }
      go.disabled = true;
      onTry(field.value).catch(function () {
        go.disabled = false;
        card.classList.add('is-wrong');
        say.textContent = 'That password does not open this one.';
        field.select();
        setTimeout(function () { card.classList.remove('is-wrong'); }, 600);
      });
    });

    wrap.appendChild(card);
    document.body.appendChild(wrap);
    setTimeout(function () { field.focus(); }, 60);
    if (CS.strokes) requestAnimationFrame(function () { CS.strokes.apply(wrap); });
    return wrap;
  }

  CS.Gate = {
    /* Called by a private case study's page. `onOpen` runs once the reader is
       through — that is when the case study is allowed to build itself. */
    ask: function (onOpen) {
      var access = CS.ACCESS || {};
      if (!access.hash) { onOpen(); return; }          // no password set

      var shell = document.getElementById('cs-window');
      if (shell) shell.setAttribute('hidden', '');
      var panel = null;

      function admit() {
        if (panel) panel.remove();
        if (shell) shell.removeAttribute('hidden');
        onOpen();
      }

      function tryIt(pw) {
        return sha256(pw).then(function (h) {
          if (h !== access.hash) throw new Error('no');
          try { sessionStorage.setItem(KEEP, '1'); } catch (e) {}
          admit();
        });
      }

      /* Already through once in this tab? Then the second case study opens
         without asking again. Closing the tab forgets it. */
      var kept = null;
      try { kept = sessionStorage.getItem(KEEP); } catch (e) {}
      if (kept) { admit(); return; }

      panel = gate(tryIt, access.note);
    }
  };
})(window.CS);


