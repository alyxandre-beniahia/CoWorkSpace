import type {
  User,
  UserWithRole,
  UserForLogin,
  MeResult,
  CreateUserInput,
  UpdateUserProfileInput,
  UserTokenType,
} from '../entities/user.entity';

/** Token d'injection pour l'implémentation du repository (utilisé par le module Nest). */
export const AUTH_USER_REPOSITORY = 'IUserRepository';

export interface IUserRepository {
  findById(id: string): Promise<UserWithRole | null>;
  findByIdWithPassword(userId: string): Promise<{ passwordHash: string } | null>;
  findByEmailForLogin(email: string): Promise<UserForLogin | null>;
  findByEmail(email: string): Promise<{ id: string } | null>;
  findRoleIdBySlug(slug: string): Promise<string | null>;
  createUser(input: CreateUserInput): Promise<User>;
  updateProfile(userId: string, input: UpdateUserProfileInput): Promise<UserWithRole>;
  updatePassword(userId: string, passwordHash: string): Promise<void>;
  createToken(type: UserTokenType, userId: string, token: string): Promise<void>;
  findAndConsumeEmailVerificationToken(
    token: string,
  ): Promise<{ userId: string } | { alreadyVerified: true } | null>;
  findAndConsumePasswordResetToken(token: string, newPasswordHash: string): Promise<boolean>;
}
