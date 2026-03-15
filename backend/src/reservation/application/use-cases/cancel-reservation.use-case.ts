import type { IReservationRepository } from '../../domain/repositories/reservation.repository.interface';
import type { CancelScope } from '../../domain/entities/reservation.entity';
import {
  ReservationNotFoundError,
  ReservationForbiddenError,
} from '../../domain/errors/reservation.errors';

export class CancelReservationUseCase {
  constructor(private readonly reservationRepository: IReservationRepository) {}

  async run(reservationId: string, userId: string, scope: CancelScope = 'this', role?: string) {
    const existing = await this.reservationRepository.findById(reservationId, userId);
    if (!existing) {
      throw new ReservationNotFoundError('Réservation introuvable.');
    }
    const isAdmin = role === 'admin';
    if (!isAdmin && existing.userId !== userId) {
      throw new ReservationForbiddenError(
        'Vous ne pouvez annuler que vos propres réservations.',
      );
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
