<template>
  <div class="role-filter">
    <label class="nav-field" for="role-filter">
      <span>Survivor / role</span>
      <span class="nav-select">
        <select id="role-filter" v-model="selectedRole">
          <option value="">All survivors</option>
          <option v-for="build in survivorBuilds" :key="build.id" :value="build.id">
            {{ build.name }}
          </option>
        </select>
        <font-awesome-icon icon="chevron-down" aria-hidden="true" />
      </span>
    </label>
    <label v-if="selectedRole" class="nav-checkbox">
      <input v-model="recommendedOnly" type="checkbox">
      Recommended items only
    </label>
  </div>
</template>

<script>
import { survivorBuilds } from '../../data/survivorBuilds';

export default {
  name: 'RoleFilter',
  data() { return { survivorBuilds }; },
  computed: {
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
