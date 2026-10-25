# Risk of Rain 2 Field Guide

[![Deploy to GitHub Pages](https://github.com/chryw/ror2-item-cheat-sheet/actions/workflows/deploy.yml/badge.svg)](https://github.com/chryw/ror2-item-cheat-sheet/actions/workflows/deploy.yml)

[Open Risk of Rain 2 Field Guide](https://chryw.github.io/ror2-item-cheat-sheet/)

This website is an item cheat sheet for the game Risk of Rain 2 (RoR2). In RoR2, progressing through levels gives the player the ability to gain many items. Each item has a different stat it boosts and a different ability. With 248 catalog entries, it can get difficult to determine if you want to pick up each item. This website gives an easy way to see what items do at a glance. Clicking on an item gives a more in depth view of the item, along with links to the relevant wiki page.

The technology used for this project was Vue and Vuex. 

There are 3 sections on the website. The navbar, the item list, and the sidebar. 

The navbar alters the item list to make it easier for the user to navigate the item list. It has functionality like searching for specific items, sorting the items, and filtering out specific types of items. 

The persistent header uses one **Risk of Rain 2 Field Guide** H1 on desktop and mobile,
matching the browser-tab title. A smaller, muted subtitle describes the reference:
**Items, equipment, drones, and survivor builds.** There is no competing slogan or hero;
catalogue sections and build names are subordinate headings. The product header does not
scroll with the gallery, and the catalogue starts directly below it.

Navigation starts collapsed. On desktop (above 900px), the header contains a
labelled **Filters** button beside the product identity. The button opens a docked left panel;
collapsing it reclaims the entire width instead of leaving an empty icon rail.
The panel has a clear heading and close action, and its header stays visible while scrolling.
Escape closes the panel and restores focus to the header button without clearing selections.
Desktop panels are non-modal: the gallery remains usable and Tab is not trapped.
On narrower screens the hamburger shares the same product header, and filters open in a
full-width overlay panel instead of consuming a dedicated row or shrinking the gallery.
The header is flush with
the viewport edge, with no gap for scrolling content to show through.
Press Escape or use the panel's hamburger to close it. Outside-click dismissal recognizes
dropdown menus belonging to the panel. Choosing a survivor/custom build or creating a build returns
to the gallery on mobile. Collapsing never clears your filters or saved lists.
Search, sort, rarity and version controls narrow the catalogue; **Reset filters** restores it.

Mobile item details fill the entire viewport, including tablet and landscape layouts
up to 900px. The close/wiki row stays sticky while the details scroll. Closing restores
focus to the originating pickup, and **View custom build** closes mobile details and
returns to the build editor; desktop keeps its side-by-side details panel.
Mobile drawers/details move focus into the panel, contain keyboard focus, support Escape,
and make the underlying gallery and product header inert. The compact product header stays
accessible while browsing long result lists.
Navigation, gallery and details use [AppScrollArea.vue](src/components/AppScrollArea.vue),
a shared [OverlayScrollbars](https://github.com/KingSora/OverlayScrollbars) wrapper.
The themed, draggable scrollbars overlay the content edge: they reserve no gutter and
do not change panel or content widths when overflow appears. Wheel, touch and keyboard
scrolling continue to use the native scroll viewport.
Its MIT notice is distributed in [overlayscrollbars-license.txt](public/overlayscrollbars-license.txt).

All dropdowns use [AppSelect.vue](src/components/AppSelect.vue), a shared wrapper around
vue-multiselect: survivor, sort, rarity, version and custom-build destination. Menus open
in a fixed, z-indexed popup layer outside the scrolling panels, anchored to their control.
They flip above near viewport edges and reposition on resize/scroll. Opening a menu never
changes its container's height, scroll range or sibling positions. Role names have no added suffixes.

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

Catalogue cards use neutral borders on every edge. A small square swatch and a compact,
coloured rarity label below the description carry the existing rarity palette without
decorative edge stripes. The written label and accessible rarity description keep colour
from being the only cue. Hover and selected-card outlines remain neutral/interaction cues,
not rarity colours.

### Visual system

The dark appearance takes high-level inspiration from [Electric](https://electric.ax/):
layered charcoal surfaces, warm off-white typography, fine borders, rounded panels and
restrained accent usage. Our accent is neon yellow, not cyan. The layout, components and
styles are original; no Electric artwork, fonts or source styles are bundled.

[design-tokens.css](src/assets/design-tokens.css) is the canonical token-only stylesheet:
semantic colours, typography, spacing, radii, borders, focus, icon sizes/stroke, control
dimensions, layout/media scales, status colours and a generic colour palette.
It contains no game concepts.
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
| [AppButton](src/components/base/AppButton.vue) | secondary/primary/danger/ghost, icon-only, native attrs/listeners, safe button default, focus() |
| [AppInput](src/components/base/AppInput.vue) | v-model, native validation/attrs/listeners, IME composition, focus() |
| [AppSelect](src/components/AppSelect.vue) | labeled single/multi selection, search, removable tags, elevated popup and keyboard scrolling |
| [AppIcon](src/components/Icons/AppIcon.js) | named decorative Lucide SVGs, shared stroke and size |
| [AppScrollArea](src/components/AppScrollArea.vue) | named native keyboard viewport, overlay handles, responsive measurements and cleanup |

Buttons/fields/selects are 32px tall on fine-pointer desktop; icon controls use a
24px minimum click target. At <=600px or with any coarse pointer, controls and icon targets
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

Choose a **Survivor / role** to filter items and equipment to a starter build. This also selects **Build tier (S / A / B)** sorting: S is core, A is synergy, and B is general support. Ties are alphabetical. Compact letter badges use gold (S), teal (A), and blue (B), matching the build legend; these colours are independent of item rarity. Uncheck **Recommended items only** to browse everything while keeping build priorities visible (unranked items sort last). Search, rarity and version filters still apply, and clearing the survivor restores the full catalogue subject to those filters. Drones remain visible for built-in survivor presets without invented tier rankings; custom profiles filter drones to the saved list.

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
