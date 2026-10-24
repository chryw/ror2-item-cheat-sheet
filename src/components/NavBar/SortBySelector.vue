<template>
  <AppSelect id="sort-by-select" v-model="sortBy" label="Sort by" :options="sortOptions" />
</template>

<script>
import { SortType } from '../../data/constants';
import AppSelect from '../AppSelect.vue';

export default {
  name: 'SortBySelector',
  components: { AppSelect },
  computed: {
    isCustom() {
      return this.$store.getters.selectedBuild && this.$store.getters.selectedBuild.custom;
    },
    sortOptions() {
      return [SortType.RARITY, SortType.NAME].concat(
        this.$store.state.selectedRole ? [SortType.RECOMMENDED] : [],
      ).map(value => ({
        value,
        label: value === SortType.RECOMMENDED && this.isCustom ? 'Saved items first' : value,
      }));
    },
    sortBy: {
      get() { return this.$store.state.sortBy; },
      set(value) { this.$store.commit('updateSortByState', value); },
    },
  },
};
</script>
