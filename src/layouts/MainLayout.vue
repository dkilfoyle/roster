<template>
  <q-layout view="lHh Lpr lFf">
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

        <div class="col" style="text-align: center">{{ store.monthName }}</div>

        <q-tabs class="col-auto">
          <q-route-tab to="/activityPage" label="Activity View" />
          <q-route-tab to="/smoPage" label="SMO View" />
        </q-tabs>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered class="bg-grey-1">
      <q-list>
        <q-item-label header class="text-grey-8">
          Essential Links
        </q-item-label>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useStore } from '../stores/store';

export default defineComponent({
  name: 'MainLayout',

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
