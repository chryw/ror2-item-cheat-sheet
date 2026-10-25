import Vue from 'vue';
import Vuex from 'vuex';
import { SortType, Theme } from './data/constants';
import { getSurvivorBuild, survivorBuilds } from './data/survivorBuilds';
import items from './data/catalog';
import { customBuildStorageKey, parseCustomBuilds } from './helpers/CustomBuildUtils';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    cardSize: Theme.SMALL,
    pageTheme: Theme.DARK,
    showHidden: false,
    sortBy: SortType.RARITY,
    filterBy: { category: [], rarity: [], dlc: [] },
    searchTerm: "",
    selectedItem: null,
    selectedRole: "",
    recommendedOnly: true,
    customBuilds: [],
    nextCustomBuildNumber: 1,
    customBuildsLoaded: false,
    customBuildError: '',
    customBuildTarget: '',
  },
  getters: {
    builds: state => [...survivorBuilds, ...state.customBuilds.map(profile => ({
      ...profile,
      custom: true,
      tiers: { S: [], A: [], B: profile.itemIds.map(id => items[id].name) },
    }))],
    selectedBuild: (state, getters) => getSurvivorBuild(state.selectedRole, getters.builds),
  },
  actions: {
    loadCustomBuilds({ commit }, storage) {
      try {
        const data = parseCustomBuilds((storage || window.localStorage)
          .getItem(customBuildStorageKey));
        commit('loadCustomBuildData', data);
        commit('setCustomBuildError', '');
      } catch (error) {
        commit('setCustomBuildError',
          `Could not load custom builds: ${error.message} Existing saved data has not been overwritten.`);
      }
    },
    saveCustomBuilds({ state, commit }, storage) {
      if (!state.customBuildsLoaded) throw new Error('Custom builds have not loaded.');
      try {
        (storage || window.localStorage).setItem(customBuildStorageKey, JSON.stringify({
          version: 1, profiles: state.customBuilds, nextNumber: state.nextCustomBuildNumber,
        }));
        commit('setCustomBuildError', '');
      } catch (error) {
        commit('setCustomBuildError',
          `Could not save custom builds: ${error.message} Changes are only in memory; retry before leaving.`);
      }
    },
    createCustomBuild({ state, commit, dispatch }) {
      if (!state.customBuildsLoaded) throw new Error('Custom builds have not loaded.');
      commit('createCustomBuild');
      commit('setSelectedRole', state.customBuildTarget);
      commit('setRecommendedOnly', false);
      dispatch('saveCustomBuilds');
    },
    renameCustomBuild({ commit, dispatch }, payload) {
      commit('renameCustomBuild', payload);
      dispatch('saveCustomBuilds');
    },
    deleteCustomBuild({ state, commit, dispatch }, id) {
      if (!state.customBuildsLoaded) throw new Error('Custom builds have not loaded.');
      const wasSelected = state.selectedRole === id;
      commit('deleteCustomBuild', id);
      if (wasSelected) {
        commit('setSelectedRole', '');
        commit('setRecommendedOnly', true);
      }
      return dispatch('saveCustomBuilds');
    },
    addCustomBuildItem({ state, commit, dispatch }, itemId) {
      if (!state.customBuildsLoaded) throw new Error('Custom builds have not loaded.');
      if (!Object.prototype.hasOwnProperty.call(items, itemId) || items[itemId].hidden) {
        throw new Error('Cannot add an unknown item.');
      }
      if (!state.customBuildTarget) {
        commit('createCustomBuild');
      }
      commit('addCustomBuildItem', itemId);
      dispatch('saveCustomBuilds');
    },
    removeCustomBuildItem({ commit, dispatch }, payload) {
      commit('removeCustomBuildItem', payload);
      dispatch('saveCustomBuilds');
    },
  },
  mutations: {
    loadCustomBuildData(state, { profiles, nextNumber }) {
      state.customBuilds = profiles;
      state.nextCustomBuildNumber = nextNumber;
      state.customBuildsLoaded = true;
    },
    setCustomBuildError(state, message) {
      state.customBuildError = message;
    },
    setCustomBuildTarget(state, id) {
      if (id && !state.customBuilds.some(build => build.id === id)) {
        throw new Error(`Unknown custom build: ${id}`);
      }
      state.customBuildTarget = id;
    },
    createCustomBuild(state) {
      const number = state.nextCustomBuildNumber;
      const id = `custom-${number}`;
      state.customBuilds.push({
        id, name: `Custom ${String(number).padStart(2, '0')}`, itemIds: [],
      });
      state.nextCustomBuildNumber += 1;
      state.customBuildTarget = id;
    },
    renameCustomBuild(state, { id, name }) {
      const profile = state.customBuilds.find(build => build.id === id);
      if (!profile || typeof name !== 'string' || !name.trim() || name.trim().length > 80) {
        throw new Error('Custom build names must contain 1 to 80 characters.');
      }
      profile.name = name.trim();
    },
    deleteCustomBuild(state, id) {
      if (!state.customBuilds.some(build => build.id === id)) {
        throw new Error(`Unknown custom build: ${id}`);
      }
      state.customBuilds = state.customBuilds.filter(build => build.id !== id);
      if (state.customBuildTarget === id) state.customBuildTarget = '';
    },
    addCustomBuildItem(state, itemId) {
      const profile = state.customBuilds.find(build => build.id === state.customBuildTarget);
      if (!profile || !Object.prototype.hasOwnProperty.call(items, itemId)
        || items[itemId].hidden) {
        throw new Error('Cannot add an unknown item or custom build.');
      }
      if (!profile.itemIds.includes(itemId)) profile.itemIds.push(itemId);
    },
    removeCustomBuildItem(state, { id, itemId }) {
      const profile = state.customBuilds.find(build => build.id === id);
      if (!profile || !profile.itemIds.includes(itemId)) {
        throw new Error('Item is not in this custom build.');
      }
      profile.itemIds = profile.itemIds.filter(savedId => savedId !== itemId);
    },
    setSelectedRole(state, role) {
      if (role && !getSurvivorBuild(role) && !state.customBuilds.some(build => build.id === role)) {
        throw new Error(`Unknown survivor: ${role}`);
      }
      const previousRole = state.selectedRole;
      state.selectedRole = role;
      if (state.customBuilds.some(build => build.id === role)) state.customBuildTarget = role;
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
      Object.keys(state.filterBy).forEach(key => {
        if (filterBy[key]) state.filterBy[key] = filterBy[key];
      });
    },
    setFilterByState(state, filterToAdd) {
      Object.keys(state.filterBy).forEach(key => {
        if (filterToAdd[key]) state.filterBy[key] = filterToAdd[key];
      });
    },
    updateSearchTermState(state, searchTerm) {
      state.searchTerm = (searchTerm == null ? "" : searchTerm);
    },
    setSelectedItem(state, selectedItem) {
      state.selectedItem = selectedItem;
    },
  },
});
