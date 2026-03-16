/**
 * Types métier pour les membres (admin). Aucune dépendance externe.
 */

export type MemberListItem = {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  isActive: boolean;
  emailVerifiedAt: Date | null;
  approvedAt: Date | null;
  role: { slug: string };
};

export type ListMembersFilter = 'pending' | 'members' | 'all';

export type ValidateRegistrationResult = { message: string; email: string };

export type RejectRegistrationResult = { message: string; email: string };
