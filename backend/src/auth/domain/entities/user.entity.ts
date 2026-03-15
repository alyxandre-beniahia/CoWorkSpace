/**
 * Types métier du domaine auth. Aucune dépendance à Prisma ou Nest.
 */

export type UserTokenType = 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';

export type User = {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  avatarUrl: string | null;
  emailVerifiedAt: Date | null;
  roleId: string;
};

export type UserWithRole = User & {
  role: { slug: string };
};

/** Utilisateur avec hash du mot de passe (usage limité au login). */
export type UserForLogin = {
  id: string;
  email: string;
  passwordHash: string;
  isActive: boolean;
  role: { slug: string };
};

/** Profil utilisateur pour GET /me et formulaire profil. */
export type MeResult = {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  phone?: string | null;
  avatarUrl?: string | null;
  role: { slug: string };
};

export type CreateUserInput = {
  firstname: string;
  lastname: string;
  email: string;
  passwordHash: string;
  roleId: string;
  isActive?: boolean;
};

export type UpdateUserProfileInput = {
  firstname?: string;
  lastname?: string;
  phone?: string | null;
};
