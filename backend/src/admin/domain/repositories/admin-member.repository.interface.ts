import type {
  MemberListItem,
  ListMembersFilter,
  ValidateRegistrationResult,
  RejectRegistrationResult,
} from '../entities/admin-member.entity';

export const ADMIN_MEMBER_REPOSITORY = 'IAdminMemberRepository';

export interface IAdminMemberRepository {
  list(filter: ListMembersFilter): Promise<MemberListItem[]>;
  validateRegistration(userId: string, adminUserId: string): Promise<ValidateRegistrationResult>;
  rejectRegistration(userId: string): Promise<RejectRegistrationResult>;
  setMemberActive(userId: string, isActive: boolean): Promise<{ isActive: boolean }>;
}
