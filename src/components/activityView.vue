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
        <template v-for="(activity, i) in store.activities" :key="activity">
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
import { defineComponent } from 'vue';
import { useStore } from '../stores/store';

import activityCell from './activityCell.vue';
import { format } from 'date-fns';

export default defineComponent({
  // name: 'ComponentName'
  components: { activityCell },
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
.wrapper {
  overflow: auto;
}

.row-0 td {
  background: rgb(238, 238, 238);
}

.pm-row td {
  border-bottom: 2px solid black;
}

td.weekBoundary {
  border-right: 2px solid black;
}

td.invalid {
  background: rgb(211, 0, 0, 0.3);
}

td.week-0 {
  background: lightgreen;
}

td.week-1 {
  background: white;
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

.sticky-column-table {
  height: calc(100vh - 50px - 48px);

  thead {
    tr:first-child,
    tr:nth-child(2) {
      th {
        position: sticky;
        /* higher than z-index for td below */
        z-index: 2;
        /* bg color is important; just specify one */
        background: yellow;
      }
    }
    tr:first-child th {
      top: 0;
      height: 30px;
      background: green;
    }
    tr:nth-child(2) th {
      top: 30px;
      background: red;
    }

    tr:first-child,
    tr:nth-child(2) {
      th:first-child,
      th:nth-child(2) {
        z-index: 5;
      }
    }
  }

  td:first-child,
  td:nth-child(2) {
    z-index: 2;
    background: orange;
    position: sticky;
  }

  td:first-child,
  th:first-child {
    left: 0;
    width: 62px;
  }

  td:nth-child(2),
  th:nth-child(2) {
    left: 62px;
  }
}
</style>
