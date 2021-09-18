export type Time = 'AM' | 'PM';

export interface RosterEntry {
  date: Date;
  time: Time;
  activity: string;
  smo: string;
  notes: string;
  version: string;
}

export interface SearchRosterEntry {
  date: Date;
  time: Time;
  activity?: string;
  smo?: string;
}
export interface SetRosterEntry {
  activity?: string;
  smo?: string;
  notes?: string;
}

import rosterData from '../../rosters/roster.json';
// rosterData.forEach((entry) => (entry.date = new Date(entry.date)));

export const roster: Array<RosterEntry> = rosterData.map((entry) => ({
  date: new Date(entry.date),
  time: entry.time as Time,
  smo: entry.smo,
  activity: entry.activity,
  notes: '',
  version: 'Final',
}));
// [
//   { date: new Date('2021-10-05'), time: 'AM', activity: 'Neuro', smo: 'DK' },
// ];
