<template>
  <div class="app-select-field" @keydown.esc.capture="closeOnEscape">
    <label :id="`${id}-label`" class="select-label" :for="id">{{ label }}</label>
    <multiselect
      v-if="!usePicker"
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
    <AppButton v-else :id="id" ref="pickerTrigger" class="picker-trigger"
      :disabled="disabled" aria-haspopup="dialog" :aria-expanded="String(pickerOpen)"
      :aria-controls="`${id}-picker`" :aria-labelledby="`${id}-label ${id}-value`"
      @click="openPicker">
      <span :id="`${id}-value`" class="picker-value" :class="{ 'is-placeholder': !selectionLabel }">
        {{ selectionLabel || placeholder }}
      </span>
      <AppIcon name="chevron-down" />
    </AppButton>
    <AppButton v-if="!usePicker && multiple && value.length" class="select-clear" variant="ghost"
      @click="$emit('input', [])">Clear {{ label.toLowerCase() }}</AppButton>
    <dialog :id="`${id}-picker`" ref="pickerDialog" class="picker-dialog"
      :aria-labelledby="`${id}-picker-title`" @keydown.stop
      @cancel.prevent="closePicker" @close="handlePickerClose" @click="dismissPickerBackdrop">
      <header class="picker-header">
        <div>
          <h2 :id="`${id}-picker-title`" ref="pickerTitle" tabindex="-1">{{ label }}</h2>
          <p :aria-live="multiple ? 'polite' : null">
            {{ multiple ? `${pickerDraft.length} selected. Choose any that apply.` :
              'Choose one option.' }}
          </p>
        </div>
        <AppButton icon-only variant="ghost" :aria-label="`Close ${label.toLowerCase()} picker`"
          @click="closePicker"><AppIcon name="close" /></AppButton>
      </header>
      <AppScrollArea ref="pickerList" class="picker-body" :label="`${label} choices`">
        <div v-if="options.length > 8" class="picker-search">
          <label class="select-label" :for="`${id}-picker-search`">
            Search {{ label.toLowerCase() }}
          </label>
          <AppInput :id="`${id}-picker-search`" v-model="pickerQuery" type="search"
            autocomplete="off" />
        </div>
        <fieldset class="picker-options">
          <legend class="ui-visually-hidden">
            {{ multiple ? 'Choose any that apply' : 'Choose one option' }}
          </legend>
          <label v-for="option in pickerOptions" :key="option.value" class="picker-choice"
            :class="{ 'is-checked': isDraftSelected(option.value) }">
            <input :type="multiple ? 'checkbox' : 'radio'" :name="`${id}-choice`"
              :value="option.value" :checked="isDraftSelected(option.value)"
              @change="toggleDraft(option.value)" />
            <span>{{ option.label }}</span>
          </label>
        </fieldset>
        <p v-if="!pickerOptions.length" class="picker-empty" role="status">No matching options.</p>
      </AppScrollArea>
      <footer class="picker-footer">
        <AppButton v-if="multiple" variant="ghost" aria-label="Clear selection"
          @click="pickerDraft = []">
          Clear
        </AppButton>
        <div class="picker-actions">
          <AppButton @click="closePicker">Cancel</AppButton>
          <AppButton variant="primary" :disabled="!canApplyPicker" @click="applyPicker">
            Apply
          </AppButton>
        </div>
      </footer>
    </dialog>
  </div>
</template>

<script>
import Multiselect from 'vue-multiselect';
import 'vue-multiselect/dist/vue-multiselect.min.css';
import AppButton from './base/AppButton.vue';
import AppIcon from './Icons/AppIcon';
import AppInput from './base/AppInput.vue';
import AppScrollArea from './AppScrollArea.vue';

export default {
  name: 'AppSelect',
  components: {
    AppButton,
    AppIcon,
    AppInput,
    AppScrollArea,
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
  data() {
    return {
      usePicker: false,
      pickerOpen: false,
      pickerQuery: '',
      pickerDraft: '',
    };
  },
  mounted() {
    this.pickerMedia = window.matchMedia('(max-width: 900px), (any-pointer: coarse)');
    this.pickerMedia.addEventListener('change', this.updatePickerMode);
    this.updatePickerMode();
  },
  updated() {
    this.updatePopup();
  },
  beforeDestroy() {
    if (this.pickerMedia) this.pickerMedia.removeEventListener('change', this.updatePickerMode);
    this.closePicker(false);
    this.closePopup();
  },
  methods: {
    updatePickerMode() {
      const usePicker = this.pickerMedia.matches;
      if (usePicker === this.usePicker) return;
      const wasOpen = this.pickerOpen || (this.$refs.control && this.$refs.control.isOpen);
      this.closePicker(false);
      if (this.$refs.control && this.$refs.control.isOpen) this.$refs.control.deactivate();
      this.usePicker = usePicker;
      if (wasOpen) {
        this.$nextTick(() => {
          const control = this.usePicker ? this.$refs.pickerTrigger : this.$refs.control;
          if (control && control.$el.getBoundingClientRect().width > 0) {
            control.$el.focus({ preventScroll: true });
          }
        });
      }
    },
    openPicker() {
      if (this.disabled || this.pickerOpen) return;
      this.pickerDraft = this.multiple ? this.value.slice() : this.value;
      this.pickerQuery = '';
      this.pickerOpen = true;
      this.$refs.pickerDialog.showModal();
      window.addEventListener('resize', this.updatePickerViewport);
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', this.updatePickerViewport);
        window.visualViewport.addEventListener('scroll', this.updatePickerViewport);
      }
      this.updatePickerViewport();
      this.$nextTick(() => {
        if (!this.pickerOpen) return;
        this.$refs.pickerTitle.focus({ preventScroll: true });
        this.$refs.pickerList.$refs.viewport.scrollTop = 0;
        this.$refs.pickerList.updateScrollArea();
      });
    },
    closePicker(restoreFocus = true) {
      if (!this.pickerOpen) return;
      this.pickerOpen = false;
      this.$refs.pickerDialog.close();
      window.removeEventListener('resize', this.updatePickerViewport);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', this.updatePickerViewport);
        window.visualViewport.removeEventListener('scroll', this.updatePickerViewport);
      }
      if (restoreFocus && this.$refs.pickerTrigger) {
        this.$refs.pickerTrigger.$el.focus({ preventScroll: true });
      }
    },
    handlePickerClose() {
      if (this.pickerOpen && !this.$refs.pickerDialog.open) this.closePicker();
    },
    updatePickerViewport() {
      if (!this.pickerOpen) return;
      const viewport = window.visualViewport;
      const height = viewport ? viewport.height : window.innerHeight;
      const bottom = viewport ? Math.max(0, window.innerHeight - height - viewport.offsetTop) : 0;
      this.$refs.pickerDialog.style.setProperty('--picker-viewport-height', `${height}px`);
      this.$refs.pickerDialog.style.setProperty('--picker-viewport-bottom', `${bottom}px`);
    },
    dismissPickerBackdrop(event) {
      if (event.target !== this.$refs.pickerDialog) return;
      const bounds = event.target.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right
        || event.clientY < bounds.top || event.clientY > bounds.bottom) this.closePicker();
    },
    isDraftSelected(value) {
      return this.multiple ? this.pickerDraft.includes(value) : this.pickerDraft === value;
    },
    toggleDraft(value) {
      if (!this.multiple) this.pickerDraft = value;
      else if (this.pickerDraft.includes(value)) {
        this.pickerDraft = this.pickerDraft.filter(selected => selected !== value);
      } else this.pickerDraft = [...this.pickerDraft, value];
    },
    applyPicker() {
      const value = this.multiple ? this.pickerDraft.slice() : this.pickerDraft;
      this.closePicker();
      this.$emit('input', value);
    },
    closeOnEscape(event) {
      if (!this.$refs.control || !this.$refs.control.isOpen) return;
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
        this.$nextTick(this.$refs.control.scrollToHighlightedOption);
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
    selectionLabel() {
      return this.multiple
        ? this.options.filter(option => this.value.includes(option.value))
          .map(option => option.label).join(', ')
        : (this.options.find(option => option.value === this.value) || {}).label || '';
    },
    pickerOptions() {
      const query = this.pickerQuery.trim().toLowerCase();
      return this.options.filter(option => option.label.toLowerCase().includes(query));
    },
    canApplyPicker() {
      return this.multiple || this.options.some(option => option.value === this.pickerDraft);
    },
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
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-1);
  min-height: var(--control-height);
  padding: calc((var(--control-height) - var(--control-line-height) - 2px) / 2)
    calc(var(--control-height) + var(--space-2))
    calc((var(--control-height) - var(--control-line-height) - 2px) / 2) var(--space-3);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface-raised);
  transition: border-color var(--motion-fast);
}
.app-select .multiselect__tags-wrap { display: contents; }
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
  top: 50%;
  padding: 0;
  transform: translateY(-50%);
  color: var(--text-muted);
  font-size: var(--text-sm);
}
.app-select.multiselect--active .multiselect__select {
  transform: translateY(-50%) rotate(180deg);
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
.app-select.multiselect:not(.multiselect--active) > .multiselect__content-wrapper {
  display: none;
}
.app-select .multiselect__content { background: var(--surface-raised); }
.app-select .multiselect__option {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  min-height: var(--control-height);
  padding: var(--control-padding-block) var(--space-3);
  white-space: normal; overflow-wrap: anywhere; line-height: var(--leading-label);
}
.app-select .multiselect__tag {
  display: inline-flex;
  align-items: center;
  margin: 0;
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
.picker-trigger, .picker-dialog {
  --target-size: var(--target-size-touch);
  --control-height: var(--target-size-touch);
  --control-height-compact: var(--target-size-touch);
}
.picker-trigger { width: 100%; justify-content: space-between; font-weight: var(--weight-regular); }
.picker-value { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.picker-value.is-placeholder { color: var(--text-muted); }
.picker-dialog {
  --picker-viewport-height: 100dvh;
  --picker-viewport-bottom: 0px;
  box-sizing: border-box;
  position: fixed;
  inset: auto 0 var(--picker-viewport-bottom);
  width: 100%;
  max-width: none;
  height: min(80dvh, 640px);
  max-height: calc(var(--picker-viewport-height) - var(--space-5));
  margin: 0;
  padding: 0;
  border: var(--border-width) solid var(--border-strong);
  border-bottom: 0;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  background: var(--surface);
  color: var(--text);
  overscroll-behavior: contain;
}
.picker-dialog:not([open]) { display: none; }
.picker-dialog[open] { display: flex; flex-direction: column; }
.picker-dialog::backdrop { background: rgba(0, 0, 0, 0.6); }
.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  flex-shrink: 0;
  padding: var(--space-4);
}
.picker-header > div { min-width: 0; }
.picker-header h2 { margin: 0; font: var(--type-title); overflow-wrap: anywhere; }
.picker-header p {
  margin: var(--space-1) 0 0;
  font: var(--type-caption);
  color: var(--text-muted);
}
.picker-body { flex: 1; min-height: 0; padding: 0 var(--space-4); }
.picker-body .app-scroll-viewport { overscroll-behavior: contain; }
.picker-search { display: grid; gap: var(--space-2); margin-bottom: var(--space-4); }
.picker-options {
  display: grid;
  gap: var(--space-1);
  margin: 0;
  padding: 0;
  border: 0;
  min-width: 0;
}
.picker-choice {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  box-sizing: border-box;
  min-height: var(--target-size);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  font: var(--type-body);
  cursor: pointer;
}
.picker-choice:hover { background: var(--surface-hover); }
.picker-choice.is-checked { background: var(--accent-soft); }
.picker-choice input {
  flex-shrink: 0;
  width: var(--icon-sm);
  height: var(--icon-sm);
  margin: 0;
  accent-color: var(--accent);
}
.picker-choice span { min-width: 0; overflow-wrap: anywhere; }
.picker-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
  padding: var(--space-3) var(--space-4)
    max(var(--space-4), env(safe-area-inset-bottom));
}
.picker-actions { display: flex; gap: var(--space-2); margin-left: auto; }
.picker-empty { font: var(--type-body); color: var(--text-muted); }
</style>
