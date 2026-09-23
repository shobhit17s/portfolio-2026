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
    /* Renamed with the new structure: the thing being monitored is Key
       Industry METRICS now, not Key Industry Drivers. This is what the top
       bar shows, so it is kept identical to the hero slide's own title. */
    title: 'Key Industry Metrics (KIMs) Dashboard',
    subtitle: 'Information Aggregation &amp; Surveillance',
    backHref: '../../index.html',
    backLabel: 'back to the worlds',
    nutshellNote: 'Two pieces: who it was for, and what was built.',
    storyNote: 'Twenty-one slides, in order.'
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
    },

    /* The same way back as the one at the end of the detailed story. It
       appears once to any reader, because only one view is on screen at a
       time - and a reader who only ever opens the short version should still
       be offered the road home. */
    { template: 'strip-back', label: 'Back to the worlds',
      media: 'img-back-to-worlds',
      href: '../../index.html#hw-world-work',
      text: 'back to the worlds' }
  ],

  /* -------------------------------------------- the detailed story (view 2)

     Twenty-one slides, rebuilt to the new slide-structure sheet.

     TWO THINGS CHANGED THROUGHOUT
       KIDs -> KIMs. The thing being monitored is now Key Industry METRICS,
       not Key Industry Drivers, and the case study is named after it.
       The story now opens on the SME's time to insight and what automation
       made possible, rather than on scattered information.

     NAMING OF PICTURES
       img-NN-slug / vid-NN-slug, where NN is this slide's number in the list
       below. Send a drawing named after its slot and it drops straight in;
       what each slot is waiting for is written against it at the bottom of
       this file. */
  story: [

    /* #1 - spec slide 1. Title, the two bands under it, the picture of the
       man at his computer beside them, and the long drawn separator along
       the bottom. */
    { template: 'hero', label: 'Title',
      title: 'Key Industry Metrics (KIMs) Dashboard',
      subtitle: 'Information Aggregation &amp; Surveillance',
      /* Spec box 3. Written as four separate things rather than one line of
         semicolons, so each one gets its own drawn chip - which is how every
         other list of this kind is set on the site. */
      tags: ['Systems thinking', 'Dashboard design', 'Collaborative design',
             'Integration into existing systems'],
      artwork: 'art-hero-desk',
      separator: 'img-01-hero-separator' },

    /* #2 - spec slide 2. Picture left, two sections right. */
    { template: 'context-2', label: 'The business problem',
      media: 'img-02-time-to-insight',
      title: 'The business problem',
      /* The role is named in the middle of the question, so the explanation
         of it opens in place rather than sending the reader away. The panel
         itself is shared with the landing page - see common/drawers.js - so
         pressing the pantheon on the yellow planet opens exactly this. */
      body: 'How might we reduce an <button type="button" class="cs-inline-link" data-cs-drawer="sme">industry Subject Matter Expert&rsquo;s (SME)</button> time to insight?',
      title2: 'What AI made possible',
      body2: 'Modern surveillance could automate pieces of the workflow that previously had to be repeatedly performed by humans.' },

    /* #3 - spec slide 3. Heading, one picture. */
    { template: 'title-figure', label: 'What an SME needed',
      title: 'What an SME needed in order to do his job',
      media: 'img-03-sme-needs' },

    /* #4 - spec slide 4. NEW TEMPLATE (#11): two tabs switch between two
       diagrams on the left, with the findings beside them. See the note on
       'toggle-figure-section' in system/js/cs-templates.js for why this is
       its own template rather than a variant of the backend slide. */
    { template: 'toggle-figure-section', label: 'Before and after automation',
      diagrams: 'automation',
      tabsLabel: 'The workflow, before and after automation',
      title: 'Where lied the problem',
      body: [{ kind: 'points', items: [
        'Curation took longer then assessment',
        'Several touchpoints &amp; artifacts in workflow',
        'Reports were more of a data dump and really did not say what mattered'
      ] }] },

    /* #5 - spec slide 5. Heading, the statement, the picture under it. */
    { template: 'title-impact-figure', label: 'Defining the UX problem',
      title: 'Defining the UX problem(s)',
      impact: 'How might we help industry SMEs form an accurate industry outlook and share it with their team?',
      media: 'img-05-where-the-problem-lay' },

    /* #6 - spec slide 6. */
    { template: 'title-figure', label: 'Product development strategy',
      title: 'Product development strategy',
      media: 'img-06-product-strategy' },

    /* #7 - spec slide 7. */
    { template: 'title-figure', label: 'Which data cluster becomes a priority',
      title: 'Which data cluster becomes a priority?',
      media: 'img-07-data-cluster-priority' },

    /* #8 - spec slide 8. Heading, the brief in the product team's own words,
       and the picture under it. */
    { template: 'title-impact-figure', label: 'Brief from the product team',
      title: 'Brief from the product team',
      impact: '&ldquo;We need to build a Dashboard for monitoring KIMs (Key Industry Metrics)&rdquo;.',
      media: 'img-08-brief' },

    /* #9 - spec slide 9. Two statements, one under the other, each under its
       own heading. Written as quotes so they sit centred, the way every
       statement on this site does. */
    { template: 'sections', label: 'North star and constraints',
      title: 'UX North Star',
      body: [{ kind: 'quote', text: '&ldquo;Direct user attention towards signals worth investigating &amp; reduce noise.&rdquo;' }],
      title2: 'UX Constraints',
      body2: [{ kind: 'quote', text: '&ldquo;Align with patterns being used in other products, especially the client dashboard.&rdquo;' }] },

    /* #10 - spec slide 10. RESTORED to what it was before the restructure:
       the seven questions themselves, set as a list across the full width,
       rather than a picture of them. The new sheet drew this as an image
       area; the questions read better as words, and they already existed. */
    { template: 'sections', label: 'Open questions we had',
      title: 'Open questions we had',
      body: [{ kind: 'questions', wide: true, items: [
        'What constitutes a KIM?',
        'How do analysts interpret them?',
        'How should they be organized?',
        'What does monitoring mean here?',
        'How do we segregate these insights between the 2 levels?',
        'How should users move between the 2 levels?',
        'How should these insights feed into client analysis?'
      ] }] },

    /* #11 - spec slide 11. */
    { template: 'title-figure', label: 'Conducting research',
      title: 'Conducting Research',
      media: 'img-11-conducting-research' },

    /* #12 - spec slide 12. Heading, picture, caption. */
    { template: 'title-figure-caption', label: 'Early ideas',
      title: 'Early Ideas',
      media: 'img-12-early-ideas',
      caption: 'The first round &mdash; caption to come.' },

    /* #13 - spec slide 13. Picture and caption, no heading: this one carries
       on from the slide above rather than starting something new. */
    { template: 'figure', label: 'Early ideas, continued',
      media: 'img-13-early-ideas-2',
      caption: 'Caption to come.' },

    /* #14 - spec slide 14. The wireframe carousel (#3.5), showing the set
       called 'exploratory' further down this file. Four screens for now;
       a fifth is one more line there. */
    { template: 'title-wireframe', label: 'Exploratory wireframes',
      id: 'cs-slide-exploratory', flows: 'exploratory',
      title: 'Exploratory Wireframes' },

    /* #15 - spec slide 15. Picture left, two sections right. */
    { template: 'context-2', label: 'Rapid testing and validation',
      media: 'img-15-testing-session',
      title: 'Rapid testing &amp; validation of concepts',
      body: [
        'What they liked:',
        { kind: 'numbers', items: [
          'The grid with heatmap concept resonated well with the SME working group, primarily due to familiarity with grids &amp; heatmaps. It was easy to read.',
          'Ability to quickly look at trends over different timespans helped them assess whether something was structurally divergent or a cyclical pattern.'
        ] }
      ],
      title2: 'What was missing',
      body2: 'We didn&rsquo;t account for a driver-level view highlighting the positively &amp; negatively impacted industries.' },

    /* #16 - spec slide 16. */
    { template: 'title-figure-caption', label: 'Information architecture',
      title: 'Information Architecture',
      media: 'img-16-information-architecture',
      caption: 'Where the whole thing sits in the platform it had to join.' },

    /* #17 - spec slide 17. */
    { template: 'title-figure-caption', label: 'Balancing tensions',
      title: 'Balancing Tensions',
      media: 'img-17-balancing-tensions',
      caption: 'Caption to come.' },

    /* #18 - spec slide 18. The running prototype, and nothing competing
       with it: no eyebrow, no caption. */
    { template: 'title-figure', label: 'What we finally built',
      title: 'What we finally built',
      media: 'vid-18-final-dashboard' },

    /* #19 - spec slide 19. Template #8: four tabs across the top, and inside
       each one a flow of diagrams you step through with the click areas
       either side. The four flows are in `workflowSets.kimAnalysis`. */
    { template: 'wireframe', label: 'How the dashboard is read',
      id: 'cs-slide-kim-analysis', flows: 'kimAnalysis' },

    /* #20 - spec slide 20. RESTORED to what it was before the restructure:
       the four figures themselves, as tiles across a band, rather than a
       picture of them. On a results slide the number IS the point. */
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
          note: 'Of analysts with industry coverage opened the KIMs page at least once a month.' },
        { value: '6:20', unit: 'median, per visit',
          label: 'General engagement',
          note: 'Long enough to read the metrics, short enough that nobody is hunting.' }
      ] } },

    /* #21 - spec slide 21. Picture left, the reflection right. */
    { template: 'context-1', label: 'What this project taught me',
      draft: 'placeholder copy — your words go here',
      media: 'img-21-what-it-taught-me',
      title: 'What this project taught me',
      body: [
        { kind: 'points', items: [
          'Placeholder &mdash; the thing you would do differently.',
          'Placeholder &mdash; the assumption that turned out to be wrong.',
          'Placeholder &mdash; the part of the process that earned its keep.'
        ] },
        { kind: 'note', text: 'Send me the real copy and this becomes it.' }
      ] }
,

    /* THE WAY BACK. The last thing in every case study: one drawing, and the
       whole band is the control. It returns to the worlds and lands on the
       yellow planet - the one the case studies live on - rather than at the
       top of the page. The #hw-world-work on the end is what says which
       planet; js/hw-scroll.js reads it on arrival. */
    { template: 'strip-back', label: 'Back to the worlds',
      media: 'img-back-to-worlds',
      href: '../../index.html#hw-world-work',
      text: 'back to the worlds' }
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

    /* slide #14 - the exploratory round. Four screens in one flow; a fifth
       is one more line, and a second tab is one more entry in this list. */
    exploratory: [
      { id: 'exploratory', label: 'Exploratory wireframes', shots: [
        { media: 'img-14-wireframe-1', caption: 'Wireframe one &mdash; caption to come.' },
        { media: 'img-14-wireframe-2', caption: 'Wireframe two &mdash; caption to come.' },
        { media: 'img-14-wireframe-3', caption: 'Wireframe three &mdash; caption to come.' },
        { media: 'img-14-wireframe-4', caption: 'Wireframe four &mdash; caption to come.' }
      ] }
    ],

    /* slide #19 - the four ways the shipped dashboard is read. Each tab is
       its own flow, stepped through with the click areas either side of the
       picture, so a tab can be one diagram or six. */
    kimAnalysis: [
      { id: 'material-moves', label: 'Identification of material moves', shots: [
        { media: 'img-19-material-moves-1', caption: 'Caption to come.' },
        { media: 'img-19-material-moves-2', caption: 'Caption to come.' }
      ] },
      { id: 'sub-industry', label: 'Sub-industry-level analysis of KIMs', shots: [
        { media: 'img-19-sub-industry-1', caption: 'Caption to come.' },
        { media: 'img-19-sub-industry-2', caption: 'Caption to come.' }
      ] },
      { id: 'trend', label: 'Trend Analysis', shots: [
        { media: 'img-19-trend-1', caption: 'Caption to come.' },
        { media: 'img-19-trend-2', caption: 'Caption to come.' }
      ] },
      { id: 'kim-level', label: 'KIM-level analysis', shots: [
        { media: 'img-19-kim-level-1', caption: 'Caption to come.' },
        { media: 'img-19-kim-level-2', caption: 'Caption to come.' }
      ] }
    ]
  },

  /* the secondary control beside the workflow tabs. It appears only on the
     main workflow slide, not on an ideation carousel. */
  workflowAction: { label: 'View workflow', drawer: 'questions' },

  /* ------------------------ extra sets of switchable diagrams, by name
     Same idea as `workflowSets`: `diagrams` below is the study's plain list,
     used by the backend slide in the nutshell view, and a slide in the story
     can ask for a different set by name. */
  diagramSets: {

    /* slide #4 - the two tabs. Each one is a whole diagram of the workflow,
       so the reader can hold one against the other. */
    automation: [
      { id: 'before', label: 'Before Automation', media: 'img-04-before-automation',
        caption: 'The workflow as it was &mdash; caption to come.' },
      { id: 'after', label: 'After Automation', media: 'img-04-after-automation',
        caption: 'The same workflow with the repeated pieces automated &mdash; caption to come.' }
    ]
  },

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

    /* the drawing in the way-back strip at the end of the story */
    'img-back-to-worlds': {
      note: 'The wide band at the very end: the drawing that means \u201cback to the worlds\u201d. Long and low, roughly 16:4.' },

    /* ================= the detailed story, slide by slide =================
       Every slot below is named after the slide it sits on. A slot with a
       `src` has its drawing; a slot with only a `note` renders as the drawn
       placeholder, and the note is what the placeholder says it is waiting
       for. Send me a PNG named after the slot and it drops straight in.

       SIX OF YOUR EXISTING DRAWINGS ARE RE-USED where the new slide is
       plainly about the same thing. Three are now unplaced - they are listed
       at the end of this block. */

    /* --- slide 1 --- */
    'img-01-hero-separator': {
      note: 'Long horizontal drawing, roughly 16:1, sitting along the bottom of the title slide as an ornamental separator.' },

    /* --- slide 2 --- was 02-business-problem, and still is that drawing */
    'img-02-time-to-insight': {
      kind: 'image', src: 'assets/02-business-problem.png', ratio: '879 / 929',
      alt: 'The richness of credit risk assessment was being sacrificed - or rather, it could be improved. Why? Because of the time taken by an analyst to gather insights and make sense of them.',
      note: 'Where an SME\u2019s time actually went.' },

    /* --- slide 3 --- was 03-user-struggles */
    'img-03-sme-needs': {
      kind: 'image', src: 'assets/03-user-struggles.png', ratio: '984 / 937',
      alt: 'An analyst taking in industry news, trends, published reports, in-house expert analysis and Zoom meetings, then applying all of it to a client-level assessment.',
      note: 'Everything an SME had to hold in their head at once.' },

    /* --- slide 4 --- the two tabs */
    'img-04-before-automation': {
      note: 'The SME\u2019s workflow before automation: every touchpoint and artifact in it.' },
    'img-04-after-automation': {
      note: 'The same workflow after automation, with the repeated pieces taken out.' },

    /* --- slides 5 to 8 --- */
    'img-05-where-the-problem-lay': {
      note: 'Where the problem lay \u2014 the diagram behind the UX problem statement.' },
    'img-06-product-strategy': {
      note: 'The product development strategy.' },
    'img-07-data-cluster-priority': {
      note: 'The data clusters, and which one was made the priority.' },
    'img-08-brief': {
      note: 'The brief from the product team, drawn out.' },

    /* --- slide 11 --- was 07-research-synthesis.
       (Slide 10 has no picture: it is the seven questions, in words.) */
    'img-11-conducting-research': {
      kind: 'image', src: 'assets/07-research-synthesis.png', ratio: '974 / 984',
      alt: 'A table of the things that change in an industry - volume, price, costs, material movement, recent changes, long-spanning trends - and why an analyst cares about each.',
      note: 'What the SMEs and PMs said actually moves in an industry, and why it matters.' },

    /* --- slides 12 and 13 --- 12 was 09-early-concepts */
    'img-12-early-ideas': {
      kind: 'image', src: 'assets/09-early-concepts.png', ratio: '1809 / 767',
      alt: 'Four early concepts side by side: a grid of metrics tabbed by Volume, Price and Cost with material changes highlighted; a drawer or widget that carries industry insight into the client view; an interactive visualisation that drills down from a sub-industry to its positive and negative drivers; and a notification toast announcing that a metric has moved.',
      note: 'The first round: four ways the industry view could reach an analyst.' },
    'img-13-early-ideas-2': {
      note: 'The second early-ideas drawing, carrying on from the slide above.' },

    /* --- slide 14 --- the exploratory wireframe carousel */
    'img-14-wireframe-1': { note: 'Exploratory wireframe \u2014 first option.' },
    'img-14-wireframe-2': { note: 'Exploratory wireframe \u2014 second option.' },
    'img-14-wireframe-3': { note: 'Exploratory wireframe \u2014 third option.' },
    'img-14-wireframe-4': { note: 'Exploratory wireframe \u2014 fourth option.' },

    /* --- slide 15 --- was 10-working-group */
    'img-15-testing-session': {
      kind: 'image', src: 'assets/10-working-group.png', ratio: '952 / 957',
      alt: 'An analyst asking which industries have been negatively impacted by the changes, and a diagram of a metric that moved materially splitting into the industries it impacts positively and the ones it impacts negatively.',
      note: 'The question the working group kept coming back to, and the shape of the answer.' },

    /* --- slides 16 and 17 --- 16 was 14-information-architecture */
    'img-16-information-architecture': {
      kind: 'image', src: 'assets/14-information-architecture.png', ratio: '1875 / 859',
      alt: 'The platform\u2019s five top-level areas \u2014 Surveillance, Clients, Portfolios, Create & Manage, Analyze \u2014 with the new Industry Dashboard and its four pages sitting inside Portfolios, alongside the Region Dashboard.',
      note: 'Where the whole thing sits in the platform it had to join.' },
    'img-17-balancing-tensions': {
      note: 'The forces pulling against each other: user needs, tech, product requirements, design system.' },

    /* --- slide 18 --- the running prototype */
    'vid-18-final-dashboard': {
      kind: 'local',
      src: '../../prototypes/industry-dashboard/final-kids-page/index.html',
      ratio: '16 / 9',
      renderWidth: 1600,   /* the width this dashboard was drawn for */
      startLabel: 'Run the prototype',
      note: 'The shipped dashboard, in use.'
    },

    /* --- slide 19 --- four tabs, two diagrams each */
    'img-19-material-moves-1': { note: 'Identification of material moves \u2014 first step.' },
    'img-19-material-moves-2': { note: 'Identification of material moves \u2014 second step.' },
    'img-19-sub-industry-1':   { note: 'Sub-industry-level analysis of KIMs \u2014 first step.' },
    'img-19-sub-industry-2':   { note: 'Sub-industry-level analysis of KIMs \u2014 second step.' },
    'img-19-trend-1':          { note: 'Trend analysis \u2014 first step.' },
    'img-19-trend-2':          { note: 'Trend analysis \u2014 second step.' },
    'img-19-kim-level-1':      { note: 'KIM-level analysis \u2014 first step.' },
    'img-19-kim-level-2':      { note: 'KIM-level analysis \u2014 second step.' },

    /* --- slide 21 ---
       (Slide 20 has no picture: it is the four figures, as tiles.) */
    'img-21-what-it-taught-me': {
      note: 'The picture beside the reflection on the last slide.' },

    /* ---- drawings you already have that the new structure does not place ----
       Nothing references these three, so they show nowhere. The files are
       still in assets/. To use one, point any slot above at its `src` and
       `ratio` - that is the whole change.

         assets/04-what-existed.png        979 / 993
         assets/04-new-experience.png      719 / 350
         assets/11-unexpected-findings.png 1618 / 638
       ---------------------------------------------------------------- */

    /* ================= the nutshell view, unchanged ================= */
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

    /* ---- prototype slots the old structure used ----
       The two quick-and-dirty option slides and the old final-KIDs-page
       slide are gone from the new structure. The shipped prototype now
       hangs off 'vid-18-final-dashboard' further up. These are kept only so
       nothing points at a name that has quietly stopped existing:

         vid-17-prototype-option-a   was the demo prototype, which is still
                                     in prototypes/industry-dashboard/demo/
         vid-18-prototype-option-b   never had a video
         vid-19-final-kids-page      is now vid-18-final-dashboard

       Delete this comment when you are sure you do not want them back. */
  }
};


