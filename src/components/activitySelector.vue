<template>
  <div class="row q-gutter-sm">
    <div class="col-auto">
      <q-tabs v-model="activityTypeTab" vertical>
        <q-tab
          v-for="activityType in activityTypes"
          :key="activityType"
          :name="activityType"
          :label="activityType"
        ></q-tab>
      </q-tabs>
    </div>
    <q-separator vertical></q-separator>
    <div class="col">
      <q-tab-panels v-model="activityTypeTab">
        <q-tab-panel v-for="activityType in activityTypes" :key="activityType" :name="activityType">
          <two-col-list
            :items="getItems(activityType)"
            :colors="getColors(activityType)"
            @onClickItem="(i) => emit('onClickItem', i)"
          ></two-col-list>
        </q-tab-panel>
      </q-tab-panels>
    </div>
  </div>
</template>

<script lang="ts">
import { useActivityStore } from 'src/stores/activityStore';
import { defineComponent, toRefs, ref, PropType } from 'vue';
import twoColList from './twoColList.vue';

export default defineComponent({
  name: 'activitySelector',
  components: { twoColList },
  props: {
    activities: {
      type: Array as PropType<Array<string>>,
      required: true,
    },
    colors: {
      type: Array as PropType<Array<string>>,
    },
  },
  setup(props, { emit }) {
    const activityTypeTab = ref('Leave')

    const activityStore = useActivityStore();
    const getActivityType = (activityName: string) => {
      const activity = activityStore.getActivity(activityName);
      if (activity && activity.type) return activity.type; else return 'Unknown'
    }

    const activityTypes = ['Leave', 'NCT', 'Inpatient', 'Consults', 'Clinic', 'Procedure', 'Other', 'Call'];

    const getItems = (activityType: string) => props.activities.filter((activity) => getActivityType(activity) == activityType);
    const getColors = (activityType: string) => {
      const colors = Array<string>();
      props.activities.forEach((activity, i) => { if (getActivityType(activity) == activityType && props.colors && props.colors[i]) colors.push(props.colors[i]); })
      return colors;
    }

    return {
      ...toRefs(props),
      activityTypeTab,
      emit,
      getActivityType,
      activityTypes,
      getItems,
      getColors
    };
  },
});
</script>

<style lang="scss" scoped>
</style>
