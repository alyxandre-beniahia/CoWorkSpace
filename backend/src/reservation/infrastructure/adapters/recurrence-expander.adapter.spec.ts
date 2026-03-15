import { RecurrenceExpanderAdapter } from './recurrence-expander.adapter';

describe('RecurrenceExpanderAdapter (expand)', () => {
  const adapter = new RecurrenceExpanderAdapter();
  const firstStart = new Date('2026-04-01T10:00:00Z');
  const firstEnd = new Date('2026-04-01T11:00:00Z');
  const durationMs = 60 * 60 * 1000;

  it("FREQ=DAILY génère une occurrence par jour jusqu'à recurrenceEndAt", () => {
    const recurrenceEndAt = new Date('2026-04-05T23:59:59Z');

    const result = adapter.expand(
      'FREQ=DAILY',
      firstStart,
      firstEnd,
      recurrenceEndAt,
    );

    expect(result.length).toBe(5);
    expect(result[0].startDatetime).toEqual(firstStart);
    expect(result[0].endDatetime).toEqual(firstEnd);
    expect(result[1].startDatetime).toEqual(new Date('2026-04-02T10:00:00Z'));
    expect(result[4].startDatetime).toEqual(new Date('2026-04-05T10:00:00Z'));

    result.forEach((occ) => {
      expect(occ.endDatetime.getTime() - occ.startDatetime.getTime()).toBe(
        durationMs,
      );
    });
  });

  it('FREQ=WEEKLY;BYDAY=TU génère les occurrences les mardis', () => {
    const tuesdayStart = new Date('2026-04-07T09:00:00Z');
    const tuesdayEnd = new Date('2026-04-07T10:00:00Z');
    const recurrenceEndAt = new Date('2026-04-30T23:59:59Z');

    const result = adapter.expand(
      'FREQ=WEEKLY;BYDAY=TU',
      tuesdayStart,
      tuesdayEnd,
      recurrenceEndAt,
    );

    expect(result.length).toBeGreaterThanOrEqual(3);
    result.forEach((occ) => {
      expect(occ.startDatetime.getUTCDay()).toBe(2);
      expect(occ.endDatetime.getTime() - occ.startDatetime.getTime()).toBe(
        60 * 60 * 1000,
      );
    });
  });

  it('conserve la durée du créneau initial pour chaque occurrence', () => {
    const start = new Date('2026-04-01T14:00:00Z');
    const end = new Date('2026-04-01T15:30:00Z');
    const recurrenceEndAt = new Date('2026-04-04T23:59:59Z');

    const result = adapter.expand('FREQ=DAILY', start, end, recurrenceEndAt);

    const expectedDurationMs = 90 * 60 * 1000;
    result.forEach((occ) => {
      expect(occ.endDatetime.getTime() - occ.startDatetime.getTime()).toBe(
        expectedDurationMs,
      );
    });
  });

  it('retourne au moins la première occurrence si recurrenceEndAt >= firstStart', () => {
    const recurrenceEndAt = new Date('2026-04-01T10:00:00Z');

    const result = adapter.expand(
      'FREQ=DAILY',
      firstStart,
      firstEnd,
      recurrenceEndAt,
    );

    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].startDatetime).toEqual(firstStart);
    expect(result[0].endDatetime).toEqual(firstEnd);
  });

  it("avec timeZone Europe/Paris conserve la même heure locale après passage à l'heure d'été", () => {
    const firstStartParis = new Date('2026-03-28T09:00:00Z');
    const firstEndParis = new Date('2026-03-28T10:00:00Z');
    const recurrenceEndAt = new Date('2026-04-02T23:59:59Z');

    const result = adapter.expand(
      'FREQ=DAILY',
      firstStartParis,
      firstEndParis,
      recurrenceEndAt,
      'Europe/Paris',
    );

    const formatter = new Intl.DateTimeFormat('fr-FR', {
      timeZone: 'Europe/Paris',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    result.forEach((occ) => {
      const localTime = formatter.format(occ.startDatetime);
      expect(localTime).toBe('10:00');
    });
    expect(result.length).toBeGreaterThanOrEqual(5);
  });
});
