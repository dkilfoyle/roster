<template>
  <div class="column q-pb-md q-pr-md q-pt-md q-gutter-y-md">
    <div class="row q-gutter-x-md">
      <q-select
        label="Start Month"
        stack-label
        v-model="store.summaryOptions.startMonth"
        emit-value
        map-options
        :options="[
          { label: 'Jan', value: 0 },
          { label: 'Feb', value: 1 },
          { label: 'Mar', value: 2 },
          { label: 'Apr', value: 3 },
          { label: 'May', value: 4 },
          { label: 'Jun', value: 5 },
          { label: 'Jul', value: 6 },
          { label: 'Aug', value: 7 },
          { label: 'Sep', value: 8 },
          { label: 'Oct', value: 9 },
          { label: 'Nov', value: 10 },
          { label: 'Dec', value: 11 },
        ]"
        filled
        dense
        class="col"
        options-dense
      ></q-select>
      <q-select
        label="Start Year"
        stack-label
        v-model="store.summaryOptions.startYear"
        :options="[2018, 2019, 2020, 2021, 2022, 2023, 2024]"
        filled
        dense
        class="col"
        options-dense
      ></q-select>
    </div>
    <div class="row q-gutter-x-md">
      <q-select
        label="End Month"
        stack-label
        v-model="store.summaryOptions.endMonth"
        emit-value
        map-options
        :options="[
          { label: 'Jan', value: 0 },
          { label: 'Feb', value: 1 },
          { label: 'Mar', value: 2 },
          { label: 'Apr', value: 3 },
          { label: 'May', value: 4 },
          { label: 'Jun', value: 5 },
          { label: 'Jul', value: 6 },
          { label: 'Aug', value: 7 },
          { label: 'Sep', value: 8 },
          { label: 'Oct', value: 9 },
          { label: 'Nov', value: 10 },
          { label: 'Dec', value: 11 },
        ]"
        filled
        dense
        class="col"
        options-dense
      ></q-select>
      <q-select
        label="End Year"
        stack-label
        v-model="store.summaryOptions.endYear"
        :options="[2018, 2019, 2020, 2021, 2022, 2023, 2024]"
        filled
        dense
        class="col"
        options-dense
      ></q-select>
    </div>
    <q-btn @click="last12" color="secondary">Last 12 months</q-btn>
    <q-checkbox
      v-model="store.summaryOptions.showHeatmap"
      label="Show Heatmap"
    ></q-checkbox>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import { useStore } from '../stores/store';
export default defineComponent({
  // name: 'ComponentName'
  setup() {
    const store = useStore();
    const last12 = () => {
      store.summaryOptions.startMonth = new Date().getMonth();
      store.summaryOptions.startYear = new Date().getFullYear() - 1;
      store.summaryOptions.endMonth = new Date().getMonth();
      store.summaryOptions.endYear = new Date().getFullYear();
    };
    return { store, last12 };
  },
});
</script>
