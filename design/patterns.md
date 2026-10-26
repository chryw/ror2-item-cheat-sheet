### Adaptive lookup workspace

Read `workspace` together with `interactionAlgorithms.workspaceState`.
The contract separates component behavior from relationships between surfaces.
A framework adapter may change its internal structure but must preserve the
specified observable behavior.

```yaml design:components.workspace
compactMax: '{primitive.layout.breakpoint.medium}'
navigationWidth: '{component.navigation.size.inline-size}'
detailsWidth: '{component.panel.size.inline-size}'
scrollbarWidth: none
stack:
  - base
  - header
  - navigation
  - details
  - popover
transitions:
  - - open-navigation
    - Dock on desktop; overlay only the workspace on compact; retain query/filter state.
  - - select-entry
    - >-
      Keep desktop navigation open; on compact close navigation and focus the detail close
      action.
  - - close-details
    - Clear selection, not filters; restore originating card or gallery when unavailable.
  - - breakpoint-change
    - >-
      Close navigation and owned pickers, discard drafts, retain committed
      filters/selection/scroll, adapt a single detail view.
  - - escape
    - >-
      Dismiss the innermost picker/popup first; otherwise navigation, then compact details.
      Desktop docked details require explicit close.
  - - reset-filters
    - >-
      Reset query and filter dimensions together; do not change density or close desktop
      details.
```

```yaml design:components.interactionAlgorithms.workspaceState
- >-
  Maintain independent navigation-open, selected-entry identity, committed filter values, query,
  density and gallery-scroll state; do not represent every surface with one modal-open flag.
- >-
  Compose one header and one min-size-zero workspace containing navigation, gallery and details
  in reading order. Gallery, navigation and details own independent scroll bodies; the document
  does not own catalog scrolling.
- >-
  Apply workspace scrollbarWidth to those scrollports, without reserving an extra gutter.
  Retain wheel, touch and keyboard scrolling and named focusable regions. In forced-colors
  mode restore native automatic scrollbars; never hide a scroll region itself.
- >-
  Resolve workspace widths and compact presentation from workspace token aliases. Reuse one
  detail-content instance across presentations; do not retain hidden focusable copies.
- >-
  Restore focus to the live visible originating card by stable identity, not a detached DOM
  reference. If unavailable, focus the named gallery with preventScroll. Preserve scroll unless
  navigation deliberately moves to results; clamp only when content becomes shorter.
- >-
  Compact navigation overlays only the workspace. Keep the header operable and include its
  disclosure in the Tab loop. Compact details make header, navigation and gallery inert and
  expose a named modal dialog. Docked details do not trap or steal focus.
- >-
  Dismiss the innermost owned option surface first and consume its Escape. Otherwise close
  navigation, then compact details. Docked desktop details require explicit close and do not
  dismiss on gallery interaction.
- >-
  Presentation changes close navigation and owned surfaces, discard drafts, preserve committed
  filters, selection and scroll, and transfer focus to the active presentation.
```

### Select and picker state machine

Read `selection`, `components.select` and the selection, combobox and geometry
algorithms in the component contract. These own policy and state transitions.
The reference adapter reads those policies; it must not introduce alternative
per-tenant interaction rules.

```yaml design:components.selection
optionSearchThreshold: 8
coarsePointerPicker: true
desktopCommit: immediate
pickerCommit: apply
pickerViewportFraction: 0.8
pickerMaxBlockSize: '{semantic.layout.picker.max-block-size}'
popupMaxBlockSize: '{semantic.layout.select.max-block-size}'
popupGap: '{primitive.spacing.extra-small}'
viewportInset: '{primitive.spacing.small}'
```

```yaml design:components.interactionAlgorithms.selectionState
- >-
  Keep committed value, draft value, option query and highlighted option separate. Store stable
  option values, never translated labels. Multiple selection is an array; single selection is a
  string with an explicit empty option only when provided by the tenant.
- >-
  Desktop open owns a listbox, resets option query and synchronizes highlighting. Choosing a
  single value commits once and closes; choosing multiple values commits immediately and keeps
  the popup open.
- >-
  Popup Escape, outside interaction and Tab close the popup without reverting committed changes.
  Escape is consumed; Tab proceeds normally.
- >-
  Picker open copies committed values into a draft, resets option search/scroll and focuses the
  title. Choice and Clear change only the draft. Apply commits a copy once; Cancel, close,
  Escape and backdrop discard without emitting a value change.
- >-
  On mode change, dismiss the owned surface without committing and focus the newly active
  control. External set/reset invalidates an outstanding draft.
- >-
  Removing a committed value changes only that value, restores combobox focus and never submits
  a form or toggles a parent disclosure.
```

```yaml design:components.interactionAlgorithms.comboboxSemantics
- >-
  Associate the label with the active control. An editable combobox exposes aria-expanded,
  aria-controls and aria-autocomplete=list; aria-activedescendant names a real active option
  only while applicable.
- >-
  Listbox options expose role=option and aria-selected; multiple lists expose
  aria-multiselectable. Selected, highlighted and focused are separate states with a non-color
  selection mark.
- >-
  Arrow keys move the highlight and keep it visible; Enter selects. Space is text input, not
  selection. Tab leaves the control rather than trapping focus.
```

```yaml design:components.interactionAlgorithms.optionSurfaceGeometry
- >-
  Portal popups outside clipped scroll panels, within the owning modal's top layer when
  applicable. Anchor to the compound field; constrain width/insets to the viewport, prefer below
  and flip above when more usable room exists.
- >-
  Resolve popup gap, inset and maximum block size from selection aliases. Scroll choices
  independently, reposition on scroll/resize and close when the anchor leaves its scrollport. Do
  not enlarge navigation to fit the popup.
- >-
  Picker choices are native labeled checkboxes/radios in a fieldset. Use the configured
  option-search threshold and explicit zero-match feedback. Let the body shrink before
  persistent header/footer and respect visualViewport and safe-area insets.
```

### Behavior acceptance contract

The component contract's `acceptance` entries identify required outcomes.
[Browser probes](../scripts/design-interactions.browser.mjs) and
[component tests](../scripts/design-components.test.cjs) exercise those outcomes.
Tests may contain expected values as assertions, but those expectations are not
an alternative configuration source.

```yaml design:components.acceptance
- id: desktop-panels
  mode: wide/fine
  then: >-
    Filters and details coexist as docked regions, gallery reflows and remains operable; no
    modal or focus trap.
- id: compact-panels
  mode: narrow
  then: >-
    Navigation overlays below header; detail covers viewport; only intended background is inert;
    focus cycles and returns.
- id: popup-multi
  mode: wide/fine
  then: >-
    Arrow navigation and Enter toggle options, commit immediately, retain popup, show removable
    values; Escape closes only popup.
- id: picker-transaction
  mode: narrow or coarse
  then: >-
    Checkbox/radio choices change draft only; Cancel/Escape/backdrop discard; Apply commits
    once; Clear is staged too.
- id: mode-transition
  mode: cross-boundary
  then: >-
    Open surfaces close without draft leakage; committed filters, detail identity and gallery
    position survive; no hidden focused node or duplicate panel.
- id: filter-composition
  mode: all
  then: >-
    Multi-value OR, cross-dimension AND, full-description search, atomic reset and section-level
    zero counts work.
- id: selection-lifecycle
  mode: all
  then: >-
    Enter/Space select one stable id, rerender keeps pressed state, close clears it and
    missing-origin focus falls back safely.
- id: control-semantics
  mode: all
  then: >-
    Native buttons/links/labels work, disabled controls do not activate, toggles/disclosures
    expose distinct state, and clear/remove actions do not submit forms.
- id: geometry-and-scroll
  mode: 375/768/900/901/1280/1920
  then: >-
    No horizontal document overflow; panel regions scroll independently; popups avoid clipping
    and viewport edges; picker actions remain visible.
- id: icon-and-control-anatomy
  mode: all
  then: >-
    Role-mapped SVG icons, localized icon-action names, reserved icon space, compound
    multi-select pills, grouped picker actions, expansion artwork/labels, read-only category
    chips and readable source statistics reproduce the control recipes.
- id: definitive-content
  mode: build
  then: >-
    Declared tenant source revision, canonical IDs, prose, numeric precision, taxonomies and
    local assets are validated; no fabricated records, runtime enrichment or
    authoritative/sample fallback.
```
