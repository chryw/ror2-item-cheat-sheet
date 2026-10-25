<template>
  <AppButton class="close-side-bar-button" variant="ghost" icon-only aria-label="Close item details"
    @click="clickCloseButton">
    <AppIcon name="close" />
  </AppButton>
</template>

<script>
export default {
  name: 'CloseIcon',
  props: ['clickCloseButton'],
};
</script>

<style scoped>
.close-side-bar-button {
  color: var(--text-muted);
}
.close-side-bar-button:focus-visible {
  outline: var(--focus-ring); outline-offset: calc(-1 * var(--focus-offset));
}
</style>
