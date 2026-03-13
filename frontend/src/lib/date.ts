import { startOfWeek, endOfWeek, startOfDay, endOfDay } from 'date-fns';

export function getWeekRange(date: Date): { start: Date; end: Date } {
  const start = startOfWeek(date, { weekStartsOn: 1 }); // lundi
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return { start, end };
}

export function getDayRange(date: Date): { start: Date; end: Date } {
  const start = startOfDay(date);
  const end = endOfDay(date);
  return { start, end };
}

export function toIsoString(date: Date): string {
  return date.toISOString();
}

