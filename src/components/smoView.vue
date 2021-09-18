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
          <th>
            <q-btn icon="filter_alt" size="sm"
              ><q-menu>
                <div class="row q-pa-md">
                  <div class="column">
                    <q-btn @click="showAll" size="sm" class="q-mb-md"
                      >All</q-btn
                    >
                    <q-checkbox
                      v-model="smos.viewOptions.showCall"
                      label="Call"
                      size="sm"
                    />
                    <q-checkbox
                      v-model="smos.viewOptions.showWard"
                      label="Wards"
                      size="sm"
                    />
                    <q-checkbox
                      v-model="smos.viewOptions.showEMG"
                      label="EMG"
                      size="sm"
                    />
                    <q-checkbox
                      v-model="smos.viewOptions.showEEG"
                      label="EEG"
                      size="sm"
                    />
                    <q-checkbox
                      v-model="smos.viewOptions.showWDHB"
                      label="WDHB"
                      size="sm"
                    />
                    <q-checkbox
                      v-model="smos.viewOptions.showCDHB"
                      label="CMDHB"
                      size="sm"
                    />
                  </div>
                </div> </q-menu
            ></q-btn>
          </th>
          <th></th>
          <th v-for="date in store.dates" :key="date">
            {{ format(date, 'ccccc') }}
          </th>
        </tr>
      </thead>
      <tbody>
        <template v-for="(smo, i) in smos.filteredSMOs" :key="i">
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
import { useSMOStore } from 'src/stores/smos';

import smoCell from './smoCell.vue';
import { format } from 'date-fns';

export default defineComponent({
  // name: 'ComponentName'
  components: { smoCell },
  setup() {
    const store = useStore();
    const smos = useSMOStore();
    const showAll = () => {
      smos.viewOptions.showEMG = true;
      smos.viewOptions.showEEG = true;
      smos.viewOptions.showCall = true;
      smos.viewOptions.showWard = true;
      smos.viewOptions.showWDHB = true;
      smos.viewOptions.showCDHB = true;
    };

    return {
      store,
      smos,
      showAll,
      format,
    };
  },
});
</script>

<style lang="scss" scoped>
@import '../css/calendar.scss';
</style>
