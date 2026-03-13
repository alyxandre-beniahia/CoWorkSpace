import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';

export type CreateTestUserOverrides = {
  email?: string;
  firstname?: string;
  lastname?: string;
  password?: string;
  isActive?: boolean;
  roleSlug?: 'admin' | 'member';
};

export async function createTestUser(
  prisma: PrismaClient,
  overrides: CreateTestUserOverrides = {},
): Promise<{ user: { id: string; email: string }; plainPassword: string }> {
  const plainPassword = overrides.password ?? 'password123';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const role = await prisma.role.findUnique({
    where: { slug: overrides.roleSlug ?? 'member' },
    select: { id: true },
  });
  if (!role) {
    throw new Error(`Rôle ${overrides.roleSlug ?? 'member'} introuvable. Exécutez le seed.`);
  }

  const email = overrides.email ?? `it-${Date.now()}-${randomBytes(4).toString('hex')}@test.com`;
  const user = await prisma.user.create({
    data: {
      firstname: overrides.firstname ?? 'Test',
      lastname: overrides.lastname ?? 'User',
      email,
      password: hashedPassword,
      isActive: overrides.isActive ?? true,
      roleId: role.id,
      approvedAt: new Date(),
    },
    select: { id: true, email: true },
  });

  return { user, plainPassword };
}

export async function createEmailVerificationToken(
  prisma: PrismaClient,
  userId: string,
): Promise<string> {
  const token = randomBytes(32).toString('hex');
  await prisma.userToken.create({
    data: {
      type: 'EMAIL_VERIFICATION',
      token,
      userId,
    },
  });
  return token;
}

export async function createPasswordResetToken(
  prisma: PrismaClient,
  userId: string,
): Promise<string> {
  const token = randomBytes(32).toString('hex');
  await prisma.userToken.create({
    data: {
      type: 'PASSWORD_RESET',
      token,
      userId,
    },
  });
  return token;
}
