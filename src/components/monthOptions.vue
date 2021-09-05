<template>
  <div class="column">
    <div class="col">Start Date: {{ format(startDate, 'yyyy-MM-dd') }}</div>
    <div class="row q-gutter-md options items-center">
      <q-select
        v-model="month"
        :options="[
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
          'Oct',
          'Nov',
          'Dec',
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
import { differenceInWeeks, format } from 'date-fns';
import { useStore } from '../stores/store';

export default defineComponent({
  // name: 'ComponentName'
  setup() {
    const state = reactive({
      year: 2021,
      month: 'Aug',
    });

    const store = useStore();

    const getFirstMonday = (year: number, month: number) => {
      const d = new Date(`${year}-${month}-1`);
      while (d.getDay() !== 1) {
        d.setDate(d.getDate() + 1);
      }
      return d;
    };

    const monthNum = computed(() => {
      switch (state.month) {
        case 'Jan':
          return 1;
        case 'Feb':
          return 2;
        case 'Mar':
          return 3;
        case 'Apr':
          return 4;
        case 'May':
          return 5;
        case 'Jun':
          return 6;
        case 'Jul':
          return 7;
        case 'Aug':
          return 8;
        case 'Sep':
          return 9;
        case 'Oct':
          return 10;
        case 'Nov':
          return 11;
        case 'Dec':
          return 12;
        default:
          return 0;
      }
    });

    const startDate = computed(() => {
      return getFirstMonday(state.year, monthNum.value);
    });

    //getFirstMonday(year.value, month.value));
    const numWeeks = computed(() => {
      const d = getFirstMonday(
        state.year + (monthNum.value == 12 ? 1 : 0),
        (monthNum.value + 1) % 12
      );
      return differenceInWeeks(d, startDate.value);
    });

    onMounted(() => {
      store.setMonth(startDate.value, numWeeks.value);
    });

    watch(startDate, (newStartDate) => {
      // console.log(newStartDate, numWeeks.value);
      store.setMonth(newStartDate, numWeeks.value);
    });

    return {
      ...toRefs(state),
      startDate,
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
