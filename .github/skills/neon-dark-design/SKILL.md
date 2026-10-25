---
name: neon-dark-design
description: "Build or restyle static sites, galleries, dashboards and developer tools with a modern neon-yellow dark design system. Use for semantic design tokens, reusable base components, compact desktop and touch controls, elevated dropdowns, outlined icons and accessible responsive panels."
---

# Neon-dark design

Create an original, restrained dark interface: layered charcoal surfaces, warm off-white
text, neon-yellow actions, fine borders, rounded panels and lightweight outline icons.
Use this as a visual language, not a requirement to copy a particular layout or framework.

## Portable resources

- [Design tokens](./assets/design-tokens.css): copy into the target project's style directory,
  import once before component styles, and adapt semantic values rather than repeating literals.
- [Base styles](./assets/primitives.css) and [component contract](./references/components.md):
  bundled, working button, input, select, icon and scroll-area implementations, with API,
  dependencies, examples and regression requirements. Load the contract before implementing controls.
- Base tokens/components are product-independent. Keep game/product names in a separate
  consumer alias stylesheet, never in the portable layer.
- This entire skill folder can be copied to another repository's `.github/skills/` or a
  supported personal skills directory. It needs no files outside this folder.

## Workflow

1. Inspect the target framework, existing controls, CSS entry point and validation commands.
   Preserve useful components, behavior, content and accessible names.
2. Identify the primary task and information hierarchy. For a static utility, keep the
   introduction compact and let the useful content occupy the viewport; do not add a
   full-screen marketing hero, carousel or animation merely to establish a visual style.
3. Import tokens and base styles, then use the bundled components (or API-compatible
   framework ports). Reuse them across every surface; do not replace a base component
   with a one-off styled native element. Keep product aliases in the consumer stylesheet.
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

- Buttons: compact 32px regular desktop controls and a 24px minimum click target,
  including icon buttons. Narrow/coarse-pointer devices use 44px minimum touch targets.
  Target size is a floor, not a forced height for every control. Use raised neutral
  surfaces, fine borders and semibold text. Primary accent fill is opt-in; creation/setup
  actions should not compete with the primary task. Preserve hover/focus/disabled/danger states.
- Fields: raised surface, medium radius, muted placeholder, persistent external label.
- Selects: one shared implementation for single and multiple selection. Keep search,
  keyboard navigation, selected values, tags, removals and clear actions consistent.
- If the option list is detached by a gap, round all four trigger corners and the menu.
  Override any upstream library's *open-state* joined-menu corner resets at sufficient
  specificity, without `!important` or per-page patches.
- Keep hidden search inputs genuinely zero-width and borderless when inactive.
  Do not let generic input selectors accidentally style the select library's internals.
- Menus use an anchored fixed popup with `--layer-popup` outside clipped scroll panels.
  Opening must not change container height, scroll range, width or sibling positions.
  Reposition on resize/scroll, flip above near viewport edges, and clean up on close/unmount.
  A z-index alone cannot escape an ancestor's overflow clipping; use an elevated popup layer.
- With wrapped options, keep the keyboard-highlighted option visible using actual row
  bounds, not a fixed-row-height assumption.
- If scrollbars must not consume content width, use one shared overlay-scrollbar
  component with native wheel/touch/keyboard scrolling and draggable handles.
  `scrollbar-gutter: stable` prevents shifts but still reserves space; it is not an
  overlay solution. Do not simply hide scrollbars or rely on deprecated `overflow: overlay`.
  Test the complete non-overflow -> overflow -> non-overflow transition.

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

## Example: use the base component contract

```vue
<AppButton variant="ghost" @click="createList">New list</AppButton>
<label for="list-name">List name</label>
<AppInput id="list-name" v-model="name" required />
<AppButton variant="primary" type="submit">Save</AppButton>
<AppButton icon-only aria-label="Close panel" @click="close">
  <AppIcon name="close" />
</AppButton>
```

```css
/* Consumer aliases describe product meaning; base tokens stay reusable. */
:root {
  --task-priority-high: var(--status-warning-text);
  --task-category-review: var(--color-violet-400);
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
- Measure desktop targets >=24px, touch targets >=44px, and unchanged panel geometry
  before/open/closed. Verify popup edge placement, clipping, anchoring and cleanup.
- Measure field widths before/during/after scrollbar appearance; ensure zero width shift.
- Check contrast for text, muted labels, filled buttons, errors and category/rank badges.
- Respect `prefers-reduced-motion` and use native dark `color-scheme`.
- Inspect screenshots, but also assert computed styles and geometry. For a token-only
  extraction, compare before/after values so the refactor does not silently restyle the UI.
- Do not add a framework, theme switcher or animation dependency just for this language.
- Keep the bundled token, style and component starters synchronized with their canonical
  implementations. Validate the contract, not just example screenshots.
