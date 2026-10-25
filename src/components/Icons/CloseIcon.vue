<template>
  <button class="close-side-bar-button ui-button" type="button" aria-label="Close item details"
    @click="clickCloseButton">
    <AppIcon name="close" />
  </button>
</template>

<script>
export default {
  name: 'CloseIcon',
  props: ['clickCloseButton'],
};
</script>

<style scoped>
.close-side-bar-button {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  height: var(--control-height-compact);
  width: var(--control-height-compact);
  padding: 0;
  min-height: var(--control-height-compact);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-muted);
  font-size: var(--icon-md);
  cursor: pointer;
}
.close-side-bar-button:focus-visible {
  outline: var(--focus-ring); outline-offset: calc(-1 * var(--focus-offset));
}
</style>
