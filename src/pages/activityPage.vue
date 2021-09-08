<template>
  <q-page style="padding: 24px">
    <!-- <q-scroll-area class="sa"> -->
    <activity-view v-if="store.compiled"></activity-view>
    <!-- </q-scroll-area> -->
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

<style scoped>
.sa {
  height: calc(100vh - 50px - 48px);
  border: 1px solid lightgrey;
}
</style>
