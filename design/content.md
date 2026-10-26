### Definitive content and source plug-ins

Read [the content manifest](../design-content.json) before adapting a catalog.
It owns source revisions, record requirements, source joins, authority boundaries
and failure policy. This guide deliberately does not repeat paths, commit pins,
sample records or gameplay facts.

The [source adapter](../scripts/design-preview.cjs) returns normalized records and
provenance. The [content validator](../scripts/design-content.cjs) verifies them.
Components receive that projection; they do not interpret source modules or
enrich records from the network.

```yaml design:components.tenants
ror2:
  filterDimensions:
    - rarity:multi
    - version:multi
    - survivor/build:single
  filterLogic: >-
    OR within a dimension; AND across dimensions and search. Empty selection means all. Rarity
    detail action replaces only rarity.
  readOnlyMetadata:
    - category
  extensions:
    - survivor recommendations
    - custom-build persistence and editing
    - stacking statistics
    - drone recruitment/stats
  previewExclusions:
    - survivor recommendations
    - custom-build persistence and editing
minecraft:
  filterDimensions:
    - material:multi
    - usage:multi
  filterLogic: Same selection/filter composition; different terminology and data.
  readOnlyMetadata: []
  extensions: []
  previewExclusions:
    - authoritative gameplay database
```

```yaml design:components.interactionAlgorithms.ror2Catalog
- >-
  Maintain card hierarchy: source artwork, name, short effect and optional source metadata.
  Preserve full descriptions, line breaks, numeric precision and authored statistical formulas.
- >-
  Render applicable unlock/drop information, equipment cooldown, public category labels,
  stacking statistics and drone attributes without fabricating absent fields. Statistics use
  real table headers and a labeled independent scroll region when needed.
- >-
  Search name and both description fields case-insensitively. Use OR within a filter dimension
  and AND across dimensions/search. Rarity detail action replaces only rarity; categories are
  read-only and grouping/order comes from the tenant taxonomy.
- >-
  Keep section counts and section-specific empty states even when one section has no matches.
  Reset query/filter dimensions atomically without changing unrelated preferences or desktop
  detail selection.
- >-
  Survivor recommendations and user-build editing/persistence remain tenant workflows governed
  by the content manifest and explicit preview exclusions.
```

### Localization and content

The content manifest owns the boundary between UI messages, locale overlays and
canonical gameplay records. The reference UI message catalog below is compiled
into the component contract; adapters consume it and apply explicit tenant/locale
overlays. Keep placeholder names stable. Never translate identifiers or fabricate
gameplay descriptions. A production localization adapter replaces the delivery
mechanism, not the authoritative gameplay catalog.

```yaml design:components.messages
filters: Filters
close: Close
search: Search items
rarity: Rarity
category: Category
all: All
allRarities: All rarities
allVersions: All versions
allCategories: All categories
sort: Sort by
name: Name
density: Density
comfortable: Comfortable
compact: Compact
empty: No matching entries
examples: Validation examples
detail: View details
showFilters: Show filters
hideFilters: Hide filters
closeDetails: Close item details
resetFilters: Reset filters
version: Version
apply: Apply
cancel: Cancel
clear: Clear
noOptions: No matching options.
selectedCount: '{count} selected. Choose any that apply.'
chooseOne: Choose one option.
searchOptions: Search {label}
removeValue: Remove {label} {value}
filterByGroup: Filter by {value}
resultCount: '{count} matching entries'
statistics: Item stacking
stat: Stat
value: Value
stack: Stack
add: Add
wiki: Open reference (opens in a new tab)
unlock: Unlock
dropsFrom: Drops from
cooldown: Cooldown
closePicker: Close {label} picker
clearSearch: Clear search
searchPlaceholder: Name or description...
clearDimension: Clear {label}
imageUnavailable: Image unavailable
gallery: Pickup gallery
acquisition: Recruitment
health: Health
damage: Damage / healing
armor: Armor
speed: Speed
subtitle: Items, equipment, drones, and survivor builds.
```
