import { eachWeekOfInterval, isMonday, nextMonday } from 'date-fns';
import { Time } from './models';

export const isSameDay = (d1: Date, d2: Date) => {
  return (
    d1.getDate() == d2.getDate() &&
    d1.getMonth() == d2.getMonth() &&
    d1.getFullYear() == d2.getFullYear()
  );
  // return d1.getTime() == d2.getTime();
};

export const getEntryTimestamp = (date: Date, time: string) => {
  return `${date.getFullYear()}${date
    .getMonth()
    .toString()
    .padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}${time}`;
};

export const getEntryId = (date: Date, time: Time, smo: string) => {
  return `${getEntryTimestamp(date, time)}_${smo}`;
};

export const getFirstMonday = (year: number, month: number) => {
  const d = new Date(year, month, 1, 0, 0, 0, 0);
  if (isMonday(d)) return d;
  else return nextMonday(d);
};

export const parseRRule = (rule: string, startDate: Date, endDate: Date) => {
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

  const interval = { start: startDate, end: endDate };
  const dates = Array<Date>();
  days.forEach((day) =>
    dates.push(
      ...eachWeekOfInterval(interval, {
        weekStartsOn: day as 0 | 1 | 2 | 3 | 4 | 5 | 6,
      })
    )
  );

  return dates.filter((date) => date >= startDate && date <= endDate);
};
