import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { AUTH_USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import type {
  User,
  UserWithRole,
  UserForLogin,
  CreateUserInput,
  UpdateUserProfileInput,
  UserTokenType,
} from '../../domain/entities/user.entity';

const TOKEN_TYPE_MAP: Record<UserTokenType, 'EMAIL_VERIFICATION' | 'PASSWORD_RESET'> = {
  EMAIL_VERIFICATION: 'EMAIL_VERIFICATION',
  PASSWORD_RESET: 'PASSWORD_RESET',
};

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<UserWithRole | null> {
    const r = await this.prisma.user.findUnique({
      where: { id },
      include: { role: { select: { slug: true } } },
    });
    if (!r) return null;
    return this.mapToUserWithRole(r);
  }

  async findByIdWithPassword(userId: string): Promise<{ passwordHash: string } | null> {
    const r = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });
    return r ? { passwordHash: r.password } : null;
  }

  async findByEmailForLogin(email: string): Promise<UserForLogin | null> {
    const r = await this.prisma.user.findUnique({
      where: { email },
      include: { role: { select: { slug: true } } },
    });
    if (!r) return null;
    return {
      id: r.id,
      email: r.email,
      passwordHash: r.password,
      isActive: r.isActive,
      role: { slug: r.role.slug },
    };
  }

  async findByEmail(email: string): Promise<{ id: string } | null> {
    const r = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    return r ? { id: r.id } : null;
  }

  async findRoleIdBySlug(slug: string): Promise<string | null> {
    const r = await this.prisma.role.findUnique({
      where: { slug },
      select: { id: true },
    });
    return r?.id ?? null;
  }

  async createUser(input: CreateUserInput): Promise<User> {
    const r = await this.prisma.user.create({
      data: {
        firstname: input.firstname,
        lastname: input.lastname,
        email: input.email,
        password: input.passwordHash,
        roleId: input.roleId,
        isActive: input.isActive ?? false,
      },
    });
    return this.mapToUser(r);
  }

  async updateProfile(
    userId: string,
    input: UpdateUserProfileInput,
  ): Promise<UserWithRole> {
    const r = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.firstname !== undefined && { firstname: input.firstname }),
        ...(input.lastname !== undefined && { lastname: input.lastname }),
        ...(input.phone !== undefined && { phone: input.phone }),
      },
      include: { role: { select: { slug: true } } },
    });
    return this.mapToUserWithRole(r);
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: passwordHash },
    });
  }

  async createToken(
    type: UserTokenType,
    userId: string,
    token: string,
  ): Promise<void> {
    await this.prisma.userToken.create({
      data: {
        type: TOKEN_TYPE_MAP[type],
        token,
        userId,
      },
    });
  }

  async findAndConsumeEmailVerificationToken(
    token: string,
  ): Promise<{ userId: string } | { alreadyVerified: true } | null> {
    const tokenTrimmed = token.trim();
    const userToken = await this.prisma.userToken.findFirst({
      where: {
        type: 'EMAIL_VERIFICATION',
        token: tokenTrimmed,
        deletedAt: null,
      },
      include: { user: true },
    });

    if (userToken?.user) {
      if (userToken.user.emailVerifiedAt) {
        return { alreadyVerified: true };
      }
      await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: userToken.userId },
          data: { emailVerifiedAt: userToken.user.emailVerifiedAt ?? new Date() },
        }),
        this.prisma.userToken.update({
          where: { id: userToken.id },
          data: { deletedAt: new Date() },
        }),
      ]);
      return { userId: userToken.userId };
    }

    const alreadyUsed = await this.prisma.userToken.findFirst({
      where: { type: 'EMAIL_VERIFICATION', token: tokenTrimmed },
      include: { user: true },
    });
    if (alreadyUsed?.user?.emailVerifiedAt) {
      return { alreadyVerified: true };
    }
    return null;
  }

  async findAndConsumePasswordResetToken(
    token: string,
    newPasswordHash: string,
  ): Promise<boolean> {
    const userToken = await this.prisma.userToken.findFirst({
      where: {
        type: 'PASSWORD_RESET',
        token,
        deletedAt: null,
      },
      include: { user: true },
    });

    if (!userToken?.user) return false;

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userToken.userId },
        data: { password: newPasswordHash },
      }),
      this.prisma.userToken.update({
        where: { id: userToken.id },
        data: { deletedAt: new Date() },
      }),
    ]);
    return true;
  }

  private mapToUser(r: {
    id: string;
    firstname: string;
    lastname: string;
    email: string;
    phone: string | null;
    isActive: boolean;
    avatarUrl: string | null;
    emailVerifiedAt: Date | null;
    roleId: string;
  }): User {
    return {
      id: r.id,
      firstname: r.firstname,
      lastname: r.lastname,
      email: r.email,
      phone: r.phone,
      isActive: r.isActive,
      avatarUrl: r.avatarUrl,
      emailVerifiedAt: r.emailVerifiedAt,
      roleId: r.roleId,
    };
  }

  private mapToUserWithRole(r: {
    id: string;
    firstname: string;
    lastname: string;
    email: string;
    phone: string | null;
    isActive: boolean;
    avatarUrl: string | null;
    emailVerifiedAt: Date | null;
    roleId: string;
    role: { slug: string };
  }): UserWithRole {
    return {
      ...this.mapToUser(r),
      role: r.role,
    };
  }
}
