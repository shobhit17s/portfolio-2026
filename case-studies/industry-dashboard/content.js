/* content.js — the Industry Dashboard case study.

   EVERYTHING about this case study lives in this one file: its words, which
   template each slide uses, who the people are, what the drawers say, and
   what fills each media slot. No code here — just what the study is.

   A second case study is a second folder with its own content.js. It can
   tell a completely different story, in a different order, and still run on
   the same engine without a line of it changing.

   HOW A SLIDE IS WRITTEN
     { template: 'context-1', title: '…', body: '…', media: 'img-07-…' }
   `template` names one of the layout-spec templates (see system/js/
   cs-templates.js for the list). The rest are that template's slots.

   HOW A PICTURE IS NAMED
   A media slot is just a name. What fills it is decided once, in `media` at
   the bottom of this file. Leave a name out of that map and it renders as
   the labelled placeholder — which is a perfectly good answer while you are
   still drawing.
       img-…   a still image or diagram
       vid-…   a video, a gif, or a running prototype
*/
window.CS = window.CS || {};

CS.CASE_STUDY = {

  /* ---------------------------------------------------------------- meta */
  meta: {
    id: 'industry-dashboard',
    title: 'Evolution of the industry dashboard',
    subtitle: 'From scattered info. to an industry level view',
    backHref: '../../index.html',
    backLabel: 'back to the worlds',
    nutshellNote: 'Two pieces: who it was for, and what was built.',
    storyNote: 'Twenty-two slides, in order.'
  },

  /* ------------------------------------------------ in a nutshell (view 1) */
  nutshell: [
    { template: 'persona', id: 'cs-slide-persona', label: 'Who we designed for' },
    {
      group: 'app-landscape',
      id: 'cs-slide-landscape',
      label: 'The app landscape',
      logo: { template: 'logo', media: 'img-logo-mark',
              tiles: ['START tile', 'AUTH tile'] },
      kingdom: [
        { template: 'wireframe', id: 'cs-slide-wireframe' },
        { separator: 'wide' },
        { template: 'backend', id: 'cs-slide-backend' },
        { separator: 'medium' },
        { template: 'strip-figure', id: 'cs-slide-strip',
          media: 'img-strip-industry-map',
          caption: 'The whole landscape in one band — the drawing to check any single decision against.' }
      ]
    }
  ],

  /* -------------------------------------------- the detailed story (view 2) */
  story: [

    { template: 'hero', label: 'Title',
      title: 'Evolution of the industry dashboard',
      subtitle: 'From scattered info. to an industry level view',
      lead: 'A platform for providing industry insights to enrich the assessment of credit risk.',
      tags: ['Systems thinking', 'Dashboard design', 'Collaborative design',
             'Integration into existing systems'],
      artwork: 'art-hero-desk' },

    { template: 'context-1', label: 'The business problem', draft: true,
      title: 'The business problem',
      media: 'img-02-business-problem',
      body: [
        'Credit risk was being assessed client by client, with the industry around the client treated as background rather than evidence. The information existed &mdash; it was simply scattered, and no part of the platform was responsible for it.',
        'That left every analyst assembling the same industry picture privately, from different sources, with no way to show their working or to compare one judgement against another.'
      ] },

    { template: 'context-2', label: 'The struggles users were facing', draft: true,
      media: 'img-03-user-struggles',
      title: 'Gathering took longer than judging',
      body: 'Industry information had to be collected from several systems and several documents before any of it could be weighed. The slow part of the work was assembly, not analysis.',
      title2: 'Nothing said what mattered',
      body2: 'Once gathered, everything arrived at the same volume. There was no signal that one movement in an industry deserved attention and another did not &mdash; so either everything was checked, or nothing was.' },

    { template: 'context-2', label: 'To start off',
      media: 'img-04-what-existed',
      title: 'What already existed',
      body: 'This wasn&rsquo;t a greenfield ecosystem. Our analysts were already using the client dashboard to assess credit risk.',
      title2: 'The new experience',
      media2: 'img-04-new-experience' },

    { template: 'strip-text', label: 'The main design constraint',
      title: 'Main design constraint',
      impact: 'The new experience had to be an extension of the existing architecture rather than being a novel thing.' },

    /* The brief was one sentence, so it gets a strip and nothing else on it. */
    { template: 'strip-text', label: 'Decoding the requirements',
      title: 'The initial brief',
      impact: '&ldquo;Build a dashboard for monitoring Key Industry Drivers (KIDs)&rdquo;' },

    /* The questions that sentence left open. They used to share a slide with
       the brief; the link to the answers drawer has been removed. */
    { template: 'sections', label: 'Open questions we had',
      title: 'Open questions we had',
      body: [{ kind: 'questions', wide: true, items: [
        'What constitutes a KID?',
        'How do analysts interpret them?',
        'How should they be organized?',
        'What does monitoring mean here?',
        'How do we segregate these insights between the 2 levels?',
        'How should users move between the 2 levels?',
        'How should these insights feed into client analysis?'
      ] }] },

    { template: 'context-1', label: 'Conducting research',
      title: 'Conducting research',
      media: 'img-07-research-synthesis',
      body: 'We gathered insights for our designs from SMEs and PMs. Here&rsquo;s what I understood:' },

    { template: 'strip-text', label: 'North star for UX',
      title: 'North star for UX',
      impact: 'Direct user attention towards signals worth investigating &amp; reduce noise.' },

    { template: 'title-figure-caption', label: 'Brainstorming ideas',
      title: 'Early concepts',
      media: 'img-09-early-concepts',
      caption: 'Brainstorming ideas.' },

    { template: 'context-2', label: 'Quick feedback from the working group',
      media: 'img-10-working-group',
      title: 'Rapid testing &amp; validation',
      body: [
        'We wanted to figure out which organisational model best supported the analytical task.',
        { kind: 'note', text: 'Potential users consulted: number needed' }
      ],
      title2: 'One thing that stood out',
      body2: 'Strong preference for &ldquo;seeing drivers separated into positive &amp; negative impacts&rdquo;.' },

    /* Template #3.4 - a heading, the sentence that changed the project, and
       one drawing under it.

       This slide used to be two columns, the second holding the four-step
       scope diagram. That diagram now has a strip of its own, immediately
       below. The link that opened the scope drawer was removed; the
       drawer's own text is still in `drawers.scope` at the bottom of this
       file, so nothing is lost. */
    { template: 'title-impact-figure', label: 'Findings and realizations',
      title: 'Unexpected findings',
      impact: '&ldquo;There&rsquo;s more to industries than just KIDs&rdquo;',
      media: 'img-11-unexpected-findings' },

    /* Template #3.3 - a heading and one drawing.

       The four steps that used to be drawn here as boxes and arrows -
           KIDs page -> KIDs-based client-level insights ->
           larger Industry Dashboard -> robust client-level insights
       (the third one carrying the note "more time, but more buy-in from
       stakeholders") - are what the drawing is waiting to show. */
    { template: 'title-figure', label: 'How the scope expanded',
      title: 'That&rsquo;s when the scope expanded',
      media: 'img-12-scope-expanded' },

    { template: 'title-figure-caption', label: 'Product roadmap',
      eyebrow: 'Product roadmap', title: 'New product strategy', band: true,
      stage: { kind: 'flow', steps: [
        { label: 'Phase 1', text: 'KIDs page + partial integration into the client dashboard' },
        { label: 'Phase 2', text: 'Industry dashboard + client dashboard' }
      ] },
      caption: 'Phasing let the first useful thing ship without waiting for the wider dashboard.' },

    { template: 'strip-text', label: 'Immediate deliverables and scope',
      title: 'Immediate deliverables &amp; scope',
      impact: 'We focused first on Phase 1.' },

    { template: 'title-figure', label: 'Information architecture',
      title: 'Information architecture',
      media: 'img-14-information-architecture' },

    /* Template #8 - a wireframe carousel. It shows the set of flows called
       'ideation' (see `workflowSets` further down), rather than the study's
       main `workflows` list. Four wireframes for now; adding a fifth is one
       more line there, and a second tab is one more entry. */
    /* Template #3.5: section title, wireframe carousel, caption. */
    { template: 'title-wireframe', label: 'Design ideation, page layouts',
      id: 'cs-slide-ideation', flows: 'ideation',
      title: 'Design ideation' },

    { template: 'title-figure', label: 'Conflicts and tensions',
      draft: 'draft copy under each heading',
      eyebrow: 'Conflicts &amp; tensions', title: 'Balancing forces', band: true,
      stage: { kind: 'tiles', items: [
        { label: 'User needs', note: 'What the analysis actually required, which was more than the brief described.' },
        { label: 'Tech', note: 'What the existing architecture could carry without becoming a second system.' },
        { label: 'Product Requirements', note: 'What had been committed to, and by when.' },
        { label: 'Design System', note: 'What the platform already said, so the new pages read as part of it.' }
      ] } },

    /* The two quick-and-dirty option slides are OUT for now. `hidden: true`
       takes a slide off the page and out of the numbering without deleting
       anything — remove that one line and the slide comes straight back,
       exactly as it was. */
    { template: 'title-figure-caption', label: 'Rapid prototyping, option A',
      hidden: true,
      eyebrow: 'Rapid prototyping', title: 'Quick &amp; dirty prototype: Option A',
      media: 'vid-17-prototype-option-a',
      caption: 'Option A, put in front of the working group.' },

    { template: 'title-figure-caption', label: 'Rapid prototyping, option B',
      hidden: true,
      eyebrow: 'Rapid prototyping', title: 'Quick &amp; dirty prototype: Option B',
      media: 'vid-18-prototype-option-b',
      caption: 'Option B, put in front of the working group.' },

    /* #3.3 - a heading and the thing itself. No eyebrow, no caption: the
       prototype is the point of the slide and anything else competes with
       it. */
    { template: 'title-figure', label: 'The final KIDs page',
      title: 'Design that was finally shipped',
      media: 'vid-19-final-kids-page' },

    { template: 'title-figure-caption', label: 'Partial integration with the client dashboard',
      eyebrow: 'Final product, which was actually launched',
      title: 'Partial integration with client dashboard',
      media: 'img-20-client-integration',
      caption: 'Phase 1 delivered: industry context inside the tool analysts already used.' },

    { template: 'title-figure', label: 'Feedback from real users',
      draft: 'illustrative figures \u2014 the real ones are still being pulled',
      eyebrow: 'Feedback from real users', title: 'Performance / Success Metrics', band: true,
      stage: { kind: 'tiles', items: [
        { value: '1.2k', unit: 'sessions / month',
          label: 'Monthly usage',
          note: 'Six months after launch, against a page that did not exist the quarter before.' },
        { value: '4.3', unit: 'out of 5',
          label: 'User feedback &amp; surveys',
          note: 'Average rating across 61 responses in the first post-launch survey.' },
        { value: '68', unit: 'per cent',
          label: 'Adoption',
          note: 'Of analysts with industry coverage opened the KIDs page at least once a month.' },
        { value: '6:20', unit: 'median, per visit',
          label: 'General engagement',
          note: 'Long enough to read the drivers, short enough that nobody is hunting.' }
      ] } },

    /* -------------------------------------------------- what this taught us */
    { template: 'sections', label: 'Learnings',
      draft: 'placeholder copy \u2014 your words go here',
      eyebrow: 'Looking back', title: 'What this project taught me', split: true,
      body: [
        'Placeholder. This is where the honest reflection goes: the thing you would do differently, the assumption that turned out to be wrong, the part of the process that earned its keep.',
        { kind: 'note', text: 'Send me the real copy and this becomes it.' }
      ] }
  ],

  /* ------------------------------------------------------- the people */
  tiles: ['Their week', 'What they want', 'What gets in the way', 'In their words'],

  personas: [
    { name: 'The credit analyst',
      meta: 'Primary user &middot; assesses client risk daily',
      media: 'img-persona-analyst',
      panels: [
        'PLACEHOLDER &mdash; a week of client assessments, each one needing industry context that currently has to be gathered from several places.',
        'PLACEHOLDER &mdash; to see what is moving in an industry without leaving the client they are assessing.',
        'PLACEHOLDER &mdash; industry information is scattered, and nothing says which of it is worth acting on.',
        'PLACEHOLDER &mdash; a quote from a real analyst goes here.'
      ] },
    { name: 'The executive director',
      meta: 'Working group &middot; quoted in the testing round',
      media: 'img-persona-director',
      panels: [
        'PLACEHOLDER &mdash; reviews the analysis rather than producing it, and needs to reach a judgement quickly.',
        'PLACEHOLDER &mdash; drivers arranged so the direction of impact is obvious at a glance.',
        'PLACEHOLDER &mdash; a flat list of drivers gives no sense of which way the industry is moving.',
        '&ldquo;Strong preference for seeing drivers separated into positive &amp; negative impacts.&rdquo;'
      ] },
    { name: 'The subject matter expert',
      meta: 'Consulted in research &middot; alongside the product managers',
      media: 'img-persona-sme',
      panels: [
        'PLACEHOLDER &mdash; holds the industry knowledge the dashboard has to encode.',
        'PLACEHOLDER &mdash; the reasoning behind a driver to survive the trip into the interface.',
        'PLACEHOLDER &mdash; judgement that is hard to reduce to a number or a tile.',
        'PLACEHOLDER &mdash; a quote from an SME goes here.'
      ] }
  ],

  /* --------------------------------- the wireframe slide's workflows */
  workflows: [
    { id: 'monitor', label: 'Monitor the drivers', shots: [
      { media: 'img-wf-monitor-1', caption: 'Drivers separated into positive and negative impacts — the arrangement the working group asked for.' },
      { media: 'img-wf-monitor-2', caption: 'Opening a driver without leaving the page, so the overview is never lost.' },
      { media: 'img-wf-monitor-3', caption: 'Signals worth investigating first; everything else stays available but quiet.' }
    ] },
    { id: 'client', label: 'Assess a client', shots: [
      { media: 'img-wf-client-1', caption: 'Phase 1 integration: industry context arrives inside the tool analysts already use.' },
      { media: 'img-wf-client-2', caption: 'The link that makes the industry view worth opening during a client assessment.' }
    ] },
    { id: 'industry', label: 'Explore an industry', shots: [
      { media: 'img-wf-industry-1', caption: 'Phase 2 — the scope that opened up once we learned there was more to an industry than its drivers.' },
      { media: 'img-wf-industry-2', caption: 'One of the four things the research turned up that the original brief had not asked for.' }
    ] }
  ],

  /* ------------------ extra sets of wireframes, by name
     `workflows` above is the study's main set - the shipped product, on the
     wireframe slide in the nutshell view. A wireframe slide in the story can
     ask for a different set by name, and this is where those live. */
  workflowSets: {
    ideation: [
      { id: 'kids-layouts', label: 'KIDs page layouts', shots: [
        { media: 'img-15-kids-layout-1', caption: 'Layout one &mdash; caption to come.' },
        { media: 'img-15-kids-layout-2', caption: 'Layout two &mdash; caption to come.' },
        { media: 'img-15-kids-layout-3', caption: 'Layout three &mdash; caption to come.' },
        { media: 'img-15-kids-layout-4', caption: 'Layout four &mdash; caption to come.' }
      ] }
    ]
  },

  /* the secondary control beside the workflow tabs. It appears only on the
     main workflow slide, not on an ideation carousel. */
  workflowAction: { label: 'View workflow', drawer: 'questions' },

  /* ------------------------------ the backend slide's toggles */
  diagrams: [
    { id: 'ia', label: 'Information architecture', media: 'img-ia-structure',
      caption: 'The structure that answered three of the open questions at once: what a KID is, how KIDs are organised, and where the two levels meet.' },
    { id: 'integration', label: 'Integration with the client dashboard', media: 'img-ia-integration',
      caption: 'An extension of the architecture that was already there, rather than a second place to go.' }
  ],

  /* ------------------------------------------------------- the drawers */
  drawers: {
    questions: {
      title: 'How the open questions were answered',
      media: 'img-drawer-questions',
      caption: 'Diagram: the seven questions and where each one was settled.',
      body: [
        'PLACEHOLDER &mdash; this drawer is where the seven open questions get their answers, one short paragraph each.',
        'What a KID is, and how an analyst reads one, came out of the sessions with subject matter experts. How they are organised was settled in testing, by the preference for separating positive from negative impact.',
        'What monitoring means here, how the two levels are separated, how a reader moves between them, and how the insights feed back into client analysis were all settled by the information architecture on the short view of this case study.'
      ]
    },
    scope: {
      title: 'How the scope widened',
      media: 'img-drawer-scope',
      caption: 'Diagram: one page became a platform, in four steps.',
      body: [
        'PLACEHOLDER &mdash; the fuller version of the chain on the slide.',
        'The brief asked for a page for monitoring key industry drivers. Research showed that analysts also wanted rating trends, market information, news, emerging themes and SWOT assessments — none of which fit on a drivers page.',
        'Rather than refuse the extra scope or absorb it quietly, we put it to stakeholders as a phased product. The wider dashboard needed more time, but it drew more support, and phasing let the first useful thing ship without waiting for it.'
      ]
    }
  },

  /* ====================================================================
     WHAT FILLS EACH SLOT

     This map is the ONLY place that says what a media slot actually holds.
     Leave a name out and it renders as the drawn placeholder.

     Kinds:
       image     { kind:'image',  src:'assets/x.png' }
       video     { kind:'video',  src:'…mp4|gif', poster:'…', loop:true }
       figma     { kind:'figma',  src:'<figma share link OR embed url>' }
       local     { kind:'local',  src:'../../prototypes/<study>/x/index.html' }
       external  { kind:'external', src:'https://…' }

     Every kind takes: ratio ('16 / 9'), note, poster, autoload, startLabel.
     See prototypes/README.md for the full walkthrough.
     ==================================================================== */
  media: {
    /* Slots still waiting for artwork carry a note so the placeholder can
       say what belongs there. */
    /* The five drawn diagrams. Each carries its own shape, so the slot takes
       that shape rather than cropping the drawing to fit a box. They are
       drawn on nothing - the page shows through - so no frame is put round
       them. Swapping one out is a change to its `src` and its `ratio`. */
    'img-02-business-problem': {
      kind: 'image', src: 'assets/02-business-problem.png', ratio: '879 / 929',
      alt: 'The richness of credit risk assessment was being sacrificed - or rather, it could be improved. Why? Because of the time taken by an analyst to gather insights and make sense of them.',
      note: 'Where the time actually went.' },

    'img-03-user-struggles': {
      kind: 'image', src: 'assets/03-user-struggles.png', ratio: '984 / 937',
      alt: 'An analyst taking in industry news, trends, published reports, in-house expert analysis and Zoom meetings, then applying all of it to a client-level assessment.',
      note: 'Everything an analyst had to hold in their head at once.' },

    'img-04-what-existed': {
      kind: 'image', src: 'assets/04-what-existed.png', ratio: '979 / 993',
      alt: 'The existing client dashboard with its three views - profile, health and exposure - and the new industry work below it. The two had to stay in alignment.',
      note: 'The client dashboard as it stood, and what had to line up with it.' },

    'img-04-new-experience': {
      kind: 'image', src: 'assets/04-new-experience.png', ratio: '719 / 350',
      alt: 'Industry-level analysis and insights feeding down into industry context added to the client-level assessment.',
      note: 'The industry level view the client dashboard could draw on.' },

    'img-07-research-synthesis': {
      kind: 'image', src: 'assets/07-research-synthesis.png', ratio: '974 / 984',
      alt: 'A table of the things that change in an industry - volume, price, costs, material movement, recent changes, long-spanning trends - and why an analyst cares about each.',
      note: 'What the SMEs and PMs said actually moves in an industry, and why it matters.' },

    'img-09-early-concepts': {
      kind: 'image', src: 'assets/09-early-concepts.png', ratio: '1809 / 767',
      alt: 'Four early concepts side by side: a grid of drivers tabbed by Volume, Price and Cost with material changes highlighted; a drawer or widget that carries industry insight into the client view; an interactive visualisation that drills down from a sub-industry to its positive and negative drivers; and a notification toast announcing that a driver has moved.',
      note: 'The first round: four ways the industry view could reach an analyst.' },

    'img-10-working-group': {
      kind: 'image', src: 'assets/10-working-group.png', ratio: '952 / 957',
      alt: 'An analyst asking which industries have been negatively impacted by the changes, and a diagram of a driver that moved materially splitting into the industries it impacts positively and the ones it impacts negatively.',
      note: 'The question the working group kept coming back to, and the shape of the answer.' },
    'img-11-unexpected-findings': {
      kind: 'image', src: 'assets/11-unexpected-findings.png', ratio: '1618 / 638',
      alt: 'An analyst saying that to understand the industry context he needs to know, well, many things: equity, bond, CDS and loan spread indices, market cap, brokerage reports, earnings call outlook and industry news on one side; issuer count, rating trends, downgraded and upgraded exposure, rating movers and the financials of clients in that industry on the other.',
      note: 'Everything beyond the drivers that turned out to matter.' },

    'img-12-scope-expanded': {
      note: 'How the scope grew: the KIDs page, then client-level insights built on it, then the whole industry dashboard, and back down into richer client-level insight.' },

    'img-14-information-architecture': {
      kind: 'image', src: 'assets/14-information-architecture.png', ratio: '1875 / 859',
      alt: 'The platform\u2019s five top-level areas \u2014 Surveillance, Clients, Portfolios, Create & Manage, Analyze \u2014 with the new Industry Dashboard and its four pages sitting inside Portfolios, alongside the Region Dashboard.',
      note: 'Where the whole thing sits in the platform it had to join.' },

    /* the four wireframes in the ideation carousel */
    'img-15-kids-layout-1': { note: 'Ideation of the KIDs page layout \u2014 first option.' },
    'img-15-kids-layout-2': { note: 'Ideation of the KIDs page layout \u2014 second option.' },
    'img-15-kids-layout-3': { note: 'Ideation of the KIDs page layout \u2014 third option.' },
    'img-15-kids-layout-4': { note: 'Ideation of the KIDs page layout \u2014 fourth option.' },
    'img-20-client-integration':      { note: 'Where the industry insights surface inside the client dashboard.' },
    'img-logo-mark':                  { note: 'The product mark.' },
    'img-strip-industry-map':         { note: 'One wide view of the whole industry landscape.' },

    /* The three portraits. Each names its own shape so the scrim that sits
       over it lines up with the drawing rather than with the empty space
       either side. To swap two people round, swap their two `src` lines. */
    'img-persona-analyst': {
      kind: 'image', src: 'assets/persona-analyst.png', ratio: '1000 / 1242',
      alt: 'A credit analyst: glasses, green tie, navy jacket.',
      note: 'The credit analyst.' },

    'img-persona-director': {
      kind: 'image', src: 'assets/persona-director.png', ratio: '1000 / 1397',
      alt: 'An executive director: short fair hair, navy blazer.',
      note: 'The executive director.' },

    'img-persona-sme': {
      kind: 'image', src: 'assets/persona-sme.png', ratio: '1000 / 1170',
      alt: 'A subject matter expert: moustache, pink shirt, navy jacket.',
      note: 'The subject matter expert.' },

    'img-wf-monitor-1': { note: 'The KIDs page as it opens: drivers grouped by the direction of their impact.' },
    'img-wf-monitor-2': { note: 'A single driver expanded, with its trend and the reasoning behind it.' },
    'img-wf-monitor-3': { note: 'Filtering the drivers down to the ones that moved this quarter.' },
    'img-wf-client-1':  { note: 'The existing client dashboard, with the new industry panel added.' },
    'img-wf-client-2':  { note: 'Following an industry driver through to the client it affects.' },
    'img-wf-industry-1': { note: 'The wider industry dashboard: ratings, market information, news, themes.' },
    'img-wf-industry-2': { note: 'A SWOT assessment sitting alongside the drivers.' },

    'img-ia-structure':   { note: 'How the two levels — industry and client — sit next to each other, and how a reader moves between them.' },
    'img-ia-integration': { note: 'Where the new industry panel plugs into the existing client dashboard.' },

    'img-drawer-questions': { note: 'The synthesis wall, or the page of the workbook where these were worked through.' },
    'img-drawer-scope':     { note: 'The four-step diagram of how the brief grew.' },

    /* The three prototype slots. Each is waiting for a real prototype —
       swapping one in is a change to these three lines and nothing else. */
    /* LIVE EXAMPLE — slot 17 is currently pointed at the demo prototype, so
       you can see the mechanism working on the hosted page. To put the drawn
       placeholder back, delete these six lines and uncomment the one below. */
    'vid-17-prototype-option-a': {
      kind: 'local',
      src: '../../prototypes/industry-dashboard/demo/index.html',
      ratio: '16 / 9',
      note: 'Walkthrough of the first organisational model.'
    },
    /* 'vid-17-prototype-option-a': { wants: 'video', note: 'Walkthrough of the first organisational model.' }, */
    'vid-18-prototype-option-b': { wants: 'video', note: 'Walkthrough of the second organisational model.' },
    'vid-19-final-kids-page': {
      kind: 'local',
      src: '../../prototypes/industry-dashboard/final-kids-page/index.html',
      ratio: '16 / 9',
      renderWidth: 1600,   /* the width this dashboard was drawn for */
      startLabel: 'Run the prototype',
      note: 'The shipped KIDs page, in use.'
    }
  }
};
