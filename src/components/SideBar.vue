<template>
  <AppScrollArea v-if="selectedItem != null" class="side-bar-wrapper" label="Item details"
    :role="mobile ? 'dialog' : null" :aria-modal="mobile ? 'true' : null"
    :aria-label="`${itemData.name} details`">
    <div class="side-bar" v-bind:class="[this.rarityClass]">
      <div class="top-section">
        <a class="wiki-link" v-bind:href="itemData.wikiLink"
          target="_blank" rel="noopener noreferrer" :aria-label="`${itemData.name} wiki`">
          <AppIcon class="item-link-icon" name="external-link" />
        </a>
        <p class="item-id" v-if="this.itemData.id">#{{ this.itemData.id }}</p>
        <CloseIcon ref="closeButton" v-bind:clickCloseButton="this.clickCloseButton"
          class="close-icon" />
      </div>

      <div class="item-info-section">
        <hr style="margin-top: 0px" />
        <h2 class="item-name">{{ itemData.name }}</h2>
        <span class="dlc-title">
          <img class="dlc-icon" v-if="itemData.dlc" v-bind:src="this.dlcIconUrl" />
          <p class="item-short-description item-dlc" v-if="itemData.dlc">{{ itemData.dlc }}</p>
        </span>
        <hr />
        <img class="item-icon" :src="this.itemImageUrl" :alt="itemData.name" />
        <p class="item-short-description">{{ itemData.shortDescription }}</p>
        <hr />
        <p class="item-description">{{ itemData.description }}</p>

        <div v-if="itemData.dropsFrom" class="drops-from-section">
          <p class="drops-from-data">
            Drops From: <b>{{ itemData.dropsFrom.source }}</b>
          </p>
          <a
            v-if="itemData.dropsFrom.url"
            v-bind:href="itemData.dropsFrom.url"
            target="_blank"
            class="drops-from-link"
          >
            <AppIcon name="external-link" />
            More Info
          </a>
        </div>

        <div v-if="isDrone" class="drone-info">
          <h3>Recruitment</h3>
          <p>{{ itemData.acquisition }}</p>
          <h3>Base stats</h3>
          <dl>
            <dt>Health</dt><dd>{{ itemData.health }}</dd>
            <dt>Damage / healing</dt><dd>{{ itemData.damage }}</dd>
            <dt>Armor</dt><dd>{{ itemData.armor }}</dd>
            <dt>Speed</dt><dd>{{ itemData.speed }}</dd>
          </dl>
          <p>Base stats are not attack percentages. Drones do not stack like passive items.</p>
        </div>
        <p class="equipment-cooldown" v-if="this.isEquipment && itemData.cooldown">
          Cooldown: <b>{{ itemData.cooldown }}</b>
        </p>
        <hr />
      </div>

      <div class="unlock-info-section" v-if="itemData.unlock">
        <h3 class="unlock-name">Complete "{{ itemData.unlock.name }}" to Unlock</h3>
        <p class="unlock-description">{{ itemData.unlock.description }}</p>
        <a v-bind:href="itemData.unlock.link" target="_blank" class="unlock-link">
          <AppIcon name="external-link" />
          More Info
        </a>
        <hr />
      </div>

      <div class="item-category-section">
        <h3 class="item-rarity-label">Rarity</h3>
        <AppButton class="item-rarity" @click="clickRarityPill(itemData.itemRarity)"
          :aria-label="`Filter by ${itemData.itemRarity} rarity`">
          {{ itemData.itemRarity }}
        </AppButton>
        <h3 v-if="itemCategories.length" class="item-category-label">Category</h3>
        <div v-if="itemCategories.length" class="item-category-list">
          <p
            class="item-category"
            v-for="category in itemCategories"
            v-bind:key="category"
          >
            {{ category }}
          </p>
        </div>
      </div>

      <div class="item-stats-section" v-if="this.shouldShowStatStacking">
        <h3 class="item-stats-label">Item Stacking</h3>
        <table class="item-stats-table" v-if="itemData.stats">
          <tr class="item-stats-labels">
            <th class="stat-name-label">Stat</th>
            <th class="stat-value-label">Value</th>
            <th class="stat-stack-label">Stack</th>
            <th class="stat-add-label">Add</th>
          </tr>
          <tr class="item-stat" v-for="stat in itemData.stats" v-bind:key="stat.stat">
            <td class="stat-name">{{ stat.stat }}</td>
            <td class="stat-value">{{ stat.value }}</td>
            <td class="stat-stack">{{ stat.stackType }}</td>
            <td class="stat-add">{{ stat.stackValue }}</td>
          </tr>
        </table>
      </div>
      <section class="custom-build-actions" aria-label="Custom build actions">
        <AppSelect id="custom-build-target" v-model="customBuildTarget" label="Custom build"
          :options="customBuildOptions" :disabled="!$store.state.customBuildsLoaded" />
        <AppButton variant="primary"
          :disabled="!$store.state.customBuildsLoaded || itemIsSaved"
          @click="$store.dispatch('addCustomBuildItem', selectedItem.id)">
          {{ itemIsSaved ? 'Item already in build' : 'Add to custom build' }}
        </AppButton>
        <template v-if="targetBuild">
          <p v-if="itemIsSaved" role="status">
            {{ itemData.name }} is in {{ targetBuild.name }}.
          </p>
          <AppButton v-if="itemIsSaved"
            @click="$store.dispatch('removeCustomBuildItem',
              { id: targetBuild.id, itemId: selectedItem.id })">
            Remove from custom build
          </AppButton>
          <AppButton @click="viewCustomBuild">
            View {{ targetBuild.name }}
          </AppButton>
        </template>
      </section>
    </div>
  </AppScrollArea>
</template>

<script>
import { mapState, mapMutations } from "vuex";

import CloseIcon from "./Icons/CloseIcon.vue";
import AppSelect from "./AppSelect.vue";
import AppScrollArea from "./AppScrollArea.vue";
import items from "../data/catalog";
import getItemImageUrl from "../helpers/ItemImageUtils";
import ItemIdUtils from "../helpers/ItemIdUtils";

import { ItemRarityClass, SelectionType, DlcIconUrl } from "../data/constants";
import { bus } from "../main";

export default {
  name: "SideBar",
  components: {
    AppScrollArea,
    CloseIcon,
    AppSelect,
  },
  props: { mobile: { type: Boolean, default: false } },
  data() {
    return {};
  },
  computed: {
    ...mapState(["selectedItem"]),
    customBuildOptions() {
      return [{ value: '', label: 'New custom build' }, ...this.$store.state.customBuilds.map(build => ({
        value: build.id, label: build.name,
      }))];
    },
    customBuildTarget: {
      get() { return this.$store.state.customBuildTarget; },
      set(value) { this.$store.commit('setCustomBuildTarget', value); },
    },
    targetBuild() {
      return this.$store.state.customBuilds.find(build => build.id === this.customBuildTarget);
    },
    itemIsSaved() {
      return this.targetBuild && this.targetBuild.itemIds.includes(this.selectedItem.id);
    },
    itemData() {
      const { id } = this.selectedItem;
      return items[id];
    },
    itemCategories() {
      return ItemIdUtils.getItemCategories(this.itemData);
    },
    rarityClass() {
      return ItemRarityClass[this.itemData.itemRarity];
    },
    isEquipment() {
      return this.selectedItem.type === SelectionType.EQUIPMENT;
    },
    isDrone() {
      return this.selectedItem.type === SelectionType.DRONE;
    },
    shouldShowStatStacking() {
      return this.itemData.stats && this.itemData.stats.length > 0 && !this.isEquipment;
    },
    dlcIconUrl() {
      if (this.itemData.dlc) {
        return DlcIconUrl[this.itemData.dlc];
      }
      return "";
    },
    itemImageUrl() {
      return getItemImageUrl(this.selectedItem.id, process.env.BASE_URL);
    },
  },
  methods: {
    ...mapMutations(["setSelectedItem", "setFilterByState"]),
    viewCustomBuild() {
      this.$store.commit('setSelectedRole', this.targetBuild.id);
      this.$store.commit('setRecommendedOnly', true);
      this.$emit('view-build');
    },
    focusClose() {
      this.$refs.closeButton.$el.focus();
    },
    clickCloseButton() {
      this.setSelectedItem(null);
      this.$emit('close');
    },
    clickRarityPill(rarity) {
      bus.$emit("filterRarity", rarity);
      this.setFilterByState({ rarity: [rarity] });
      if (this.mobile) this.clickCloseButton();
    },
  },
};
</script>

<style scoped>
.side-bar h3 { font-size: var(--text-base); }
.drone-info { font-size: var(--text-body); line-height: var(--leading-ui); }
.drone-info h3 { font-size: var(--text-body); margin-bottom: var(--space-2); }
.drone-info dl { display: grid; grid-template-columns: auto 1fr; gap: var(--space-2); }
.drone-info dd { margin: 0; text-align: right; }
.custom-build-actions {
  display: flex; flex-direction: column; gap: var(--space-2);
  margin: var(--space-5) var(--margin-left) 0;
  padding-top: var(--space-5);
  border-top: var(--border-width) solid var(--border); overflow-wrap: anywhere;
}
.custom-build-actions label, .custom-build-actions p { font-size: var(--text-body); margin: 0; }
.custom-build-actions > button { width: 100%; }
.custom-build-actions p { color: var(--text-muted); line-height: var(--leading-body); }
.side-bar-wrapper {
  flex-shrink: 0;
  --side-bar-width: var(--details-width);
  --side-bar-background-colour: var(--surface);

  --item-icon-size: var(--details-image-size);

  --dlc-icon-size: var(--icon-sm);

  --margin-left: var(--details-padding);
  --margin-top: var(--margin-left);

  --main-text-colour: var(--text);
  --main-text-size: 90%;
  --sub-text-colour: var(--text-muted);
  --sub-text-size: 80%;

  --top-bar-height: 60px;

}

.side-bar {
  box-sizing: border-box;
  width: min(var(--side-bar-width), 100vw);
  background: var(--side-bar-background-colour);

  color: var(--main-text-colour);

  padding-bottom: var(--margin-left);
  min-height: calc(100% - var(--margin-left));
  border-left: var(--border-width) solid var(--border);
  box-shadow: var(--shadow-panel);
  line-height: var(--leading-body);
}

.top-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3) var(--space-4);
  border-top: var(--border-width-emphasis) solid var(--item-card-colour);
}

@media (max-width: 900px) {
  .side-bar-wrapper {
    position: fixed;
    inset: 0;
    z-index: var(--layer-dialog);
    width: 100%;
    height: 100vh;
    height: 100dvh;
    --side-bar-width: 100%;
  }
  .side-bar {
    width: 100%;
    min-height: 100%;
    border-left: 0;
    padding-bottom: max(var(--margin-left), env(safe-area-inset-bottom));
  }
  .top-section {
    position: sticky;
    top: 0;
    z-index: 1;
    background: var(--surface);
    border-bottom: var(--border-width) solid var(--border);
    padding-top: max(var(--space-3), env(safe-area-inset-top));
  }
}

.wiki-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--control-height-compact);
  height: var(--control-height-compact);
  line-height: var(--control-height-compact);
  border-radius: var(--radius-md);
}
.wiki-link:hover { background: var(--surface-hover); }

.wiki-link:link {
  text-decoration: inherit;
  color: inherit;
}

.wiki-link:visited {
  text-decoration: inherit;
  color: inherit;
}

.item-link-icon {
  color: var(--sub-text-colour);
  font-size: 120%;
}

.item-id {
  color: var(--sub-text-colour);
  margin: 0px;
  font: var(--text-sm)/var(--control-height-compact) var(--font-mono);
  height: var(--control-height-compact);
  line-height: var(--control-height-compact);
  display: inline-block;
}

.close-icon {
  margin: 0px;
}

hr {
  width: 100%;
  box-sizing: border-box;
  margin-left: calc(-1 * var(--margin-left));
  margin-right: calc(-1 * var(--margin-left));
  border: 0;
  border-top: var(--border-width) solid var(--border);
  margin-top: var(--space-5);
  margin-bottom: var(--space-5);
}

.item-info-section {
  justify-content: center;
  display: grid;
  min-width: 0;
  padding-left: var(--margin-left);
  padding-right: var(--margin-left);
}

.item-name {
  margin: 0px;
  font-size: var(--text-title);
  font-weight: var(--weight-semibold);
  letter-spacing: -0.035em;
  line-height: var(--leading-tight);
  overflow-wrap: anywhere;
  text-align: center;
}

.item-icon {
  height: var(--item-icon-size);
  width: var(--item-icon-size);
  margin: auto;
  object-fit: contain;
  box-sizing: border-box;
  padding: var(--space-3);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-lg);
  background: radial-gradient(ellipse at bottom, var(--surface-hover), var(--canvas));
}

.dlc-title {
  display: flex;
  justify-content: center;
  flex-direction: row;
}

.dlc-icon {
  height: var(--dlc-icon-size);
  width: auto;
  margin: auto var(--space-1) auto 0px;
}

.item-short-description {
  color: var(--sub-text-colour);
  margin-top: 5px;
  margin-bottom: 0px;
  font-size: var(--sub-text-size);
  line-height: var(--leading-relaxed);
  text-align: center;
}

.item-description {
  margin-top: 0px;
  text-align: left;
  font-size: var(--text-body);
  color: var(--text-muted);
  margin-bottom: 0px;
  white-space: break-spaces;
}

.drops-from-section {
  justify-content: center;
  display: grid;
  padding-left: var(--margin-left);
  padding-right: var(--margin-left);
  text-align: center;
}

.drops-from-data {
  font-size: var(--main-text-size);
  margin-top: 10px;
  margin-bottom: 5px;
}

.drops-from-link {
  color: var(--sub-text-colour);
  text-decoration: none;
  font-size: var(--sub-text-size);
  font-style: italic;
}

.equipment-cooldown {
  padding-top: 10px;
  margin-top: 0px;
  text-align: center;
  font-size: 90%;
  margin-bottom: 0px;
}

.unlock-info-section {
  justify-content: center;
  display: grid;
  padding-left: var(--margin-left);
  padding-right: var(--margin-left);
  text-align: center;
}

.unlock-name {
  margin: 0px;
}

.unlock-description {
  font-size: var(--main-text-size);
  margin-top: 10px;
  margin-bottom: 5px;
}

.unlock-link {
  color: var(--sub-text-colour);
  text-decoration: none;
  font-size: var(--sub-text-size);
  font-style: italic;
}

.item-category-section {
  justify-content: center;
  display: grid;
  padding-left: var(--margin-left);
  padding-right: var(--margin-left);
  text-align: center;
}

.item-category-section > * {
  margin: 0px;
}

.item-rarity {
  font-size: var(--main-text-size);
  margin: 5px auto;
  padding: 3px 8px;

  display: inline-block;
  color: var(--item-card-colour);
  border: var(--border-width) var(--item-card-colour) solid;
  /* Large border radius to make it pill shape */
  border-radius: var(--radius-pill);
  min-height: var(--control-height-compact);
  font-family: inherit;
  background: var(--surface-raised);
  cursor: pointer;
}

.item-rarity:hover {
  background: var(--surface-hover);
}

.item-category-label {
  margin-bottom: 5px;
  margin-top: 5px;
}

.item-category-list {
  display: flex;
  justify-content: center;
  flex-flow: row;
  flex-wrap: wrap;
}

.item-category {
  font-size: var(--main-text-size);
  margin: 2px 3px;
  padding: 3px 8px;

  color: var(--sub-text-colour);
  border: var(--border-width) var(--border) solid;
  /* Large border radius to make it pill shape */
  border-radius: var(--radius-pill);
}

.item-stats-section {
  justify-content: center;
  padding-left: var(--margin-left);
  padding-right: var(--margin-left);
  text-align: center;
}

.item-stats-table {
  border: var(--border-width) var(--border) solid;
  border-collapse: collapse;
  width: 100%;
}

.item-stats-label {
  margin-bottom: 5px;
  margin-top: 10px;
}

.item-stats-table,
td,
th {
  border: var(--border-width) var(--border) solid;
}

tr:nth-child(even) {
  background-color: var(--surface-raised);
}

.stat-name-label,
.stat-value-label,
.stat-stack-label,
.stat-add-label {
  padding: 3px 5px;
}

.stat-name,
.stat-value,
.stat-stack,
.stat-add {
  font-size: var(--main-text-size);
  padding: 3px 5px;
}
</style>
