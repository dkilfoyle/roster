<template>
  <td :class="tdClasses">
    <q-menu context-menu>
      <q-list dense>
        <q-item v-for="smo in allowedSMOs" :key="smo" clickable v-close-popup>
          <q-item-section>{{ smo.name }}</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
    <q-tooltip v-if="tdHasTooltip">
      <div class="tdtooltip">
        {{ assignedSMOs.map((smo) => smo.smo).join(', ') }}
        <p v-for="(reason, i) in isValidActivity.reasons" :key="i">
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
    activityName: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const store = useStore();

    const { dateStr, time, activityName } = toRefs(props);
    const date = ref(new Date(dateStr.value));

    const assignedSMOs = computed(() =>
      store.getAssignedSMOs(date.value, time.value, activityName.value)
    );
    const isValidActivity = computed(() =>
      store.isValidActivity(date.value, time.value, activityName.value)
    );
    const isAllowedActivity = computed(() =>
      store.isAllowedActivity(date.value, time.value, activityName.value)
    );
    const allowedSMOs = computed(() =>
      store.getAllowedSMOs(date.value, activityName.value)
    );

    const tdContent = computed(() => {
      const smos = assignedSMOs.value;
      if (smos.length == 0) return isAllowedActivity.value ? '?' : '-';
      else if (smos.length == 1) return smos[0].smo;
      else return smos.length;
    });

    const tdHasTooltip = computed(() => {
      return (
        isValidActivity.value.reasons.length || assignedSMOs.value.length > 1
      );
    });

    const tdClasses = computed(() => {
      return [
        {
          weekBoundary: store.showWeekend
            ? isSunday(date.value)
            : isFriday(date.value),
        },
        { invalid: !isValidActivity.value.answer },
        // `week-${Math.floor(differenceInDays(date, store.startDate) / 7) % 2}`,
      ];
    });

    return {
      isValidActivity,
      isAllowedActivity,
      assignedSMOs,
      allowedSMOs,
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
</style>
