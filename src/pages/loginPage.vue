<template>
  <q-page padding class="column items-center">
    <h2>Neurology Roster</h2>
    <h6 v-if="store.user">Logged in as {{ store.user }}</h6>
    <q-btn v-if="store.user" @click="signOutUser" color="secondary"
      >Logout</q-btn
    >
    <q-btn v-else @click="signIn" color="primary">Login</q-btn>
  </q-page>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import {
  signInWithPopup,
  getAuth,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth';

import { useStore } from '../stores/store';

export default defineComponent({
  name: 'PageIndex',
  setup() {
    async function signIn() {
      var provider = new GoogleAuthProvider();
      await signInWithPopup(getAuth(), provider);
    }
    async function signOutUser() {
      await signOut(getAuth());
    }

    const store = useStore();

    return {
      store,
      signIn,
      signOutUser,
    };
  },
});
</script>
