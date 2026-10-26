## Layout

### Responsive contract

Read adaptive presentation and layout bindings from the component contract's
`workspace`, `selection` and `interactionAlgorithms`. Resolve their token aliases
through the visual contract. Do not repeat breakpoint thresholds, panel widths,
popup limits or picker proportions in CSS or prose.

### Density and sizing

Read density factors and independent scale axes from the visual contract.
Apply a factor once at its consumption boundary; avoid nested percentage chains
or scaling a category with another category's factor. Preserve the contract's
protected interaction and structural dimensions.

### Token group: tokens.primitive.spacing (dimension)

| Token | Value | Description |
| --- | --- | --- |
| `none` | `0px` |  |
| `fine` | `2px` | Fine offsets and gaps; independent of stroke widths. |
| `extra-small` | `0.25rem` |  |
| `small` | `0.5rem` |  |
| `medium` | `0.75rem` |  |
| `large` | `1rem` |  |
| `extra-large` | `1.5rem` |  |
| `extra-extra-large` | `2rem` |  |
| `spacious` | `3rem` |  |
| `expansive` | `4rem` |  |

### Token group: tokens.primitive.size (dimension)

| Token | Value | Description |
| --- | --- | --- |
| `icon.small` | `1rem` |  |
| `icon.medium` | `1.25rem` |  |
| `icon.large` | `1.5rem` |  |
| `control.small` | `2rem` |  |
| `control.medium` | `2.75rem` |  |
| `artwork.small` | `3.25rem` |  |
| `artwork.medium` | `4rem` |  |
| `artwork.large` | `9.375rem` |  |
| `tile.small` | `5.125rem` |  |
| `tile.large` | `6rem` |  |

### Token group: tokens.primitive.layout (dimension)

| Token | Value | Description |
| --- | --- | --- |
| `inline-size.extra-small` | `15rem` |  |
| `inline-size.small` | `17rem` |  |
| `inline-size.medium` | `17.5rem` |  |
| `inline-size.large` | `21.25rem` |  |
| `inline-size.extra-large` | `28rem` |  |
| `block-size.large` | `40rem` |  |
| `inline-size.maximum` | `90rem` |  |
| `breakpoint.small` | `40rem` |  |
| `breakpoint.medium` | `56.25rem` |  |
| `breakpoint.large` | `80rem` |  |


### Token group: tokens.primitive.scale (number)

| Token | Value | Description |
| --- | --- | --- |
| `reduced` | `0.75` |  |
| `base` | `1` |  |
| `enlarged` | `1.25` |  |

### Token group: tokens.semantic.spacing (dimension)

| Token | Value | Description |
| --- | --- | --- |
| `inset.page` | `{primitive.spacing.large}` |  |
| `inset.page-wide` | `{primitive.spacing.extra-extra-large}` |  |
| `gap.grid` | `{primitive.spacing.medium}` |  |
| `gap.section` | `{primitive.spacing.extra-large}` |  |
| `inset.control-inline` | `{primitive.spacing.medium}` |  |
| `inset.control-block` | `{primitive.spacing.small}` |  |
| `inset.card` | `{primitive.spacing.medium}` |  |
| `gap.row` | `{primitive.spacing.medium}` |  |
| `inset.panel` | `{primitive.spacing.extra-large}` |  |
| `gap.icon` | `{primitive.spacing.small}` |  |
| `offset.focus-ring` | `{primitive.spacing.fine}` |  |

### Token group: tokens.semantic.size (dimension)

| Token | Value | Description |
| --- | --- | --- |
| `target.minimum` | `{primitive.size.control.medium}` |  |
| `control.minimum` | `{primitive.size.control.medium}` |  |
| `artwork.thumbnail` | `{primitive.size.artwork.small}` |  |
| `card.minimum` | `{primitive.size.tile.small}` |  |
| `artwork.featured` | `{primitive.size.artwork.large}` |  |
| `icon.small` | `{primitive.size.icon.small}` |  |
| `icon.medium` | `{primitive.size.icon.medium}` |  |
| `icon.large` | `{primitive.size.icon.large}` |  |

### Token group: tokens.semantic.layout (dimension)

| Token | Value | Description |
| --- | --- | --- |
| `grid.min-column` | `{primitive.layout.inline-size.medium}` |  |
| `navigation.inline-size` | `{primitive.layout.inline-size.small}` |  |
| `select.max-block-size` | `{primitive.layout.inline-size.extra-small}` |  |
| `picker.max-block-size` | `{primitive.layout.block-size.large}` |  |
| `panel.inline-size` | `{primitive.layout.inline-size.large}` |  |
| `panel.max-inline-size` | `{primitive.layout.inline-size.extra-large}` |  |
| `content.max-inline-size` | `{primitive.layout.inline-size.maximum}` |  |

### Token group: tokens.semantic.scale (number)

| Token | Value | Description |
| --- | --- | --- |
| `spacing` | `{primitive.scale.base}` |  |
| `size` | `{primitive.scale.base}` |  |
| `radius` | `{primitive.scale.base}` |  |
| `typography` | `{primitive.scale.base}` |  |

### Token group: tokens.context.density.comfortable (number)

| Token | Value | Description |
| --- | --- | --- |
| `spacing` | `{primitive.scale.base}` |  |
| `size` | `{primitive.scale.base}` |  |
| `radius` | `{primitive.scale.base}` |  |
| `typography` | `{primitive.scale.base}` |  |

### Token group: tokens.context.density.compact (number)

| Token | Value | Description |
| --- | --- | --- |
| `spacing` | `{primitive.scale.reduced}` |  |
| `size` | `{primitive.scale.reduced}` |  |
| `radius` | `{primitive.scale.reduced}` |  |
| `typography` | `{primitive.scale.base}` |  |
