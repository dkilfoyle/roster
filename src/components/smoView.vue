<template>
  <div class="wrapped">
    <div class="row q-gutter-md q-mb-md">
      <q-btn-toggle
        class="col-auto"
        v-model="activityPage"
        @update:model-value="activityButton = ''"
        :options="[{ label: 'P1', value: 'p1' }, { label: 'P2', value: 'p2' }]"
      ></q-btn-toggle>
      <q-btn-toggle
        v-if="activityPage == 'p1'"
        @update:model-value="clickActivityButton"
        class="col"
        spread
        clearable
        v-model="activityButton"
        toggleColor="primary"
        :options="activityButtons1"
      ></q-btn-toggle>
      <q-btn-toggle
        v-else
        @update:model-value="clickActivityButton"
        class="col"
        spread
        clearable
        v-model="activityButton"
        toggleColor="primary"
        :options="activityButtons2"
      ></q-btn-toggle>
      <q-dialog v-model="confirmEraseSelectedDialog" persistent>
        <q-card>
          <q-card-section class="row items-center">
            <q-avatar icon="alert" color="negative" text-color="white" />
            <span class="q-ml-sm">This will erase {{ selectedCells.length }} selected SMO sessions</span>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="Cancel" color="primary" v-close-popup />
            <q-btn flat label="OK" color="primary" v-close-popup @click="doEraseSelected" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>

    <q-markup-table dense class="sticky-column-table">
      <thead>
        <tr>
          <th>
            <q-badge color="red" v-if="selectedCells.length" @click="clearSelection">
              {{ selectedCells.length }}
              <q-icon name="clear" color="white"></q-icon>
            </q-badge>
          </th>
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
            :isSelected="isSelected(date, i % 2 ? 'PM' : 'AM', smo.name)"
            :selectedActivity="activityButton || ''"
            @onSelectCell="selectCell"
          ></smo-cell>
        </tr>
      </transition-group>
    </q-markup-table>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, computed } from 'vue';
import { useStore } from '../stores/store';
import { useSMOStore } from 'src/stores/smoStore';
import { useMonthStore } from 'src/stores/monthStore';
import { useActivityStore } from 'src/stores/activityStore';

import smoCell from './smoCell.vue';
import { format, isSameDay } from 'date-fns';
import { SMOCellDefinition, Time } from 'src/stores/models';
import { useRosterStore } from 'src/stores/rosterStore';

export default defineComponent({
  // name: 'ComponentName'
  components: { smoCell },
  setup() {
    const store = useStore();
    const smoStore = useSMOStore();
    const monthStore = useMonthStore();
    const activityStore = useActivityStore();
    const rosterStore = useRosterStore();

    const activityPage = ref('p1');
    const activityButton = ref('');
    interface btndef {
      value: string,
      icon?: string,
      label?: string
    };
    const activityButtons1 = computed(() => {
      const activities = activityStore.activities.filter((activity) => activity.name != 'Call' && activity.type && !['Leave', 'NCT'].includes(activity.type)).map((activity) => ({
        label: activity.name.toUpperCase(),
        value: activity.name,
      })).sort((a, b) => a.label < b.label ? -1 : a.label == b.label ? 0 : 1);
      (activities as btndef[]).splice(0, 0, { value: 'erase', icon: 'backspace' });
      return activities;
    });
    const activityButtons2 = computed(() => {
      const activities = activityStore.activities.filter((activity) => activity.type && ['Leave', 'NCT'].includes(activity.type)).map((activity) => ({
        label: activity.name.toUpperCase(),
        value: activity.name,
      })).sort((a, b) => a.label < b.label ? -1 : a.label == b.label ? 0 : 1);
      (activities as btndef[]).splice(0, 0, { value: 'erase', icon: 'backspace' });
      return activities;
    });
    const clickActivityButton = (value: any) => {
      if (value && selectedCells.length) {
        if (value == 'erase') {
          confirmEraseSelectedDialog.value = true;
        } else {
          setSelectedCellsToActivity(value);
        }
      }
    };
    const confirmEraseSelectedDialog = ref(false);
    const doEraseSelected = () => {
      selectedCells.forEach((cell) => {
        rosterStore.filter({
          date: cell.date,
          time: cell.time,
          smo: cell.smoName,
        }).filter(entry => entry.activity != 'Call').forEach((entry) => void rosterStore.delRosterEntry(entry.id));
      });
    }
    const setSelectedCellsToActivity = (activityName: string) => {
      selectedCells.forEach((cell) => {
        const cellEntries = rosterStore.filter({
          date: cell.date,
          time: cell.time,
          smo: cell.smoName,
        }).filter(entry => entry.activity != 'Call');
        if (cellEntries.length) {
          // replace first entry in cell
          void rosterStore.setRosterEntry(cellEntries[0].id, {
            activity: activityButton.value,
          });
        } else {
          // create new entry
          const monthStore = useMonthStore();
          void rosterStore.addRosterEntry({
            smo: cell.smoName,
            date: cell.date,
            time: cell.time,
            activity: activityName,
            notes: '',
            version: monthStore.version,
          });
        }
      });
      clearSelection();
    }

    const showSMOFilterMenu = ref(false);

    const selectedCells = reactive(Array<SMOCellDefinition>());
    const isSelected = (date: Date, time: Time, smoName: string) => {
      return selectedCells.some((cell) => isSameDay(date, cell.date) && cell.time == time && cell.smoName == smoName)
    }
    const selectCell = (e: SMOCellDefinition) => {
      const index = selectedCells.findIndex((cell) => isSameDay(e.date, cell.date) && cell.time == e.time && cell.smoName == e.smoName);
      console.log('selectCell: ', e)
      if (index == -1)
        selectedCells.push(e);
      else selectedCells.splice(index)
    }
    const clearSelection = () => {
      selectedCells.splice(0, selectedCells.length);
    }



    return {
      store,
      smoStore,
      monthStore,

      activityPage,
      activityButton,
      activityButtons1,
      activityButtons2,
      clickActivityButton,

      confirmEraseSelectedDialog,
      doEraseSelected,

      format,
      showSMOFilterMenu,
      isSelected,
      selectCell,
      selectedCells,
      clearSelection,
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
