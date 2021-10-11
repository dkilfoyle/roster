<template>
  <div class="column q-pb-md">
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
