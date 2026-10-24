<template>
  <div class="app-select-field">
    <label class="select-label" :for="id">{{ label }}</label>
    <multiselect
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
    >
      <template slot="caret" slot-scope="{ toggle }">
        <span class="multiselect__select" @mousedown.prevent.stop="toggle">
          <font-awesome-icon icon="chevron-down" aria-hidden="true" />
        </span>
      </template>
      <template slot="tag" slot-scope="{ option, remove }">
        <span class="multiselect__tag">
          <span>{{ option.label }}</span>
          <button type="button" class="select-remove"
            :aria-label="`Remove ${label.toLowerCase()} ${option.label}`"
            @mousedown.prevent @click.stop="remove(option)">
            <font-awesome-icon icon="times" aria-hidden="true" />
          </button>
        </span>
      </template>
    </multiselect>
    <button v-if="multiple && value.length" class="select-clear" type="button"
      @click="$emit('input', [])">Clear {{ label.toLowerCase() }}</button>
  </div>
</template>

<script>
import Multiselect from 'vue-multiselect';
import 'vue-multiselect/dist/vue-multiselect.min.css';

export default {
  name: 'AppSelect',
  components: {
    Multiselect: {
      extends: Multiselect,
      watch: {
        pointer() {
          this.$nextTick(this.scrollToHighlightedOption);
        },
      },
      methods: {
        adjustPosition() {
          // In-flow menus scroll with their panel, so viewport overlay limits do not apply.
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
  gap: 8px;
  min-width: 0;
  color: #333;
}
.select-label { font-size: 12px; font-weight: 600; color: #666; }
.app-select { font-size: 14px; color: #333; }
.app-select .multiselect__tags {
  min-height: 40px;
  padding: 9px 36px 0 10px;
  border: 1px solid #bbb;
  border-radius: 4px;
  background: #fff;
}
.app-select .multiselect__input, .app-select .multiselect__single {
  min-width: 0;
  min-height: 20px;
  height: 20px;
  padding: 0;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  background: #fff;
  color: #333;
  font: inherit;
  font-size: 14px;
  line-height: 20px;
}
.app-select .multiselect__single { height: auto; overflow-wrap: anywhere; }
.app-select .multiselect__input::placeholder { color: #666; }
.app-select .multiselect__input:focus { outline: none; }
.app-select:focus-within .multiselect__tags {
  outline: 2px solid #555;
  outline-offset: 2px;
}
.app-select .multiselect__placeholder { color: #666; padding: 0; margin-bottom: 8px; }
.app-select .multiselect__select {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 38px;
  color: #666;
  font-size: 12px;
}
.app-select .multiselect__select::before { display: none; }
.app-select .multiselect__content-wrapper { position: relative; border-color: #bbb; }
.app-select .multiselect__content { background: #fff; }
.app-select .multiselect__option { white-space: normal; overflow-wrap: anywhere; line-height: 1.4; }
.app-select .multiselect__tag {
  padding-right: 26px;
  border-radius: 3px;
  background: #e4e4e4;
  color: #333;
  white-space: normal;
  overflow-wrap: anywhere;
  line-height: 1.4;
}
.app-select .multiselect__option--selected { background: #e4e4e4; color: #333; }
.app-select .multiselect__option--highlight,
.app-select .multiselect__option--selected.multiselect__option--highlight {
  background: #555;
  color: #fff;
}
.select-remove {
  position: absolute;
  top: 0;
  right: 0;
  width: 24px;
  height: 100%;
  border: 0;
  border-radius: 3px;
  background: transparent;
  color: #555;
  cursor: pointer;
}
.select-remove:hover { background: #ccc; }
.select-clear {
  align-self: flex-start;
  padding: 0;
  border: 0;
  background: none;
  color: #666;
  text-decoration: underline;
  cursor: pointer;
}
.select-clear:focus-visible, .select-remove:focus-visible {
  outline: 2px solid #555;
  outline-offset: 2px;
}
</style>
