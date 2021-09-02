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
      <tr>
        <th></th>
        <th></th>
        <th v-for="date in store.dates" :key="date">
          {{ format(date, 'ccccc') }}
        </th>
      </tr>
    </thead>
    <tbody>
      <template v-for="activity in store.activities" :key="activity">
        <tr>
          <td>{{ activity.name }}</td>
          <td>AM</td>
          <td v-for="(date, i) in store.dates" :key="i">
            {{ store.isValidActivity(activity.name, date, 'AM') ? '' : 'x' }}
          </td>
        </tr>
        <tr>
          <td></td>
          <td>PM</td>
          <td v-for="(date, i) in store.dates" :key="i">
            {{ store.isValidActivity(activity.name, date, 'PM') ? '' : 'x' }}
          </td>
        </tr>
      </template>
    </tbody>
  </q-markup-table>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useStore } from '../stores/store';

import { format } from 'date-fns';

export default defineComponent({
  // name: 'ComponentName'
  setup() {
    const store = useStore();
    store.setStartDate(new Date('2021-10-4'));

    return {
      store,
      format,
    };
  },
});
</script>
