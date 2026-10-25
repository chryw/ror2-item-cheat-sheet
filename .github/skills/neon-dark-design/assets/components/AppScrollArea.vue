<template>
  <component :is="tag" class="app-scroll-area" data-overlayscrollbars-initialize>
    <div ref="viewport" class="app-scroll-viewport" tabindex="0"
      role="region" :aria-label="label"><slot /></div>
  </component>
</template>

<script>
import { OverlayScrollbars } from 'overlayscrollbars';
import 'overlayscrollbars/styles/overlayscrollbars.css';

export default {
  name: 'AppScrollArea',
  props: {
    tag: { type: String, default: 'div' },
    label: { type: String, required: true },
  },
  mounted() {
    this.scrollArea = OverlayScrollbars({
      target: this.$el,
      elements: { viewport: this.$refs.viewport },
    }, {
      overflow: { x: 'hidden', y: 'scroll' },
      scrollbars: { theme: 'os-theme-neon', autoHide: 'never' },
    });
    window.addEventListener('resize', this.updateScrollArea);
  },
  updated() {
    this.updateScrollArea();
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.updateScrollArea);
    this.scrollArea.destroy();
  },
  methods: {
    updateScrollArea() {
      // Media-query padding changes need a fresh host measurement.
      this.scrollArea.update(true);
    },
  },
};
</script>

<style>
.app-scroll-area { position: relative; }
.app-scroll-viewport { scrollbar-gutter: auto; }
.app-scroll-viewport:focus-visible {
  outline: var(--focus-ring);
  outline-offset: calc(-1 * var(--focus-offset));
}
.os-theme-neon {
  --os-size: 10px;
  --os-padding-perpendicular: 2px;
  --os-padding-axis: 2px;
  --os-handle-border-radius: var(--radius-pill);
  --os-handle-bg: var(--border-strong);
  --os-handle-bg-hover: var(--text-muted);
  --os-handle-bg-active: var(--accent);
}
</style>
