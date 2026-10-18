<template>
  <div id="app">
    <HomePage/>
  </div>
</template>

<script>
import HomePage from './components/HomePage.vue';

export default {
  name: 'App',
  components: {
    HomePage,
  },
};
</script>

<style>
body {
  margin: 0px;
}

.build-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  border: 1px solid rgba(0, 0, 0, 0.25);
  border-radius: 4px;
  background: #e4e4e4;
  color: #222;
  font-size: 14px;
  font-weight: 800;
  line-height: 1;
}

.build-badge--S { background: #f5cc62; color: #493300; }
.build-badge--A { background: #8cdbc5; color: #123f33; }
.build-badge--B { background: #a8c9f1; color: #1c385c; }
</style>
