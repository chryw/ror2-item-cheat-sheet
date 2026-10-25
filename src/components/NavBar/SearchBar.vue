<template>
  <label class="nav-field" for="search-bar-input">
    <span>Search items</span>
    <span class="nav-search">
      <SearchIcon />
      <AppInput
        id="search-bar-input"
        v-model="searchTerm"
        type="search"
        placeholder="Name or description..."
      />
    </span>
  </label>
</template>

<script>
import SearchIcon from '../Icons/SearchIcon.vue';

export default {
  name: 'SearchBar',
  components: { SearchIcon },
  computed: {
    searchTerm: {
      get() { return this.$store.state.searchTerm; },
      set(value) { this.$store.commit('updateSearchTermState', value); },
    },
  },
};
</script>
