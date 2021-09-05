import { defineStore } from 'pinia';
import { roster, RosterEntry } from './roster';
import { smos } from './smos';
import { activities } from './activities';
import {
  addDays,
  eachDayOfInterval,
  format,
  isSameDay,
  isWeekend,
  // subDays,
} from 'date-fns';
import { RRule } from 'rrule';

export type Time = 'AM' | 'PM';

export const useStore = defineStore('main', {
  state: () => ({
    version: '0.1',
    startDate: new Date('2021-08-02'),
    numWeeks: 4,
    showWeekend: false,
    rosterAll: roster,
    smos,
    activities,
  }),
  getters: {
    monthName: (state) => {
      return format(state.startDate, 'MMM yyyy');
    },
    roster(state): Array<RosterEntry> {
      return state.rosterAll.filter(
        (entry) => entry.date >= state.startDate && entry.date <= this.endDate
      );
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
    createNewMonth(startDate: Date, numWeeks: number) {
      this.startDate = startDate;
      this.numWeeks = numWeeks;
      this.compileActivities();
      this.compileSMOs();
    },
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
    compileSMOs() {
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
      return r.between(this.startDate, this.endDate, true);
      // .map((date) => subDays(date, 1));
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
        this.roster.push({
          date,
          time,
          smo: smoName,
          activity: activityName,
        });
      }
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
      if (!activity.validDates) throw new Error('activities are not compiled');
      return activity.validDates[time].some((activityDate) =>
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
        result.reasons.push(`${smoName} awaiting assignment}`);
      } else {
        // foundTimeMatches.length == 1
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
