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
            @click="store.setPrevMonth"
            icon="navigate_before"
          ></q-btn>
          <div class="column col-auto justify-center">
            <div class="col-auto" style="color: cyan">
              {{ store.monthName }}
            </div>
            <div
              class="col"
              v-if="store.monthVersion != 'Final'"
              style="color: greenyellow"
            >
              {{ store.monthVersion }}
            </div>
          </div>

          <q-btn
            flat
            round
            size="md"
            @click="store.setNextMonth"
            icon="navigate_next"
          ></q-btn>
        </div>

        <div class="col">
          <q-tabs inline-label class="float-right">
            <q-route-tab icon="person" to="/" label="SMO View" exact />
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
      <q-list bordered dense>
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

import activityOptions from '../components/activityOptions.vue';
import smoOptions from '../components/smoOptions.vue';
import monthOptions from '../components/monthOptions.vue';

export default defineComponent({
  name: 'MainLayout',
  components: { activityOptions, smoOptions, monthOptions },

  setup() {
    const store = useStore();
    const leftDrawerOpen = ref(false);

    return {
      leftDrawerOpen,
      toggleLeftDrawer() {
        leftDrawerOpen.value = !leftDrawerOpen.value;
      },
      store,
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
