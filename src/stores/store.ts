import { defineStore } from 'pinia';
import { roster } from './roster';
import { smos } from './smos';
import { activities } from './activities';
import {
  addDays,
  eachDayOfInterval,
  isSameDay,
  isWeekend,
  // subDays,
} from 'date-fns';
import { RRule } from 'rrule';

export type Time = 'AM' | 'PM';

export const useStore = defineStore('main', {
  state: () => ({
    startDate: new Date('2021-08-02'),
    numWeeks: 4,
    showWeekend: false,
    roster,
    smos,
    activities,
  }),
  getters: {
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
    setStartDate(date: Date) {
      this.startDate = date;
      this.compileActivities();
    },
    setNumWeeks(x: number) {
      this.numWeeks = x;
      this.compileActivities();
    },
    compileActivities() {
      this.activities.forEach((activity) => {
        activity.validDates = {
          AM: this.parseRRule(activity.AM),
          PM: this.parseRRule(activity.PM),
        };
      });
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
    parseRRule(rule: string) {
      const r = RRule.fromText(rule);
      r.options.dtstart = new Date('2010-01-01');
      return r.between(this.startDate, this.endDate, true);
      // .map((date) => subDays(date, 1));
    },
    /**
     * Is activity allowed at this date and time
     */
    isAllowedActivity(date: Date, time: Time, activityName: string) {
      const activity = this.getActivity(activityName);
      if (!activity.validDates) throw new Error('activities are not compiled');
      return activity.validDates[time].some((activityDate) =>
        isSameDay(activityDate, date)
      );
    },
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
            `PerSession: expected > ${minMax[0]}, found ${foundTimeMatches.length}`
          );
        }
        if (foundTimeMatches.length > minMax[1]) {
          result.reasons.push(
            `PerDay: expected < ${minMax[1]}, found ${foundTimeMatches.length}`
          );
        }
      }

      if (activity.perDay) {
        const minMax = getMinMax(activity.perDay);
        if (foundDateMatches.length < minMax[0]) {
          result.reasons.push(
            `PerDay: expected > ${minMax[0]}, found ${foundDateMatches.length}`
          );
        }
        if (foundDateMatches.length > minMax[1]) {
          result.reasons.push(
            `PerDay: expected < ${minMax[1]}, found ${foundDateMatches.length}`
          );
        }
      }

      result.answer = result.reasons.length == 0;
      // console.log(date, time, activityName, result);
      return result;
    },
  },
});
