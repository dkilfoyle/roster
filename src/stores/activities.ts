export interface ActivityDefinition {
  name: string;
  description?: string;
  AM: string;
  PM: string;
  validDates?: { AM: Array<Date>; PM: Array<Date> };
}

export const activities: Array<ActivityDefinition> = [
  {
    name: 'Neuro',
    description: 'Neurology Ward',
    AM: 'every weekday',
    PM: '',
  },
  {
    name: 'Stroke',
    description: 'Stroke Ward',
    AM: 'every weekday',
    PM: '',
  },
  {
    name: 'ACT',
    description: 'Acutes ACH',
    AM: 'every week on Thursday',
    PM: 'every week on Monday, Tuesday, Wednesday, Friday',
  },
  {
    name: 'DSR',
    description: 'Daystay Reviews',
    AM: 'every weekday',
    PM: 'every weekday',
  },
  {
    name: 'MMH',
    description: 'Middlemore Hospital consults',
    AM: 'every weekday',
    PM: 'every Friday',
  },
  {
    name: 'NSH',
    description: 'Northshore Hospital consults',
    AM: 'every week on Monday, Wednesday, Friday',
    PM: '',
  },
  {
    name: 'WTK',
    description: 'Waitakere Hospital consults',
    AM: 'every week on Monday, Wednesday',
    PM: '',
  },
];
