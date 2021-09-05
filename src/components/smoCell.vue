<template>
  <td :class="tdClasses">
    <q-menu context-menu>
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
    </q-menu>
    <q-tooltip v-if="tdHasTooltip">
      <div class="tdtooltip">
        {{ assignedActivities.map((smo) => smo.smo).join(', ') }}
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
  },
  setup(props) {
    const store = useStore();

    const { dateStr, time, smoName } = toRefs(props);
    const date = ref(new Date(dateStr.value));

    const assignedActivities = computed(() =>
      store.getAssignedActivities(date.value, time.value, smoName.value)
    );

    const isValidSMO = computed(() =>
      store.isValidSMO(date.value, time.value, smoName.value)
    );
    const allowedActivities = computed(() =>
      store.getAllowedActivities(smoName.value)
    );

    const tdContent = computed(() => {
      const activities = assignedActivities.value;
      if (activities.length == 0) return '?';
      else if (activities.length == 1) return activities[0].activity;
      else return activities.length;
    });

    const tdHasTooltip = computed(() => {
      return (
        isValidSMO.value.reasons.length || assignedActivities.value.length > 1
      );
    });

    const tdClasses = computed(() => {
      return [
        {
          weekBoundary: store.showWeekend
            ? isSunday(date.value)
            : isFriday(date.value),
        },
        { invalid: !isValidSMO.value.answer },
        {
          nct: ['WDHB', 'NCT', 'UNI', 'CMDHB', 'A+T'].includes(
            assignedActivities.value[0].activity
          ),
        },
        // `week-${Math.floor(differenceInDays(date, store.startDate) / 7) % 2}`,
      ];
    });

    return {
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

<style scoped>
.tdtooltip p {
  margin-bottom: 0px;
}
td.nct {
  color: lightgrey;
}
</style>
