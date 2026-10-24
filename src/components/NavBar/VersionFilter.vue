<template>
  <AppSelect id="version-filter" v-model="selected" label="Version" :options="options"
    multiple placeholder="All versions" />
</template>

<script>
import AppSelect from '../AppSelect.vue';
import { DlcIconUrl } from '../../data/constants';

export default {
  name: 'VersionFilter',
  components: { AppSelect },
  computed: {
    options() {
      return ['Base game', ...Object.keys(DlcIconUrl)].map(value => ({ value, label: value }));
    },
    selected: {
      get() { return this.$store.state.filterBy.dlc; },
      set(value) { this.$store.commit('setFilterByState', { dlc: value }); },
    },
  },
};
</script>
