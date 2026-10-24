<template>
  <div
    class="item-card"
    v-bind:class="[this.rarityClass, this.cardSize]"
    role="button"
    tabindex="0"
    :aria-label="`View ${itemData.name} details`"
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
        <!-- <span class="item-id" v-if="itemData.id" unselectable="on">#{{ itemData.id }}</span> -->
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
  --item-card-height: 50px;
  --border-thickness: 2px;

  --sub-text-colour: darkSlateGrey;
  --background-opacity: 0.45;

  --sub-text-size: 65%;
  --item-name-text-size: 90%;
  --description-text-size: 70%;

  --item-card-margin: 2px;

  --dlc-icon-size: 14px;
}

.large-view {
  --item-card-height: 75px;
  --border-thickness: 2px;

  --sub-text-colour: darkSlateGrey;
  --background-opacity: 0.25;

  --sub-text-size: 75%;
  --item-name-text-size: 95%;
  --description-text-size: 80%;

  --item-card-margin: 2px;

  --dlc-icon-size: 14px;
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

.item-card {
  display: flex;
  flex-direction: row;
  height: var(--item-card-height);
  border: var(--border-thickness) solid var(--item-card-colour);

  cursor: pointer;

  margin: var(--item-card-margin);

  -webkit-user-select: none; /* Safari */
  -moz-user-select: none; /* Firefox */
  -ms-user-select: none; /* IE10+/Edge */
  user-select: none; /* Standard */
  position: relative;
}

.item-card:hover {
  margin-bottom: calc(2 * var(--item-card-margin));
  margin-top: 0px;
  margin-right: 0px;
  margin-left: calc(2 * var(--item-card-margin));
  box-shadow: calc(-1 * var(--item-card-margin)) var(--item-card-margin) 5px #999999;
}

.item-card:active {
  box-shadow: none;
  margin: var(--item-card-margin);
}

.item-icon {
  height: var(--item-card-height);
  width: var(--item-card-height);
  border-right: var(--border-thickness) solid var(--item-card-colour);
  background: radial-gradient(var(--item-card-colour), #222222);
}

.item-details {
  min-width: 0;
  position: relative;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  background: var(--item-card-colour-opaque);
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
  margin: 3px 3px 1px 5px;

  position: relative;
}

.item-effective-max {
  position: absolute;
  top: 0;
  right: 0;

  font-size: var(--sub-text-size);
  color: var(--sub-text-colour);
  /* float: right; */

  user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  -webkit-user-select: none;
}

.item-short-description {
  font-style: normal;
  font-size: var(--description-text-size);
  margin: 1px 3px 3px 5px;

  /* Truncate */
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;

  color: var(--sub-text-colour);
}

.item-id {
  font-size: var(--sub-text-size);
  font-style: italic;
  font-weight: lighter;
  color: var(--sub-text-colour);

  user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  -webkit-user-select: none;
}

.image-div {
  position: relative;
}

.dlc-icon {
  height: var(--dlc-icon-size);
  width: auto;
  margin: 2px 2px 0px 0px;
  position: absolute;
  right: 0;
}
</style>
