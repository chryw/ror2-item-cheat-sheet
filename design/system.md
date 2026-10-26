## Authoring and compilation

| Concern | Authoritative source | Read here |
| --- | --- | --- |
| Visual values, aliases, themes and density | The indexed Markdown token modules | `tokens` compiles to `design-tokens.json` |
| Components, interactions, icons and UI messages | The indexed component, pattern, icon and content modules | `components` compiles to `design-components.json` |
| Illustrative tenant extension | The indexed sample tenant module | `minecraft` compiles to `content/minecraft-tokens.json` |
| Catalog authority and source plug-ins | [design-content.json](../design-content.json) | `policy`, `record`, `tenants` |
| Gameplay facts and artwork | The content manifest's declared inputs | Never generated from the design specification |

Each definition has one owner. References to an owned definition are not new
definitions: semantic and component aliases intentionally refer to lower layers.
Do not flatten aliases into copied values. Independently owned roles may
intentionally share a value without becoming the same concept.

Token tables are definitions, not generated reference copies. Their headings
identify the output, token group and type; `alias` preserves inferred types.
Dimension cells carry units, color cells use `#RRGGBBAA`, and braces denote
references. Typography columns define a composite style without flattening aliases.
YAML fences labeled `design:<path>` define nested contracts at that path.
Unlabeled examples and prose are not interpreted as executable configuration.

The compiler rejects duplicate definitions and malformed tables/blocks. It does
not infer values or event handlers from prose. Generated JSON is optional,
ignored by Git, labeled non-editable, and reproducible with
`npm run design:generate`. `npm run design:check` validates the source and rejects
stale generated files when present. Preview CSS and numeric-color interchange
are compiled outputs too. The explorer compiles the saved Markdown directly.

[The entry point](../design.md) owns the explicit module order. Add or move a
definition in its owning module, never in a compiled artifact. Annotated imports
are allowed only in the entry point; ordinary references do not import content.
Keep modules focused and independently readable. Compilation assembles them in
memory, retaining their real filenames and line numbers for diagnostics and
source links. An unlisted file cannot silently change a build.

```yaml design:tokens
$description: >-
  Shared design contract with independent brand, decorative and status palettes. Tenant-owned
  game colors are isolated from shared foundations. UI adoption is separate.
$extensions:
  ror2.design-system:
    name: Reference UI Design System
    revision: 7.0.0
    colorFormat: hex8-srgb
    defaultTheme: dark
    defaultDensity: comfortable
    themes:
      dark:
        status: active
      dark-ror2:
        status: active
        extends: dark
      light:
        status: planned
```

## Token architecture and naming

Token paths express ownership first, then category and purpose. Groups are
namespaces, not automatically layers of dependency or promises of implemented
components. Use complete words except established platform terms.

| Namespace | Responsibility | Dependency direction |
| --- | --- | --- |
| `primitive.<category>` | Product-independent raw palettes and geometry/type ramps | Primitives only |
| `semantic.<category>.<role>` | Shared usage decisions, independent of a particular widget | Primitives or other semantic roles |
| `component.<name>` | A control's named visual slots and recipes | Semantic roles or shared component recipes |
| `tenant.<tenant>.color` | Domain-specific meanings such as item rarity | Decorative palette or tenant-owned colors, never status/brand by accident |
| `tenant.<tenant>.component` | Tenant overrides and compositions | Shared aliases or the same tenant's aliases |
| `context.theme.<theme>` | Overrides of existing semantic roles | Primitives or the same palette's semantic roles |
| `context.density.<density>` | Independent scale factors, not new component styles | Primitive scale factors |

Theme and density are orthogonal contexts, not extra tiers after components.
Changing a theme changes resolved semantic roles without changing their names.
Changing density selects factors at the consumption boundary; it does not rename
spacing tokens, scale breakpoints, or reduce protected targets and focus offsets.
The `dark-ror2` theme remains a small inherited customization of the shared base.

Primitive spacing is an ordered magnitude ramp, not a density vocabulary.
Element sizes remain a different category with local icon/control/artwork/tile
ramps. Layout uses logical `inline-size`, `block-size` and `breakpoint` groups;
labels such as `compact`, `short` and `tall` do not stand in for an axis.
Typography foundations stay under `primitive.typography`; named text styles
stay under `semantic.typography`. Equal values in different categories do not
make them interchangeable: a stroke width is not a spacing definition.

Component paths use this grammar:

`component.<name>[.part.<part>][.variant.<variant>][.state.<state>].<property>`

Properties are `color.<role>`, `spacing.<role>`, `size.<role>`, `typography`,
`radius` or `stroke-width`. The same grammar follows a tenant's component prefix.
Omit unneeded axes; do not manufacture `default` nodes or a full state matrix.
For example, primary is a button variant, selected is an interaction state, and
a table header is a part, not three new sibling components. `control` is an
abstract shared styling recipe, not a claim that a widget is implemented.

This token API revision intentionally replaces the former mixed paths:

| Former path | Current path |
| --- | --- |
| `primitive.font-size.small` | `primitive.typography.font-size.small` |
| `primitive.measure.tall` | `primitive.layout.block-size.large` |
| `semantic.color.text-primary` | `semantic.color.neutral.foreground.primary` |
| `component.button-primary.background-color` | `component.button.variant.primary.color.background` |
| `component.select-option-selected.background-color` | `component.select.part.option.state.selected.color.background` |
| `component.data-table-header.text-style` | `component.data-table.part.header.typography` |
| `theme.light.color.text-primary` | `context.theme.light.color.neutral.foreground.primary` |
| `density.compact.spacing` | `context.density.compact.spacing` |

Update consumer bindings and regenerate outputs; do not preserve a parallel
legacy alias tree. Naming validation rejects obsolete root categories, encoded
state/variant siblings, property/type mismatches and flattened CSS-name
collisions. Raw design values are not stored in that validation code.

This is a deliberate synthesis, not a claim that one universal naming taxonomy
is prescribed by a standard. References informing the architecture:

- [DTCG 2025.10 format](https://www.designtokens.org/tr/2025.10/format/):
  typed tokens, group namespaces, references and composite values. The authored
  hex-color representation and theme contexts are our conventions; numeric
  interchange is exported separately. This compiler is not a full DTCG reader.
- [Fluent design tokens](https://fluent2.microsoft.design/design-tokens):
  distinguish context-agnostic globals from recognizable usage aliases.
- [Primer Primitives](https://github.com/primer/primitives):
  separate base/functional concerns and extend themes with focused overrides.
- [Carbon color roles](https://carbondesignsystem.com/elements/color/tokens/):
  name colors by application role and state rather than by a sampled hue.
