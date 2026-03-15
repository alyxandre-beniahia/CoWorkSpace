import type { IAdminMemberRepository } from '../../domain/repositories/admin-member.repository.interface';

export class SetMemberActiveUseCase {
  constructor(private readonly memberRepository: IAdminMemberRepository) {}

  async run(userId: string, isActive: boolean) {
    return this.memberRepository.setMemberActive(userId, isActive);
  }
}
