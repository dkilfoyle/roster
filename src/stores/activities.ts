export interface ActivityDefinition {
  name: string;
  description?: string;
  AM: string;
  PM: string;
  allowedDates?: { AM: Array<Date>; PM: Array<Date> };
  perDay?: [number, number] | number;
  perSession?: [number, number] | number;
}

export const activities: Array<ActivityDefinition> = [
  {
    name: 'ANL',
    description: 'Annual Leave',
    AM: 'every weekday',
    PM: 'every weekday',
  },
  {
    name: 'CME',
    description: 'CME Leave',
    AM: 'every weekday',
    PM: 'every weekday',
  },
  {
    name: 'Call',
    description: 'On Call',
    AM: 'every day',
    PM: 'every week on Friday, Saturday, Sunday',
    perSession: 1,
  },
  {
    name: 'RT',
    description: 'Recovery time',
    AM: 'every weekday',
    PM: '',
    perSession: [0, 1],
    perDay: 1,
  },
  {
    name: 'Neuro',
    description: 'Neurology Ward',
    AM: 'every weekday',
    PM: '',
    perDay: 1,
  },
  {
    name: 'Stroke',
    description: 'Stroke Ward',
    AM: 'every weekday',
    PM: '',
    perDay: 1,
  },
  {
    name: 'ACT',
    description: 'Acutes ACH',
    AM: 'every week on Thursday',
    PM: 'every week on Monday, Tuesday, Wednesday, Friday',
    perDay: 1,
  },
  {
    name: 'DSR',
    description: 'Daystay Reviews',
    AM: 'every weekday',
    PM: 'every week on Monday, Tuesday, Wednesday, Friday',
    perDay: 2,
    perSession: 1,
  },
  {
    name: 'TNP',
    description: 'Triage, ncFSA, Phone',
    AM: 'every weekday',
    PM: '',
    perDay: 1,
    perSession: 1,
  },
  {
    name: 'MMH',
    description: 'Middlemore Hospital consults',
    AM: 'every weekday',
    PM: 'every Friday',
    perDay: 1,
  },
  {
    name: 'NSH',
    description: 'Northshore Hospital consults',
    AM: 'every week on Monday, Wednesday, Friday',
    PM: '',
    perDay: 1,
  },
  {
    name: 'WTK',
    description: 'Waitakere Hospital consults',
    AM: 'every week on Monday, Wednesday',
    PM: '',
    perSession: 1,
  },
  {
    name: 'DSC',
    description: 'Daystay Clinic',
    AM: 'every weekday',
    PM: 'every week on Monday, Tuesday, Wednesday, Friday',
    perSession: [0, 2],
  },
  {
    name: 'OPC',
    description: 'Outpatient Clinic GLCC',
    AM: 'every week on Monday, Wednesday, Thursday',
    PM: 'every week on Monday, Tuesday, Wednesday, Friday',
    perSession: [0, 2],
  },
  {
    name: 'EMG',
    description: 'EMG',
    AM: 'every day',
    PM: 'every week on Monday, Tuesday, Wednesday, Friday',
    perSession: [0, 2],
  },
  {
    name: 'EEG',
    description: 'EEG',
    AM: 'every day',
    PM: 'every week on Monday, Tuesday, Wednesday, Friday',
    perSession: [0, 1],
  },
  {
    name: 'BTX',
    description: 'Botox',
    AM: 'every day',
    PM: 'every week on Monday, Tuesday, Wednesday, Friday',
    perSession: [0, 3],
  },
];
