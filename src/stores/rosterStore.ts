import { defineStore } from 'pinia';
// import { parseRRule, isSameDay } from './utils';
// import { Time } from './models';

import { rosterData } from './data/rosterData';
import { RosterEntry } from './models';

export const useRosterStore = defineStore('roster', {
  state: () => ({
    rosterAll: rosterData,
  }),
  getters: {},
  actions: {
    patchEntries(newEntries: Array<RosterEntry>) {
      this.$patch((state) => {
        state.rosterAll.push(...newEntries);
      });
    },
  },
});
