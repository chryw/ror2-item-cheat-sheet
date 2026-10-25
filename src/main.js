import Vue from 'vue';
import App from './App.vue';
import AppIcon from './components/Icons/AppIcon';

import store from './store';

Vue.component('AppIcon', AppIcon);

Vue.config.productionTip = false;

// eslint-disable-next-line import/prefer-default-export
export const bus = new Vue();

store.dispatch('loadCustomBuilds');

new Vue({
  store,
  render: (h) => h(App),
}).$mount('#app');
