import type { ListMembersFilter } from '../../domain/entities/admin-member.entity';

export type ListMembersQueryDto = {
  filter?: ListMembersFilter;
};
