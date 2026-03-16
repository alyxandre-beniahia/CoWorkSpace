import type { IAdminMemberRepository } from '../../domain/repositories/admin-member.repository.interface';
import type { INotificationSender } from '../../../notification/application/ports/notification-sender.port';

export class ValidateRegistrationUseCase {
  constructor(
    private readonly memberRepository: IAdminMemberRepository,
    private readonly notificationSender: INotificationSender,
  ) {}

  async run(userId: string, adminUserId: string) {
    const result = await this.memberRepository.validateRegistration(
      userId,
      adminUserId,
    );
    await this.notificationSender.sendRegistrationApproved(result.email, userId);
    return result;
  }
}
