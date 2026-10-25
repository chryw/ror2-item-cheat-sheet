<template>
  <component :is="href ? 'a' : 'button'" class="ui-button"
    :class="[`ui-button--${variant}`, `ui-button--${size}`,
      { 'ui-button--icon': iconOnly, 'ui-button--responsive': collapseLabel,
        'is-active': active }]"
    :type="href ? null : type" :href="href" v-bind="$attrs" v-on="$listeners">
    <slot />
  </component>
</template>

<script>
export default {
  name: 'AppButton',
  inheritAttrs: false,
  props: {
    variant: {
      type: String,
      default: 'secondary',
      validator: value => ['secondary', 'primary', 'danger', 'ghost'].includes(value),
    },
    type: {
      type: String,
      default: 'button',
      validator: value => ['button', 'submit', 'reset'].includes(value),
    },
    iconOnly: { type: Boolean, default: false },
    collapseLabel: { type: Boolean, default: false },
    active: { type: Boolean, default: false },
    href: { type: String, default: null },
    size: {
      type: String,
      default: 'regular',
      validator: value => ['regular', 'compact'].includes(value),
    },
  },
  methods: {
    focus() { this.$el.focus(); },
  },
};
</script>

<style>
.ui-button {
  --button-color: var(--text);
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--control-gap);
  min-height: var(--control-height);
  min-width: var(--target-size);
  padding: var(--control-padding-block) var(--control-padding-inline);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface-raised);
  color: var(--button-color);
  font: var(--type-control);
  text-decoration: none;
  overflow-wrap: anywhere;
  cursor: pointer;
  transition: background var(--motion-fast), border-color var(--motion-fast);
}
.ui-button:hover:not(:disabled) {
  color: var(--button-color);
  background: var(--surface-hover);
  border-color: var(--border-strong);
}
.ui-button--primary {
  border-color: var(--accent);
  background: var(--accent);
  --button-color: var(--on-accent);
}
.ui-button--primary:hover:not(:disabled) {
  border-color: var(--accent-hover);
  background: var(--accent-hover);
}
.ui-button:disabled { opacity: var(--opacity-disabled); cursor: not-allowed; }
.ui-button--danger { --button-color: var(--danger); border-color: var(--danger); }
.ui-button--danger:hover:not(:disabled) {
  background: var(--danger-surface); border-color: var(--danger);
}
.ui-button--ghost { background: transparent; border-color: transparent; }
.ui-button.is-active,
.ui-button.is-active:hover:not(:disabled) {
  border-color: var(--accent);
  background: var(--accent-soft);
  --button-color: var(--accent);
}
.ui-button--compact { min-height: var(--control-height-compact); }
.ui-button--icon {
  flex-shrink: 0;
  width: var(--control-height);
  height: var(--control-height);
  min-height: var(--target-size);
  padding: 0;
}
.ui-button--icon.ui-button--compact {
  width: var(--control-height-compact);
  height: var(--control-height-compact);
}
.ui-button .app-icon { width: var(--icon-sm); height: var(--icon-sm); }
@media (max-width: 900px) {
  .ui-button--responsive {
    flex-shrink: 0;
    width: var(--control-height);
    height: var(--control-height);
    padding: 0;
  }
  .ui-button--responsive .ui-button__label { display: none; }
}
</style>
