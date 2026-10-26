## Elevation & Depth

Use visual aliases for elevation treatments and the workspace contract for
surface ordering. Surface ownership and dismissal are interaction concerns,
not colors or arbitrary per-component stacking constants.

### Token group: tokens.primitive.elevation (dimension)

| Token | Value | Description |
| --- | --- | --- |
| `raised.offset` | `2px` |  |
| `raised.blur` | `8px` |  |
| `overlay.offset` | `8px` |  |
| `overlay.blur` | `24px` |  |

### Token group: tokens.primitive.opacity (number)

| Token | Value | Description |
| --- | --- | --- |
| `subtle` | `0.8` |  |

## Shapes

Use the visual contract's geometry roles. Do not introduce a local radius,
stroke or spacing literal to approximate a referenced token.

### Token group: tokens.primitive.stroke-width (dimension)

| Token | Value | Description |
| --- | --- | --- |
| `thin` | `1px` |  |
| `medium` | `1.75px` |  |
| `thick` | `2px` |  |

### Token group: tokens.primitive.radius (dimension)

| Token | Value | Description |
| --- | --- | --- |
| `none` | `0px` |  |
| `small` | `0.375rem` |  |
| `medium` | `0.625rem` |  |
| `large` | `1rem` |  |
| `full` | `999rem` |  |

### Token group: tokens.semantic.stroke-width (dimension)

| Token | Value | Description |
| --- | --- | --- |
| `control` | `{primitive.stroke-width.thin}` |  |
| `selected` | `{primitive.stroke-width.thick}` |  |
| `focus-ring` | `{primitive.stroke-width.thick}` |  |
| `icon` | `{primitive.stroke-width.medium}` |  |

### Token group: tokens.semantic.radius (dimension)

| Token | Value | Description |
| --- | --- | --- |
| `card` | `{primitive.radius.medium}` |  |
| `control` | `{primitive.radius.medium}` |  |
| `chip` | `{primitive.radius.full}` |  |
| `dialog` | `{primitive.radius.large}` |  |
