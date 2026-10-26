## Components

The component sections below define anatomy, state, behavior and visual bindings.
Reference implementations live in
[the shared component module](../scripts/design-components.mjs) and
[preview composition](../scripts/design-preview.js); they implement the contract
rather than owning an independent set of design choices.

### Shared control and state contract

Implement the following definitions rather than inferring controls from
screenshots. Component aliases keep visual decisions out of control logic.

### Token group: tokens.component.card (alias)

| Token | Value | Description |
| --- | --- | --- |
| `color.background` | `{semantic.color.neutral.background.panel}` |  |
| `color.foreground` | `{semantic.color.neutral.foreground.primary}` |  |
| `typography` | `{semantic.typography.body.small}` |  |
| `radius` | `{semantic.radius.card}` |  |
| `spacing.padding` | `{semantic.spacing.inset.card}` |  |
| `size.artwork` | `{semantic.size.artwork.thumbnail}` |  |
| `size.min-block` | `{semantic.size.card.minimum}` |  |

### Token group: tokens.component.control (alias)

| Token | Value | Description |
| --- | --- | --- |
| `color.background` | `{semantic.color.neutral.background.control.rest}` |  |
| `color.foreground` | `{semantic.color.neutral.foreground.primary}` |  |
| `typography` | `{semantic.typography.body.medium}` |  |
| `radius` | `{semantic.radius.control}` |  |
| `spacing.padding-inline` | `{semantic.spacing.inset.control-inline}` |  |
| `size.min-block` | `{semantic.size.control.minimum}` |  |
| `state.hover.color.background` | `{semantic.color.neutral.background.control.hover}` |  |
| `state.pressed.color.background` | `{semantic.color.neutral.background.control.pressed}` |  |
| `state.selected.color.background` | `{semantic.color.neutral.background.control.selected}` |  |
| `state.selected.color.foreground` | `{semantic.color.brand.foreground.control.selected}` |  |
| `state.disabled.color.background` | `{semantic.color.neutral.background.control.disabled}` |  |
| `state.disabled.color.foreground` | `{semantic.color.neutral.foreground.disabled}` |  |





### Token group: tokens.component.button (alias)

| Token | Value | Description |
| --- | --- | --- |
| `variant.primary.color.background` | `{semantic.color.brand.background.solid.rest}` |  |
| `variant.primary.color.foreground` | `{semantic.color.neutral.foreground.on-brand}` |  |
| `color.background` | `{component.control.color.background}` |  |
| `color.foreground` | `{component.control.color.foreground}` |  |
| `typography` | `{semantic.typography.label}` |  |
| `radius` | `{component.control.radius}` |  |
| `spacing.padding-inline` | `{component.control.spacing.padding-inline}` |  |
| `size.min-block` | `{component.control.size.min-block}` |  |


### Token group: tokens.component.icon-button (alias)

| Token | Value | Description |
| --- | --- | --- |
| `color.background` | `{component.button.color.background}` |  |
| `color.foreground` | `{component.button.color.foreground}` |  |
| `radius` | `{semantic.radius.chip}` |  |
| `size.inline` | `{semantic.size.target.minimum}` |  |
| `size.min-block` | `{semantic.size.target.minimum}` |  |
| `size.icon` | `{semantic.size.icon.medium}` |  |

### Token group: tokens.component.searchbox (alias)

| Token | Value | Description |
| --- | --- | --- |
| `color.background` | `{component.control.color.background}` |  |
| `color.foreground` | `{component.control.color.foreground}` |  |
| `typography` | `{component.control.typography}` |  |
| `radius` | `{component.control.radius}` |  |
| `spacing.padding-inline` | `{component.control.spacing.padding-inline}` |  |
| `size.min-block` | `{component.control.size.min-block}` |  |

### Token group: tokens.component.select (alias)

| Token | Value | Description |
| --- | --- | --- |
| `color.background` | `{component.control.color.background}` |  |
| `color.foreground` | `{component.control.color.foreground}` |  |
| `typography` | `{component.control.typography}` |  |
| `radius` | `{component.control.radius}` |  |
| `spacing.padding-inline` | `{component.control.spacing.padding-inline}` |  |
| `size.min-block` | `{component.control.size.min-block}` |  |
| `part.option.state.selected.color.background` | `{component.control.state.selected.color.background}` |  |
| `part.option.state.selected.color.foreground` | `{component.control.state.selected.color.foreground}` |  |


### Token group: tokens.component.filter-chip (alias)

| Token | Value | Description |
| --- | --- | --- |
| `color.background` | `{component.control.color.background}` |  |
| `color.foreground` | `{component.control.color.foreground}` |  |
| `typography` | `{semantic.typography.label}` |  |
| `radius` | `{semantic.radius.chip}` |  |
| `spacing.padding-inline` | `{semantic.spacing.gap.icon}` |  |
| `state.selected.color.background` | `{component.control.state.selected.color.background}` |  |
| `state.selected.color.foreground` | `{component.control.state.selected.color.foreground}` |  |


### Token group: tokens.component.toggle (alias)

| Token | Value | Description |
| --- | --- | --- |
| `color.background` | `{component.control.color.background}` |  |
| `color.foreground` | `{component.control.color.foreground}` |  |
| `radius` | `{component.control.radius}` |  |
| `size.min-block` | `{semantic.size.target.minimum}` |  |
| `state.selected.color.background` | `{component.control.state.selected.color.background}` |  |
| `state.selected.color.foreground` | `{component.control.state.selected.color.foreground}` |  |


### Token group: tokens.component.data-table (alias)

| Token | Value | Description |
| --- | --- | --- |
| `color.background` | `{semantic.color.neutral.background.panel}` |  |
| `color.foreground` | `{semantic.color.neutral.foreground.primary}` |  |
| `typography` | `{semantic.typography.body.medium}` | Readable source facts, independent of compact header labels. |
| `spacing.padding-block` | `{semantic.spacing.inset.cell-block}` | Compact rows grow with wrapping content. |
| `spacing.padding-inline` | `{semantic.spacing.inset.cell-inline}` |  |
| `part.header.typography` | `{semantic.typography.label}` |  |
| `part.row.variant.alternate.color.background` | `{semantic.color.neutral.background.canvas}` |  |


### Token group: tokens.component.label (alias)

| Token | Value | Description |
| --- | --- | --- |
| `color.foreground` | `{semantic.color.neutral.foreground.secondary}` |  |
| `typography` | `{semantic.typography.label}` |  |

### Token group: tokens.component.hyperlink (alias)

| Token | Value | Description |
| --- | --- | --- |
| `color.foreground` | `{semantic.color.brand.foreground.link.rest}` |  |
| `typography` | `{semantic.typography.body.medium}` |  |

### Token group: tokens.component.panel (alias)

| Token | Value | Description |
| --- | --- | --- |
| `color.background` | `{semantic.color.neutral.background.panel}` |  |
| `color.foreground` | `{semantic.color.neutral.foreground.primary}` |  |
| `spacing.padding` | `{semantic.spacing.inset.panel}` |  |
| `size.inline` | `{semantic.layout.panel.inline-size}` |  |

### Token group: tokens.component.navigation (alias)

| Token | Value | Description |
| --- | --- | --- |
| `color.background` | `{component.panel.color.background}` |  |
| `color.foreground` | `{component.panel.color.foreground}` |  |
| `size.inline` | `{semantic.layout.navigation.inline-size}` |  |


### Token group: tokens.component.dialog (alias)

| Token | Value | Description |
| --- | --- | --- |
| `color.background` | `{semantic.color.neutral.background.panel}` |  |
| `color.foreground` | `{semantic.color.neutral.foreground.primary}` |  |
| `radius` | `{semantic.radius.dialog}` |  |
| `spacing.padding` | `{semantic.spacing.inset.panel}` |  |

```yaml design:components
version: 1
description: >-
  Framework-independent component and composition contracts authored in design.md. Visual
  decisions use token aliases; domain data belongs to tenants.
```
