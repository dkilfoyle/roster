export interface RosterEntry {
  date: Date;
  time: 'AM' | 'PM' | 'aCall' | 'bCall';
  activity: string;
  smo: string;
}

export const roster: Array<RosterEntry> = [
  { date: new Date('2021-10-05'), time: 'AM', activity: 'EMG', smo: 'DK' },
];
