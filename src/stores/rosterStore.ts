import { defineStore } from 'pinia';
import {
  RosterData,
  RosterEntry,
  SetRosterEntry,
  SearchRosterEntry,
  RosterLookup,
  Time,
  CostMonth,
  CostEntry,
  CostSession,
  CostDate,
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
import { useActivityStore } from './activityStore';
import { useStore } from './store';
import { useSMOStore } from './smoStore';
import { SSL_OP_NO_TLSv1_1 } from 'constants';

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
        .reduce(
          (versions, entry) => {
            if (!versions.includes(entry.version)) versions.push(entry.version);
            return versions;
          },
          ['Final']
        );
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

    exists(searchCriteria: SearchRosterEntry, curMonth = true) {
      const searchEntries = curMonth ? this.monthEntries : this.allEntries;
      return searchEntries.some((entry) => {
        if (
          (searchCriteria.version && entry.version != searchCriteria.version) ||
          (searchCriteria.time && entry.time != searchCriteria.time) ||
          (searchCriteria.smo && entry.smo != searchCriteria.smo) ||
          (searchCriteria.activity &&
            entry.activity != searchCriteria.activity) ||
          (searchCriteria.date && !isSameDay(entry.date, searchCriteria.date))
        )
          return false;
        return true;
      });
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

    anneal() {
      const activityStore = useActivityStore();
      const monthStore = useMonthStore();
      const smoStore = useSMOStore();
      const store = useStore();

      // build list of shufflable activities
      const shufflableActivities = activityStore.activities
        .filter(
          (activity) =>
            activity.type != 'Leave' &&
            activity.name != 'Neuro' &&
            activity.name != 'Stroke' &&
            activity.name != 'CRS'
        )
        .map((x) => x.name);

      const sol: CostMonth = { cost: 0, oldcost: 0, dates: {} };

      // build initial solution
      // fill sol with appropriate dates,times,smos excluding any unchangeable sessions such as leave/ward with random activity
      monthStore.dates.forEach((date) => {
        if (store.isHoliday(date)) return;
        smoStore.activeSMOs.forEach((smo) => {
          (['AM', 'PM'] as Array<Time>).forEach((time) => {
            // exclude session if already assigned to Leave or Ward
            if (
              this.getRosterAtTime(date, time).some((entry) => {
                return (
                  entry.smo == smo.name &&
                  shufflableActivities.includes(entry.activity) == false
                );
              })
            )
              return;

            // choose a random (?allowable) activity
            const entry = {
              date,
              time,
              smo: smo.name,
              activity:
                shufflableActivities[
                  Math.random() * shufflableActivities.length
                ],
              version: 'anneal',
              cost: 0,
              oldcost: 0,
            };

            const dateStr = 'D' + format(date, 'yyyyMMdd');

            entry.cost = getEntryCost(entry);
            if (!sol.dates[dateStr])
              sol.dates[dateStr] = {
                cost: 0,
                oldcost: 0,
                date,
              };
            const solDate = sol.dates[dateStr];
            if (!solDate[time])
              solDate[time] = {
                date,
                time,
                cost: 0,
                oldcost: 0,
                entries: [entry],
              };
            const solSession = solDate[time];
            if (solSession) solSession.entries.push(entry);
          });
        });
      });

      this.getCost(sol);
      let T = 1.0;
      const T_min = 0.00001;
      const alpha = 0.9;
      while (T > T_min) {
        let i = 1;
        while (i <= 100) {
          const {
            day: day1,
            session: session1,
            entry: entry1,
          } = this.getRandomEntry(sol);
          const {
            day: day2,
            session: session2,
            entry: entry2,
          } = this.getRandomEntry(sol);

          this.swap(sol, day1, session1, entry1, day2, session2, entry2);

          const ap = this.acceptance_probability(sol.oldcost, sol.cost, T);
          if (ap <= Math.random()) {
            // reject swap, revert to pre swap
            this.swap(sol, day1, session1, entry1, day2, session2, entry2);
          }
          i += 1;
        }
        T = T * alpha;
      }
      return sol;
    },

    getRandomEntry(sol: CostMonth) {
      let i = 0;
      while (i < 100) {
        const date = Object.keys(sol.dates)[
          Math.random() * (Object.keys(sol.dates).length - 1)
        ];
        const times = ['AM', 'PM'] as Array<Time>;
        const time = times[Math.random()];

        const day = sol.dates[date];
        if (day) {
          const session = day[time];
          if (session) {
            return {
              day,
              session,
              entry:
                session.entries[Math.random() * (session.entries.length - 1)],
            };
          }
        }
        i++;
      }
      throw new Error('Unable to find random entry');
    },

    swap(
      sol: CostMonth,
      day1: CostDate,
      session1: CostSession,
      entry1: CostEntry,
      day2: CostDate,
      session2: CostSession,
      entry2: CostEntry
    ) {
      // swap activity
      const entry1activity = entry1.activity;
      entry1.activity = entry2.activity;
      entry2.activity = entry1activity;

      const entry1deltacost = -1 * (entry1.cost - getEntryCost(entry1));
      const entry2deltacost = -1 * (entry2.cost - getEntryCost(entry2));

      const session1deltacost = -1 * (session1.cost - getSessionCost(session1));
      const session2deltacost = -1 * (session2.cost - getSessionCost(session2));

      const day1deltacost = -1 * (day1.cost - getDayCost(day1));
      const day2deltacost = -1 * (day2.cost - getDayCost(day2));

      sol.oldcost = sol.cost;
      sol.cost +=
        entry1deltacost +
        entry2deltacost +
        session1deltacost +
        session2deltacost +
        day1deltacost +
        day2deltacost;
    },

    unswap(
      sol: CostMonth,
      day1: CostDate,
      session1: CostSession,
      entry1: CostEntry,
      day2: CostDate,
      session2: CostSession,
      entry2: CostEntry
    ) {
      sol.cost = sol.oldcost;
      day1.cost = day1.oldcost;
      day2.cost = day2.oldcost;
      session1.cost = session1.oldcost;
      session2.cost = session2.oldcost;
      entry1.cost = entry1.oldcost;
      entry2.cost = entry2.oldcost;
      const entry1oldactivity = entry1.activity;
      entry1.activity = entry2.activity;
      entry2.activity = entry1oldactivity;
    },

    acceptance_probability(old_cost: number, new_cost: number, T: number) {
      return 0;
    },

    getCost(sol: CostMonth) {
      let entriesCost = 0;
      let sessionsCost = 0;
      Object.keys(sol).forEach((date) => {
        Object.keys(sol[date]).forEach((time) => {
          // sum cost of each entry
          entriesCost += sol[date][time].reduce(
            (accum, entry) => accum + getEntryCost(entry),
            0
          );

          // sum cost of each session
          sessionsCost += getSessionCost(sol, date, time);
        });
      });
      return 0;
    },

    getEntryCost(entry: CostEntry) {
      const smoStore = useSMOStore();
      const activityStore = useActivityStore();
      let cost = 0;

      // smo is not capable of this activity
      if (
        smoStore.getSMO(entry.smo).activities.includes(entry.activity) == false
      )
        cost += 10;

      // activity is not rosterable at this time
      if (
        activityStore.isAllowedActivity(
          entry.date,
          entry.time,
          entry.activity
        ) == false
      )
        cost += 7;

      // smo is not rosterable at this time
      if (smoStore.isAllowedTimeSMO(entry.date, entry.time, entry.smo) == false)
        cost += 5;

      entry.oldcost = entry.cost;
      entry.cost = cost;
      return cost;
    },

    getSessionCost(session: CostSession) {
      const activityStore = useActivityStore();
      let cost = 0;

      const activityCount: Record<string, number> = {};
      session.entries.forEach((entry) => {
        if (!activityCount[entry.activity]) activityCount[entry.activity] = 1;
        else activityCount[entry.activity] = activityCount[entry.activity] + 1;
      });

      Object.keys(activityCount).forEach((activityName) => {
        const activity = activityStore.getActivity(activityName);
        if (activity && activity.perSession) {
          const rule = activity.perSession;
          if (Array.isArray(rule)) {
            if (activityCount[activityName] < rule[0])
              cost = cost + (activityName == 'DSR' ? 3 : 1);
            if (activityCount[activityName] > rule[1]) cost = cost + 1;
          } else {
            if (activityCount[activityName] != rule) cost = cost + 3;
          }
        }
      });

      session.oldcost = session.cost;
      session.cost = cost;
      return cost;
    },

    getDayCost(day: CostDate) {
      const activityStore = useActivityStore();
      let cost = 0;

      const activityCount: Record<string, number> = {};
      const addActivity = (entry: CostEntry) => {
        if (!activityCount[entry.activity]) activityCount[entry.activity] = 1;
        else activityCount[entry.activity] = activityCount[entry.activity] + 1;
      };

      if (day.AM) day.AM.entries.forEach(addActivity);
      if (day.PM) day.PM.entries.forEach(addActivity);

      Object.keys(activityCount).forEach((activityName) => {
        const activity = activityStore.getActivity(activityName);
        if (activity && activity.perDay) {
          const rule = activity.perDay;
          if (Array.isArray(rule)) {
            if (activityCount[activityName] < rule[0]) cost = cost + 1;
            if (activityCount[activityName] > rule[1]) cost = cost + 1;
          } else {
            if (activityCount[activityName] != rule) cost = cost + 3;
          }
        }
      });

      day.oldcost = day.cost;
      day.cost = cost;
      return cost;
    },

    getWeekCost(sol) {
      // not enough EEG
      // not enough EMG
      return 0;
    },
  },
});
