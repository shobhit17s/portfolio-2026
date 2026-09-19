/* content.js — everything this page says.

   This is the open page behind the pantheon: shared background that both case
   studies lean on, and no password in front of it. It runs on exactly the same
   engine and the same slide templates as a case study — the only difference is
   that it has no `nutshell`, so the engine drops the tab bar and shows a
   single read.

   EVERY LINE BELOW IS A PLACEHOLDER. Replace the words; leave the shape.
   The picture slots render as labelled empty boxes until the `media` map at
   the bottom says what fills them. */
window.CS = window.CS || {};

CS.CASE_STUDY = {

  meta: {
    id: 'analyst-primer',
    title: 'How an analyst typically works',
    subtitle: 'The day this work was trying to change',
    backHref: '../../index.html',
    backLabel: 'back to the worlds',
    storyNote: 'A short read, in order.'
  },

  /* No `nutshell` key. That is what makes this a single-view page. */

  story: [

    { template: 'hero', label: 'Title',
      title: 'How an analyst typically works',
      subtitle: 'The day this work was trying to change',
      lead: 'Both case studies on this planet start from the same working day. ' +
            'This page is that day, so neither has to explain it twice.',
      tags: ['Placeholder', 'Replace these tags', 'With the real ones'] },

    { template: 'context-1', label: 'Who they are', draft: true,
      title: 'Who we mean by "an analyst"',
      body: ['PLACEHOLDER — who this person is, what they are accountable for, ' +
             'and who they answer to. Two or three sentences is plenty.',
             'PLACEHOLDER — what makes their judgement good, and what they are ' +
             'measured on when it is not.'] },

    { template: 'title-figure-caption', label: 'The working day', draft: true,
      title: 'A day, end to end',
      slot: 'img-primer-day',
      caption: 'PLACEHOLDER — the day drawn as a strip: where it starts, where ' +
               'the time actually goes, and where it ends.' },

    { template: 'sections', label: 'The sources', draft: true,
      title: 'Where the information comes from',
      sections: [
        { title: 'Inside the bank',
          body: ['PLACEHOLDER — the internal systems they pull from, and what ' +
                 'each one is trusted for.'] },
        { title: 'Outside the bank',
          body: ['PLACEHOLDER — the external sources, and what makes them ' +
                 'awkward: format, timing, cost, licensing.'] }
      ] },

    { template: 'title-figure', label: 'The pile', draft: true,
      title: 'What that adds up to on a Tuesday morning',
      slot: 'img-primer-sources' },

    { template: 'impact-text', label: 'Where it hurts', draft: true,
      text: 'PLACEHOLDER — the single sentence that says what is actually ' +
            'wrong with this day. The one line a reader should leave with.' },

    { template: 'context-2', label: 'What good looks like', draft: true,
      title: 'What a better day would look like',
      body: ['PLACEHOLDER — not a solution, a description. What would be true ' +
             'if this worked?'],
      piece: { kind: 'note',
               text: 'PLACEHOLDER — the constraint that any answer has to live ' +
                     'inside, whatever it turns out to be.' } },

    { template: 'figure', label: 'Where to next', draft: true,
      slot: 'img-primer-map',
      caption: 'PLACEHOLDER — the two case studies on this planet, and which ' +
               'part of the day each one went after.' }
  ],

  /* ------------------------------------------------------- picture slots */
  media: {
    'img-primer-day':     { note: 'The analyst’s day drawn as one strip.' },
    'img-primer-sources': { note: 'The sources an analyst works from, all at once.' },
    'img-primer-map':     { note: 'Which case study went after which part of the day.' }
  }
};

