import { ActivityDefinition } from './activities';

export interface SMODefinition {
  name: string;
  fullName: string;
  endDate: Date | null;
  activities: Array<string>;
  NCT: Array<ActivityDefinition>;
  allowedDates?: {
    AM: Array<Date>;
    PM: Array<Date>;
  };
}

const clinics = ['DSR', 'DSC', 'OPC', 'TNP', 'ncFSA', 'FSC', 'SPC', 'PCL'];
const wards = ['Neuro', 'Stroke'];
const hr = ['ANL', 'CME', 'PL', 'JS', 'SD', 'NCT', 'TIL'];
const call = ['Call', 'RT'];
const full = [...clinics, ...wards, ...hr, 'CRS', 'ACT', 'ADM'];

export const smos: Array<SMODefinition> = [
  {
    name: 'DK',
    fullName: 'Dean Kilfoyle',
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
    fullName: 'Neil Anderson',
    endDate: null,
    activities: [...full, ...call, 'MSC', 'MMH'],
    NCT: [
      {
        name: 'NCT',
        AM: 'every Tuesday',
        PM: 'every Monday',
      },
    ],
  },
  {
    name: 'AB',
    fullName: 'Alan Barber',
    endDate: null,
    activities: [...full, ...call, 'UNI', 'NSH', 'WRE', 'MS'],
    NCT: [
      {
        name: 'UNI',
        AM: 'every Wednesday, Thursday, Friday',
        PM: 'every Tuesday, Wednesday',
      },
    ],
  },
  {
    name: 'PB',
    fullName: 'Peter Bergin',
    endDate: null,
    activities: [...full, ...call, 'NSH', 'Epi', 'EEG'],
    NCT: [
      {
        name: 'NCT',
        AM: 'every Friday',
        PM: 'every Wednesday, Friday',
      },
    ],
  },
  {
    name: 'AC',
    fullName: 'Alison Charleston',
    endDate: null,
    activities: ['OPC'],
    NCT: [
      {
        name: 'NCT',
        AM: 'every Monday, Tuesday, Thursday, Friday',
        PM: 'every weekday',
      },
    ],
  },
  {
    name: 'RF',
    fullName: 'Richard Frith',
    endDate: null,
    activities: [...full, 'BTX', 'EEG', 'EMG', 'WRE', 'A+T'],
    NCT: [
      {
        name: 'NCT',
        AM: 'every Thursday, Friday',
        PM: 'every Monday, Tuesday, Friday',
      },
    ],
  },
  {
    name: 'RH',
    fullName: 'Rosamund Hill',
    endDate: null,
    activities: [...clinics, 'EEG'],
    NCT: [
      {
        name: 'NCT',
        AM: 'every Monday, Tuesday, Wednesday',
        PM: 'every Monday, Wednesday, Thursday, Friday',
      },
    ],
  },
  {
    name: 'DH',
    fullName: 'David Hutchinson',
    endDate: null,
    activities: [...full, ...call, 'NSH', 'WTH', 'MMH', 'WRE', 'MMH'],
    NCT: [
      {
        name: 'NCT',
        AM: '',
        PM: 'every Friday',
      },
    ],
  },
  {
    name: 'JP',
    fullName: 'Jennifer Pereira',
    endDate: null,
    activities: [...full, ...call, 'MS'],
    NCT: [
      {
        name: 'NCT',
        AM: 'Every Tuesday, Wednesday, Friday',
        PM: 'Every Tuesday, Wednesday, Friday',
      },
    ],
  },
  {
    name: 'RR',
    fullName: 'Richard Roxburgh',
    endDate: null,
    activities: [...full, ...call, 'WRE', 'MMH', 'UNI', 'EFR'],
    NCT: [
      {
        name: 'Uni',
        AM: 'Every Wednesday, Friday',
        PM: 'Every Wednesday, Friday',
      },
    ],
  },
  {
    name: 'MS',
    fullName: 'Mark Simpson',
    endDate: null,
    activities: [...full, ...call, 'TBH', 'MMH', 'MSC', 'BTX', 'DBS', 'MD cl'],
    NCT: [
      {
        name: 'NCT',
        AM: 'Every Friday',
        PM: 'Every Friday',
      },
    ],
  },
  {
    name: 'BS',
    fullName: 'Barry Simpson',
    endDate: null,
    activities: [...full, ...call, 'TBH', 'BTX'],
    NCT: [
      {
        name: 'NCT',
        AM: 'Every Thursday',
        PM: 'Every Monday',
      },
      {
        name: 'MAN',
        AM: 'Every Monday, Tuesday, Wednesday, Friday',
        PM: 'Every Tuesday',
      },
    ],
  },
  {
    name: 'ElW',
    fullName: 'Elizabeth Walker',
    endDate: null,
    activities: [...full, 'EEG', 'EMG', 'BTX'],
    NCT: [
      {
        name: 'NCT',
        AM: 'every Monday, Wednesday',
        PM: 'every Monday',
      },
    ],
  },
  {
    name: 'EdW',
    fullName: 'Edward Wong',
    endDate: null,
    activities: [...full, ...call, 'CDHB', 'MMH', 'MSC', 'BTX'],
    NCT: [
      {
        name: 'NCT',
        AM: '',
        PM: 'every Monday',
      },
      {
        name: 'CDHB',
        AM: 'every Tuesday, Wednesday, Friday',
        PM: 'every Tuesday',
      },
    ],
  },
  {
    name: 'NC',
    fullName: 'Nicholas Child',
    endDate: null,
    activities: [...full, ...call, 'EEG', 'WDHB'],
    NCT: [
      {
        name: 'NCT',
        AM: 'every Friday',
        PM: '',
      },
    ],
  },
  {
    name: 'JB',
    fullName: 'Julian Bauer',
    endDate: null,
    activities: [...full, ...call, 'NSH', 'WTH', 'EMG', 'MND'],
    NCT: [
      {
        name: 'NCT',
        AM: '',
        PM: 'every Monday, Friday',
      },
    ],
  },
  {
    name: 'JK',
    fullName: 'Justin Kao',
    endDate: null,
    activities: [...full, ...call, 'NSH', 'WTH', 'EMG', 'WRE', 'MS'],
    NCT: [],
  },
  {
    name: 'PyB',
    fullName: 'Pyari Bose',
    endDate: null,
    activities: [...full, 'MMH', 'MSC'],
    NCT: [
      {
        name: 'NCT',
        AM: 'every Tuesday, Friday',
        PM: 'every Friday',
      },
    ],
  },
  {
    name: 'VD',
    fullName: 'Viswas Dayal',
    endDate: null,
    activities: [...full, ...call, 'MMH', 'MSC', 'DBS', 'MD cl'],
    NCT: [],
  },
  {
    name: 'SS',
    fullName: 'Sunayana Sasikumar',
    endDate: null,
    activities: [...full, 'FSC'],
    NCT: [{ name: 'NCT', AM: 'every Thursday', PM: 'every Monday' }],
  },
  {
    name: 'DM',
    fullName: 'David McAuley',
    endDate: null,
    activities: ['DSC', 'OPC'],
    NCT: [
      {
        name: 'NCT',
        AM: 'every Monday, Tuesday, Thursday',
        PM: 'every weekday',
      },
    ],
  },
  {
    name: 'PN',
    fullName: 'Petina Newton',
    endDate: null,
    activities: ['DSC'],
    NCT: [
      {
        name: 'NCT',
        AM: 'every Tuesday, Wednesday, Friday',
        PM: 'every weekday',
      },
    ],
  },
  {
    name: 'SD',
    fullName: 'Sue Davis',
    endDate: null,
    activities: ['EEG'],
    NCT: [
      {
        name: 'NCT',
        AM: 'every weekday',
        PM: 'every Monday, Tuesday, Thursday, Friday',
      },
    ],
  },
].sort((a, b) => {
  const nameA = a.name
    .slice(-1)
    .concat(a.name.slice(0, a.name.length - 1))
    .toUpperCase();
  const nameB = b.name
    .slice(-1)
    .concat(b.name.slice(0, b.name.length - 1))
    .toUpperCase();

  if (nameA < nameB) {
    return -1;
  }
  if (nameA > nameB) {
    return 1;
  }
  // names must be equal
  return 0;
});
