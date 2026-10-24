<template>
  <div
    class="item-card"
    v-bind:class="[this.rarityClass, this.cardSize, { 'is-selected': isSelected }]"
    role="button"
    tabindex="0"
    :aria-label="`View ${itemData.name} details`"
    :aria-pressed="String(isSelected)"
    @click="itemCardClick"
    @keydown.enter="itemCardClick"
    @keydown.space.prevent="itemCardClick"
  >
    <div class="image-div">
      <img class="item-icon" :src="this.itemImageUrl" :alt="itemData.name" />
    </div>
    <div class="item-details" :class="{ 'has-build-tier': buildTier }">
      <h4 class="item-name">
        {{ itemData.name }}
        <span class="item-effective-max" v-if="effectiveMax > 0" unselectable="on">
          Max: {{ effectiveMax }}
        </span>
      </h4>
      <p class="item-short-description">{{ itemData.shortDescription }}</p>
      <span v-if="buildTier" class="build-tier build-badge"
        :class="`build-badge--${buildTier}`"
        :aria-label="`${buildTier} tier for this survivor's build`"
        :title="`${buildTier} tier for this survivor's build`">
        {{ buildTier }}
      </span>
    </div>
    <img class="dlc-icon" v-if="itemData.dlc" v-bind:src="this.dlcIconUrl" />
  </div>
</template>

<script>
import { mapState, mapMutations } from "vuex";

import items from "../data/catalog";
import getItemImageUrl from "../helpers/ItemImageUtils";
import { ItemRarityClass, DlcIconUrl } from "../data/constants";
import { getBuildTier } from "../data/survivorBuilds";

export default {
  name: "ItemCard",
  props: ["itemId", "itemType"],
  data() {
    return {
      publicPath: process.env.BASE_URL,
    };
  },
  computed: {
    ...mapState(["cardSize"]),
    isSelected() {
      return this.$store.state.selectedItem !== null
        && this.$store.state.selectedItem.id === this.itemId;
    },
    buildTier() {
      const { selectedBuild, builds } = this.$store.getters;
      if (selectedBuild && selectedBuild.custom) return null;
      return getBuildTier(this.itemData.name, this.$store.state.selectedRole, builds);
    },
    effectiveMax() {
      return (this.itemData.stats || []).reduce((tot, val) => {
        return Math.max(tot, val.effectiveMax || 0);
      }, 0);
    },
    rarityClass() {
      return ItemRarityClass[this.itemData.itemRarity];
    },
    itemData() {
      return items[this.itemId];
    },
    dlcIconUrl() {
      if (this.itemData.dlc) {
        return DlcIconUrl[this.itemData.dlc];
      }
      return "";
    },
    itemImageUrl() {
      return getItemImageUrl(this.itemId, process.env.BASE_URL);
    },
  },
  methods: {
    ...mapMutations(["setSelectedItem"]),
    itemCardClick() {
      this.setSelectedItem({ id: this.itemId, type: this.itemType });
    },
  },
};
</script>

<style scoped>
.small-view {
  --item-card-height: 82px;
  --item-icon-size: 52px;
  --item-name-text-size: 13px;
  --description-text-size: 12px;
  --dlc-icon-size: 14px;
}

.large-view {
  --item-card-height: 96px;
  --item-icon-size: 64px;
  --item-name-text-size: 14px;
  --description-text-size: 13px;
  --dlc-icon-size: 14px;
}

.item-card {
  display: flex;
  flex-direction: row;
  align-items: center;
  box-sizing: border-box;
  min-height: var(--item-card-height);
  padding: var(--space-3);
  gap: var(--space-3);
  border: 1px solid var(--border);
  border-left: 2px solid var(--item-card-colour);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
  user-select: none;
  position: relative;
  transition: background var(--motion-fast), border-color var(--motion-fast);
}

.item-card:hover {
  border-color: var(--border-strong);
  border-left-color: var(--item-card-colour);
  background: var(--surface-raised);
}
.item-card.is-selected {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.item-icon {
  display: block;
  height: var(--item-icon-size);
  width: var(--item-icon-size);
  object-fit: contain;
  border-radius: var(--radius-sm);
  background: var(--canvas);
}

.item-details {
  min-width: 0;
  position: relative;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.item-details.has-build-tier { padding-right: 34px; }
.build-tier {
  position: absolute;
  right: 5px;
  top: 50%;
  transform: translateY(-50%);
}

.item-name {
  font-size: var(--item-name-text-size);
  margin: 0;
  padding-right: 12px;
  line-height: 1.35;
  font-weight: 600;
  overflow-wrap: anywhere;
  position: relative;
}

.item-effective-max {
  display: inline-block;
  margin-left: 4px;
  font: 10px/1.4 var(--font-mono);
  color: var(--text-muted);
}

.item-short-description {
  font-style: normal;
  font-size: var(--description-text-size);
  margin: 0;
  line-height: 1.5;

  /* Truncate */
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;

  color: var(--text-muted);
}

.image-div {
  position: relative;
  flex-shrink: 0;
}

.dlc-icon {
  height: var(--dlc-icon-size);
  width: auto;
  opacity: 0.8;
  top: 7px;
  position: absolute;
  right: 7px;
}
</style>
