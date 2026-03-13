import { describe, it, expect } from '@jest/globals';
import { ListReservationsForCalendarUseCase } from './list-reservations-for-calendar.use-case';
import type { IReservationRepository, ReservationCalendarItem } from '../domain/reservation.repository.interface';

class InMemoryReservationRepository implements IReservationRepository {
  constructor(private readonly items: ReservationCalendarItem[]) {}

  async listForCalendar(): Promise<ReservationCalendarItem[]> {
    return this.items;
  }
}

describe('ListReservationsForCalendarUseCase', () => {
  it('rejette une période invalide (end <= start)', async () => {
    const repo = new InMemoryReservationRepository([]);
    const useCase = new ListReservationsForCalendarUseCase(repo);
    const now = new Date();
    await expect(
      useCase.run({
        start: now,
        end: now,
        currentUserId: 'u1',
      }),
    ).rejects.toBeInstanceOf(Error);
  });

  it('masque le titre pour les réservations privées dont l’utilisateur n’est pas propriétaire', async () => {
    const items: ReservationCalendarItem[] = [
      {
        id: 'r1',
        spaceId: 's1',
        userId: 'owner',
        startDatetime: new Date(),
        endDatetime: new Date(),
        isPrivate: true,
        title: 'Réunion secrète',
      },
    ];
    const repo = new InMemoryReservationRepository(items);
    const useCase = new ListReservationsForCalendarUseCase(repo);
    const now = new Date();
    const result = await useCase.run({
      start: new Date(now.getTime() - 1000),
      end: new Date(now.getTime() + 1000),
      currentUserId: 'other',
    });

    expect(result[0].effectiveTitle).toBe('Occupé');
  });
}

