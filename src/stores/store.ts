import { defineStore } from 'pinia';
import { useSMOStore } from './smoStore';
import { useActivityStore } from './activityStore';
import { useRosterStore } from './rosterStore';
import { useMonthStore } from './monthStore';

import {
  RosterEntry,
  SearchRosterEntry,
  SetRosterEntry,
  RosterLookup,
  Time,
} from './models';

import { holidays } from './holidays';

import { User, getAuth } from 'firebase/auth';

import { addDays } from 'date-fns';

import { getEntryTimestamp, isSameDay } from './utils';

import { LoadingBar, Notify } from 'quasar';
import { FirebaseApp } from 'firebase/app';
LoadingBar.setDefaults({
  color: 'cyan',
  size: '2px',
  position: 'top',
});

export const useStore = defineStore('main', {
  state: () => ({
    monthVersion: 'Final',
    showWeekend: false,
    compiled: false,
    holidays,
    user: '',
    loadedMonths: Array<string>(),
    firebaseApp: undefined as FirebaseApp | undefined,
  }),
  getters: {
    roster(state): Array<RosterEntry> {
      const rosterStore = useRosterStore();
      const monthStore = useMonthStore();
      return state.compiled
        ? rosterStore.rosterAll.filter(
            (entry) =>
              entry.date >= monthStore.startDate &&
              entry.date <= monthStore.endDate &&
              entry.version == state.monthVersion
          )
        : [];
    },
    rosterDateTime(): RosterLookup {
      return this.roster.reduce((lookupTable, entry) => {
        const id = getEntryTimestamp(entry.date, entry.time);
        if (lookupTable[id]) lookupTable[id].push(entry);
        else lookupTable[id] = [entry];
        return lookupTable;
      }, <RosterLookup>{});
    },

    rosterVersions(): Array<string> {
      const rosterStore = useRosterStore();
      const monthStore = useMonthStore();
      return rosterStore.rosterAll.reduce((versions, entry) => {
        if (
          entry.date >= monthStore.startDate &&
          entry.date <= monthStore.endDate &&
          !versions.includes(entry.version)
        )
          versions.push(entry.version);
        return versions;
      }, Array<string>());
    },

    isUserSignedIn(state) {
      return getAuth(state.firebaseApp).currentUser;
    },
  },
  actions: {
    async setUser(e: User): Promise<void> {
      console.log('store.setUser: ', e.displayName);
      const smoStore = useSMOStore();
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
        const monthStore = useMonthStore();
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
      this.compiled = false;
      const monthStore = useMonthStore();
      console.log('onNewMonth', monthStore.monthName);

      if (!this.loadedMonths.includes(monthStore.monthName)) {
        this.loadedMonths.push(monthStore.monthName);

        const rosterStore = useRosterStore();
        const loaded = await rosterStore.loadFromFirestore(
          monthStore.startDate,
          monthStore.endDate
        );
        console.log(`${monthStore.monthName}: ${loaded} roster entries`);
        // Notify.create({
        //   message: `${monthStore.monthName}: ${loaded} roster entries`,
        // });
      }

      const activityStore = useActivityStore();
      activityStore.compile(monthStore.startDate, monthStore.endDate);

      const smoStore = useSMOStore();
      smoStore.compile(monthStore.dates);

      this.compiled = true;
    },

    doCreateVersion(newVersionName: string) {
      console.log('doCreateVersion', newVersionName);
      console.log('Creating new entries');
      const newEntries = this.roster.map((entry) => ({
        ...entry,
        version: newVersionName,
      }));
      console.log('Patching new entries');
      const rosterStore = useRosterStore();
      rosterStore.patchEntries(newEntries);

      console.log('Done');

      this.monthVersion = newVersionName;
    },
    doFinaliseVersion() {
      console.log('doFinaliseVersion');
    },
    doDeleteVersion() {
      console.log('doDeleteVersion');
    },

    generateNCT() {
      // run only when creating new month otherwise
      console.log(
        'Warning: compile SMOs will reset any existing NCT times back to NCT default'
      );
      const smoStore = useSMOStore();
      const monthStore = useMonthStore();
      smoStore
        .getNCTEntries(monthStore.startDate, monthStore.endDate)
        .forEach((entry) => {
          this.setRosterEntry(
            {
              date: entry.date,
              time: entry.time,
              smo: entry.smo,
            },
            {
              activity: entry.activity,
            }
          );
        });
    },

    getRosterAtTime(date: Date, time: string) {
      const id = getEntryTimestamp(date, time);
      return this.rosterDateTime[id] || [];
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
      const found = this.getRosterAtTime(date, time).find(
        (entry) => entry.smo == smoName && entry.activity == activityName
      );
      if (found) {
        throw new Error(
          `Roster entry already exists for ${date.toString()}:${time} ${smoName}, ${activityName}`
        );
      } else {
        const rosterStore = useRosterStore();
        rosterStore.rosterAll.push({
          date,
          time,
          smo: smoName,
          activity: activityName,
          notes: '',
          version: this.monthVersion,
        });
      }
    },

    /**
     * Set the entry specificed by searchEntry to the values specified in setEntry, if searchEntry not matched create a new entry
     * @param searchEntry
     * @param setEntry
     */
    setRosterEntry(searchEntry: SearchRosterEntry, setEntry: SetRosterEntry) {
      if (!searchEntry.smo && !searchEntry.activity)
        throw new Error('searchEntry must include either smo or activity');
      const found = this.getRosterAtTime(
        searchEntry.date,
        searchEntry.time
      ).find((entry) => {
        return (
          (searchEntry.activity
            ? entry.activity == searchEntry.activity
            : true) && (searchEntry.smo ? entry.smo == searchEntry.smo : true)
        );
      });
      if (found) {
        if (setEntry.smo) found.smo = setEntry.smo;
        if (setEntry.activity) found.activity = setEntry.activity;
        if (setEntry.notes) found.notes = setEntry.notes;
      } else {
        const smo = searchEntry.smo || setEntry.smo;
        if (!smo) throw new Error('smo must be in searchEntry and/or setEntry');
        const activity = searchEntry.activity || setEntry.activity;
        if (!activity)
          throw new Error('activity must be in searchEntry and/or setEntry');

        const rosterStore = useRosterStore();
        rosterStore.rosterAll.push({
          date: searchEntry.date,
          time: searchEntry.time,
          smo,
          activity,
          notes: setEntry.notes ? setEntry.notes : '',
          version: this.monthVersion,
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
      const rosterStore = useRosterStore();
      const foundIndex = rosterStore.rosterAll.findIndex(
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
        rosterStore.rosterAll.splice(foundIndex, 1);
      }
    },

    isHoliday(date: Date) {
      return this.holidays.some((x) => isSameDay(x, date));
    },

    getActivitySum(activityName: string) {
      return this.roster.filter((entry) => entry.activity == activityName)
        .length;
    },

    // ActivityView utilities

    getAssignedSMOs(date: Date, time: Time, activityName: string) {
      return this.getRosterAtTime(date, time).filter(
        (entry) => entry.activity == activityName
      );
    },

    /**
     * Is activity allowed to be scheduled this date and time
     */

    /**
     * Is activity valid at this date time - allowed to be scheduled, within allocation limits
     */
    isValidActivity(date: Date, time: Time, activityName: string) {
      const result = {
        answer: true,
        reasons: Array<string>(),
      };

      const activityStore = useActivityStore();

      const foundMatches = {
        AM: this.getRosterAtTime(date, 'AM').filter(
          (entry) => entry.activity == activityName
        ),
        PM: this.getRosterAtTime(date, 'PM').filter(
          (entry) => entry.activity == activityName
        ),
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

      if (activity.perSession) {
        const minMax = getMinMax(activity.perSession);
        if (foundTimeMatches < minMax[0]) {
          result.reasons.push(
            `PerSession: expected >= ${minMax[0]}, found ${foundTimeMatches}`
          );
        }
        if (foundTimeMatches > minMax[1]) {
          result.reasons.push(
            `PerDay: expected <= ${minMax[1]}, found ${foundTimeMatches}`
          );
        }
      }

      if (activity.perDay) {
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
      return this.getRosterAtTime(date, time).filter(
        (entry) => entry.smo == smoName && entry.activity != 'Call'
      );
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

    /**
     * Is smo valid at this date time - allowed to be scheduled, not already scheduled elsewhere
     */
    isValidSMO(date: Date, time: Time, smoName: string) {
      const smos = useSMOStore();
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
        if (smos.isAllowedTimeSMO(date, time, smoName))
          result.reasons.push(`${smoName} awaiting assignment`);
      } else {
        // foundTimeMatches.length == 1
        const activityName = assignedActivities[0].activity;
        if (
          !smos.isAllowedTimeSMO(date, time, smoName) &&
          !['NCT', 'WDHB', 'CDHB', 'UNI'].includes(activityName)
        ) {
          result.reasons.push(`${smoName} is not contracted`);
        }

        if (
          !smos.isAllowedActivitySMO(assignedActivities[0].activity, smoName)
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
