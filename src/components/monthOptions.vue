<template>
  <div class="column q-pb-lg q-pr-lg q-gutter-y-md">
    <div class="col text-center">
      Start Date:
      <span style="font-weight: bold">{{
        format(store.startDate, 'yyyy-MM-dd')
      }}</span>
    </div>
    <div class="row q-gutter-x-md">
      <q-select
        v-model="month"
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
        v-model="year"
        :options="[2018, 2019, 2020, 2021, 2022, 2023, 2024]"
        filled
        dense
        class="col"
        options-dense
      ></q-select>
    </div>
    <q-select
      v-model="store.monthVersion"
      :options="store.rosterVersions"
      label="Version"
      dense
      filled
      ><template v-slot:after>
        <q-btn round size="sm" dense icon="more_horiz">
          <q-menu>
            <q-list style="padding-bottom: 0px">
              <q-item clickable v-close-popup @click="newVersion = true"
                ><q-item-section>Add new</q-item-section></q-item
              >
              <q-item
                v-if="store.monthVersion != 'Final'"
                clickable
                v-close-popup
                @click="finaliseVersion = true"
                ><q-item-section>Finalise</q-item-section></q-item
              >
              <div v-if="!store.isArchived">
                <q-separator></q-separator>
                <q-item clickable v-close-popup @click="deleteVersion = true"
                  ><q-item-section>Delete</q-item-section></q-item
                >
              </div>
            </q-list>
          </q-menu>
        </q-btn>
      </template>
    </q-select>
    <q-dialog v-model="newVersion">
      <q-card>
        <q-card-section class="text-subtitle1"
          >Create a new version of {{ store.monthName }}</q-card-section
        >
        <q-card-section class="q-pt-none"
          ><q-input v-model="newVersionName" label="Name" autofocus></q-input
        ></q-card-section>
        <q-card-actions align="right"
          ><q-btn flat label="Cancel" color="primary" v-close-popup></q-btn
          ><q-btn
            flat
            label="Create"
            color="primary"
            v-close-popup
            @click="store.doCreateVersion(newVersionName)"
          ></q-btn
        ></q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog v-model="finaliseVersion">
      <q-card>
        <q-card-section>
          <div class="text-h6">Finalise Version: Warning</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          This will make "{{ store.monthVersion }}" the final version. This will
          OVERWRITE the existing final version. If you want to keep a backup of
          the current final version then cancel this operation and add a new
          copy of final.
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            flat
            label="OK"
            color="primary"
            v-close-popup
            @click="store.doFinaliseVersion()"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog v-model="deleteVersion">
      <q-card>
        <q-card-section>
          <div class="text-h6">Delete Version: Warning</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          This will delete "{{ store.monthVersion }}" permanently. Are you
          sure?"
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn
            flat
            label="OK"
            color="primary"
            v-close-popup
            @click="store.doDeleteVersion()"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-btn
      color="primary"
      :disable="store.isArchived"
      class="col"
      @click="confirmNCT = true"
      >Load NCT</q-btn
    >
    <q-dialog v-model="confirmNCT" persistent>
      <q-card>
        <q-card-section>
          <div class="text-h6">Warning</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          Generating NCT will overwrite any exists entries in the current month
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn
            flat
            label="Confirm"
            color="primary"
            @click="store.generateNCT"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  reactive,
  computed,
  watch,
  onMounted,
  toRefs,
} from 'vue';
import { format } from 'date-fns';
import { useStore } from '../stores/store';
import { getFirstMonday } from '../stores/utils';

export default defineComponent({
  // name: 'ComponentName'
  setup() {
    const store = useStore();

    const state = reactive({
      year: store.startDate.getFullYear(),
      month: store.startDate.getMonth(),
      confirmNCT: false,
      newVersion: false,
      finaliseVersion: false,
      deleteVersion: false,
      newVersionName: '',
    });

    const firstMonday = computed(() => getFirstMonday(state.year, state.month));

    onMounted(() => {
      console.log('monthOptions onMounted setMonth', state.year, state.month);
    });

    watch(
      () => `${store.startDate.getFullYear()}-${store.startDate.getMonth()}`,
      () => {
        console.log('monthOptions saw new start date', store.startDate);
        state.year = store.startDate.getFullYear();
        state.month = store.startDate.getMonth();
      }
    );

    watch(firstMonday, () => store.setMonth(state.year, state.month));

    return {
      ...toRefs(state),
      store,
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
