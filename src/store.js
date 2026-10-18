import Vue from 'vue';
import Vuex from 'vuex';
import { SortType, Theme } from './data/constants';
import { getSurvivorBuild } from './data/survivorBuilds';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    cardSize: Theme.SMALL,
    pageTheme: Theme.DARK,
    showHidden: false,
    sortBy: SortType.RARITY,
    filterBy: { category: [], rarity: [] },
    searchTerm: "",
    selectedItem: null,
    selectedRole: "",
    recommendedOnly: true,
  },
  mutations: {
    setSelectedRole(state, role) {
      if (role && !getSurvivorBuild(role)) {
        throw new Error(`Unknown survivor: ${role}`);
      }
      const previousRole = state.selectedRole;
      state.selectedRole = role;
      if (role && !previousRole) {
        state.sortBy = SortType.RECOMMENDED;
      } else if (!role && state.sortBy === SortType.RECOMMENDED) {
        state.sortBy = SortType.RARITY;
      }
    },
    setRecommendedOnly(state, value) {
      state.recommendedOnly = value;
    },
    updateSortByState(state, sortBy) {
      state.sortBy = sortBy || SortType.RARITY;
    },
    updateFilterByState(state, filterBy) {
      const { category, rarity } = state.filterBy;
      state.filterBy.category = filterBy.category || category;
      state.filterBy.rarity = filterBy.rarity || rarity;
    },
    setFilterByState(state, filterToAdd) {
      const { category, rarity } = filterToAdd;
      if (!category && rarity) {
        state.filterBy = { category: state.filterBy.category, rarity };
      } else if (!rarity && category) {
        state.filterBy = { category, rarity: state.filterBy.rarity };
      } else {
        state.filterBy = { category, rarity };
      }
    },
    updateSearchTermState(state, searchTerm) {
      state.searchTerm = (searchTerm == null ? "" : searchTerm);
    },
    setSelectedItem(state, selectedItem) {
      state.selectedItem = selectedItem;
    },
  },
});
