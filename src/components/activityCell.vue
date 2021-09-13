<template>
  <td :class="tdClasses">
    <q-menu context-menu style="min-height: 300px">
      <div class="text-center q-pa-md bg-info q-mb-sm">
        {{ activityName }} on {{ dateStr }}
      </div>

      <q-tabs v-model="smoTab" class="q-mt-md">
        <q-tab name="assigned" label="Cur"
          ><q-badge
            :color="assignedSMOs.length > 0 ? 'green' : 'red'"
            floating
            >{{ assignedSMOs.length }}</q-badge
          ></q-tab
        >
        <q-tab name="available" label="Avail"
          ><q-badge
            :color="availableSMOs.length > 0 ? 'green' : 'red'"
            floating
            >{{ availableSMOs.length }}</q-badge
          ></q-tab
        >
        <q-tab name="unavailable" label="Unavail"
          ><q-badge color="red" floating>{{
            unavailableSMOs.length
          }}</q-badge></q-tab
        >
        <q-tab name="others" label="Others"
          ><q-badge color="amber" floating>{{
            incapableSMOs.length
          }}</q-badge></q-tab
        >
      </q-tabs>
      <q-separator></q-separator>
      <q-tab-panels v-model="smoTab" animated>
        <q-tab-panel name="assigned">
          <two-col-list
            :items="assignedSMOs"
            @clickItem="(i) => toggleSMO(assignedSMOs[i])"
          ></two-col-list>
        </q-tab-panel>
        <q-tab-panel name="available">
          <two-col-list
            :items="availableSMOs"
            @clickItem="(i) => toggleSMO(availableSMOs[i])"
          ></two-col-list>
        </q-tab-panel>
        <q-tab-panel name="unavailable">
          <two-col-list
            :items="unavailableSMOs"
            @clickItem="(i) => toggleSMO(unavailableSMOs[i])"
          ></two-col-list>
        </q-tab-panel>
        <q-tab-panel name="others">
          <two-col-list
            :items="incapableSMOs"
            @clickItem="(i) => toggleSMO(incapableSMOs[i])"
          ></two-col-list>
        </q-tab-panel>
      </q-tab-panels>
    </q-menu>
    <q-tooltip v-if="tdHasTooltip">
      <div class="tdtooltip">
        <div class="col">
          {{ assignedSMOs.map((smo) => smo).join(', ') }}
        </div>
        <div
          class="col"
          v-for="(reason, i) in isValidActivity.reasons"
          :key="i"
        >
          {{ reason }}
        </div>
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
    activityName: {
      type: String,
      required: true,
    },
  },
  components: { twoColList },
  setup(props) {
    const store = useStore();

    const { dateStr, time, activityName } = toRefs(props);
    const date = ref(new Date(dateStr.value));
    const smoTab = ref('available');

    const assignedSMOs = computed(() =>
      store
        .getAssignedSMOs(date.value, time.value, activityName.value)
        .map((entry) => entry.smo)
    );
    const isValidActivity = computed(() =>
      store.isValidActivity(date.value, time.value, activityName.value)
    );
    const isAllowedActivity = computed(() =>
      store.isAllowedActivity(date.value, time.value, activityName.value)
    );
    const isHoliday = computed(() => store.isHoliday(date.value));

    const availableSMOs = computed(() =>
      store.smos
        .filter((smo) =>
          store.isAvailableSMO(
            date.value,
            time.value,
            smo.name,
            activityName.value
          )
        )
        .map((smo) => smo.name)
        .filter((smo) => !assignedSMOs.value.includes(smo))
    );

    const unavailableSMOs = computed(() =>
      store.smos
        .filter((smo) =>
          store.isUnavailableSMO(
            date.value,
            time.value,
            smo.name,
            activityName.value
          )
        )
        .map((smo) => smo.name)
    );

    const incapableSMOs = computed(() =>
      store.smos
        .filter(
          (smo) => !store.isAllowedActivitySMO(activityName.value, smo.name)
        )
        .map((smo) => smo.name)
    );

    const toggleSMO = (smoName: string) => {
      if (assignedSMOs.value.some((smo) => smo == smoName)) {
        store.delRosterEntry(
          date.value,
          time.value,
          smoName,
          activityName.value
        );
      } else
        store.setRosterEntryActivity(
          date.value,
          time.value,
          smoName,
          activityName.value
        );
    };

    const tdContent = computed(() => {
      if (isHoliday.value) return '';
      const smos = assignedSMOs.value;
      if (smos.length == 0) return isAllowedActivity.value ? '?' : '-';
      else if (smos.length == 1) return smos[0];
      else return smos.length;
    });

    const tdHasTooltip = computed(() => {
      return (
        isValidActivity.value.reasons.length || assignedSMOs.value.length > 1
      );
    });

    const tdClasses = computed(() => {
      const invalidReason = (myreason: string) =>
        !isHoliday.value &&
        !isValidActivity.value.answer &&
        isValidActivity.value.reasons.some((reason) =>
          reason.includes(myreason)
        );

      return [
        'activityCell',
        {
          weekBoundary: store.showWeekend
            ? isSunday(date.value)
            : isFriday(date.value),
          holiday: isHoliday.value,
          invalid1: invalidReason('PerSession'),
          invalid2: invalidReason('PerDay'),
          invalid3: invalidReason('Did not expect'),
        },
      ];
    });

    return {
      smoTab,
      isValidActivity,
      isAllowedActivity,
      assignedSMOs,
      availableSMOs,
      unavailableSMOs,
      incapableSMOs,
      tdHasTooltip,
      tdContent,
      tdClasses,
      toggleSMO,
    };
  },
});
</script>

<style lang="scss" scoped>
td.invalid1 {
  background: $deep-orange-3;
}
td.invalid2 {
  background: $orange-3;
}
td.invalid3 {
  background: $yellow-3;
}
</style>
