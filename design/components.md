#### button

```yaml design:components.components.button
element: button
anatomy:
  - accessible name
  - optional icon
  - optional visible label
inputs:
  - type=button|submit|reset
  - variant=secondary|primary|danger|ghost
  - size=regular|compact
  - icon role
  - iconOnly
  - collapseLabel
  - disabled
  - optional pressed
  - optional expanded/controls
states:
  - rest
  - hover
  - pressed
  - focus-visible
  - disabled
  - selected
tokens:
  - component.button.color.background
  - component.button.color.foreground
  - component.button.radius
  - component.button.size.min-block
  - component.button.variant.primary.color.background
  - component.button.variant.primary.color.foreground
rules: >-
  Native activation; default type=button. Disabled cannot activate. Pressed is transient;
  selected persists. Use aria-pressed only for toggles and aria-expanded for disclosures.
```

#### label

```yaml design:components.components.label
element: label
anatomy:
  - visible text
  - control association
  - optional hint/error association
inputs:
  - for
  - text
  - optional describedby
states:
  - rest
  - invalid
tokens:
  - component.label.color.foreground
  - component.label.typography
rules: >-
  Associate for/id with the actual active control, including after adaptive mode changes.
  Placeholder is not a label. Associate hints/errors using aria-describedby.
```

#### searchbox

```yaml design:components.components.searchbox
element: input[type=search]
anatomy:
  - label
  - single bordered field
  - leading search icon
  - search input
  - optional clear action
inputs:
  - id
  - label
  - value
  - onInput
states:
  - empty
  - populated
  - focus-visible
  - disabled
  - invalid
tokens:
  - component.searchbox.color.background
  - component.searchbox.color.foreground
  - component.searchbox.radius
rules: >-
  Commit local queries on input, not only Enter/blur. Preserve query across panel close and
  resize. Never submit the surrounding form or fabricate loading. Announce result counts
  politely.
```

#### select

```yaml design:components.components.select
element: editable combobox/listbox or dialog trigger
anatomy:
  - label
  - compound bordered control containing wrapping selected pills and input
  - trailing chevron
  - clear-dimension action outside control
  - owned option surface
  - picker actions
inputs:
  - id
  - label
  - options(value,label)
  - value
  - multiple
  - disabled
  - onChange
states:
  - closed
  - popup-open
  - picker-open
  - draft-changed
  - disabled
  - empty-options
tokens:
  - component.select.color.background
  - component.select.radius
  - component.select.part.option.state.selected.color.background
  - semantic.layout.select.max-block-size
rules: >-
  Fine-pointer desktop commits immediately; multi-select remains open. Narrow/coarse input uses
  a staged modal picker. Cancel/Escape/backdrop discard drafts; Apply commits once. Mode change
  dismisses without committing. Escape closes only the owning surface.
```

#### card

```yaml design:components.components.card
element: selection control
anatomy:
  - artwork
  - name
  - summary
  - optional metadata
inputs:
  - stable id
  - name
  - summary
  - selected
  - onSelect
states:
  - rest
  - hover
  - pressed
  - focus-visible
  - selected
tokens:
  - component.card.color.background
  - component.card.spacing.padding
  - component.card.size.min-block
rules: >-
  One action and one tab stop; no nested controls. Enter/Space select; repeated activation does
  not toggle details off. Selection is keyed by data identity, survives rerender, and clears
  when details close.
```

#### hyperlink

```yaml design:components.components.hyperlink
element: a[href]
anatomy:
  - descriptive name
  - optional external indicator
inputs:
  - href
  - text
  - optional target
states:
  - rest
  - hover
  - focus-visible
  - current
tokens:
  - component.hyperlink.color.foreground
  - component.hyperlink.typography
rules: >-
  Navigation is an anchor, not a button click handler. Preserve native keyboard, context-menu
  and open-in-new-tab behavior. New tabs use noopener noreferrer. Reject executable URL schemes.
```

#### navigation

```yaml design:components.components.navigation
element: nav
anatomy:
  - named region
  - disclosure trigger
  - scrollable controls
inputs:
  - id
  - accessible name
  - open
  - onClose
states:
  - collapsed
  - docked
  - compact-overlay
tokens:
  - component.navigation.color.background
  - component.navigation.size.inline
rules: >-
  Desktop participates in layout without trapping focus. Compact overlays the workspace below
  the header; gallery is inert and the header trigger participates in the focus loop. Closing
  restores trigger focus; state is not reset.
```

#### icon

```yaml design:components.components.icon
element: svg
anatomy:
  - fixed square box
  - role-mapped paths
inputs:
  - role
  - size=sm|md|lg
states:
  - inherited foreground
  - direction-aware
tokens:
  - semantic.size.icon.small
  - semantic.size.icon.medium
  - semantic.size.icon.large
  - semantic.stroke-width.icon
rules: >-
  Use iconography.roles, never Unicode or emoji substitutes. UI icons inherit currentColor and
  are aria-hidden/focusable=false; the owner supplies the localized name. Icon dimensions do not
  shrink the interactive target. Game artwork and DLC marks are separate tenant assets.
```

#### filter-chip

```yaml design:components.components.filter-chip
element: span with button
anatomy:
  - value label
  - centered icon-only removal button
inputs:
  - value
  - label
  - localized removal name
  - onRemove
states:
  - selected
  - remove-hover
  - remove-focus-visible
  - disabled
tokens:
  - component.filter-chip.color.background
  - component.filter-chip.color.foreground
  - component.filter-chip.state.selected.color.background
  - component.filter-chip.state.selected.color.foreground
  - component.filter-chip.radius
  - semantic.size.target.minimum
rules: >-
  Place inside the compound multi-select field; wrap without overlapping the chevron. Only the
  remove button is interactive. Removal commits immediately on desktop and restores focus to the
  combobox; do not create a nested button or one combined text/glyph label.
```

#### panel

```yaml design:components.components.panel
element: named region or modal dialog
anatomy:
  - persistent header/close action
  - independent scroll body
  - optional footer actions
inputs:
  - id
  - accessible name
  - open
  - presentation
  - onClose
states:
  - closed
  - docked
  - modal
tokens:
  - component.panel.color.background
  - component.panel.color.foreground
  - component.panel.spacing.padding
  - component.panel.size.inline
rules: >-
  Reuse one content instance across presentations. Docked details do not steal or trap focus.
  Compact details cover the viewport, make the background inert and contain focus; close returns
  to the origin or gallery fallback.
```

```yaml design:components.controlRecipes
button: >-
  Inline-flex, centered icon/label, icon gap token. Primary is solid brand with on-brand text;
  selected disclosure is selected surface, not primary. Ghost has transparent rest
  border/background. Icon-only is square and at least the interaction-target minimum; compact
  never reduces that minimum. Collapse only visible label at compact breakpoint; keep localized
  accessible name.
searchbox: >-
  One focus-within border; leading small icon is not a separate button. Input reserves icon and
  clear space. Trailing clear is present only when populated, clears once on activation and
  returns input focus. Suppress the duplicate native cancel glyph when custom clear is supplied.
select: >-
  Desktop pills and editable input share one border/focus-within ring, never stacked independent
  fields. Chevron is centered at inline-end; reserve its column when pills wrap. Each pill has a
  separate centered remove target. Clear-dimension is below the field, not another pill. Compact
  trigger shows joined selected labels or placeholder plus the same chevron; it never exposes
  stale desktop removal targets.
picker: >-
  Header groups title/selection summary with icon-only close. Body scrolls independently. Footer
  places optional Clear at inline-start and Cancel/solid-primary Apply at inline-end. Checked
  rows have selected surface plus native checkbox/radio. Closing never applies a draft.
detailActions: >-
  External reference and close use small role icons in full-sized hit targets; catalog ID
  remains text metadata. No textual Close replacing the close icon, and no decorative art used
  as a control glyph.
```
