<template>
  <div class="wrapped">
    <q-markup-table dense class="sticky-column-table">
      <thead>
        <tr>
          <th>
            <q-btn icon="filter_alt" size="sm"
              ><q-menu>
                <div class="row q-pa-md">
                  <div class="column">
                    <q-checkbox
                      v-model="store.activityViewOptions.showLeave"
                      label="Leave"
                      size="sm"
                    />
                    <q-checkbox
                      v-model="store.activityViewOptions.showCall"
                      label="Call"
                      size="sm"
                    />
                    <q-checkbox
                      v-model="store.activityViewOptions.showInpatient"
                      label="Inpatient"
                      size="sm"
                    />
                    <q-checkbox
                      v-model="store.activityViewOptions.showClinic"
                      label="Clinic"
                      size="sm"
                    />
                    <q-checkbox
                      v-model="store.activityViewOptions.showConsults"
                      label="Consults"
                      size="sm"
                    />
                    <q-checkbox
                      v-model="store.activityViewOptions.showProcedure"
                      label="Procedures"
                      size="sm"
                    />
                    <q-checkbox
                      v-model="store.activityViewOptions.showOther"
                      label="Other"
                      size="sm"
                    />
                  </div>
                </div> </q-menu
            ></q-btn>
          </th>
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
        <template
          v-for="(activity, i) in store.filteredActivities"
          :key="activity"
        >
          <tr :class="`row-${i % 2}`">
            <td>{{ activity.name }}</td>
            <td style="border-right: 2px solid black">AM</td>
            <activity-cell
              v-for="date in store.dates"
              :key="date"
              :dateStr="date.toDateString()"
              time="AM"
              :activityName="activity.name"
            ></activity-cell>
          </tr>
          <tr :class="`row-${i % 2} pm-row`">
            <td></td>
            <td style="border-right: 2px solid black">PM</td>
            <activity-cell
              v-for="date in store.dates"
              :key="date"
              :dateStr="date.toDateString()"
              time="PM"
              :activityName="activity.name"
            ></activity-cell>
          </tr>
        </template>
      </tbody>
    </q-markup-table>
  </div>
</template>

<script lang="ts">
import { defineComponent, onBeforeUpdate, onUpdated } from 'vue';
import { useStore } from '../stores/store';

import activityCell from './activityCell.vue';
import { format } from 'date-fns';

export default defineComponent({
  // name: 'ComponentName'
  components: { activityCell },
  setup() {
    const store = useStore();

    onBeforeUpdate(() => {
      console.log('Activity view before update');
    });

    onUpdated(() => {
      console.log('updated');
    });

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
