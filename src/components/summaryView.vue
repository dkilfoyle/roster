<template>
  <div class="wrapped">
    <q-markup-table dense class="sticky-summary-table">
      <thead>
        <tr>
          <th>SMO</th>
          <th colspan="4">On Call</th>
          <th colspan="3">Inpatient Duty</th>
          <th colspan="3">Consults</th>
          <th colspan="3">Procedures</th>
          <th colspan="3">Clinic</th>
          <th colspan="2">Leave</th>
        </tr>
        <tr>
          <th>
            <q-btn icon="filter_alt" size="sm"
              ><q-menu>
                <div class="row q-pa-md">
                  <div class="column">
                    <q-checkbox v-model="showAll" label="All" size="sm" />
                    <q-separator></q-separator>
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
          <th v-for="activity in activities" :key="activity">{{ activity }}</th>
        </tr>
      </thead>
      <transition-group name="smotable" tag="tbody">
        <tr v-for="smo in smoStore.filteredSMOs" :key="smo.name">
          <td>{{ smo.name }}</td>
          <td
            v-for="activity in activities"
            :key="activity"
            :style="{
              background: store.summaryOptions.showHeatmap
                ? getRankColor(smo.name, activity)
                : 'transparent',
            }"
          >
            {{ getN(smo.name, activity) }}
          </td>
        </tr>
      </transition-group>
    </q-markup-table>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
import { useStore } from '../stores/store';
import { useSMOStore } from 'src/stores/smoStore';
import { useRosterStore } from 'src/stores/rosterStore';

import { format, isFriday } from 'date-fns';
import { SMOActivityName } from 'src/stores/models';

export default defineComponent({
  // name: 'ComponentName'
  setup() {
    const store = useStore();
    const smoStore = useSMOStore();
    const rosterStore = useRosterStore();

    const showAll = ref(true);

    const activities = ref([
      'Call',
      'WeekendA',
      'WeekendB',
      'PH',
      'Neuro',
      'Stroke',
      'ACT',
      'NSH',
      'WTH',
      'MMH',
      'EMG',
      'EEG',
      'BTX',
      'DSR',
      'DSC',
      'OPC',
      'ANL',
      'CME',
    ] as Array<SMOActivityName>);

    onMounted(async () => {
      console.log('summaryView.onMounted - loading all from firestore');
      const num = await rosterStore.loadAllFromFirestore();
      console.log('summaryView.onMounted - loaded ', num);
      store.summaryLoaded = true;
    });

    const smoSummary = computed(() => {
      const smos = smoStore.smos.map((smo) => {
        const entries = rosterStore.allEntries.filter(
          (entry) =>
            entry.smo == smo.name &&
            entry.date > store.summaryStartDate &&
            entry.date < store.summaryEndDate
        );
        return {
          name: smo.name,
          Call: {
            n: entries.filter(
              (entry) =>
                entry.activity == 'Call' &&
                !isFriday(entry.date) &&
                !store.isHoliday(entry.date)
            ).length,
            p: 0,
          },
          WeekendA: {
            n: entries.filter(
              (entry) =>
                entry.activity == 'Call' &&
                isFriday(entry.date) &&
                !store.isHoliday(entry.date) &&
                entry.time == 'AM'
            ).length,
            p: 0,
          },
          WeekendB: {
            n: entries.filter(
              (entry) =>
                entry.activity == 'Call' &&
                isFriday(entry.date) &&
                !store.isHoliday(entry.date) &&
                entry.time == 'PM'
            ).length,
            p: 0,
          },
          PH: {
            n: entries.filter(
              (entry) => entry.activity == 'Call' && store.isHoliday(entry.date)
            ).length,
            p: 0,
          },
          Neuro: {
            n: entries.filter((entry) => entry.activity == 'Neuro').length,
            p: 0,
          },
          Stroke: {
            n: entries.filter((entry) => entry.activity == 'Stroke').length,
            p: 0,
          },
          ACT: {
            n: entries.filter((entry) => entry.activity == 'ACT').length,
            p: 0,
          },
          NSH: {
            n: entries.filter((entry) => entry.activity == 'NSH').length,
            p: 0,
          },
          WTH: {
            n: entries.filter((entry) => entry.activity == 'WTH').length,
            p: 0,
          },
          MMH: {
            n: entries.filter((entry) => entry.activity == 'MMH').length,
            p: 0,
          },
          EMG: {
            n: entries.filter((entry) => entry.activity == 'EMG').length,
            p: 0,
          },
          EEG: {
            n: entries.filter((entry) => entry.activity == 'EEG').length,
            p: 0,
          },
          BTX: {
            n: entries.filter((entry) => entry.activity == 'BTX').length,
            p: 0,
          },
          DSR: {
            n: entries.filter((entry) => entry.activity == 'DSR').length,
            p: 0,
          },
          DSC: {
            n: entries.filter((entry) => entry.activity == 'DSC').length,
            p: 0,
          },
          OPC: {
            n: entries.filter((entry) => entry.activity == 'OPC').length,
            p: 0,
          },
          ANL: {
            n: entries.filter((entry) => entry.activity == 'ANL').length,
            p: 0,
          },
          CME: {
            n: entries.filter((entry) => entry.activity == 'CME').length,
            p: 0,
          },
        };
      });
      smos.forEach((smo) => {
        activities.value.forEach((activityName) => {
          const activityRange = smos
            .map((smo2) => smo2[activityName].n)
            .filter((n) => n > 0);
          activityRange.sort((a, b) => a - b);
          smo[activityName].p =
            activityRange.indexOf(smo[activityName].n) / activityRange.length;
        });
      });
      return smos;
    });

    const getN = (smoName: string, activityName: string) => {
      const smo = smoSummary.value.find((smo) => smo.name == smoName);
      return smo ? smo[activityName as SMOActivityName].n : '';
    };

    const getRankColor = (smoName: string, activityName: string) => {
      const smo = smoSummary.value.find((smo) => smo.name == smoName);
      if (!smo) return 'transparent';
      if (smo[activityName as SMOActivityName].p < 0) return 'transparent';
      return heatMapColor(smo[activityName as SMOActivityName].p);
    };

    watch(
      () => showAll.value,
      (newVal) => {
        smoStore.viewOptions.showEMG = newVal;
        smoStore.viewOptions.showCall = newVal;
        smoStore.viewOptions.showWard = newVal;
        smoStore.viewOptions.showEEG = newVal;
        smoStore.viewOptions.showWDHB = newVal;
        smoStore.viewOptions.showCDHB = newVal;
      }
    );

    const heatMapColor = (value: number) => {
      var h = (1.0 - value) * 240;
      return `hsla(${h}, 100%, 50%, 0.5)`;
    };

    return {
      store,
      smoStore,
      showAll,
      format,
      getN,
      getRankColor,
      activities,
      smoSummary,
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
