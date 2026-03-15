import { Injectable } from '@nestjs/common';
import { rrulestr } from 'rrule';
import type {
  IRecurrenceExpander,
  RecurrenceOccurrence,
} from '../../application/ports/recurrence-expander.port';

function toICSDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

const PARTS_OPTS: Intl.DateTimeFormatOptions = {
  timeZone: 'UTC',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
};

type DateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function getPartsInZone(d: Date, timeZone: string): DateParts {
  const formatter = new Intl.DateTimeFormat('en-CA', { ...PARTS_OPTS, timeZone });
  const parts = formatter.formatToParts(d);
  const get = (name: string) => {
    const p = parts.find((x) => x.type === name);
    return p ? parseInt(p.value, 10) : 0;
  };
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
    second: get('second'),
  };
}

function getOffsetMsForZone(d: Date, timeZone: string): number {
  const str = d.toLocaleString('ja', { timeZone });
  const a = str.split(/[/\s:]/).map((x) => parseInt(x, 10));
  if (a.length < 5) return 0;
  a[1] -= 1;
  const localAsUtc = Date.UTC(a[0], a[1], a[2], a[3], a[4], a[5] || 0);
  return d.getTime() - localAsUtc;
}

function localInZoneToUtc(parts: DateParts, timeZone: string): Date {
  const localNaive = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  const dGuess = new Date(localNaive);
  const offsetMs = getOffsetMsForZone(dGuess, timeZone);
  return new Date(localNaive + offsetMs);
}

@Injectable()
export class RecurrenceExpanderAdapter implements IRecurrenceExpander {
  expand(
    recurrenceRule: string,
    firstStart: Date,
    firstEnd: Date,
    recurrenceEndAt: Date,
    timeZone?: string,
  ): RecurrenceOccurrence[] {
    const durationMs = firstEnd.getTime() - firstStart.getTime();
    const dtstart = toICSDate(firstStart);
    const until = toICSDate(recurrenceEndAt);
    const rruleStr = `DTSTART:${dtstart}\nRRULE:${recurrenceRule};UNTIL=${until}`;

    const rule = rrulestr(rruleStr);
    const startDates = rule.between(firstStart, recurrenceEndAt, true) as Date[];

    if (timeZone) {
      const firstStartParts = getPartsInZone(firstStart, timeZone);
      return startDates.map((start: Date) => {
        const dateParts = getPartsInZone(start, timeZone);
        const startUtc = localInZoneToUtc(
          {
            ...dateParts,
            hour: firstStartParts.hour,
            minute: firstStartParts.minute,
            second: firstStartParts.second,
          },
          timeZone,
        );
        return {
          startDatetime: startUtc,
          endDatetime: new Date(startUtc.getTime() + durationMs),
        };
      });
    }

    return startDates.map((start: Date) => ({
      startDatetime: start,
      endDatetime: new Date(start.getTime() + durationMs),
    }));
  }
}
