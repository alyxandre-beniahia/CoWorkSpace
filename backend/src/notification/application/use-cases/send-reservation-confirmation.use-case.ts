import type { ReservationNotificationPayload } from '../../domain/entities/reservation-notification.payload';
import type { INotificationEmailSender } from '../ports/notification-email-sender.port';
import type { INotificationLogRepository } from '../../domain/repositories/notification-log.repository.interface';

export class SendReservationConfirmationUseCase {
  constructor(
    private readonly emailSender: INotificationEmailSender,
    private readonly logRepository: INotificationLogRepository,
  ) {}

  async run(payload: ReservationNotificationPayload): Promise<void> {
    await this.emailSender.sendReservationConfirmation(payload.userEmail, payload);
    await this.logRepository.create({
      type: 'RESERVATION_CONFIRMATION',
      userId: payload.userId,
      reservationId: payload.reservationId,
    });
  }
}
