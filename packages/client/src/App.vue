<template>
  <div id="app">
    <RouterView />
  </div>
</template>

<script>
import { RouterView } from "vue-router";

export default {
  components: {
    RouterView,
  },
};
</script>

<style>
.html,
body {
  background-color: #ebf8ff !important;
}
</style>
