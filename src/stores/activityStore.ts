import { defineStore } from 'pinia';
// import { activityData } from './data/activityData';
import { ActivityDefinition, RuleName, Time } from './models';
import { parseRRule, isSameDay } from './utils';

import { query, collection, getFirestore, getDocs } from 'firebase/firestore';

// Export as JSON
// console.log(
//   JSON.stringify({
//     activities: activityData.reduce((acc, curr) => {
//       acc[curr.name] = curr;
//       return acc;
//     }, {} as Record<string, ActivityDefinition>),
//   })
// );

export const useActivityStore = defineStore('activity', {
  state: () => ({
    activities: Array<ActivityDefinition>(),
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
    activityRank: {
      Leave: 1,
      Inpatient: 2,
      Consults: 3,
      Clinic: 4,
      Procedure: 5,
      NCT: 6,
      Outreach: 7,
      Other: 8,
      Call: 9,
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
      if (state.viewOptions.showOther) {
        res.push('Other');
        res.push('Outreach');
      }
      return res;
    },

    filteredActivities(state): Array<ActivityDefinition> {
      return state.activities
        .filter(
          (activity) => {
            if (activity.type) {
              if (this.visibleActivities.includes(activity.type)) return true;
              else return false;
            }
            return true;
          }
          // activity.type && this.visibleActivities.includes(activity.type)
        )
        .sort((a, b) => {
          const lookup = state.activityRank as Record<string, number>;
          const arank = a.type ? lookup[a.type] : 999;
          const brank = b.type ? lookup[b.type] : 999;
          if (arank < brank) return -1;
          if (arank > brank) return 1;
          if (a.name < b.name) return -1;
          if (a.name > b.name) return 1;
          return 0;
        });
    },
  },
  actions: {
    async loadFromFirestore(): Promise<void> {
      console.log('activityStore.loadFromFirestore');
      const q = query(collection(getFirestore(), 'activities'));
      const qss = await getDocs(q);
      const loadacts = Array<ActivityDefinition>();
      qss.forEach((doc) => {
        loadacts.push(doc.data() as ActivityDefinition);
      });
      this.activities = loadacts;
      console.log(' - Loaded activities', this.activities.length);
    },

    getActivity(activityName: string): ActivityDefinition | undefined {
      const activity = this.activities.find(
        (activity) => activity.name == activityName
      );
      // if (!activity) throw new Error(`Activity ${activityName} is not defined`);
      return activity;
    },

    getActivityRule(activityName: string, ruleName: RuleName) {
      const activity = this.getActivity(activityName);
      if (activity) return activity[ruleName];
      throw new Error(`Invalid activity: ${activityName}`);
    },

    isAllowedActivity(date: Date, time: Time, activityName: string): boolean {
      const activity = this.getActivity(activityName);
      if (!activity) return true;
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

    showAll(): void {
      this.viewOptions.showLeave = true;
      this.viewOptions.showCall = true;
      this.viewOptions.showInpatient = true;
      this.viewOptions.showClinic = true;
      this.viewOptions.showOther = true;
      this.viewOptions.showProcedure = true;
      this.viewOptions.showConsults = true;
      this.viewOptions.showNCT = true;
    },

    showNone(): void {
      this.viewOptions.showLeave = false;
      this.viewOptions.showCall = false;
      this.viewOptions.showInpatient = false;
      this.viewOptions.showClinic = false;
      this.viewOptions.showOther = false;
      this.viewOptions.showProcedure = false;
      this.viewOptions.showConsults = false;
      this.viewOptions.showNCT = false;
    },
  },
});
