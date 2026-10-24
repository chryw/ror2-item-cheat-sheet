<template>
  <AppSelect id="rarity-filter" v-model="selected" label="Rarity" :options="options"
    multiple placeholder="All rarities" />
</template>

<script>
import AppSelect from '../AppSelect.vue';
import { ItemRarity } from '../../data/constants';

export default {
  name: 'RarityFilter',
  components: { AppSelect },
  computed: {
    options() { return Object.values(ItemRarity).map(value => ({ value, label: value })); },
    selected: {
      get() { return this.$store.state.filterBy.rarity; },
      set(value) { this.$store.commit('setFilterByState', { rarity: value }); },
    },
  },
};
</script>
