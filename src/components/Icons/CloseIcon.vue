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
