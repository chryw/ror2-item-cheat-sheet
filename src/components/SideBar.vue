<template>
  <div class="side-bar-wrapper">
    <div class="side-bar" v-if="selectedItem != null" v-bind:class="[this.rarityClass]">
      <div class="top-section">
        <a class="wiki-link" v-bind:href="itemData.wikiLink"
          target="_blank" rel="noopener noreferrer">
          <font-awesome-icon class="item-link-icon" icon="external-link-alt" />
        </a>
        <p class="item-id" v-if="this.itemData.id">#{{ this.itemData.id }}</p>
        <CloseIcon v-bind:clickCloseButton="this.clickCloseButton" class="close-icon" />
      </div>

      <div class="item-info-section">
        <hr style="margin-top: 0px" />
        <h3 class="item-name">{{ itemData.name }}</h3>
        <span class="dlc-title">
          <img class="dlc-icon" v-if="itemData.dlc" v-bind:src="this.dlcIconUrl" />
          <p class="item-short-description item-dlc" v-if="itemData.dlc">{{ itemData.dlc }}</p>
        </span>
        <hr />
        <img class="item-icon" :src="this.itemImageUrl" :alt="itemData.name" />
        <p class="item-short-description">{{ itemData.shortDescription }}</p>
        <div class="custom-build-actions">
          <AppSelect id="custom-build-target" v-model="customBuildTarget" label="Custom build"
            :options="customBuildOptions" :disabled="!$store.state.customBuildsLoaded" />
          <button type="button" :disabled="!$store.state.customBuildsLoaded || itemIsSaved"
            @click="$store.dispatch('addCustomBuildItem', selectedItem.id)">
            {{ itemIsSaved ? 'Item already in build' : 'Add to custom build' }}
          </button>
          <template v-if="targetBuild">
            <p v-if="itemIsSaved" role="status">
              {{ itemData.name }} is in {{ targetBuild.name }}.
            </p>
            <button v-if="itemIsSaved" type="button"
              @click="$store.dispatch('removeCustomBuildItem',
                { id: targetBuild.id, itemId: selectedItem.id })">
              Remove from custom build
            </button>
            <button type="button" @click="viewCustomBuild">
              View {{ targetBuild.name }}
            </button>
          </template>
        </div>
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
            <font-awesome-icon class="fa-icon" icon="external-link-alt" />
            More Info
          </a>
        </div>

        <div v-if="isDrone" class="drone-info">
          <h4>Recruitment</h4>
          <p>{{ itemData.acquisition }}</p>
          <h4>Base stats</h4>
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
        <h4 class="unlock-name">Complete "{{ itemData.unlock.name }}" to Unlock</h4>
        <p class="unlock-description">{{ itemData.unlock.description }}</p>
        <a v-bind:href="itemData.unlock.link" target="_blank" class="unlock-link">
          <font-awesome-icon class="fa-icon" icon="external-link-alt" />
          More Info
        </a>
        <hr />
      </div>

      <div class="item-category-section">
        <h4 class="item-rarity-label">Rarity</h4>
        <p class="item-rarity" v-on:mouseup="clickRarityPill(itemData.itemRarity)">
          {{ itemData.itemRarity }}
        </p>
        <h4 v-if="itemCategories.length" class="item-category-label">Category</h4>
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
        <h4 class="item-stats-label">Item Stacking</h4>
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
    </div>
  </div>
</template>

<script>
import { mapState, mapMutations } from "vuex";

import CloseIcon from "./Icons/CloseIcon.vue";
import AppSelect from "./AppSelect.vue";
import items from "../data/catalog";
import getItemImageUrl from "../helpers/ItemImageUtils";
import ItemIdUtils from "../helpers/ItemIdUtils";

import { ItemRarityClass, SelectionType, DlcIconUrl } from "../data/constants";
import { bus } from "../main";

export default {
  name: "SideBar",
  components: {
    CloseIcon,
    AppSelect,
  },
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
    },
    clickCloseButton() {
      this.setSelectedItem(null);
    },
    clickRarityPill(rarity) {
      bus.$emit("filterRarity", rarity);
      this.setFilterByState({ rarity: [rarity] });
    },
  },
};
</script>

<style scoped>
.drone-info { font-size: 13px; line-height: 1.5; }
.drone-info h4 { margin-bottom: 8px; }
.drone-info dl { display: grid; grid-template-columns: auto 1fr; gap: 8px; }
.drone-info dd { margin: 0; text-align: right; }
.custom-build-actions {
  display: flex; flex-direction: column; gap: 8px; margin: 16px 0; overflow-wrap: anywhere;
}
.custom-build-actions label, .custom-build-actions p { font-size: 13px; margin: 0; }
.custom-build-actions >>> .select-label { color: #ddd; }
.custom-build-actions > button {
  box-sizing: border-box; width: 100%; min-height: 36px; padding: 6px 8px;
  border: 1px solid #bbb; border-radius: 4px; background: #f3f3f3; color: #333;
  min-width: 0; overflow-wrap: anywhere;
}
.custom-build-actions > button { cursor: pointer; }
.custom-build-actions > button:disabled { cursor: default; opacity: 0.65; }
.side-bar-wrapper {
  flex-shrink: 0;
  --side-bar-width: 300px;
  --side-bar-background-colour: #444444;

  --item-icon-size: 150px;

  --dlc-icon-size: 16px;

  --margin-left: 20px;
  --margin-top: var(--margin-left);

  --main-text-colour: #fff;
  --main-text-size: 90%;
  --sub-text-colour: #999;
  --sub-text-size: 80%;

  --top-bar-height: 60px;

  overflow-y: auto;
}

@media (max-width: 600px) {
  .side-bar-wrapper {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    z-index: 10;
    max-width: 100%;
  }
}

/* Setting colours for different rarities */
.item-colour-common {
  --item-card-colour: #96a6a6;
  --item-card-colour-opaque: rgba(199, 204, 206, var(--background-opacity));
}
.item-colour-uncommon {
  --item-card-colour: #71bc39;
  --item-card-colour-opaque: rgba(113, 188, 57, var(--background-opacity));
}
.item-colour-void {
  --item-card-colour: #a92964;
  --item-card-colour-opaque: rgba(169, 41, 100, var(--background-opacity));
}
.item-colour-hallowed {
  --item-card-colour: #9368f9;
  --item-card-colour-opaque: rgba(147, 104, 249, var(--background-opacity));
}
.item-colour-hex {
  --item-card-colour: #b14b76;
  --item-card-colour-opaque: rgba(177, 75, 118, var(--background-opacity));
}
.item-colour-page {
  --item-card-colour: #d2bd8b;
  --item-card-colour-opaque: rgba(210, 189, 139, var(--background-opacity));
}
.item-colour-legendary {
  --item-card-colour: #df4d39;
  --item-card-colour-opaque: rgba(223, 77, 57, var(--background-opacity));
}
.item-colour-boss {
  --item-card-colour: #aeba23;
  --item-card-colour-opaque: rgba(174, 186, 35, var(--background-opacity));
}
.item-colour-lunar,
.equipment-colour-lunar {
  --item-card-colour: #36b8e0;
  --item-card-colour-opaque: rgba(54, 184, 224, var(--background-opacity));
}
.equipment-colour-normal,
.equipment-colour-elite {
  --item-card-colour: #c78536;
  --item-card-colour-opaque: rgba(199, 133, 54, var(--background-opacity));
}

.side-bar {
  width: var(--side-bar-width);
  background: var(--side-bar-background-colour);

  color: var(--main-text-colour);

  padding-bottom: var(--margin-left);
  min-height: calc(100% - var(--margin-left));
}

.top-section {
  display: flex;
  justify-content: space-between;
  margin-left: 10px;
}

.wiki-link {
  height: 40px;
  line-height: 40px;
}

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
  font-style: italic;
  font-size: x-large;
  height: 40px;
  line-height: 40px;
  display: inline-block;
}

.close-icon {
  margin: 0px;
}

hr {
  margin-left: calc(-1 * var(--margin-left));
  margin-right: calc(-1 * var(--margin-left));
  color: var(--sub-text-colour);
}

.item-info-section {
  justify-content: center;
  display: grid;
  padding-left: var(--margin-left);
  padding-right: var(--margin-left);
}

.item-name {
  margin: 0px;
  font-size: 120%;
  text-align: center;
}

.item-icon {
  height: var(--item-icon-size);
  width: var(--item-icon-size);
  margin: auto;
  border: 5px var(--item-card-colour) solid;
  background: radial-gradient(var(--item-card-colour), #222222);
}

.dlc-title {
  display: flex;
  justify-content: center;
  flex-direction: row;
}

.dlc-icon {
  height: var(--dlc-icon-size);
  width: auto;
  margin: auto 4px auto 0px;
}

.item-short-description {
  color: var(--sub-text-colour);
  margin-top: 5px;
  margin-bottom: 0px;
  font-size: var(--sub-text-size);
  font-style: italic;
  text-align: center;
}

.item-description {
  margin-top: 0px;
  text-align: center;
  font-size: 90%;
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
  border: 2px var(--item-card-colour) solid;
  /* Large border radius to make it pill shape */
  border-radius: 100px;

  cursor: pointer;
}

.item-rarity:hover {
  background: rgba(190, 190, 190, 0.25);
  transition: background-color 0.25s ease;
}

.item-rarity:active {
  background: rgba(190, 190, 190, 0.75);
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
  border: 2px var(--sub-text-colour) solid;
  /* Large border radius to make it pill shape */
  border-radius: 100px;
}

.item-stats-section {
  justify-content: center;
  padding-left: var(--margin-left);
  padding-right: var(--margin-left);
  text-align: center;
}

.item-stats-table {
  border: 1px var(--sub-text-colour) solid;
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
  border: 1px var(--sub-text-colour) solid;
}

tr:nth-child(even) {
  background-color: #555;
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
