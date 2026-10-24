<template>
  <div class="role-filter">
    <AppSelect id="role-filter" v-model="selectedRole" label="Survivor / role" :options="options" />
    <label v-if="selectedRole" class="nav-checkbox">
      <input v-model="recommendedOnly" type="checkbox">
      {{ isCustom ? 'Saved items only' : 'Recommended items only' }}
    </label>
    <button class="nav-reset custom-create" type="button"
      :disabled="!$store.state.customBuildsLoaded"
      @click="$store.dispatch('createCustomBuild')">
      New custom build
    </button>
  </div>
</template>

<script>
import AppSelect from '../AppSelect.vue';

export default {
  name: 'RoleFilter',
  components: { AppSelect },
  computed: {
    options() {
      return [{ value: '', label: 'All survivors' }, ...this.$store.getters.builds.map(build => ({
        value: build.id, label: build.name,
      }))];
    },
    isCustom() {
      return this.$store.getters.selectedBuild && this.$store.getters.selectedBuild.custom;
    },
    selectedRole: {
      get() { return this.$store.state.selectedRole; },
      set(value) { this.$store.commit('setSelectedRole', value); },
    },
    recommendedOnly: {
      get() { return this.$store.state.recommendedOnly; },
      set(value) { this.$store.commit('setRecommendedOnly', value); },
    },
  },
};
</script>

<style scoped>
.custom-create { width: 100%; margin-top: 12px; }
</style>
