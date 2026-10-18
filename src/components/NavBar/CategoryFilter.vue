<template>
  <div class="nav-field">
    <label for="category-filter">Category</label>
    <multiselect
      id="category-filter"
      v-model="selected"
      :options="options"
      :multiple="true"
      :close-on-select="false"
      :show-labels="false"
      placeholder="All categories"
    >
      <template slot="caret" slot-scope="{ toggle }">
        <span class="multiselect__select" @mousedown.prevent.stop="toggle">
          <font-awesome-icon icon="chevron-down" aria-hidden="true" />
        </span>
      </template>
      <template slot="tag" slot-scope="{ option, remove }">
        <span class="multiselect__tag">
          <span>{{ option }}</span>
          <button type="button" class="filter-remove" :aria-label="`Remove category ${option}`"
            @mousedown.prevent @click.stop="remove(option)">
            <font-awesome-icon icon="times" aria-hidden="true" />
          </button>
        </span>
      </template>
    </multiselect>
    <button v-if="selected.length" class="nav-clear" type="button" @click="selected = []">
      Clear categories
    </button>
  </div>
</template>

<script>
import Multiselect from 'vue-multiselect';
import items from '../../data/items.json';
import ItemIdUtils from '../../helpers/ItemIdUtils';

const options = [...new Set(Object.values(items).reduce((categories, item) => {
  return categories.concat((item.category || []).map(ItemIdUtils.categoryLabel));
}, []))].sort();

export default {
  name: 'CategoryFilter',
  components: { Multiselect },
  computed: {
    options() { return options; },
    selected: {
      get() { return this.$store.state.filterBy.category.map(ItemIdUtils.categoryLabel); },
      set(value) { this.$store.commit('setFilterByState', { category: value }); },
    },
  },
};
</script>
