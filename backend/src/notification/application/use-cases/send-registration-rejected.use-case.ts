import type { INotificationEmailSender } from '../ports/notification-email-sender.port';
import type { INotificationLogRepository } from '../../domain/repositories/notification-log.repository.interface';

export class SendRegistrationRejectedUseCase {
  constructor(
    private readonly emailSender: INotificationEmailSender,
    private readonly logRepository: INotificationLogRepository,
  ) {}

  async run(email: string, userId: string): Promise<void> {
    await this.emailSender.sendRegistrationRejected(email);
    await this.logRepository.create({
      type: 'REGISTRATION_REJECTED',
      userId,
      reservationId: null,
    });
  }
}
