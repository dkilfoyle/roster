<template>
  <q-page style="padding: 24px">
    <summary-view v-show="store.summaryLoaded"></summary-view>
    <div
      v-show="!store.summaryLoaded"
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
import summaryView from '../components/summaryView.vue';

export default defineComponent({
  // name: 'PageName'
  components: { summaryView },
  setup() {
    const store = useStore();
    return {
      store,
    };
  },
});
</script>

<style scoped></style>
