#!/usr/bin/env python3
"""bundle-check.py — read a .txt bundle and say what is in it.

    python3 tools/bundle-check.py path/to/bundle.txt            # just report
    python3 tools/bundle-check.py path/to/bundle.txt --stamp    # and write
                                                                # the note in

WHY THIS IS A SCRIPT AND NOT A HABIT.

A safety note that gets written when someone remembers to write it is worth
nothing, because the bundle that arrives WITHOUT one is then the bundle that
gets run unread. The note has to be produced by the same machinery every
time, from the file itself, so its absence is as loud as its presence.

AND IT HAS TO BE ABLE TO SAY SOMETHING ALARMING. A checker that can only
print "all clear" is reassurance theatre. Every finding below reports what
it actually found - a base64 blob gets measured and located, a network verb
gets quoted with its line number - and the headline says FOUND rather than
CLEAR whenever there is something to look at. Test it by doctoring a copy
of a bundle and running it again; it should go loud.
"""
import io, os, re, sys, subprocess, tempfile, shutil

MARK   = re.compile(r'^>>>>> FILE: (.+)$')
START  = 'copy from here'
END    = 'to here ---'

# what the user's structure, words and drawing names live in; a bundle must
# never carry one, at any depth
AUTHORING = re.compile(r'(^|/)(content|copy|media)\.js$')

# ways a script reaches the network, or runs text as if it were a program
REACH = [
    'Invoke-WebRequest', 'Invoke-RestMethod', 'Invoke-Expression',
    'DownloadFile', 'DownloadString', 'WebClient', 'Start-Process',
    'Add-Type', 'Start-BitsTransfer', 'System.Net', 'New-Object',
    'curl', 'wget', 'iwr', 'irm', 'iex',
]
REACH_RE = re.compile('|'.join(re.escape(w) for w in REACH), re.I)

# how long a line has to be before it counts as a blob rather than as a
# mention of the word; a real carried font runs to tens of thousands
BLOB_MIN = 400

# a word only counts as itself, not as a piece of an English word -
# "Curly quotes" is not curl, "confirmation" is not irm
WORDISH = re.compile(r'[A-Za-z0-9]')


def whole_word(line, m):
    a, b = m.start(), m.end()
    before = line[a - 1] if a > 0 else ' '
    after  = line[b] if b < len(line) else ' '
    return not (WORDISH.match(before) or WORDISH.match(after))


def read(path):
    return io.open(path, encoding='utf-8', errors='replace').read().split('\n')


def parse(lines):
    """-> [(name, first line number, [body lines])]"""
    out, name, buf, at = [], None, [], 0
    for i, L in enumerate(lines):
        m = MARK.match(L)
        if m:
            if name: out.append((name, at, buf))
            name, buf, at = m.group(1), [], i + 1
        elif name is not None:
            buf.append(L)
    if name: out.append((name, at, buf))
    return out


NOTE_TOP = '  WHAT THE CHECKER FOUND IN THIS FILE'
NOTE_END = 'A bundle that arrives with no such note'


def note_range(lines):
    """Where a note already stamped into the file begins and ends, as a
    plain zero-based slice: lines[start:end] IS the note and nothing else.

    It has to be exactly the note. One line too few and a blank line is
    left behind on every re-stamp, the file grows by one each time, and the
    line numbers the note quotes are stale before the ink dries - which is
    precisely the bug this comment is standing on the grave of."""
    try:
        i = next(i for i, L in enumerate(lines) if L == NOTE_TOP)
    except StopIteration:
        return None, None
    j = next(j for j in range(i, len(lines)) if NOTE_END in lines[j])
    return i - 1, j + 3    # the dashed rule above, the blank line below


def block_range(lines):
    s = e = None
    for i, L in enumerate(lines):
        if s is None and START in L: s = i + 1
        elif s is not None and e is None and END in L: e = i + 1
    return s, e


def check(path):
    lines = read(path)
    files = parse(lines)
    s, e = block_range(lines)
    f = {}

    f['count'] = len(files)
    f['bytes'] = os.path.getsize(path)

    # 1 — nothing of the user's own
    f['authoring'] = [n for n, _, _ in files if AUTHORING.search(n)]

    # 2 — what the paste-in block does, and what it does not
    blk = lines[s:e - 1] if (s and e) else []
    f['block'] = (s, e)
    f['verbs'] = sorted(set(re.findall(r'\b[A-Z][a-z]+-[A-Z][a-zA-Z]+\b', '\n'.join(blk))))
    f['block_reach'] = [(s + i, L.strip()) for i, L in enumerate(blk)
                        for m in [REACH_RE.search(L)] if m and whole_word(L, m)]

    # 3 — the same words anywhere else, so the headline can explain the hits
    #     a reader's own search will turn up.
    #
    #     THIS NOTE LEAVES ITSELF OUT, and not to flatter itself. The note
    #     has to write the dangerous words down in order to say they are
    #     absent, so it is always a handful of hits in its own right - and
    #     counting them changes its length, which moves every line below
    #     it, which changes the numbers it just printed. A snake eating its
    #     tail, and it never settles. Excluding its own lines breaks the
    #     loop; they are reported as a fixed sentence instead.
    n_from, n_to = note_range(lines)          # zero-based slice
    f['note'] = (n_from, n_to)
    #
    #     EACH HIT IS NAMED WITH THE FILE IT IS IN, and nothing is exempted
    #     by filename. It would be easy to tell this script to ignore hits
    #     inside itself - it has to list the dangerous words in order to
    #     search for them - but an exemption by name is a door, and the
    #     next thing through it is a file that chose that name on purpose.
    #     Saying WHERE a hit is lets the reader judge; hiding it does not.
    owner = []                                  # line number -> which file
    for name, at, buf in files:
        for k in range(len(buf)):
            owner.append((at + k + 1, name))
    own = dict(owner)
    f['prose_reach'] = []
    for i, L in enumerate(lines):
        n = i + 1
        if s and e and s <= n <= e: continue
        if n_from is not None and n_from < n <= n_to: continue
        m = REACH_RE.search(L)
        if m and whole_word(L, m):
            f['prose_reach'].append((n, m.group(0), own.get(n, "this file's own explanation")))

    # 4 — anything carried as a blob rather than as readable text.
    #
    #     A BLOB IS A LENGTH, NOT A WORD. The first version of this counted
    #     any line containing "base64," and duly announced a 73-character
    #     blob - which was this script's own search string, and is not a
    #     wall of anything. A carried font or image runs to thousands of
    #     characters on one line; that is what the reader is being warned
    #     to scroll past, so that is what gets counted.
    f['blobs'] = []
    f['base64_mentions'] = 0
    for name, at, buf in files:
        for i, L in enumerate(buf):
            if 'base64,' in L or re.search(r'data:[a-z/+.-]+;base64', L):
                if len(L) >= BLOB_MIN:
                    f['blobs'].append((name, at + i + 1, len(L)))
                else:
                    f['base64_mentions'] += 1
    f['longest'] = max(((len(L), i + 1) for i, L in enumerate(lines)), default=(0, 0))

    # 5 — every file is complete and, where it is code, parses
    f['bad_js'] = []
    tmp = tempfile.mkdtemp()
    try:
        for name, _, buf in files:
            if not name.endswith('.js'): continue
            p = os.path.join(tmp, os.path.basename(name))
            io.open(p, 'w', encoding='utf-8').write('\n'.join(buf))
            r = subprocess.run(['node', '--check', p], capture_output=True)
            if r.returncode: f['bad_js'].append((name, r.stderr.decode()[:120]))
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

    # 6 — what it will write over
    f['writes'] = [n for n, _, _ in files]
    return f


def note(f):
    """The block that goes above `copy from here`. Generated, never typed."""
    L = []
    w = L.append
    bad = (f['authoring'] or f['block_reach'] or f['bad_js'])

    w('-' * 78)
    w('  WHAT THE CHECKER FOUND IN THIS FILE')
    w('  (tools/bundle-check.py, run on this bundle after it was assembled)')
    w('-' * 78)
    w('')

    if bad:
        w('  !! SOMETHING HERE NEEDS A LOOK BEFORE YOU RUN IT. See below.')
        w('')

    # 1
    if f['authoring']:
        w('  !! YOUR OWN FILES ARE IN THIS BUNDLE - it carries %d of them:'
          % len(f['authoring']))
        for n in f['authoring']: w('       ' + n)
        w('     Do not run this. Tell me; it should not have been built.')
    else:
        w('  Your own files           none. No content.js, copy.js or media.js')
        w('                           is in this bundle, at any depth. Your')
        w('                           structure, your words and your drawing')
        w('                           names are untouched.')
    w('')

    # 2
    if f['block_reach']:
        w('  !! THE PASTE-IN BLOCK REACHES OUT. Lines that do it:')
        for ln, txt in f['block_reach']: w('       line %d:  %s' % (ln, txt[:60]))
        w('     Do not run this. Ask me what it is before you do anything.')
    else:
        w('  The paste-in block       lines %d to %d, and it never touches the'
          % f['block'])
        w('                           internet. Every command in it:')
        w('                             ' + ', '.join(f['verbs']))
        w('                           Those read this file, write files, make')
        w('                           folders and print messages. Nothing')
        w('                           fetches, and nothing runs text as code.')
    w('')

    # 3
    if f['prose_reach']:
        w('  If you search yourself   searching this file for Invoke-, curl,')
        w('                           wget, DownloadFile and the like finds %d'
          % len(f['prose_reach']))
        w('                           hit(s), none of them in the paste-in')
        w('                           block. Where they are:')
        where = {}
        for ln, word, src in f['prose_reach']:
            where.setdefault(src, []).append(ln)
        for src, lns in where.items():
            shown = ', '.join(str(x) for x in lns[:6])
            if len(lns) > 6: shown += ', ...'
            w('                             %d in %s' % (len(lns), src))
            w('                               (line%s %s)'
              % ('s' if len(lns) > 1 else '', shown))
        w('                           It will also find them in THIS NOTE,')
        w('                           which has to write them down in order')
        w('                           to say they are absent.')
    else:
        w('  If you search yourself   searching this file for Invoke-, curl,')
        w('                           wget and the like finds nothing at all.')
    w('')

    # 4
    if f['blobs']:
        big = max(n for _, _, n in f['blobs'])
        w('  Carried as a blob        %d line(s). The largest is %s characters,'
          % (len(f['blobs']), '{:,}'.format(big)))
        w('                           in:')
        seen = []
        for name, ln, n in f['blobs']:
            if name in seen: continue
            seen.append(name)
            w('                             %s (line %d)' % (name, ln))
        w('                           A blob is text you cannot read. It is')
        w('                           normally a font or an image carried')
        w('                           inside a file so nothing has to be')
        w('                           fetched - but THIS CHECK CANNOT TELL')
        w('                           you which it is. Look at the file name')
        w('                           above. If it is one you recognise, the')
        w('                           wall of letters is nothing to worry')
        w('                           about. If it is not, ask before running.')
    else:
        w('  Carried as a blob        none. No line is long enough to be a')
        w('                           carried font or image.')
        if f['base64_mentions']:
            w('                           The word "base64" does appear %d time(s),'
              % f['base64_mentions'])
            w('                           but on short lines - a search string,')
            w('                           not a payload.')
        w('                           So there is no wall of letters to scroll')
        w('                           past, and no font or image is replaced.')
        w('                           Longest line in the whole file: %d'
          % f['longest'][0])
        w('                           characters, at line %d - ordinary text.'
          % f['longest'][1])
    w('')

    # 5
    if f['bad_js']:
        w('  !! CODE THAT DOES NOT PARSE - the bundle is damaged:')
        for n, err in f['bad_js']: w('       %s  %s' % (n, err.split(chr(10))[0]))
    else:
        w('  Code arrives whole       every .js file in here was extracted and')
        w('                           parsed; all of them are complete.')
    w('')

    # 6
    w('  It will write over       %d files, every one of them listed on its own'
      % f['count'])
    w('                           >>>>> FILE: line further down. Read that')
    w('                           list before you run anything.')
    w('')
    w('  Size                     %s bytes.' % '{:,}'.format(f['bytes']))
    w('')
    w('  NONE OF THIS IS ME PROMISING. It is a script reading the file. Run it')
    w('  yourself - tools/bundle-check.py in your own copy - on this bundle or')
    w('  on anyone else\'s. A bundle that arrives with no such note is the one')
    w('  to be careful about.')
    w('')
    return '\n'.join(L)


def stamp(path):
    """Put the note immediately above `copy from here`, and keep it true.

    THE SNAKE EATING ITS TAIL. The note quotes line numbers and a byte
    count taken from the very file the note is about to go into, so writing
    it changes the thing it describes. There is no way to get it right in
    one pass; the way to get it right at all is to stop trying to predict
    and start iterating.

    So: take the file WITHOUT any note as the fixed base. Guess a note.
    Put it in. Read the result and see what note that file would produce.
    If it is the same note, we have found a version that describes itself
    correctly and we stop. If not, adopt the new one and go round again.

    Each pass only ever moves digits - line 146 becomes 147, 454,424
    becomes 454,480 - so it settles in two or three. The earlier version of
    this function compared the new note against a reading of the STRIPPED
    file, which differs from the finished one by the length of the note
    itself and so could never agree, no matter how stable the output was.
    """
    base = read(path)
    i, j = note_range(base)
    if i is not None:
        del base[i:j]
    at, _ = block_range(base)
    if not at:
        print('no "copy from here" line - nothing stamped')
        return check(path)

    def write(body):
        io.open(path, 'w', encoding='utf-8').write(
            '\n'.join(base[:at - 1] + body.split('\n') + base[at - 1:]))

    body = None
    for attempt in range(8):
        if body is None:                       # the first guess, from the
            io.open(path, 'w', encoding='utf-8').write('\n'.join(base))
            body = note(check(path))
        write(body)
        again = note(check(path))              # what the finished file says
        if again == body:
            print('note settled after %d pass(es)' % (attempt + 1))
            return check(path)
        body = again
    write(body)
    print('note did not settle in 8 passes - left as is')
    return check(path)


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(1)
    path = sys.argv[1]
    f = stamp(path) if '--stamp' in sys.argv else check(path)
    print(note(f))
    sys.exit(1 if (f['authoring'] or f['block_reach'] or f['bad_js']) else 0)

