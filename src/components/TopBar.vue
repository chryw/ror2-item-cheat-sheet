<template>
  <nav class="navigation" :class="{ 'is-collapsed': collapsed }" aria-label="Item filters">
    <header class="nav-header">
      <button
        class="nav-toggle ui-button"
        type="button"
        :aria-expanded="String(!collapsed)"
        aria-controls="nav-controls"
        :aria-label="collapsed ? 'Expand navigation' : 'Collapse navigation'"
        :title="collapsed ? 'Expand navigation' : 'Collapse navigation'"
        @click="collapsed = !collapsed"
      >
        <AppIcon name="menu" />
      </button>
      <div v-show="!collapsed" class="nav-brand">
        <strong>Risk of Rain 2</strong>
        <small class="ui-eyebrow">Field guide / 02</small>
      </div>
    </header>
    <div id="nav-controls" v-show="!collapsed" class="nav-controls">
      <SearchBar />
      <RoleFilter />
      <SortBySelector />
      <RarityFilter />
      <VersionFilter />
      <button class="nav-reset ui-button" type="button" @click="resetFilters">
        <AppIcon name="reset" />
        Reset filters
      </button>
      <p class="nav-hint">Your run, your rules.<br>Combine filters to find your next pickup.</p>
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
  flex: 0 0 var(--nav-width);
  width: var(--nav-width);
  padding: var(--space-5) var(--space-4);
  background: var(--panel-background);
  color: var(--text-colour);
  border-right: var(--border-width) solid var(--panel-border);
  overflow-y: auto;
  scrollbar-gutter: stable;
  scrollbar-width: thin;
}

.navigation.is-collapsed {
  flex-basis: var(--nav-width-collapsed);
  width: var(--nav-width-collapsed);
  padding-left: var(--space-2);
  padding-right: var(--space-2);
}

@supports not (scrollbar-gutter: stable) {
  .navigation { overflow-y: scroll; }
}

.nav-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}

.is-collapsed .nav-header { margin-bottom: 0; }
.nav-brand { min-width: 0; }
.nav-brand strong { font-size: var(--text-base); letter-spacing: -0.04em; white-space: nowrap; }
.nav-brand small { display: block; font-size: var(--text-xs); margin-top: 5px; }

.nav-toggle {
  display: flex;
  flex: 0 0 var(--control-height-compact);
  justify-content: center;
  align-items: center;
  width: var(--control-height-compact);
  height: var(--control-height-compact);
  padding: 0;
  min-height: var(--control-height-compact);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
}

.nav-controls { display: flex; flex-direction: column; gap: var(--space-5); }
.nav-field { display: flex; flex-direction: column; gap: var(--space-2); min-width: 0; }
.nav-field > span, .nav-field > label {
  color: var(--muted-colour);
  font: var(--text-label)/var(--leading-ui) var(--font-mono);
  letter-spacing: var(--tracking-label);
}

.nav-field input[type="search"], .nav-field input[type="text"] {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  height: var(--control-height);
  padding: 0 var(--space-3);
  font-family: var(--font-family);
  font-size: var(--text-control);
  font-weight: var(--weight-regular);
  color: var(--text-colour);
  background: var(--surface-raised);
  border: var(--border-width) solid var(--panel-border);
  border-radius: var(--radius-md);
}

.nav-search { position: relative; display: flex; align-items: center; }
.nav-search > svg {
  position: absolute;
  right: 12px;
  width: var(--icon-md);
  color: var(--muted-colour);
  pointer-events: none;
}
.nav-search > svg { left: 12px; right: auto; }
.nav-search input[type="search"] { padding-left: 34px; }
.nav-field input::placeholder { color: var(--muted-colour); }
.navigation button:focus-visible,
.nav-field input:focus-visible, .nav-checkbox input:focus-visible {
  outline: var(--focus-ring);
  outline-offset: var(--focus-offset);
}

.nav-checkbox {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-3);
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
}

.nav-checkbox input { accent-color: var(--accent); width: 16px; height: 16px; margin: 0; }
.nav-hint {
  margin: 0; padding-top: var(--space-4); border-top: var(--border-width) solid var(--border);
  font-size: var(--text-sm); line-height: 1.8; color: var(--muted-colour);
}

@media (max-width: 900px) {
  .navigation, .navigation.is-collapsed {
    flex: 0 0 auto;
    width: 100%;
    max-height: 50vh;
    padding: var(--space-3) var(--space-4);
    border-right: 0;
    border-bottom: var(--border-width) solid var(--panel-border);
  }
  .nav-header { margin-bottom: var(--space-4); }
  .nav-controls {
    display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-4);
  }
  .nav-hint { grid-column: 1 / -1; }
}

@media (max-width: 480px) {
  .nav-controls { grid-template-columns: minmax(0, 1fr); }
}
</style>
