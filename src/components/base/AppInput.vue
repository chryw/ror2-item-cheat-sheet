<template>
  <input class="ui-input" :type="type" :value="value"
    v-bind="$attrs" v-on="listeners">
</template>

<script>
export default {
  name: 'AppInput',
  inheritAttrs: false,
  props: {
    value: { type: [String, Number], default: '' },
    type: { type: String, default: 'text' },
  },
  data() { return { composing: false }; },
  computed: {
    listeners() {
      return {
        ...this.$listeners,
        input: this.onInput,
        compositionstart: this.onCompositionStart,
        compositionend: this.onCompositionEnd,
      };
    },
  },
  methods: {
    onInput(event) {
      if (!this.composing) this.$emit('input', event.target.value);
    },
    onCompositionStart(event) {
      this.composing = true;
      this.$emit('compositionstart', event);
    },
    onCompositionEnd(event) {
      if (this.composing) {
        this.composing = false;
        this.onInput(event);
      }
      this.$emit('compositionend', event);
    },
    focus() { this.$el.focus(); },
  },
};
</script>

<style>
.ui-input {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  height: var(--control-height);
  padding: 0 var(--control-padding-inline);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface-raised);
  color: var(--text);
  font: var(--weight-regular) var(--text-control)/var(--control-line-height) var(--font-family);
}
.ui-input:hover:not(:disabled) { border-color: var(--border-strong); }
.ui-input::placeholder { color: var(--text-muted); opacity: 1; }
.ui-input:disabled { opacity: var(--opacity-disabled); cursor: not-allowed; }
</style>
