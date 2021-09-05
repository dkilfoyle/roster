<template>
  <div>
    <q-list dense class="denser">
      <q-item-label header class="text-grey-8"> Display </q-item-label>
      <q-item :tag="label" v-ripple>
        <q-item-section side top>
          <q-checkbox v-model="Errors" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Errors</q-item-label>
        </q-item-section>
      </q-item>
      <q-item tag="label" v-ripple>
        <q-item-section side top>
          <q-checkbox v-model="Summary" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Summary</q-item-label>
        </q-item-section>
      </q-item>

      <q-item-label header class="text-grey-8"> Filter </q-item-label>
      <q-item tag="label" v-ripple>
        <q-item-section side top>
          <q-checkbox v-model="Leave" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Leave</q-item-label>
        </q-item-section>
      </q-item>
      <q-item tag="label" v-ripple>
        <q-item-section side top>
          <q-checkbox v-model="Call" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Call</q-item-label>
        </q-item-section>
      </q-item>
      <q-item tag="label" v-ripple>
        <q-item-section side top>
          <q-checkbox v-model="Inpatient" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Inpatient</q-item-label>
        </q-item-section>
      </q-item>
      <q-item tag="label" v-ripple>
        <q-item-section side top>
          <q-checkbox v-model="Clinic" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Clinic</q-item-label>
        </q-item-section>
      </q-item>
      <q-item tag="label" v-ripple>
        <q-item-section side top>
          <q-checkbox v-model="Other" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Other</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
  // name: 'ComponentName'
});
</script>
