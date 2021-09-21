<template>
  <q-page style="padding: 24px">
    <smo-view v-if="store.compiled"></smo-view>
    <div
      v-else
      class="column justify-center items-center"
      style="height: calc(100vh - 50px - 48px)"
    >
      <div class="col-auto">
        <q-spinner-gears size="50px" color="primary"></q-spinner-gears>
      </div>
    </div>
  </q-page>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { defineComponent } from 'vue';
import { useStore } from '../stores/store';
import smoView from '../components/smoView.vue';

// import { VueGapi } from 'vue-gapi';

export default defineComponent({
  // name: 'PageName'
  components: { smoView },
  setup() {
    const store = useStore();

    // const vuegapi = inject('gapi') as VueGapi;

    // vuegapi
    //   .login()
    //   .then(() => {
    //     vuegapi
    //       .getGapiClient()
    //       .then(async (res2) => {
    //         console.log();
    //         const r = await res2.client.sheets.spreadsheets.values.get({
    //           spreadsheetId: '1Z392gWSaX8dnvImjq4Q_6pzd5F0ar_TnN0zOLNFGFFw',
    //           range: 'A1:A3',
    //         });
    //         console.log(r);
    //       })
    //       .catch((err) => console.log(err));
    //   })
    //   .catch((error) => {
    //     console.log('error', error);
    //   });

    return {
      store,
    };
  },
});
</script>

<style scoped></style>
