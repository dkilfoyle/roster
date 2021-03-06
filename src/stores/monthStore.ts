import {
  format,
  addDays,
  eachDayOfInterval,
  isWeekend,
  differenceInWeeks,
  isSameDay,
} from 'date-fns';
import { defineStore } from 'pinia';
import { holidays } from './holidays';
import { getFirstMonday } from './utils';

export const useMonthStore = defineStore('month', {
  state: () => ({
    year: 2021,
    month: 0,
    startDate: new Date(),
    endDate: new Date(),
    dates: Array<Date>(),
    numWeeks: 1,
    numWorkingDays: 1,
    showWeekend: false,
    version: 'Final',
  }),
  getters: {
    monthName(): string {
      return format(this.startDate, 'MMM yyyy');
    },
    isArchived(): boolean {
      return this.endDate < new Date();
    },
  },
  actions: {
    setMonth(year: number, month: number): void {
      console.log('monthStore.setMonth', year, month);

      this.year = year;
      this.month = month;

      const startDate = getFirstMonday(year, month);
      const nextFirstMonday = getFirstMonday(
        month == 11 ? year + 1 : year,
        (month + 1) % 12
      );
      const numWeeks = differenceInWeeks(nextFirstMonday, startDate);

      const endDate = addDays(startDate, numWeeks * 7 - 1);
      const dates = eachDayOfInterval({
        start: startDate,
        end: endDate,
      }).filter((date) => this.showWeekend || !isWeekend(date));

      const numWorkingDays = dates.filter(
        (date) => !holidays.some((holiday) => isSameDay(holiday, date))
      ).length;

      this.$patch({
        startDate,
        endDate,
        numWeeks,
        numWorkingDays,
        dates,
        version: 'Final',
      });
    },
    setPrevMonth() {
      const year = this.startDate.getFullYear();
      const month = this.startDate.getMonth();
      void this.setMonth(
        month == 0 ? year - 1 : year,
        month == 0 ? 11 : month - 1
      );
    },
    setNextMonth() {
      const year = this.startDate.getFullYear();
      const month = this.startDate.getMonth();
      void this.setMonth(
        month == 11 ? year + 1 : year,
        month == 11 ? 0 : month + 1
      );
    },
  },
});
