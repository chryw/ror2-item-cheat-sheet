<template>
  <div class="home-page">
    <TopBar />
    <div class="info-section">
      <div class="item-list-section">
        <header class="gallery-header">
          <p class="ui-eyebrow">
            <span class="status-dot" aria-hidden="true"></span> The pickup index
          </p>
          <h1 ref="galleryTitle" tabindex="-1">Know your <span>next pickup.</span></h1>
          <p>Explore the arsenal. Find your synergy. Build your next run.</p>
        </header>
        <div v-if="$store.state.customBuildError" class="build-error" role="alert">
          <p>{{ $store.state.customBuildError }}</p>
          <button class="ui-button" type="button" @click="retryStorage">Retry storage</button>
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
            <a v-if="build.source" :href="build.source" target="_blank" rel="noopener noreferrer">
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
      <SideBar />
    </div>
  </div>
</template>

<script>
import ItemList from './ItemList.vue';
import TopBar from './TopBar.vue';
import SideBar from './SideBar.vue';
import CustomBuildEditor from './CustomBuildEditor.vue';
import { SelectionType } from '../data/constants';

export default {
  name: "HomePage",
  components: {
    ItemList,
    TopBar,
    SideBar,
    CustomBuildEditor,
  },
  data() {
    return {
      SelectionType,
    };
  },
  computed: {
    build() { return this.$store.getters.selectedBuild; },
    recommendedOnly() { return this.$store.state.recommendedOnly; },
  },
  methods: {
    async deleteCustomBuild(id) {
      await this.$store.dispatch('deleteCustomBuild', id);
      this.$nextTick(() => this.$refs.galleryTitle.focus());
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
  flex-direction: row;

  height: 100vh;
  height: 100dvh;
  overflow: hidden;
}

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
  overflow-y: auto;
  padding: var(--space-6);
}

.gallery-header { padding: 4px 0 var(--space-6); }
.gallery-header .ui-eyebrow {
  display: flex; align-items: center; gap: var(--space-2); margin: 0 0 var(--space-3);
}
.status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); }
.gallery-header h1 {
  margin: 0 0 var(--space-3);
  font-size: clamp(28px, 3vw, 44px);
  line-height: 1.12;
  letter-spacing: -0.045em;
  font-weight: 650;
}
.gallery-header h1 span { color: var(--accent); }
.gallery-header > p:last-child {
  margin: 0; color: var(--text-muted); font-size: 13px; line-height: 1.7;
}
.build-summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  margin: 0 0 var(--space-5);
  padding: var(--space-5);
  border: 1px solid var(--panel-border);
  border-radius: var(--radius-lg);
  background: linear-gradient(120deg, var(--accent-soft), transparent 65%), var(--surface);
  color: var(--text-colour);
}
.build-summary > div { min-width: 0; max-width: 100%; }
.build-summary h2 {
  margin: 0 0 6px; font-size: 22px; letter-spacing: -0.03em; overflow-wrap: anywhere;
}
.build-error {
  padding: var(--space-4); margin-bottom: var(--space-4);
  border: 1px solid var(--danger); border-radius: var(--radius-md);
  background: var(--danger-surface); color: var(--danger);
}
.build-error p { margin: 0 0 8px; font-size: 13px; }
.build-summary p { margin: 0; font-size: 12px; line-height: 1.6; color: var(--text-muted); }
.build-legend { font-size: 12px; line-height: 1.6; }
.build-legend-ranks { display: flex; flex-wrap: wrap; gap: 12px; }
.build-legend-ranks > span { display: inline-flex; align-items: center; gap: 5px; }
.build-legend a, .build-legend-note { display: block; margin-top: 6px; }
.build-legend-note { color: var(--text-muted); }
.build-legend svg { margin-left: 3px; width: 14px; height: 14px; }

@media (max-width: 900px) {
  .home-page { flex-direction: column; }
  .item-list-section { padding: var(--space-5); }
}
@media (max-width: 480px) {
  .item-list-section { padding: var(--space-4); }
  .gallery-header { padding-bottom: var(--space-5); }
  .build-summary { padding: var(--space-4); }
}
</style>
