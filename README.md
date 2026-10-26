# Risk of Rain 2 Field Guide

[![Deploy to GitHub Pages](https://github.com/chryw/ror2-item-cheat-sheet/actions/workflows/deploy.yml/badge.svg)](https://github.com/chryw/ror2-item-cheat-sheet/actions/workflows/deploy.yml)

[Open Risk of Rain 2 Field Guide](https://chryw.github.io/ror2-item-cheat-sheet/)

This website is an item cheat sheet for the game Risk of Rain 2 (RoR2). In RoR2, progressing through levels gives the player the ability to gain many items. Each item has a different stat it boosts and a different ability. With 248 catalog entries, it can get difficult to determine if you want to pick up each item. This website gives an easy way to see what items do at a glance. Clicking on an item gives a more in depth view of the item, along with links to the relevant wiki page.

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
The [token API and migration rules](design/system.md) require complete logical
size properties and reject cross-axis aliases. Concrete control states have
component-local bindings; browser probes verify real overrides, not just that
an alias exists in a manifest.
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
files, then ask Copilot to open the design-system canvas. Install the repository's
normal dependencies first; no additional extension package or separate preview
server is required. Copilot supplies the canvas SDK at runtime.

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
collapsed disclosure containing the concatenated authored Markdown, not a separate
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

The explorer is a checked-in workspace extension, not a session-generated page.
Its server locates the current checkout relative to the extension; another
worktree uses its own saved specification. No absolute worktree path or generated
snapshot is committed.

The data boundary is **compiled specification → repository adapter → versioned
Explorer view model → renderer**. [view-model.mjs](.github/extensions/ror2-design-system/view-model.mjs)
owns source bindings, token categorization, grouping policy, component fields,
and normalized glyphs. [contract.mjs](.github/extensions/ror2-design-system/contract.mjs)
defines and validates `ror2.design-system.explorer` schema version `1`, independently
of the design system's revision. Additive fields can remain compatible; breaking
payload changes require a schema-version change. The browser validates each snapshot before
replacing its last valid model. Unsupported versions or malformed payloads produce
an explicit live-update error; unsupported token/glyph previews retain inspectable
data and emit diagnostics.

The renderer consumes supplied group IDs/labels/hierarchy, categories, preview
kinds, capabilities, and actual module/line references. It does not parse token
names or Markdown headings to reconstruct those decisions. Authored token groups
provide defaults; the repository adapter preserves whole-control/status grouping.
Adapter inputs may supply explicit groups, categories, usage, and provenance for
different source shapes. New component fields remain visible through generic data
inspection. New semantic visualizations still require an intentional renderer;
arbitrary shapes are not silently treated as supported specimens.
Run `node --test .github/extensions/ror2-design-system/*.test.mjs` for the
contract, alternate-shape, source-route, and live-update regression tests.

[reference.mjs](.github/extensions/ror2-design-system/reference.mjs) supplies the
navigation and repository-specific binding helpers used by the adapter.
Guidelines currently use exact heading bindings from the modular specification; Patterns also
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

The navbar alters the item list to make it easier for the user to navigate the item list.
Search, survivor, rarity and version filters narrow the catalogue; ordering is automatic.

The persistent header uses one **Risk of Rain 2 Field Guide** H1 on desktop and mobile,
matching the browser-tab title. A smaller, muted subtitle describes the reference:
**Items, equipment, drones, and survivor builds.** There is no competing slogan or hero;
catalogue sections and build names are subordinate headings. The product header does not
scroll with the gallery, and the catalogue starts directly below it.

Navigation starts collapsed. On desktop (above 900px), the header contains a
labelled **Filters** button beside the product identity. The button opens a docked left panel;
collapsing it reclaims the entire width instead of leaving an empty icon rail.
The panel has a clear heading that stays visible while scrolling. The same header button
opens and closes navigation at every viewport size, with the same menu icon and active state.
Escape closes the panel and restores focus to the header button without clearing selections.
Desktop panels are non-modal: the gallery remains usable and Tab is not trapped.
On narrower screens the hamburger shares the same product header, and filters open in a
full-width overlay panel beneath the unchanged product header instead of replacing it,
consuming a dedicated row or shrinking the gallery. Opening and closing filters never
changes the product header's height, title, subtitle or button geometry.
The header is flush with
the viewport edge, with no gap for scrolling content to show through.
Press Escape or use the header's menu button to close it. Outside-click dismissal recognizes
dropdown menus belonging to the panel. Choosing a survivor/custom build or creating a build returns
to the gallery on mobile. Collapsing never clears your filters or saved lists.
Search, rarity and version controls narrow the catalogue; **Reset filters** restores it.
There is no manual sort control or name-sort mode.

Mobile item details fill the entire viewport, including tablet and landscape layouts
up to 900px. The close/wiki row stays sticky while the details scroll. Closing restores
focus to the originating pickup, and **View custom build** closes mobile details and
returns to the build editor; desktop keeps its side-by-side details panel.
Mobile filters keep focus within the shared header trigger and panel controls, support
Escape, and make the gallery inert. Full-screen details move focus into the dialog and
make both the gallery and product header inert. The compact product header stays accessible
while browsing long result lists or filtering.
Navigation, gallery and details use [AppScrollArea.vue](src/components/AppScrollArea.vue),
a shared [OverlayScrollbars](https://github.com/KingSora/OverlayScrollbars) wrapper.
The themed, draggable scrollbars overlay the content edge: they reserve no gutter and
do not change panel or content widths when overflow appears. Wheel, touch and keyboard
scrolling continue to use the native scroll viewport.
Its MIT notice is distributed in [overlayscrollbars-license.txt](public/overlayscrollbars-license.txt).

All choice inputs use [AppSelect.vue](src/components/AppSelect.vue): survivor, rarity,
version and custom-build destination. On fine-pointer desktop, vue-multiselect menus open
in a fixed, z-indexed popup layer outside the scrolling panels, anchored to their control.
They flip above near viewport edges and reposition on resize/scroll. Opening a menu never
changes its container's height, scroll range or sibling positions. Role names have no added suffixes.
Trigger values, tags, carets and option labels use shared flex alignment to stay vertically
centred, including wrapped labels.

At <=900px or with a coarse pointer, the same component uses a native modal-dialog
bottom sheet instead of a flyout. The trigger stays one row tall and shows the current
selection as a text summary. Radio buttons choose one value; checkboxes choose multiple.
Selections are drafts until **Apply**; **Cancel**, Close, Escape and backdrop dismissal
discard drafts. **Clear** clears the draft, not the saved filter until Apply.
Lists longer than eight options have a labelled search field, without automatically
focusing it or opening the on-screen keyboard. The heading receives initial focus.
The sheet has an independently scrolling choice area, persistent actions, 44px minimum
targets, and visual-viewport sizing for the on-screen keyboard. Opening and closing it
does not change page/panel height or scroll position. Native modal semantics contain
focus and make the background inert. Closing returns focus without scrolling; applying
a survivor still returns mobile users to the gallery. Crossing the picker breakpoint
cancels uncommitted choices and cleans up listeners.

This interaction follows [WAI modal-dialog guidance](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
and [native dialog semantics](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog).
[GOV.UK's select guidance](https://design-system.service.gov.uk/components/select/) also
recommends considering simpler radio choices rather than defaulting to a select.

UI icons use [Lucide](https://lucide.dev/) through the shared
[AppIcon](src/components/Icons/AppIcon.js) renderer. Only eight named icon definitions are
imported from its maintained framework-neutral package; the deprecated Vue 2 adapter is not used.
Icons share a 24-unit grid, 1.75-unit rounded strokes, and inherited theme colours, displayed
at 16–20px. SVGs are decorative and hidden from assistive technology; containing controls
retain their accessible labels. No icon font, CDN request or DOM-replacement pass is needed.
Lucide's ISC and Feather-derived MIT notices are distributed in
[lucide-license.txt](public/lucide-license.txt), including in the built site.
Standalone definition imports avoid loading DOM helpers that webpack 4 cannot parse.
Game artwork is unchanged.

Catalogue cards use neutral borders on every edge. Item-name text carries the existing
rarity palette without adding a row, increasing card height or duplicating borders already
present in the game artwork. The name's tooltip, card's accessible rarity description and written rarity in item
details keep the information available without relying on colour alone.
Hover and selected-card outlines remain interaction cues, not rarity colours.
Each catalogue section is divided into rarity groups in the game's existing rarity order.
Small rarity headings and vertical spacing distinguish groups without decorative rules.
The larger **Items**, **Equipments** and **Drones** headings/counts remain the primary
section landmarks; rarity headings are subordinate, not a second row of line dividers.
Only groups with matching entries appear. Build priorities apply within each rarity group.
Hex uses a soft yellow-green alias consistently across names, group headings and details.

### Visual system

The dark appearance takes high-level inspiration from [Electric](https://electric.ax/):
layered charcoal surfaces, warm off-white typography, fine borders, rounded panels and
restrained accent usage. Our accent is neon yellow, not cyan. The layout, components and
styles are original; no Electric artwork, fonts or source styles are bundled.

[design-tokens.css](src/assets/design-tokens.css) is the canonical token-only stylesheet:
semantic colours, typography, spacing, radii, borders, focus, icon sizes/stroke, control
dimensions, layout/media scales, status colours and a generic colour palette.
It contains no game concepts.
Typography uses five sizes (12, 14, 16, 20 and 24px), shared heading/body line heights,
and semantic `--type-*` recipes for product titles, titles, headings, body copy, captions,
labels, controls and technical values. Small labels use the system sans stack; monospace
is reserved for technical values. Responsive styling changes the recipe's token, not the
semantic heading or control type.
[site-tokens.css](src/assets/site-tokens.css) is the consumer layer: rarity, build ranks
and site layout names alias the reusable primitives, without duplicating their values.
For example, `--rarity-common: var(--color-gray-400)` and
`--rank-core-text: var(--status-warning-text)`.
[theme.css](src/assets/theme.css), loaded once by [App.vue](src/App.vue), imports these
layers plus [primitives.css](src/assets/primitives.css) for generic typography, focus,
icons, technical labels and reduced motion. Only the consumer theme defines build badges
and rarity class mappings.

Reusable controls are actual components, not one-off button/input class recipes:

| Component | Contract |
| --- | --- |
| [AppButton](src/components/base/AppButton.vue) | secondary/primary/danger/ghost, regular/compact, icon-only, responsive label, active state, optional native link, attrs/listeners, safe button default, focus() |
| [AppInput](src/components/base/AppInput.vue) | v-model, native validation/attrs/listeners, IME composition, focus() |
| [AppSelect](src/components/AppSelect.vue) | labeled single/multi selection, search, removable tags, elevated popup and keyboard scrolling |
| [AppIcon](src/components/Icons/AppIcon.js) | named decorative Lucide SVGs, shared stroke and size |
| [AppScrollArea](src/components/AppScrollArea.vue) | named native keyboard viewport, overlay handles, responsive measurements and cleanup |

Buttons/fields/selects and regular square icon controls are 32px tall on fine-pointer
desktop; compact removal actions use a 24px minimum click target.
Wiki links and close actions share the same icon-control geometry, focus and hover styles.
At <=600px or with any coarse pointer, controls and icon targets
are at least 44px. These are shared token changes, not separate per-page variants.
**New custom build** uses the same secondary button style as **Reset filters**, with a plus icon.
Consumer styles own composition/layout and game cues, not copies of base control styling.
Change repeated visual values in the token file; keep isolated geometric adjustments local.
The 900/600/480px media-query breakpoints remain literal because CSS custom properties
cannot be used in media-query conditions.

The portable [neon-dark-design skill](.github/skills/neon-dark-design/SKILL.md) captures
the visual language, component contracts, accessibility checks, responsive layout guidance,
and dropdown/scrollbar pitfalls. Its
[component contract](.github/skills/neon-dark-design/references/components.md) includes
API examples, dependencies and regression requirements. The skill bundles synchronized
[tokens](.github/skills/neon-dark-design/assets/design-tokens.css),
[base styles](.github/skills/neon-dark-design/assets/primitives.css),
[working Vue 2 components](.github/skills/neon-dark-design/assets/components/), and licence notices.
To reuse it for another site, copy the entire `neon-dark-design` folder into that
repository's `.github/skills/` (or your supported personal skills directory), ask the agent
to use the skill, and copy/adapt its starter into the new product as the contract describes.
No game assets, site aliases, store, router or other application code are needed.
For another framework, port the same API/behavior contracts rather than adding Vue.

When changing canonical tokens/styles/components, copy the changed source into the matching
skill asset in the same change. Tokens/base styles live at the asset root; component paths
mirror their paths under `src/components`. `npm test` checks exact starter synchronization,
template validity, token boundaries/references/cycles, skill metadata, text/rank/rarity
contrast, base control behavior and popup placement/cleanup.
The application never imports runtime styles or components from the skill directory.
Use [AppSelect.vue](src/components/AppSelect.vue) for every single- or multi-choice dropdown.
Its detached trigger and menu retain the same corner radius in closed, open and focused states;
the shared trigger selector overrides vue-multiselect's joined-menu corner reset.
Rarity is a secondary cue on cards; neon yellow marks actions, selection and keyboard focus.
Native controls use dark colour-scheme, reduced-motion preferences are respected, and no
external font or styling requests are needed. The compact gallery header leaves browsing
space available rather than reproducing a marketing-page hero.

Categories are informational labels in item details, not filter controls. Internal flags such as `AIBlacklist` are not displayed. All item and drone images are served from local assets using the configured deployment base path; browsing does not fetch images or catalogue data from third-party wikis.

Choose a **Survivor / role** to filter items and equipment to a starter build. Within each
rarity group, build priorities automatically order S, A, B, then unranked items: S is core,
A is synergy, and B is general support. Ties are alphabetical. Compact letter badges use
gold (S), teal (A), and blue (B), matching the build legend; these colours are independent
of item rarity. Uncheck **Recommended items only** to browse everything while keeping
build priorities visible. Search, rarity and version filters still apply, and clearing
the survivor restores the full catalogue subject to those filters. Drones remain visible
for built-in survivor presets without invented tier rankings; custom profiles filter
drones to the saved list.

Operator's named item recommendations follow the [Rogue Ranker Operator guide](https://rogueranker.com/operator-ror2/), with Spare Drone Parts given core priority. Support items and equipment are supplemental starter suggestions. Other survivors use curated starter presets, not rankings sourced from that guide or a universal tier list. Skill variants, difficulty, item stacks and DLC ownership can change the best pickup; selecting a survivor does not hide DLC items. Presets are maintained in [survivorBuilds.js](src/data/survivorBuilds.js).

**Hallowed Concepts builds:** Enforcer and Acolyte are available in the survivor selector.
Their curated starter priorities reflect [Enforcer's shield and close-range kit](https://riskofrain2.wiki.gg/wiki/Enforcer)
and [Acolyte's melee and healing-to-attack-speed mechanics](https://riskofrain2.wiki.gg/wiki/Acolyte),
not a definitive ranking. Acolyte's healing items improve attack speed rather than restoring health.

**Custom builds:** Choose **New custom build**, or click an item in the gallery and use
**Add to custom build** in the right details panel. The destination selector lets you add
items, equipment or drones to an existing list or create another. Profiles appear alongside survivors,
starting at **Custom 01**, **Custom 02**, and so on. Select a custom profile to rename it,
open or remove saved pickups, or toggle **Saved items only** to return to the full gallery.
Custom lists have no tier rankings. Names and item lists save automatically to this browser's
local storage; they do not sync across browsers or devices, and clearing site data removes them.
Use **Delete custom build** on a selected custom profile, then confirm (or cancel).
Deleting the selected profile returns to all survivors and removes it from both dropdowns.
Other profiles, filters and the next custom-build number are preserved.
The add-to-build section sits at the bottom of item details, after descriptions, stats and unlocks.
Storage failures show an explicit warning and retry button; unsaved changes remain in memory.
Unreadable saved data is not overwritten.

**Version filtering:** Select one or more expansions (or **Base game**) in the Version control.
Selections within Version are combined with OR; version, rarity, survivor and search filters
intersect. An empty selection includes everything. **Reset filters** clears all filters
without deleting custom builds.

**Drones:** The gallery has **Items**, **Equipments** and **Drones** sections. The drone
catalogue includes all 15 recruitable drones and turrets: 8 base-game entries and 7 from
Alloyed Collective. Click a drone to see its behavior, recruitment method, base stats and
source link, or add it to a custom profile. Summoned allies from survivor skills or items
are outside this interactable-drone list.

The requested [Fandom drone section](https://riskofrain2.fandom.com/wiki/Interactables#Drones)
returned HTTP 403 during research. No access protection was bypassed. Information and images
were instead checked against the accessible [community drone catalogue](https://riskofrain2.wiki.gg/wiki/Drones)
and its individual drone pages by scanning visible text and image links. Local images in
[public/drones](public/drones) retain their original names; each entry in
[drones.js](src/data/drones.js) records its article and image source. Descriptions are summaries,
not copied lore. Drone stats can vary with level, tier and patches; gold recruitment prices scale
with difficulty. Game artwork belongs to its respective owners.

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

### Validate changes

```
npm test
npm run lint -- --no-fix
npm run build
```

The regression tests use Node's assertions and the Babel compiler already supplied by Vue CLI, without an additional test framework. For newer Node versions with OpenSSL 3, this legacy Vue CLI / webpack build may need `NODE_OPTIONS=--openssl-legacy-provider` (PowerShell: `$env:NODE_OPTIONS='--openssl-legacy-provider'`).

### Catalog coverage and sources

The catalog includes Survivors of the Void, Seekers of the Storm, Alloyed Collective,
and Hallowed Concepts. On October 18, 2026, the original
[stefanuros/develop catalog](https://github.com/stefanuros/ror2-item-cheat-sheet/tree/develop)
and this fork both had 210 entries, with no Hallowed Concepts coverage.

The 38 Hallowed Concepts additions were checked against the
[wiki item tables](https://riskofrain2.wiki.gg/wiki/Items) and
[DLC overview](https://riskofrain2.wiki.gg/wiki/Hallowed_Concepts):
3 Boss items, 11 Hallowed items, 14 Hexes, 8 N'tormat Pages, 1 Lunar Equipment,
and 1 Elite Equipment. Descriptions summarize the documented mechanics and stacking;
each entry links to its source page. Item images and the DLC badge are hosted locally
and sourced from the wiki; game artwork belongs to its respective owners.

Hallowed items are primarily obtained by cleansing Hexes at a Hallowed Shrine.
Hexes are harmful until cleansed. N'tormat Pages unlock key-item rituals rather than
occupying the equipment slot; consumed Pages regenerate at the next stage.
All three new tiers can be filtered by rarity.

### Validate and publish

Use Node.js 20 (as in CI), then run:

```sh
npm ci
npm test
npm run test:catalog
npm run build
```

The existing [deployment workflow](.github/workflows/deploy.yml) builds pull requests
and publishes pushes to `main` to this fork's GitHub Pages site. It sets Vue's
public path to `/ror2-item-cheat-sheet/` so bundled assets work under the project URL.
