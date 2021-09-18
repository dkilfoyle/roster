import { defineStore } from 'pinia';
import { ActivityDefinition } from './activities';
import { RosterEntry, Time } from './roster';
import { smoData } from './data/smoData';

import { parseRRule, isSameDay } from './utils';

export interface SMODefinition {
  name: string;
  fullName: string;
  endDate: Date | null;
  activities: Array<string>;
  NCT: Array<ActivityDefinition>;
  allowedDates?: {
    AM: Array<Date>;
    PM: Array<Date>;
  };
}

export const useSMOStore = defineStore('smo', {
  state: () => ({
    smos: smoData,
    viewOptions: {
      showErrors: true,
      showSummary: true,
      showEMG: true,
      showEEG: true,
      showCall: true,
      showWard: true,
      showWDHB: true,
      showCDHB: true,
    },
  }),
  getters: {
    visibleSMOs(state): Array<string> {
      const res: Array<string> = [];
      if (state.viewOptions.showCDHB) res.push('MMH');
      if (state.viewOptions.showWDHB) res.push(...['NSH', 'WTH']);
      if (state.viewOptions.showWard) res.push(...['Neuro', 'Stroke']);
      if (state.viewOptions.showEMG) res.push('EMG');
      if (state.viewOptions.showEEG) res.push('EEG');
      if (state.viewOptions.showCall) res.push('Call');
      return res;
    },

    filteredSMOs(state) {
      return state.smos.filter((smo) =>
        smo.activities.some((activity) => {
          if (this.visibleSMOs.includes(activity)) return true;
          else return false;
        })
      );
    },
  },
  actions: {
    getSMO(smoName: string) {
      const smo = this.smos.find((smo) => smo.name == smoName);
      if (!smo) throw new Error(`Activity ${smoName} is not defined`);
      return smo;
    },
    getAllowedSMOs(date: Date, activityName: string) {
      return this.smos.filter((smo) => {
        if (smo.endDate && date > smo.endDate) return false;
        return smo.activities.includes(activityName);
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
      this.smos.forEach((smo) => {
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
      const entries = Array<RosterEntry>();
      this.smos.forEach((smo) => {
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
      });
      return entries;
    },
  },
});
