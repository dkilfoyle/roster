<template>
  <td :class="tdClasses">
    <q-menu style="min-height: 300px" v-model="smoPopup">
      <div class="text-center q-pa-md bg-info q-mb-sm">{{ activityName }} on {{ dateStr }}</div>

      <q-tabs v-model="cellTab" class="q-mt-md">
        <q-tab name="assigned" label="Cur">
          <q-badge
            :color="assignedSMOs.length > 0 ? 'green' : 'red'"
            floating
          >{{ assignedSMOs.length }}</q-badge>
        </q-tab>
        <q-tab name="available" label="Avail">
          <q-badge
            :color="availableSMOs.length > 0 ? 'green' : 'red'"
            floating
          >{{ availableSMOs.length }}</q-badge>
        </q-tab>
        <q-tab name="unavailable" label="Unavail">
          <q-badge color="red" floating>
            {{
              unavailableSMOs.length
            }}
          </q-badge>
        </q-tab>
        <q-tab name="others" label="Others">
          <q-badge color="amber" floating>
            {{
              incapableSMOs.length
            }}
          </q-badge>
        </q-tab>
      </q-tabs>
      <q-separator></q-separator>
      <q-tab-panels v-model="cellTab" animated>
        <q-tab-panel name="assigned">
          <two-col-list :items="assignedSMOs" @clickItem="(i) => removeSMO(i)"></two-col-list>
        </q-tab-panel>
        <q-tab-panel name="available">
          <two-col-list :items="availableSMOs" @clickItem="(i) => addSMO(availableSMOs[i])"></two-col-list>
        </q-tab-panel>
        <q-tab-panel name="unavailable">
          <two-col-list :items="unavailableSMOs" @clickItem="(i) => addSMO(unavailableSMOs[i])"></two-col-list>
        </q-tab-panel>
        <q-tab-panel name="others">
          <two-col-list :items="incapableSMOs" @clickItem="(i) => addSMO(incapableSMOs[i])"></two-col-list>
        </q-tab-panel>
      </q-tab-panels>
    </q-menu>
    <q-tooltip v-if="tdHasTooltip">
      <div class="tdtooltip">
        <div class="col">{{ assignedSMOs.map((smo) => smo).join(', ') }}</div>
        <div class="col" v-for="(reason, i) in isValidActivity.reasons" :key="i">{{ reason }}</div>
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
import { Time } from '../stores/models';
import { useSMOStore } from 'src/stores/smoStore';
import { useActivityStore } from 'src/stores/activityStore';
import { useRosterStore } from 'src/stores/rosterStore';
import { useMonthStore } from 'src/stores/monthStore';

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
    const smoStore = useSMOStore();
    const rosterStore = useRosterStore();
    const activityStore = useActivityStore();

    const { dateStr, time, activityName } = toRefs(props);
    const date = ref(new Date(dateStr.value));
    const cellTab = ref('available');
    const smoPopup = ref(false);

    const assignedEntries = computed(() =>
      rosterStore.filter({
        date: date.value,
        time: time.value,
        activity: activityName.value,
      })
    );

    const assignedSMOs = computed(() =>
      assignedEntries.value.map((entry) => entry.smo)
    );

    const isValidActivity = computed(() =>
      store.isValidActivity(date.value, time.value, activityName.value)
    );

    const isAllowedActivity = computed(() =>
      activityStore.isAllowedActivity(
        date.value,
        time.value,
        activityName.value
      )
    );
    const isHoliday = computed(() => store.isHoliday(date.value));

    const availableSMOs = computed(() => {
      return smoStore.smos
        .filter((smo) =>
          store.isAvailableSMO(
            date.value,
            time.value,
            smo.name,
            activityName.value
          )
        )
        .map((smo) => smo.name)
        .filter((smo) => !assignedSMOs.value.includes(smo));
    });

    const unavailableSMOs = computed(() => {
      return smoStore.smos
        .filter((smo) =>
          store.isUnavailableSMO(
            date.value,
            time.value,
            smo.name,
            activityName.value
          )
        )
        .map((smo) => smo.name);
    });

    const incapableSMOs = computed(() => {
      return smoStore.smos
        .filter(
          (smo) => !smoStore.isAllowedActivitySMO(activityName.value, smo.name)
        )
        .map((smo) => smo.name);
    });

    const removeSMO = (entryNum: number) => {
      const rosterStore = useRosterStore();
      void rosterStore.delRosterEntry(assignedEntries.value[entryNum].id);
    };

    const addSMO = (smoName: string) => {
      const rosterStore = useRosterStore();
      const monthStore = useMonthStore();
      void rosterStore.addRosterEntry({
        date: date.value,
        time: time.value,
        activity: activityName.value,
        smo: smoName,
        version: monthStore.version,
        notes: '',
      });
      smoPopup.value = false;
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
      const classes: Array<unknown> = [
        'activityCell',
        {
          weekBoundary: store.showWeekend
            ? isSunday(date.value)
            : isFriday(date.value),
          holiday: isHoliday.value,
        },
      ];
      if (!activityStore.viewOptions.showErrors || isHoliday.value)
        return classes;
      const invalidReason = (myreason: string) =>
        !isHoliday.value &&
        !isValidActivity.value.answer &&
        isValidActivity.value.reasons.some((reason) =>
          reason.includes(myreason)
        );

      return classes.concat([
        {
          invalid1: invalidReason('PerSession'),
          invalid2: invalidReason('PerDay'),
          invalid3: invalidReason('Did not expect'),
        },
      ]);
    });

    return {
      cellTab,
      smoPopup,
      isValidActivity,
      isAllowedActivity,
      assignedSMOs,
      availableSMOs,
      unavailableSMOs,
      incapableSMOs,
      tdHasTooltip,
      tdContent,
      tdClasses,
      addSMO,
      removeSMO,
    };
  },
});
</script>

<style lang="scss" scoped>
td.invalid1 {
  background: $deep-orange-3 !important;
}
td.invalid2 {
  background: $orange-3 !important;
}
td.invalid3 {
  background: $yellow-3 !important;
}
</style>
