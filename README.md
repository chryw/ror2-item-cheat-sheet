# ror2-item-cheat-sheet

[![Netlify Status](https://api.netlify.com/api/v1/badges/c3090a9d-f0f9-422e-adc0-63e3df90c77d/deploy-status)](https://app.netlify.com/sites/ror2-item-cheat-sheet/deploys)

[Open the Risk of Rain 2 Field Guide fork](https://chryw.github.io/ror2-item-cheat-sheet/)

This website is an item cheat sheet for the game Risk of Rain 2 (RoR2). In RoR2, progressing through levels gives the player the ability to gain many items. Each item has a different stat it boosts and a different ability. With nearly unique 100 items in the game, it can get difficult to determine if you want to pick up each item. This website gives an easy way to see what items do at a glance. Clicking on an item gives a more in depth view of the item, along with links to the relevant wiki page. 

The technology used for this project was Vue and Vuex. 

For visual tokens, component anatomy/behavior, composition recipes, and
accessibility/responsive targets, edit the [authored design specification](design.md).
It is a short entry point with explicitly ordered [source modules](design/).
Edit each definition in its owning module; do not copy it into the index or a
second source. Only annotated index links are imports. Missing, duplicate,
nested, unsafe and conflicting definitions fail compilation; files are never
discovered by directory scanning.
Its component definitions separate shared components and
interaction policies from tenant workflows. Components consume token aliases;
tokens do not encode event handlers or application state.
The [content manifest](design-content.json) declares definitive tenant sources,
pinned revisions, data joins, artwork and non-generative validation policy.
Icon roles, control slots and compound-control anatomy are part of the component
contract, not Unicode glyphs or layout guessed from screenshots.

The specification's readable token tables separate reusable primitives,
brand/decorative/status palettes, component aliases, tenant-owned game palettes,
themes, and density factors. `dark` is the base; `dark-ror2` extends it for this
tenant. Light is a planned contract only.
Spacing and element sizes are separate categories. With Node.js 18 or newer, run
`npm run design:generate` to compile optional JSON artifacts,
`npm run design:check` to validate Markdown and detect stale generated artifacts,
and `npm run design:test` to validate the compiler and contracts.
Token tables and labeled YAML sections are authored once in Markdown.
`design-tokens.json`, `design-components.json`, and `content/minecraft-tokens.json`
are generated, marked non-editable, and ignored by Git. Consumers compile Markdown
in memory; a clean checkout does not require these files. Checks never regenerate
the source or silently repair drift.
Literal colors use readable `#RRGGBBAA`; `npm run design:export --silent` emits
numeric sRGB color objects for interchange, preserving token aliases.
Run `npm install` to restore the declared compiler dependencies.
These commands do not restyle the production application.
The design tests also use Git to read the pinned fork baseline; run
`git fetch origin main` first if that commit is unavailable locally.

### Validate design-system usability

Run `npm run design:preview` to open a separate token-driven gallery at
`http://127.0.0.1:4173/`. It reads the content manifest's pinned fork revision
without modifying this worktree.
Pass a commit/ref as `npm run design:preview -- <ref>` for a reproducible baseline.
The preview rebuilds the fork's item/equipment/drone gallery from its data and
local image blobs, not its runtime stylesheet. Shared reference components provide
docked desktop panels, compact overlays, searchable multi-selects, transactional
mobile/coarse-pointer pickers, keyboard selection, detail metadata, and density.
Rarity/version filtering matches the fork's dimensions; categories are read-only.
Run `npm run design:catalog --silent` to emit the deterministic catalog snapshot,
source provenance and asset map for a static rebuild. An optional explicit ref
uses `npm run design:catalog --silent -- <ref>`. Required source/asset failures
abort validation instead of inventing content. `/api/content` exposes the manifest.

Open `http://127.0.0.1:4173/?tenant=minecraft` for an illustrative second consumer:
the same renderer and component styles, a small inherited theme, and separate
material tokens/content from [authored sample records](content/minecraft-sample.json).
It is not a full Minecraft gameplay database or an authoritative-content fallback.
The preview is a validation fixture, not a replacement application; survivor-build
editing/persistence and survivor recommendations are outside its scope.
See the specification's component and acceptance sections for exact behavior,
intentional improvements, and remaining physical-keyboard verification.
The preview also serves `/interaction-tests.mjs`; the guide includes a repeatable
browser-console probe command for both tenants and responsive modes.

### Explore the design-system canvas

The workspace-scoped [canvas extension](.github/extensions/ror2-design-system/extension.mjs)
registers `ror2-design-system` with Copilot. Reload extensions after changing its
files, then ask Copilot to open the design-system canvas. No package installation
or separate preview server is required.

The read-only atlas displays live worktree tokens in compact comparison tables:
token name, small contextual preview, resolved value, and source alias. Expand a
token row for its full path, source/resolved data, and copy action. Text/border
colors are previewed in context; dimension bars are capped at 80px, with exact
values always shown. Typography gets inline specimens, not oversized cards.
Color tables distinguish global palettes from intent/application aliases and
theme overrides. Control tokens stay grouped by control, with part, variant
and state visible in each row. The Fluent 2 / React v9 color architecture and
usage rules are authored in [the color specification](design/colors.md).
The header is **Design System Explorer**, with the source system name and revision
shown secondarily. Navigation is a flat list: **Principles**, **Tokens**,
**Theming**, **Components**, **Patterns**, **Iconography**, **Assets**,
**Accessibility**, **Content**, **Layout**, and **Adoption & contribution**.
There are no artificial navigation groups.
**View source** opens the local authored entry point in a read-only, line-numbered
source view in a new tab. Section provenance, component contracts, and expanded
tokens link to their actual source module and line where available, not a
synthetic position in a concatenated file. Links use the
current worktree, not a potentially stale remote branch. The source view reads
saved Markdown directly, so it remains usable even while compilation reports
an invalid definition. Reload that source tab to see subsequent saved changes.
Saved module edits update explorer snapshots and their ETags without requiring
JSON regeneration. The raw reader exposes only the index and its declared modules.
A compact sidebar becomes a collapsible reference
menu on narrower screens. There is no overview dashboard or separate Guide page.
Principles
shows the existing design intent and Do's/Don'ts directly from the guide's
**Overview** and **Do's and Don'ts** sections, not a separately invented policy.
List-specific controls are hidden there; their state is retained
when returning to the inventory. Tokens
opens the complete inventory, with **All**, **Colors**, **Typography**,
**Spacing & size**, **Shape & effects**, **Motion**, and **Other** as category
filters of the same list. Counts show source totals before filtering; empty
categories explicitly indicate that no tokens are supplied yet. Token category
and token search compose. Components and Iconography each have their own search,
with page-specific labels and placeholders. There is no generic layer filter.
Searches are retained independently across lists; guideline pages and Assets do
not show search controls when they have no searchable inventory.

Explorer chrome uses fixed neutral styling, independent of system tokens and
themes. **Theming** documents the system's active/planned themes and inheritance.
**Inspect tokens** opens resolved values for an active theme. A **Token values
for** selector appears only in Tokens: it changes inspected data, never the
explorer's appearance. Planned themes cannot be selected. **Iconography** previews
the source-owned UI glyphs and their roles/directionality; **Assets** separately
shows artwork/catalog guidance and never treats the icon registry as an asset map.
Component contracts use expandable rows with usage/behavior, anatomy, inputs and
variants, states, and clickable token bindings. The illustrative canvas control
sample is not a product component implementation. Composition and acceptance
contracts have their own **Patterns** page instead of being buried in Components.
**Design documentation (source)** is a
collapsed disclosure containing the raw `design.md` guidance, not a separate
Guide section.
This presentation draws on [Carbon's token/role/value tables](https://carbondesignsystem.com/elements/color/tokens/),
[Primer's token reference](https://primer.style/product/primitives/color/), and
[Radix's role-oriented color guidance](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale).
The reference architecture also draws on
[Carbon's foundations/components/patterns distinction](https://carbondesignsystem.com/),
[GOV.UK's task-oriented patterns](https://design-system.service.gov.uk/patterns/),
[Primer's component accessibility guidance](https://primer.style/product/components/button/accessibility/),
and [GOV.UK's contribution criteria](https://design-system.service.gov.uk/community/contribution-criteria/).
These inform the viewer structure, not repository design policy.

The viewer and its source bindings live in
[reference.mjs](.github/extensions/ror2-design-system/reference.mjs). Its navigation,
token taxonomy, and optional documentation slots are shared by the client and
server. Guidelines use exact heading bindings from `design.md`; Patterns also
supports `workspace`, `controlRecipes`, `interactionAlgorithms`, and `acceptance`
contracts, and Iconography supports `iconography`, compiled directly from
`design.md`. Missing optional guidance fields remain explicit gaps.
Source excerpts retain the repository's wording, with
basic Markdown rendering and collapsed code/data examples. Missing optional
headings are labeled **Not documented here**, never filled with generated policy
or treated as proof that guidance does not exist elsewhere. In-page links jump
directly to each reference area.
Optional prose headings may be missing: unavailable principles or guidance
produce explicit source warnings while independently bound areas remain usable.
The specification itself is required; missing/empty Markdown or invalid compiled
contracts remain errors, not empty inventories or stale JSON fallbacks.
Adding content under a bound heading populates its slot automatically; changing
the source structure requires updating the bindings. Add new reference areas
there rather than coupling navigation to whichever content currently exists.
**Source available** means documentation/contract data exists, not that an
implementation is shipped, accessible, or tested. Contribution and changelog
slots likewise do not invent release history or a contribution process.

Token categories and list-specific searches narrow their respective inventories.
The canvas recompiles saved `design.md` changes every two seconds.
Unchanged snapshots return HTTP 304
without redrawing. Live updates retain filters, expanded token/component rows,
keyboard focus, and reading position. Invalid token/component data
shows an explicit live-update error while keeping the last valid view; polling
recovers automatically after the source is fixed. Missing optional prose
instead shows source warnings and the affected documentation gaps.
**Reload files** also remains
available. Neither mechanism writes source files or reads optional generated
JSON. The canvas compiles the authoritative Markdown definitions in memory.
Changes to the canvas code or source-loader/validation scripts still require
reloading extensions.
The `inspect_system` canvas action returns the current inventory and panel state.
Per-list searches, section, token category, and inspected token theme persist in memory when the same canvas instance
is reopened; extension reload/session shutdown resets them. No private durable
storage is created. Markdown is authoritative for design; the content manifest
and declared catalog inputs remain authoritative for game data. A missing or
invalid Markdown specification is an explicit source error, never a fallback to
stale generated JSON.

Validate the extension with
`node --check .github/extensions/ror2-design-system/extension.mjs` and
`node --test .github/extensions/ror2-design-system/*.test.mjs`.

There are 3 sections on the website. The navbar, the item list, and the sidebar. 

The navbar alters the item list to make it easier for the user to navigate the item list. It has functionality like searching for specific items, sorting the items, and filtering out specific types of items. 

Next is the item list. This is the list of all the items. This view gives the user a quick overview of all of the items at a glance. The colours signify the items rarity. Some items have an effective max, (I.E. if item X has an effective max of 5, it is useless to pick up more than 5 of item X) and this value is displayed in the bottom right of the item card. When an item is clicked on, it opens the sidebar.

The sidebar shows an in depth overview of the item, including the stats it changes, a full description, how to unlock it, as well as the link to the wiki page for the item. 

### Run Project
If this is your first time running this project, enter the following command first to install all of the dependencies. 
```
npm install
```

To run the project (assuming you have already installed dependencies before), run the following command.
```
npm run serve
```
Once if runs, you can go to localhost:8080 to see the website.
