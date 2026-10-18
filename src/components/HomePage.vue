<template>
  <div class="home-page">
    <TopBar />
    <div class="info-section">
      <div class="item-list-section">
        <div v-if="build" class="build-summary" aria-live="polite">
          <div>
            <h1>{{ build.name }} build</h1>
            <p>
              {{ build.focus }}.
              {{ recommendedOnly ? 'Recommended pickups only.' : 'Showing all pickups.' }}
            </p>
          </div>
          <div class="build-legend">
            <p class="build-legend-ranks">
              <span><strong class="build-badge build-badge--S">S</strong> Core</span>
              <span><strong class="build-badge build-badge--A">A</strong> Synergy</span>
              <span><strong class="build-badge build-badge--B">B</strong> Support</span>
            </p>
            <a v-if="build.source" :href="build.source" target="_blank" rel="noopener noreferrer">
              Operator guide
              <font-awesome-icon icon="external-link-alt" aria-hidden="true" />
            </a>
            <span v-else class="build-legend-note">
              Starter priorities, not a universal tier list.
            </span>
          </div>
        </div>
        <ItemList style="flex: 1;" :itemListType="SelectionType.ITEM" />
        <ItemList style="flex: 1;" :itemListType="SelectionType.EQUIPMENT" />
      </div>
      <SideBar/>
    </div>
  </div>
</template>

<script>
import ItemList from './ItemList.vue';
import TopBar from './TopBar.vue';
import SideBar from './SideBar.vue';
import { SelectionType } from '../data/constants';
import { getSurvivorBuild } from '../data/survivorBuilds';

export default {
  name: 'HomePage',
  components: {
    ItemList,
    TopBar,
    SideBar,
  },
  data() {
    return {
      SelectionType,
    };
  },
  computed: {
    build() { return getSurvivorBuild(this.$store.state.selectedRole); },
    recommendedOnly() { return this.$store.state.recommendedOnly; },
  },
};
</script>

<style scoped>
.home-page {
  --font-family: Arial, Helvetica, sans-serif;
  --panel-background: #f3f3f3;
  --panel-border: #bbb;
  --text-colour: #333;
  --muted-colour: #666;
}

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
  padding: 12px;
}

.build-summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 0 2px 18px;
  padding: 12px;
  border: 1px solid var(--panel-border);
  border-radius: 4px;
  background: var(--panel-background);
  color: var(--text-colour);
}
.build-summary h1 { margin: 0 0 6px; font-size: 16px; }
.build-summary p { margin: 0; font-size: 12px; line-height: 1.6; }
.build-legend { font-size: 12px; line-height: 1.6; }
.build-legend-ranks { display: flex; flex-wrap: wrap; gap: 12px; }
.build-legend-ranks > span { display: inline-flex; align-items: center; gap: 5px; }
.build-legend a, .build-legend-note { display: block; margin-top: 6px; }
.build-legend a { color: var(--text-colour); }
.build-legend svg { margin-left: 3px; font-size: 10px; }

@media (max-width: 900px) {
  .home-page { flex-direction: column; }
}
</style>
