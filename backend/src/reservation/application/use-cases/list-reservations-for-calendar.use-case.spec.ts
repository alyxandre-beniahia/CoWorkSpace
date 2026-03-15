import { describe, it, expect } from '@jest/globals';
import type { ReservationCalendarItem } from '../../domain/entities/reservation.entity';
import { ListReservationsForCalendarUseCase } from './list-reservations-for-calendar.use-case';

describe('ListReservationsForCalendarUseCase', () => {
  it('retourne les réservations renvoyées par le repository', async () => {
    const items: ReservationCalendarItem[] = [
      {
        id: 'r1',
        spaceId: 's1',
        seatId: null,
        seatCode: null,
        userId: 'u1',
        startDatetime: new Date('2026-04-01T10:00:00Z'),
        endDatetime: new Date('2026-04-01T11:00:00Z'),
        isPrivate: false,
        title: 'Réunion',
      },
    ];
    const repo = { listForCalendar: async () => items };
    const useCase = new ListReservationsForCalendarUseCase(repo as any);
    const start = new Date('2026-04-01T00:00:00Z');
    const end = new Date('2026-04-01T23:59:59Z');
    const result = await useCase.run({ start, end });
    expect(result).toEqual(items);
  });

  it('passe spaceId au repository quand fourni', async () => {
    let capturedParams: { spaceId?: string; start: Date; end: Date } | null = null;
    const repo = {
      listForCalendar: async (params: { spaceId?: string; start: Date; end: Date }) => {
        capturedParams = params;
        return [];
      },
    };
    const useCase = new ListReservationsForCalendarUseCase(repo as any);
    const start = new Date();
    const end = new Date();
    await useCase.run({ spaceId: 'space-1', start, end });
    expect(capturedParams).not.toBeNull();
    expect(capturedParams!.spaceId).toBe('space-1');
    expect(capturedParams!.start).toBe(start);
    expect(capturedParams!.end).toBe(end);
  });
});
