<template>
  <div class="app-select-field" @keydown.esc.capture="closeOnEscape">
    <label class="select-label" :for="id">{{ label }}</label>
    <multiselect
      ref="control"
      :id="id"
      :aria-label="label"
      v-model="selected"
      class="app-select"
      :options="options"
      label="label"
      track-by="value"
      :multiple="multiple"
      :close-on-select="!multiple"
      :allow-empty="multiple"
      :disabled="disabled"
      :show-labels="false"
      :placeholder="placeholder"
      :max-height="240"
      open-direction="bottom"
      @open="openPopup"
      @close="closePopup"
      @search-change="updatePopup"
    >
      <template slot="caret" slot-scope="{ toggle }">
        <span class="multiselect__select" @mousedown.prevent.stop="toggle">
          <AppIcon name="chevron-down" />
        </span>
      </template>
      <template slot="tag" slot-scope="{ option, remove }">
        <span class="multiselect__tag">
          <span>{{ option.label }}</span>
          <AppButton class="select-remove" variant="ghost" icon-only size="compact"
            :aria-label="`Remove ${label.toLowerCase()} ${option.label}`"
            @mousedown.prevent @click.stop="remove(option)">
            <AppIcon name="close" />
          </AppButton>
        </span>
      </template>
    </multiselect>
    <AppButton v-if="multiple && value.length" class="select-clear" variant="ghost"
      @click="$emit('input', [])">Clear {{ label.toLowerCase() }}</AppButton>
  </div>
</template>

<script>
import Multiselect from 'vue-multiselect';
import 'vue-multiselect/dist/vue-multiselect.min.css';
import AppButton from './base/AppButton.vue';
import AppIcon from './Icons/AppIcon';

export default {
  name: 'AppSelect',
  components: {
    AppButton,
    AppIcon,
    Multiselect: {
      extends: Multiselect,
      watch: {
        pointer() {
          this.$nextTick(this.scrollToHighlightedOption);
        },
      },
      methods: {
        adjustPosition() {
          // The shared popup layer handles placement outside clipped scroll panels.
          this.preferredOpenDirection = 'below';
          this.optimizedHeight = this.maxHeight;
        },
        scrollToHighlightedOption() {
          if (!this.isOpen) return;
          const { list } = this.$refs;
          const option = list.querySelector('.multiselect__option--highlight');
          if (!option) return;
          // Options can wrap, so use rendered bounds instead of the library's fixed row height.
          const top = list.getBoundingClientRect().top + list.clientTop;
          const bounds = option.getBoundingClientRect();
          if (bounds.top < top) list.scrollTop += bounds.top - top;
          else if (bounds.bottom > top + list.clientHeight) {
            list.scrollTop += bounds.bottom - top - list.clientHeight;
          }
        },
      },
    },
  },
  props: {
    id: { type: String, required: true },
    label: { type: String, required: true },
    value: { type: [String, Array], required: true },
    options: { type: Array, required: true },
    multiple: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    placeholder: { type: String, default: 'Choose an option' },
  },
  updated() {
    this.updatePopup();
  },
  beforeDestroy() {
    this.closePopup();
  },
  methods: {
    closeOnEscape(event) {
      if (!this.$refs.control.isOpen) return;
      event.preventDefault();
      event.stopPropagation();
      this.$refs.control.deactivate();
    },
    openPopup() {
      this.$nextTick(() => {
        if (!this.$refs.control || !this.$refs.control.isOpen || this.popup) return;
        const { list } = this.$refs.control.$refs;
        this.popupParent = list.parentNode;
        this.popup = document.createElement('div');
        this.popup.className = 'app-select app-select-popup';
        this.popup.dataset.selectOwner = this.id;
        document.body.appendChild(this.popup);
        this.popup.appendChild(list);
        window.addEventListener('resize', this.positionPopup);
        window.addEventListener('scroll', this.positionPopup, true);
        this.positionPopup();
      });
    },
    closePopup() {
      if (!this.popup) return;
      window.removeEventListener('resize', this.positionPopup);
      window.removeEventListener('scroll', this.positionPopup, true);
      this.popupParent.appendChild(this.$refs.control.$refs.list);
      this.popup.remove();
      this.popup = null;
      this.popupParent = null;
    },
    updatePopup() {
      if (this.popup) this.$nextTick(this.positionPopup);
    },
    positionPopup() {
      if (!this.popup) return;
      const { control } = this.$refs;
      const anchor = control.$el.getBoundingClientRect();
      let parent = control.$el.parentElement;
      while (parent && parent !== document.body) {
        const style = getComputedStyle(parent);
        if (/(auto|scroll|hidden)/.test(style.overflowY)) {
          const bounds = parent.getBoundingClientRect();
          if (anchor.bottom <= bounds.top || anchor.top >= bounds.bottom) {
            control.deactivate();
            return;
          }
        }
        parent = parent.parentElement;
      }
      const gap = 6;
      const below = Math.max(0, window.innerHeight - anchor.bottom - gap);
      const above = Math.max(0, anchor.top - gap);
      const desiredHeight = Math.min(240, control.$refs.list.scrollHeight + 2);
      const upwards = below < desiredHeight && above > below;
      const height = Math.min(240, upwards ? above : below);
      control.optimizedHeight = height;
      const width = Math.min(anchor.width, window.innerWidth - 16);
      this.popup.style.width = `${width}px`;
      this.popup.style.left = `${Math.max(8, Math.min(anchor.left, window.innerWidth - width - 8))}px`;
      this.popup.style.top = upwards
        ? `${Math.max(gap, anchor.top - gap - Math.min(control.$refs.list.scrollHeight + 2, height))}px`
        : `${anchor.bottom + gap}px`;
    },
  },
  computed: {
    selected: {
      get() {
        return this.multiple
          ? this.options.filter(option => this.value.includes(option.value))
          : this.options.find(option => option.value === this.value) || null;
      },
      set(selection) {
        if (this.multiple) this.$emit('input', selection.map(option => option.value));
        else if (selection) this.$emit('input', selection.value);
      },
    },
  },
};
</script>

<style>
.app-select-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
  color: var(--text);
}
.select-label {
  font: var(--type-label);
  letter-spacing: var(--tracking-label); color: var(--text-muted);
}
.app-select {
  min-height: var(--control-height);
  line-height: var(--control-line-height);
  font-size: var(--text-control); color: var(--text);
}
.app-select.multiselect--disabled { background: transparent; opacity: var(--opacity-disabled); }
.app-select.multiselect--disabled .multiselect__select {
  background: transparent; color: var(--text-muted);
}
/* Keep detached controls rounded even when the library applies its joined-menu open state. */
.app-select.multiselect .multiselect__tags {
  min-height: var(--control-height);
  padding: calc((var(--control-height) - var(--control-line-height) - 2px) / 2)
    calc(var(--control-height) + var(--space-2))
    calc((var(--control-height) - var(--control-line-height) - 2px) / 2) var(--space-3);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface-raised);
  transition: border-color var(--motion-fast);
}
.app-select:hover .multiselect__tags { border-color: var(--border-strong); }
.app-select .multiselect__input, .app-select .multiselect__single {
  min-width: 0;
  min-height: var(--control-line-height);
  height: var(--control-line-height);
  padding: 0;
  margin: 0;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  background: var(--surface-raised);
  color: var(--text);
  font: inherit;
  font-size: var(--text-control);
  line-height: var(--control-line-height);
}
.app-select .multiselect__single { height: auto; overflow-wrap: anywhere; }
.app-select .multiselect__input::placeholder { color: var(--text-muted); }
.app-select .multiselect__input:focus { outline: none; }
.app-select:focus-within .multiselect__tags {
  outline: var(--focus-ring);
  outline-offset: var(--focus-offset-control);
}
.app-select .multiselect__placeholder {
  color: var(--text-muted); padding: 0; margin: 0; line-height: var(--control-line-height);
}
.app-select .multiselect__select {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--control-height);
  height: calc(var(--control-height) - 2px);
  color: var(--text-muted);
  font-size: var(--text-sm);
}
.app-select .multiselect__select::before { display: none; }
.app-select .app-icon { width: var(--icon-sm); height: var(--icon-sm); }
.app-select .multiselect__content-wrapper {
  position: absolute;
  margin: 0;
  border: var(--border-width) solid var(--border-strong);
  border-radius: var(--radius-md);
  background: var(--surface-raised);
  overflow-x: hidden;
}
.app-select .multiselect__content { background: var(--surface-raised); }
.app-select .multiselect__option {
  min-height: var(--control-height);
  padding: var(--control-padding-block) var(--space-3);
  white-space: normal; overflow-wrap: anywhere; line-height: var(--leading-label);
}
.app-select .multiselect__tag {
  min-height: var(--target-size);
  box-sizing: border-box;
  padding: var(--space-1) calc(var(--target-size) + var(--space-2)) var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  background: var(--accent-soft);
  border: var(--border-width) solid var(--border-strong);
  color: var(--accent);
  white-space: normal;
  overflow-wrap: anywhere;
  line-height: var(--leading-label);
}
.app-select .multiselect__option--selected { background: var(--accent-soft); color: var(--accent); }
.app-select .multiselect__option--highlight,
.app-select .multiselect__option--selected.multiselect__option--highlight {
  background: var(--accent);
  color: var(--on-accent);
}
.select-remove {
  position: absolute;
  top: 0;
  right: 0;
  width: var(--target-size);
  height: 100%;
  --button-color: var(--accent);
}
.select-clear {
  align-self: flex-start;
  color: var(--text-muted);
  text-decoration: underline;
  cursor: pointer;
}
.app-select-popup {
  position: fixed;
  z-index: var(--layer-popup);
  min-height: 0;
}
.app-select-popup .multiselect__content-wrapper {
  position: relative;
  display: block;
  width: 100%;
  box-sizing: border-box;
  box-shadow: var(--shadow-panel);
}
.select-clear:focus-visible, .select-remove:focus-visible {
  outline: var(--focus-ring);
  outline-offset: var(--focus-offset-control);
}
</style>
