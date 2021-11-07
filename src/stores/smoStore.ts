import { defineStore } from 'pinia';
import { RosterData, SMODefinition, Time } from './models';
// import { smoData } from './data/smoData';

import { parseRRule, isSameDay } from './utils';

import {
  query,
  collection,
  getFirestore,
  // onSnapshot,
  // QuerySnapshot,
  // DocumentData,
  getDocs,
} from 'firebase/firestore';
import { useMonthStore } from './monthStore';
import { useActivityStore } from './activityStore';

// Export as JSON
// console.log(
//   JSON.stringify({
//     smos: smoData.reduce((acc, curr) => {
//       acc[curr.name] = curr;
//       return acc;
//     }, {} as Record<string, SMODefinition>),
//   })
// );

export const useSMOStore = defineStore('smo', {
  state: () => ({
    smos: [] as Array<SMODefinition>,
    viewOptions: {
      showColors: 'errors',
      showSummary: true,
      showEMG: true,
      showEEG: true,
      showCall: true,
      showWard: true,
      showWDHB: true,
      showCDHB: true,
      showBTX: true,
      showOther: true,
      availabilityLimitUnassigned: true,
    },
  }),
  getters: {
    activeSMOs(state) {
      const monthStore = useMonthStore();
      return state.smos.filter((smo) => {
        if (smo.endDate && smo.endDate < monthStore.startDate) return false;
        return true;
      });
    },
    visibleSMOs(state): Array<string> {
      const res: Array<string> = [];
      if (state.viewOptions.showCDHB) res.push(...['MMH', 'MSC']);
      if (state.viewOptions.showWDHB) res.push(...['NSH', 'WTH']);
      if (state.viewOptions.showWard) res.push(...['Neuro', 'Stroke']);
      if (state.viewOptions.showEMG) res.push('EMG');
      if (state.viewOptions.showEEG) res.push('EEG');
      if (state.viewOptions.showBTX) res.push('BTX');
      if (state.viewOptions.showCall) res.push('Call');
      const activityStore = useActivityStore();
      if (state.viewOptions.showOther)
        res.push(
          ...activityStore.activities
            .filter(
              (activity) =>
                ![
                  'MMH',
                  'MSC',
                  'NSH',
                  'WTH',
                  'Neuro',
                  'Stroke',
                  'EMG',
                  'EEG',
                  'BTX',
                  'Call',
                ].includes(activity.name)
            )
            .map((activity) => activity.name)
        );
      return res;
    },

    filteredSMOs(): Array<SMODefinition> {
      return this.activeSMOs
        .filter((smo) => {
          return smo.activities.some((activity) => {
            if (this.visibleSMOs.includes(activity)) return true;
            else return false;
          });
        })
        .sort((a, b) => {
          if (a.group == b.group) {
            const aname =
              a.name.substr(-1) + a.name.substr(0, a.name.length - 1);
            const bname =
              b.name.substr(-1) + b.name.substr(0, b.name.length - 1);
            if (aname < bname) return -1;
            if (aname > bname) return 1;
            return 0;
          } else return a.group - b.group;
        });
    },
    filteredSMOs2(): Array<SMODefinition> {
      return this.filteredSMOs.reduce(
        (a, i) => a.concat(i, i),
        Array<SMODefinition>()
      );
    },
  },
  actions: {
    async loadFromFirestore(): Promise<void> {
      console.log('smoStore.loadFromFirestore');

      const q = query(collection(getFirestore(), 'smos'));
      const qss = await getDocs(q);
      const loadsmos = Array<SMODefinition>();
      qss.forEach((doc) => {
        const docData = doc.data() as SMODefinition;
        if (docData.endDate) docData.endDate = new Date(docData.endDate);
        loadsmos.push(docData);
      });
      this.smos = loadsmos;
      console.log(' - Loaded smos', this.smos.length);
      // onSnapshot(mysmos, (snapshot: QuerySnapshot<DocumentData>) => {
      //   snapshot.docChanges().forEach((change) => {
      //     if (change.type == 'added')
      //       this.smos.push(change.doc.data() as SMODefinition);
      //   });
      // });
    },
    getSMO(smoName: string) {
      const smo = this.smos.find((smo) => smo.name == smoName);
      if (!smo) throw new Error(`Activity ${smoName} is not defined`);
      return smo;
    },

    getCapableSMOs(activityName: string) {
      return this.activeSMOs.filter((smo) => {
        return smo.activities.includes(activityName);
      });
    },

    // smo is capable and is available at this date and time
    getAvailableSMOs(date: Date, time: Time, activityName: string) {
      return this.activeSMOs.filter((smo) => {
        return (
          smo.activities.includes(activityName) &&
          smo.allowedDates &&
          smo.allowedDates[time].some((smoDate) => isSameDay(smoDate, date))
        );
      });
    },

    isAllowedTimeSMO(date: Date, time: Time, smoName: string): boolean {
      const smo = this.getSMO(smoName);
      if (!smo.allowedDates)
        throw new Error('allowed smo dates are not compiled');
      return smo.allowedDates[time].some((smoDate) => isSameDay(smoDate, date));
    },

    isAllowedActivitySMO(activityName: string, smoName: string): boolean {
      return this.getSMO(smoName).activities.includes(activityName);
    },

    compile(dates: Date[]) {
      this.activeSMOs.forEach((smo) => {
        // console.log('Compiling smo ', smo.name);

        smo.allowedDates = {
          AM: [...dates],
          PM: [...dates],
        };
        smo.NCT.forEach((nct) => {
          const amNCTDates = parseRRule(
            nct.AM,
            dates[0],
            dates[dates.length - 1]
          );
          const pmNCTDates = parseRRule(
            nct.PM,
            dates[0],
            dates[dates.length - 1]
          );

          // remove each NCT date from allowedDates
          amNCTDates.forEach((amNCTDate) => {
            const index = smo.allowedDates?.AM.findIndex((date) =>
              isSameDay(date, amNCTDate)
            );
            if (typeof index != 'undefined' && index > -1) {
              smo.allowedDates?.AM.splice(index, 1);
            }
          });
          pmNCTDates.forEach((pmNCTDate) => {
            const index = smo.allowedDates?.PM.findIndex((date) =>
              isSameDay(date, pmNCTDate)
            );
            if (typeof index != 'undefined' && index > -1)
              smo.allowedDates?.PM.splice(index, 1);
          });
        });
      });
    },
    getNCTEntries(startDate: Date, endDate: Date) {
      const entries = Array<RosterData>();
      this.activeSMOs.forEach((smo) => {
        if (smo.generateNCT) {
          smo.NCT.forEach((nct) => {
            parseRRule(nct.AM, startDate, endDate).forEach((date) =>
              entries.push({
                date,
                time: 'AM',
                smo: smo.name,
                activity: nct.name,
                notes: '',
                version: '',
              })
            );
            parseRRule(nct.PM, startDate, endDate).forEach((date) =>
              entries.push({
                date,
                time: 'PM',
                smo: smo.name,
                activity: nct.name,
                notes: '',
                version: '',
              })
            );
          });
        }
      });
      return entries;
    },
    getRegularEntries(startDate: Date, endDate: Date) {
      const entries = Array<RosterData>();
      this.activeSMOs.forEach((smo) => {
        if (smo.regular)
          smo.regular.forEach((regular) => {
            parseRRule(regular.AM, startDate, endDate).forEach((date) =>
              entries.push({
                date,
                time: 'AM',
                smo: smo.name,
                activity: regular.name,
                notes: '',
                version: '',
              })
            );
            parseRRule(regular.PM, startDate, endDate).forEach((date) =>
              entries.push({
                date,
                time: 'PM',
                smo: smo.name,
                activity: regular.name,
                notes: '',
                version: '',
              })
            );
          });
      });
      return entries;
    },

    getCRSEntries(startDate: Date, endDate: Date) {
      const entries = Array<RosterData>();
      this.activeSMOs.forEach((smo) => {
        if (smo.activities.includes('CRS'))
          parseRRule('every Thursday', startDate, endDate).forEach((date) =>
            entries.push({
              date,
              time: 'PM',
              smo: smo.name,
              activity: 'CRS',
              notes: '',
              version: '',
            })
          );
      });
      return entries;
    },
    showAll() {
      this.viewOptions.showEMG = true;
      this.viewOptions.showEEG = true;
      this.viewOptions.showBTX = true;
      this.viewOptions.showCall = true;
      this.viewOptions.showWard = true;
      this.viewOptions.showWDHB = true;
      this.viewOptions.showCDHB = true;
      this.viewOptions.showOther = true;
    },
    showNone() {
      this.viewOptions.showEMG = false;
      this.viewOptions.showEEG = false;
      this.viewOptions.showBTX = false;
      this.viewOptions.showCall = false;
      this.viewOptions.showWard = false;
      this.viewOptions.showWDHB = false;
      this.viewOptions.showCDHB = false;
      this.viewOptions.showOther = false;
    },
  },
});
