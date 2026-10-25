<template>
  <div class="home-page">
    <header class="product-header" :inert="blockingGallery ? '' : null"
      :aria-hidden="blockingGallery ? 'true' : null">
      <AppButton ref="navigationToggle" class="navigation-toggle" :icon-only="mobileLayout"
        :aria-label="mobileLayout ? 'Expand navigation' :
          (navCollapsed ? 'Show filters' : 'Hide filters')"
        aria-controls="item-navigation" :aria-expanded="String(!navCollapsed)"
        @click="toggleNavigation">
        <AppIcon :name="mobileLayout ? 'menu' : 'panel-left'" />
        <span v-if="!mobileLayout">Filters</span>
      </AppButton>
      <span class="header-divider" aria-hidden="true"></span>
      <div class="product-identity">
        <h1>Risk of Rain 2 <span>Field Guide</span></h1>
        <p>Items, equipment, drones, and survivor builds.</p>
      </div>
    </header>
    <div class="workspace">
      <TopBar ref="navigation" :collapsed="navCollapsed" :mobile="mobileLayout"
              @toggle="toggleNavigation" @navigate="navigateFromFilters" />
      <div class="info-section">
        <AppScrollArea ref="gallery" class="item-list-section" label="Pickup gallery"
          :inert="blockingGallery ? '' : null"
          :aria-hidden="blockingGallery ? 'true' : null">
          <div class="gallery-content">
            <div v-if="$store.state.customBuildError" class="build-error" role="alert">
              <p>{{ $store.state.customBuildError }}</p>
              <AppButton @click="retryStorage">Retry storage</AppButton>
            </div>
            <div v-if="build" class="build-summary" aria-live="polite">
              <div>
                <h2>{{ build.name }}</h2>
                <p v-if="!build.custom">
                  {{ build.focus }}.
                  {{ recommendedOnly ? 'Recommended pickups only.' : 'Showing all pickups.' }}
                </p>
                <p v-else>
                  {{ build.itemIds.length }} saved
                  {{ build.itemIds.length === 1 ? 'pickup' : 'pickups' }}.
                  {{ $store.state.customBuildError ? 'Not saved to this browser.' :
                    'Automatically saved in this browser.' }}
                  {{ recommendedOnly ? 'Showing saved items only.' : 'Browse the gallery to add.' }}
                </p>
              </div>
              <div v-if="!build.custom" class="build-legend">
                <p class="build-legend-ranks">
                  <span><strong class="build-badge build-badge--S">S</strong> Core</span>
                  <span><strong class="build-badge build-badge--A">A</strong> Synergy</span>
                  <span><strong class="build-badge build-badge--B">B</strong> Support</span>
                </p>
                <a v-if="build.source" :href="build.source"
                  target="_blank" rel="noopener noreferrer">
                  {{ build.id === 'operator' ? 'Operator guide' : 'Survivor mechanics' }}
                  <AppIcon name="external-link" />
                </a>
                <span class="build-legend-note">
                  Starter priorities, not a universal tier list.
                </span>
              </div>
              <CustomBuildEditor v-if="build.custom" :key="build.id" :build="build"
                                 @delete="deleteCustomBuild" />
            </div>
            <ItemList style="flex: 1;" :itemListType="SelectionType.ITEM" />
            <ItemList style="flex: 1;" :itemListType="SelectionType.EQUIPMENT" />
            <ItemList style="flex: 1;" :itemListType="SelectionType.DRONE" />
          </div>
        </AppScrollArea>
        <SideBar ref="details" :mobile="mobileLayout"
                 @close="restoreDetailsFocus" @view-build="viewBuild" />
      </div>
    </div>
  </div>
</template>

<script>
import ItemList from './ItemList.vue';
import AppScrollArea from './AppScrollArea.vue';
import TopBar from './TopBar.vue';
import SideBar from './SideBar.vue';
import CustomBuildEditor from './CustomBuildEditor.vue';
import { SelectionType } from '../data/constants';

export default {
  name: "HomePage",
  components: {
    AppScrollArea,
    ItemList,
    TopBar,
    SideBar,
    CustomBuildEditor,
  },
  data() {
    return {
      SelectionType,
      navCollapsed: true,
      mobileLayout: false,
    };
  },
  computed: {
    build() { return this.$store.getters.selectedBuild; },
    recommendedOnly() { return this.$store.state.recommendedOnly; },
    selectedItem() { return this.$store.state.selectedItem; },
    blockingGallery() {
      return this.mobileLayout && (!this.navCollapsed || this.selectedItem !== null);
    },
  },
  watch: {
    selectedItem(item, previous) {
      if (!item) return;
      if (!previous) this.detailsReturnFocus = document.activeElement;
      if (this.mobileLayout) {
        this.closeNavigation(false);
        this.$nextTick(() => this.$refs.details.focusClose());
      }
    },
  },
  mounted() {
    this.updateLayout();
    window.addEventListener('resize', this.updateLayout);
    document.addEventListener('pointerdown', this.dismissNavigation, true);
    document.addEventListener('keydown', this.handleKeydown);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.updateLayout);
    document.removeEventListener('pointerdown', this.dismissNavigation, true);
    document.removeEventListener('keydown', this.handleKeydown);
  },
  methods: {
    updateLayout() {
      const mobile = window.matchMedia('(max-width: 900px)').matches;
      if (this.mobileLayout !== mobile) {
        this.closeNavigation(false);
        if (mobile && this.selectedItem) this.$nextTick(() => this.$refs.details.focusClose());
      }
      this.mobileLayout = mobile;
    },
    toggleNavigation() {
      if (!this.navCollapsed) {
        this.closeNavigation();
        return;
      }
      this.navCollapsed = false;
      if (this.mobileLayout) this.$nextTick(() => this.$refs.navigation.focusToggle());
    },
    closeNavigation(restoreFocus = true) {
      if (this.$refs.navigation.$el.contains(document.activeElement)) document.activeElement.blur();
      this.navCollapsed = true;
      if (restoreFocus) {
        this.$nextTick(() => {
          this.$refs.navigationToggle.focus();
        });
      }
    },
    dismissNavigation(event) {
      if (!this.mobileLayout || this.navCollapsed) return;
      const nav = this.$refs.navigation.$el;
      const { target } = event;
      if (nav.contains(target) || this.$refs.navigationToggle.$el.contains(target)) return;
      const popup = target.closest('.app-select-popup');
      if (popup && nav.contains(document.getElementById(popup.dataset.selectOwner))) return;
      this.closeNavigation();
    },
    navigateFromFilters() {
      if (!this.mobileLayout) return;
      this.closeNavigation(false);
      this.focusGallery();
    },
    focusGallery() {
      this.$nextTick(() => {
        this.$refs.gallery.$refs.viewport.scrollTop = 0;
        this.$refs.gallery.$refs.viewport.focus({ preventScroll: true });
      });
    },
    restoreDetailsFocus() {
      this.$nextTick(() => {
        const target = this.detailsReturnFocus;
        if (target && target.isConnected && target.getBoundingClientRect().width > 0) {
          target.focus();
        } else this.focusGallery();
        this.detailsReturnFocus = null;
      });
    },
    viewBuild() {
      if (!this.mobileLayout) return;
      this.$store.commit('setSelectedItem', null);
      this.focusGallery();
    },
    handleKeydown(event) {
      if (event.defaultPrevented) return;
      const navigationOpen = !this.navCollapsed;
      if (!this.mobileLayout && (event.key !== 'Escape' || !navigationOpen)) return;
      if (!navigationOpen && !this.selectedItem) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        if (navigationOpen) this.closeNavigation();
        else {
          this.$store.commit('setSelectedItem', null);
          this.restoreDetailsFocus();
        }
      } else if (event.key === 'Tab') {
        const panel = navigationOpen ? this.$refs.navigation.$el : this.$refs.details.$el;
        const controls = Array.from(panel.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        )).filter(el => el.getBoundingClientRect().width > 0);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    },
    async deleteCustomBuild(id) {
      await this.$store.dispatch('deleteCustomBuild', id);
      this.focusGallery();
    },
    retryStorage() {
      this.$store.dispatch(this.$store.state.customBuildsLoaded
        ? 'saveCustomBuilds' : 'loadCustomBuilds');
    },
  },
};
</script>

<style scoped>
.home-page {
  font-family: var(--font-family);

  display: flex;
  flex-direction: column;

  height: 100vh;
  height: 100dvh;
  overflow: hidden;
}

.product-header {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  flex: 0 0 auto;
  padding: var(--space-3) var(--space-5);
  border-bottom: var(--border-width) solid var(--border);
  background: var(--surface);
}
.navigation-toggle { flex-shrink: 0; }
.navigation-toggle[aria-expanded="true"] {
  border-color: var(--accent);
  background: var(--accent-soft);
  color: var(--accent);
}
.header-divider {
  align-self: stretch;
  width: var(--border-width);
  background: var(--border);
}
.product-identity { min-width: 0; }
.product-identity h1 {
  margin: 0;
  color: var(--text);
  font-size: var(--text-title);
  font-weight: var(--weight-heading);
  line-height: var(--leading-heading);
  letter-spacing: var(--tracking-heading);
}
.product-identity h1 span { color: var(--accent); }
.product-identity p {
  margin: var(--space-1) 0 0;
  color: var(--text-muted);
  font-size: var(--text-body);
  line-height: var(--leading-body);
}
.workspace { display: flex; flex: 1; min-width: 0; min-height: 0; overflow: hidden; }
.gallery-content { min-width: 0; }
.info-section {
  flex: 1;
  min-width: 0;
  min-height: 0;
  position: relative;
  display: flex;
  flex-flow: row;
  justify-content: flex-end;
  overflow: hidden;
}

.item-list-section {
  flex: 1;
  min-width: 0;
  padding: var(--space-6);
}

.build-summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  margin: 0 0 var(--space-5);
  padding: var(--space-5);
  border: var(--border-width) solid var(--panel-border);
  border-radius: var(--radius-lg);
  background: linear-gradient(120deg, var(--accent-soft), transparent 65%), var(--surface);
  color: var(--text-colour);
}
.build-summary > div { min-width: 0; max-width: 100%; }
.build-summary h2 {
  margin: 0 0 6px; font-size: var(--text-subtitle);
  letter-spacing: var(--tracking-heading); overflow-wrap: anywhere;
}
.build-error {
  padding: var(--space-4); margin-bottom: var(--space-4);
  border: var(--border-width) solid var(--danger); border-radius: var(--radius-md);
  background: var(--danger-surface); color: var(--danger);
}
.build-error p { margin: 0 0 var(--space-2); font-size: var(--text-body); }
.build-summary p {
  margin: 0; font-size: var(--text-sm); line-height: var(--leading-body); color: var(--text-muted);
}
.build-legend { font-size: var(--text-sm); line-height: var(--leading-body); }
.build-legend-ranks { display: flex; flex-wrap: wrap; gap: var(--space-3); }
.build-legend-ranks > span { display: inline-flex; align-items: center; gap: 5px; }
.build-legend a, .build-legend-note { display: block; margin-top: 6px; }
.build-legend-note { color: var(--text-muted); }
.build-legend svg { margin-left: 3px; width: var(--icon-xs); height: var(--icon-xs); }

@media (max-width: 900px) {
  .product-header {
    gap: var(--space-3);
    padding: max(var(--space-3), env(safe-area-inset-top)) var(--space-4) var(--space-3);
  }
  .header-divider { display: none; }
  .product-identity h1 { font-size: var(--text-subtitle); }
  .product-identity p { font-size: var(--text-sm); }
  .item-list-section { padding: 0; }
  .gallery-content { padding: var(--space-4); }
}
@media (max-width: 480px) {
  .build-summary { padding: var(--space-4); }
}
</style>
