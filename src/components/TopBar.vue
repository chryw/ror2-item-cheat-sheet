<template>
  <nav class="navigation" :class="{ 'is-collapsed': collapsed }" aria-label="Item filters">
    <header class="nav-header">
      <button
        class="nav-toggle"
        type="button"
        :aria-expanded="String(!collapsed)"
        aria-controls="nav-controls"
        :aria-label="collapsed ? 'Expand navigation' : 'Collapse navigation'"
        :title="collapsed ? 'Expand navigation' : 'Collapse navigation'"
        @click="collapsed = !collapsed"
      >
        <font-awesome-icon icon="bars" aria-hidden="true" />
      </button>
      <div v-show="!collapsed" class="nav-brand">
        <strong>Risk of Rain 2</strong>
        <small>Item cheat sheet</small>
      </div>
    </header>
    <div id="nav-controls" v-show="!collapsed" class="nav-controls">
      <SearchBar />
      <RoleFilter />
      <SortBySelector />
      <RarityFilter />
      <VersionFilter />
      <button class="nav-reset" type="button" @click="resetFilters">
        <font-awesome-icon icon="undo-alt" aria-hidden="true" />
        Reset filters
      </button>
      <p class="nav-hint">Combine filters to narrow your next pickup.</p>
    </div>
  </nav>
</template>

<script>
import SearchBar from './NavBar/SearchBar.vue';
import RoleFilter from './NavBar/RoleFilter.vue';
import SortBySelector from './NavBar/SortBySelector.vue';
import RarityFilter from './NavBar/RarityFilter.vue';
import VersionFilter from './NavBar/VersionFilter.vue';
import { SortType } from '../data/constants';

export default {
  name: 'TopBar',
  components: { SearchBar, RoleFilter, SortBySelector, RarityFilter, VersionFilter },
  data() { return { collapsed: false }; },
  methods: {
    resetFilters() {
      this.$store.commit('setSelectedRole', '');
      this.$store.commit('setRecommendedOnly', true);
      this.$store.commit('updateSortByState', SortType.RARITY);
      this.$store.commit('setFilterByState', { category: [], rarity: [], dlc: [] });
      this.$store.commit('updateSearchTermState', '');
    },
  },
};
</script>

<style>
.navigation {
  box-sizing: border-box;
  flex: 0 0 248px;
  width: 248px;
  padding: 16px 12px;
  background: var(--panel-background);
  color: var(--text-colour);
  border-right: 1px solid var(--panel-border);
  overflow-y: auto;
  scrollbar-width: thin;
}

.navigation.is-collapsed {
  flex-basis: 64px;
  width: 64px;
}

.nav-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.is-collapsed .nav-header { margin-bottom: 0; }
.nav-brand { min-width: 0; }
.nav-brand strong { font-size: 15px; white-space: nowrap; }
.nav-brand small { display: block; color: var(--muted-colour); font-size: 12px; margin-top: 4px; }

.nav-toggle {
  display: flex;
  flex: 0 0 40px;
  justify-content: center;
  align-items: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 1px solid var(--panel-border);
  border-radius: 4px;
  background: #fff;
  color: inherit;
  cursor: pointer;
  font-size: 16px;
}

.nav-controls { display: flex; flex-direction: column; gap: 16px; }
.nav-field { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.nav-field > span, .nav-field > label {
  color: var(--muted-colour);
  font-size: 12px;
  font-weight: 600;
}

.nav-field input[type="search"], .nav-field input[type="text"] {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  height: 40px;
  padding: 0 10px;
  font: inherit;
  font-size: 14px;
  font-weight: 400;
  color: var(--text-colour);
  background: #fff;
  border: 1px solid var(--panel-border);
  border-radius: 4px;
}

.nav-search { position: relative; display: flex; align-items: center; }
.nav-search > svg {
  position: absolute;
  right: 12px;
  width: 12px;
  color: var(--muted-colour);
  pointer-events: none;
}
.nav-search > svg { left: 12px; right: auto; }
.nav-search input[type="search"] { padding-left: 34px; }
.nav-field input::placeholder { color: var(--muted-colour); }
.navigation button:focus-visible,
.nav-field input:focus-visible, .nav-checkbox input:focus-visible {
  outline: 2px solid #555;
  outline-offset: 3px;
}

.nav-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  font-size: 12px;
  line-height: 1.5;
}

.nav-checkbox input { accent-color: #555; width: 16px; height: 16px; margin: 0; }
.nav-reset {
  min-height: 40px;
  padding: 10px 16px;
  border: 1px solid var(--panel-border);
  border-radius: 4px;
  background: #fff;
  color: var(--text-colour);
  font: inherit;
  font-size: 14px;
  cursor: pointer;
}
.nav-reset svg { margin-right: 6px; }
.nav-toggle:hover, .nav-reset:hover { background: #e4e4e4; border-color: #999; }
.nav-hint { margin: 0; font-size: 12px; line-height: 1.6; color: var(--muted-colour); }

@media (max-width: 900px) {
  .navigation, .navigation.is-collapsed {
    flex: 0 0 auto;
    width: 100%;
    max-height: 50vh;
    padding: 12px 16px;
    border-right: 0;
    border-bottom: 1px solid var(--panel-border);
  }
  .nav-header { margin-bottom: 16px; }
  .nav-controls { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
  .nav-hint { grid-column: 1 / -1; }
}

@media (max-width: 480px) {
  .nav-controls { grid-template-columns: minmax(0, 1fr); }
}
</style>
