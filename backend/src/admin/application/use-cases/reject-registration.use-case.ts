import type { IAdminMemberRepository } from '../../domain/repositories/admin-member.repository.interface';

/** Refuse une inscription en attente. Notification exclue pour l'instant. */
export class RejectRegistrationUseCase {
  constructor(private readonly memberRepository: IAdminMemberRepository) {}

  async run(userId: string) {
    return this.memberRepository.rejectRegistration(userId);
  }
}
