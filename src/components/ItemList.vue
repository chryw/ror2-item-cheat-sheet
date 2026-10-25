<template>
  <div class="item-list-wrapper">
    <header class="item-list-heading">
      <h2 class="item-list-header">{{ SelectionTypePluralization[itemListType] }}</h2>
      <span class="item-count" :aria-label="`${itemIdList.length} matching entries`">
        {{ itemIdList.length }}
      </span>
      <span class="section-rule" aria-hidden="true"></span>
    </header>
    <div class="item-list" v-bind:class="[this.cardSize]">
      <ItemCard
        v-show="!isItemIdListEmpty"
        v-for="itemId in itemIdList"
        v-bind:key="itemId"
        v-bind:itemId="itemId"
        :itemType="itemListType"
      />
    </div>
    <div class="no-items-message" v-show="isItemIdListEmpty">
      No Matching {{ SelectionTypePluralization[itemListType] }} Found
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import ItemCard from "./ItemCard.vue";

import itemsV2 from "../data/catalog";
import { SelectionTypePluralization } from "../data/constants";
import ItemIdUtils from "../helpers/ItemIdUtils";

export default {
  name: "ItemList",
  props: ["itemListType"],
  data() {
    return {
      SelectionTypePluralization,
    };
  },
  components: {
    ItemCard,
  },
  computed: {
    ...mapState([
      "showHidden", "sortBy", "filterBy", "searchTerm", "cardSize", "selectedRole", "recommendedOnly",
    ]),
    itemIdList() {
      // Set a list of operations that will be done to the item id list
      // * Note: Order matters in this list
      const itemIdOperations = [
        (itemIds, itemList) => ItemIdUtils.showHiddenOperation(itemIds, itemList, this.showHidden),
        (itemIds, itemList) =>
          // eslint-disable-next-line implicit-arrow-linebreak
          ItemIdUtils.filterBySelectionType(
            itemIds,
            itemList,
            this.itemListType,
          ),
        (itemIds, itemList) => ItemIdUtils.filterOperation(itemIds, itemList, this.filterBy),
        (itemIds, itemList) => ItemIdUtils.roleFilterOperation(
          itemIds, itemList, this.selectedRole, this.recommendedOnly, this.$store.getters.builds,
        ),
        (itemIds, itemList) => ItemIdUtils.searchOperation(itemIds, itemList, this.searchTerm),
        (itemIds, itemList) => ItemIdUtils.sortOperation(
          itemIds, itemList, this.sortBy, this.selectedRole, this.$store.getters.builds,
        ),
      ];

      // Go through the operations and apply each operation to the output of the
      // previous operation
      return itemIdOperations.reduce((itemIds, operation) => {
        return operation(itemIds, itemsV2);
      }, Object.keys(itemsV2));
    },
    isItemIdListEmpty() {
      return this.itemIdList.length <= 0;
    },
  },
};
</script>

<style>
.small-view {
  --item-card-width: var(--card-width-compact);
}

.large-view {
  --item-card-width: var(--card-width-comfortable);
}

.item-list-wrapper {
  margin-bottom: var(--space-6);
}

.item-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, var(--item-card-width)), 1fr));
  gap: var(--space-3);
  height: fit-content;
}

.no-items-message {
  text-align: center;
  margin: 0;
  padding: var(--space-6);
  border: var(--border-width) dashed var(--border);
  border-radius: var(--radius-md);
  color: var(--text-muted);
  font-size: var(--text-body);
  line-height: var(--leading-body);
}

.item-list-heading {
  display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-4);
}
.item-list-header {
  margin: 0;
  font-size: var(--text-section);
  font-weight: var(--weight-semibold);
  letter-spacing: -0.025em;
}
.item-count {
  padding: 3px var(--space-2);
  border: var(--border-width) solid var(--border); border-radius: var(--radius-pill);
  color: var(--text-muted); font: var(--text-label)/1.3 var(--font-mono);
}
.section-rule { flex: 1; height: var(--border-width); background: var(--border); }
</style>
