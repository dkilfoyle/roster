import { defineStore } from 'pinia';
import { roster } from './roster';
import { smos } from './smos';
import { activities } from './activities';
import { addDays, eachDayOfInterval, isSameDay } from 'date-fns';
import { RRule } from 'rrule';

type Time = 'AM' | 'PM';

export const useStore = defineStore('main', {
  state: () => ({
    startDate: new Date('2021-10-4'),
    numWeeks: 4,
    roster,
    smos,
    activities,
  }),
  getters: {
    endDate: (state) => addDays(state.startDate, state.numWeeks * 7),
    dates(state): Array<Date> {
      return eachDayOfInterval({
        start: state.startDate,
        end: this.endDate,
      });
    },
    activityNames: (state) => state.activities.map((activity) => activity.name),
  },
  actions: {
    setStartDate(date: Date) {
      this.startDate = date;
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
      const found = this.roster.filter(
        (entry) =>
          isSameDay(entry.date, date) &&
          entry.time == time &&
          entry.activity == activityName
      );
      return found.map((entry) => entry.smo).join(',');
    },
    getValidSMOs(date: Date, activity: string) {
      return this.smos.filter(
        (smo) =>
          smo.endDate &&
          date <= smo.endDate &&
          smo.activities.includes(activity)
      );
    },
    parseRRule(rule: string) {
      return RRule.fromText(rule).between(this.startDate, this.endDate, true);
    },
    /**
     * Is activity allowed at this date and time
     */
    isActivityAllowed(date: Date, time: Time, activityName: string) {
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

      const isAllowedActivity = this.isActivityAllowed(
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
      console.log(date, time, activityName, result);
      return result;
    },
  },
});
