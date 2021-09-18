<template>
  <div class="row">
    <div class="col">
      <q-list dense>
        <q-item
          v-for="(item, i) in items.slice(0, Math.ceil(items.length / 2))"
          :key="i"
          clickable
          @click="toggleItem(i)"
        >
          <q-item-section>{{ item }}</q-item-section>
        </q-item>
      </q-list>
    </div>
    <div class="col">
      <q-list dense v-if="items.length > 1">
        <q-item
          v-for="(item, i) in items.slice(
            Math.ceil(items.length / 2),
            items.length
          )"
          :key="i"
          clickable
          @click="toggleItem(Math.ceil(items.length / 2) + i)"
        >
          <q-item-section>{{ item }}</q-item-section>
        </q-item>
      </q-list>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, toRefs } from 'vue';

export default defineComponent({
  name: 'twoColList',
  props: {
    items: {
      type: Array,
      required: true,
    },
  },
  setup(props, { emit }) {
    const toggleItem = (i: number) => {
      emit('clickItem', i);
    };
    return {
      ...toRefs(props),
      toggleItem,
    };
  },
});
</script>

<style lang="scss" scoped></style>
