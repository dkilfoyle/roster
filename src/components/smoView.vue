<template>
  <div class="wrapped">
    <q-markup-table dense class="sticky-column-table">
      <thead>
        <tr>
          <th></th>
          <th></th>
          <th v-for="date in monthStore.dates" :key="date">
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
                      v-model="smoStore.viewOptions.showCall"
                      label="Call"
                      size="sm"
                    />
                    <q-checkbox
                      v-model="smoStore.viewOptions.showWard"
                      label="Wards"
                      size="sm"
                    />
                    <q-checkbox
                      v-model="smoStore.viewOptions.showEMG"
                      label="EMG"
                      size="sm"
                    />
                    <q-checkbox
                      v-model="smoStore.viewOptions.showEEG"
                      label="EEG"
                      size="sm"
                    />
                    <q-checkbox
                      v-model="smoStore.viewOptions.showWDHB"
                      label="WDHB"
                      size="sm"
                    />
                    <q-checkbox
                      v-model="smoStore.viewOptions.showCDHB"
                      label="CMDHB"
                      size="sm"
                    />
                  </div>
                </div> </q-menu
            ></q-btn>
          </th>
          <th></th>
          <th v-for="date in monthStore.dates" :key="date">
            {{ format(date, 'ccccc') }}
          </th>
        </tr>
      </thead>
      <transition-group name="smotable" tag="tbody">
        <tr
          v-for="(smo, i) in smoStore.filteredSMOs2"
          :key="smo.name + (i % 2)"
        >
          <td>{{ i % 2 ? '' : smo.name }}</td>
          <td style="border-right: 2px solid black">
            {{ i % 2 ? 'PM' : 'AM' }}
          </td>
          <smo-cell
            v-for="date in monthStore.dates"
            :key="date"
            :dateStr="date.toDateString()"
            :time="i % 2 ? 'PM' : 'AM'"
            :smoName="smo.name"
          ></smo-cell>
        </tr>
      </transition-group>
    </q-markup-table>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useStore } from '../stores/store';
import { useSMOStore } from 'src/stores/smoStore';
import { useMonthStore } from 'src/stores/monthStore';

import smoCell from './smoCell.vue';
import { format } from 'date-fns';

export default defineComponent({
  // name: 'ComponentName'
  components: { smoCell },
  setup() {
    const store = useStore();
    const smoStore = useSMOStore();
    const monthStore = useMonthStore();

    const showAll = () => {
      smoStore.viewOptions.showEMG = true;
      smoStore.viewOptions.showEEG = true;
      smoStore.viewOptions.showCall = true;
      smoStore.viewOptions.showWard = true;
      smoStore.viewOptions.showWDHB = true;
      smoStore.viewOptions.showCDHB = true;
    };

    return {
      store,
      smoStore,
      monthStore,
      showAll,
      format,
    };
  },
});
</script>

<style lang="scss" scoped>
@import '../css/calendar.scss';

.sticky-column-table {
  table {
    border-bottom: 2px solid black;
  }
}

.smotable-enter-active,
.smotable-leave-active {
  transition: all 0.3s;
}
.smotable-enter-from,
.smotable-leave-to {
  opacity: 0;
}
.smotable-move {
  transition: transform 0.3s;
}
</style>
