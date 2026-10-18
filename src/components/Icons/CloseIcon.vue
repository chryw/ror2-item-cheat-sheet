<template>
  <button class="close-side-bar-button" type="button" aria-label="Close item details"
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
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: #ccc;
  font-size: 18px;
  cursor: pointer;
}
.close-side-bar-button:hover { background: rgba(190, 190, 190, 0.25); }
.close-side-bar-button:focus-visible { outline: 2px solid currentColor; outline-offset: -3px; }
</style>
