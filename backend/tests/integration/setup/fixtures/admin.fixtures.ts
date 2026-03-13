import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';
import type { SpaceType } from '@prisma/client';

export type CreateTestSpaceOverrides = {
  name?: string;
  code?: string;
  type?: SpaceType;
  capacity?: number;
  description?: string | null;
  positionX?: number | null;
  positionY?: number | null;
};

/**
 * Crée un membre en attente de validation (emailVerifiedAt défini, approvedAt null).
 */
export async function createPendingMember(
  prisma: PrismaClient,
): Promise<{ user: { id: string; email: string } }> {
  const role = await prisma.role.findUnique({
    where: { slug: 'member' },
    select: { id: true },
  });
  if (!role) {
    throw new Error('Rôle member introuvable. Exécutez le seed.');
  }

  const hashedPassword = await bcrypt.hash('password123', 10);
  const email = `it-pending-${Date.now()}-${randomBytes(4).toString('hex')}@test.com`;

  const user = await prisma.user.create({
    data: {
      firstname: 'Pending',
      lastname: 'Member',
      email,
      password: hashedPassword,
      isActive: false,
      roleId: role.id,
      emailVerifiedAt: new Date(),
      approvedAt: null,
    },
    select: { id: true, email: true },
  });

  return { user };
}

/**
 * Crée un membre avec email non vérifié (emailVerifiedAt null).
 * Utilisé pour tester que valider retourne 403.
 */
export async function createMemberUnverified(
  prisma: PrismaClient,
): Promise<{ user: { id: string; email: string } }> {
  const role = await prisma.role.findUnique({
    where: { slug: 'member' },
    select: { id: true },
  });
  if (!role) {
    throw new Error('Rôle member introuvable. Exécutez le seed.');
  }

  const hashedPassword = await bcrypt.hash('password123', 10);
  const email = `it-unverified-${Date.now()}-${randomBytes(4).toString('hex')}@test.com`;

  const user = await prisma.user.create({
    data: {
      firstname: 'Unverified',
      lastname: 'Member',
      email,
      password: hashedPassword,
      isActive: false,
      roleId: role.id,
      emailVerifiedAt: null,
      approvedAt: null,
    },
    select: { id: true, email: true },
  });

  return { user };
}

/**
 * Crée un espace de test avec code IT-{timestamp} pour éviter les conflits.
 */
export async function createTestSpace(
  prisma: PrismaClient,
  overrides: CreateTestSpaceOverrides = {},
): Promise<{ space: { id: string; code: string | null } }> {
  const code = overrides.code ?? `IT-${Date.now()}-${randomBytes(4).toString('hex')}`;
  const space = await prisma.space.create({
    data: {
      name: overrides.name ?? 'Espace test',
      code,
      type: overrides.type ?? 'MEETING_ROOM',
      capacity: overrides.capacity ?? 6,
      description: overrides.description ?? null,
      positionX: overrides.positionX ?? null,
      positionY: overrides.positionY ?? null,
    },
    select: { id: true, code: true },
  });
  return { space };
}

/**
 * Crée un équipement de test avec name it-{name ou timestamp}.
 */
export async function createTestEquipement(
  prisma: PrismaClient,
  name?: string,
): Promise<{ equipement: { id: string; name: string } }> {
  const equipementName = name ?? `it-${Date.now()}-${randomBytes(4).toString('hex')}`;
  const equipement = await prisma.equipement.create({
    data: { name: equipementName },
    select: { id: true, name: true },
  });
  return { equipement };
}
