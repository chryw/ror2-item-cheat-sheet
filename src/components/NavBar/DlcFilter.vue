<template>
  <div class="nav-field">
    <label for="dlc-filter">DLC</label>
    <multiselect
      id="dlc-filter"
      v-model="selected"
      :options="options"
      :multiple="true"
      :close-on-select="false"
      :show-labels="false"
      placeholder="Base game + all DLC"
    >
      <template slot="caret" slot-scope="{ toggle }">
        <span class="multiselect__select" @mousedown.prevent.stop="toggle">
          <font-awesome-icon icon="chevron-down" aria-hidden="true" />
        </span>
      </template>
      <template slot="tag" slot-scope="{ option, remove }">
        <span class="multiselect__tag">
          <span>{{ option }}</span>
          <button type="button" class="filter-remove" :aria-label="`Remove DLC ${option}`"
            @mousedown.prevent @click.stop="remove(option)">
            <font-awesome-icon icon="times" aria-hidden="true" />
          </button>
        </span>
      </template>
    </multiselect>
    <button v-if="selected.length" class="nav-clear" type="button" @click="selected = []">
      Clear DLC
    </button>
  </div>
</template>

<script>
import Multiselect from 'vue-multiselect';
import { DlcIconUrl } from '../../data/constants';

export default {
  name: 'DlcFilter',
  components: { Multiselect },
  computed: {
    options() { return ['Base game', ...Object.keys(DlcIconUrl)]; },
    selected: {
      get() { return this.$store.state.filterBy.dlc; },
      set(value) { this.$store.commit('setFilterByState', { dlc: value }); },
    },
  },
};
</script>
