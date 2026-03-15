import { startOfWeek, endOfWeek, startOfDay, endOfDay, add, format } from 'date-fns';

export function getWeekRange(date: Date): { start: Date; end: Date } {
  const start = startOfWeek(date, { weekStartsOn: 1 }); // lundi
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return { start, end };
}

/** Plage semaine en YYYY-MM-DD pour l’API (évite les décalages timezone : [lundi, lundi+7[ en UTC). */
export function getWeekRangeApiParams(date: Date): { start: string; end: string } {
  const { start } = getWeekRange(date);
  return {
    start: format(start, 'yyyy-MM-dd'),
    end: format(add(start, { days: 7 }), 'yyyy-MM-dd'),
  };
}

export function getDayRange(date: Date): { start: Date; end: Date } {
  const start = startOfDay(date);
  const end = endOfDay(date);
  return { start, end };
}

export function toIsoString(date: Date): string {
  return date.toISOString();
}

