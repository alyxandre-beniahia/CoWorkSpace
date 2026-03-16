import type { ReservationNotificationPayload } from '../../domain/entities/reservation-notification.payload';
import type { INotificationEmailSender } from '../ports/notification-email-sender.port';
import type { INotificationLogRepository } from '../../domain/repositories/notification-log.repository.interface';

export class SendReservationReminder24hUseCase {
  constructor(
    private readonly emailSender: INotificationEmailSender,
    private readonly logRepository: INotificationLogRepository,
  ) {}

  async run(payload: ReservationNotificationPayload): Promise<void> {
    await this.emailSender.sendReservationReminder24h(payload.userEmail, payload);
    await this.logRepository.create({
      type: 'RESERVATION_REMINDER_24H',
      userId: payload.userId,
      reservationId: payload.reservationId,
    });
  }
}
