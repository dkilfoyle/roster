<template>
  <q-layout view="hHh lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <div class="col row items-center">
          <q-btn
            flat
            dense
            round
            icon="menu"
            aria-label="Menu"
            @click="toggleLeftDrawer"
          />

          <q-separator dark vertical inset />

          <div style="padding-left: 10px; font-size: 18px">
            Neurology Roster
          </div>
        </div>

        <div class="col row justify-center" style="text-align: center">
          <q-btn
            flat
            round
            size="md"
            @click="monthStore.setPrevMonth()"
            icon="navigate_before"
          ></q-btn>
          <div class="column col-auto justify-center">
            <div class="col-auto" style="color: cyan">
              {{ monthStore.monthName }}
            </div>
            <div
              class="col"
              v-if="monthStore.version != 'Final'"
              style="color: greenyellow"
            >
              {{ monthStore.version }}
            </div>
          </div>

          <q-btn
            flat
            round
            size="md"
            @click="monthStore.setNextMonth()"
            icon="navigate_next"
          ></q-btn>
        </div>

        <div class="col">
          <q-tabs inline-label class="float-right">
            <q-route-tab icon="person" to="/smoPage" label="SMO View" exact />
            <q-route-tab
              icon="directions_run"
              to="/activityPage"
              label="Activity View"
              exact
            />
          </q-tabs>
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" side="left" bordered class="bg-grey-1">
      <q-list bordered>
        <q-expansion-item
          default-opened
          label="Month"
          :content-inset-level="0.5"
          expand-separator
          icon="calendar_today"
        >
          <month-options></month-options>
        </q-expansion-item>

        <q-expansion-item
          label="Activity View"
          :content-inset-level="0.5"
          expand-separator
          icon="directions_run"
        >
          <activity-options></activity-options>
        </q-expansion-item>

        <q-expansion-item
          label="SMO View"
          :content-inset-level="0.5"
          expand-separator
          icon="person"
        >
          <smo-options></smo-options>
        </q-expansion-item>

        <q-expansion-item
          @show="router.push('/summaryPage')"
          label="Summary View"
          :content-inset-level="0.5"
          expand-separator
          icon="summarize"
        >
          <summary-options></summary-options>
        </q-expansion-item>

        <q-expansion-item
          label="User"
          :content-inset-level="0.5"
          expand-separator
          icon="manage_accounts"
        >
          <user-options></user-options>
        </q-expansion-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <keep-alive>
            <component :is="Component"></component>
          </keep-alive>
        </transition>
      </router-view>
    </q-page-container>
  </q-layout>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useStore } from '../stores/store';
import { useMonthStore } from '../stores/monthStore';
import { useRouter } from 'vue-router';

import activityOptions from '../components/activityOptions.vue';
import smoOptions from '../components/smoOptions.vue';
import monthOptions from '../components/monthOptions.vue';
import userOptions from '../components/userOptions.vue';
import summaryOptions from '../components/summaryOptions.vue';

export default defineComponent({
  name: 'MainLayout',
  components: {
    activityOptions,
    smoOptions,
    monthOptions,
    userOptions,
    summaryOptions,
  },

  setup() {
    const store = useStore();
    const monthStore = useMonthStore();
    const leftDrawerOpen = ref(false);
    const router = useRouter();

    return {
      leftDrawerOpen,
      toggleLeftDrawer() {
        leftDrawerOpen.value = !leftDrawerOpen.value;
      },
      store,
      monthStore,
      router,
    };
  },
});
</script>

<style scoped>
.denser .q-item {
  max-height: 32px;
}

.denser .q-checkbox {
  max-height: 28px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
