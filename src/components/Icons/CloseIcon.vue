<template>
  <button class="close-side-bar-button ui-button" type="button" aria-label="Close item details"
    @click="clickCloseButton">
    <font-awesome-icon icon="times" aria-hidden="true" />
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
  height: 40px;
  width: 40px;
  padding: 0;
  min-height: 40px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-muted);
  font-size: 18px;
  cursor: pointer;
}
.close-side-bar-button:focus-visible { outline: 2px solid var(--accent); outline-offset: -3px; }
</style>
