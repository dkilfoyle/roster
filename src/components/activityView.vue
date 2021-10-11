<template>
  <div class="wrapped">
    <q-markup-table dense class="sticky-column-table">
      <thead>
        <tr>
          <th></th>
          <th></th>
          <th v-for="date in monthStore.dates" :key="date.toDateString()">{{ format(date, 'dd') }}</th>
          <th v-if="activityStore.viewOptions.showSummary">Sum</th>
        </tr>
        <tr class="pm-row">
          <th>
            <q-btn icon="filter_alt" size="sm">
              <q-menu>
                <div class="row q-pa-md">
                  <div class="column">
                    <q-checkbox
                      v-model="activityStore.viewOptions.showLeave"
                      label="Leave"
                      size="sm"
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
        <template v-for="(activity, i) in activityStore.filteredActivities" :key="activity">
          <tr :class="`row-${i % 2}`">
            <td>{{ activity.name }}</td>
            <td style="border-right: 2px solid black">AM</td>
            <activity-cell
              v-for="date in monthStore.dates"
              :key="date.toDateString()"
              :dateStr="date.toDateString()"
              time="AM"
              :activityName="activity.name"
            ></activity-cell>
            <td
              v-if="activityStore.viewOptions.showSummary"
              :class="{ invalid5: sumError(activity.name) }"
            >{{ store.getActivitySum(activity.name) }}</td>
          </tr>
          <tr :class="`row-${i % 2} pm-row`">
            <td></td>
            <td style="border-right: 2px solid black">PM</td>
            <activity-cell
              v-for="date in monthStore.dates"
              :key="date.toDateString()"
              :dateStr="date.toDateString()"
              time="PM"
              :activityName="activity.name"
            ></activity-cell>
            <td v-if="activityStore.viewOptions.showSummary"></td>
          </tr>
        </template>
      </tbody>
    </q-markup-table>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useStore } from '../stores/store';
import { useActivityStore } from '../stores/activityStore';
import { useMonthStore } from '../stores/monthStore';

import activityCell from './activityCell.vue';
import { format } from 'date-fns';

export default defineComponent({
  // name: 'ComponentName'
  components: { activityCell },
  setup() {
    const store = useStore();
    const activityStore = useActivityStore();
    const monthStore = useMonthStore();

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
    };

    return {
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
