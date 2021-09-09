<template>
  <div class="wrapped">
    <q-markup-table dense class="sticky-column-table">
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
        <template v-for="(smo, i) in store.smos" :key="i">
          <tr :class="`row-${i % 2}`">
            <td>{{ smo.name }}</td>
            <td style="border-right: 2px solid black">AM</td>
            <smo-cell
              v-for="date in store.dates"
              :key="date"
              :dateStr="date.toDateString()"
              time="AM"
              :smoName="smo.name"
            ></smo-cell>
          </tr>
          <tr :class="`row-${i % 2} pm-row`">
            <td></td>
            <td style="border-right: 2px solid black">PM</td>
            <smo-cell
              v-for="date in store.dates"
              :key="date"
              :dateStr="date.toDateString()"
              time="PM"
              :smoName="smo.name"
            ></smo-cell>
          </tr>
        </template>
      </tbody>
    </q-markup-table>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useStore } from '../stores/store';

import smoCell from './smoCell.vue';
import { format } from 'date-fns';

export default defineComponent({
  // name: 'ComponentName'
  components: { smoCell },
  setup() {
    const store = useStore();

    return {
      store,
      format,
    };
  },
});
</script>

<style lang="scss" scoped>
@import '../css/calendar.scss';
</style>
