import type { IReservationRepository } from '../../domain/repositories/reservation.repository.interface';
import type { CancelScope } from '../../domain/entities/reservation.entity';
import {
  ReservationNotFoundError,
  ReservationForbiddenError,
} from '../../domain/errors/reservation.errors';
import type { INotificationSender } from '../../../notification/application/ports/notification-sender.port';
import type { ReservationNotificationPayload } from '../../../notification/domain/entities/reservation-notification.payload';

function toPayload(
  r: { id: string; userId: string; userEmail: string; spaceName: string; startDatetime: Date; endDatetime: Date; title: string | null },
): ReservationNotificationPayload {
  return {
    userId: r.userId,
    userEmail: r.userEmail,
    reservationId: r.id,
    spaceName: r.spaceName,
    startDatetime: r.startDatetime,
    endDatetime: r.endDatetime,
    title: r.title,
  };
}

export class CancelReservationUseCase {
  constructor(
    private readonly reservationRepository: IReservationRepository,
    private readonly notificationSender: INotificationSender,
  ) {}

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

    const payload = toPayload(existing);
    let deleted: boolean | number;
    if (scope === 'all' && existing.recurrenceGroupId) {
      const count = await this.reservationRepository.softDeleteByRecurrenceGroupId(
        existing.recurrenceGroupId,
      );
      deleted = count > 0;
    } else {
      deleted = await this.reservationRepository.softDelete(reservationId);
    }
    if (deleted) {
      await this.notificationSender.sendReservationCancelled(payload);
    }
    return { success: !!deleted };
  }
}
