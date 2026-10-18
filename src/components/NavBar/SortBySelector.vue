<template>
  <label class="nav-field" for="sort-by-select">
    <span>Sort by</span>
    <span class="nav-select">
      <select id="sort-by-select" v-model="sortBy">
        <option v-for="option in sortOptions" :key="option" :value="option">
          {{ option }}
        </option>
      </select>
      <font-awesome-icon icon="chevron-down" aria-hidden="true" />
    </span>
  </label>
</template>

<script>
import { SortType } from '../../data/constants';

export default {
  name: 'SortBySelector',
  computed: {
    sortOptions() {
      return [SortType.RARITY, SortType.NAME].concat(
        this.$store.state.selectedRole ? [SortType.RECOMMENDED] : [],
      );
    },
    sortBy: {
      get() { return this.$store.state.sortBy; },
      set(value) { this.$store.commit('updateSortByState', value); },
    },
  },
};
</script>
