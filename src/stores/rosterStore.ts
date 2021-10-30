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
  CostWeek,
  Cost,
  Costs,
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

import { format, getWeek } from 'date-fns';
import { isSameDay, getEntryTimestamp } from './utils';
// import { rosterData } from './data/rosterData';
import { useMonthStore } from './monthStore';
import { useActivityStore } from './activityStore';
import { useStore } from './store';
import { useSMOStore } from './smoStore';

function sumObjectsByKey(objs: Record<string, number>[]) {
  return objs.reduce((a, b) => {
    for (const k in b) {
      if (b.hasOwnProperty(k)) a[k] = (a[k] || 0) + b[k];
    }
    return a;
  }, {});
}

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

      const sol: CostMonth = { cost: 0, oldcost: 0, weeks: {} };

      // build initial solution
      // fill sol with appropriate dates,times,smos excluding any unchangeable sessions such as leave/ward with random activity
      monthStore.dates.slice(0, 10).forEach((date) => {
        if (store.isHoliday(date)) return;
        smoStore.activeSMOs.slice(0, 5).forEach((smo) => {
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
                this.getRandomElement(shufflableActivities) ||
                'UnknownActivity',
              version: 'anneal',
              cost: 0,
              oldcost: 0,
            };

            const dateStr = 'D' + format(date, 'yyyyMMdd');
            const week = getWeek(date) - getWeek(monthStore.startDate);
            const weekStr = 'W' + week.toString();

            this.getEntryCost(entry);

            if (!sol.weeks[weekStr])
              sol.weeks[weekStr] = {
                week,
                cost: 0,
                oldcost: 0,
                dates: {},
                activityCount: this.getZeroActivityCount(),
              };
            if (!sol.weeks[weekStr].dates[dateStr])
              sol.weeks[weekStr].dates[dateStr] = {
                date,
                cost: 0,
                oldcost: 0,
                activityCount: this.getZeroActivityCount(),
              };
            if (!sol.weeks[weekStr].dates[dateStr][time])
              sol.weeks[weekStr].dates[dateStr][time] = {
                date,
                time,
                cost: 0,
                oldcost: 0,
                entries: [entry],
                activityCount: this.getZeroActivityCount(),
              };

            const session = sol.weeks[weekStr].dates[dateStr][time];
            if (!session) throw new Error('Missing session');
            else session.entries.push(entry);
          });
        });
      });

      this.getCost(sol);
      let T = 1000;
      const T_min = 100;
      const alpha = 0.9;
      while (T > T_min) {
        let i = 1;
        console.log(`T=${T.toFixed(3)}: StartCost=${sol.cost}`);
        let numlowercost = 0;
        let numhighercost = 0;
        let numrejected = 0;
        while (i <= 100) {
          const a = this.getRandomEntry(sol);
          const b = this.getRandomEntry(sol);

          this.swap(sol, a, b);

          if (this.getDeltaCost(sol) <= 0) {
            // keep swap
            numlowercost++;
          } else {
            const ap = this.acceptance_probability(sol.oldcost, sol.cost, T);
            // console.log(
            //   'ap: ',
            //   ap,
            //   sol.oldcost,
            //   sol.cost,
            //   this.getDeltaCost(sol)
            // );
            if (ap > Math.random()) {
              // keep swap despite higher cost
              // console.log('keep despite higher cost');
              numhighercost++;
            } else {
              // reject swap, revert to pre swap
              // console.log('reject');
              numrejected++;
              this.unswap(sol, a, b);
            }
          }

          i += 1;
        }
        console.log(
          `-- EndCost: ${sol.cost}, NumLowerCost: ${numlowercost}, NumHigherCostAccepted: ${numhighercost}, NumHigherCostRejected: ${numrejected}`
        );
        T = T * alpha;
      }
      return sol;
    },

    getZeroActivityCount() {
      const activityStore = useActivityStore();
      const activityCount: Record<string, number> = {};
      activityStore.activityNames.forEach((activity) => {
        activityCount[activity] = 0;
      });
      return activityCount;
    },

    getRandomElement<T>(arr: T[]) {
      return arr.length
        ? arr[Math.floor(Math.random() * arr.length)]
        : undefined;
    },

    getRandomEntry(sol: CostMonth) {
      let i = 0;
      while (i < 100) {
        i++;

        const week = this.getRandomElement(Object.values(sol.weeks));
        if (!week) continue;
        const day = this.getRandomElement(Object.values(week.dates));
        if (!day) continue;
        const time = this.getRandomElement(['AM', 'PM'] as Array<Time>);
        if (!time) continue;
        const session = day[time];
        if (!session) continue;
        const entry = this.getRandomElement(session.entries);

        if (entry)
          return {
            week,
            day,
            session,
            entry,
          };
      }
      throw new Error('Unable to find random entry after 100 iterations');
    },

    swap(sol: CostMonth, a: Costs, b: Costs) {
      // swap activity

      // console.log('Preswap');
      // console.log('a.entry: ', a.entry.smo, a.entry.activity, a.entry.cost);
      // console.log('b.entry: ', b.entry.smo, b.entry.activity, b.entry.cost);

      a.session.activityCount[a.entry.activity] -= 1;
      b.session.activityCount[b.entry.activity] -= 1;
      a.day.activityCount[a.entry.activity] -= 1;
      b.day.activityCount[b.entry.activity] -= 1;
      a.week.activityCount[a.entry.activity] -= 1;
      b.week.activityCount[b.entry.activity] -= 1;

      const entry1activity = a.entry.activity;
      a.entry.activity = b.entry.activity;
      b.entry.activity = entry1activity;

      a.session.activityCount[a.entry.activity] += 1;
      b.session.activityCount[b.entry.activity] += 1;
      a.day.activityCount[a.entry.activity] += 1;
      b.day.activityCount[b.entry.activity] += 1;
      a.week.activityCount[a.entry.activity] += 1;
      b.week.activityCount[b.entry.activity] -= 1;

      this.getEntryCost(a.entry);
      this.getEntryCost(b.entry);
      this.getSessionCost(a.session);
      this.getSessionCost(b.session);
      this.getDayCost(a.day);
      this.getDayCost(b.day);
      this.getWeekCost(a.week);
      this.getWeekCost(b.week);

      // console.log('Postswap');
      // console.log(
      //   'a.entry: ',
      //   a.entry.smo,
      //   a.entry.activity,
      //   a.entry.cost,
      //   this.getDeltaCost(a.entry)
      // );
      // console.log(
      //   'b.entry: ',
      //   b.entry.smo,
      //   b.entry.activity,
      //   b.entry.cost,
      //   this.getDeltaCost(b.entry)
      // );

      sol.oldcost = sol.cost;
      sol.cost +=
        this.getDeltaCost(a.entry) +
        this.getDeltaCost(b.entry) +
        this.getDeltaCost(a.session) +
        this.getDeltaCost(b.session) +
        this.getDeltaCost(a.day) +
        this.getDeltaCost(b.day) +
        this.getDeltaCost(a.week) +
        this.getDeltaCost(b.week);
    },

    unswap(sol: CostMonth, a: Costs, b: Costs) {
      sol.cost = sol.oldcost;
      a.week.cost = a.week.oldcost;
      b.week.cost = b.week.oldcost;
      a.day.cost = a.day.oldcost;
      b.day.cost = b.day.oldcost;
      a.session.cost = a.session.oldcost;
      b.session.cost = b.session.oldcost;
      a.entry.cost = a.entry.oldcost;
      b.entry.cost = b.entry.oldcost;
      const entry1oldactivity = a.entry.activity;
      a.entry.activity = b.entry.activity;
      b.entry.activity = entry1oldactivity;
    },

    acceptance_probability(old_cost: number, new_cost: number, T: number) {
      return Math.exp(-(new_cost - old_cost) / T);
    },

    getCost(sol: CostMonth) {
      let entriesCost = 0;
      let sessionsCost = 0;
      let daysCost = 0;
      let weeksCost = 0;
      Object.values(sol.weeks).forEach((week) => {
        Object.values(week.dates).forEach((day) => {
          (['AM', 'PM'] as Array<Time>).forEach((time) => {
            const session = day[time];
            if (session) {
              entriesCost += session.entries.reduce(
                (accum, entry) => accum + this.getEntryCost(entry),
                0
              );
              sessionsCost += this.getSessionCost(session);
            }
          });
          daysCost += this.getDayCost(day);
        });
        weeksCost = +this.getWeekCost(week);
      });
      console.log(entriesCost, sessionsCost, daysCost, weeksCost);
      const totalCost = entriesCost + sessionsCost + daysCost + weeksCost;
      sol.oldcost = sol.cost;
      sol.cost = totalCost;
    },

    getDeltaCost(timespan: Cost) {
      return timespan.cost - timespan.oldcost;
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

    getTimespanCost(timespan: CostWeek | CostDate | CostSession, rule: string) {
      const activityStore = useActivityStore();
      let cost = 0;
      Object.keys(timespan.activityCount).forEach((activityName) => {
        const activity = activityStore.getActivity(activityName) as Record<
          string,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          any
        >;
        if (activity && activity[rule]) {
          if (Array.isArray(activity.rule)) {
            if (timespan.activityCount[activityName] < activity.rule[0])
              cost = cost + 1;
            if (timespan.activityCount[activityName] > activity.rule[1])
              cost = cost + 1;
          } else {
            if (timespan.activityCount[activityName] != activity.rule)
              cost = cost + 3;
          }
        }
      });
      return cost;
    },

    getSessionCost(session: CostSession) {
      const activityCount = session.activityCount;
      session.entries.forEach((entry) => {
        if (activityCount[entry.activity])
          activityCount[entry.activity] = activityCount[entry.activity] + 1;
      });

      session.oldcost = session.cost;
      session.cost = this.getTimespanCost(session, 'perSession');
      return session.cost;
    },

    getDayCost(day: CostDate) {
      day.activityCount = sumObjectsByKey([
        day.AM ? day.AM.activityCount : {},
        day.PM ? day.PM.activityCount : {},
      ]);

      day.oldcost = day.cost;
      day.cost = this.getTimespanCost(day, 'perDay');
      return day.cost;
    },

    getWeekCost(week: CostWeek) {
      week.activityCount = sumObjectsByKey(
        Object.values(week.dates).map((day) => day.activityCount)
      );

      week.oldcost = week.cost;
      week.cost = this.getTimespanCost(week, 'perWeek');
      return week.cost;
    },
  },
});
