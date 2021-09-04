<template>
  <q-markup-table dense>
    <thead>
      <tr>
        <th></th>
        <th></th>
        <th v-for="date in store.dates" :key="date">
          {{ format(date, 'dd') }}
        </th>
      </tr>
      <tr class="pm-row">
        <th></th>
        <th></th>
        <th v-for="date in store.dates" :key="date">
          {{ format(date, 'ccccc') }}
        </th>
      </tr>
    </thead>
    <tbody>
      <template v-for="(activity, i) in store.activities" :key="activity">
        <tr :class="`row-${i % 2}`">
          <td>{{ activity.name }}</td>
          <td>AM</td>
          <activity-cell
            v-for="date in store.dates"
            :key="date"
            :dateStr="date.toDateString()"
            time="AM"
            :activityName="activity.name"
          ></activity-cell>
        </tr>
        <tr :class="`row-${i % 2} pm-row`">
          <td></td>
          <td>PM</td>
          <activity-cell
            v-for="date in store.dates"
            :key="date"
            :dateStr="date.toDateString()"
            time="PM"
            :activityName="activity.name"
          ></activity-cell>
        </tr>
      </template>
    </tbody>
  </q-markup-table>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useStore } from '../stores/store';

import activityCell from './activityCell.vue';
import { format } from 'date-fns';

export default defineComponent({
  // name: 'ComponentName'
  components: { activityCell },
  setup() {
    const store = useStore();
    store.setStartDate(new Date('2021-08-02'));

    return {
      store,
      format,
    };
  },
});
</script>

<style scoped>
.row-0 td {
  background: rgb(238, 238, 238);
}

.pm-row td {
  border-bottom: 2px solid black;
}

td.weekBoundary {
  border-right: 2px solid black;
}

td.invalid {
  background: rgb(211, 0, 0, 0.3);
}

td.week-0 {
  background: lightgreen;
}

td.week-1 {
  background: white;
}

.pm-row th {
  border-bottom: 2px solid black;
}

th,
td {
  border-right: 1px solid rgb(211, 211, 211);
}

.q-table th,
.q-table td {
  text-align: center;
}
</style>
