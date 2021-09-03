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
          <td
            v-for="(date, i) in store.dates"
            :key="i"
            :class="[
              `day-${format(date, 'ccc')}`,
              {
                invalid: !store.isValidActivity(date, 'AM', activity.name)
                  .answer,
              },
            ]"
          >
            {{
              store.getAssignedSMOs(date, 'AM', activity.name) ||
              (store.isActivityAllowed(date, 'AM', activity.name) ? '?' : '-')
            }}
          </td>
        </tr>
        <tr :class="`row-${i % 2} pm-row`">
          <td></td>
          <td>PM</td>
          <td
            v-for="(date, i) in store.dates"
            :key="i"
            :class="[
              `day-${format(date, 'ccc')}`,
              {
                invalid: !store.isValidActivity(date, 'PM', activity.name)
                  .answer,
              },
            ]"
          >
            {{
              store.getAssignedSMOs(date, 'PM', activity.name) ||
              (store.isActivityAllowed(date, 'PM', activity.name) ? '?' : '-')
            }}
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

<style scoped>
.row-0 td {
  background: rgb(238, 238, 238);
}

.pm-row td {
  border-bottom: 2px solid black;
}

td.day-Sat {
  border-left: 1px solid black;
}

td.day-Sun {
  border-right: 1px solid black;
}

td.invalid {
  background: rgb(211, 0, 0, 0.3);
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
