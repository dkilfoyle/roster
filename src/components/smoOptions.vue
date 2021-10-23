<template>
  <div class="column q-pb-md q-gutter-sm">
    <q-item-label>Colorize</q-item-label>
    <q-item-section>
      <q-radio size="sm" v-model="smoStore.viewOptions.showColors" val="errors" label="Errors"></q-radio>
      <q-radio
        size="sm"
        v-model="smoStore.viewOptions.showColors"
        val="activities"
        label="Activities"
      ></q-radio>
      <q-radio size="sm" v-model="smoStore.viewOptions.showColors" val="none" label="None"></q-radio>
    </q-item-section>
    <!-- <q-item-label>Availability Highlight</q-item-label>
    <q-item-section>
      <q-checkbox v-model="smoStore.viewOptions.availabilityLimitUnassigned">Unassigned Only</q-checkbox>
    </q-item-section>-->
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
