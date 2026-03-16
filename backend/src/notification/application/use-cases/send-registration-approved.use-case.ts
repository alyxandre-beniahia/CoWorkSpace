import type { INotificationEmailSender } from '../ports/notification-email-sender.port';
import type { INotificationLogRepository } from '../../domain/repositories/notification-log.repository.interface';

export class SendRegistrationApprovedUseCase {
  constructor(
    private readonly emailSender: INotificationEmailSender,
    private readonly logRepository: INotificationLogRepository,
  ) {}

  async run(email: string, userId: string): Promise<void> {
    await this.emailSender.sendRegistrationApproved(email);
    await this.logRepository.create({
      type: 'REGISTRATION_APPROVED',
      userId,
      reservationId: null,
    });
  }
}
