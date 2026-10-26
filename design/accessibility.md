### Accessibility

The component contract owns accessibility requirements in its component rules
and `interactionAlgorithms.accessibility`. Automated checks are evidence for
their tested scope, not a claim of physical-keyboard, touch, assistive-technology
or software-keyboard conformance.

```yaml design:components.interactionAlgorithms.accessibility
- >-
  Use native buttons, links, inputs and labels where suitable. Preserve native activation,
  navigation, form, context-menu and new-tab behavior; do not nest interactive controls inside a
  selection card.
- >-
  Keep focus visible on selected and invalid controls. Associate errors/hints rather than
  replacing entered values. Disabled controls cannot activate; selected state remains distinct
  from transient press/hover.
- >-
  Announce actual result counts politely and actual asynchronous failures explicitly. Do not
  invent loading states for local filtering.
- >-
  Name icon-only actions through localized messages. Decorative UI icons and repeated artwork
  are hidden from assistive technology; standalone informative artwork needs a name. Missing
  artwork is distinct from empty search results.
- >-
  Respect reduced motion, translation expansion and reading direction. Validate physical
  keyboard, touch, assistive technology, zoom/reflow and software-keyboard behavior before
  claiming conformance.
```
