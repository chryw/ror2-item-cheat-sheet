## Colors

### Color information architecture

This architecture follows **Fluent 2 / Fluent UI React v9**, not the v8
`palette.themePrimary` / `semanticColors` API. Its important distinction is
between context-free global colors and aliases that say what a color does.
The compiler and explorer preserve that distinction rather than presenting
all colors as one palette.

| Question | Namespace | Selection rule |
| --- | --- | --- |
| What raw color is available? | `primitive.color.neutral`, `.shared`, `.alpha` | Maintainers select palette values; controls do not. |
| What neutral UI job does it perform? | `semantic.color.neutral.<application>.<role>` | Choose foreground, background, stroke or shadow, then its purpose. |
| Where is brand emphasis applied? | `semantic.color.brand.<application>.<role>` | Foreground, filled background and outline are independent decisions. |
| What feedback does it communicate? | `semantic.color.status.<meaning>.<application>` | Use status for feedback, never classification or decoration. |
| What non-status accent does a tenant need? | `semantic.color.decorative.<application>.<ansi-name>` | The sixteen ANSI-named foreground slots are a themeable projection, not the whole global palette. |
| Which control slot consumes it? | `component.<control>...color.<application>` | A background slot consumes a background role, not a foreground with the same current value. |
| What does a game classification mean? | `tenant.<tenant>.color.<domain>` | Map definitive domain identifiers to decorative foregrounds or explicitly tenant-owned colors. |

`foreground` includes text and icons; `background` is a fill or scrim;
`stroke` is an outline or focus indicator; `shadow` is a shadow's color.
Geometry remains separate. Interactive roles append a state **after** the
role: `neutral.background.control.rest`, `.hover`, `.pressed`, `.selected`
and `.disabled`. There is no universal `hover` color that all controls borrow.
Noninteractive foregrounds such as `primary`, `secondary` and `disabled`
follow Fluent's recognizable usage-role convention without inventing a full
interaction matrix.

A primary button combines `brand.background.solid.rest` with
`neutral.foreground.on-brand`. Links consume `brand.foreground.link.rest`;
selection outlines consume `brand.stroke.control.selected`. Equal initial
values do not make these interchangeable. Brand foreground aliases can
share another brand foreground decision, but a background must not derive
from a foreground. Theme overrides target the same application-specific
roles, preserving the ability to tune contrast independently.

The neutral ramp uses `step-<number>`; larger steps are darker. The former
neutral-50 and neutral-100 labels were out of luminance order, so those labels
were corrected while preserving every consumer's resolved color. Shared hue
names describe raw swatches, not success, item rarity or branding. Alpha
colors are explicitly separate from opaque palettes.

The shared hue palette can supply brand, status and decorative decisions
without coupling them. Decorative white is not primary neutral text, and a
decorative red item is not an error. The inherited `dark-ror2` theme adjusts
only the relevant brand roles and decorative foregrounds. Its content
classification map stays in the tenant namespace.

This is an adaptation, not a copy of Fluent's full palette, numeric role
catalog, generated brand ramps or accessibility certification. Add missing
application/state roles only with defined usage, values, contrast pairings
and a consuming recipe; do not fabricate complete matrices.

The current v9 package lineage was checked through the published
[`@fluentui/react-components`](https://www.npmjs.com/package/@fluentui/react-components)
and [`@fluentui/react-theme`](https://www.npmjs.com/package/@fluentui/react-theme)
dependencies. The reference sources are:

- [Fluent 2 color guidance](https://fluent2.microsoft.design/color): neutral,
  shared and brand ownership; status is not decoration.
- [Fluent 2 global and alias tokens](https://fluent2.microsoft.design/design-tokens).
- [Released v9 token types](https://github.com/microsoft/fluentui/blob/2dd2a9a96210919c35b210a1aa8e873ab67dbada/packages/tokens/src/types.ts)
  and [dark mappings](https://github.com/microsoft/fluentui/blob/2dd2a9a96210919c35b210a1aa8e873ab67dbada/packages/tokens/src/alias/darkColor.ts):
  `colorNeutralForeground1`, `colorNeutralBackground1Hover`,
  `colorBrandBackground` and `colorBrandForegroundLink` are distinct aliases.

This replaces `semantic.color.surface.hover` with
`semantic.color.neutral.background.control.hover`,
`semantic.color.status.danger` with `semantic.color.status.danger.foreground`,
and the ambiguous `semantic.color.brand.primary` with separate foreground,
background and stroke roles. Update bindings rather than keeping a second
legacy alias tree. Markdown remains the authored authority.

Validation is implemented by [token tooling](../scripts/design-tokens.cjs). Use the interchange
export when a consumer requires numeric color objects; do not maintain both
representations by hand.

### Token group: tokens.primitive.color.neutral (color)

| Token | Value | Description |
| --- | --- | --- |
| `step-0` | `#FFFFFFFF` |  |
| `step-50` | `#F1F5F9FF` |  |
| `step-100` | `#F0F1E8FF` |  |
| `step-200` | `#E2E8F0FF` |  |
| `step-300` | `#C4CBD3FF` |  |
| `step-400` | `#A6ADB8FF` |  |
| `step-500` | `#505967FF` |  |
| `step-600` | `#303641FF` |  |
| `step-700` | `#282D36FF` |  |
| `step-800` | `#20242CFF` |  |
| `step-900` | `#171A20FF` |  |
| `step-950` | `#101216FF` |  |

### Token group: tokens.primitive.color.shared (color)

| Token | Value | Description |
| --- | --- | --- |
| `black` | `#13161CFF` |  |
| `red` | `#804945FF` |  |
| `green` | `#3F6640FF` |  |
| `yellow` | `#685A24FF` |  |
| `blue` | `#425B85FF` |  |
| `magenta` | `#704C72FF` |  |
| `cyan` | `#13676FFF` |  |
| `white` | `#C1C4C9FF` |  |
| `black-bright` | `#595E66FF` |  |
| `red-bright` | `#F8A49DFF` |  |
| `green-bright` | `#95CF96FF` |  |
| `yellow-bright` | `#D2BD70FF` |  |
| `blue-bright` | `#98BFFEFF` |  |
| `magenta-bright` | `#DFA8E1FF` |  |
| `cyan-bright` | `#65D0DCFF` |  |
| `white-bright` | `#F3F5F8FF` |  |
| `lime-bright` | `#DFFF00FF` | Additional shared hue available for tenant branding; not an extra ANSI decorative slot. |

### Token group: tokens.primitive.color.alpha (color)

| Token | Value | Description |
| --- | --- | --- |
| `ink-16` | `#02061729` |  |
| `ink-60` | `#02061799` |  |

### Token group: tokens.semantic.color.neutral.foreground (color)

| Token | Value | Description |
| --- | --- | --- |
| `primary` | `{primitive.color.neutral.step-100}` | Primary text and icons on neutral surfaces. |
| `secondary` | `{primitive.color.neutral.step-400}` | Secondary text and metadata on neutral surfaces. |
| `disabled` | `{primitive.color.neutral.step-400}` | Unavailable control text and icons. |
| `on-brand` | `{primitive.color.neutral.step-950}` | Contrasting text and icons on brand.background.solid.rest. |

### Token group: tokens.semantic.color.neutral.background (color)

| Token | Value | Description |
| --- | --- | --- |
| `canvas` | `{primitive.color.neutral.step-950}` | Application canvas behind content surfaces. |
| `panel` | `{primitive.color.neutral.step-900}` | Content surface for cards, navigation and detail panels. |
| `control.rest` | `{primitive.color.neutral.step-800}` | Resting neutral control fill. |
| `control.hover` | `{primitive.color.neutral.step-700}` | Hovered neutral control fill, not a generic hover color. |
| `control.pressed` | `{primitive.color.neutral.step-600}` | Pressed neutral control fill. |
| `control.selected` | `{primitive.color.neutral.step-700}` | Selected neutral control fill. |
| `control.disabled` | `{primitive.color.neutral.step-800}` | Disabled neutral control fill. |
| `overlay` | `{primitive.color.alpha.ink-60}` | Modal scrim above background content. |

### Token group: tokens.semantic.color.neutral.stroke (color)

| Token | Value | Description |
| --- | --- | --- |
| `subtle` | `{primitive.color.neutral.step-600}` | Low-emphasis separators and surface outlines. |
| `control.rest` | `{primitive.color.neutral.step-300}` | Accessible resting control outline. |

### Token group: tokens.semantic.color.neutral.shadow (color)

| Token | Value | Description |
| --- | --- | --- |
| `ambient` | `{primitive.color.alpha.ink-16}` | Ambient shadow color; shadow geometry is a separate foundation. |

### Token group: tokens.semantic.color.brand.foreground (color)

| Token | Value | Description |
| --- | --- | --- |
| `primary` | `{primitive.color.shared.blue-bright}` | Brand-emphasized text and icons, not a filled control background. |
| `accent` | `{primitive.color.shared.cyan-bright}` | Secondary brand emphasis for text and icons. |
| `control.selected` | `{semantic.color.brand.foreground.primary}` | Brand emphasis on a selected neutral control. |
| `link.rest` | `{semantic.color.brand.foreground.primary}` | Resting link text; interaction variants belong to this link role. |

### Token group: tokens.semantic.color.brand.background (color)

| Token | Value | Description |
| --- | --- | --- |
| `solid.rest` | `{primitive.color.shared.blue-bright}` | Filled primary action background; pair with neutral.foreground.on-brand. |

### Token group: tokens.semantic.color.brand.stroke (color)

| Token | Value | Description |
| --- | --- | --- |
| `control.selected` | `{primitive.color.shared.blue-bright}` | Selected control outline, independent of its foreground. |
| `focus` | `{primitive.color.shared.blue-bright}` | Keyboard focus indicator; never a fill or text color. |

### Token group: tokens.semantic.color.status (color)

| Token | Value | Description |
| --- | --- | --- |
| `danger.foreground` | `{primitive.color.shared.red-bright}` | Status text/icons only; accompany with a non-color cue. |
| `caution.foreground` | `{primitive.color.shared.yellow-bright}` | Status text/icons only; accompany with a non-color cue. |
| `success.foreground` | `{primitive.color.shared.green-bright}` | Status text/icons only; accompany with a non-color cue. |
| `information.foreground` | `{primitive.color.shared.cyan-bright}` | Status text/icons only; accompany with a non-color cue. |

### Token group: tokens.semantic.color.decorative.foreground (color)

| Token | Value | Description |
| --- | --- | --- |
| `black` | `{primitive.color.shared.black}` | Non-status decorative foreground; safe input for tenant classifications. |
| `red` | `{primitive.color.shared.red}` | Non-status decorative foreground; safe input for tenant classifications. |
| `green` | `{primitive.color.shared.green}` | Non-status decorative foreground; safe input for tenant classifications. |
| `yellow` | `{primitive.color.shared.yellow}` | Non-status decorative foreground; safe input for tenant classifications. |
| `blue` | `{primitive.color.shared.blue}` | Non-status decorative foreground; safe input for tenant classifications. |
| `magenta` | `{primitive.color.shared.magenta}` | Non-status decorative foreground; safe input for tenant classifications. |
| `cyan` | `{primitive.color.shared.cyan}` | Non-status decorative foreground; safe input for tenant classifications. |
| `white` | `{primitive.color.shared.white}` | Non-status decorative foreground; safe input for tenant classifications. |
| `black-bright` | `{primitive.color.shared.black-bright}` | Non-status decorative foreground; safe input for tenant classifications. |
| `red-bright` | `{primitive.color.shared.red-bright}` | Non-status decorative foreground; safe input for tenant classifications. |
| `green-bright` | `{primitive.color.shared.green-bright}` | Non-status decorative foreground; safe input for tenant classifications. |
| `yellow-bright` | `{primitive.color.shared.yellow-bright}` | Non-status decorative foreground; safe input for tenant classifications. |
| `blue-bright` | `{primitive.color.shared.blue-bright}` | Non-status decorative foreground; safe input for tenant classifications. |
| `magenta-bright` | `{primitive.color.shared.magenta-bright}` | Non-status decorative foreground; safe input for tenant classifications. |
| `cyan-bright` | `{primitive.color.shared.cyan-bright}` | Non-status decorative foreground; safe input for tenant classifications. |
| `white-bright` | `{primitive.color.shared.white-bright}` | Non-status decorative foreground; safe input for tenant classifications. |
