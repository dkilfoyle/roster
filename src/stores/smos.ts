import { ActivityDefinition } from './activities';

export interface SMODefinition {
  name: string;
  endDate: Date | null;
  activities: Array<string>;
  NCT: Array<ActivityDefinition>;
}

const clinics = ['DSR', 'DSC', 'OPC', 'FSC'];
const wards = ['Neuro', 'Stroke'];
const hr = ['AL', 'CME', 'SD', 'NCT'];

export const smos: Array<SMODefinition> = [
  {
    name: 'DK',
    endDate: null,
    activities: [
      ...hr,
      ...wards,
      ...clinics,
      'ACT',
      'EMG',
      'WDHB',
      'Call',
      'ADM',
    ],
    NCT: [
      {
        name: 'WDHB',
        AM: 'every Monday, Friday',
        PM: 'every Monday',
      },
      {
        name: 'NCT',
        AM: '',
        PM: 'every Wednesday, Friday',
      },
    ],
  },
  {
    name: 'NA',
    endDate: null,
    activities: [...hr, ...wards, ...clinics, 'ACT', 'MMH', 'ADM'],
    NCT: [
      {
        name: 'WDHB',
        AM: 'every Monday, Friday',
        PM: 'every Monday',
      },
    ],
  },
  {
    name: 'AB',
    endDate: null,
    activities: [...hr, ...wards, ...clinics, 'ACT', 'NSH', 'ADM', 'UNI'],
    NCT: [
      {
        name: 'NCT',
        AM: 'every Monday, Friday',
        PM: 'every Monday',
      },
      {
        name: 'UNI',
        AM: 'every Monday, Friday',
        PM: 'every Monday',
      },
    ],
  },
  {
    name: 'PB',
    endDate: null,
    activities: [...hr, ...wards, ...clinics, 'ACT', 'NSH', 'ADM', 'Epi'],
    NCT: [
      {
        name: 'NCT',
        AM: 'every Monday, Friday',
        PM: 'every Monday',
      },
    ],
  },
];
