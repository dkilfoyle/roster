<template>
  <q-page padding>
    <smo-view></smo-view>
  </q-page>
</template>

<script lang="ts">
import smoView from '../components/smoView.vue';

import { defineComponent } from 'vue';
export default defineComponent({
  // name: 'PageName'
  components: { smoView },
});
</script>
