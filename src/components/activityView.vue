<template>
  <div class="wrapped">
    <div class="row q-gutter-md q-mb-md">
      <q-btn-toggle
        class="col-auto"
        v-model="smoPage"
        @update:model-value="smoButton = ''"
        :options="[{ label: 'P1', value: 'p1' }, { label: 'P2', value: 'p2' }]"
      ></q-btn-toggle>
      <q-btn-toggle
        v-if="smoPage == 'p1'"
        @update:model-value="clickSMOButton"
        class="col"
        spread
        clearable
        v-model="smoButton"
        toggleColor="primary"
        :options="smoButtons1"
      ></q-btn-toggle>
      <q-btn-toggle
        v-else
        @update:model-value="clickSMOButton"
        class="col"
        spread
        clearable
        v-model="smoButton"
        toggleColor="primary"
        :options="smoButtons2"
      ></q-btn-toggle>
      <q-dialog v-model="confirmEraseSelectedDialog" persistent>
        <q-card>
          <q-card-section class="row items-center">
            <q-avatar icon="priority_high" color="negative" text-color="white" />
            <span
              class="q-ml-sm"
            >This will erase {{ selectedCells.length }} selected activity sessions</span>
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
          <th v-if="activityStore.viewOptions.showSummary">Sum</th>
        </tr>
        <tr class="pm-row">
          <th>
            <q-btn icon="filter_alt" size="sm">
              <q-menu anchor="top right">
                <div class="row q-pa-md">
                  <div class="column">
                    <q-btn-group spread>
                      <q-btn @click="activityStore.showAll()" icon="playlist_add" size="sm"></q-btn>
                      <q-btn @click="activityStore.showNone()" icon="clear_all" size="sm"></q-btn>
                    </q-btn-group>
                    <q-checkbox
                      v-model="activityStore.viewOptions.showLeave"
                      label="Leave"
                      size="sm"
                      class="q-pt-md"
                    />
                    <q-checkbox
                      v-model="activityStore.viewOptions.showCall"
                      label="Call"
                      size="sm"
                    />
                    <q-checkbox
                      v-model="activityStore.viewOptions.showInpatient"
                      label="Inpatient"
                      size="sm"
                    />
                    <q-checkbox
                      v-model="activityStore.viewOptions.showClinic"
                      label="Clinic"
                      size="sm"
                    />
                    <q-checkbox
                      v-model="activityStore.viewOptions.showConsults"
                      label="Consults"
                      size="sm"
                    />
                    <q-checkbox
                      v-model="activityStore.viewOptions.showProcedure"
                      label="Procedures"
                      size="sm"
                    />
                    <q-checkbox v-model="activityStore.viewOptions.showNCT" label="NCT" size="sm" />
                    <q-checkbox
                      v-model="activityStore.viewOptions.showOther"
                      label="Other"
                      size="sm"
                    />
                  </div>
                </div>
              </q-menu>
            </q-btn>
          </th>
          <th></th>
          <th
            v-for="date in monthStore.dates"
            :key="date.toDateString()"
          >{{ format(date, 'ccccc') }}</th>
          <th v-if="activityStore.viewOptions.showSummary"></th>
        </tr>
      </thead>
      <tbody>
        <template v-for="(activity) in activityStore.filteredActivities" :key="activity">
          <tr v-for="time in ['AM', 'PM']" :key="time" :class="`row-${time}`">
            <td>{{ time == 'AM' ? activity.name : '' }}</td>
            <td style="border-right: 2px solid black">AM</td>
            <activity-cell
              v-for="date in monthStore.dates"
              :key="date.toDateString()"
              :dateStr="date.toDateString()"
              :time="time"
              :activityName="activity.name"
              :selectedSMO="smoButton || ''"
              :isSelected="isSelected(date, time, activity.name)"
              @selectCell="onSelectCell"
            ></activity-cell>
            <template v-if="activityStore.viewOptions.showSummary">
              <td
                v-if="time == 'AM'"
                :class="{ invalid5: sumError(activity.name) }"
              >{{ store.getActivitySum(activity.name) }}</td>
              <td v-else></td>
            </template>
          </tr>
        </template>
      </tbody>
    </q-markup-table>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, reactive, onUnmounted } from 'vue';
import { useStore } from '../stores/store';
import { useActivityStore } from '../stores/activityStore';
import { useMonthStore } from '../stores/monthStore';
import { useSMOStore } from 'src/stores/smoStore';
import { useRosterStore } from 'src/stores/rosterStore';

import activityCell from './activityCell.vue';
import { format, isSameDay } from 'date-fns';
import { ActivityCellDefinition, SMODefinition, Time } from 'src/stores/models';
import { useQuasar } from 'quasar';
import { gsap } from 'gsap'

export default defineComponent({
  // name: 'ComponentName'
  components: { activityCell },
  setup() {
    const store = useStore();
    const activityStore = useActivityStore();
    const monthStore = useMonthStore();
    const smoStore = useSMOStore();
    const rosterStore = useRosterStore();
    const $q = useQuasar();

    // Selected Cells ===================================

    const selectedCells = reactive(Array<ActivityCellDefinition>());

    const isSelected = (date: Date, time: Time, activityName: string) => {
      return selectedCells.some((cell) => isSameDay(date, cell.date) && cell.time == time && cell.activityName == activityName)
    }

    const onSelectCell = (e: ActivityCellDefinition) => {
      const index = selectedCells.findIndex((cell) => {
        const sameDay = isSameDay(e.date, cell.date);
        const sameTime = e.time == cell.time;
        const sameActivity = cell.activityName == e.activityName;
        return sameDay && sameTime && sameActivity;
      });

      if (index == -1)
        selectedCells.push(e);
      else selectedCells.splice(index)
    }

    const clearSelection = () => {
      selectedCells.splice(0, selectedCells.length);
    }

    // SMO Buttons =======================================

    const smoPage = ref('p1');
    const smoButton = ref('');
    interface btndef {
      value: string,
      icon?: string,
      label?: string
    };

    const getPage1SMOs = () => smoStore.activeSMOs.filter((smo) => smo.group == 1);
    const getPage2SMOs = () => smoStore.activeSMOs.filter((smo) => smo.group != 1);

    const getSMOButtons = (smos: Array<SMODefinition>) => {

      const getButtonColor = (smo: string) => {
        let allowed = selectedCells[0].availableSMOs;
        let capable = selectedCells[0].capableSMOs;
        selectedCells.forEach((cell) => {
          allowed = allowed.filter((x) => cell.availableSMOs.includes(x))
          capable = capable.filter((x) => cell.capableSMOs.includes(x))
        });

        if (allowed.includes(smo)) return 'black';
        if (capable.includes(smo)) return 'red';
        return 'grey-3'
      }

      const buttons = smos.map((smo) => ({
        label: smo.name.toUpperCase(),
        value: smo.name,
        textColor: selectedCells.length ? getButtonColor(smo.name) : 'black'
      })).sort((a, b) => a.label < b.label ? -1 : a.label == b.label ? 0 : 1);
      (buttons as btndef[]).splice(0, 0, { value: 'erase', icon: 'backspace' });
      return buttons;
    }

    const smoButtons1 = computed(() => getSMOButtons(getPage1SMOs()));
    const smoButtons2 = computed(() => getSMOButtons(getPage2SMOs()));

    const clickSMOButton = (value: string) => {
      // console.log('clicked ', value, selectedCells.length, value && selectedCells.length)
      if (value && selectedCells.length) {
        if (value == 'erase') {
          if (selectedCells.length > 1) confirmEraseSelectedDialog.value = true; else doEraseSelected();
        } else {
          setSelectedCellsToSMO(value);
        }
      }
    };

    const setSelectedCellsToSMO = (smoName: string) => {
      // add this SMO to each selected cell
      // is SMO already assigned on the selected sessions
      const alreadyAssignedNotCall = selectedCells.filter((cell) => cell.activityName != 'Call' && rosterStore.exists({ date: cell.date, time: cell.time, smo: smoName }));
      const unAssigned = selectedCells.filter((cell) => cell.activityName == 'Call' || !rosterStore.exists({ date: cell.date, time: cell.time, smo: smoName }));
      const alreadyAssignedEntries = alreadyAssignedNotCall.map((cell) => rosterStore.find({ date: cell.date, time: cell.time, smo: smoName }));

      if (alreadyAssignedNotCall.length > 0) {
        $q.dialog({
          title: 'Warning: SMO already assigned',
          message: `This will replace already assigned activities: ${alreadyAssignedEntries.map((entry) => entry?.activity || '').join(',')}`,
          ok: { label: 'Proceed' },
          cancel: { label: 'Cancel' }
        }).onCancel(() => {
          clearSelection();
          smoButton.value = '';
          return;
        }).onOk(() => {
          alreadyAssignedNotCall.forEach((cell) => {
            if (cell) {
              const entry = rosterStore.find({ date: cell.date, time: cell.time, smo: smoName });
              if (entry)
                void rosterStore.setRosterEntry(entry.id, { activity: cell.activityName })
            }
          })
        })
      }

      unAssigned.forEach((cell) => {
        void rosterStore.addRosterEntry({
          date: cell.date,
          time: cell.time,
          smo: smoName,
          activity: cell.activityName,
          notes: '',
          version: monthStore.version,
        });
        gsap.from(`#${cell.id}`, { duration: 1.0, background: 'red' });
      });



      clearSelection();
      smoButton.value = '';
    }

    const confirmEraseSelectedDialog = ref(false);
    const doEraseSelected = () => {
      selectedCells.forEach((cell) => {
        rosterStore.filter({
          date: cell.date,
          time: cell.time,
          activity: cell.activityName,
        }).forEach((entry) => void rosterStore.delRosterEntry(entry.id));
        gsap.from(`#${cell.id}`, { duration: 1.0, background: 'red' });
      });
      smoButton.value = '';
      clearSelection();
    }



    const sumError = (activityName: string) => {
      if (!activityStore.viewOptions.showErrors) return false;
      const activity = activityStore.getActivity(activityName);
      if (
        typeof activity != 'undefined' &&
        typeof activity.perWeek != 'undefined'
      )
        return (
          store.getActivitySum(activityName) <
          activity.perWeek * monthStore.numWeeks
        );
      if (
        typeof activity != 'undefined' &&
        typeof activity.perMonth != 'undefined'
      )
        return (
          store.getActivitySum(activityName) <
          activity.perMonth
        );
    };

    const capsSMOs = smoStore.activeSMOs.reduce((res, cur) => { res[cur.name.toUpperCase()] = cur.name; return res; }, {} as Record<string, string>);
    const keyword = ref('');
    const onKeydown = (e: KeyboardEvent) => {
      if (selectedCells.length == 0) return;
      if (e.key == 'Escape' || e.key == 'Esc') keyword.value = ''; else {
        if (e.keyCode >= 65 && e.keyCode <= 90) keyword.value = keyword.value + e.key.toUpperCase();
      }
      if (e.key == 'Space' || e.key == 'Enter') {
        // match to current length only
        if (Object.keys(capsSMOs).includes(keyword.value)) {
          void setSelectedCellsToSMO(capsSMOs[keyword.value])
          keyword.value = '';
        }
      } else {
        // match full length
        if (Object.keys(capsSMOs).filter(x => x.startsWith(keyword.value)).length == 1 && Object.keys(capsSMOs).includes(keyword.value
        )) {
          void setSelectedCellsToSMO(capsSMOs[keyword.value])
          keyword.value = '';
        }
      }
    };
    window.addEventListener('keydown', onKeydown);
    onUnmounted(() => {
      window.removeEventListener('keydown', onKeydown)
    })

    return {

      smoPage,
      smoButton,
      smoButtons1,
      smoButtons2,
      clickSMOButton,

      isSelected,
      onSelectCell,

      confirmEraseSelectedDialog,
      doEraseSelected,
      selectedCells,
      clearSelection,

      store,
      activityStore,
      monthStore,
      sumError,
      format,
    };
  },
});
</script>

<style lang="scss" scoped>
@import "../css/calendar.scss";
td.invalid5 {
  background: $deep-orange-3;
}
</style>
