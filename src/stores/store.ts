import { defineStore } from 'pinia';
import { useSMOStore } from './smoStore';
import { useActivityStore } from './activityStore';
import { useRosterStore } from './rosterStore';
import { useMonthStore } from './monthStore';

import { Time } from './models';
import { holidays } from './holidays';
import { User, getAuth } from 'firebase/auth';
import { addDays, getDay, isFriday, nextMonday } from 'date-fns';
import { isSameDay } from './utils';

import { LoadingBar, Notify } from 'quasar';
import { FirebaseApp } from 'firebase/app';
LoadingBar.setDefaults({
  color: 'cyan',
  size: '2px',
  position: 'top',
});

export const useStore = defineStore('main', {
  state: () => ({
    showWeekend: false,
    compiled: false,
    summaryLoaded: false,
    holidays,
    user: '',
    loadedMonths: Array<string>(),
    firebaseApp: undefined as FirebaseApp | undefined,
    summaryOptions: {
      startMonth: new Date().getMonth(),
      startYear: new Date().getFullYear() - 1,
      endMonth: new Date().getMonth(),
      endYear: new Date().getFullYear(),
      showHeatmap: true,
    },
  }),
  getters: {
    // roster(state): Array<RosterEntry> {
    //   const rosterStore = useRosterStore();
    //   return state.compiled ? rosterStore.monthEntries : [];
    // },

    isUserSignedIn(state) {
      return getAuth(state.firebaseApp).currentUser;
    },

    summaryStartDate(state) {
      return new Date(
        state.summaryOptions.startYear,
        state.summaryOptions.startMonth,
        1
      );
    },
    summaryEndDate(state) {
      return new Date(
        state.summaryOptions.endYear,
        state.summaryOptions.endMonth,
        28
      );
    },
  },
  actions: {
    async setUser(e: User): Promise<void> {
      console.log('store.setUser: ', e.displayName, e.uid);

      const smoStore = useSMOStore();
      const monthStore = useMonthStore();
      const activityStore = useActivityStore();

      if (e !== null) {
        Notify.create({
          message: 'Logged in',
          caption: `${e.displayName || 'unknown'}`,
          position: 'bottom-right',
        });
        await smoStore.loadFromFirestore();
        await activityStore.loadFromFirestore();
        // Notify.create({
        //   message: `Loaded ${smoStore.smos.length} smos, ${activityStore.activities.length} activities`,
        // });
        this.user = e.displayName || '';
        void monthStore.setMonth(
          new Date().getFullYear(),
          new Date().getMonth()
        );
      } else {
        console.log(' - No user');
      }
    },
    async onNewMonth() {
      // Called from monthOptions watch(monthStore.startDate)
      // 1. Load roster from firestore
      // 2. compile activity for month
      // 3. compile smos for month
      // 4. Set compiled flag

      const smoStore = useSMOStore();
      const monthStore = useMonthStore();
      const activityStore = useActivityStore();
      const rosterStore = useRosterStore();

      this.compiled = false;
      console.log('onNewMonth', monthStore.monthName);

      if (!this.loadedMonths.includes(monthStore.monthName)) {
        this.loadedMonths.push(monthStore.monthName);

        const loaded = await rosterStore.loadFromFirestore(
          monthStore.startDate,
          monthStore.endDate
        );
        console.log(`${monthStore.monthName}: ${loaded} roster entries`);
        // Notify.create({
        //   message: `${monthStore.monthName}: ${loaded} roster entries`,
        // });
      }

      activityStore.compile(monthStore.startDate, monthStore.endDate);
      smoStore.compile(monthStore.dates);
      this.compiled = true;
    },

    doCreateVersion(newVersionName: string) {
      console.log('doCreateVersion', newVersionName);
      console.log('Creating new entries');

      const monthStore = useMonthStore();
      const rosterStore = useRosterStore();

      rosterStore.monthEntries.forEach((entry) => {
        void rosterStore.addRosterEntry({
          ...entry,
          version: newVersionName,
        });
      });
      console.log('Done');
      monthStore.version = newVersionName;
    },
    async doFinaliseVersion() {
      console.log('doFinaliseVersion');
      const rosterStore = useRosterStore();
      const monthStore = useMonthStore();

      // delete current month Final
      const delids = rosterStore.allEntries
        .filter(
          (entry) =>
            entry.date >= monthStore.startDate &&
            entry.date <= monthStore.endDate &&
            entry.version == 'Final'
        )
        .map((entry) => entry.id);

      await rosterStore.delRosterEntries(delids);

      // change monthEntries.verion to final
      const changeids = rosterStore.monthEntries.map((entry) => entry.id);
      await Promise.all(
        changeids.map(async (id) => {
          return await rosterStore.setRosterEntry(id, { version: 'Final' });
        })
      );

      monthStore.version = 'Final';
    },
    async doDeleteVersion() {
      console.log('doDeleteVersion');
      const rosterStore = useRosterStore();

      const ids = rosterStore.monthEntries.map((entry) => entry.id);
      await rosterStore.delRosterEntries(ids);

      const monthStore = useMonthStore();
      monthStore.version = 'Final';
    },

    async doDeleteNCT() {
      const rosterStore = useRosterStore();

      const ids = rosterStore.monthEntries
        .filter((entry) =>
          ['NCT', 'Uni', 'MAN', 'CDHB', 'WDHB', 'UNI'].includes(entry.activity)
        )
        .map((entry) => entry.id);
      await rosterStore.delRosterEntries(ids);
    },

    generateRegularEntries() {
      // run only when creating new month otherwise
      const smoStore = useSMOStore();
      const monthStore = useMonthStore();
      const rosterStore = useRosterStore();

      smoStore
        .getNCTEntries(monthStore.startDate, monthStore.endDate)
        .concat(
          smoStore.getRegularEntries(monthStore.startDate, monthStore.endDate)
        )
        .concat(
          smoStore.getCRSEntries(monthStore.startDate, monthStore.endDate)
        )
        .forEach((entry) => {
          void rosterStore.addRosterEntry({
            ...entry,
            notes: '',
            version: monthStore.version,
          });
        });
    },

    isHoliday(date: Date) {
      return this.holidays.some((x) => isSameDay(x, date));
    },

    getActivitySum(activityName: string) {
      const rosterStore = useRosterStore();
      return rosterStore.filter({ activity: activityName }).length;
    },

    // ActivityView utilities

    getAssignedSMOs(date: Date, time: Time, activityName: string) {
      const rosterStore = useRosterStore();
      return rosterStore
        .getRosterAtTime(date, time)
        .filter((entry) => entry.activity == activityName);
    },

    /**
     * Is activity allowed to be scheduled this date and time
     */

    /**
     * Is activity valid at this date time - allowed to be scheduled, within allocation limits
     */
    isValidActivity(date: Date, time: Time, activityName: string) {
      const result = {
        answer: false,
        reasons: Array<string>(),
      };

      const activityStore = useActivityStore();
      const rosterStore = useRosterStore();

      const foundMatches = {
        AM: rosterStore
          .getRosterAtTime(date, 'AM')
          .filter((entry) => entry.activity == activityName),
        PM: rosterStore
          .getRosterAtTime(date, 'PM')
          .filter((entry) => entry.activity == activityName),
      };

      const foundTimeMatches = foundMatches[time].length;
      const foundDateMatches =
        foundMatches['AM'].length + foundMatches['PM'].length;

      // const foundDateMatches = this.roster.filter(
      //   (entry) => isSameDay(entry.date, date) && entry.activity == activityName
      // );
      // const foundTimeMatches = foundDateMatches.filter(
      //   (entry) => entry.time == time
      // );

      const isAllowedActivity = activityStore.isAllowedActivity(
        date,
        time,
        activityName
      );

      if (!isAllowedActivity) {
        if (foundMatches[time].length == 0) {
          return result;
        } else
          result.reasons.push(
            `Did not expect ${activityName} at this date and time`
          );
      }

      const activity = activityStore.getActivity(activityName);

      const getMinMax = (x: [number, number] | number) => {
        return Array.isArray(x) ? x : [x, x];
      };

      if (activity && activity.perSession) {
        const minMax = getMinMax(activity.perSession);
        if (foundTimeMatches < minMax[0]) {
          result.reasons.push(
            `PerSession: expected >= ${minMax[0]}, found ${foundTimeMatches}`
          );
        }
        if (foundTimeMatches > minMax[1]) {
          result.reasons.push(
            `PerSession: expected <= ${minMax[1]}, found ${foundTimeMatches}`
          );
        }
      }

      if (activity && activity.perDay) {
        const minMax = getMinMax(activity.perDay);
        if (foundDateMatches < minMax[0]) {
          result.reasons.push(
            `PerDay: expected >= ${minMax[0]}, found ${foundDateMatches}`
          );
        }
        if (foundDateMatches > minMax[1]) {
          result.reasons.push(
            `PerDay: expected <= ${minMax[1]}, found ${foundDateMatches}`
          );
        }
      }

      result.answer = result.reasons.length == 0;
      // console.log(date, time, activityName, result);
      return result;
    },

    // SmoView utilities

    getAssignedActivities(date: Date, time: Time, smoName: string) {
      const rosterStore = useRosterStore();
      return rosterStore
        .getRosterAtTime(date, time)
        .filter((entry) => entry.smo == smoName);
    },

    getAssignedActivitiesNoCall(date: Date, time: Time, smoName: string) {
      return this.getAssignedActivities(date, time, smoName).filter(
        (entry) => entry.activity != 'Call'
      );
    },

    /**
     * Is SMO already scheduled elsewhere
     */
    isAssignedSMO(date: Date, time: Time, smoName: string) {
      return this.getAssignedActivitiesNoCall(date, time, smoName).length > 0;
    },

    isOnLeaveSMO(date: Date, smoName: string) {
      const assigned = this.getAssignedActivitiesNoCall(
        date,
        'AM',
        smoName
      ).concat(this.getAssignedActivitiesNoCall(date, 'PM', smoName));
      return assigned.some((entry) => ['ANL', 'CME'].includes(entry.activity));
    },

    isAvailableCallSMO(date: Date, time: Time, smoName: string) {
      const smos = useSMOStore();
      return (
        smos.isAllowedActivitySMO('Call', smoName) &&
        !(
          this.isOnLeaveSMO(date, smoName) ||
          this.isOnLeaveSMO(addDays(date, 1), smoName)
        )
      );
    },

    /**
     * Is SMO available ie allowed time, allowed activity, not already schedueld
     */
    isAvailableSMO(
      date: Date,
      time: Time,
      smoName: string,
      activityName: string
    ) {
      const smos = useSMOStore();
      if (activityName == 'Call')
        return this.isAvailableCallSMO(date, time, smoName);
      else
        return (
          smos.isAllowedActivitySMO(activityName, smoName) &&
          smos.isAllowedTimeSMO(date, time, smoName) &&
          !this.isAssignedSMO(date, time, smoName)
        );
    },

    /**
     * Is SMO unavailable ie allowed activity but not time or already scheduled
     */
    isUnavailableSMO(
      date: Date,
      time: Time,
      smoName: string,
      activityName: string
    ) {
      const smos = useSMOStore();
      if (activityName == 'Call')
        return (
          smos.isAllowedActivitySMO('Call', smoName) &&
          (this.isOnLeaveSMO(date, smoName) ||
            this.isOnLeaveSMO(addDays(date, 1), smoName))
        );
      else
        return (
          smos.isAllowedActivitySMO(activityName, smoName) &&
          (!smos.isAllowedTimeSMO(date, time, smoName) ||
            this.isAssignedSMO(date, time, smoName))
        );
    },

    isValidEntry(
      date: Date,
      time: Time,
      smoName: string,
      activityName: string
    ) {
      const rosterStore = useRosterStore();
      const result = {
        answer: true,
        reasons: Array<string>(),
      };
      if (activityName == 'Call') {
        if (isFriday(date) && time == 'PM') {
          const nextMondayEntry = rosterStore
            .getRosterAtTime(nextMonday(date), 'AM')
            .find((entry) => entry.smo == smoName && entry.activity == 'RT');
          if (!nextMondayEntry)
            result.reasons.push(
              `Weekend B Call (${smoName}) should be followed by RT on Monday`
            );
        } else if (getDay(date) > 0 && getDay(date) < 5) {
          // is BCall followed by TNP
          const nextDayEntry = rosterStore
            .getRosterAtTime(addDays(date, 1), 'AM')
            .find((entry) => entry.smo == smoName && entry.activity == 'RT');
          if (!nextDayEntry)
            result.reasons.push(
              `Call (${smoName}) should be followed by RT next day`
            );
        }
      }
      result.answer = result.reasons.length == 0;
      return result;
    },

    /**
     * Is smo valid at this date time - allowed to be scheduled, not already scheduled elsewhere
     */
    isValidSMO(date: Date, time: Time, smoName: string) {
      const smos = useSMOStore();
      const result = {
        answer: true,
        reasons: Array<string>(),
      };

      const assignedActivitiesNoCall = this.getAssignedActivitiesNoCall(
        date,
        time,
        smoName
      );

      // test if SMO already assigned to another activity at same date and time
      if (assignedActivitiesNoCall.length > 1) {
        result.reasons.push(
          `${smoName} is already assigned to ${assignedActivitiesNoCall
            .map((x) => x.activity)
            .join(',')}`
        );
      } else if (assignedActivitiesNoCall.length == 0) {
        if (smos.isAllowedTimeSMO(date, time, smoName))
          result.reasons.push(`${smoName} awaiting assignment`);
      } else {
        // foundTimeMatches.length == 1
        const activityName = assignedActivitiesNoCall[0].activity;
        if (
          !smos.isAllowedTimeSMO(date, time, smoName) &&
          !['NCT', 'WDHB', 'CDHB', 'UNI', 'Call', 'MAN', 'ANL', 'CME'].includes(
            activityName
          )
        ) {
          result.reasons.push(`${smoName} is not contracted`);
        }

        if (
          !smos.isAllowedActivitySMO(
            assignedActivitiesNoCall[0].activity,
            smoName
          )
        ) {
          result.reasons.push(
            `${assignedActivitiesNoCall[0].activity} is not an allowed activity for ${smoName}`
          );
        }
      }

      result.answer = result.reasons.length == 0;
      // console.log(date, time, activityName, result);
      return result;
    },
  },
});
