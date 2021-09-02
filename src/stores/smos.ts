import { ActivityDefinition } from './activities';

export interface SMODefinition {
  name: string;
  endDate: Date | null;
  activities: Array<string>;
  NCT: Array<ActivityDefinition>;
}

export const smos: Array<SMODefinition> = [
  {
    name: 'DK',
    endDate: null,
    activities: ['wards', 'ACT', 'clinics', 'EMG'],
    NCT: [
      {
        name: 'WDHB',
        AM: 'every Monday, Friday',
        PM: 'every Monday',
      },
    ],
  },
];
