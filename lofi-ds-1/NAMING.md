# The naming convention

Every name in lofi-DS-1 follows one grammar. Learn it once and you can
guess any class in the system, and name a new one without asking.

```
            lofi-   table   -   rowhead   --   compact        is-selected
            └─┬─┘   └─┬─┘       └──┬───┘       └──┬───┘       └────┬────┘
           prefix   BLOCK         PART         VARIANT          STATE
```

| Piece | Rule | Example |
|---|---|---|
| **prefix** | always `lofi-` | never collides with the case-study engine's `cs-` |
| **BLOCK** | one noun, the thing itself | `table`, `menu`, `drawer`, `btn` |
| **PART** | one noun, a piece *of* that block | `lofi-menu-item`, `lofi-table-rowhead` |
| **VARIANT** | `--` plus one adjective | `lofi-btn--quiet`, `lofi-cell--neg` |
| **STATE** | `is-` plus one adjective, **no** `lofi-` | `is-open`, `is-selected`, `is-busy` |

Four more rules that keep it honest:

1. **A part never contains another block's name.** `lofi-menu-item`, not
   `lofi-menu-btn-item`. If a part is complex enough to need parts of its
   own, it is a block.
2. **A variant never changes what something is**, only how it looks.
   `lofi-btn--quiet` is still a button. If it stops being one, it is a new
   block.
3. **A state is temporary and set by a script.** Anything in the markup
   that never changes is a variant, not a state.
4. **One block, one pair of files**: `css/lofi-<block>.css` and, if it
   needs behaviour, `js/lofi-<block>.js`.

## The four layers

Blocks are grouped by what they do, and the group decides the load order.

| Layer | Blocks | What they have in common |
|---|---|---|
| **Foundation** | `face` `tokens` `base` | no markup of their own |
| **Shell** | `nav` `module` `panel` `page` `toolbar` `sheet` | the page's furniture |
| **Surface** | `menu` `combo` `modal` `drawer` `scrim` `loader` | float above the page |
| **Content** | `tabs` `table` `ledger` `chart` `insights` `legend` | what the screen is about |
| **Control** | `btn` `select` `field` `segmented` `badge` `icon` | what you press |

## Beyond CSS

The same grammar runs through the rest of the system, so one name tells you
everything about a thing:

| Kind | Shape | Example |
|---|---|---|
| behaviour hook | `data-lofi-<noun>` | `data-lofi-menu`, `data-lofi-threshold` |
| starter | `LOFI.init<Blocks>()` | `LOFI.initMenus()`, `LOFI.initTables()` |
| helper | `LOFI.<verb><Noun>()` | `LOFI.washTable()`, `LOFI.openDrawer()` |
| event | `lofi:<noun>` or `lofi:<noun>-<verb>` | `lofi:cell`, `lofi:tab-close` |
| token | `--lofi-<role>` | `--lofi-neg`, `--lofi-r-lg` |
| icon | `lofi-icon--<name>` | `lofi-icon--export` |

**Tokens are named for the JOB, not the colour.** `--lofi-neg`, not
`--lofi-peach` — so the day the negative wash stops being peach, the name
is still true and nothing else has to change.

## When a thing earns its own block

`ledger` was the test case for this, so it is worth writing down.

A sectioned grid of financial metrics looks, at first, like a variant of
`table` — it has a head, rows and cells. It is not, and the rule that
settles it is **what the reader is doing**:

| | `table` | `ledger` |
|---|---|---|
| the reader is | **being shown a finding** | **looking something up** |
| so it has | one head, washed cells, a legend | many sections, each with its own head of years |
| and colour | carries meaning | carries none |

A variant may change how a thing looks. It may not change what the reader
is doing with it. When it would, that is a new block — which is why the
ledger has its own pair of files rather than a `lofi-table--sections`
modifier that would have had to undo half of `lofi-table.css`.

