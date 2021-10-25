<template>
  <td :class="tdClasses" @click.prevent="tdClick">
    <q-tooltip v-if="tdHasTooltip">
      <div class="tdtooltip">
        <div class="col">{{ assignedSMOs.map((smo) => smo).join(', ') }}</div>
        <div class="col" v-for="(reason, i) in errors" :key="i">{{ reason }}</div>
      </div>
    </q-tooltip>
    <div :id="cellID">{{ tdContent }}</div>
  </td>
</template>

<script lang="ts">
import { defineComponent, toRefs, computed, PropType, ref } from 'vue';
import { useStore } from '../stores/store';
import { isSunday, isFriday, format } from 'date-fns';
import { Time } from '../stores/models';
import { useSMOStore } from 'src/stores/smoStore';
import { useActivityStore } from 'src/stores/activityStore';
import { useRosterStore } from 'src/stores/rosterStore';
import { useMonthStore } from 'src/stores/monthStore';
import { Notify } from 'quasar';
import { gsap } from 'gsap'

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
    isSelected: {
      type: Boolean,
      required: true
    },
    selectedSMO: {
      type: String,
      required: true
    }
  },
  setup(props, { emit }) {
    const store = useStore();
    const smoStore = useSMOStore();
    const rosterStore = useRosterStore();
    const activityStore = useActivityStore();

    const { dateStr, time, activityName, isSelected, selectedSMO } = toRefs(props);
    const date = ref(new Date(dateStr.value));

    const cellID = computed(() => `ActCell${format(date.value, 'yyyy_MM_dd')}_${time.value}_${activityName.value}`);

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

    const capableSMOs = computed(() => {
      return smoStore.getCapableSMOs(activityName.value)
    });

    const availableSMOs = computed(() => {
      return smoStore.getAvailableSMOs(date.value, time.value, activityName.value).map((smo) => smo.name).sort(sortName)
    })

    const tdClick = () => {
      if (selectedSMO.value == '') {
        // no smo selected in button menu so add current cell to selection
        emit('selectCell', { date: date.value, time: time.value, activityName: activityName.value, capableSMOs, availableSMOs, id: cellID })
      } else if (selectedSMO.value == 'erase') {
        // erase cell
        // TODO: If > 1 entry present dialog to select which to delete
        assignedEntries.value.forEach((entry) => void rosterStore.delRosterEntry(entry.id))
        gsap.from(`#${cellID.value}`, { duration: 1.0, background: 'red' });
      } else {
        // set to selected SMO
        // console.log('setting ', selectedActivity.value)
        addSMO(selectedSMO.value)
        gsap.from(`#${cellID.value}`, { duration: 1.0, background: 'red' });
      }
    }

    const sortName = (a: string, b: string) => {
      const aname = a.substr(-1) + a.substr(0, a.length - 1);
      const bname = b.substr(-1) + b.substr(0, a.length - 1);
      if (aname < bname) return -1;
      if (aname > bname) return 1;
      return 0;
    }

    const isValidSMOs = computed(() => {
      const reasons = Array<string>();
      assignedSMOs.value.forEach((smoName) => {
        const isvalid = store.isValidSMO(date.value, time.value, smoName);
        if (isvalid.reasons.length) reasons.push(...isvalid.reasons)
      })
      return reasons;
    })

    const isValidEntries = computed(() => {
      const reasons = Array<string>();
      assignedSMOs.value.forEach((smoName) => {
        const isvalid = store.isValidEntry(date.value, time.value, smoName, activityName.value);
        if (isvalid.reasons.length) reasons.push(...isvalid.reasons)
      })
      return reasons;
    })

    const isValidActivity = computed(() =>
      store.isValidActivity(date.value, time.value, activityName.value)
    );

    const errors = computed(() => isValidActivity.value.reasons.concat(activityName.value == 'Call' ? isValidEntries.value : isValidSMOs.value));

    const isAllowedActivity = computed(() =>
      activityStore.isAllowedActivity(
        date.value,
        time.value,
        activityName.value
      )
    );

    const isHoliday = computed(() => store.isHoliday(date.value));

    const addSMO = (smoName: string) => {
      if (assignedSMOs.value.includes(smoName)) {
        Notify.create({
          message: 'Warning',
          caption: `${smoName} already assigned on ${date.value.toDateString()} ${time.value} - skipping`,
          position: 'bottom-right',
        });
        return;
      }
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
        errors.value.length > 0 || assignedSMOs.value.length > 1
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
          selected: isSelected.value
        },
      ];
      if (!activityStore.viewOptions.showErrors || isHoliday.value)
        return classes;
      const invalidReason = (myreason: string) =>
        !isHoliday.value &&
        errors.value.length &&
        errors.value.some((reason) =>
          reason.includes(myreason)
        );

      return classes.concat([
        {
          invalidActivity1: invalidReason('PerSession'),
          invalidActivity2: invalidReason('PerDay'),
          invalidActivity3: invalidReason('Did not expect'),
          invalidSMO1: invalidReason('should be followed by RT'),
          invalidSMO2: invalidReason('is not an allowed activity'),
          invalidSMO3: invalidReason('is not contracted'),
          invalidSMO4: invalidReason('is already assigned'),
        },
      ]);
    });

    return {
      cellID,
      assignedSMOs,
      errors,

      tdHasTooltip,
      tdContent,
      tdClasses,
      tdClick
    };
  },
});
</script>

<style lang="scss" scoped>
td.invalidActivity1 {
  background: $deep-orange-3 !important;
}
td.invalidActivity2 {
  background: $orange-3 !important;
}
td.invalidActivity3 {
  background: $yellow-3 !important;
}
td.invalidSMO1 {
  background: $red-2 !important;
}
td.invalidSMO2 {
  background: $pink-2 !important;
}
td.invalidSMO3 {
  background: $purple-2 !important;
}
td.invalidSMO4 {
  background: $deep-purple-2 !important;
}
</style>
