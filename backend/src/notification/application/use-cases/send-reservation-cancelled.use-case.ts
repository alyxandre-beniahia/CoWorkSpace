import type { ReservationNotificationPayload } from '../../domain/entities/reservation-notification.payload';
import type { INotificationEmailSender } from '../ports/notification-email-sender.port';
import type { INotificationLogRepository } from '../../domain/repositories/notification-log.repository.interface';

export class SendReservationCancelledUseCase {
  constructor(
    private readonly emailSender: INotificationEmailSender,
    private readonly logRepository: INotificationLogRepository,
  ) {}

  async run(payload: ReservationNotificationPayload): Promise<void> {
    await this.emailSender.sendReservationCancelled(payload.userEmail, payload);
    await this.logRepository.create({
      type: 'RESERVATION_CANCELLED',
      userId: payload.userId,
      reservationId: payload.reservationId,
    });
  }
}
