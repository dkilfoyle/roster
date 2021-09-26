import { defineStore } from 'pinia';
import { RosterEntry } from './models';

import {
  query,
  collection,
  getFirestore,
  where,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
  getDocs,
} from 'firebase/firestore';
import { format } from 'date-fns';

export const useRosterStore = defineStore('roster', {
  state: () => ({
    rosterAll: Array<RosterEntry>(),
  }),
  getters: {
    rosterAllLength: (state) => {
      console.log('rosterStore.rosterAll.length = ', state.rosterAll.length);
      return state.rosterAll.length;
    },
  },
  actions: {
    async loadAllFromFirestore() {
      console.log('rosterStore.loadAllFromFirestore');
      const q = query(collection(getFirestore(), 'roster'));

      //todo: loadFromFirestore(startDate, endDate) using where(), where()
      // load all existing documents
      const qss = await getDocs(q);
      console.log(' - getDocs returned ', qss.docs.length);
      const loadentries = Array<RosterEntry>();
      qss.forEach((doc) => {
        const entry = doc.data();
        entry.date = new Date(entry.date);
        entry.notes = '';
        entry.version = 'Final';

        loadentries.push(entry as RosterEntry);
      });
      this.rosterAll = loadentries;
      return loadentries.length;
    },

    async loadFromFirestore(startDate: Date, endDate: Date) {
      console.log('rosterStore.loadFromFirestore', startDate.toUTCString());
      const q = query(
        collection(getFirestore(), 'roster'),
        where('date', '>=', format(startDate, 'yyyy-MM-dd')),
        where('date', '<=', format(endDate, 'yyyy-MM-dd'))
      );

      //todo: loadFromFirestore(startDate, endDate) using where(), where()
      // load all existing documents
      const qss = await getDocs(q);
      console.log(' - getDocs returned ', qss.docs.length);
      const loadentries = Array<RosterEntry>();
      qss.forEach((doc) => {
        const entry = doc.data();
        entry.date = new Date(entry.date);
        entry.notes = '';
        entry.version = 'Final';

        loadentries.push(entry as RosterEntry);
      });
      this.rosterAll.push(...loadentries);

      let initialState = true;

      // when receiving added, modified or removed changes - ignore initialState load
      onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
        if (initialState) {
          initialState = false;
        } else {
          console.log('roster.onSnapShot');
          const loadentries = Array<RosterEntry>();
          snapshot.docChanges().forEach((change) => {
            if (change.type == 'added')
              loadentries.push(change.doc.data() as RosterEntry);
          });
          console.log('added entries', loadentries.length);
          this.rosterAll.push(...loadentries);
        }
      });

      return loadentries.length;
    },
    patchEntries(newEntries: Array<RosterEntry>) {
      this.$patch((state) => {
        state.rosterAll.push(...newEntries);
      });
    },
  },
});
