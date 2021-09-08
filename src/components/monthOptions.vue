<template>
  <div class="column">
    <div class="col">
      Start Date: {{ format(store.startDate, 'yyyy-MM-dd') }}
    </div>
    <div class="row q-gutter-md options items-center">
      <q-select
        v-model="month"
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
        class="col"
        options-dense
      ></q-select>
      <q-select
        v-model="year"
        :options="[2018, 2019, 2020, 2021, 2022, 2023, 2024]"
        class="col"
        options-dense
      ></q-select>
    </div>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  reactive,
  computed,
  watch,
  onMounted,
  toRefs,
} from 'vue';
import { format } from 'date-fns';
import { useStore, getFirstMonday } from '../stores/store';

export default defineComponent({
  // name: 'ComponentName'
  setup() {
    const store = useStore();

    const state = reactive({
      year: store.startDate.getFullYear(),
      month: store.startDate.getMonth(),
    });

    const firstMonday = computed(() => getFirstMonday(state.year, state.month));

    onMounted(() => {
      store.setMonth(state.year, state.month);
    });

    watch(firstMonday, () => {
      // console.log(newStartDate, numWeeks.value);
      store.setMonth(state.year, state.month);
    });

    return {
      ...toRefs(state),
      store,
      format,
    };
  },
});
</script>

<style scoped>
.options {
  padding-bottom: 10px;
  padding-right: 10px;
}
</style>
