<template>
  <div class="column q-pb-md">
    <q-item-section>
      <q-checkbox
        v-model="smoStore.viewOptions.showErrors"
        label="Show Errors"
        size="sm"
      />
    </q-item-section>
  </div>
</template>

<script lang="ts">
import { useSMOStore } from 'src/stores/smoStore';
import { defineComponent } from 'vue';
export default defineComponent({
  // name: 'ComponentName'
  setup() {
    const smoStore = useSMOStore();
    return { smoStore };
  },
});
</script>
