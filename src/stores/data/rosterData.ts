import { RosterData, Time } from '../models';

import rosterJson from './roster.json';
// rosterData.forEach((entry) => (entry.date = new Date(entry.date)));

export const rosterData: Array<RosterData> = rosterJson.map((entry) => ({
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
