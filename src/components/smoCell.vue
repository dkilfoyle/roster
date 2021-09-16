<template>
  <td :class="tdClasses">
    <q-menu context-menu>
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h8">Notes for {{ smoName }} on {{ dateStr }}</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input
            dense
            v-model="mycomment"
            autofocus
            @keyup.enter="prompt = false"
          />
        </q-card-section>

        <q-card-actions align="right" class="text-primary">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn flat label="Save Note" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-menu>
    <q-menu style="min-height: 300px">
      <div class="text-center q-pa-md bg-info q-mb-sm">
        {{ smoName }} on {{ dateStr }}
      </div>

      <q-tabs v-model="cellTab" class="q-mt-md">
        <q-tab name="assigned" label="Cur"
          ><q-badge
            :color="assignedActivities.length > 0 ? 'green' : 'red'"
            floating
            >{{ assignedActivities.length }}</q-badge
          ></q-tab
        >
        <q-tab name="available" label="Avail"
          ><q-badge
            :color="availableActivities.length > 0 ? 'green' : 'red'"
            floating
            >{{ availableActivities.length }}</q-badge
          ></q-tab
        >
        <q-tab name="unavailable" label="Unavail"
          ><q-badge color="red" floating>{{
            unavailableActivities.length
          }}</q-badge></q-tab
        >
        <q-tab name="others" label="Others"
          ><q-badge color="amber" floating>{{
            incapableActivities.length
          }}</q-badge></q-tab
        >
      </q-tabs>
      <q-separator></q-separator>
      <q-tab-panels v-model="cellTab" animated>
        <q-tab-panel name="assigned">
          <two-col-list
            :items="assignedActivities"
            @clickItem="(i) => toggleActivity(assignedActivities[i])"
          ></two-col-list>
        </q-tab-panel>
        <q-tab-panel name="available">
          <two-col-list
            :items="availableActivities"
            @clickItem="(i) => toggleActivity(availableActivities[i])"
          ></two-col-list>
        </q-tab-panel>
        <q-tab-panel name="unavailable">
          <two-col-list
            :items="unavailableActivities"
            @clickItem="(i) => toggleActivity(unavailableActivities[i])"
          ></two-col-list>
        </q-tab-panel>
        <q-tab-panel name="others">
          <two-col-list
            :items="incapableActivities"
            @clickItem="(i) => toggleActivity(incapableActivities[i])"
          ></two-col-list>
        </q-tab-panel>
      </q-tab-panels>
    </q-menu>
    <!-- <q-menu context-menu>
      <q-list dense>
        <q-item
          v-for="(activityName, i) in allowedActivities"
          :key="i"
          clickable
          v-close-popup
        >
          <q-item-section>{{ activityName }}</q-item-section>
        </q-item>
      </q-list>
    </q-menu> -->
    <q-tooltip v-if="tdHasTooltip">
      <div class="tdtooltip">
        {{ assignedActivities.map((smo) => smo).join(', ') }}
        <p v-for="(reason, i) in isValidSMO.reasons" :key="i">
          {{ reason }}
        </p>
      </div>
    </q-tooltip>
    {{ tdContent }}
  </td>
</template>

<script lang="ts">
import { defineComponent, toRefs, computed, PropType, ref } from 'vue';
import twoColList from './twoColList.vue';
import { useStore } from '../stores/store';
import { isSunday, isFriday } from 'date-fns';
import { Time } from '../stores/store';

export default defineComponent({
  // name: 'ComponentName'
  // props: ['date', 'time', 'activityName'],
  props: {
    dateStr: {
      type: String,
      required: true,
    },
    time: {
      type: String as PropType<Time>,
      required: true,
    },
    smoName: {
      type: String,
      required: true,
    },
    comment: {
      type: String,
      default: '',
    },
  },
  components: { twoColList },
  setup(props) {
    const { dateStr, time, smoName, comment } = toRefs(props);
    const date = ref(new Date(dateStr.value));
    const store = useStore();

    const mycomment = ref(comment.value);

    const cellTab = ref('available');
    const toggleActivity = (activityName: string) => {
      if (
        assignedActivities.value.some((activity) => activity == activityName)
      ) {
        store.delRosterEntry(
          date.value,
          time.value,
          smoName.value,
          activityName
        );
      } else
        store.setRosterEntrySMO(
          date.value,
          time.value,
          smoName.value,
          activityName
        );
    };

    const isHoliday = computed(() => store.isHoliday(date.value));

    const allowedActivities = computed(() =>
      store.getAllowedActivities(smoName.value)
    );

    const assignedEntries = computed(() =>
      store.getAssignedActivities(date.value, time.value, smoName.value)
    );

    const assignedActivities = computed(() =>
      assignedEntries.value.map((entry) => entry.activity)
    );

    const availableActivities = computed(() =>
      allowedActivities.value.filter(
        (activityName) => !assignedActivities.value.includes(activityName)
      )
    );

    const unavailableActivities = computed(() => []);

    const incapableActivities = computed(() =>
      store.activityNames.filter(
        (activityName) => !allowedActivities.value.includes(activityName)
      )
    );

    const isValidSMO = computed(() =>
      store.isValidSMO(date.value, time.value, smoName.value)
    );

    const tdContent = computed(() => {
      if (isHoliday.value) return '';
      const activities = assignedActivities.value;
      if (activities.length == 0) {
        if (store.isAllowedTimeSMO(date.value, time.value, smoName.value))
          return '?';
        else return '';
      } else if (activities.length == 1) return activities[0];
      else return activities.length;
    });

    const tdHasTooltip = computed(() => {
      return (
        isValidSMO.value.reasons.length || assignedActivities.value.length > 1
      );
    });

    const tdClasses = computed(() => {
      const classes: Array<unknown> = [
        {
          weekBoundary: store.showWeekend
            ? isSunday(date.value)
            : isFriday(date.value),
          holiday: isHoliday.value,
          nct:
            assignedActivities.value.length &&
            ['WDHB', 'NCT', 'UNI', 'CDHB', 'A+T'].includes(
              assignedActivities.value[0]
            ),
        },
      ];

      if (!store.smoViewOptions.showErrors || isHoliday.value) return classes;

      const invalidSMO = (myreason: string) =>
        !isValidSMO.value.answer &&
        isValidSMO.value.reasons.some((reason) => reason.includes(myreason));
      return classes.concat([
        { invalid: !isValidSMO.value.answer },
        { invalid1: invalidSMO('is already assigned') },
        { invalid1: invalidSMO('awaiting assignment') },
        { invalid3: invalidSMO('is not contracted') },
        { invalid4: invalidSMO('is not an allowed activity') },

        // `week-${Math.floor(differenceInDays(date, store.startDate) / 7) % 2}`,
      ]);
    });

    return {
      mycomment,
      cellTab,
      toggleActivity,
      assignedEntries,
      availableActivities,
      unavailableActivities,
      incapableActivities,
      isValidSMO,
      assignedActivities,
      allowedActivities,
      tdHasTooltip,
      tdContent,
      tdClasses,
    };
  },
});
</script>

<style lang="scss" scoped>
.tdtooltip p {
  margin-bottom: 0px;
}
td.nct {
  color: lightgrey;
}
td.invalid1 {
  background: $red-2 !important;
}
td.invalid2 {
  background: $pink-2 !important;
}
td.invalid3 {
  background: $purple-2 !important;
}
td.invalid4 {
  background: $deep-purple-2 !important;
}
</style>
