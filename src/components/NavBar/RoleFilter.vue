<template>
  <div class="role-filter">
    <label class="nav-field" for="role-filter">
      <span>Survivor / role</span>
      <span class="nav-select">
        <select id="role-filter" v-model="selectedRole">
          <option value="">All survivors</option>
          <option v-for="build in builds" :key="build.id" :value="build.id">
            {{ build.name }}{{ build.dlc ? ` (${build.dlc})` : '' }}
          </option>
        </select>
        <font-awesome-icon icon="chevron-down" aria-hidden="true" />
      </span>
    </label>
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
export default {
  name: 'RoleFilter',
  computed: {
    builds() { return this.$store.getters.builds; },
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
