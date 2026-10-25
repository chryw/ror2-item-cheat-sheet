<template>
  <div class="role-filter">
    <AppSelect id="role-filter" v-model="selectedRole" label="Survivor / role" :options="options" />
    <label v-if="selectedRole" class="nav-checkbox">
      <input v-model="recommendedOnly" type="checkbox">
      {{ isCustom ? 'Saved items only' : 'Recommended items only' }}
    </label>
    <AppButton class="custom-create"
      :disabled="!$store.state.customBuildsLoaded"
      @click="createBuild">
      <AppIcon name="plus" />
      New custom build
    </AppButton>
  </div>
</template>

<script>
import AppSelect from '../AppSelect.vue';

export default {
  name: 'RoleFilter',
  components: { AppSelect },
  methods: {
    async createBuild() {
      await this.$store.dispatch('createCustomBuild');
      this.$emit('navigate');
    },
  },
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
      set(value) {
        this.$store.commit('setSelectedRole', value);
        this.$emit('navigate');
      },
    },
    recommendedOnly: {
      get() { return this.$store.state.recommendedOnly; },
      set(value) { this.$store.commit('setRecommendedOnly', value); },
    },
  },
};
</script>

<style scoped>
.custom-create { width: 100%; margin-top: var(--space-2); }
</style>
