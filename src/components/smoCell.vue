<template>
  <td :class="tdClasses" @click.prevent="tdClick()" @contextmenu.prevent="notesMenu = !notesMenu">
    <q-tooltip v-if="tdHasTooltip">
      <div class="tdtooltip">
        {{ assignedActivities.map((smo) => smo).join(', ') }}
        <p v-for="(reason, i) in errors" :key="i">{{ reason }}</p>
        <p v-for="entry in assignedEntries" :key="entry.id">{{ entry.notes }}</p>
      </div>
    </q-tooltip>
    {{ tdContent }}
  </td>
</template>

<script lang="ts">
import { defineComponent, toRefs, computed, PropType, ref } from 'vue';
import { useStore } from '../stores/store';
import { useSMOStore } from '../stores/smoStore';
import { isSunday, isFriday } from 'date-fns';
import { Time } from '../stores/models';
import { useActivityStore } from 'src/stores/activityStore';
import { useRosterStore } from 'src/stores/rosterStore';
import { useMonthStore } from 'src/stores/monthStore';
import { Notify } from 'quasar';

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
    isSelected: {
      type: Boolean,
      required: true
    },
    selectedActivity: {
      type: String,
      required: true
    }
  },
  setup(props, { emit }) {
    const { dateStr, time, smoName, isSelected, selectedActivity } = toRefs(props);
    const date = ref(new Date(dateStr.value));

    const store = useStore();
    const smoStore = useSMOStore();
    const activityStore = useActivityStore();
    const rosterStore = useRosterStore();
    const monthStore = useMonthStore();

    const assignedEntries = computed(() => {
      return rosterStore.filter({
        date: date.value,
        time: time.value,
        smo: smoName.value,
      }).filter(entry => entry.activity != 'Call');
    });

    const notesMenu = ref(false);
    const isEditing = ref(false);


    const tdClick = () => {
      if (selectedActivity.value == '') {
        // no activity selected in button menu so add current cell to selection
        if (assignedActivities.value.length > 1) {
          Notify.create({
            message: 'Warning',
            caption: 'Cannot select SMO session with > 1 assigned activity\'}',
            position: 'bottom-right',
          });
        } else
          emit('selectCell', { date: date.value, time: time.value, smoName: smoName.value, capableActivities, allowedActivities })
      } else if (selectedActivity.value == 'erase') {
        // erase cell
        // TODO: If > 1 entry present dialog to select which to delete
        assignedEntries.value.forEach((entry) => void rosterStore.delRosterEntry(entry.id))
      } else {
        // set to selected activity
        // console.log('setting ', selectedActivity.value)
        setActivity(selectedActivity.value)
      }
    }

    const saveNotes = () => {
      assignedEntries.value.forEach(
        (entry) =>
          void rosterStore.setRosterEntry(entry.id, { notes: entry.notes })
      );
    };

    const removeActivity = (activityName: string) => {
      const activity = assignedEntries.value.find((entry) => entry.activity == activityName);
      if (activity) void rosterStore.delRosterEntry(activity.id);
    };

    const setActivity = (activityName: string) => {
      // setActivity replaces only the first activity if there are multiple assigned activities
      if (assignedEntries.value.length) {
        void rosterStore.setRosterEntry(assignedEntries.value[0].id, {
          activity: activityName,
        });
      } else addActivity(activityName);

    };

    const addActivity = (activityName: string) => {
      const monthStore = useMonthStore();
      void rosterStore.addRosterEntry({
        smo: smoName.value,
        date: date.value,
        time: time.value,
        activity: activityName,
        notes: '',
        version: monthStore.version,
      });
    };

    const isHoliday = computed(() => store.isHoliday(date.value));

    const allActivities = computed(() => activityStore.activities.map((activity) => activity.name));

    const allColors = computed(() => {
      return activityStore.activities.map((activity) => {
        if (availableActivities.value.includes(activity.name)) return 'black';
        else if (unavailableActivities.value.includes(activity.name)) return 'orange';
        else return 'red';
      })
    })

    const capableActivities = computed(
      () => smoStore.getSMO(smoName.value).activities
    );

    const assignedActivities = computed(() =>
      assignedEntries.value.map((entry) => entry.activity)
    );

    const capableActivitiesNotAssigned = computed(() =>
      capableActivities.value.filter(
        (activityName) => !assignedActivities.value.includes(activityName)
      )
    )

    const allowedActivities = computed(() =>
      capableActivities.value.filter((activityName) => activityStore.isAllowedActivity(date.value, time.value, activityName))
    );

    const availableActivities = computed(() =>
      capableActivitiesNotAssigned.value.filter((activityName) => activityStore.isAllowedActivity(date.value, time.value, activityName))
    );

    const unavailableActivities = computed(() =>
      capableActivitiesNotAssigned.value.filter((activityName) => !activityStore.isAllowedActivity(date.value, time.value, activityName))
    );

    const incapableActivities = computed(() =>
      activityStore.activityNames.filter(
        (activityName) => !capableActivities.value.includes(activityName)
      )
    );

    const isValidSMO = computed(() =>
      store.isValidSMO(date.value, time.value, smoName.value)
    );

    // const isValidEntries = computed(() => {
    //   const reasons = Array<string>();
    //   assignedActivities.value.forEach((activityName) => {
    //     const isvalid = store.isValidEntry(date.value, time.value, smoName.value, activityName);
    //     if (isvalid.reasons.length) reasons.push(...isvalid.reasons)
    //   })
    //   return reasons;
    // })

    const isValidActivities = computed(() => {
      const reasons = Array<string>();
      assignedActivities.value.forEach((activityName) => {
        const isvalid = store.isValidActivity(date.value, time.value, activityName);
        if (isvalid.reasons.length) reasons.push(...isvalid.reasons)
      })
      return reasons;
    })

    const errors = computed(() => isValidSMO.value.reasons.concat(isValidActivities.value));

    const tdContent = computed(() => {
      if (isHoliday.value) return '';
      const activities = assignedActivities.value;
      if (activities.length == 0) {
        if (smoStore.isAllowedTimeSMO(date.value, time.value, smoName.value))
          return '?';
        else return '';
      } else if (activities.length == 1) return activities[0];
      else return activities.length;
    });

    const tdHasNotes = computed(() => {
      return assignedEntries.value.some((entry) => entry.notes != '');
    });

    const tdHasTooltip = computed(() => {
      return (
        errors.value.length ||
        assignedActivities.value.length > 1 ||
        tdHasNotes.value
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
          note: tdHasNotes.value,
          selected: isSelected.value || isEditing.value,
          availableAssigned: allowedActivities.value.includes(selectedActivity.value) && smoStore.isAllowedTimeSMO(date.value, time.value, smoName.value) && assignedEntries.value.length,
          availableUnassigned: allowedActivities.value.includes(selectedActivity.value) && smoStore.isAllowedTimeSMO(date.value, time.value, smoName.value) && assignedEntries.value.length == 0,
          isErasing: selectedActivity.value == 'erase',
          isSetting: selectedActivity.value != '' && selectedActivity.value != 'erase',
          isSelecting: selectedActivity.value == ''
        },
      ];

      if (smoStore.viewOptions.showColors == 'none' || isHoliday.value) return classes;
      else if (smoStore.viewOptions.showColors == 'errors') {
        const invalidReason = (myreason: string) =>
          errors.value.length &&
          errors.value.some((reason) => reason.includes(myreason));
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
      }
      else {
        return classes.concat({
          act_btx: assignedActivities.value[0] == 'BTX',
          act_cme: assignedActivities.value[0] == 'CME',
          act_anl: assignedActivities.value[0] == 'ANL',
          act_tnp: assignedActivities.value[0] == 'TNP',
          act_dbs: assignedActivities.value[0] == 'DBS',
          act_ms: assignedActivities.value[0] == 'MS',
          act_wre: assignedActivities.value[0] == 'WRE',
          act_tbh: assignedActivities.value[0] == 'TBH',
          act_crs: assignedActivities.value[0] == 'CRS',
          act_crsgp: assignedActivities.value[0] == 'CRS+GP',
          act_crsact: assignedActivities.value[0] == 'CRS+ACT',
          act_pcl: assignedActivities.value[0] == 'PCL',
        });
      }
    });



    return {
      activityStore,
      monthStore,
      saveNotes,
      notesMenu,
      addActivity,
      removeActivity,
      setActivity,
      assignedEntries,
      availableActivities,
      unavailableActivities,
      incapableActivities,
      isValidSMO,
      assignedActivities,
      capableActivities,
      tdHasTooltip,
      tdContent,
      tdClasses,
      date,
      errors,
      tdClick,
      allActivities,
      allColors,
      isEditing
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
.availableAssigned {
  background: #6dacc975;
}
.availableUnassigned {
  background: #6dacc9;
}

td.isErasing {
  cursor: no-drop;
}

td.isSetting {
  cursor: cell;
}

td.isSelecting {
  cursor: default;
}
</style>
