<template>
  <q-page padding>
    <activity-view></activity-view>
  </q-page>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import activityView from '../components/activityView.vue';

export default defineComponent({
  // name: 'PageName'
  components: { activityView },
});
</script>
