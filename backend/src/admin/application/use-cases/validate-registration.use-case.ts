import type { IAdminMemberRepository } from '../../domain/repositories/admin-member.repository.interface';

/** Valide une inscription en attente. Notification exclue pour l'instant. */
export class ValidateRegistrationUseCase {
  constructor(private readonly memberRepository: IAdminMemberRepository) {}

  async run(userId: string, adminUserId: string) {
    return this.memberRepository.validateRegistration(userId, adminUserId);
  }
}
