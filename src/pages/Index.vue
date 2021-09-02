<template>
  <q-page class="row items-center justify-evenly"> <month></month> </q-page>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import month from '../components/month.vue';

export default defineComponent({
  name: 'PageIndex',
  components: { month },
  setup() {
    return {};
  },
});
</script>
