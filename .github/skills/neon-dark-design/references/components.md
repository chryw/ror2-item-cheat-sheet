# Base component contract

The skill ships working Vue 2 single-file components, not just CSS examples.
Copy the [components](../assets/components/) and
[styles](../assets/primitives.css) together with the [tokens](../assets/design-tokens.css).
Keep directory structure intact. Use these components directly in Vue 2; for a different
framework, port their behavior and public contracts rather than creating visually
unrelated controls. They have no store, routing, game data or application-global dependencies.

## Dependencies and setup

Use the target project's package manager. The supplied Vue 2 implementations need:

| Dependency | Compatible range | Used by |
| --- | --- | --- |
| vue | ^2.6.11 | All SFCs and the functional icon renderer |
| vue-multiselect | ^2.1.6 | AppSelect |
| lucide | ^1.61.0 | AppIcon |
| overlayscrollbars | ^2.11.0 | AppScrollArea |

Do not add another framework to an existing site just to use this starter.
The select and scroll-area components import their own dependency CSS.
Import tokens first, then primitives, once in your application entry point:

```js
import './styles/design-tokens.css';
import './styles/primitives.css';
import AppButton from './components/base/AppButton.vue';
import AppInput from './components/base/AppInput.vue';
import AppSelect from './components/AppSelect.vue';
import AppScrollArea from './components/AppScrollArea.vue';
import AppIcon from './components/Icons/AppIcon';
```

Register the components locally (or once globally). AppSelect explicitly imports its
button and icon dependencies, so it does not depend on application registration.
Preserve and distribute the [third-party notices](../assets/licenses/).

## AppButton

| Prop | Default | Contract |
| --- | --- | --- |
| variant | secondary | secondary, primary, danger, ghost |
| type | button | button, submit, reset; forms must opt in to submit |
| iconOnly | false | Compact square target; caller must provide an accessible name |

- Native attributes and listeners pass through to the real button, including disabled,
  aria-expanded, aria-controls, title, click and mousedown modifiers.
- Default slot holds text and optional decorative icons.
- `focus()` focuses the native button, so confirmation/cancellation flows can restore focus.
- Disabled buttons use native semantics; styling must not make them look actionable.
- Regular desktop controls are 32px high; icon controls use the 24px minimum target.
  On narrow/coarse-pointer devices both meet the 44px touch target.
- Primary is an intentional priority, not the default. Creation/setup actions that compete
  with the main task should normally be secondary or ghost.

```vue
<AppButton variant="ghost" @click="createList">New list</AppButton>
<AppButton variant="primary" type="submit">Save</AppButton>
<AppButton variant="danger" @click="confirmDelete">Delete</AppButton>
<AppButton icon-only aria-label="Close panel" @click="close">
  <AppIcon name="close" />
</AppButton>
```

## AppInput

- `value` (string or number, default empty) and `input` (string) support Vue 2 `v-model`.
- `type` defaults to text. Native attributes/listeners, including required, maxlength,
  disabled, placeholder, change, focus and blur, pass through.
- Composition events are forwarded; intermediate IME composition does not update the model.
- Provide a persistent label using a matching `for` / `id`, or an accessible name.
- `focus()` focuses the native input. Token-defined control height applies automatically.
- Use native checkboxes/radios with clickable labels at least `--target-size` high;
  AppInput is a text-entry primitive, not a replacement for checked-value semantics.

```vue
<label for="list-name">List name</label>
<AppInput id="list-name" v-model="name" maxlength="80" required />
```

## AppSelect

- Required: `id`, `label`, `value`, `options`.
- Options are `{ value, label }` records. Model value is a string for single selection,
  an array of strings for multiple selection. Emits `input` with stable values, not records.
- Optional: `multiple=false`, `disabled=false`, `placeholder="Choose an option"`.
- One implementation for single/multiple, search, removable tags and clear action.
- The trigger uses the same control tokens as inputs/buttons and retains all four radii
  while open. Inactive internal search inputs stay borderless and zero-width.
- The menu lives in a fixed, token-elevated popup layer outside clipped scroll panels.
  Opening it must not change host height, scrollHeight, sibling position or width.
- Anchor to the trigger, cap to available viewport space, prefer below and flip above
  when necessary. Reposition on resize and ancestor scrolling; close if the anchor is hidden.
- Moving a library-owned list requires returning it before destruction and cleaning up
  popup nodes/listeners. Never clone menu DOM (it would lose handlers and duplicate IDs).
- Popup roots expose `data-select-owner` with the control ID. Consumer drawers use this
  to recognize their own detached menus when implementing outside-click dismissal.
- Keep keyboard-highlighted wrapped options visible using rendered row bounds.
- An open select consumes Escape before dismissing its menu, so enclosing dialogs
  do not close on the same keypress. A subsequent Escape can dismiss the dialog.

```vue
<AppSelect id="status" label="Status" v-model="status"
  :options="[{ value: '', label: 'All' }, { value: 'ready', label: 'Ready' }]" />
```

## AppScrollArea

- `tag="div"` controls the host element; `label` is required for the keyboard-focusable
  native scroll region. Default slot contains the scrollable content.
- Host owns layout dimensions, padding and border. Overlay handles consume no content width.
- Support wheel, touch, keyboard and dragging; do not replace scroll behavior with a simulation.
- Update responsive host measurements on resize and Vue updates; destroy the instance and
  remove listeners on unmount. Never hide native scrollbars without an operable replacement.
- Example: `<AppScrollArea label="Results" style="height: 400px">...</AppScrollArea>`.

## AppIcon

- Functional decorative SVG renderer; required `name` is one of search, menu,
  chevron-down, close, external-link, reset, plus, panel-left. Unknown names throw explicitly.
- Uses currentColor, a 24-unit viewBox and the shared size/stroke tokens.
- Icons are hidden from assistive technology; label the enclosing control.
- Add only needed icon definitions and retain licence notices. Direct definition imports
  avoid DOM helpers unsupported by older bundlers.

## Token boundary

- Base tokens describe surfaces, text, interaction, status, palette, layout, media and
  controls. Never add product entities, rarity names or role names to the base layer.
- A consumer stylesheet aliases product concepts to base tokens:
  `--rarity-common: var(--color-gray-400)` or `--rank-core-text: var(--status-warning-text)`.
- Consumer components can use those aliases. Base components must not import or reference
  consumer tokens, stores, assets or data.
- `--target-size` is 24px on fine-pointer desktop and 44px on narrow/coarse-pointer
  devices. It is a floor, not a rule that every control must be exactly that size.
- `--control-height` is 32px desktop / 44px touch. `--control-height-compact` follows the
  target size. Do not override these with hardcoded per-page touch or desktop variants.
- Media queries use literal conditions: custom properties cannot define query conditions.

## Regression requirements

Test attribute/listener forwarding, submit-vs-button behavior, focus restoration,
disabled actions, text-entry composition, search and single/multiple selection.
Measure target bounds on desktop and touch, and panel geometry before/open/closed.
Verify edge placement, wrapped-option keyboard scrolling, clipped-anchor cleanup,
and zero orphan popup nodes after repeated opening, selection and destruction.
Check overlay scrollbar widths and native input methods at 320px through desktop widths.
Token and component starters must match their canonical implementation; shipping stale
examples with a different API is a contract failure.
