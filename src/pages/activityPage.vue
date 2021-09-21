<template>
  <q-page style="padding: 24px">
    <activity-view v-if="store.compiled"></activity-view>
    <div
      v-else
      class="column justify-center items-center"
      style="height: calc(100vh - 50px - 48px)"
    >
      <div class="col-auto">
        <q-spinner-gears size="50px" color="primary"></q-spinner-gears>
      </div>
    </div>
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
