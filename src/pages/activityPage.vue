<template>
  <q-page style="padding: 24px">
    <activity-view v-if="store.compiled"></activity-view>
  </q-page>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useStore } from '../stores/store';
import activityView from '../components/activityView.vue';

export default defineComponent({
  // name: 'PageName'
  components: { activityView },
  setup() {
    const store = useStore();
    return {
      store,
    };
  },
});
</script>

<style scoped></style>
