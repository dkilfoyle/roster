<template>
  <q-page padding>
    <smo-view v-if="store.compiled"></smo-view>
  </q-page>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useStore } from '../stores/store';
import smoView from '../components/smoView.vue';

export default defineComponent({
  // name: 'PageName'
  components: { smoView },
  setup() {
    const store = useStore();
    return {
      store,
    };
  },
});
</script>
