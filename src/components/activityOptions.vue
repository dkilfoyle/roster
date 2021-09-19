<template>
  <div class="column q-pb-md">
    <q-item-section>
      <q-checkbox
        v-model="activityStore.viewOptions.showErrors"
        label="Show Errors"
        size="sm"
      />
      <q-checkbox
        v-model="activityStore.viewOptions.showSummary"
        label="Show Summary"
        size="sm"
      />
    </q-item-section>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useActivityStore } from '../stores/activityStore';
export default defineComponent({
  // name: 'ComponentName'
  setup() {
    const activityStore = useActivityStore();
    return { activityStore };
  },
});
</script>
