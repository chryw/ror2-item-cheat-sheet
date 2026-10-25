<template>
  <AppScrollArea id="item-navigation" tag="nav" class="navigation" label="Filter controls"
    :class="{ 'is-collapsed': collapsed }" aria-label="Item filters"
    :role="mobile ? 'dialog' : null" :aria-modal="mobile && !collapsed ? 'true' : null">
    <header class="nav-header">
      <AppButton
        ref="toggle"
        class="nav-toggle"
        icon-only
        :aria-expanded="String(!collapsed)"
        aria-controls="nav-controls"
        :aria-label="mobile ? 'Collapse navigation' : 'Hide filters'"
        :title="mobile ? 'Collapse navigation' : 'Hide filters'"
        @click="$emit('toggle')"
      >
        <AppIcon :name="mobile ? 'menu' : 'close'" />
      </AppButton>
      <div v-show="!collapsed" class="nav-brand">
        <strong>{{ mobile ? 'Risk of Rain 2' : 'Filters & builds' }}</strong>
        <small v-if="mobile" class="ui-eyebrow">Field guide</small>
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
    mobile: { type: Boolean, default: false },
  },
  methods: {
    focusToggle() { this.$refs.toggle.focus(); },
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
.nav-brand strong { font-size: var(--text-base); letter-spacing: -0.04em; white-space: nowrap; }
.nav-brand small { display: block; font-size: var(--text-xs); margin-top: 5px; }

.nav-toggle {
  flex: 0 0 var(--control-height-compact);
  margin-left: auto;
  order: 1;
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
  font: var(--text-label)/var(--leading-ui) var(--font-mono);
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
  font-size: var(--text-sm); line-height: 1.8; color: var(--muted-colour);
}

@media (max-width: 900px) {
  .navigation {
    position: fixed;
    inset: 0;
    z-index: var(--layer-panel);
    width: 100%;
    height: 100vh;
    height: 100dvh;
    padding: 0;
    border-right: 0;
    box-shadow: var(--shadow-panel);
  }
  .nav-header {
    padding: max(var(--space-3), env(safe-area-inset-top)) var(--space-4) var(--space-3);
  }
  .nav-toggle { margin-left: 0; order: 0; }
  .nav-controls {
    gap: var(--space-4);
    padding: 0 var(--space-4) max(var(--space-4), env(safe-area-inset-bottom));
  }
}
</style>
