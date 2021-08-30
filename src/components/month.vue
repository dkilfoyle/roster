<template>
  <div>My component</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useMainStore } from '../stores/main';
export default defineComponent({
  // name: 'ComponentName'
  setup() {
    const store = useMainStore();
    console.log(store);
  },
});
</script>
