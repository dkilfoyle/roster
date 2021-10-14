import { defineStore } from 'pinia';
import {
  RosterData,
  RosterEntry,
  SetRosterEntry,
  SearchRosterEntry,
  RosterLookup,
} from './models';

import {
  query,
  collection,
  getFirestore,
  where,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
} from 'firebase/firestore';

import { format } from 'date-fns';
import { isSameDay, getEntryTimestamp } from './utils';
// import { rosterData } from './data/rosterData';
import { useMonthStore } from './monthStore';

export const useRosterStore = defineStore('roster', {
  state: () => ({
    allEntries: Array<RosterEntry>(),
  }),
  getters: {
    monthEntries(state) {
      const monthStore = useMonthStore();
      return state.allEntries.filter(
        (entry) =>
          entry.date >= monthStore.startDate &&
          entry.date <= monthStore.endDate &&
          entry.version == monthStore.version
      );
    },
    monthEntriesLookup(): RosterLookup {
      return this.monthEntries.reduce((lookupTable, entry) => {
        const id = getEntryTimestamp(entry.date, entry.time);
        if (lookupTable[id]) lookupTable[id].push(entry);
        else lookupTable[id] = [entry];
        return lookupTable;
      }, <RosterLookup>{});
    },
    monthVersions(state): Array<string> {
      const monthStore = useMonthStore();
      return state.allEntries
        .filter(
          (entry) =>
            entry.date >= monthStore.startDate &&
            entry.date <= monthStore.endDate
        )
        .reduce((versions, entry) => {
          if (!versions.includes(entry.version)) versions.push(entry.version);
          return versions;
        }, Array<string>());
    },
  },
  actions: {
    // getRosterAtTime(date: Date, time: Time) {
    //   return this.allEntries.filter(
    //     (entry) => entry.time == time && isSameDay(entry.date, date)
    //   );
    // },
    getRosterAtTime(date: Date, time: string) {
      const id = getEntryTimestamp(date, time);
      return this.monthEntriesLookup[id] || [];
    },

    filter(searchCriteria: SearchRosterEntry, curMonth = true) {
      return (
        (curMonth ? this.monthEntries : this.allEntries).filter((entry) => {
          if (
            (searchCriteria.version &&
              entry.version != searchCriteria.version) ||
            (searchCriteria.time && entry.time != searchCriteria.time) ||
            (searchCriteria.smo && entry.smo != searchCriteria.smo) ||
            (searchCriteria.activity &&
              entry.activity != searchCriteria.activity) ||
            (searchCriteria.date && !isSameDay(entry.date, searchCriteria.date))
          )
            return false;
          return true;
        }) || Array<RosterEntry>()
      );
    },
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
        entry.id = doc.id;
        entry.date = new Date(entry.date);
        if (!('notes' in doc.data())) entry.notes = '';
        if (!('version' in doc.data())) entry.version = 'Final';
        loadentries.push(entry as RosterEntry);
      });
      this.allEntries = loadentries;
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
        entry.id = doc.id;
        entry.date = new Date(entry.date);
        if (!('notes' in doc.data())) entry.notes = '';
        if (!('version' in doc.data())) entry.version = 'Final';
        loadentries.push(entry as RosterEntry);
      });
      this.allEntries.push(...loadentries);

      // let initialState = true;

      // // when receiving added, modified or removed changes - ignore initialState load
      // onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      //   if (initialState) {
      //     initialState = false;
      //   } else {
      //     console.log('roster.onSnapShot');
      //     const loadentries = Array<RosterEntry>();
      //     snapshot.docChanges().forEach((change) => {
      //       if (change.type == 'added')
      //         loadentries.push(change.doc.data() as RosterEntry);
      //     });
      //     console.log('added entries', loadentries.length);
      //     this.allEntries.push(...loadentries);
      //   }
      // });

      return loadentries.length;
    },
    patchEntries(newEntries: Array<RosterEntry>) {
      this.$patch((state) => {
        state.allEntries.push(...newEntries);
      });
    },

    async addRosterEntry(entry: RosterData) {
      const newEntryDocRef = doc(collection(getFirestore(), 'roster'));
      this.allEntries.push({ ...entry, id: newEntryDocRef.id });
      await setDoc(newEntryDocRef, {
        ...entry,
        id: newEntryDocRef.id,
        date: format(entry.date, 'yyyy-MM-dd'),
      });
    },

    async setRosterEntry(id: string, setEntry: SetRosterEntry) {
      const found = this.allEntries.find((entry) => entry.id == id);
      if (found) {
        if (setEntry.activity) found.activity = setEntry.activity;
        if (setEntry.notes) found.notes = setEntry.notes;
        if (setEntry.version) found.version = setEntry.version;
        const entryRef = doc(getFirestore(), 'roster', found.id);
        await setDoc(entryRef, setEntry, { merge: true });
      } else {
        throw new Error(`rosterStore.setRosterEntry: id ${id} does not exist`);
      }
    },

    async delRosterEntry(id: string) {
      const foundIndex = this.allEntries.findIndex((entry) => entry.id == id);
      if (foundIndex == -1) {
        throw new Error(
          `rosterStore.delRosterEntry: id ${id} does not exist in allEntries`
        );
      } else {
        this.allEntries.splice(foundIndex, 1);
        await deleteDoc(doc(getFirestore(), 'roster', id));
      }
    },

    async delRosterEntries(ids: Array<string>) {
      this.$patch((state) => {
        state.allEntries = state.allEntries.filter(
          (entry) => !ids.includes(entry.id)
        );
      });

      await Promise.all(
        ids.map(async (id) => {
          return await deleteDoc(doc(getFirestore(), 'roster', id));
        })
      );
    },
  },
});
