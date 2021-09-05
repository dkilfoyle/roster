import { ActivityDefinition } from './activities';

export interface SMODefinition {
  name: string;
  endDate: Date | null;
  activities: Array<string>;
  NCT: Array<ActivityDefinition>;
}

const clinics = ['DSR', 'DSC', 'OPC', 'TNP', 'ncFSA', 'FSC', 'SPC'];
const wards = ['Neuro', 'Stroke'];
const hr = ['ANL', 'CME', 'SD', 'NCT'];
const call = ['Call', 'RT'];
const full = [...clinics, ...wards, ...hr, 'CRS', 'ACT', 'ADM'];

export const smos: Array<SMODefinition> = [
  {
    name: 'DK',
    endDate: null,
    activities: [...full, ...call, 'EMG', 'WDHB'],
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
    activities: [...full, ...call, 'MSC', 'MMH'],
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
    activities: [...full, ...call, 'UNI', 'NSH', 'WRE'],
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
    activities: [...full, ...call, 'NSH', 'Epi', 'EEG'],
    NCT: [
      {
        name: 'NCT',
        AM: 'every Monday, Friday',
        PM: 'every Monday',
      },
    ],
  },
  {
    name: 'ElW',
    endDate: null,
    activities: [...full, 'EEG', 'EMG', 'BTX'],
    NCT: [
      {
        name: 'NCT',
        AM: 'every Monday, Friday',
        PM: 'every Monday',
      },
    ],
  },
  {
    name: 'NC',
    endDate: null,
    activities: [...full, ...call, 'EEG', 'WDHB'],
    NCT: [
      {
        name: 'NCT',
        AM: 'every Monday, Friday',
        PM: 'every Monday',
      },
    ],
  },
];
