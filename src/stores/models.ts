export type Time = 'AM' | 'PM';

export interface RosterData {
  date: Date;
  time: Time;
  activity: string;
  smo: string;
  notes: string;
  version: string;
}

export interface RosterEntry extends RosterData {
  id: string;
}

export interface SearchRosterEntry {
  date?: Date;
  time?: Time;
  smo?: string;
  activity?: string;
  version?: string;
}
export interface SetRosterEntry {
  activity?: string;
  notes?: string;
  version?: string;
}

export type RosterLookup = Record<string, Array<RosterEntry>>;

export interface ActivityDefinition {
  name: string;
  description?: string;
  type?: string;
  AM: string;
  PM: string;
  allowedDates?: { AM: Array<Date>; PM: Array<Date> };
  perDay?: [number, number] | number;
  perSession?: [number, number] | number;
  perWeek?: number;
  perMonth?: number;
}

export interface SMOActivitySummary {
  name: string;
  Call: number;
  WeekendA: number;
  WeekendB: number;
  PH: number;
  Neuro: number;
  Stroke: number;
  ACT: number;
  NSH: number;
  WTH: number;
  MMH: number;
  EMG: number;
  EEG: number;
  BTX: number;
  ANL: number;
  CME: number;
}

export type SMOActivityName =
  | 'Call'
  | 'WeekendA'
  | 'WeekendB'
  | 'PH'
  | 'Neuro'
  | 'Stroke'
  | 'ACT'
  | 'NSH'
  | 'WTH'
  | 'MMH'
  | 'EMG'
  | 'EEG'
  | 'BTX'
  | 'ANL'
  | 'CME';

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
  group: number;
  generateNCT: boolean;
}

export interface SMOCellDefinition {
  smoName: string;
  time: Time;
  date: Date;
}
