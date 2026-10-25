<template>
  <AppScrollArea id="item-navigation" tag="nav" class="navigation" label="Filter controls"
    :class="{ 'is-collapsed': collapsed }" aria-label="Item filters">
    <header class="nav-header">
      <div v-show="!collapsed" class="nav-brand">
        <h2>Filters &amp; builds</h2>
      </div>
    </header>
    <div id="nav-controls" v-show="!collapsed" class="nav-controls">
      <SearchBar />
      <RoleFilter @navigate="$emit('navigate')" />
      <SortBySelector />
      <RarityFilter />
      <VersionFilter />
      <AppButton class="nav-reset" @click="resetFilters">
        <AppIcon name="reset" />
        Reset filters
      </AppButton>
      <p class="nav-hint">Your run, your rules.<br>Combine filters to find your next pickup.</p>
    </div>
  </AppScrollArea>
</template>

<script>
import SearchBar from './NavBar/SearchBar.vue';
import AppScrollArea from './AppScrollArea.vue';
import RoleFilter from './NavBar/RoleFilter.vue';
import SortBySelector from './NavBar/SortBySelector.vue';
import RarityFilter from './NavBar/RarityFilter.vue';
import VersionFilter from './NavBar/VersionFilter.vue';
import { SortType } from '../data/constants';

export default {
  name: 'TopBar',
  components: { AppScrollArea, SearchBar, RoleFilter, SortBySelector, RarityFilter, VersionFilter },
  props: {
    collapsed: { type: Boolean, default: true },
  },
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
  padding: 0;
  background: var(--panel-background);
  color: var(--text-colour);
  border-right: var(--border-width) solid var(--panel-border);
}

.navigation.is-collapsed { display: none; }

.nav-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  position: sticky;
  top: 0;
  z-index: 1;
  padding: var(--space-4);
  margin-bottom: var(--space-4);
  background: var(--surface);
  border-bottom: var(--border-width) solid var(--border);
}

.nav-brand { min-width: 0; }
.nav-brand h2 {
  margin: 0;
  font: var(--type-heading);
  letter-spacing: var(--tracking-heading);
}

.nav-controls {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding: 0 var(--space-4) var(--space-4);
}
.nav-field { display: flex; flex-direction: column; gap: var(--space-2); min-width: 0; }
.nav-field > span, .nav-field > label {
  color: var(--muted-colour);
  font: var(--type-label);
  letter-spacing: var(--tracking-label);
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
  min-height: var(--target-size);
  cursor: pointer;
}

.nav-checkbox input { accent-color: var(--accent); width: 16px; height: 16px; margin: 0; }
.nav-hint {
  margin: 0; padding-top: var(--space-4); border-top: var(--border-width) solid var(--border);
  font: var(--type-caption); color: var(--muted-colour);
}

@media (max-width: 900px) {
  .navigation {
    position: absolute;
    inset: 0;
    z-index: var(--layer-panel);
    width: 100%;
    height: 100%;
    padding: 0;
    border-right: 0;
    box-shadow: var(--shadow-panel);
  }
  .nav-header {
    padding: var(--space-4);
  }
  .nav-controls {
    gap: var(--space-4);
    padding: 0 var(--space-4) max(var(--space-4), env(safe-area-inset-bottom));
  }
}
</style>
