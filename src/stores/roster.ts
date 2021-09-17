export type Time = 'AM' | 'PM';

export interface RosterEntry {
  date: Date;
  time: Time;
  activity: string;
  smo: string;
  notes: string;
  version: string;
}

import rosterData from '../../rosters/roster.json';
// rosterData.forEach((entry) => (entry.date = new Date(entry.date)));

export const roster: Array<RosterEntry> = rosterData.map((entry) => ({
  date: new Date(entry.date),
  time: entry.time as Time,
  smo: entry.smo,
  activity: entry.activity,
  notes: '',
  version: '',
}));
// [
//   { date: new Date('2021-10-05'), time: 'AM', activity: 'Neuro', smo: 'DK' },
// ];
