import { defineStore } from 'pinia';
import { activityData } from './data/activityData';
import { ActivityDefinition, Time } from './models';
import { parseRRule, isSameDay } from './utils';

export const useActivityStore = defineStore('activity', {
  state: () => ({
    activities: activityData,
    viewOptions: {
      showErrors: true,
      showSummary: true,
      showLeave: true,
      showCall: true,
      showInpatient: true,
      showClinic: true,
      showOther: true,
      showProcedure: true,
      showConsults: true,
      showNCT: true,
    },
  }),
  getters: {
    activityNames(state): Array<string> {
      return state.activities.map((activity) => activity.name);
    },

    visibleActivities(state) {
      const res: Array<string> = [];
      if (state.viewOptions.showLeave) res.push('Leave');
      if (state.viewOptions.showCall) res.push('Call');
      if (state.viewOptions.showInpatient) res.push('Inpatient');
      if (state.viewOptions.showConsults) res.push('Consults');
      if (state.viewOptions.showClinic) res.push('Clinic');
      if (state.viewOptions.showProcedure) res.push('Procedure');
      if (state.viewOptions.showNCT) res.push('NCT');
      if (state.viewOptions.showOther) res.push('Other');
      return res;
    },

    filteredActivities(state): Array<ActivityDefinition> {
      return state.activities.filter(
        (activity) => {
          if (activity.type) {
            if (this.visibleActivities.includes(activity.type)) return true;
            else return false;
          }
          return true;
        }
        // activity.type && this.visibleActivities.includes(activity.type)
      );
    },
  },
  actions: {
    getActivity(activityName: string): ActivityDefinition {
      const activity = this.activities.find(
        (activity) => activity.name == activityName
      );
      if (!activity) throw new Error(`Activity ${activityName} is not defined`);
      return activity;
    },

    isAllowedActivity(date: Date, time: Time, activityName: string): boolean {
      const activity = this.getActivity(activityName);
      if (!activity.allowedDates)
        throw new Error('activities are not compiled');
      return activity.allowedDates[time].some((activityDate) =>
        isSameDay(activityDate, date)
      );
    },

    compile(startDate: Date, endDate: Date): void {
      this.activities.forEach((activity) => {
        // console.log('Compiling activity ', activity.name);
        activity.allowedDates = {
          AM: parseRRule(activity.AM, startDate, endDate),
          PM: parseRRule(activity.PM, startDate, endDate),
        };
      });
    },
  },
});
