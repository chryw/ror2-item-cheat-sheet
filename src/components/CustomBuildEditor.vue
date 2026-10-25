<template>
  <section class="custom-build-editor" aria-label="Custom build editor">
    <form class="rename-form" @submit.prevent="rename">
      <label class="nav-field" for="custom-build-name">
        <span>Build name</span>
        <AppInput id="custom-build-name" v-model="name" maxlength="80" required />
      </label>
      <AppButton type="submit" :disabled="!name.trim()">Rename</AppButton>
    </form>
    <p v-if="!build.itemIds.length">
      Your list is empty. Pick an item in the gallery, then use Add to custom build in its details.
    </p>
    <ul v-else class="saved-items">
      <li v-for="id in build.itemIds" :key="id">
        <AppButton class="saved-item-link" variant="ghost" @click="viewItem(id)">
          {{ id }}
        </AppButton>
        <AppButton class="saved-item-remove" variant="ghost" icon-only
          :aria-label="`Remove ${id} from build`"
          @click="$store.dispatch('removeCustomBuildItem', { id: build.id, itemId: id })">
          <AppIcon name="close" />
        </AppButton>
      </li>
    </ul>
    <div class="delete-build-actions">
      <template v-if="confirmingDelete">
        <p role="alert">Delete "{{ build.name }}"? This cannot be undone.</p>
        <div class="delete-build-buttons">
          <AppButton ref="cancelDelete" @click="cancelDelete">
            Cancel
          </AppButton>
          <AppButton variant="danger"
            @click="$emit('delete', build.id)">Confirm delete</AppButton>
        </div>
      </template>
      <AppButton v-else ref="deleteBuild" variant="danger"
        :disabled="!$store.state.customBuildsLoaded" @click="requestDelete">
        Delete custom build
      </AppButton>
    </div>
  </section>
</template>

<script>
import items from '../data/catalog';
import ItemIdUtils from '../helpers/ItemIdUtils';

export default {
  name: 'CustomBuildEditor',
  props: { build: { type: Object, required: true } },
  data() { return { name: this.build.name, confirmingDelete: false }; },
  watch: {
    'build.name': function updateName(value) { this.name = value; },
  },
  methods: {
    requestDelete() {
      this.confirmingDelete = true;
      this.$nextTick(() => this.$refs.cancelDelete.focus());
    },
    cancelDelete() {
      this.confirmingDelete = false;
      this.$nextTick(() => this.$refs.deleteBuild.focus());
    },
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
.custom-build-editor { flex: 1 0 100%; min-width: 0; font-size: var(--text-sm); }
.rename-form { display: flex; flex-wrap: wrap; align-items: flex-end; gap: var(--space-2); }
.rename-form label { flex: 1; min-width: 120px; }
.saved-items {
  display: flex; flex-wrap: wrap; gap: 6px;
  padding: 0; margin: var(--space-3) 0 0; list-style: none;
}
.saved-items li {
  display: flex; align-items: center; min-width: 0; max-width: 100%;
  border: var(--border-width) solid var(--border); border-radius: var(--radius-md);
  background: var(--surface-raised); overflow: hidden;
}
.saved-item-link { text-align: left; border-radius: 0; }
.saved-item-remove {
  align-self: stretch; height: auto;
  border: 0; border-left: var(--border-width) solid var(--border); border-radius: 0;
}
.saved-items button:hover { background: var(--surface-hover); color: var(--accent); }
.delete-build-actions {
  margin-top: var(--space-4); padding-top: var(--space-4);
  border-top: var(--border-width) solid var(--border);
}
.delete-build-actions p { overflow-wrap: anywhere; }
.delete-build-buttons {
  display: flex; flex-wrap: wrap; gap: var(--space-2); margin-top: var(--space-3);
}
</style>
