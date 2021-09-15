import { defineStore } from 'pinia';
import { roster, RosterEntry } from './roster';
import { smos } from './smos';
import { activities } from './activities';
import { holidays } from './holidays';

import { FirebaseApp } from 'firebase/app';
import { User, getAuth } from 'firebase/auth';
import {
  query,
  collection,
  getFirestore,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';

import {
  addDays,
  eachDayOfInterval,
  format,
  isSameDay,
  isWeekend,
  isMonday,
  nextMonday,
  differenceInWeeks,
  eachWeekOfInterval,
} from 'date-fns';

import { LoadingBar } from 'quasar';
LoadingBar.setDefaults({
  color: 'cyan',
  size: '2px',
  position: 'top',
});

export type Time = 'AM' | 'PM';

export const getFirstMonday = (year: number, month: number) => {
  const d = new Date(year, month, 1);
  if (isMonday(d)) return d;
  else return nextMonday(d);
};

export const useStore = defineStore('main', {
  state: () => ({
    version: '0.1',
    firebaseApp: null as FirebaseApp | null,
    startDate: getFirstMonday(new Date().getFullYear(), new Date().getMonth()),
    numWeeks: 1,
    showWeekend: false,
    rosterAll: roster,
    smos,
    activities,
    compiled: false,
    holidays,
    activityViewOptions: {
      showErrors: true,
      showSummary: true,
      showLeave: true,
      showCall: true,
      showInpatient: true,
      showClinic: true,
      showOther: true,
      showProcedure: true,
      showConsults: true,
    },
    user: '',
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
    visibleActivities: (state) => {
      const res: Array<string> = [];
      if (state.activityViewOptions.showLeave) res.push('Leave');
      if (state.activityViewOptions.showCall) res.push('Call');
      if (state.activityViewOptions.showInpatient) res.push('Inpatient');
      if (state.activityViewOptions.showConsults) res.push('Consults');
      if (state.activityViewOptions.showClinic) res.push('Clinic');
      if (state.activityViewOptions.showProcedure) res.push('Procedure');
      if (state.activityViewOptions.showOther) res.push('Other');
      return res;
    },
    filteredActivities(state) {
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
    isUserSignedIn() {
      return !!getAuth().currentUser;
    },
  },
  actions: {
    setFirebase(fbApp: FirebaseApp) {
      this.firebaseApp = fbApp;
    },
    setUser(e: User) {
      console.log('store.setUser: ', e);
      if (typeof e != 'undefined') {
        const mysmos = query(collection(getFirestore(), 'smos'));
        onSnapshot(mysmos, function (snapshot: QuerySnapshot<DocumentData>) {
          snapshot.docChanges().forEach(function (change) {
            console.log(
              'onSnapShop: ',
              change.type,
              change.doc.id,
              change.doc.data()
            );
          });
        });
      }
      console.log('Set user', e);
    },
    setMonth(year: number, month: number, numWeeks?: number) {
      // console.log('setMonth', year, month, numWeeks);
      LoadingBar.start();
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
      LoadingBar.stop();
    },
    setPrevMonth() {
      const year = this.startDate.getFullYear();
      const month = this.startDate.getMonth();
      this.setMonth(month == 0 ? year - 1 : year, month == 0 ? 11 : month - 1);
    },
    setNextMonth() {
      const year = this.startDate.getFullYear();
      const month = this.startDate.getMonth();
      this.setMonth(month == 11 ? year + 1 : year, month == 11 ? 0 : month + 1);
    },
    compileActivities() {
      this.activities.forEach((activity, i) => {
        // console.log('Compiling activity ', activity.name);
        LoadingBar.increment((i / this.activities.length) * 0.5);
        activity.allowedDates = {
          AM: this.parseRRule(activity.AM),
          PM: this.parseRRule(activity.PM),
        };
      });
    },
    compileSMOs() {
      this.smos.forEach((smo, i) => {
        // console.log('Compiling smo ', smo.name);
        LoadingBar.increment((i / this.smos.length) * 0.5);

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
    generateNCT() {
      // run only when creating new month otherwise
      console.log(
        'Warning: compile SMOs will reset any existing NCT times back to NCT default'
      );
      this.smos.forEach((smo) => {
        smo.NCT.forEach((nct) => {
          this.parseRRule(nct.AM).forEach((date) =>
            this.setRosterEntryActivity(date, 'AM', smo.name, nct.name)
          );
          this.parseRRule(nct.PM).forEach((date) =>
            this.setRosterEntryActivity(date, 'PM', smo.name, nct.name)
          );
        });
      });
    },
    parseRRule(rule: string) {
      if (rule == '') return [];

      const days = Array<number>();
      const r = rule.toLowerCase();

      if (r == 'every weekday') {
        days.push(...[1, 2, 3, 4, 5]);
      } else if (r == 'every day') {
        days.push(...[0, 1, 2, 3, 4, 5, 6]);
      } else {
        if (r.includes('sunday')) days.push(0);
        if (r.includes('monday')) days.push(1);
        if (r.includes('tuesday')) days.push(2);
        if (r.includes('wednesday')) days.push(3);
        if (r.includes('thursday')) days.push(4);
        if (r.includes('friday')) days.push(5);
        if (r.includes('saturday')) days.push(6);
      }

      const interval = { start: this.startDate, end: this.endDate };
      const dates = Array<Date>();
      days.forEach((day) =>
        dates.push(
          ...eachWeekOfInterval(interval, {
            weekStartsOn: day as 0 | 1 | 2 | 3 | 4 | 5 | 6,
          })
        )
      );

      return dates;

      // const r = RRule.fromText(rule);
      // r.options.dtstart = new Date('2010-01-01');
      // const dates = r.between(this.startDate, this.endDate, true);
      // dates.forEach((date) => {
      //   date.setHours(0);
      //   date.setMinutes(0);
      // });
      // return dates;
      // .map((date) => subDays(date, 1));
    },

    /**
     * set activity for date/time/smo, create new roster entry if needed
     */
    addRosterEntry(
      date: Date,
      time: Time,
      smoName: string,
      activityName: string
    ) {
      const found = roster.find(
        (entry) =>
          isSameDay(entry.date, date) &&
          entry.time == time &&
          entry.smo == smoName &&
          entry.activity == activityName
      );
      if (found) {
        throw new Error(
          `Roster entry already exists for ${date.toString()}:${time} ${smoName}, ${activityName}`
        );
      } else {
        this.rosterAll.push({
          date,
          time,
          smo: smoName,
          activity: activityName,
        });
      }
    },

    /**
     * set activity for date/time/smo, create new roster entry if needed
     */
    setRosterEntryActivity(
      date: Date,
      time: Time,
      smoName: string,
      activityName: string
    ) {
      const found = roster.find(
        (entry) =>
          isSameDay(entry.date, date) &&
          entry.time == time &&
          entry.smo == smoName
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

    /**
     * set SMO for date/time/smo, create new roster entry if needed
     */
    setRosterEntrySMO(
      date: Date,
      time: Time,
      smoName: string,
      activityName: string
    ) {
      const found = roster.find(
        (entry) =>
          isSameDay(entry.date, date) &&
          entry.time == time &&
          entry.activity == activityName
      );
      if (found) {
        found.smo = smoName;
      } else {
        this.rosterAll.push({
          date,
          time,
          smo: smoName,
          activity: activityName,
        });
      }
    },

    /**
     * Delete roster entry date/time/smo/activity
     */
    delRosterEntry(
      date: Date,
      time: Time,
      smoName: string,
      activityName: string
    ) {
      const foundIndex = roster.findIndex(
        (entry) =>
          isSameDay(entry.date, date) &&
          entry.time == time &&
          entry.smo == smoName &&
          entry.activity == activityName
      );
      if (foundIndex == -1) {
        throw new Error(
          `Entry does not exist ${date.toString()}:${time} for ${smoName}, ${activityName}`
        );
      } else {
        this.rosterAll.splice(foundIndex, 1);
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
      // return new Array<RosterEntry>();
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
    isAllowedTimeSMO(date: Date, time: Time, smoName: string) {
      const smo = this.getSMO(smoName);
      if (!smo.allowedDates)
        throw new Error('allowed smo dates are not compiled');
      return smo.allowedDates[time].some((smoDate) => isSameDay(smoDate, date));
    },

    /**
     * Is SMO allowed to be scheduled to this activity
     */
    isAllowedActivitySMO(activityName: string, smoName: string) {
      return this.getAllowedActivities(smoName).includes(activityName);
    },

    /**
     * Is SMO already scheduled elsewhere
     */
    isAssignedSMO(date: Date, time: Time, smoName: string) {
      return this.getAssignedActivities(date, time, smoName).length > 0;
    },

    isOnLeaveSMO(date: Date, smoName: string) {
      const assigned = this.getAssignedActivities(date, 'AM', smoName).concat(
        this.getAssignedActivities(date, 'PM', smoName)
      );
      return assigned.some((entry) => ['ANL', 'CME'].includes(entry.activity));
    },

    isAvailableCallSMO(date: Date, time: Time, smoName: string) {
      return (
        this.isAllowedActivitySMO('Call', smoName) &&
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
      if (activityName == 'Call')
        return this.isAvailableCallSMO(date, time, smoName);
      else
        return (
          this.isAllowedActivitySMO(activityName, smoName) &&
          this.isAllowedTimeSMO(date, time, smoName) &&
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
      if (activityName == 'Call')
        return (
          this.isAllowedActivitySMO('Call', smoName) &&
          (this.isOnLeaveSMO(date, smoName) ||
            this.isOnLeaveSMO(addDays(date, 1), smoName))
        );
      else
        return (
          this.isAllowedActivitySMO(activityName, smoName) &&
          (!this.isAllowedTimeSMO(date, time, smoName) ||
            this.isAssignedSMO(date, time, smoName))
        );
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
        if (this.isAllowedTimeSMO(date, time, smoName))
          result.reasons.push(`${smoName} awaiting assignment`);
      } else {
        // foundTimeMatches.length == 1
        const activityName = assignedActivities[0].activity;
        if (
          !this.isAllowedTimeSMO(date, time, smoName) &&
          !['NCT', 'WDHB', 'CDHB', 'UNI'].includes(activityName)
        ) {
          result.reasons.push(`${smoName} is not contracted`);
        }

        if (
          !this.isAllowedActivitySMO(assignedActivities[0].activity, smoName)
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
