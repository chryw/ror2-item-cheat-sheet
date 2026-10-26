### Iconography and artwork

Read `iconography` for role definitions, slot assignments, intrinsic geometry,
size bindings, stroke, directionality and usage. Initialize the reference wrapper
from that object. Do not copy its geometry or invent component-local glyphs.
Game artwork remains tenant content rather than part of the UI icon registry.

```yaml design:components.iconography
viewBox: 0 0 24 24
fill: none
lineCap: round
lineJoin: round
defaultSize: sm
sizes:
  sm: '{semantic.size.icon.small}'
  md: '{semantic.size.icon.medium}'
  lg: '{semantic.size.icon.large}'
stroke: '{semantic.stroke-width.icon}'
reference: >-
  The deployed fork uses Lucide through src/components/Icons/AppIcon.js. These local SVG
  reference glyphs keep the same line family; provider adapters may replace paths but must
  preserve role, geometry and semantics.
roles:
  search:
    usage: Leading search-field affordance
    mirror: false
    paths:
      - M10.5 3a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15M16 16l5 5
  menu:
    usage: Workspace filter disclosure
    mirror: false
    paths:
      - M4 6h16M4 12h16M4 18h16
  close:
    usage: Close panel/picker; remove selected value
    mirror: false
    paths:
      - M6 6l12 12M18 6 6 18
  clear:
    usage: Clear populated search field
    mirror: false
    paths:
      - M6 6l12 12M18 6 6 18
  chevron-down:
    usage: Selection control disclosure
    mirror: false
    paths:
      - m6 9 6 6 6-6
  check:
    usage: Selected option, separate from keyboard highlight
    mirror: false
    paths:
      - m5 12 4 4L19 6
  external-link:
    usage: External reference action; owner announces new tab
    mirror: false
    paths:
      - M14 3h7v7M21 3 10 14M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5
  reset:
    usage: Reset query/filter dimensions
    mirror: false
    paths:
      - M3 4v6h6M3 10a9 9 0 1 1 1 8
  add:
    usage: Create tenant-owned content such as a custom build
    mirror: false
    paths:
      - M12 5v14M5 12h14
  panel-navigation:
    usage: Navigate to related tenant workflow
    mirror: true
    paths:
      - M4 3h16v18H4zM9 3v18
  arrow-inline-end:
    usage: Move forward in reading direction
    mirror: true
    paths:
      - M5 12h14m-6-6 6 6-6 6
slots:
  filterDisclosure: menu
  searchLeading: search
  searchClear: clear
  selectDisclosure: chevron-down
  selectedOption: check
  removeValue: close
  closePanel: close
  closePicker: close
  resetFilters: reset
  externalReference: external-link
  createContent: add
```

### Asset catalog

The content manifest declares authoritative artwork sources and joins.
Use the exported asset mapping; do not reconstruct filenames from display names
or substitute unrelated images.
