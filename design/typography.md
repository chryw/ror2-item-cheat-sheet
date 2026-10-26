## Typography

Consume the typography roles in the visual contract as complete styles.
Typography, spacing and element size are separate categories, even when some
values happen to coincide. UI copy and gameplay descriptions are not typography
tokens.

### Token group: tokens.primitive.typography.font-family (fontFamily)

| Token | Value | Description |
| --- | --- | --- |
| `sans-serif` | `["Segoe UI","Inter","-apple-system","BlinkMacSystemFont","sans-serif"]` |  |
| `monospace` | `["SFMono-Regular","Consolas","Liberation Mono","monospace"]` |  |

### Token group: tokens.primitive.typography.font-size (dimension)

| Token | Value | Description |
| --- | --- | --- |
| `extra-small` | `0.75rem` |  |
| `small` | `0.875rem` |  |
| `medium` | `1rem` |  |
| `large` | `1.25rem` |  |
| `extra-large` | `1.5rem` |  |
| `double-extra-large` | `2rem` |  |

### Token group: tokens.primitive.typography.font-weight (fontWeight)

| Token | Value | Description |
| --- | --- | --- |
| `regular` | `400` |  |
| `medium` | `500` |  |
| `semibold` | `600` |  |
| `bold` | `700` |  |

### Token group: tokens.primitive.typography.line-height (number)

| Token | Value | Description |
| --- | --- | --- |
| `tight` | `1.25` |  |
| `compact` | `1.4` |  |
| `comfortable` | `1.5` |  |

### Token group: tokens.primitive.typography.letter-spacing (dimension)

| Token | Value | Description |
| --- | --- | --- |
| `normal` | `0em` |  |
| `tight` | `-0.02em` |  |
| `wide` | `0.02em` |  |

### Token group: tokens.semantic.typography (typography)

| Token | Font family | Font size | Weight | Line height | Letter spacing | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `caption` | `{primitive.typography.font-family.sans-serif}` | `{primitive.typography.font-size.extra-small}` | `{primitive.typography.font-weight.regular}` | `{primitive.typography.line-height.comfortable}` | `{primitive.typography.letter-spacing.normal}` |  |
| `label` | `{primitive.typography.font-family.sans-serif}` | `{primitive.typography.font-size.small}` | `{primitive.typography.font-weight.bold}` | `{primitive.typography.line-height.comfortable}` | `{primitive.typography.letter-spacing.normal}` |  |
| `body.small` | `{primitive.typography.font-family.sans-serif}` | `{primitive.typography.font-size.extra-small}` | `{primitive.typography.font-weight.regular}` | `{primitive.typography.line-height.comfortable}` | `{primitive.typography.letter-spacing.normal}` |  |
| `body.medium` | `{primitive.typography.font-family.sans-serif}` | `{primitive.typography.font-size.small}` | `{primitive.typography.font-weight.regular}` | `{primitive.typography.line-height.comfortable}` | `{primitive.typography.letter-spacing.normal}` |  |
| `heading.small` | `{primitive.typography.font-family.sans-serif}` | `{primitive.typography.font-size.small}` | `{primitive.typography.font-weight.semibold}` | `{primitive.typography.line-height.tight}` | `{primitive.typography.letter-spacing.tight}` |  |
| `heading.large` | `{primitive.typography.font-family.sans-serif}` | `{primitive.typography.font-size.large}` | `{primitive.typography.font-weight.semibold}` | `{primitive.typography.line-height.tight}` | `{primitive.typography.letter-spacing.tight}` |  |
| `heading.medium` | `{primitive.typography.font-family.sans-serif}` | `{primitive.typography.font-size.medium}` | `{primitive.typography.font-weight.semibold}` | `{primitive.typography.line-height.tight}` | `{primitive.typography.letter-spacing.tight}` |  |
| `heading.extra-large` | `{primitive.typography.font-family.sans-serif}` | `{primitive.typography.font-size.extra-large}` | `{primitive.typography.font-weight.semibold}` | `{primitive.typography.line-height.tight}` | `{primitive.typography.letter-spacing.tight}` |  |
