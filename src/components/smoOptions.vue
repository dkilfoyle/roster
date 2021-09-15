<template>
  <div class="column q-pb-md">
    <q-item-section>
      <q-checkbox
        v-model="store.smoViewOptions.showErrors"
        label="Show Errors"
        size="sm"
      />
      <q-checkbox
        v-model="store.smoViewOptions.showSummary"
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
