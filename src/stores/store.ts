import { defineStore } from 'pinia';
import { roster } from './roster';
import { smos } from './smos';
import { activities } from './activities';
import { addDays, eachDayOfInterval, isSameDay } from 'date-fns';
import { RRule } from 'rrule';

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
    isValidActivity(activityName: string, date: Date, time: 'AM' | 'PM') {
      const activity = this.getActivity(activityName);
      if (!activity.validDates) throw new Error('activities are not compiled');
      return activity.validDates[time].some((activityDate) =>
        isSameDay(activityDate, date)
      );
    },
  },
});
