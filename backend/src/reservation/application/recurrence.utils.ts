import { rrulestr } from 'rrule';

/**
 * Formate une date au format iCalendar (YYYYMMDDTHHmmssZ).
 */
function toICSDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Génère les occurrences à partir d'une règle RRULE.
 * @param recurrenceRule Ex. "FREQ=WEEKLY;BYDAY=TU"
 * @param firstStart Date/heure de la première occurrence
 * @param firstEnd Date/heure de fin de la première occurrence
 * @param recurrenceEndAt Date limite de récurrence
 * @returns Tableau de { startDatetime, endDatetime }
 */
export function expandRecurrence(
  recurrenceRule: string,
  firstStart: Date,
  firstEnd: Date,
  recurrenceEndAt: Date,
): { startDatetime: Date; endDatetime: Date }[] {
  const durationMs = firstEnd.getTime() - firstStart.getTime();
  const dtstart = toICSDate(firstStart);
  const until = toICSDate(recurrenceEndAt);
  const rruleStr = `DTSTART:${dtstart}\nRRULE:${recurrenceRule};UNTIL=${until}`;

  const rule = rrulestr(rruleStr);
  const startDates = rule.between(firstStart, recurrenceEndAt, true);

  return startDates.map((start: Date) => ({
    startDatetime: start,
    endDatetime: new Date(start.getTime() + durationMs),
  }));
}
