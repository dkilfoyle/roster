<template>
  <div class="column q-pb-lg q-pr-lg q-gutter-y-md">
    <div class="col text-center">
      Start Date:
      <span style="font-weight: bold">
        {{
          format(monthStore.startDate, 'yyyy-MM-dd')
        }}
      </span>
    </div>
    <div class="row q-gutter-x-md">
      <q-select
        label="Month"
        stack-label
        v-model="monthStore.month"
        emit-value
        map-options
        :options="[
          { label: 'Jan', value: 0 },
          { label: 'Feb', value: 1 },
          { label: 'Mar', value: 2 },
          { label: 'Apr', value: 3 },
          { label: 'May', value: 4 },
          { label: 'Jun', value: 5 },
          { label: 'Jul', value: 6 },
          { label: 'Aug', value: 7 },
          { label: 'Sep', value: 8 },
          { label: 'Oct', value: 9 },
          { label: 'Nov', value: 10 },
          { label: 'Dec', value: 11 },
        ]"
        filled
        dense
        class="col"
        options-dense
      ></q-select>
      <q-select
        label="Year"
        stack-label
        v-model="monthStore.year"
        :options="[2018, 2019, 2020, 2021, 2022, 2023, 2024]"
        filled
        dense
        class="col"
        options-dense
      ></q-select>
    </div>
    <q-select
      v-model="monthStore.version"
      :options="rosterStore.monthVersions"
      label="Version"
      dense
      filled
    >
      <template v-slot:after>
        <q-btn round size="sm" dense icon="more_horiz" :disable="monthStore.isArchived">
          <q-menu>
            <q-list style="padding-bottom: 0px">
              <q-item clickable v-close-popup @click="newVersion = true">
                <q-item-section>Add new</q-item-section>
              </q-item>
              <q-item
                v-if="monthStore.version != 'Final'"
                clickable
                v-close-popup
                @click="finaliseVersion = true"
              >
                <q-item-section>Finalise</q-item-section>
              </q-item>
              <q-separator></q-separator>
              <q-item clickable v-close-popup @click="deleteVersion = true">
                <q-item-section>Delete</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </template>
    </q-select>
    <q-dialog v-model="newVersion">
      <q-card>
        <q-card-section class="text-subtitle1">Create a new version of {{ monthStore.monthName }}</q-card-section>
        <q-card-section class="q-pt-none">
          <q-input v-model="newVersionName" label="Name" autofocus></q-input>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup></q-btn>
          <q-btn
            flat
            label="Create"
            color="primary"
            v-close-popup
            @click="store.doCreateVersion(newVersionName)"
          ></q-btn>
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog v-model="finaliseVersion">
      <q-card>
        <q-card-section>
          <div class="text-h6">Finalise Version: Warning</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          This will make "{{ monthStore.version }}" the final version. This will
          OVERWRITE the existing final version. If you want to keep a backup of
          the current final version then cancel this operation and add a new
          copy of final.
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn flat label="OK" color="primary" v-close-popup @click="store.doFinaliseVersion()" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog v-model="deleteVersion">
      <q-card>
        <q-card-section>
          <div class="text-h6">Delete Version: Warning</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          This will delete "{{ monthStore.version }}" permanently. Are you
          sure?"
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn flat label="OK" color="primary" v-close-popup @click="store.doDeleteVersion()" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-btn
      color="secondary"
      :disable="monthStore.isArchived"
      class="col"
      @click="confirmNCT = true"
    >Load NCT</q-btn>
    <q-dialog v-model="confirmNCT" persistent>
      <q-card>
        <q-card-section>
          <div class="text-h6">Warning</div>
        </q-card-section>

        <q-card-section
          class="q-pt-none"
        >Generating NCT will overwrite any exists entries in the current month</q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn flat label="Confirm" color="primary" @click="store.generateNCT" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, watch, toRefs } from 'vue';
import { format } from 'date-fns';
import { useStore } from '../stores/store';
import { useMonthStore } from '../stores/monthStore';
import { useRosterStore } from '../stores/rosterStore';

export default defineComponent({
  // name: 'ComponentName'
  setup() {
    const store = useStore();
    const monthStore = useMonthStore();
    const rosterStore = useRosterStore();

    const state = reactive({
      confirmNCT: false,
      newVersion: false,
      finaliseVersion: false,
      deleteVersion: false,
      newVersionName: '',
    });

    // const startDate = computed(() => monthStore.startDate);

    watch(
      () => monthStore.startDate,
      () => {
        // console.log('monthOptions.watch(monthStore.startDate)', newVal);
        void store.onNewMonth();
      }
    );

    watch(
      () => ({ year: monthStore.year, month: monthStore.month }),
      (newVal) => {
        // console.log('monthOptions.watch(year,month)', newVal);
        monthStore.setMonth(newVal.year, newVal.month);
      }
    );

    return {
      ...toRefs(state),
      store,
      monthStore,
      rosterStore,
      format,
    };
  },
});
</script>

<style scoped>
.options {
  padding-bottom: 10px;
  padding-right: 10px;
}
</style>
