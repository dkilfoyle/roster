import { defineStore } from 'pinia';
import { roster, RosterEntry } from './roster';
import { smos } from './smos';
import { activities } from './activities';
import { holidays } from './holidays';

import {
  addDays,
  eachDayOfInterval,
  format,
  isSameDay,
  isWeekend,
  subDays,
  isMonday,
  nextMonday,
  differenceInWeeks,
} from 'date-fns';
import { RRule } from 'rrule';

export type Time = 'AM' | 'PM';

export const getFirstMonday = (year: number, month: number) => {
  const d = new Date(year, month, 1);
  if (isMonday(d)) return d;
  else return nextMonday(d);
};

export const useStore = defineStore('main', {
  state: () => ({
    version: '0.1',
    startDate: getFirstMonday(new Date().getFullYear(), new Date().getMonth()),
    numWeeks: 1,
    showWeekend: false,
    rosterAll: roster,
    smos,
    activities,
    compiled: false,
    holidays,
  }),
  getters: {
    monthName: (state) => {
      return format(state.startDate, 'MMM yyyy');
    },
    roster(state): Array<RosterEntry> {
      return state.compiled
        ? state.rosterAll.filter(
            (entry) =>
              entry.date >= state.startDate && entry.date <= this.endDate
          )
        : [];
    },
    endDate: (state) => addDays(state.startDate, state.numWeeks * 7 - 1),
    dates(state): Array<Date> {
      return eachDayOfInterval({
        start: state.startDate,
        end: this.endDate,
      }).filter((date) => state.showWeekend || !isWeekend(date));
    },
    activityNames: (state) => state.activities.map((activity) => activity.name),
  },
  actions: {
    setMonth(year: number, month: number, numWeeks?: number) {
      console.log('setMonth', year, month, numWeeks);
      this.startDate = getFirstMonday(year, month);

      if (typeof numWeeks == 'undefined') {
        const nextFirstMonday = getFirstMonday(
          month == 11 ? year + 1 : year,
          (month + 1) % 12
        );
        this.numWeeks = differenceInWeeks(nextFirstMonday, this.startDate);
      } else this.numWeeks = numWeeks;

      this.compileActivities();
      this.compileSMOs();
      this.compiled = true;
    },
    compileActivities() {
      this.activities.forEach((activity) => {
        console.log('Compiling activity ', activity.name);
        activity.allowedDates = {
          AM: this.parseRRule(activity.AM),
          PM: this.parseRRule(activity.PM),
        };
      });
    },
    compileSMOs() {
      this.smos.forEach((smo) => {
        console.log('Compiling smo ', smo.name);
        smo.allowedDates = {
          AM: [...this.dates],
          PM: [...this.dates],
        };
        smo.NCT.forEach((nct) => {
          const amNCTDates = this.parseRRule(nct.AM);
          const pmNCTDates = this.parseRRule(nct.PM);

          // remove each NCT date from allowedDates
          amNCTDates.forEach((amNCTDate) => {
            const index = smo.allowedDates?.AM.findIndex((date) =>
              isSameDay(date, amNCTDate)
            );
            if (typeof index != 'undefined' && index > -1)
              smo.allowedDates?.AM.splice(index, 1);
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
    generateNCT() {
      // run only when creating new month otherwise
      console.log(
        'Warning: compile SMOs will reset any existing NCT times back to NCT default'
      );
      this.smos.forEach((smo) => {
        smo.NCT.forEach((nct) => {
          this.parseRRule(nct.AM).forEach((date) =>
            this.setRoster(date, 'AM', smo.name, nct.name)
          );
          this.parseRRule(nct.PM).forEach((date) =>
            this.setRoster(date, 'PM', smo.name, nct.name)
          );
        });
      });
    },
    parseRRule(rule: string) {
      const r = RRule.fromText(rule);
      r.options.dtstart = new Date('2010-01-01');
      return r
        .between(this.startDate, this.endDate, true)
        .map((date) => subDays(date, 1));
    },

    /**
     * set activity for date/time/smo, create new roster entry if needed
     */
    setRoster(date: Date, time: Time, smoName: string, activityName: string) {
      const found = roster.find(
        (entry) =>
          entry.date == date && entry.time == time && entry.smo == smoName
      );
      if (found) {
        found.activity == activityName;
      } else {
        this.rosterAll.push({
          date,
          time,
          smo: smoName,
          activity: activityName,
        });
      }
    },

    isHoliday(date: Date) {
      return this.holidays.some((x) => isSameDay(x, date));
    },

    getActivity(activityName: string) {
      const activity = this.activities.find(
        (activity) => activity.name == activityName
      );
      if (!activity) throw new Error(`Activity ${activityName} is not defined`);
      return activity;
    },
    getSMO(smoName: string) {
      const activity = this.smos.find((smo) => smo.name == smoName);
      if (!activity) throw new Error(`Activity ${smoName} is not defined`);
      return activity;
    },

    // ActivityView utilities

    getAssignedSMOs(date: Date, time: Time, activityName: string) {
      return this.roster.filter(
        (entry) =>
          isSameDay(entry.date, date) &&
          entry.time == time &&
          entry.activity == activityName
      );
    },
    getAllowedSMOs(date: Date, activityName: string) {
      return this.smos.filter((smo) => {
        if (smo.endDate && date > smo.endDate) return false;
        return smo.activities.includes(activityName);
      });
    },

    /**
     * Is activity allowed to be scheduled this date and time
     */
    isAllowedActivity(date: Date, time: Time, activityName: string) {
      const activity = this.getActivity(activityName);
      if (!activity.allowedDates)
        throw new Error('activities are not compiled');
      return activity.allowedDates[time].some((activityDate) =>
        isSameDay(activityDate, date)
      );
    },
    /**
     * Is activity valid at this date time - allowed to be scheduled, within allocation limits
     */
    isValidActivity(date: Date, time: Time, activityName: string) {
      const result = {
        answer: true,
        reasons: Array<string>(),
      };

      const foundDateMatches = this.roster.filter(
        (entry) => isSameDay(entry.date, date) && entry.activity == activityName
      );
      const foundTimeMatches = foundDateMatches.filter(
        (entry) => entry.time == time
      );

      const isAllowedActivity = this.isAllowedActivity(
        date,
        time,
        activityName
      );

      if (!isAllowedActivity) {
        if (foundTimeMatches.length == 0) {
          return result;
        } else
          result.reasons.push(
            `Did not expect ${activityName} at this date and time`
          );
      }

      const activity = this.getActivity(activityName);

      const getMinMax = (x: [number, number] | number) => {
        return Array.isArray(x) ? x : [x, x];
      };

      if (activity.perSession) {
        const minMax = getMinMax(activity.perSession);
        if (foundTimeMatches.length < minMax[0]) {
          result.reasons.push(
            `PerSession: expected >= ${minMax[0]}, found ${foundTimeMatches.length}`
          );
        }
        if (foundTimeMatches.length > minMax[1]) {
          result.reasons.push(
            `PerDay: expected <= ${minMax[1]}, found ${foundTimeMatches.length}`
          );
        }
      }

      if (activity.perDay) {
        const minMax = getMinMax(activity.perDay);
        if (foundDateMatches.length < minMax[0]) {
          result.reasons.push(
            `PerDay: expected >= ${minMax[0]}, found ${foundDateMatches.length}`
          );
        }
        if (foundDateMatches.length > minMax[1]) {
          result.reasons.push(
            `PerDay: expected <= ${minMax[1]}, found ${foundDateMatches.length}`
          );
        }
      }

      result.answer = result.reasons.length == 0;
      // console.log(date, time, activityName, result);
      return result;
    },

    // SmoView utilities

    getAssignedActivities(date: Date, time: Time, smoName: string) {
      return this.roster.filter(
        (entry) =>
          isSameDay(entry.date, date) &&
          entry.time == time &&
          entry.smo == smoName &&
          entry.activity != 'Call'
      );
    },
    getAllowedActivities(smoName: string) {
      return this.getSMO(smoName).activities;
    },

    /**
     * Is SMO allowed to be scheduled this date and time
     */
    isAllowedSMO(date: Date, time: Time, smoName: string) {
      const smo = this.getSMO(smoName);
      if (!smo.allowedDates)
        throw new Error('allowed smo dates are not compiled');
      return smo.allowedDates[time].some((smoDate) => isSameDay(smoDate, date));
    },

    /**
     * Is smo valid at this date time - allowed to be scheduled, not already scheduled elsewhere
     */
    isValidSMO(date: Date, time: Time, smoName: string) {
      const result = {
        answer: true,
        reasons: Array<string>(),
      };

      const assignedActivities = this.getAssignedActivities(
        date,
        time,
        smoName
      );

      // test if SMO already assigned to another activity at same date and time
      if (assignedActivities.length > 1) {
        result.reasons.push(
          `${smoName} is already assigned to ${assignedActivities
            .map((x) => x.activity)
            .join(',')}`
        );
      } else if (assignedActivities.length == 0) {
        if (this.isAllowedSMO(date, time, smoName))
          result.reasons.push(`${smoName} awaiting assignment`);
      } else {
        // foundTimeMatches.length == 1
        const activityName = assignedActivities[0].activity;
        if (
          !this.isAllowedSMO(date, time, smoName) &&
          !['NCT', 'WDHB', 'CDHB', 'UNI'].includes(activityName)
        ) {
          result.reasons.push(`${smoName} is not contracted`);
        }

        if (
          !this.getAllowedActivities(smoName).includes(
            assignedActivities[0].activity
          )
        ) {
          result.reasons.push(
            `${assignedActivities[0].activity} is not an allowed activity for ${smoName}`
          );
        }
      }

      result.answer = result.reasons.length == 0;
      // console.log(date, time, activityName, result);
      return result;
    },
  },
});
