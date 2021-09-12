export interface ActivityDefinition {
  name: string;
  description?: string;
  type?: string;
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
    type: 'Leave',
    AM: 'every weekday',
    PM: 'every weekday',
  },
  {
    name: 'CME',
    description: 'CME Leave',
    type: 'Leave',
    AM: 'every weekday',
    PM: 'every weekday',
  },
  {
    name: 'Call',
    description: 'On Call',
    type: 'Call',
    AM: 'every day',
    PM: 'every week on Friday, Saturday, Sunday',
    perSession: 1,
  },
  {
    name: 'RT',
    description: 'Recovery time',
    type: 'Call',
    AM: 'every weekday',
    PM: '',
    perSession: [0, 1],
    perDay: 1,
  },
  {
    name: 'Neuro',
    description: 'Neurology Ward',
    type: 'Inpatient',
    AM: 'every weekday',
    PM: '',
    perDay: 1,
  },
  {
    name: 'Stroke',
    description: 'Stroke Ward',
    type: 'Inpatient',
    AM: 'every weekday',
    PM: '',
    perDay: 1,
  },
  {
    name: 'ACT',
    description: 'Acutes ACH',
    type: 'Inpatient',
    AM: 'every week on Thursday',
    PM: 'every week on Monday, Tuesday, Wednesday, Friday',
    perDay: 1,
  },
  {
    name: 'DSR',
    description: 'Daystay Reviews',
    type: 'Clinic',
    AM: 'every weekday',
    PM: 'every week on Monday, Tuesday, Wednesday, Friday',
    perDay: 2,
    perSession: 1,
  },
  {
    name: 'TNP',
    description: 'Triage, ncFSA, Phone',
    type: 'Clinic',
    AM: 'every weekday',
    PM: '',
    perDay: 1,
    perSession: 1,
  },
  {
    name: 'MMH',
    description: 'Middlemore Hospital consults',
    type: 'Consults',
    AM: 'every weekday',
    PM: 'every Friday',
    perDay: 1,
  },
  {
    name: 'NSH',
    description: 'Northshore Hospital consults',
    type: 'Consults',
    AM: 'every week on Monday, Wednesday, Friday',
    PM: '',
    perDay: 1,
  },
  {
    name: 'WTH',
    description: 'Waitakere Hospital consults',
    type: 'Consults',
    AM: '',
    PM: 'every week on Monday, Wednesday',
    perSession: 1,
  },
  {
    name: 'DSC',
    description: 'Daystay Clinic',
    type: 'Clinic',
    AM: 'every weekday',
    PM: 'every week on Monday, Tuesday, Wednesday, Friday',
    perSession: [0, 2],
  },
  {
    name: 'OPC',
    description: 'Outpatient Clinic GLCC',
    type: 'Clinic',
    AM: 'every week on Monday, Wednesday, Thursday, Friday',
    PM: 'every week on Monday, Tuesday, Wednesday, Friday',
    perSession: [0, 2],
  },
  {
    name: 'EMG',
    description: 'EMG',
    type: 'Procedure',
    AM: 'every day',
    PM: 'every week on Monday, Tuesday, Wednesday, Friday',
    perSession: [0, 2],
  },
  {
    name: 'EEG',
    description: 'EEG',
    type: 'Procedure',
    AM: 'every day',
    PM: 'every week on Monday, Tuesday, Wednesday, Friday',
    perSession: [0, 1],
  },
  {
    name: 'BTX',
    description: 'Botox',
    type: 'Procedure',
    AM: 'every day',
    PM: 'every week on Monday, Tuesday, Wednesday, Friday',
    perSession: [0, 3],
  },
];
