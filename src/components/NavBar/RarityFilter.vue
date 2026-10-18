<template>
  <div class="nav-field">
    <label for="rarity-filter">Rarity</label>
    <multiselect
      id="rarity-filter"
      v-model="selected"
      :options="options"
      :multiple="true"
      :close-on-select="false"
      :show-labels="false"
      placeholder="All rarities"
    >
      <template slot="caret" slot-scope="{ toggle }">
        <span class="multiselect__select" @mousedown.prevent.stop="toggle">
          <font-awesome-icon icon="chevron-down" aria-hidden="true" />
        </span>
      </template>
      <template slot="tag" slot-scope="{ option, remove }">
        <span class="multiselect__tag">
          <span>{{ option }}</span>
          <button type="button" class="filter-remove" :aria-label="`Remove rarity ${option}`"
            @mousedown.prevent @click.stop="remove(option)">
            <font-awesome-icon icon="times" aria-hidden="true" />
          </button>
        </span>
      </template>
    </multiselect>
    <button v-if="selected.length" class="nav-clear" type="button" @click="selected = []">
      Clear rarities
    </button>
  </div>
</template>

<script>
import Multiselect from 'vue-multiselect';
import { ItemRarity } from '../../data/constants';

export default {
  name: 'RarityFilter',
  components: { Multiselect },
  computed: {
    options() { return Object.values(ItemRarity); },
    selected: {
      get() { return this.$store.state.filterBy.rarity; },
      set(value) { this.$store.commit('setFilterByState', { rarity: value }); },
    },
  },
};
</script>
