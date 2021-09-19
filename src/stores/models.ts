export type Time = 'AM' | 'PM';

export interface RosterEntry {
  date: Date;
  time: Time;
  activity: string;
  smo: string;
  notes: string;
  version: string;
}

export interface SearchRosterEntry {
  date: Date;
  time: Time;
  activity?: string;
  smo?: string;
}
export interface SetRosterEntry {
  activity?: string;
  smo?: string;
  notes?: string;
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
}

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
