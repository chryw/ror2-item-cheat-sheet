<template>
  <section class="custom-build-editor" aria-label="Custom build editor">
    <form class="rename-form" @submit.prevent="rename">
      <label class="nav-field" for="custom-build-name">
        <span>Build name</span>
        <input id="custom-build-name" v-model="name" type="text" maxlength="80" required>
      </label>
      <button class="ui-button" type="submit" :disabled="!name.trim()">Rename</button>
    </form>
    <p v-if="!build.itemIds.length">
      Your list is empty. Pick an item in the gallery, then use Add to custom build in its details.
    </p>
    <ul v-else class="saved-items">
      <li v-for="id in build.itemIds" :key="id">
        <button class="saved-item-link" type="button" @click="viewItem(id)">{{ id }}</button>
        <button class="saved-item-remove" type="button" :aria-label="`Remove ${id} from build`"
          @click="$store.dispatch('removeCustomBuildItem', { id: build.id, itemId: id })">
          <AppIcon name="close" />
        </button>
      </li>
    </ul>
  </section>
</template>

<script>
import items from '../data/catalog';
import ItemIdUtils from '../helpers/ItemIdUtils';

export default {
  name: 'CustomBuildEditor',
  props: { build: { type: Object, required: true } },
  data() { return { name: this.build.name }; },
  watch: {
    'build.name': function updateName(value) { this.name = value; },
  },
  methods: {
    rename() {
      this.$store.dispatch('renameCustomBuild', { id: this.build.id, name: this.name });
    },
    viewItem(id) {
      const type = ItemIdUtils.getSelectionType(items[id]);
      this.$store.commit('setSelectedItem', { id, type });
    },
  },
};
</script>

<style scoped>
.custom-build-editor { flex: 1 0 100%; min-width: 0; font-size: 12px; }
.rename-form { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 8px; }
.rename-form label { flex: 1; min-width: 120px; }
.saved-items {
  display: flex; flex-wrap: wrap; gap: 6px; padding: 0; margin: 12px 0 0; list-style: none;
}
.saved-items li {
  display: flex; align-items: center; min-width: 0; max-width: 100%;
  border: 1px solid var(--border); border-radius: var(--radius-md);
  background: var(--surface-raised); overflow: hidden;
}
.saved-item-link, .saved-item-remove {
  min-height: 40px; padding: 8px 12px; border: 0; background: none;
  color: var(--text); cursor: pointer; font: inherit;
}
.saved-item-link { text-align: left; overflow-wrap: anywhere; }
.saved-item-remove { align-self: stretch; border-left: 1px solid var(--border); }
.saved-items button:hover { background: var(--surface-hover); color: var(--accent); }
</style>
