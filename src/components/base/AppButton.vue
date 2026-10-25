<template>
  <button class="ui-button" :class="[`ui-button--${variant}`, { 'ui-button--icon': iconOnly }]"
    :type="type" v-bind="$attrs" v-on="$listeners">
    <slot />
  </button>
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
  },
  methods: {
    focus() { this.$el.focus(); },
  },
};
</script>

<style>
.ui-button {
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
  color: var(--text);
  font: var(--weight-semibold) var(--text-body)/var(--leading-ui) var(--font-family);
  overflow-wrap: anywhere;
  cursor: pointer;
  transition: background var(--motion-fast), border-color var(--motion-fast);
}
.ui-button:hover:not(:disabled) {
  background: var(--surface-hover);
  border-color: var(--border-strong);
}
.ui-button--primary {
  border-color: var(--accent);
  background: var(--accent);
  color: var(--on-accent);
}
.ui-button--primary:hover:not(:disabled) {
  border-color: var(--accent-hover);
  background: var(--accent-hover);
}
.ui-button:disabled { opacity: var(--opacity-disabled); cursor: not-allowed; }
.ui-button--danger { color: var(--danger); border-color: var(--danger); }
.ui-button--danger:hover:not(:disabled) {
  background: var(--danger-surface); border-color: var(--danger);
}
.ui-button--ghost { background: transparent; border-color: transparent; }
.ui-button--icon {
  flex-shrink: 0;
  width: var(--control-height-compact);
  height: var(--control-height-compact);
  min-height: var(--target-size);
  padding: 0;
}
.ui-button--icon .app-icon { width: var(--icon-sm); height: var(--icon-sm); }
</style>
