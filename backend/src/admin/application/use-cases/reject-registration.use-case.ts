import type { IAdminMemberRepository } from '../../domain/repositories/admin-member.repository.interface';
import type { INotificationSender } from '../../../notification/application/ports/notification-sender.port';

export class RejectRegistrationUseCase {
  constructor(
    private readonly memberRepository: IAdminMemberRepository,
    private readonly notificationSender: INotificationSender,
  ) {}

  async run(userId: string) {
    const result = await this.memberRepository.rejectRegistration(userId);
    await this.notificationSender.sendRegistrationRejected(result.email, userId);
    return result;
  }
}
