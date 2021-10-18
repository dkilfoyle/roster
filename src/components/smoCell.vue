<template>
  <td
    :class="tdClasses"
    @click.prevent="tdClick($event)"
    @contextmenu.prevent="notesMenu = !notesMenu"
  >
    <q-menu v-if="!monthStore.isArchived" v-model="notesMenu" no-parent-event>
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h8">Notes for {{ smoName }} on {{ dateStr }}</div>
        </q-card-section>

        <q-card-section v-for="entry in assignedEntries" :key="entry.id" class="q-pt-none">
          <q-input
            dense
            v-model="entry.notes"
            autofocus
            @keyup.enter="saveNotes"
            :label="entry.activity"
          />
        </q-card-section>

        <q-card-actions align="right" class="text-primary">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn flat label="Save" @click="saveNotes" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-menu>
    <q-menu
      style="min-height: 300px"
      v-model="activityMenu"
      v-if="!monthStore.isArchived"
      no-parent-event
      @hide="isEditing = false"
      @before-show="isEditing = true"
    >
      <div class="row q-pa-md bg-info q-mb-sm">
        <div class="col" v-if="isSelected">Selected Cell(s)</div>
        <div class="col" v-else>{{ smoName }} on {{ dateStr }}</div>
        <q-btn class="col-auto" icon="close" size="sm" @click="activityMenu = false"></q-btn>
      </div>
      <div class="text-center"></div>
      <q-tabs v-model="cellTab" class="q-mt-md">
        <q-tab name="assigned" label="Cur" v-if="!isSelected">
          <q-badge
            :color="assignedActivities.length > 0 ? 'green' : 'red'"
            floating
          >{{ assignedActivities.length }}</q-badge>
        </q-tab>
        <q-tab name="available" label="Avail" v-if="!isSelected">
          <q-badge
            :color="availableActivities.length > 0 ? 'green' : 'red'"
            floating
          >{{ availableActivities.length }}</q-badge>
        </q-tab>
        <q-tab name="all" label="All">
          <q-badge color="green" floating>
            {{
              allActivities.length
            }}
          </q-badge>
        </q-tab>
      </q-tabs>
      <q-separator></q-separator>
      <q-tab-panels v-model="cellTab" animated>
        <q-tab-panel name="assigned">
          <two-col-list :items="assignedActivities" @onClickItem="removeActivity"></two-col-list>
        </q-tab-panel>
        <q-tab-panel name="available">
          <activity-selector :activities="availableActivities" @onClickItem="setActivity"></activity-selector>
        </q-tab-panel>
        <q-tab-panel name="unavailable">
          <activity-selector :activities="unavailableActivities" @onClickItem="setActivity"></activity-selector>
        </q-tab-panel>
        <q-tab-panel name="others">
          <activity-selector :activities="incapableActivities" @onClickItem="setActivity"></activity-selector>
        </q-tab-panel>
        <q-tab-panel name="all">
          <activity-selector
            :activities="allActivities"
            :colors="allColors"
            @onClickItem="setActivity"
          ></activity-selector>
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
    </q-menu>-->
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
import twoColList from './twoColList.vue';
import activitySelector from './activitySelector.vue';
import { useStore } from '../stores/store';
import { useSMOStore } from '../stores/smoStore';
import { isSunday, isFriday } from 'date-fns';
import { Time } from '../stores/models';
import { useActivityStore } from 'src/stores/activityStore';
import { useRosterStore } from 'src/stores/rosterStore';
import { useMonthStore } from 'src/stores/monthStore';
import { isDeepStrictEqual } from 'util';

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
    }
  },
  components: { twoColList, activitySelector },
  setup(props, { emit }) {
    const { dateStr, time, smoName, isSelected } = toRefs(props);
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

    const activityMenu = ref(false);
    const notesMenu = ref(false);
    const isEditing = ref(false);


    const tdClick = (e: MouseEvent) => {
      if (e.ctrlKey) {
        emit('onSelectCell', { date: date.value, time: time.value, smoName: smoName.value })
      } else {
        cellTab.value = isSelected.value ? 'all' : 'available';
        activityMenu.value = !activityMenu.value;
      }
    }

    const saveNotes = () => {
      assignedEntries.value.forEach(
        (entry) =>
          void rosterStore.setRosterEntry(entry.id, { notes: entry.notes })
      );
    };

    const cellTab = ref(isSelected.value ? 'all' : 'available');

    const removeActivity = (activityName: string) => {
      const activity = assignedEntries.value.find((entry) => entry.activity == activityName);
      if (activity) void rosterStore.delRosterEntry(activity.id);
    };

    const setActivity = (activityName: string) => {
      if (isSelected.value) emit('onSelectionSetActivity', activityName); else {
        // setActivity replaces only the first activity if there are multiple assigned activities
        if (assignedEntries.value.length) {
          void rosterStore.setRosterEntry(assignedEntries.value[0].id, {
            activity: activityName,
          });
        } else addActivity(activityName);
      }
      activityMenu.value = false;
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
      activityMenu.value = false;
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
          selected: isSelected.value || isEditing.value
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
      cellTab,
      activityMenu,
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
</style>
