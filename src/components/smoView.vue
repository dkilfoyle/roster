<template>
  <div class="wrapped">
    <q-markup-table dense class="sticky-column-table">
      <thead>
        <tr>
          <th></th>
          <th></th>
          <th v-for="date in monthStore.dates" :key="date.toDateString()">{{ format(date, 'dd') }}</th>
        </tr>
        <tr class="pm-row">
          <th>
            <q-btn icon="filter_alt" size="sm"></q-btn>
            <q-menu anchor="top right" v-model="showSMOFilterMenu">
              <div class="row q-pa-md">
                <div class="column">
                  <q-btn-group spread>
                    <q-btn @click="smoStore.showAll()" icon="playlist_add" size="sm"></q-btn>
                    <q-btn @click="smoStore.showNone()" icon="clear_all" size="sm"></q-btn>
                    <q-btn @click="showSMOFilterMenu = false" icon="close" size="sm"></q-btn>
                  </q-btn-group>
                  <q-checkbox
                    v-model="smoStore.viewOptions.showCall"
                    label="Call"
                    size="sm"
                    class="q-pt-md"
                  />
                  <q-checkbox v-model="smoStore.viewOptions.showWard" label="Wards" size="sm" />
                  <q-checkbox v-model="smoStore.viewOptions.showEMG" label="EMG" size="sm" />
                  <q-checkbox v-model="smoStore.viewOptions.showEEG" label="EEG" size="sm" />
                  <q-checkbox v-model="smoStore.viewOptions.showBTX" label="BTX" size="sm" />
                  <q-checkbox v-model="smoStore.viewOptions.showWDHB" label="WDHB" size="sm" />
                  <q-checkbox v-model="smoStore.viewOptions.showCDHB" label="CMDHB" size="sm" />
                  <q-checkbox v-model="smoStore.viewOptions.showOther" label="Other" size="sm" />
                </div>
              </div>
            </q-menu>
          </th>
          <th></th>
          <th
            v-for="date in monthStore.dates"
            :key="date.toDateString()"
          >{{ format(date, 'ccccc') }}</th>
        </tr>
      </thead>
      <transition-group name="smotable" tag="tbody">
        <tr
          v-for="(smo, i) in smoStore.filteredSMOs2"
          :key="smo.name + (i % 2)"
          :class="i % 2 ? 'pm-row' : ''"
        >
          <td>{{ i % 2 ? '' : smo.name }}</td>
          <td style="border-right: 2px solid black">{{ i % 2 ? 'PM' : 'AM' }}</td>
          <smo-cell
            v-for="date in monthStore.dates"
            :key="date.toDateString()"
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
import { defineComponent, ref } from 'vue';
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

    const showSMOFilterMenu = ref(false);


    return {
      store,
      smoStore,
      monthStore,
      format,
      showSMOFilterMenu
    };
  },
});
</script>

<style lang="scss" scoped>
@import "../css/calendar.scss";

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
