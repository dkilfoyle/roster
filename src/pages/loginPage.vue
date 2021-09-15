<template>
  <q-page padding class="column items-center">
    <h2>Neurology Roster</h2>
    <h6>Login</h6>
    <q-btn @click="signIn">Login</q-btn>
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

export default defineComponent({
  name: 'PageIndex',
  setup() {
    // Signs-in Friendly Chat.
    async function signIn() {
      // Sign in Firebase using popup auth and Google as the identity provider.
      var provider = new GoogleAuthProvider();
      await signInWithPopup(getAuth(), provider);
    }
    async function signOutUser() {
      // Sign out of Firebase.
      await signOut(getAuth());
    }
    return {
      signIn,
      signOutUser,
    };
  },
});
</script>
