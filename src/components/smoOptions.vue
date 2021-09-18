<template>
  <div class="column q-pb-md">
    <q-item-section>
      <q-checkbox
        v-model="smos.viewOptions.showErrors"
        label="Show Errors"
        size="sm"
      />
    </q-item-section>
  </div>
</template>

<script lang="ts">
import { useSMOStore } from 'src/stores/smos';
import { defineComponent } from 'vue';
export default defineComponent({
  // name: 'ComponentName'
  setup() {
    const smos = useSMOStore();
    return { smos };
  },
});
</script>
