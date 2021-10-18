<template>
  <div class="row">
    <div class="col">
      <q-list dense>
        <q-item
          v-for="(item, i) in items.length > 10 ? items.slice(0, 10) : items"
          :key="i"
          clickable
          @click="toggleItem(item)"
        >
          <q-item-section>
            <div :class="colors ? 'text-' + colors[i] : ''">{{ item }}</div>
          </q-item-section>
        </q-item>
      </q-list>
    </div>
    <div class="col" v-if="items.length > 10">
      <q-list dense>
        <q-item v-for="(item, i) in items.slice(10)" :key="i" clickable @click="toggleItem(item)">
          <q-item-section>
            <div :class="colors ? 'text-' + colors[i] : ''">{{ item }}</div>
          </q-item-section>
        </q-item>
      </q-list>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, toRefs, PropType } from 'vue';

export default defineComponent({
  name: 'twoColList',
  props: {
    items: {
      type: Array as PropType<Array<string>>,
      required: true,
    },
    colors: {
      type: Array as PropType<Array<string>>,
    },
  },
  setup(props, { emit }) {
    const toggleItem = (item: string) => {
      emit('onClickItem', item);
    };
    return {
      ...toRefs(props),
      toggleItem,
    };
  },
});
</script>

<style lang="scss" scoped>
</style>
