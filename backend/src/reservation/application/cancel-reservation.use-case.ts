import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ReservationRepository } from '../infrastructure/reservation.repository';

export type CancelScope = 'this' | 'all';

@Injectable()
export class CancelReservationUseCase {
  constructor(private readonly reservationRepository: ReservationRepository) {}

  async run(reservationId: string, userId: string, scope: CancelScope = 'this', role?: string) {
    const existing = await this.reservationRepository.findById(reservationId, userId);
    if (!existing) {
      throw new NotFoundException('Réservation introuvable.');
    }
    const isAdmin = role === 'admin';
    if (!isAdmin && existing.userId !== userId) {
      throw new ForbiddenException('Vous ne pouvez annuler que vos propres réservations.');
    }

    let deleted: boolean | number;
    if (scope === 'all' && existing.recurrenceGroupId) {
      const count = await this.reservationRepository.softDeleteByRecurrenceGroupId(
        existing.recurrenceGroupId,
      );
      deleted = count > 0;
    } else {
      deleted = await this.reservationRepository.softDelete(reservationId);
    }
    return { success: !!deleted };
  }
}

