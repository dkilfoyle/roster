<template>
  <q-page class="row items-center justify-evenly">
    <activity-view></activity-view>
  </q-page>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import activityView from '../components/activityView.vue';

export default defineComponent({
  name: 'PageIndex',
  components: { activityView },
  setup() {
    return {};
  },
});
</script>
