<template>
  <div class="column q-pb-md q-pr-lg q-gutter-md">
    <div class="col text-center">{{ store.user }}</div>
    <q-btn class="col" color="primary" @click="signout">Log out</q-btn>
  </div>
</template>

<script lang="ts">
import { getAuth } from 'firebase/auth';
import { defineComponent } from 'vue';
import { useStore } from '../stores/store';
export default defineComponent({
  // name: 'ComponentName'
  setup() {
    const store = useStore();
    const signout = () => getAuth().signOut();
    return { store, signout };
  },
});
</script>
