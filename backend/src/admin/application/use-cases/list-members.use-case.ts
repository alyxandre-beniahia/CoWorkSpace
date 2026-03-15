import type { IAdminMemberRepository } from '../../domain/repositories/admin-member.repository.interface';
import type { ListMembersQueryDto } from '../dtos/list-members-query.dto';

export class ListMembersUseCase {
  constructor(private readonly memberRepository: IAdminMemberRepository) {}

  async run(query: ListMembersQueryDto) {
    const filter = query.filter ?? 'all';
    return this.memberRepository.list(filter);
  }
}
