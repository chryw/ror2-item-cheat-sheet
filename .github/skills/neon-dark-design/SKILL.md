---
name: neon-dark-design
description: "Build or restyle static sites, galleries, dashboards and developer tools with a modern neon-yellow dark theme. Use for charcoal surfaces, reusable design tokens, outlined icons, consistent dropdowns, accessible focus states and responsive panels."
---

# Neon-dark design

Create an original, restrained dark interface: layered charcoal surfaces, warm off-white
text, neon-yellow actions, fine borders, rounded panels and lightweight outline icons.
Use this as a visual language, not a requirement to copy a particular layout or framework.

## Portable resources

- [Design tokens](./assets/design-tokens.css): copy into the target project's style directory,
  import once before component styles, and adapt semantic values rather than repeating literals.
- The final token group contains optional catalogue sizes, rank colours and rarity colours.
  Keep only extensions relevant to the new product; do not introduce game-specific UI elsewhere.
- This entire skill folder can be copied to another repository's `.github/skills/` or a
  supported personal skills directory. It needs no files outside this folder.

## Workflow

1. Inspect the target framework, existing controls, CSS entry point and validation commands.
   Preserve useful components, behavior, content and accessible names.
2. Identify the primary task and information hierarchy. For a static utility, keep the
   introduction compact and let the useful content occupy the viewport; do not add a
   full-screen marketing hero, carousel or animation merely to establish a visual style.
3. Import the token stylesheet, then implement shared primitives for buttons, fields,
   selects, cards and small technical labels. Reuse them across every surface.
4. Apply the contracts below. Let components own layout and consume semantic tokens for
   colour, typography, spacing, radius, borders, focus, icons, disabled states and motion.
5. Validate real controls and overflow transitions at desktop and mobile sizes. Measure
   actual results, not just the presence of CSS declarations.

## Visual contracts

### Colour and hierarchy

- Canvas uses `--canvas`; panels/cards use `--surface`; inputs and elevated elements use
  `--surface-raised`; hover surfaces use `--surface-hover`.
- Main text uses `--text`; supporting copy and labels use `--text-muted`.
- Neon `--accent` belongs on primary actions, active selections, keyboard focus and a
  short emphasized heading fragment. Use `--on-accent` for text on filled accent surfaces.
- Use `--accent-soft` for subtle selection surfaces, never for essential text.
- Borders are fine `--border-width` strokes in `--border`, strengthened on hover.
- Destructive actions use `--danger` / `--danger-surface`, not yellow.
- Domain categories may have secondary colours, but retain text labels and keep them
  independent of action/selection colours. Avoid filling every card with saturated colour.
- Do not assume a changed accent remains accessible: recheck normal-text contrast >= 4.5:1
  and meaningful non-text control/focus contrast >= 3:1.

### Typography and spacing

- Use the supplied local system sans stack; no external font fetch is necessary.
- Compact headings have slightly negative tracking. Use the fluid display token for
  the page heading; keep data labels/body copy readable instead of enlarging all text.
- Use the monospace stack for small technical labels, counts and badges, not all prose.
- Use the 4/8/12/16/24/32px spacing scale for repeated rhythm.
- Reuse medium radii for controls/cards, large radii for larger panels, and pill radii
  for action buttons or tags. Preserve the same radius in default, hover, focus and open states.
- Zero, percentages, grid fractions and isolated geometric adjustments need not become
  tokens. Add semantic tokens for repeated values, not a variable for every CSS declaration.

### Controls

- Buttons: 44px minimum default height, raised neutral background, fine border,
  semibold text; primary variant uses accent fill and on-accent text. Keep visible
  hover, focus, disabled and destructive states.
- Fields: raised surface, medium radius, muted placeholder, persistent external label.
- Selects: one shared implementation for single and multiple selection. Keep search,
  keyboard navigation, selected values, tags, removals and clear actions consistent.
- If the option list is detached by a gap, round all four trigger corners and the menu.
  Override any upstream library's *open-state* joined-menu corner resets at sufficient
  specificity, without `!important` or per-page patches.
- Keep hidden search inputs genuinely zero-width and borderless when inactive.
  Do not let generic input selectors accidentally style the select library's internals.
- Menus must remain usable near viewport/panel edges. Choose overlay positioning or
  in-flow expansion deliberately; do not apply overlay-space calculations to in-flow menus.
- With wrapped options, keep the keyboard-highlighted option visible using actual row
  bounds, not a fixed-row-height assumption.
- Reserve scroll space (`scrollbar-gutter: stable` with an appropriate older-browser
  fallback) so overflow does not change field widths. Test the complete
  non-overflow -> overflow -> non-overflow transition.

### Icons and content

- Prefer Lucide outline icons: 24-unit viewBox, rounded caps/joins, 1.75 stroke weight,
  displayed at 16-20px and coloured with `currentColor`.
- Import only used definitions; avoid icon fonts, CDN scripts and DOM-replacement passes.
  Check framework/build-tool compatibility rather than choosing a deprecated adapter.
- Hide decorative SVGs from assistive technology and keyboard focus. Icon-only controls
  still need accessible button/link names. Preserve library licence notices.
- Keep primary information first. Put ancillary save/list-management controls after
  descriptions, stats and other essential detail content.
- Use inline confirmation for destructive actions with a clear cancel path. Preserve
  keyboard focus and report persistence failures rather than pretending changes were saved.

## Example: compose primitives from tokens

```css
.panel {
  padding: var(--space-5);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  color: var(--text);
}
.action {
  min-height: var(--control-height);
  padding: var(--control-padding-block) var(--control-padding-inline);
  border: var(--border-width) solid var(--accent);
  border-radius: var(--radius-pill);
  background: var(--accent);
  color: var(--on-accent);
  font: var(--weight-semibold) var(--text-body)/var(--leading-ui) var(--font-family);
}
.action:focus-visible {
  outline: var(--focus-ring);
  outline-offset: var(--focus-offset);
}
```

**Prefer:** one token-driven button/select implementation reused everywhere.
**Avoid:** one-off neon overrides, copied third-party artwork/styles, hardcoded palettes
inside components, or decorative chrome that hides the site's actual content.

## Verification checklist

- Run the target project's existing tests, lint and production build.
- Verify 320px, 390px, tablet and desktop widths; check long names and empty states.
- Exercise search, single/multi-select, keyboard scrolling, tag removal and details panels.
- Check all four corners and the focus ring with a dropdown open, not only closed.
- Measure field widths before/during/after scrollbar appearance; ensure zero width shift.
- Check contrast for text, muted labels, filled buttons, errors and category/rank badges.
- Respect `prefers-reduced-motion` and use native dark `color-scheme`.
- Inspect screenshots, but also assert computed styles and geometry. For a token-only
  extraction, compare before/after values so the refactor does not silently restyle the UI.
- Do not add a framework, theme switcher or animation dependency just for this language.
