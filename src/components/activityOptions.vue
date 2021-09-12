<template>
  <div class="column q-pb-md">
    <q-item-section>
      <q-checkbox
        v-model="store.activityViewOptions.showErrors"
        label="Show Errors"
        size="sm"
      />
      <q-checkbox
        v-model="store.activityViewOptions.showSummary"
        label="Show Summary"
        size="sm"
      />
    </q-item-section>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useStore } from '../stores/store';
export default defineComponent({
  // name: 'ComponentName'
  setup() {
    const store = useStore();
    return { store };
  },
});
</script>
